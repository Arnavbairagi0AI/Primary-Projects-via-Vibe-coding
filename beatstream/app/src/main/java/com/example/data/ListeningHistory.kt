package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "listening_history")
data class ListeningHistory(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val songId: String,
    val timestamp: Long = System.currentTimeMillis(),
    val playDurationMs: Long = 0,
    val source: String = "user_play"
)
