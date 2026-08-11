package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "social_posts")
data class SocialPost(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val username: String,
    val avatarUrl: String,
    val message: String,
    val songId: String? = null,
    val likes: Int = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val isLikedByMe: Boolean = false
)
