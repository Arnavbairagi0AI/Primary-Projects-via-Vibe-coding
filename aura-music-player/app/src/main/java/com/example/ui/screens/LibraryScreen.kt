package com.example.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.data.model.Song
import com.example.data.repository.MusicRepository
import com.example.playback.AudioPlayerManager
import com.example.playback.YouTubeDownloader
import androidx.compose.ui.text.style.TextOverflow
import com.example.ui.theme.ThemeTokens
import com.example.ui.components.WaveformEmptyState
import kotlinx.coroutines.launch

@Composable
fun LibraryScreen(navController: NavController, repository: MusicRepository) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var searchQuery by remember { mutableStateOf("") }
    var isGridView by remember { mutableStateOf(false) }
    val sortBy = ThemeConfig.librarySortOrder.value
    var isScanning by remember { mutableStateOf(false) }

    // URL Import States
    var showImportUrlDialog by remember { mutableStateOf(false) }
    var importUrlInput by remember { mutableStateOf("") }
    var isImportLoading by remember { mutableStateOf(false) }
    var isImportSaving by remember { mutableStateOf(false) }
    var importDownloadProgress by remember { mutableStateOf(-1f) }
    var importMetadata by remember { mutableStateOf<Pair<String, String>?>(null) }
    var importErrorMessage by remember { mutableStateOf<String?>(null) }

    val isImportUrlValid = remember(importUrlInput) {
        YouTubeDownloader.isValidYouTubeUrl(importUrlInput)
    }

    val songs by repository.allSongs.collectAsState(initial = emptyList())

    // Define permission list based on API version
    val audioPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Manifest.permission.READ_MEDIA_AUDIO
    } else {
        Manifest.permission.READ_EXTERNAL_STORAGE
    }

    // Permission request launcher
    val requestPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            coroutineScope.launch {
                isScanning = true
                repository.scanLocalMedia()
                isScanning = false
                Toast.makeText(context, "Scanning complete!", Toast.LENGTH_SHORT).show()
            }
        } else {
            Toast.makeText(context, "Permission denied. Unable to scan storage.", Toast.LENGTH_LONG).show()
        }
    }

    val triggerScan: () -> Unit = {
        val checkVal = ContextCompat.checkSelfPermission(context, audioPermission)
        if (checkVal == PackageManager.PERMISSION_GRANTED) {
            coroutineScope.launch {
                isScanning = true
                repository.scanLocalMedia()
                isScanning = false
                Toast.makeText(context, "Scanning complete!", Toast.LENGTH_SHORT).show()
            }
        } else {
            requestPermissionLauncher.launch(audioPermission)
        }
    }

    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenMultipleDocuments()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            coroutineScope.launch {
                isScanning = true
                var importCount = 0
                uris.forEach { uri ->
                    val song = repository.importAudioFile(uri)
                    if (song != null) {
                        importCount++
                    }
                }
                isScanning = false
                if (importCount > 0) {
                    Toast.makeText(context, "Successfully imported $importCount songs!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(context, "Failed to import files.", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // Filtered & sorted songs
    val filteredSongs = remember(songs, searchQuery, sortBy) {
        songs.filter {
            it.title.contains(searchQuery, ignoreCase = true) ||
            it.artist.contains(searchQuery, ignoreCase = true) ||
            it.album.contains(searchQuery, ignoreCase = true)
        }.sortedWith { song1, song2 ->
            when (sortBy) {
                "Alphabetical" -> song1.title.compareTo(song2.title, ignoreCase = true)
                "Date Added" -> song2.dateAdded.compareTo(song1.dateAdded) // Descending date
                "File Size" -> {
                    val s1 = try { java.io.File(song1.path).length() } catch (e: Exception) { 0L }
                    val s2 = try { java.io.File(song2.path).length() } catch (e: Exception) { 0L }
                    s2.compareTo(s1)
                }
                else -> song1.title.compareTo(song2.title, ignoreCase = true)
            }
        }
    }

    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.baseBackground)
    ) {
        // Top search bar + action row
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = spacing.medium, vertical = spacing.small)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "My Music Library",
                    style = typography.displayHeader,
                    color = colors.textPrimary,
                    modifier = Modifier.weight(1f)
                )
                
                // Import from URL Button
                IconButton(
                    onClick = {
                        importUrlInput = ""
                        importMetadata = null
                        importErrorMessage = null
                        importDownloadProgress = -1f
                        showImportUrlDialog = true
                    },
                    modifier = Modifier.background(colors.primaryAccent.copy(alpha = 0.15f), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Filled.CloudDownload,
                        contentDescription = "Import from URL",
                        tint = colors.primaryAccent
                    )
                }
                
                Spacer(modifier = Modifier.width(spacing.small))

                // Scan Storage Button
                IconButton(
                    onClick = triggerScan,
                    modifier = Modifier.background(colors.primaryAccent.copy(alpha = 0.15f), CircleShape)
                ) {
                    if (isScanning) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), color = colors.primaryAccent, strokeWidth = 2.dp)
                    } else {
                        Icon(Icons.Filled.Refresh, contentDescription = "Scan Storage", tint = colors.primaryAccent)
                    }
                }
            }
            Spacer(modifier = Modifier.height(spacing.small))

            // Search text field
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search title, artist, or album...", style = typography.bodyText, color = colors.textSecondary) },
                leadingIcon = { Icon(Icons.Filled.Search, contentDescription = "Search", tint = colors.textSecondary) },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = colors.textPrimary,
                    unfocusedTextColor = colors.textPrimary,
                    focusedBorderColor = colors.primaryAccent,
                    unfocusedBorderColor = colors.border,
                    focusedLabelColor = colors.primaryAccent,
                    unfocusedLabelColor = colors.textSecondary
                )
            )

            Spacer(modifier = Modifier.height(spacing.small))

            // Sort & view toggles
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Sort by: ", style = typography.bodyText, color = colors.textSecondary)
                    Spacer(modifier = Modifier.width(6.dp))
                    Box {
                        var expanded by remember { mutableStateOf(false) }
                        Text(
                            text = "$sortBy ▼",
                            color = colors.primaryAccent,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            modifier = Modifier.clickable { expanded = true }
                        )
                        DropdownMenu(
                            expanded = expanded,
                            onDismissRequest = { expanded = false },
                            modifier = Modifier.background(colors.elevatedSurface2)
                        ) {
                            listOf("Alphabetical", "Date Added", "File Size").forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option, color = colors.textPrimary) },
                                    onClick = {
                                        ThemeConfig.librarySortOrder.value = option
                                        ThemeConfig.save()
                                        expanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                Row {
                    IconButton(onClick = { isGridView = !isGridView }) {
                        Icon(
                            imageVector = if (isGridView) Icons.AutoMirrored.Filled.List else Icons.Filled.GridView,
                            contentDescription = "Toggle Grid/List",
                            tint = colors.textSecondary
                        )
                    }
                }
            }
        }

        // Library content
        if (filteredSongs.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                WaveformEmptyState(
                    title = "No local music found",
                    subtitle = "Import music to get started, or scan your device for audio files.",
                    modifier = Modifier.padding(spacing.medium),
                    actionButton = {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(spacing.small)
                        ) {
                            Button(
                                onClick = triggerScan,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.primaryAccent,
                                    contentColor = colors.accentOnPrimary
                                ),
                                shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius)
                            ) {
                                if (isScanning) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = colors.accentOnPrimary, strokeWidth = 2.dp)
                                    Spacer(modifier = Modifier.width(spacing.small))
                                    Text("Scanning...", style = typography.labelText)
                                } else {
                                    Icon(Icons.Filled.Refresh, contentDescription = "Scan Storage", modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(spacing.small))
                                    Text("Scan Storage", style = typography.labelText)
                                }
                            }

                            Button(
                                onClick = { filePickerLauncher.launch(arrayOf("audio/*")) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.primaryAccent,
                                    contentColor = colors.accentOnPrimary
                                ),
                                shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius)
                            ) {
                                Icon(Icons.Filled.FileUpload, contentDescription = "Import Audio", modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(spacing.small))
                                Text("Import Audio", style = typography.labelText)
                            }

                            Button(
                                onClick = {
                                    coroutineScope.launch {
                                        isScanning = true
                                        repository.scanLocalMedia()
                                        isScanning = false
                                        Toast.makeText(context, "Library refreshed!", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.elevatedSurface1,
                                    contentColor = colors.textPrimary
                                ),
                                shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                                border = BorderStroke(1.dp, colors.border)
                            ) {
                                Icon(Icons.Filled.Sync, contentDescription = "Refresh Library", modifier = Modifier.size(18.dp), tint = colors.textPrimary)
                                Spacer(modifier = Modifier.width(spacing.small))
                                Text("Refresh Library", style = typography.labelText, color = colors.textPrimary)
                            }
                        }
                    }
                )
            }
        } else {
            if (isGridView) {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentPadding = PaddingValues(spacing.medium),
                    horizontalArrangement = Arrangement.spacedBy(spacing.medium),
                    verticalArrangement = Arrangement.spacedBy(spacing.medium)
                ) {
                    items(filteredSongs) { song ->
                        GridTrackItem(song = song) {
                            AudioPlayerManager.playSong(context, song, filteredSongs)
                            navController.navigate("player")
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentPadding = PaddingValues(horizontal = spacing.medium, vertical = spacing.small)
                ) {
                    items(filteredSongs) { song ->
                        ListTrackItem(song = song, onFavoriteToggle = {
                            coroutineScope.launch {
                                repository.updateSongFavorite(song.id, !song.isFavorite)
                            }
                        }) {
                            AudioPlayerManager.playSong(context, song, filteredSongs)
                            navController.navigate("player")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ListTrackItem(song: Song, onFavoriteToggle: () -> Unit, onClick: () -> Unit) {
    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = spacing.small),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (song.albumArtUri != null) {
            AsyncImage(
                model = song.albumArtUri,
                contentDescription = song.title,
                modifier = Modifier
                    .size(50.dp)
                    .clip(RoundedCornerShape(ThemeTokens.shapes.cardRadius)),
                contentScale = ContentScale.Crop
            )
        } else {
            com.example.ui.components.FallbackAlbumArt(
                modifier = Modifier
                    .size(50.dp)
                    .clip(RoundedCornerShape(ThemeTokens.shapes.cardRadius)),
                iconSize = 22.dp
            )
        }
        Spacer(modifier = Modifier.width(spacing.medium))
        Column(modifier = Modifier.weight(1f)) {
            Text(song.title, style = typography.bodyMedium, color = colors.textPrimary, maxLines = 1)
            Text("${song.artist} • ${song.album}", style = typography.bodyText, color = colors.textSecondary, maxLines = 1)
        }
        Text(song.durationText, style = typography.numeralTabular, color = colors.textSecondary, modifier = Modifier.padding(horizontal = spacing.small))
        IconButton(onClick = onFavoriteToggle) {
            Icon(
                imageVector = if (song.isFavorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                contentDescription = "Toggle Favorite",
                tint = if (song.isFavorite) colors.error else colors.textSecondary
            )
        }
    }
}

@Composable
fun GridTrackItem(song: Song, onClick: () -> Unit) {
    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    Card(
        shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
        colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
        border = BorderStroke(1.dp, colors.border),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Column(modifier = Modifier.padding(spacing.small)) {
            if (song.albumArtUri != null) {
                AsyncImage(
                    model = song.albumArtUri,
                    contentDescription = song.title,
                    modifier = Modifier
                        .aspectRatio(1f)
                        .clip(RoundedCornerShape(ThemeTokens.shapes.cardRadius - 4.dp)),
                    contentScale = ContentScale.Crop
                )
            } else {
                com.example.ui.components.FallbackAlbumArt(
                    modifier = Modifier
                        .aspectRatio(1f)
                        .clip(RoundedCornerShape(ThemeTokens.shapes.cardRadius - 4.dp)),
                    iconSize = 36.dp
                )
            }
            Spacer(modifier = Modifier.height(spacing.small))
            Text(song.title, style = typography.bodyMedium, color = colors.textPrimary, maxLines = 1)
            Text(song.artist, style = typography.bodyText, color = colors.textSecondary, maxLines = 1)
        }
    }
}
