package com.example.ui.screens

import android.content.Context

object LyricsCacheManager {
    private const val PREFS_NAME = "lyrics_offline_cache"

    fun cacheLyrics(context: Context, artist: String, title: String, lines: List<PremiumLyricLine>) {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val serialized = serialize(lines)
        prefs.edit().putString("$artist - $title", serialized).apply()
    }

    fun getCachedLyrics(context: Context, artist: String, title: String): List<PremiumLyricLine>? {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val serialized = prefs.getString("$artist - $title", null) ?: return null
        return deserialize(serialized)
    }

    fun getAllCachedSongs(context: Context): List<Pair<String, Int>> {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val allEntries = prefs.all
        return allEntries.map { (key, value) ->
            val sizeBytes = (value as? String)?.length ?: 0
            key to sizeBytes
        }
    }

    fun deleteCacheForSong(context: Context, songKey: String) {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().remove(songKey).apply()
    }

    fun clearAllCache(context: Context) {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
    }

    private fun serialize(lines: List<PremiumLyricLine>): String {
        return lines.joinToString(separator = "##LINE##") { line ->
            val mapStr = line.textMap.entries.joinToString(separator = "##MAP##") { (lang, text) ->
                "$lang##KV##$text"
            }
            "${line.timeMs}##TIME##$mapStr"
        }
    }

    private fun deserialize(serialized: String): List<PremiumLyricLine> {
        if (serialized.isEmpty()) return emptyList()
        return try {
            serialized.split("##LINE##").map { lineStr ->
                val parts = lineStr.split("##TIME##")
                val timeMs = parts[0].toLong()
                val mapParts = parts[1].split("##MAP##")
                val textMap = mapParts.associate { mapStr ->
                    val kv = mapStr.split("##KV##")
                    kv[0] to kv.getOrElse(1) { "" }
                }
                PremiumLyricLine(timeMs, textMap)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
}
