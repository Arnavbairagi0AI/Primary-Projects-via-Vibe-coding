package com.example.data

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MusicRepository(private val musicDao: MusicDao) {

    val allSongs: Flow<List<Song>> = musicDao.getAllSongs()
    val downloadedSongs: Flow<List<Song>> = musicDao.getDownloadedSongs()
    val likedSongs: Flow<List<Song>> = musicDao.getLikedSongs()
    val allPlaylists: Flow<List<Playlist>> = musicDao.getAllPlaylists()
    val allSocialPosts: Flow<List<SocialPost>> = musicDao.getAllSocialPosts()
    val recentHistory: Flow<List<ListeningHistory>> = musicDao.getRecentHistory(10)

    suspend fun getSongById(id: String): Song? = musicDao.getSongById(id)

    fun searchSongs(query: String): Flow<List<Song>> = musicDao.searchSongs(query)

    fun getSongsByCategory(category: String): Flow<List<Song>> = musicDao.getSongsByCategory(category)

    fun getPlaylistWithSongs(playlistId: Long): Flow<PlaylistWithSongs?> = musicDao.getPlaylistWithSongs(playlistId)

    suspend fun toggleLike(songId: String, isLiked: Boolean) {
        musicDao.updateLikedStatus(songId, isLiked)
    }

    // Real download simulation with non-blocking delay to show the "Downloading High Quality..." states in the UI
    suspend fun downloadSong(songId: String, onProgress: (Float) -> Unit) {
        // Step-by-step progress simulation
        for (i in 1..10) {
            delay(150)
            onProgress(i * 0.1f)
        }
        musicDao.updateDownloadedStatus(songId, true)
    }

    suspend fun deleteDownload(songId: String) {
        musicDao.updateDownloadedStatus(songId, false)
    }

    // Create a playlist and automatically trigger cloud sync across devices with a visual state loop
    suspend fun createPlaylist(name: String, description: String = ""): Long {
        val playlist = Playlist(name = name, description = description, isSynced = false)
        val id = musicDao.insertPlaylist(playlist)
        
        // Asynchronously sync across devices in background so UI updates immediately
        CoroutineScope(Dispatchers.IO).launch {
            delay(2000) // Simulated device sync time
            musicDao.updatePlaylistSyncStatus(id, true)
        }
        return id
    }

    suspend fun addSongToPlaylist(playlistId: Long, songId: String) {
        musicDao.insertPlaylistSongCrossRef(PlaylistSongCrossRef(playlistId, songId))
        triggerPlaylistSync(playlistId)
    }

    suspend fun removeSongFromPlaylist(playlistId: Long, songId: String) {
        musicDao.deletePlaylistSongCrossRef(playlistId, songId)
        triggerPlaylistSync(playlistId)
    }

    suspend fun deletePlaylist(playlistId: Long) {
        musicDao.deletePlaylist(playlistId)
    }

    private suspend fun triggerPlaylistSync(playlistId: Long) {
        musicDao.updatePlaylistSyncStatus(playlistId, false)
        CoroutineScope(Dispatchers.IO).launch {
            delay(1500) // Simulated cloud sync
            musicDao.updatePlaylistSyncStatus(playlistId, true)
        }
    }

    suspend fun logHistory(songId: String, durationPlayedMs: Long) {
        musicDao.insertHistoryEntry(
            ListeningHistory(songId = songId, playDurationMs = durationPlayedMs)
        )
    }

    suspend fun shareSongInFeed(songId: String, message: String, username: String = "You") {
        val post = SocialPost(
            username = username,
            avatarUrl = "avatar_user",
            message = message,
            songId = songId,
            likes = 0,
            isLikedByMe = false
        )
        musicDao.insertSocialPost(post)
    }

    suspend fun toggleLikePost(postId: Long, currentLikes: Int, isLiked: Boolean) {
        val newLikes = if (isLiked) currentLikes + 1 else (currentLikes - 1).coerceAtLeast(0)
        musicDao.updateSocialPostLike(postId, newLikes, isLiked)
    }

    // Fetches Gemini recommendation based on local user play counts
    suspend fun getGeminiRecommendations(): RecommendationResult {
        val songsList = allSongs.firstOrNull() ?: emptyList()
        val history = recentHistory.firstOrNull() ?: emptyList()

        if (songsList.isEmpty()) {
            return GeminiClient.getRecommendations("No history yet.", "No songs available.")
        }

        val historyText = if (history.isEmpty()) {
            "User hasn't played any songs yet. Just recommend popular ambient or energetic tracks."
        } else {
            history.joinToString(separator = "\n") { item ->
                val song = songsList.find { s -> s.id == item.songId }
                "Played song: '${song?.title ?: "Unknown"}' by '${song?.artist ?: "Unknown"}' (ID: ${item.songId}) at timestamp ${item.timestamp}"
            }
        }

        val availableSongsText = songsList.joinToString(separator = "\n") { song ->
            "Song ID: ${song.id}, Title: '${song.title}', Artist: '${song.artist}', Category: ${song.category}, Album: '${song.album}'"
        }

        return GeminiClient.getRecommendations(historyText, availableSongsText)
    }

    suspend fun getTopPlayedGenresAndArtists(limit: Int): Pair<List<String>, List<String>> {
        val topSongs = musicDao.getTopPlayedSongIds(limit)
        val genres = mutableListOf<String>()
        val artists = mutableListOf<String>()
        
        for (item in topSongs) {
            val song = musicDao.getSongById(item.songId)
            if (song != null) {
                if (!genres.contains(song.category)) {
                    genres.add(song.category)
                }
                if (!artists.contains(song.artist)) {
                    artists.add(song.artist)
                }
            }
        }
        
        // If we have no history, fallback to some defaults
        if (genres.isEmpty()) {
            genres.add("Pop")
            genres.add("Synthwave")
        }
        if (artists.isEmpty()) {
            artists.add("The Weeknd")
            artists.add("Lofi Study Club")
        }
        
        return Pair(genres, artists)
    }

    private fun mapCategoryToSpotifyGenre(category: String): String {
        return when (category.lowercase()) {
            "pop" -> "pop"
            "lo-fi", "lofi" -> "chill"
            "synthwave" -> "synthwave"
            "ambient" -> "ambient"
            "electronic" -> "electronic"
            "indie pop", "indie" -> "indie"
            "acoustic" -> "acoustic"
            "phonk" -> "dance"
            "hindi", "bollywood" -> "bollywood"
            "tamil", "telugu" -> "indian"
            else -> "pop"
        }
    }

    suspend fun generateAndSaveDailyMix(spotifyToken: String?): List<Song> {
        val (genres, artists) = getTopPlayedGenresAndArtists(5)
        val recommendedSongs = mutableListOf<Song>()
        
        if (!spotifyToken.isNullOrBlank()) {
            try {
                // Map top genres to Spotify genres
                val mappedGenres = genres.map { mapCategoryToSpotifyGenre(it) }.distinct().take(5).joinToString(",")
                
                val response = SpotifyClient.api.getRecommendations(
                    authHeader = "Bearer $spotifyToken",
                    seedGenres = mappedGenres,
                    seedArtists = null,
                    seedTracks = null,
                    limit = 10
                )
                
                for (track in response.tracks) {
                    val song = Song(
                        id = "spotify_rec_${track.id}",
                        title = track.name,
                        artist = track.artists.joinToString { it.name },
                        album = track.album.name,
                        durationMs = track.duration_ms,
                        artworkUrl = track.album.images?.firstOrNull()?.url ?: "spotify_link",
                        audioUrl = track.preview_url ?: "spotify_rec_stream",
                        category = genres.firstOrNull() ?: "Spotify Mix",
                        isHighQuality = true,
                        spotifyTrackUri = track.uri
                    )
                    musicDao.insertSong(song)
                    recommendedSongs.add(song)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                // If API call fails, fall back to simulated recommendations!
                recommendedSongs.addAll(getSimulatedDailyMixSongs(genres, artists))
            }
        } else {
            // Simulated Daily Mix
            recommendedSongs.addAll(getSimulatedDailyMixSongs(genres, artists))
        }
        
        // Save these to a "Daily Mix" playlist
        val existingPlaylist = musicDao.getAllPlaylists().firstOrNull()?.find { it.name == "Daily Mix" }
        val playlistId = if (existingPlaylist != null) {
            existingPlaylist.playlistId
        } else {
            musicDao.insertPlaylist(
                Playlist(
                    name = "Daily Mix",
                    description = "Personalized mix based on your top genres (${genres.joinToString()}) and artists (${artists.joinToString()}).",
                    isSynced = true
                )
            )
        }
        
        // Remove existing playlist content first if any
        musicDao.clearPlaylistSongs(playlistId)
        
        // Insert references
        for (song in recommendedSongs) {
            musicDao.insertPlaylistSongCrossRef(
                PlaylistSongCrossRef(playlistId = playlistId, songId = song.id)
            )
        }
        
        return recommendedSongs
    }

    private suspend fun getSimulatedDailyMixSongs(genres: List<String>, artists: List<String>): List<Song> {
        val allAvailable = musicDao.getAllSongs().firstOrNull() ?: emptyList()
        val mixList = mutableListOf<Song>()
        
        // Match existing songs by genres or artists first
        val matchingSongs = allAvailable.filter { song ->
            genres.contains(song.category) || artists.contains(song.artist)
        }
        mixList.addAll(matchingSongs.take(5))
        
        // Add beautifully stylized synthetic daily mix songs matching their favorite styles
        val pool = listOf(
            Song(
                id = "spotify_sim_1",
                title = "Starboy Synth (Spotify Mix)",
                artist = "The Weeknd",
                album = "Starboy Beats",
                durationMs = 218000,
                artworkUrl = "spotify_link",
                audioUrl = "starboy_music",
                category = "Pop",
                isHighQuality = true,
                spotifyTrackUri = "spotify:track:49817a"
            ),
            Song(
                id = "spotify_sim_2",
                title = "Flowers (Spotify Mix)",
                artist = "Miley Cyrus",
                album = "Endless Summer",
                durationMs = 200000,
                artworkUrl = "spotify_link",
                audioUrl = "flowers_music",
                category = "Pop",
                isHighQuality = true,
                spotifyTrackUri = "spotify:track:1120a1"
            ),
            Song(
                id = "spotify_sim_3",
                title = "Midnight City (Spotify Mix)",
                artist = "M83",
                album = "Hurry Up, We're Dreaming",
                durationMs = 243000,
                artworkUrl = "synthwave",
                audioUrl = "synthwave_music",
                category = "Synthwave",
                isHighQuality = true,
                spotifyTrackUri = "spotify:track:1b3a8"
            ),
            Song(
                id = "spotify_sim_4",
                title = "Chaleya (Spotify Mix)",
                artist = "Anirudh Ravichander",
                album = "Jawan",
                durationMs = 200000,
                artworkUrl = "hindi",
                audioUrl = "chaleya_music",
                category = "Hindi",
                isHighQuality = true,
                spotifyTrackUri = "spotify:track:0v9c1"
            ),
            Song(
                id = "spotify_sim_5",
                title = "Sunset Dreams (Spotify Mix)",
                artist = "Lofi Study Club",
                album = "Sleepless Nights",
                durationMs = 152000,
                artworkUrl = "lofi",
                audioUrl = "lofi_music",
                category = "Lo-Fi",
                isHighQuality = true,
                spotifyTrackUri = "spotify:track:33100"
            ),
            Song(
                id = "spotify_sim_6",
                title = "Metamorphosis (Spotify Mix)",
                artist = "INTERWORLD",
                album = "Metamorphosis",
                durationMs = 143000,
                artworkUrl = "electronic",
                audioUrl = "metamorphosis_music",
                category = "Phonk",
                isHighQuality = true,
                spotifyTrackUri = "spotify:track:112a44"
            )
        )
        
        // Pick pool songs that match top genres or are highly rated, until we reach 10 songs in the mix
        for (song in pool) {
            if (mixList.size < 10 && !mixList.any { it.title == song.title }) {
                mixList.add(song)
                musicDao.insertSong(song) // Save to DB so they can be played
            }
        }
        
        return mixList
    }

    // Pre-seeds catalog data and initial social feed posts to deliver a rich initial experience
    suspend fun preseedDataIfEmpty() {
        val existingSongs = allSongs.firstOrNull() ?: emptyList()
        val songsToSeed = listOf(
            Song(
                id = "song_ocean",
                title = "Midnight Breeze",
                artist = "Oceanic Dreams",
                album = "Silent Depths",
                durationMs = 184000,
                artworkUrl = "ambient",
                audioUrl = "ambient_music",
                category = "Ambient",
                isHighQuality = true
            ),
            Song(
                id = "song_lofi_rain",
                title = "Raindrops on Glass",
                artist = "Lofi Study Club",
                album = "Sleepless Nights",
                durationMs = 152000,
                artworkUrl = "lofi",
                audioUrl = "lofi_music",
                category = "Lo-Fi",
                isHighQuality = true
            ),
            Song(
                id = "song_synth_wave",
                title = "Neon Highway",
                artist = "Retro Future",
                album = "Outrun the Sun",
                durationMs = 210000,
                artworkUrl = "synthwave",
                audioUrl = "synthwave_music",
                category = "Synthwave",
                isHighQuality = true
            ),
            Song(
                id = "song_summer",
                title = "Golden Hour Echoes",
                artist = "Indie Coast",
                album = "Saltwater Tides",
                durationMs = 198000,
                artworkUrl = "indie",
                audioUrl = "indie_music",
                category = "Indie Pop",
                isHighQuality = true
            ),
            Song(
                id = "song_cyber",
                title = "Grid Runner",
                artist = "Cyber Punk",
                album = "Digital Rain",
                durationMs = 245000,
                artworkUrl = "electronic",
                audioUrl = "electronic_music",
                category = "Electronic",
                isHighQuality = true
            ),
            Song(
                id = "song_coffee",
                title = "Warm Mug & Acoustic",
                artist = "Emma Rivers",
                album = "Decaf Chronicles",
                durationMs = 172000,
                artworkUrl = "acoustic",
                audioUrl = "acoustic_music",
                category = "Acoustic",
                isHighQuality = true
            ),
            // --- NEW PHONK SONGS ---
            Song(
                id = "song_phonk_metamorphosis",
                title = "Metamorphosis (Spotify)",
                artist = "INTERWORLD",
                album = "Metamorphosis",
                durationMs = 144000,
                artworkUrl = "phonk",
                audioUrl = "phonk_music",
                category = "Phonk",
                isHighQuality = true
            ),
            Song(
                id = "song_phonk_murder",
                title = "Murder In My Mind (Spotify)",
                artist = "Kordhell",
                album = "Psychotic Modern Phonk",
                durationMs = 145000,
                artworkUrl = "phonk",
                audioUrl = "phonk_music",
                category = "Phonk",
                isHighQuality = true
            ),
            Song(
                id = "song_phonk_close_eyes",
                title = "Close Eyes (Spotify)",
                artist = "DVRST",
                album = "Close Eyes Single",
                durationMs = 132000,
                artworkUrl = "phonk",
                audioUrl = "phonk_music",
                category = "Phonk",
                isHighQuality = true
            ),
            // --- NEW HINDI/THINDI SONGS ---
            Song(
                id = "song_hindi_chaleya",
                title = "Chaleya (Bollywood Hits)",
                artist = "Anirudh Ravichander & Arijit Singh",
                album = "Jawan",
                durationMs = 200000,
                artworkUrl = "hindi",
                audioUrl = "hindi_music",
                category = "Hindi",
                isHighQuality = true
            ),
            Song(
                id = "song_hindi_kesariya",
                title = "Kesariya (Spotify Hits)",
                artist = "Pritam & Arijit Singh",
                album = "Brahmastra",
                durationMs = 268000,
                artworkUrl = "hindi",
                audioUrl = "hindi_music",
                category = "Hindi",
                isHighQuality = true
            ),
            Song(
                id = "song_thindi_tum_tum",
                title = "Tum Tum (Thindi Beats)",
                artist = "Sreejith Edavana",
                album = "Folk Snacks",
                durationMs = 180000,
                artworkUrl = "thindi",
                audioUrl = "thindi_music",
                category = "Thindi Folk",
                isHighQuality = true
            ),
            Song(
                id = "song_thindi_naatu",
                title = "Naatu Naatu (Spotify Folk)",
                artist = "M. M. Keeravani",
                album = "RRR OST",
                durationMs = 215000,
                artworkUrl = "thindi",
                audioUrl = "thindi_music",
                category = "Thindi Folk",
                isHighQuality = true
            )
        )

        // Only insert songs that don't exist yet
        val missingSongs = songsToSeed.filter { seedSong ->
            existingSongs.none { it.id == seedSong.id }
        }
        if (missingSongs.isNotEmpty()) {
            musicDao.insertSongs(missingSongs)
        }

        val existingPosts = allSocialPosts.firstOrNull() ?: emptyList()
        if (existingPosts.isEmpty()) {
            // Seed initial social posts
            val initialPosts = listOf(
                SocialPost(
                    username = "Sarah Jenkins",
                    avatarUrl = "avatar_sarah",
                    message = "Honestly, 'Raindrops on Glass' by Lofi Study Club is the absolute perfect background vibe for coding late at night! Highly recommended for all dev friends here.",
                    songId = "song_lofi_rain",
                    likes = 12,
                    timestamp = System.currentTimeMillis() - 7200000,
                    isLikedByMe = false
                ),
                SocialPost(
                    username = "Alex Carter",
                    avatarUrl = "avatar_alex",
                    message = "Cruising down the coastal highway with 'Neon Highway' playing is a whole cinematic feeling. Synthwave is life!",
                    songId = "song_synth_wave",
                    likes = 8,
                    timestamp = System.currentTimeMillis() - 14400000,
                    isLikedByMe = false
                ),
                SocialPost(
                    username = "Liam Vance",
                    avatarUrl = "avatar_liam",
                    message = "Stumbled upon Emma Rivers' new acoustic album. It feels like a warm hug in a chilly coffee shop.",
                    songId = "song_coffee",
                    likes = 24,
                    timestamp = System.currentTimeMillis() - 28800000,
                    isLikedByMe = false
                )
            )
            for (post in initialPosts) {
                musicDao.insertSocialPost(post)
            }
        }
    }
}
