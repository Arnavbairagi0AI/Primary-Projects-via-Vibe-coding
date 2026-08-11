package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "songs")
data class Song(
    @PrimaryKey val id: String,
    val title: String,
    val artist: String,
    val album: String,
    val durationMs: Long,
    val artworkUrl: String, // Can be local drawable reference or web URL
    val audioUrl: String,
    val isDownloaded: Boolean = false,
    val isLiked: Boolean = false,
    val category: String = "Popular",
    val isHighQuality: Boolean = true,
    val spotifyTrackUri: String? = null
)
