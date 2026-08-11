package com.example.data.repository

import android.content.ContentResolver
import android.content.Context
import android.provider.MediaStore
import android.util.Log
import com.example.data.database.AppDatabase
import com.example.data.model.CustomFolder
import com.example.data.model.Playlist
import com.example.data.model.PlaylistSongCrossRef
import com.example.data.model.Song
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import java.io.File

class MusicRepository(private val context: Context) {
    private val database = AppDatabase.getDatabase(context)
    private val songDao = database.songDao()
    private val playlistDao = database.playlistDao()
    private val customFolderDao = database.customFolderDao()
    // Expose flows
    val allSongs: Flow<List<Song>> = songDao.getAllSongs()
    val favoriteSongs: Flow<List<Song>> = songDao.getFavoriteSongs()
    val recentlyAddedSongs: Flow<List<Song>> = combine(songDao.getRecentlyAddedSongs(), songDao.getAllSongs()) { recent, all ->
        if (all.size >= 5) recent else emptyList()
    }
    val mostPlayedSongs: Flow<List<Song>> = combine(songDao.getMostPlayedSongs(), songDao.getAllSongs()) { most, all ->
        if (all.size >= 5) most else emptyList()
    }
    val recentlyPlayedSongs: Flow<List<Song>> = songDao.getRecentlyPlayedSongs()
    val allPlaylists: Flow<List<Playlist>> = playlistDao.getAllPlaylists()
    val allCustomFolders: Flow<List<CustomFolder>> = customFolderDao.getAllCustomFolders()

    init {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val playlists = playlistDao.getAllPlaylists().first()
                if (!playlists.any { it.isSmart && it.smartType == "FAVORITES" }) {
                    playlistDao.insertPlaylist(Playlist(name = "Favorites", isSmart = true, smartType = "FAVORITES"))
                }
                if (!playlists.any { it.isSmart && it.smartType == "MOST_PLAYED" }) {
                    playlistDao.insertPlaylist(Playlist(name = "Most Played", isSmart = true, smartType = "MOST_PLAYED"))
                }
                if (!playlists.any { it.isSmart && it.smartType == "RECENTLY_ADDED" }) {
                    playlistDao.insertPlaylist(Playlist(name = "Recently Added", isSmart = true, smartType = "RECENTLY_ADDED"))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error initializing default smart playlists: ", e)
            }
        }
    }

    companion object {
        private const val TAG = "MusicRepository"
    }

    suspend fun scanLocalMedia(specificFolders: List<String> = emptyList()) {
        withContext(Dispatchers.IO) {
            Log.d(TAG, "Scanning local media...")
            val scannedSongs = mutableListOf<Song>()
            val contentResolver: ContentResolver = context.contentResolver
            val uri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
            
            val selection = "${MediaStore.Audio.Media.IS_MUSIC} != 0"
            val projection = arrayOf(
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.DATA
            )

            try {
                contentResolver.query(uri, projection, selection, null, null)?.use { cursor ->
                    val idCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID)
                    val titleCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)
                    val artistCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)
                    val albumCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)
                    val durationCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)
                    val dataCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA)

                    while (cursor.moveToNext()) {
                        val id = cursor.getLong(idCol).toString()
                        val title = cursor.getString(titleCol) ?: "Unknown Song"
                        val artist = cursor.getString(artistCol) ?: "Unknown Artist"
                        val album = cursor.getString(albumCol) ?: "Unknown Album"
                        val duration = cursor.getLong(durationCol)
                        val path = cursor.getString(dataCol) ?: ""
                        val songUri = "${MediaStore.Audio.Media.EXTERNAL_CONTENT_URI}/$id"

                        // Extract category tag from path/parent folder
                        val parentFolder = File(path).parentFile?.name ?: ""
                        val tags = if (parentFolder.isNotEmpty() && parentFolder != "Music") {
                            parentFolder
                        } else {
                            "Local"
                        }

                        // Filter by specific folders if provided
                        if (specificFolders.isEmpty() || specificFolders.any { path.contains(it) }) {
                            scannedSongs.add(
                                Song(
                                    id = id,
                                    title = title,
                                    artist = artist,
                                    album = album,
                                    duration = duration,
                                    uri = songUri,
                                    path = path,
                                    categoryTags = tags
                                )
                            )
                        }
                    }
                }
                
                if (scannedSongs.isNotEmpty()) {
                    songDao.insertSongs(scannedSongs)
                    Log.d(TAG, "Successfully scanned and inserted ${scannedSongs.size} songs from local storage.")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error scanning MediaStore: ", e)
            }
        }
    }

    suspend fun importAudioFile(uri: android.net.Uri): Song? {
        return withContext(Dispatchers.IO) {
            val contentResolver = context.contentResolver
            var fileName = "imported_${System.currentTimeMillis()}.mp3"
            try {
                contentResolver.query(uri, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                    if (cursor.moveToFirst()) {
                        val index = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                        if (index != -1) {
                            val name = cursor.getString(index)
                            if (!name.isNullOrEmpty()) {
                                fileName = name
                            }
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error resolving display name: ", e)
            }

            val importDir = File(context.filesDir, "imported_music")
            if (!importDir.exists()) {
                importDir.mkdirs()
            }
            val destFile = File(importDir, fileName)

            try {
                contentResolver.openInputStream(uri)?.use { inputStream ->
                    destFile.outputStream().use { outputStream ->
                        inputStream.copyTo(outputStream)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error copying imported file: ", e)
                return@withContext null
            }

            var title = fileName.substringBeforeLast(".")
            var artist = "Unknown Artist"
            var album = "Unknown Album"
            var duration = 0L

            val retriever = android.media.MediaMetadataRetriever()
            try {
                retriever.setDataSource(destFile.absolutePath)
                title = retriever.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_TITLE) ?: title
                artist = retriever.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_ARTIST) ?: artist
                album = retriever.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_ALBUM) ?: album
                val durationStr = retriever.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_DURATION)
                duration = durationStr?.toLongOrNull() ?: 0L
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing metadata: ", e)
            } finally {
                try {
                    retriever.release()
                } catch (e: Exception) {
                    // Ignore
                }
            }

            val songId = "imported_${System.currentTimeMillis()}_${java.util.UUID.randomUUID()}"
            val song = Song(
                id = songId,
                title = title,
                artist = artist,
                album = album,
                duration = duration,
                uri = android.net.Uri.fromFile(destFile).toString(),
                path = destFile.absolutePath,
                categoryTags = "Imported"
            )
            songDao.insertSong(song)
            song
        }
    }

    suspend fun getSongById(id: String): Song? = songDao.getSongById(id)

    suspend fun insertSong(song: Song) {
        withContext(Dispatchers.IO) {
            songDao.insertSong(song)
        }
    }

    suspend fun updateSongFavorite(songId: String, isFavorite: Boolean) {
        songDao.updateFavoriteStatus(songId, isFavorite)
    }

    suspend fun incrementPlayCount(songId: String) {
        songDao.incrementPlayCount(songId)
    }

    // Playlists
    suspend fun createPlaylist(name: String, isSmart: Boolean = false, smartType: String? = null): Long {
        val playlistId = playlistDao.insertPlaylist(Playlist(name = name, isSmart = isSmart, smartType = smartType))
        return playlistId
    }

    suspend fun deletePlaylist(playlist: Playlist) {
        playlistDao.deletePlaylist(playlist)
    }

    suspend fun addSongToPlaylist(playlistId: Int, songId: String) {
        playlistDao.insertSongToPlaylist(PlaylistSongCrossRef(playlistId, songId))
    }

    suspend fun removeSongFromPlaylist(playlistId: Int, songId: String) {
        playlistDao.removeSongFromPlaylist(playlistId, songId)
    }

    fun getSongsForPlaylist(playlistId: Int): Flow<List<Song>> {
        return playlistDao.getSongsForPlaylist(playlistId)
    }

    // Folders
    suspend fun addCustomFolder(path: String, name: String) {
        customFolderDao.insertCustomFolder(CustomFolder(path = path, displayName = name))
    }

    suspend fun deleteCustomFolder(id: Int) {
        customFolderDao.deleteCustomFolder(id)
    }


}
