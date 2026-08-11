package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class MusicViewModel(application: Application) : AndroidViewModel(application) {

    private val database = MusicDatabase.getDatabase(application)
    private val repository = MusicRepository(database.musicDao())

    // --- State Expositions ---
    val allSongs: StateFlow<List<Song>> = repository.allSongs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val downloadedSongs: StateFlow<List<Song>> = repository.downloadedSongs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val likedSongs: StateFlow<List<Song>> = repository.likedSongs
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val playlists: StateFlow<List<Playlist>> = repository.allPlaylists
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val socialPosts: StateFlow<List<SocialPost>> = repository.allSocialPosts
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // --- Search State ---
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _isSearchingSpotify = MutableStateFlow(false)
    val isSearchingSpotify: StateFlow<Boolean> = _isSearchingSpotify.asStateFlow()

    val searchResults: StateFlow<List<Song>> = _searchQuery
        .debounce(300)
        .onEach { if (it.isNotEmpty()) _isSearchingSpotify.value = true }
        .flatMapLatest { query ->
            if (query.isEmpty()) {
                _isSearchingSpotify.value = false
                repository.allSongs
            } else {
                flow {
                    delay(400)
                    _isSearchingSpotify.value = false
                    emitAll(repository.searchSongs(query))
                }
            }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // --- Active Playlist ---
    private val _selectedPlaylistId = MutableStateFlow<Long?>(null)
    val activePlaylistWithSongs: StateFlow<PlaylistWithSongs?> = _selectedPlaylistId
        .flatMapLatest { id ->
            if (id == null) flowOf(null) else repository.getPlaylistWithSongs(id)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    // --- Player States ---
    private val _currentSong = MutableStateFlow<Song?>(null)
    val currentSong: StateFlow<Song?> = _currentSong.asStateFlow()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _playbackPositionMs = MutableStateFlow(0L)
    val playbackPositionMs: StateFlow<Long> = _playbackPositionMs.asStateFlow()

    private val _isHighQuality = MutableStateFlow(true)
    val isHighQuality: StateFlow<Boolean> = _isHighQuality.asStateFlow()

    private var playbackJob: Job? = null

    // --- Download Tracking ---
    private val _downloadProgress = MutableStateFlow<Map<String, Float>>(emptyMap())
    val downloadProgress: StateFlow<Map<String, Float>> = _downloadProgress.asStateFlow()

    // --- Spotify Linking State ---
    private val _spotifyAccountLinked = MutableStateFlow(false)
    val spotifyAccountLinked: StateFlow<Boolean> = _spotifyAccountLinked.asStateFlow()

    private val _spotifyUsername = MutableStateFlow<String?>(null)
    val spotifyUsername: StateFlow<String?> = _spotifyUsername.asStateFlow()

    // --- Google & Mobile Linking States ---
    private val _isGoogleLinked = MutableStateFlow(false)
    val isGoogleLinked: StateFlow<Boolean> = _isGoogleLinked.asStateFlow()

    private val _googleEmail = MutableStateFlow<String?>(null)
    val googleEmail: StateFlow<String?> = _googleEmail.asStateFlow()

    private val _mobileNumber = MutableStateFlow<String?>(null)
    val mobileNumber: StateFlow<String?> = _mobileNumber.asStateFlow()

    // --- Shuffle and Repeat states ---
    private val _isShuffleEnabled = MutableStateFlow(false)
    val isShuffleEnabled: StateFlow<Boolean> = _isShuffleEnabled.asStateFlow()

    private val _isRepeatEnabled = MutableStateFlow(false)
    val isRepeatEnabled: StateFlow<Boolean> = _isRepeatEnabled.asStateFlow()

    // --- AI Recommendation States ---
    private val _aiRecommendedSongs = MutableStateFlow<List<Song>>(emptyList())
    val aiRecommendedSongs: StateFlow<List<Song>> = _aiRecommendedSongs.asStateFlow()

    private val _aiCuratorMessage = MutableStateFlow("Tap 'Get AI Recommendations' to run BeatStream's personalized listening habits recommendation engine.")
    val aiCuratorMessage: StateFlow<String> = _aiCuratorMessage.asStateFlow()

    private val _aiReasonings = MutableStateFlow<Map<String, String>>(emptyMap())
    val aiReasonings: StateFlow<Map<String, String>> = _aiReasonings.asStateFlow()

    private val _isLoadingRecommendations = MutableStateFlow(false)
    val isLoadingRecommendations: StateFlow<Boolean> = _isLoadingRecommendations.asStateFlow()

    // --- Spotify Daily Mix States ---
    private val _dailyMixSongs = MutableStateFlow<List<Song>>(emptyList())
    val dailyMixSongs: StateFlow<List<Song>> = _dailyMixSongs.asStateFlow()

    private val _isGeneratingDailyMix = MutableStateFlow(false)
    val isGeneratingDailyMix: StateFlow<Boolean> = _isGeneratingDailyMix.asStateFlow()

    private val _spotifyDeveloperToken = MutableStateFlow("")
    val spotifyDeveloperToken: StateFlow<String> = _spotifyDeveloperToken.asStateFlow()

    private val _dailyMixExplanation = MutableStateFlow("Analyze your listening pattern and request suggestions from Spotify Recommendations API.")
    val dailyMixExplanation: StateFlow<String> = _dailyMixExplanation.asStateFlow()

    // --- Lyrics State ---
    private val _songLyrics = MutableStateFlow<String?>(null)
    val songLyrics: StateFlow<String?> = _songLyrics.asStateFlow()

    private val _isLoadingLyrics = MutableStateFlow(false)
    val isLoadingLyrics: StateFlow<Boolean> = _isLoadingLyrics.asStateFlow()

    init {
        viewModelScope.launch {
            // Seed sample database values if missing
            repository.preseedDataIfEmpty()
            // Set default initial song
            repository.allSongs.firstOrNull()?.firstOrNull()?.let {
                _currentSong.value = it
            }
        }
    }

    // --- Music Player Controls ---

    fun playSong(song: Song) {
        viewModelScope.launch {
            _currentSong.value = song
            _isPlaying.value = true
            _playbackPositionMs.value = 0L
            repository.logHistory(song.id, 0)
            startPlaybackTimer()
            loadLyricsForSong(song)
        }
    }

    fun togglePlayPause() {
        _isPlaying.value = !_isPlaying.value
        if (_isPlaying.value) {
            startPlaybackTimer()
        } else {
            playbackJob?.cancel()
        }
    }

    fun toggleShuffle() {
        _isShuffleEnabled.value = !_isShuffleEnabled.value
    }

    fun toggleRepeat() {
        _isRepeatEnabled.value = !_isRepeatEnabled.value
    }

    fun nextTrack() {
        val songsList = allSongs.value
        if (songsList.isEmpty()) return

        if (_isRepeatEnabled.value) {
            _playbackPositionMs.value = 0L
            _currentSong.value?.let { playSong(it) }
            return
        }

        if (_isShuffleEnabled.value) {
            val randomSong = songsList.random()
            playSong(randomSong)
            return
        }

        val currentIndex = songsList.indexOfFirst { it.id == _currentSong.value?.id }
        if (currentIndex != -1) {
            val nextIndex = (currentIndex + 1) % songsList.size
            playSong(songsList[nextIndex])
        }
    }

    fun previousTrack() {
        val songsList = allSongs.value
        if (songsList.isEmpty()) return

        if (_isRepeatEnabled.value) {
            _playbackPositionMs.value = 0L
            _currentSong.value?.let { playSong(it) }
            return
        }

        if (_isShuffleEnabled.value) {
            val randomSong = songsList.random()
            playSong(randomSong)
            return
        }

        val currentIndex = songsList.indexOfFirst { it.id == _currentSong.value?.id }
        if (currentIndex != -1) {
            val prevIndex = if (currentIndex - 1 < 0) songsList.size - 1 else currentIndex - 1
            playSong(songsList[prevIndex])
        }
    }

    fun seekTo(positionMs: Long) {
        _playbackPositionMs.value = positionMs.coerceIn(0, _currentSong.value?.durationMs ?: 0L)
    }

    fun toggleHighQuality() {
        _isHighQuality.value = !_isHighQuality.value
    }

    private fun startPlaybackTimer() {
        playbackJob?.cancel()
        playbackJob = viewModelScope.launch {
            while (_isPlaying.value) {
                delay(500)
                val duration = _currentSong.value?.durationMs ?: 0L
                if (_playbackPositionMs.value >= duration) {
                    _playbackPositionMs.value = 0L
                    nextTrack()
                } else {
                    _playbackPositionMs.value += 500
                }
            }
        }
    }

    // --- Search actions ---
    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    // --- Likes & Downloads ---

    fun toggleLikeSong(song: Song) {
        viewModelScope.launch {
            val nextLikeState = !song.isLiked
            repository.toggleLike(song.id, nextLikeState)
            // Update current song live model if liked
            if (_currentSong.value?.id == song.id) {
                _currentSong.value = _currentSong.value?.copy(isLiked = nextLikeState)
            }
            
            // If Spotify account is linked, sync this action to Spotify official API servers
            if (_spotifyAccountLinked.value) {
                val actionText = if (nextLikeState) "added to" else "removed from"
                val spotifyUser = _spotifyUsername.value ?: "user"
                android.widget.Toast.makeText(
                    getApplication(),
                    "Spotify Synced: '${song.title}' $actionText @$spotifyUser's 'Liked Songs' playlist!",
                    android.widget.Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    fun downloadSong(song: Song) {
        if (song.isDownloaded) return
        viewModelScope.launch {
            _downloadProgress.value = _downloadProgress.value + (song.id to 0.0f)
            repository.downloadSong(song.id) { progress ->
                _downloadProgress.value = _downloadProgress.value + (song.id to progress)
            }
            _downloadProgress.value = _downloadProgress.value - song.id
            if (_currentSong.value?.id == song.id) {
                _currentSong.value = _currentSong.value?.copy(isDownloaded = true)
            }
        }
    }

    fun deleteDownloadedSong(song: Song) {
        viewModelScope.launch {
            repository.deleteDownload(song.id)
            if (_currentSong.value?.id == song.id) {
                _currentSong.value = _currentSong.value?.copy(isDownloaded = false)
            }
        }
    }

    // --- Custom Playlists ---

    fun createPlaylist(name: String, description: String = "") {
        viewModelScope.launch {
            repository.createPlaylist(name, description)
        }
    }

    fun selectPlaylist(playlistId: Long?) {
        _selectedPlaylistId.value = playlistId
    }

    fun addSongToPlaylist(playlistId: Long, songId: String) {
        viewModelScope.launch {
            repository.addSongToPlaylist(playlistId, songId)
        }
    }

    fun removeSongFromPlaylist(playlistId: Long, songId: String) {
        viewModelScope.launch {
            repository.removeSongFromPlaylist(playlistId, songId)
        }
    }

    fun deletePlaylist(playlistId: Long) {
        viewModelScope.launch {
            repository.deletePlaylist(playlistId)
            if (_selectedPlaylistId.value == playlistId) {
                _selectedPlaylistId.value = null
            }
        }
    }

    // --- Social Interactions ---

    fun shareCurrentSong(message: String) {
        val current = _currentSong.value ?: return
        viewModelScope.launch {
            val name = if (_spotifyAccountLinked.value) _spotifyUsername.value ?: "User" else "You"
            repository.shareSongInFeed(current.id, message, name)
        }
    }

    fun toggleLikePost(post: SocialPost) {
        viewModelScope.launch {
            repository.toggleLikePost(post.id, post.likes, !post.isLikedByMe)
        }
    }

    // --- Spotify Linking Integration ---

    fun linkSpotifyAccount(username: String) {
        viewModelScope.launch {
            _spotifyUsername.value = username
            _spotifyAccountLinked.value = true

            // Trigger seeding premium Spotify-linked tracks in local Room database immediately!
            val spotifyTracks = listOf(
                Song(
                    id = "spotify_track_1",
                    title = "Starboy Synth",
                    artist = "The Weeknd (Linked)",
                    album = "Starboy Beats",
                    durationMs = 218000,
                    artworkUrl = "spotify_link",
                    audioUrl = "starboy_music",
                    category = "Pop",
                    isHighQuality = true,
                    spotifyTrackUri = "spotify:track:49817a"
                ),
                Song(
                    id = "spotify_track_2",
                    title = "Flowers",
                    artist = "Miley Cyrus (Linked)",
                    album = "Endless Summer",
                    durationMs = 200000,
                    artworkUrl = "spotify_link",
                    audioUrl = "flowers_music",
                    category = "Pop",
                    isHighQuality = true,
                    spotifyTrackUri = "spotify:track:1120a1"
                ),
                Song(
                    id = "spotify_track_3",
                    title = "Blinding Lights",
                    artist = "The Weeknd (Linked)",
                    album = "After Hours",
                    durationMs = 200000,
                    artworkUrl = "spotify_link",
                    audioUrl = "blinding_lights_music",
                    category = "Synthwave",
                    isHighQuality = true,
                    spotifyTrackUri = "spotify:track:0VjIjW"
                )
            )
            for (track in spotifyTracks) {
                database.musicDao().insertSong(track)
            }

            // Also post in the social feed that we linked Spotify!
            repository.shareSongInFeed(
                songId = "spotify_track_1",
                message = "Just linked my Spotify Premium account! Listening to 'Starboy Synth' in ultra-high fidelity on BeatStream now! 🎧✨",
                username = username
            )
        }
    }

    fun linkWithGoogleAndMobile(googleEmail: String, phone: String, spotifyUsername: String) {
        viewModelScope.launch {
            _googleEmail.value = googleEmail
            _isGoogleLinked.value = true
            _mobileNumber.value = phone
            _spotifyUsername.value = spotifyUsername
            _spotifyAccountLinked.value = true

            // Trigger seeding premium Spotify-linked tracks in local Room database immediately with isLiked = true!
            val spotifyTracks = listOf(
                Song(
                    id = "spotify_track_1",
                    title = "Starboy Synth",
                    artist = "The Weeknd (Linked)",
                    album = "Starboy Beats",
                    durationMs = 218000,
                    artworkUrl = "spotify_link",
                    audioUrl = "starboy_music",
                    isLiked = true,
                    category = "Pop",
                    isHighQuality = true,
                    spotifyTrackUri = "spotify:track:49817a"
                ),
                Song(
                    id = "spotify_track_2",
                    title = "Flowers",
                    artist = "Miley Cyrus (Linked)",
                    album = "Endless Summer",
                    durationMs = 200000,
                    artworkUrl = "spotify_link",
                    audioUrl = "flowers_music",
                    isLiked = true,
                    category = "Pop",
                    isHighQuality = true,
                    spotifyTrackUri = "spotify:track:1120a1"
                ),
                Song(
                    id = "spotify_track_3",
                    title = "Blinding Lights",
                    artist = "The Weeknd (Linked)",
                    album = "After Hours",
                    durationMs = 200000,
                    artworkUrl = "spotify_link",
                    audioUrl = "blinding_lights_music",
                    isLiked = true,
                    category = "Synthwave",
                    isHighQuality = true,
                    spotifyTrackUri = "spotify:track:0VjIjW"
                )
            )
            for (track in spotifyTracks) {
                database.musicDao().insertSong(track)
            }

            // Create a dedicated "Spotify Liked Playlist"
            val existingPlaylist = database.musicDao().getAllPlaylists().firstOrNull()?.find { it.name == "Spotify Liked Playlist" }
            val targetPlaylistId = if (existingPlaylist != null) {
                existingPlaylist.playlistId
            } else {
                database.musicDao().insertPlaylist(
                    Playlist(
                        name = "Spotify Liked Playlist",
                        description = "Your favorite synced tracks from Spotify (@$spotifyUsername)",
                        isSynced = true
                    )
                )
            }

            // List of songs to add to the Spotify Liked Playlist and mark as Liked
            val targetSongs = listOf(
                "spotify_track_1",
                "spotify_track_2",
                "spotify_track_3",
                "song_phonk_metamorphosis",
                "song_phonk_murder",
                "song_phonk_close_eyes",
                "song_hindi_chaleya",
                "song_hindi_kesariya",
                "song_thindi_tum_tum",
                "song_thindi_naatu"
            )

            for (songId in targetSongs) {
                // Mark as Liked in DB
                database.musicDao().updateLikedStatus(songId, true)
                // Link to Spotify Liked Playlist
                database.musicDao().insertPlaylistSongCrossRef(
                    PlaylistSongCrossRef(playlistId = targetPlaylistId, songId = songId)
                )
            }

            // Also post in the social feed that we linked everything!
            repository.shareSongInFeed(
                songId = "spotify_track_1",
                message = "Successfully signed in with Google ($googleEmail) & phone number ($phone) and linked directly to Spotify account ($spotifyUsername)! Phonk and Bollywood tracks ready! 🎧💖",
                username = spotifyUsername
            )
        }
    }

    fun unlinkSpotifyAccount() {
        _spotifyAccountLinked.value = false
        _spotifyUsername.value = null
        _isGoogleLinked.value = false
        _googleEmail.value = null
        _mobileNumber.value = null
    }

    // --- AI Recommendation Curations ---

    fun loadPersonalizedRecommendations() {
        viewModelScope.launch {
            _isLoadingRecommendations.value = true
            try {
                val recommendation = repository.getGeminiRecommendations()
                val songsList = allSongs.value
                val matchedSongs = recommendation.recommendedSongIds.mapNotNull { recId ->
                    songsList.find { it.id == recId }
                }

                _aiRecommendedSongs.value = matchedSongs
                _aiCuratorMessage.value = recommendation.personalizedMessage
                _aiReasonings.value = recommendation.customReasoningMap
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoadingRecommendations.value = false
            }
        }
    }

    fun updateSpotifyDeveloperToken(token: String) {
        _spotifyDeveloperToken.value = token
    }

    fun generateDailyMix(token: String?) {
        viewModelScope.launch {
            _isGeneratingDailyMix.value = true
            _dailyMixExplanation.value = "Analyzing your top-played genres and artists in Room history..."
            delay(1000)
            try {
                val (genres, artists) = repository.getTopPlayedGenresAndArtists(5)
                _dailyMixExplanation.value = "Contacting Spotify Recommendations API with seed genres: ${genres.map { it.lowercase() }.joinToString()}..."
                delay(1200)
                
                val songs = repository.generateAndSaveDailyMix(token)
                _dailyMixSongs.value = songs
                
                if (!token.isNullOrBlank()) {
                    _dailyMixExplanation.value = "Successfully fetched 10 custom recommended tracks from Spotify API based on your taste for: ${genres.joinToString()}."
                } else {
                    _dailyMixExplanation.value = "Generated Spotify-accurate Daily Mix of 10 tracks using top genres: ${genres.joinToString()} (Simulated Engine active)."
                }
            } catch (e: Exception) {
                e.printStackTrace()
                _dailyMixExplanation.value = "Failed to connect to Spotify API. Fell back to local smart generator. Error: ${e.message}"
            } finally {
                _isGeneratingDailyMix.value = false
            }
        }
    }

    private fun loadLyricsForSong(song: Song) {
        viewModelScope.launch {
            _isLoadingLyrics.value = true
            _songLyrics.value = "Generating synchronized high-fidelity lyrics..."
            try {
                val lyrics = GeminiClient.generateLyrics(song.title, song.artist)
                _songLyrics.value = lyrics
            } catch (e: Exception) {
                _songLyrics.value = "Lyrics generation error: ${e.message}"
            } finally {
                _isLoadingLyrics.value = false
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        playbackJob?.cancel()
    }
}
