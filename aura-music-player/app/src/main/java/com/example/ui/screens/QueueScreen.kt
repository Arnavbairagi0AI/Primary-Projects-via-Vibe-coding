package com.example.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import com.example.playback.AudioPlayerManager
import com.example.ui.theme.ThemeTokens
import com.example.ui.components.WaveformEmptyState

@Composable
fun QueueScreen(navController: NavController) {
    val context = LocalContext.current

    val currentSong by AudioPlayerManager.currentSong.collectAsState()
    val queue by AudioPlayerManager.queue.collectAsState()

    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.baseBackground)
    ) {
        // Top Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(spacing.medium),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { navController.navigateUp() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.textPrimary)
                }
                Spacer(modifier = Modifier.width(spacing.small))
                Column {
                    Text(
                        text = "Play Queue",
                        style = typography.displayHeader,
                        color = colors.textPrimary
                    )
                    Text(
                        text = "${queue.size} tracks total",
                        style = typography.labelText,
                        color = colors.textSecondary
                    )
                }
            }
            
            // Clear Queue Button
            TextButton(
                onClick = {
                    AudioPlayerManager.release()
                    Toast.makeText(context, "Queue cleared", Toast.LENGTH_SHORT).show()
                }
            ) {
                Text("Clear All", color = colors.error, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
            }
        }

        if (queue.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                WaveformEmptyState(
                    title = "Your play queue is empty",
                    subtitle = "Play any track from your library to start",
                    modifier = Modifier.padding(spacing.medium)
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentPadding = PaddingValues(horizontal = spacing.medium, vertical = spacing.small)
            ) {
                itemsIndexed(queue) { index, song ->
                    val isCurrent = song.id == currentSong?.id
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(ThemeTokens.shapes.cardRadius))
                            .background(if (isCurrent) colors.primaryAccent.copy(alpha = 0.15f) else Color.Transparent)
                            .clickable {
                                AudioPlayerManager.playSong(context, song, queue)
                            }
                            .padding(vertical = spacing.small, horizontal = spacing.extraSmall),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Play Icon or index
                        Box(
                            modifier = Modifier.size(36.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isCurrent) {
                                Icon(Icons.AutoMirrored.Filled.VolumeUp, contentDescription = "Playing", tint = colors.primaryAccent)
                            } else {
                                Text("${index + 1}", color = colors.textSecondary, style = typography.labelText)
                            }
                        }
                        
                        Spacer(modifier = Modifier.width(spacing.small))
                        
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = song.title,
                                color = if (isCurrent) colors.primaryAccent else colors.textPrimary,
                                style = typography.bodyMedium.copy(fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal),
                                maxLines = 1
                            )
                            Text(song.artist, color = colors.textSecondary, style = typography.labelText, maxLines = 1)
                        }

                        // Reorder Action Buttons
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Up Index Button
                            IconButton(
                                onClick = {
                                    if (index > 0) {
                                        val mutableQ = queue.toMutableList()
                                        val temp = mutableQ[index]
                                        mutableQ[index] = mutableQ[index - 1]
                                        mutableQ[index - 1] = temp
                                        AudioPlayerManager.setQueue(mutableQ)
                                    }
                                },
                                enabled = index > 0
                            ) {
                                Icon(Icons.Filled.ArrowUpward, contentDescription = "Move Up", tint = if (index > 0) colors.textSecondary else colors.border)
                            }

                            // Down Index Button
                            IconButton(
                                onClick = {
                                    if (index < queue.size - 1) {
                                        val mutableQ = queue.toMutableList()
                                        val temp = mutableQ[index]
                                        mutableQ[index] = mutableQ[index + 1]
                                        mutableQ[index + 1] = temp
                                        AudioPlayerManager.setQueue(mutableQ)
                                    }
                                },
                                enabled = index < queue.size - 1
                            ) {
                                Icon(Icons.Filled.ArrowDownward, contentDescription = "Move Down", tint = if (index < queue.size - 1) colors.textSecondary else colors.border)
                            }
                        }
                    }
                }
            }
        }
    }
}
