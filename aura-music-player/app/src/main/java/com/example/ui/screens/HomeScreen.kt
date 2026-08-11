package com.example.ui.screens

import android.Manifest
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
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.data.model.Playlist
import com.example.data.model.Song
import com.example.data.repository.MusicRepository
import com.example.playback.AudioPlayerManager
import com.example.ui.theme.ThemeTokens
import com.example.ui.components.WaveformEmptyState
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(navController: NavController, repository: MusicRepository) {
    val context = LocalContext.current
    val userName = "Music Listener"
    val coroutineScope = rememberCoroutineScope()

    val songs by repository.allSongs.collectAsState(initial = emptyList())
    val playlists by repository.allPlaylists.collectAsState(initial = emptyList())
    val favoriteSongs by repository.favoriteSongs.collectAsState(initial = emptyList())
    val recentlyPlayed by repository.recentlyPlayedSongs.collectAsState(initial = emptyList())
    val sleepTimeRemaining by AudioPlayerManager.sleepTimerRemaining.collectAsState()

    var isScanning by remember { mutableStateOf(false) }

    val audioPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Manifest.permission.READ_MEDIA_AUDIO
    } else {
        Manifest.permission.READ_EXTERNAL_STORAGE
    }

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

    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.baseBackground),
        contentPadding = PaddingValues(spacing.medium)
    ) {
        // Welcome Header
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(vertical = spacing.medium),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Good day,",
                        style = typography.bodyText,
                        color = colors.textSecondary
                    )
                    Text(
                        text = userName,
                        style = typography.displayHeader,
                        color = colors.textPrimary
                    )
                }
            }
        }

        // Quick Category Cards Grid
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = spacing.small),
                horizontalArrangement = Arrangement.spacedBy(spacing.medium)
            ) {
                CategoryShortcutCard(
                    title = "Favorites",
                    count = "${favoriteSongs.size} tracks",
                    icon = Icons.Filled.Favorite,
                    color = colors.error,
                    modifier = Modifier.weight(1f),
                    onClick = { navController.navigate("library") }
                )
                CategoryShortcutCard(
                    title = "Recent Play",
                    count = "${recentlyPlayed.size} tracks",
                    icon = Icons.Filled.History,
                    color = colors.primaryAccent,
                    modifier = Modifier.weight(1f),
                    onClick = { navController.navigate("library") }
                )
            }
        }

        // YouTube MP3 Link Player Feature Card
        item {
            Card(
                shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = spacing.small)
                    .clickable { navController.navigate("youtube_converter") },
                colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
                border = BorderStroke(1.dp, colors.primaryAccent.copy(alpha = 0.5f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.horizontalGradient(
                                listOf(
                                    colors.primaryAccent.copy(alpha = 0.12f),
                                    Color.Transparent
                                )
                            )
                        )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(spacing.medium),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(ThemeTokens.shapes.cardRadius))
                                .background(colors.primaryAccent.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Filled.SmartDisplay,
                                contentDescription = "YouTube Converter",
                                tint = colors.primaryAccent,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(spacing.medium))
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "YouTube MP3 Link Player",
                                    style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                    color = colors.textPrimary
                                )
                                Spacer(modifier = Modifier.width(spacing.extraSmall))
                                Box(
                                    modifier = Modifier
                                        .background(colors.primaryAccent, RoundedCornerShape(4.dp))
                                        .padding(horizontal = 4.dp, vertical = 1.dp)
                                ) {
                                    Text(
                                        text = "NEW",
                                        color = colors.accentOnPrimary,
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            Text(
                                text = "Stream or save YouTube videos directly as MP3 player tracks in your local library.",
                                style = typography.labelText,
                                color = colors.textSecondary,
                                maxLines = 2
                            )
                        }
                        Icon(
                            imageVector = Icons.Filled.ChevronRight,
                            contentDescription = "Open tool",
                            tint = colors.textSecondary
                        )
                    }
                }
            }
        }

        // Widgets (Sleep Timer, Equalizer status)
        item {
            Card(
                shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = spacing.small),
                colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
                border = BorderStroke(1.dp, colors.border)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(spacing.medium),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.Timer,
                            contentDescription = "Sleep timer",
                            tint = colors.primaryAccent
                        )
                        Spacer(modifier = Modifier.width(spacing.small))
                        Column {
                            Text("Active Sleep Timer", style = typography.bodyMedium, color = colors.textPrimary)
                            Text(
                                text = if (sleepTimeRemaining > 0) {
                                    val mins = sleepTimeRemaining / 60
                                    val secs = sleepTimeRemaining % 60
                                    String.format("Pausing in %02d:%02d", mins, secs)
                                } else {
                                    "Inactive"
                                },
                                style = typography.numeralTabular,
                                color = colors.textSecondary
                            )
                        }
                    }
                    Button(
                        onClick = { navController.navigate("equalizer") },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.primaryAccent,
                            contentColor = colors.accentOnPrimary
                        ),
                        shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius)
                    ) {
                        Icon(Icons.Filled.Tune, contentDescription = "FX", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(spacing.extraSmall))
                        Text("Equalizer", style = typography.labelText)
                    }
                }
            }
        }

        // Horizontal Recommended Carousel / Your Tracks
        item {
            Spacer(modifier = Modifier.height(spacing.medium))
            Text(
                text = if (songs.isEmpty()) "Discovered Tracks" else "Your Tracks",
                style = typography.songTitleLarge,
                color = colors.textPrimary,
                modifier = Modifier.padding(bottom = spacing.small)
            )
            if (songs.isEmpty()) {
                WaveformEmptyState(
                    title = "No music found",
                    subtitle = "Import music to get started, or scan your device for audio files.",
                    modifier = Modifier.fillMaxWidth().padding(vertical = spacing.medium),
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
            } else {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(spacing.medium),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(songs.take(5)) { song ->
                        FeaturedSongCard(song = song) {
                            AudioPlayerManager.playSong(context, song, songs)
                            navController.navigate("player")
                        }
                    }
                }
            }
        }

        // Playlists Section
        item {
            Spacer(modifier = Modifier.height(spacing.large))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = spacing.small),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "My Playlists",
                    style = typography.songTitleLarge,
                    color = colors.textPrimary
                )
                Text(
                    text = "View All",
                    style = typography.bodyMedium,
                    color = colors.primaryAccent,
                    modifier = Modifier.clickable { navController.navigate("library") }
                )
            }
        }

        if (playlists.isEmpty()) {
            item {
                WaveformEmptyState(
                    title = "No playlists found",
                    subtitle = "Create your first playlist in the Library.",
                    modifier = Modifier.padding(vertical = spacing.medium)
                )
            }
        } else {
            items(playlists) { playlist ->
                PlaylistItemRow(playlist = playlist) {
                    navController.navigate("playlist/${playlist.id}")
                }
            }
        }
    }
}

@Composable
fun CategoryShortcutCard(
    title: String,
    count: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    Card(
        shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
        colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
        border = BorderStroke(1.dp, colors.border),
        modifier = modifier.clickable { onClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(spacing.medium),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = title, tint = color)
            }
            Spacer(modifier = Modifier.width(spacing.small))
            Column {
                Text(title, style = typography.bodyMedium, color = colors.textPrimary)
                Text(count, style = typography.labelText, color = colors.textSecondary)
            }
        }
    }
}

@Composable
fun FeaturedSongCard(song: Song, onClick: () -> Unit) {
    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    Column(
        modifier = Modifier
            .width(140.dp)
            .clickable { onClick() }
    ) {
        Box(
            modifier = Modifier
                .size(140.dp)
                .clip(RoundedCornerShape(ThemeTokens.shapes.sheetRadius))
                .background(
                    Brush.linearGradient(
                        colors = listOf(colors.primaryAccent.copy(alpha = 0.5f), colors.primaryAccent)
                    )
                )
                .padding(1.5.dp)
                .clip(RoundedCornerShape(ThemeTokens.shapes.sheetRadius - 1.5.dp))
                .background(colors.elevatedSurface1)
        ) {
            if (song.albumArtUri != null) {
                AsyncImage(
                    model = song.albumArtUri,
                    contentDescription = song.title,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            } else {
                com.example.ui.components.FallbackAlbumArt(
                    modifier = Modifier.fillMaxSize(),
                    iconSize = 40.dp
                )
            }
            Box(
                modifier = Modifier
                    .padding(spacing.small)
                    .size(28.dp)
                    .align(Alignment.BottomEnd)
                    .clip(CircleShape)
                    .background(colors.primaryAccent),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.PlayArrow,
                    contentDescription = "Play",
                    tint = colors.accentOnPrimary,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
        Spacer(modifier = Modifier.height(spacing.small))
        Text(
            text = song.title,
            style = typography.songTitleMedium,
            color = colors.textPrimary,
            maxLines = 1
        )
        Text(
            text = song.artist,
            style = typography.bodyText,
            color = colors.textSecondary,
            maxLines = 1
        )
    }
}

@Composable
fun PlaylistItemRow(playlist: Playlist, onClick: () -> Unit) {
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
        Box(
            modifier = Modifier
                .size(50.dp)
                .clip(RoundedCornerShape(ThemeTokens.shapes.cardRadius))
                .background(
                    Brush.linearGradient(
                        colors = listOf(
                            colors.primaryAccent.copy(alpha = 0.4f),
                            colors.primaryAccent
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.AutoMirrored.Filled.QueueMusic, contentDescription = "Playlist", tint = colors.accentOnPrimary)
        }
        Spacer(modifier = Modifier.width(spacing.medium))
        Column(modifier = Modifier.weight(1f)) {
            Text(playlist.name, style = typography.bodyMedium, color = colors.textPrimary)
            Text(
                text = if (playlist.isSmart) "Smart Playlist" else "User Playlist",
                style = typography.labelText,
                color = colors.textSecondary
            )
        }
        Icon(Icons.Filled.ChevronRight, contentDescription = "Go", tint = colors.textSecondary)
    }
}
