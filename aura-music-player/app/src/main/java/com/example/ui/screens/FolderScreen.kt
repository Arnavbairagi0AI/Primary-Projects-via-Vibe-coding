package com.example.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.data.model.CustomFolder
import com.example.data.model.Song
import com.example.data.repository.MusicRepository
import com.example.playback.AudioPlayerManager
import com.example.ui.theme.ThemeTokens
import kotlinx.coroutines.launch
import java.io.File

@Composable
fun FolderScreen(navController: NavController, repository: MusicRepository) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    val songs by repository.allSongs.collectAsState(initial = emptyList())
    val customFolders by repository.allCustomFolders.collectAsState(initial = emptyList())

    var showAddDialog by remember { mutableStateOf(false) }
    var folderPathInput by remember { mutableStateOf("") }
    var folderNameInput by remember { mutableStateOf("") }

    var selectedFolderSongs by remember { mutableStateOf<List<Song>>(emptyList()) }
    var activeBrowseFolderName by remember { mutableStateOf<String?>(null) }

    // Map songs by their parent folders
    val folderMap = remember(songs) {
        songs.groupBy {
            val file = File(it.path)
            file.parentFile?.absolutePath ?: "Internal Storage"
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
        // Dynamic Header depending on whether browsing inside a folder or not
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(spacing.medium),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (activeBrowseFolderName != null) {
                    IconButton(onClick = { activeBrowseFolderName = null }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.textPrimary)
                    }
                }
                Spacer(modifier = Modifier.width(spacing.small))
                Column {
                    Text(
                        text = activeBrowseFolderName ?: "Folder Browser",
                        style = typography.displayHeader,
                        color = colors.textPrimary
                    )
                    Text(
                        text = if (activeBrowseFolderName != null) "${selectedFolderSongs.size} tracks" else "${folderMap.keys.size} physical folders found",
                        style = typography.labelText,
                        color = colors.textSecondary
                    )
                }
            }
            
            if (activeBrowseFolderName == null) {
                IconButton(
                    onClick = { showAddDialog = true },
                    modifier = Modifier.background(colors.primaryAccent.copy(alpha = 0.15f), CircleShape)
                ) {
                    Icon(Icons.Filled.CreateNewFolder, contentDescription = "Add Folder Bookmark", tint = colors.primaryAccent)
                }
            }
        }

        if (activeBrowseFolderName != null) {
            // Display songs inside active browsed folder
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentPadding = PaddingValues(horizontal = spacing.medium, vertical = spacing.small)
            ) {
                items(selectedFolderSongs) { song ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                AudioPlayerManager.playSong(context, song, selectedFolderSongs)
                                navController.navigate("player")
                            }
                            .padding(vertical = spacing.small),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(ThemeTokens.shapes.cardRadius))
                                .background(colors.elevatedSurface1),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.MusicNote, contentDescription = "Music", tint = colors.primaryAccent)
                        }
                        Spacer(modifier = Modifier.width(spacing.medium))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(song.title, color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold), maxLines = 1)
                            Text(song.artist, color = colors.textSecondary, style = typography.labelText, maxLines = 1)
                        }
                        Text(song.durationText, color = colors.textSecondary, style = typography.numeralTabular)
                    }
                }
            }
        } else {
            // Folders List View
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentPadding = PaddingValues(horizontal = spacing.medium, vertical = spacing.small)
            ) {
                // Bookmarked Custom Folders Header
                if (customFolders.isNotEmpty()) {
                    item {
                        Text(
                            text = "Bookmarked Folders",
                            style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = colors.primaryAccent,
                            modifier = Modifier.padding(vertical = spacing.medium)
                        )
                    }
                    items(customFolders) { custom ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    // Filter songs starting with custom.path
                                    val matchSongs = songs.filter { it.path.startsWith(custom.path) }
                                    selectedFolderSongs = matchSongs
                                    activeBrowseFolderName = custom.displayName
                                }
                                .padding(vertical = spacing.small),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Filled.FolderSpecial, contentDescription = "Folder", tint = colors.primaryAccent, modifier = Modifier.size(36.dp))
                            Spacer(modifier = Modifier.width(spacing.medium))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(custom.displayName, color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                Text(custom.path, color = colors.textSecondary, style = typography.labelText, maxLines = 1)
                            }
                            IconButton(onClick = {
                                coroutineScope.launch {
                                    repository.deleteCustomFolder(custom.id)
                                    Toast.makeText(context, "Bookmark deleted", Toast.LENGTH_SHORT).show()
                                }
                            }) {
                                Icon(Icons.Filled.Delete, contentDescription = "Delete", tint = colors.textSecondary)
                            }
                        }
                    }
                }

                // Auto-Scanned Storage Folders Header
                item {
                    Text(
                        text = "Scanned Media Directories",
                        style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = colors.textSecondary,
                        modifier = Modifier.padding(vertical = spacing.medium)
                    )
                }

                if (folderMap.isEmpty()) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().heightIn(min = 100.dp), contentAlignment = Alignment.Center) {
                            Text("No folders scanned yet.", color = colors.textSecondary, style = typography.bodyText)
                        }
                    }
                } else {
                    items(folderMap.keys.toList()) { folderPath ->
                        val parentFolderSongs = folderMap[folderPath] ?: emptyList()
                        val folderName = File(folderPath).name.ifEmpty { "Internal Storage" }
                        
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    selectedFolderSongs = parentFolderSongs
                                    activeBrowseFolderName = folderName
                                }
                                .padding(vertical = spacing.small),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Filled.Folder, contentDescription = "Folder", tint = colors.primaryAccent, modifier = Modifier.size(36.dp))
                            Spacer(modifier = Modifier.width(spacing.medium))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(folderName, color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                Text("${parentFolderSongs.size} songs • $folderPath", color = colors.textSecondary, style = typography.labelText, maxLines = 1)
                            }
                            Icon(Icons.Filled.ChevronRight, contentDescription = "Open", tint = colors.textSecondary)
                        }
                    }
                }
            }
        }

        // Add Bookmark Folder Dialog
        if (showAddDialog) {
            AlertDialog(
                onDismissRequest = { showAddDialog = false },
                title = { Text("Add Custom Folder Bookmark", color = colors.textPrimary) },
                text = {
                    Column {
                        OutlinedTextField(
                            value = folderNameInput,
                            onValueChange = { folderNameInput = it },
                            label = { Text("Folder Name") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = colors.textPrimary,
                                unfocusedTextColor = colors.textPrimary,
                                focusedBorderColor = colors.primaryAccent,
                                unfocusedBorderColor = colors.border,
                                focusedLabelColor = colors.primaryAccent,
                                unfocusedLabelColor = colors.textSecondary
                            )
                        )
                        Spacer(modifier = Modifier.height(spacing.medium))
                        OutlinedTextField(
                            value = folderPathInput,
                            onValueChange = { folderPathInput = it },
                            label = { Text("Storage Path") },
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = { Text("/storage/emulated/0/Music/Chill", color = colors.textMuted) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = colors.textPrimary,
                                unfocusedTextColor = colors.textPrimary,
                                focusedBorderColor = colors.primaryAccent,
                                unfocusedBorderColor = colors.border,
                                focusedLabelColor = colors.primaryAccent,
                                unfocusedLabelColor = colors.textSecondary
                            )
                        )
                    }
                },
                confirmButton = {
                    TextButton(onClick = {
                        if (folderNameInput.isBlank() || folderPathInput.isBlank()) {
                            Toast.makeText(context, "Fill in all parameters", Toast.LENGTH_SHORT).show()
                            return@TextButton
                        }
                        coroutineScope.launch {
                            repository.addCustomFolder(folderPathInput, folderNameInput)
                            showAddDialog = false
                            folderNameInput = ""
                            folderPathInput = ""
                            Toast.makeText(context, "Bookmark created!", Toast.LENGTH_SHORT).show()
                        }
                    }) {
                        Text("Add", color = colors.primaryAccent)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showAddDialog = false }) {
                        Text("Cancel", color = colors.textSecondary)
                    }
                },
                containerColor = colors.elevatedSurface1,
                titleContentColor = colors.textPrimary,
                textContentColor = colors.textPrimary
            )
        }
    }
}
