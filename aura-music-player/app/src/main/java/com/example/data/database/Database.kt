package com.example.data.database

import androidx.room.*
import com.example.data.model.CustomFolder
import com.example.data.model.Playlist
import com.example.data.model.PlaylistSongCrossRef
import com.example.data.model.Song
import kotlinx.coroutines.flow.Flow

@Dao
interface SongDao {
    @Query("SELECT * FROM songs ORDER BY title ASC")
    fun getAllSongs(): Flow<List<Song>>

    @Query("SELECT * FROM songs WHERE id = :id")
    suspend fun getSongById(id: String): Song?

    @Query("SELECT * FROM songs WHERE isFavorite = 1 ORDER BY title ASC")
    fun getFavoriteSongs(): Flow<List<Song>>

    @Query("SELECT * FROM songs ORDER BY dateAdded DESC LIMIT 30")
    fun getRecentlyAddedSongs(): Flow<List<Song>>

    @Query("SELECT * FROM songs WHERE timesPlayed > 0 ORDER BY timesPlayed DESC, lastPlayed DESC LIMIT 30")
    fun getMostPlayedSongs(): Flow<List<Song>>

    @Query("SELECT * FROM songs ORDER BY lastPlayed DESC LIMIT 30")
    fun getRecentlyPlayedSongs(): Flow<List<Song>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSongs(songs: List<Song>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSong(song: Song)

    @Update
    suspend fun updateSong(song: Song)

    @Query("UPDATE songs SET isFavorite = :isFavorite WHERE id = :songId")
    suspend fun updateFavoriteStatus(songId: String, isFavorite: Boolean)

    @Query("UPDATE songs SET timesPlayed = timesPlayed + 1, lastPlayed = :lastPlayed WHERE id = :songId")
    suspend fun incrementPlayCount(songId: String, lastPlayed: Long = System.currentTimeMillis())

    @Query("DELETE FROM songs")
    suspend fun deleteAllSongs()
}

@Dao
interface PlaylistDao {
    @Query("SELECT * FROM playlists ORDER BY name ASC")
    fun getAllPlaylists(): Flow<List<Playlist>>

    @Query("SELECT * FROM playlists WHERE id = :id")
    suspend fun getPlaylistById(id: Int): Playlist?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlaylist(playlist: Playlist): Long

    @Delete
    suspend fun deletePlaylist(playlist: Playlist)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertSongToPlaylist(crossRef: PlaylistSongCrossRef)

    @Query("DELETE FROM playlist_song_cross_ref WHERE playlistId = :playlistId AND songId = :songId")
    suspend fun removeSongFromPlaylist(playlistId: Int, songId: String)

    @Query("""
        SELECT s.* FROM songs s 
        INNER JOIN playlist_song_cross_ref r ON s.id = r.songId 
        WHERE r.playlistId = :playlistId 
        ORDER BY s.title ASC
    """)
    fun getSongsForPlaylist(playlistId: Int): Flow<List<Song>>
}

@Dao
interface CustomFolderDao {
    @Query("SELECT * FROM custom_folders ORDER BY displayName ASC")
    fun getAllCustomFolders(): Flow<List<CustomFolder>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCustomFolder(folder: CustomFolder)

    @Query("DELETE FROM custom_folders WHERE id = :folderId")
    suspend fun deleteCustomFolder(folderId: Int)
}

@Database(
    entities = [Song::class, Playlist::class, PlaylistSongCrossRef::class, CustomFolder::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun songDao(): SongDao
    abstract fun playlistDao(): PlaylistDao
    abstract fun customFolderDao(): CustomFolderDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: android.content.Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "aura_music_player_db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
