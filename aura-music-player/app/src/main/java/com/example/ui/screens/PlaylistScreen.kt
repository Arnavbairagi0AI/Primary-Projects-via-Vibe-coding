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
import com.example.data.model.Playlist
import com.example.data.model.Song
import com.example.data.repository.MusicRepository
import com.example.playback.AudioPlayerManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@Composable
fun PlaylistScreen(navController: NavController, repository: MusicRepository, playlistId: Int) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var playlist by remember { mutableStateOf<Playlist?>(null) }
    var showAddDialog by remember { mutableStateOf(false) }

    LaunchedEffect(playlistId) {
        playlist = repository.allPlaylists.first().find { it.id == playlistId }
    }

    val playlistsSongs by remember(playlist, playlistId) {
        val currentPlaylist = playlist
        if (currentPlaylist != null && currentPlaylist.isSmart) {
            when (currentPlaylist.smartType) {
                "FAVORITES" -> repository.favoriteSongs
                "MOST_PLAYED" -> repository.mostPlayedSongs
                "RECENTLY_ADDED" -> repository.recentlyAddedSongs
                else -> repository.getSongsForPlaylist(playlistId)
            }
        } else {
            repository.getSongsForPlaylist(playlistId)
        }
    }.collectAsState(initial = emptyList())

    val allSongs by repository.allSongs.collectAsState(initial = emptyList())

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Top Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { navController.navigateUp() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onBackground)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text(
                        text = playlist?.name ?: "Loading Playlist...",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "${playlistsSongs.size} tracks",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            // Add Song Button
            if (playlist?.isSmart != true) {
                IconButton(
                    onClick = { showAddDialog = true },
                    modifier = Modifier.background(MaterialTheme.colorScheme.primaryContainer, CircleShape)
                ) {
                    Icon(Icons.Filled.Add, contentDescription = "Add Track", tint = MaterialTheme.colorScheme.onPrimaryContainer)
                }
            }
        }

        if (playlistsSongs.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(24.dp)
                ) {
                    Icon(Icons.AutoMirrored.Filled.QueueMusic, contentDescription = "Empty", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("This playlist has no tracks", color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    val descriptionText = if (playlist?.isSmart == true) {
                        if (playlist?.smartType == "FAVORITES") {
                            "Favorite some songs in the library to see them here."
                        } else {
                            "Smart playlists require at least 5 tracks in your library to start generating content automatically."
                        }
                    } else {
                        "Tap + above to add tracks to this playlist"
                    }
                    Text(
                        text = descriptionText,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 14.sp,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
            ) {
                items(playlistsSongs) { song ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                AudioPlayerManager.playSong(context, song, playlistsSongs)
                                navController.navigate("player")
                            }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.MusicNote, contentDescription = "Song", tint = MaterialTheme.colorScheme.primary)
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(song.title, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 15.sp, maxLines = 1)
                            Text(song.artist, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp, maxLines = 1)
                        }
                        if (playlist?.isSmart == true) {
                            if (playlist?.smartType == "FAVORITES") {
                                IconButton(onClick = {
                                    coroutineScope.launch {
                                        repository.updateSongFavorite(song.id, false)
                                        Toast.makeText(context, "Removed from Favorites", Toast.LENGTH_SHORT).show()
                                    }
                                }) {
                                    Icon(Icons.Filled.Favorite, contentDescription = "Unfavorite", tint = Color.Red)
                                }
                            }
                        } else {
                            IconButton(onClick = {
                                coroutineScope.launch {
                                    repository.removeSongFromPlaylist(playlistId, song.id)
                                    Toast.makeText(context, "Track removed from playlist", Toast.LENGTH_SHORT).show()
                                }
                            }) {
                                Icon(Icons.Filled.Delete, contentDescription = "Remove", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }

        // Add Song Dialog selection
        if (showAddDialog) {
            AlertDialog(
                onDismissRequest = { showAddDialog = false },
                title = { Text("Add Track to Playlist", color = MaterialTheme.colorScheme.onSurface) },
                text = {
                    Box(modifier = Modifier.heightIn(max = 280.dp)) {
                        val songsToAdd = allSongs.filter { s -> !playlistsSongs.any { it.id == s.id } }
                        if (songsToAdd.isEmpty()) {
                            Text("All tracks are already in this playlist.", color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(16.dp))
                        } else {
                            LazyColumn(modifier = Modifier.fillMaxSize()) {
                                items(songsToAdd) { song ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                coroutineScope.launch {
                                                    repository.addSongToPlaylist(playlistId, song.id)
                                                    showAddDialog = false
                                                    Toast.makeText(context, "Added successfully!", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                            .padding(vertical = 10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(Icons.Filled.MusicNote, contentDescription = "Add", tint = MaterialTheme.colorScheme.primary)
                                        Spacer(modifier = Modifier.width(12.dp))
                                        Column {
                                            Text(song.title, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold, fontSize = 14.sp, maxLines = 1)
                                            Text(song.artist, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp, maxLines = 1)
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showAddDialog = false }) {
                        Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                containerColor = MaterialTheme.colorScheme.surface,
                titleContentColor = MaterialTheme.colorScheme.onSurface,
                textContentColor = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}
