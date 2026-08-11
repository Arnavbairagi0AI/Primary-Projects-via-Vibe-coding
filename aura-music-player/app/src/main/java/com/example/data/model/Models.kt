package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "songs")
data class Song(
    @PrimaryKey val id: String,
    val title: String,
    val artist: String,
    val album: String,
    val duration: Long, // in milliseconds
    val uri: String,
    val path: String,
    val albumArtUri: String? = null,
    val categoryTags: String = "", // Comma-separated custom genres/tags
    val dateAdded: Long = System.currentTimeMillis(),
    val timesPlayed: Int = 0,
    val lastPlayed: Long = 0,
    val isFavorite: Boolean = false
) {
    val durationText: String
        get() {
            val seconds = (duration / 1000) % 60
            val minutes = (duration / (1000 * 60)) % 60
            val hours = (duration / (1000 * 60 * 60))
            return if (hours > 0) {
                String.format("%02d:%02d:%02d", hours, minutes, seconds)
            } else {
                String.format("%02d:%02d", minutes, seconds)
            }
        }
}

@Entity(tableName = "playlists")
data class Playlist(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val isSmart: Boolean = false,
    val smartType: String? = null, // "MOST_PLAYED", "RECENTLY_ADDED", "FAVORITES"
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "playlist_song_cross_ref", primaryKeys = ["playlistId", "songId"])
data class PlaylistSongCrossRef(
    val playlistId: Int,
    val songId: String
)

@Entity(tableName = "custom_folders")
data class CustomFolder(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val path: String,
    val displayName: String
)
