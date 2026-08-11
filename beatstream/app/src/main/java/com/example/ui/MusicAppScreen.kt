package com.example.ui

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.R
import com.example.data.*
import com.example.ui.theme.MusicGreen
import com.example.ui.theme.MusicGreenBright
import kotlinx.coroutines.launch

@Composable
fun MusicAppScreen(
    viewModel: MusicViewModel,
    modifier: Modifier = Modifier
) {
    val allSongs by viewModel.allSongs.collectAsStateWithLifecycle()
    val downloadedSongs by viewModel.downloadedSongs.collectAsStateWithLifecycle()
    val likedSongs by viewModel.likedSongs.collectAsStateWithLifecycle()
    val playlists by viewModel.playlists.collectAsStateWithLifecycle()
    val socialPosts by viewModel.socialPosts.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val searchResults by viewModel.searchResults.collectAsStateWithLifecycle()
    val isSearchingSpotify by viewModel.isSearchingSpotify.collectAsStateWithLifecycle()
    val activePlaylistWithSongs by viewModel.activePlaylistWithSongs.collectAsStateWithLifecycle()

    val currentSong by viewModel.currentSong.collectAsStateWithLifecycle()
    val isPlaying by viewModel.isPlaying.collectAsStateWithLifecycle()
    val isShuffleEnabled by viewModel.isShuffleEnabled.collectAsStateWithLifecycle()
    val isRepeatEnabled by viewModel.isRepeatEnabled.collectAsStateWithLifecycle()
    val playbackPositionMs by viewModel.playbackPositionMs.collectAsStateWithLifecycle()
    val isHighQuality by viewModel.isHighQuality.collectAsStateWithLifecycle()
    val downloadProgress by viewModel.downloadProgress.collectAsStateWithLifecycle()
    val spotifyAccountLinked by viewModel.spotifyAccountLinked.collectAsStateWithLifecycle()
    val spotifyUsername by viewModel.spotifyUsername.collectAsStateWithLifecycle()
    val isGoogleLinked by viewModel.isGoogleLinked.collectAsStateWithLifecycle()
    val googleEmail by viewModel.googleEmail.collectAsStateWithLifecycle()
    val mobileNumber by viewModel.mobileNumber.collectAsStateWithLifecycle()

    val aiRecommendedSongs by viewModel.aiRecommendedSongs.collectAsStateWithLifecycle()
    val aiCuratorMessage by viewModel.aiCuratorMessage.collectAsStateWithLifecycle()
    val aiReasonings by viewModel.aiReasonings.collectAsStateWithLifecycle()
    val isLoadingRecommendations by viewModel.isLoadingRecommendations.collectAsStateWithLifecycle()

    val dailyMixSongs by viewModel.dailyMixSongs.collectAsStateWithLifecycle()
    val isGeneratingDailyMix by viewModel.isGeneratingDailyMix.collectAsStateWithLifecycle()
    val spotifyDeveloperToken by viewModel.spotifyDeveloperToken.collectAsStateWithLifecycle()
    val dailyMixExplanation by viewModel.dailyMixExplanation.collectAsStateWithLifecycle()

    val songLyrics by viewModel.songLyrics.collectAsStateWithLifecycle()
    val isLoadingLyrics by viewModel.isLoadingLyrics.collectAsStateWithLifecycle()

    var activeTab by remember { mutableStateOf("home") }
    var showFullscreenPlayer by remember { mutableStateOf(false) }
    var showCreatePlaylistDialog by remember { mutableStateOf(false) }
    var showAddToPlaylistDialog by remember { mutableStateOf<Song?>(null) }
    var showSpotifyLinkDialog by remember { mutableStateOf(false) }

    val coroutineScope = rememberCoroutineScope()

    // Determine form factor (tablet navigation rail vs phone bottom navigation bar)
    val configuration = LocalConfiguration.current
    val isTablet = configuration.screenWidthDp >= 600

    Scaffold(
        modifier = modifier
            .fillMaxSize()
            .testTag("app_scaffold"),
        bottomBar = {
            if (!isTablet && !showFullscreenPlayer) {
                Column(modifier = Modifier.background(Color(0xFF040404))) {
                    // Mini Player above navigation bar if a song is loaded
                    currentSong?.let { song ->
                        MiniPlayerBar(
                            song = song,
                            isPlaying = isPlaying,
                            playbackPositionMs = playbackPositionMs,
                            onPlayPauseToggle = { viewModel.togglePlayPause() },
                            onBarClick = { showFullscreenPlayer = true },
                            onNext = { viewModel.nextTrack() },
                            onPrevious = { viewModel.previousTrack() },
                            isShuffleEnabled = isShuffleEnabled,
                            isRepeatEnabled = isRepeatEnabled,
                            onToggleShuffle = { viewModel.toggleShuffle() },
                            onToggleRepeat = { viewModel.toggleRepeat() },
                            onSeek = { viewModel.seekTo(it) }
                        )
                    }

                    NavigationBar(
                        containerColor = Color(0xFF0D0D0D),
                        tonalElevation = 8.dp,
                        modifier = Modifier.navigationBarsPadding()
                    ) {
                        NavigationBarItem(
                            selected = activeTab == "home",
                            onClick = { activeTab = "home" },
                            label = { Text("Home", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                            icon = { Icon(if (activeTab == "home") Icons.Filled.Home else Icons.Outlined.Home, contentDescription = "Home") },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Color.Black,
                                selectedTextColor = MusicGreen,
                                indicatorColor = MusicGreen,
                                unselectedIconColor = Color.White,
                                unselectedTextColor = Color.Gray
                            ),
                            modifier = Modifier.testTag("nav_home")
                        )
                        NavigationBarItem(
                            selected = activeTab == "search",
                            onClick = { activeTab = "search" },
                            label = { Text("Search", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                            icon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Color.Black,
                                selectedTextColor = MusicGreen,
                                indicatorColor = MusicGreen,
                                unselectedIconColor = Color.White,
                                unselectedTextColor = Color.Gray
                            ),
                            modifier = Modifier.testTag("nav_search")
                        )
                        NavigationBarItem(
                            selected = activeTab == "library",
                            onClick = { activeTab = "library" },
                            label = { Text("Library", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                            icon = { Icon(if (activeTab == "library") Icons.Filled.QueueMusic else Icons.Outlined.QueueMusic, contentDescription = "Library") },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Color.Black,
                                selectedTextColor = MusicGreen,
                                indicatorColor = MusicGreen,
                                unselectedIconColor = Color.White,
                                unselectedTextColor = Color.Gray
                            ),
                            modifier = Modifier.testTag("nav_library")
                        )
                        NavigationBarItem(
                            selected = activeTab == "social",
                            onClick = { activeTab = "social" },
                            label = { Text("Social", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                            icon = { Icon(if (activeTab == "social") Icons.Filled.People else Icons.Outlined.People, contentDescription = "Social") },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Color.Black,
                                selectedTextColor = MusicGreen,
                                indicatorColor = MusicGreen,
                                unselectedIconColor = Color.White,
                                unselectedTextColor = Color.Gray
                            ),
                            modifier = Modifier.testTag("nav_social")
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(if (isTablet) PaddingValues() else innerPadding)
        ) {
            // Render tablet sidebar navigation rail if tablet
            if (isTablet) {
                NavigationRail(
                    containerColor = Color(0xFF0D0D0D),
                    modifier = Modifier.fillMaxHeight(),
                    header = {
                        Text(
                            text = "BeatStream",
                            color = MusicGreen,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(vertical = 24.dp)
                        )
                    }
                ) {
                    NavigationRailItem(
                        selected = activeTab == "home",
                        onClick = { activeTab = "home" },
                        label = { Text("Home", fontWeight = FontWeight.Bold) },
                        icon = { Icon(if (activeTab == "home") Icons.Filled.Home else Icons.Outlined.Home, contentDescription = "Home") },
                        colors = NavigationRailItemDefaults.colors(
                            selectedIconColor = Color.Black,
                            selectedTextColor = MusicGreen,
                            indicatorColor = MusicGreen,
                            unselectedIconColor = Color.White,
                            unselectedTextColor = Color.Gray
                        )
                    )
                    NavigationRailItem(
                        selected = activeTab == "search",
                        onClick = { activeTab = "search" },
                        label = { Text("Search", fontWeight = FontWeight.Bold) },
                        icon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                        colors = NavigationRailItemDefaults.colors(
                            selectedIconColor = Color.Black,
                            selectedTextColor = MusicGreen,
                            indicatorColor = MusicGreen,
                            unselectedIconColor = Color.White,
                            unselectedTextColor = Color.Gray
                        )
                    )
                    NavigationRailItem(
                        selected = activeTab == "library",
                        onClick = { activeTab = "library" },
                        label = { Text("Library", fontWeight = FontWeight.Bold) },
                        icon = { Icon(if (activeTab == "library") Icons.Filled.QueueMusic else Icons.Outlined.QueueMusic, contentDescription = "Library") },
                        colors = NavigationRailItemDefaults.colors(
                            selectedIconColor = Color.Black,
                            selectedTextColor = MusicGreen,
                            indicatorColor = MusicGreen,
                            unselectedIconColor = Color.White,
                            unselectedTextColor = Color.Gray
                        )
                    )
                    NavigationRailItem(
                        selected = activeTab == "social",
                        onClick = { activeTab = "social" },
                        label = { Text("Social", fontWeight = FontWeight.Bold) },
                        icon = { Icon(if (activeTab == "social") Icons.Filled.People else Icons.Outlined.People, contentDescription = "Social") },
                        colors = NavigationRailItemDefaults.colors(
                            selectedIconColor = Color.Black,
                            selectedTextColor = MusicGreen,
                            indicatorColor = MusicGreen,
                            unselectedIconColor = Color.White,
                            unselectedTextColor = Color.Gray
                        )
                    )

                    Spacer(modifier = Modifier.weight(1f))

                    // Minimal Mini Player inside tablet rail if song loaded
                    currentSong?.let { song ->
                        IconButton(
                            onClick = { showFullscreenPlayer = true },
                            modifier = Modifier
                                .padding(bottom = 24.dp)
                                .size(48.dp)
                                .background(MusicGreen, shape = CircleShape)
                        ) {
                            Icon(Icons.Filled.GraphicEq, contentDescription = "Now Playing", tint = Color.Black)
                        }
                    }
                }
            }

            // Main screen display
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .background(Color(0xFF121212))
            ) {
                AnimatedContent(
                    targetState = activeTab,
                    transitionSpec = {
                        fadeIn(animationSpec = tween(220)) togetherWith fadeOut(animationSpec = tween(220))
                    },
                    label = "main_screen_tabs"
                ) { targetTab ->
                    when (targetTab) {
                        "home" -> HomeScreen(
                            heroBannerPainter = painterResource(id = R.drawable.img_hero_music_1783683054186),
                            spotifyLinked = spotifyAccountLinked,
                            spotifyUsername = spotifyUsername ?: "",
                            isGoogleLinked = isGoogleLinked,
                            googleEmail = googleEmail ?: "",
                            mobileNumber = mobileNumber ?: "",
                            onLinkSpotifyClick = { showSpotifyLinkDialog = true },
                            onUnlinkSpotifyClick = { viewModel.unlinkSpotifyAccount() },
                            allSongs = allSongs,
                            onSongClick = { viewModel.playSong(it) },
                            aiSongs = aiRecommendedSongs,
                            aiMessage = aiCuratorMessage,
                            aiReasonings = aiReasonings,
                            isLoadingAI = isLoadingRecommendations,
                            onGetAIRecommendations = { viewModel.loadPersonalizedRecommendations() },
                            dailyMixSongs = dailyMixSongs,
                            isGeneratingDailyMix = isGeneratingDailyMix,
                            spotifyDeveloperToken = spotifyDeveloperToken,
                            dailyMixExplanation = dailyMixExplanation,
                            onUpdateSpotifyToken = { viewModel.updateSpotifyDeveloperToken(it) },
                            onGenerateDailyMix = { viewModel.generateDailyMix(it) }
                        )
                        "search" -> SearchScreen(
                            searchQuery = searchQuery,
                            onQueryChange = { viewModel.updateSearchQuery(it) },
                            songs = searchResults,
                            onSongClick = { viewModel.playSong(it) },
                            onAddToPlaylistClick = { showAddToPlaylistDialog = it },
                            onDownloadClick = { viewModel.downloadSong(it) },
                            onLikeClick = { viewModel.toggleLikeSong(it) },
                            downloadProgress = downloadProgress,
                            isSearching = isSearchingSpotify
                        )
                        "library" -> LibraryScreen(
                            playlists = playlists,
                            downloadedSongs = downloadedSongs,
                            likedSongs = likedSongs,
                            spotifyLinked = spotifyAccountLinked,
                            onPlaylistClick = {
                                viewModel.selectPlaylist(it.playlistId)
                                activeTab = "playlist_detail"
                            },
                            onCreatePlaylistClick = { showCreatePlaylistDialog = true },
                            onSongClick = { viewModel.playSong(it) },
                            onLikeClick = { viewModel.toggleLikeSong(it) }
                        )
                        "social" -> SocialScreen(
                            posts = socialPosts,
                            allSongs = allSongs,
                            currentSong = currentSong,
                            onLikePost = { viewModel.toggleLikePost(it) },
                            onShareMessage = { viewModel.shareCurrentSong(it) },
                            onSongClick = { viewModel.playSong(it) }
                        )
                        "playlist_detail" -> PlaylistDetailScreen(
                            playlistWithSongs = activePlaylistWithSongs,
                            onBackClick = { activeTab = "library" },
                            onSongClick = { viewModel.playSong(it) },
                            onRemoveSong = { songId ->
                                activePlaylistWithSongs?.playlist?.playlistId?.let { pId ->
                                    viewModel.removeSongFromPlaylist(pId, songId)
                                }
                            },
                            onLikeClick = { viewModel.toggleLikeSong(it) }
                        )
                    }
                }
            }
        }
    }

    // --- Fullscreen Premium Player Overlay ---
    if (showFullscreenPlayer && currentSong != null) {
        FullscreenPlayerSheet(
            song = currentSong!!,
            isPlaying = isPlaying,
            positionMs = playbackPositionMs,
            isHighQuality = isHighQuality,
            downloadProgress = downloadProgress,
            lyrics = songLyrics,
            isLoadingLyrics = isLoadingLyrics,
            isShuffleEnabled = isShuffleEnabled,
            isRepeatEnabled = isRepeatEnabled,
            onToggleShuffle = { viewModel.toggleShuffle() },
            onToggleRepeat = { viewModel.toggleRepeat() },
            onClose = { showFullscreenPlayer = false },
            onPlayPauseToggle = { viewModel.togglePlayPause() },
            onNext = { viewModel.nextTrack() },
            onPrevious = { viewModel.previousTrack() },
            onSeek = { viewModel.seekTo(it) },
            onLikeToggle = { viewModel.toggleLikeSong(currentSong!!) },
            onDownloadToggle = {
                if (currentSong!!.isDownloaded) {
                    viewModel.deleteDownloadedSong(currentSong!!)
                } else {
                    viewModel.downloadSong(currentSong!!)
                }
            },
            onHighQualityToggle = { viewModel.toggleHighQuality() },
            onShareToSocial = { message ->
                viewModel.shareCurrentSong(message)
                coroutineScope.launch {
                    showFullscreenPlayer = false
                    activeTab = "social"
                }
            }
        )
    }

    // --- Dialogs ---

    if (showSpotifyLinkDialog) {
        SpotifyLinkDialog(
            onDismiss = { showSpotifyLinkDialog = false },
            onLinkSuccess = { email, phone, spotifyUser ->
                viewModel.linkWithGoogleAndMobile(email, phone, spotifyUser)
                showSpotifyLinkDialog = false
            }
        )
    }

    if (showCreatePlaylistDialog) {
        CreatePlaylistDialog(
            onDismiss = { showCreatePlaylistDialog = false },
            onConfirm = { name, desc ->
                viewModel.createPlaylist(name, desc)
                showCreatePlaylistDialog = false
            }
        )
    }

    if (showAddToPlaylistDialog != null) {
        AddToPlaylistDialog(
            song = showAddToPlaylistDialog!!,
            playlists = playlists,
            onDismiss = { showAddToPlaylistDialog = null },
            onPlaylistSelected = { playlistId ->
                viewModel.addSongToPlaylist(playlistId, showAddToPlaylistDialog!!.id)
                showAddToPlaylistDialog = null
            }
        )
    }
}

// --- Home Tab ---
@Composable
fun HomeScreen(
    heroBannerPainter: androidx.compose.ui.graphics.painter.Painter,
    spotifyLinked: Boolean,
    spotifyUsername: String,
    isGoogleLinked: Boolean,
    googleEmail: String,
    mobileNumber: String,
    onLinkSpotifyClick: () -> Unit,
    onUnlinkSpotifyClick: () -> Unit,
    allSongs: List<Song>,
    onSongClick: (Song) -> Unit,
    aiSongs: List<Song>,
    aiMessage: String,
    aiReasonings: Map<String, String>,
    isLoadingAI: Boolean,
    onGetAIRecommendations: () -> Unit,
    dailyMixSongs: List<Song>,
    isGeneratingDailyMix: Boolean,
    spotifyDeveloperToken: String,
    dailyMixExplanation: String,
    onUpdateSpotifyToken: (String) -> Unit,
    onGenerateDailyMix: (String?) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("home_screen"),
        contentPadding = PaddingValues(bottom = 80.dp)
    ) {
        // Hero Image Cover
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
            ) {
                Image(
                    painter = heroBannerPainter,
                    contentDescription = "BeatStream Banner",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color.Transparent, Color(0xFF121212)),
                                startY = 100f
                            )
                        )
                )
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(16.dp)
                ) {
                    Text(
                        text = "BEATSTREAM PREMIUM",
                        color = MusicGreenBright,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp
                    )
                    Text(
                        text = "High Fidelity Streaming",
                        color = Color.White,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }
        }

        // Spotify & Google Account Link Banner
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F0F0F)),
                border = BorderStroke(1.dp, if (spotifyLinked) MusicGreen else Color(0xFF222222))
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.GraphicEq,
                            contentDescription = "Spotify Logo",
                            tint = if (spotifyLinked) MusicGreen else Color.Gray,
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (spotifyLinked) "Spotify Account Bridged" else "Link Spotify & Google Account",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = if (spotifyLinked) "Directly linked to your Google ID" else "Link Google Account & Phone to directly import Spotify playlists, Phonk, and Indian beats!",
                                color = Color.Gray,
                                fontSize = 11.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = { if (spotifyLinked) onUnlinkSpotifyClick() else onLinkSpotifyClick() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (spotifyLinked) Color(0xFF333333) else MusicGreen
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = if (spotifyLinked) "Unlink" else "Link Now",
                                color = if (spotifyLinked) Color.White else Color.Black,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    if (spotifyLinked && isGoogleLinked) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Divider(color = Color(0xFF222222), thickness = 1.dp)
                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "Linked Profile Details",
                            color = Color.LightGray,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(bottom = 6.dp)
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Google Email Badge
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.AccountCircle,
                                    contentDescription = "Google Account",
                                    tint = MusicGreen,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = googleEmail,
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }

                            // Mobile Number Badge
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Phone,
                                    contentDescription = "Phone",
                                    tint = MusicGreen,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = mobileNumber,
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.VerifiedUser,
                                contentDescription = "Verified",
                                tint = MusicGreen,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Spotify username: @$spotifyUsername (Imported Phonk, Bollywood & Folk playlists active)",
                                color = MusicGreen,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Normal
                            )
                        }
                    }
                }
            }
        }

        // AI Recommendations Section (Gemini)
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .background(Color(0xFF161616), shape = RoundedCornerShape(12.dp))
                    .border(1.dp, Color(0xFF262626), shape = RoundedCornerShape(12.dp))
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Outlined.GraphicEq,
                            contentDescription = "AI Recommendation",
                            tint = MusicGreenBright,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "AI Curator Room",
                            color = Color.White,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp
                        )
                    }
                    if (isLoadingAI) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MusicGreen, strokeWidth = 2.dp)
                    } else {
                        IconButton(
                            onClick = onGetAIRecommendations,
                            modifier = Modifier
                                .background(MusicGreen, shape = CircleShape)
                                .size(32.dp)
                        ) {
                            Icon(Icons.Filled.Autorenew, contentDescription = "Refresh", tint = Color.Black, modifier = Modifier.size(16.dp))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = aiMessage,
                    color = Color.LightGray,
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                )

                if (aiSongs.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Curated Tracks For You Today:",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    aiSongs.forEach { song ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp)
                                .background(Color(0xFF1E1E1E), shape = RoundedCornerShape(8.dp))
                                .spotifyClickable { onSongClick(song) }
                                .padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Art symbol placeholder
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(Color(0xFF2E2E2E), shape = RoundedCornerShape(4.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.MusicNote, contentDescription = "Music", tint = MusicGreen)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(song.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text(song.artist, color = Color.Gray, fontSize = 11.sp)
                                aiReasonings[song.id]?.let { reason ->
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "✦ $reason",
                                        color = MusicGreenBright,
                                        fontSize = 10.sp,
                                        lineHeight = 13.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                            Icon(Icons.Filled.PlayArrow, contentDescription = "Play", tint = MusicGreen, modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        }

        // Spotify 'Recommendations' API Daily Mix Generator Section
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .background(Color(0xFF0F0F0F), shape = RoundedCornerShape(12.dp))
                    .border(1.dp, Color(0xFF1DB954).copy(alpha = 0.3f), shape = RoundedCornerShape(12.dp))
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.QueueMusic,
                            contentDescription = "Daily Mix Icon",
                            tint = Color(0xFF1DB954), // Spotify Green
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Spotify Daily Mix",
                            color = Color.White,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp
                        )
                    }
                    if (isGeneratingDailyMix) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color(0xFF1DB954),
                            strokeWidth = 2.dp
                        )
                    } else {
                        IconButton(
                            onClick = { onGenerateDailyMix(if (spotifyDeveloperToken.isBlank()) null else spotifyDeveloperToken) },
                            modifier = Modifier
                                .background(Color(0xFF1DB954), shape = CircleShape)
                                .size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.PlayArrow,
                                contentDescription = "Generate",
                                tint = Color.Black,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = dailyMixExplanation,
                    color = Color.LightGray,
                    fontSize = 12.sp,
                    lineHeight = 17.sp
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Token Input Field
                OutlinedTextField(
                    value = spotifyDeveloperToken,
                    onValueChange = onUpdateSpotifyToken,
                    label = { Text("Spotify Developer Access Token (Optional)", fontSize = 11.sp) },
                    placeholder = { Text("Bearer ey...", fontSize = 11.sp) },
                    textStyle = androidx.compose.ui.text.TextStyle(color = Color.White, fontSize = 12.sp),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("spotify_token_input"),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF1DB954),
                        unfocusedBorderColor = Color(0xFF333333),
                        focusedLabelColor = Color(0xFF1DB954),
                        unfocusedLabelColor = Color.Gray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    trailingIcon = {
                        if (spotifyDeveloperToken.isNotEmpty()) {
                            IconButton(onClick = { onUpdateSpotifyToken("") }) {
                                Icon(Icons.Default.Close, contentDescription = "Clear Token", tint = Color.Gray, modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "💡 Enter an active OAuth token from Spotify Web API Console to load real recommended songs. If left empty, BeatStream compiles a high-fidelity local recommendations mix based on your Room history.",
                    color = Color.Gray,
                    fontSize = 10.sp,
                    lineHeight = 14.sp
                )

                if (dailyMixSongs.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Your Personalized Daily Mix Playlist:",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(dailyMixSongs) { song ->
                            Card(
                                modifier = Modifier
                                    .width(130.dp)
                                    .spotifyClickable { onSongClick(song) }
                                    .padding(vertical = 4.dp),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF161616)),
                                border = BorderStroke(1.dp, Color(0xFF262626))
                            ) {
                                Column(
                                    modifier = Modifier.padding(8.dp)
                                ) {
                                    // Artwork placeholder or real image
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(80.dp)
                                            .background(Color(0xFF222222), shape = RoundedCornerShape(4.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.MusicNote,
                                            contentDescription = "Music Note",
                                            tint = Color(0xFF1DB954),
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = song.title,
                                        color = Color.White,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = song.artist,
                                        color = Color.Gray,
                                        fontSize = 10.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Catalog List
        item {
            Text(
                text = "Recently Added & Hot Tracks",
                color = Color.White,
                fontSize = 18.sp,
                fontWeight = FontWeight.ExtraBold,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
            )
        }

        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(allSongs) { song ->
                    Column(
                        modifier = Modifier
                            .width(140.dp)
                            .spotifyClickable { onSongClick(song) }
                            .padding(4.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(140.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(
                                    Brush.linearGradient(
                                        colors = listOf(Color(0xFF2E2E2E), Color(0xFF161616))
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.MusicNote,
                                contentDescription = "Song Artwork",
                                tint = MusicGreen,
                                modifier = Modifier.size(48.dp)
                            )
                            if (song.isHighQuality) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .padding(6.dp)
                                        .background(Color(0xFFE5A93B), shape = RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("Hi-Fi", color = Color.Black, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = song.title,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = song.artist,
                            color = Color.Gray,
                            fontSize = 12.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}

// --- Search Tab ---
@Composable
fun SearchScreen(
    searchQuery: String,
    onQueryChange: (String) -> Unit,
    songs: List<Song>,
    onSongClick: (Song) -> Unit,
    onAddToPlaylistClick: (Song) -> Unit,
    onDownloadClick: (Song) -> Unit,
    onLikeClick: (Song) -> Unit,
    downloadProgress: Map<String, Float>,
    isSearching: Boolean
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .testTag("search_screen")
            .padding(16.dp)
    ) {
        Text(
            text = "Search",
            color = Color.White,
            fontSize = 24.sp,
            fontWeight = FontWeight.ExtraBold,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        OutlinedTextField(
            value = searchQuery,
            onValueChange = onQueryChange,
            placeholder = { Text("What do you want to listen to?", color = Color.Gray) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = Color.Gray) },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { onQueryChange("") }) {
                        Icon(Icons.Default.Close, contentDescription = "Clear", tint = Color.Gray)
                    }
                }
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MusicGreen,
                unfocusedBorderColor = Color(0xFF333333),
                focusedContainerColor = Color(0xFF1E1E1E),
                unfocusedContainerColor = Color(0xFF1A1A1A),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            shape = RoundedCornerShape(24.dp)
        )

        if (isSearching) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(48.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = MusicGreen)
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Searching Spotify API...",
                        color = MusicGreen,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (songs.isEmpty()) {
                    item {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(48.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(Icons.Default.MusicNote, contentDescription = "No results", tint = Color.DarkGray, modifier = Modifier.size(64.dp))
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("No songs found", color = Color.Gray, fontWeight = FontWeight.Bold)
                            Text("Try searching for titles or artists in your library", color = Color.Gray, fontSize = 12.sp)
                        }
                    }
                } else {
                    items(songs) { song ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFF161616), shape = RoundedCornerShape(8.dp))
                                .spotifyClickable { onSongClick(song) }
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .background(Color(0xFF222222), shape = RoundedCornerShape(4.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.MusicNote, contentDescription = "Song", tint = MusicGreen)
                            }
                            Spacer(modifier = Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(song.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    if (song.isHighQuality) {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Box(
                                            modifier = Modifier
                                                .background(Color(0xFFE5A93B), shape = RoundedCornerShape(3.dp))
                                                .padding(horizontal = 4.dp, vertical = 1.dp)
                                        ) {
                                            Text("HQ", color = Color.Black, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                                Text(song.artist, color = Color.Gray, fontSize = 12.sp)
                            }

                            // Action Controls
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                // Spotify Synced Like Heart Button
                                IconButton(onClick = { onLikeClick(song) }) {
                                    Icon(
                                        imageVector = if (song.isLiked) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                        contentDescription = "Like Song",
                                        tint = if (song.isLiked) MusicGreen else Color.Gray,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }

                                // Download Button Status
                                if (song.isDownloaded) {
                                    Icon(Icons.Default.DownloadDone, contentDescription = "Downloaded", tint = MusicGreen, modifier = Modifier.padding(8.dp))
                                } else {
                                    val progress = downloadProgress[song.id]
                                    if (progress != null) {
                                        CircularProgressIndicator(
                                            progress = { progress },
                                            color = MusicGreen,
                                            modifier = Modifier.size(24.dp),
                                            strokeWidth = 2.dp,
                                        )
                                    } else {
                                        IconButton(onClick = { onDownloadClick(song) }) {
                                            Icon(Icons.Default.Download, contentDescription = "Download", tint = Color.Gray)
                                        }
                                    }
                                }

                                IconButton(onClick = { onAddToPlaylistClick(song) }) {
                                    Icon(Icons.Default.Add, contentDescription = "Add to Playlist", tint = Color.White)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// --- Library Tab ---
@Composable
fun LibraryScreen(
    playlists: List<Playlist>,
    downloadedSongs: List<Song>,
    likedSongs: List<Song>,
    spotifyLinked: Boolean,
    onPlaylistClick: (Playlist) -> Unit,
    onCreatePlaylistClick: () -> Unit,
    onSongClick: (Song) -> Unit,
    onLikeClick: (Song) -> Unit
) {
    var selectedSubTab by remember { mutableStateOf("playlists") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .testTag("library_screen")
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Your Library",
                color = Color.White,
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold
            )
            if (selectedSubTab == "playlists") {
                IconButton(
                    onClick = onCreatePlaylistClick,
                    modifier = Modifier.background(MusicGreen, shape = CircleShape)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Create Playlist", tint = Color.Black)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Library Subtabs row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = { selectedSubTab = "playlists" },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedSubTab == "playlists") MusicGreen else Color(0xFF1E1E1E)
                )
            ) {
                Text("Playlists", color = if (selectedSubTab == "playlists") Color.Black else Color.White)
            }

            Button(
                onClick = { selectedSubTab = "offline" },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedSubTab == "offline") MusicGreen else Color(0xFF1E1E1E)
                )
            ) {
                Text("Offline", color = if (selectedSubTab == "offline") Color.Black else Color.White)
            }

            Button(
                onClick = { selectedSubTab = "liked" },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (selectedSubTab == "liked") MusicGreen else Color(0xFF1E1E1E)
                )
            ) {
                Text("Liked", color = if (selectedSubTab == "liked") Color.Black else Color.White)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            when (selectedSubTab) {
                "playlists" -> {
                    if (playlists.isEmpty()) {
                        item {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(48.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(Icons.Default.QueueMusic, contentDescription = "No playlist", tint = Color.DarkGray, modifier = Modifier.size(64.dp))
                                Spacer(modifier = Modifier.height(16.dp))
                                Text("No custom playlists", color = Color.Gray, fontWeight = FontWeight.Bold)
                                Text("Tap the + button to create a device-synced playlist!", color = Color.Gray, fontSize = 12.sp)
                            }
                        }
                    } else {
                        items(playlists) { playlist ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFF161616), shape = RoundedCornerShape(8.dp))
                                    .spotifyClickable { onPlaylistClick(playlist) }
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(52.dp)
                                        .background(Color(0xFF222222), shape = RoundedCornerShape(6.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.QueueMusic, contentDescription = "Playlist", tint = MusicGreen)
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(playlist.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    Text(playlist.description.ifEmpty { "Custom playlist" }, color = Color.Gray, fontSize = 12.sp)
                                }

                                // Sync Indicator Status (Real-time Cloud loop)
                                if (playlist.isSynced) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("Synced", color = MusicGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Icon(Icons.Default.CloudDone, contentDescription = "Synced", tint = MusicGreen, modifier = Modifier.size(16.dp))
                                    }
                                } else {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("Syncing", color = Color(0xFFFFD700), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Icon(Icons.Default.CloudSync, contentDescription = "Syncing", tint = Color(0xFFFFD700), modifier = Modifier.size(16.dp))
                                    }
                                }
                            }
                        }
                    }
                }
                "offline" -> {
                    if (downloadedSongs.isEmpty()) {
                        item {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(48.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(Icons.Default.Download, contentDescription = "No offline", tint = Color.DarkGray, modifier = Modifier.size(64.dp))
                                Spacer(modifier = Modifier.height(16.dp))
                                Text("Offline mode empty", color = Color.Gray, fontWeight = FontWeight.Bold)
                                Text("Download songs in the search tab to enable offline accessibility!", color = Color.Gray, fontSize = 12.sp)
                            }
                        }
                    } else {
                        items(downloadedSongs) { song ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFF161616), shape = RoundedCornerShape(8.dp))
                                    .spotifyClickable { onSongClick(song) }
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .background(Color(0xFF222222), shape = RoundedCornerShape(4.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.MusicNote, contentDescription = "Song", tint = MusicGreen)
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(song.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text(song.artist, color = Color.Gray, fontSize = 12.sp)
                                }
                                Icon(Icons.Default.DownloadDone, contentDescription = "Available Offline", tint = MusicGreen)
                            }
                        }
                    }
                }
                "liked" -> {
                    if (likedSongs.isEmpty()) {
                        item {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(48.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(Icons.Default.FavoriteBorder, contentDescription = "No likes", tint = Color.DarkGray, modifier = Modifier.size(64.dp))
                                Spacer(modifier = Modifier.height(16.dp))
                                Text("No liked songs yet", color = Color.Gray, fontWeight = FontWeight.Bold)
                                Text("Tap the heart icon in the music player to add tracks!", color = Color.Gray, fontSize = 12.sp)
                            }
                        }
                    } else {
                        items(likedSongs) { song ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color(0xFF161616), shape = RoundedCornerShape(8.dp))
                                    .spotifyClickable { onSongClick(song) }
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .background(Color(0xFF222222), shape = RoundedCornerShape(4.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.MusicNote, contentDescription = "Song", tint = MusicGreen)
                                }
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(song.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text(song.artist, color = Color.Gray, fontSize = 12.sp)
                                }
                                IconButton(onClick = { onLikeClick(song) }) {
                                    Icon(
                                        imageVector = Icons.Default.Favorite,
                                        contentDescription = "Liked Status",
                                        tint = MusicGreen
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// --- Playlist Detail Subview ---
@Composable
fun PlaylistDetailScreen(
    playlistWithSongs: PlaylistWithSongs?,
    onBackClick: () -> Unit,
    onSongClick: (Song) -> Unit,
    onRemoveSong: (String) -> Unit,
    onLikeClick: (Song) -> Unit
) {
    if (playlistWithSongs == null) return

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            IconButton(onClick = onBackClick) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(playlistWithSongs.playlist.name, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = if (playlistWithSongs.playlist.isSynced) "Synced to Devices" else "Syncing to Devices...",
                        color = if (playlistWithSongs.playlist.isSynced) MusicGreen else Color(0xFFFFD700),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = if (playlistWithSongs.playlist.isSynced) Icons.Default.CloudDone else Icons.Default.CloudSync,
                        contentDescription = "Sync status",
                        tint = if (playlistWithSongs.playlist.isSynced) MusicGreen else Color(0xFFFFD700),
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(playlistWithSongs.playlist.description, color = Color.Gray, fontSize = 13.sp)

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (playlistWithSongs.songs.isEmpty()) {
                item {
                    Text("This playlist is empty. Add songs from the Search tab!", color = Color.Gray, fontSize = 13.sp)
                }
            } else {
                items(playlistWithSongs.songs) { song ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF161616), shape = RoundedCornerShape(8.dp))
                            .spotifyClickable { onSongClick(song) }
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .background(Color(0xFF222222), shape = RoundedCornerShape(4.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.MusicNote, contentDescription = "Song", tint = MusicGreen)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(song.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(song.artist, color = Color.Gray, fontSize = 11.sp)
                        }
                        // Spotify Synced Like button
                        IconButton(onClick = { onLikeClick(song) }) {
                            Icon(
                                imageVector = if (song.isLiked) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                contentDescription = "Like Song",
                                tint = if (song.isLiked) MusicGreen else Color.Gray,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        IconButton(onClick = { onRemoveSong(song.id) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Remove", tint = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}

// --- Social Hub Feed Tab ---
@Composable
fun SocialScreen(
    posts: List<SocialPost>,
    allSongs: List<Song>,
    currentSong: Song?,
    onLikePost: (SocialPost) -> Unit,
    onShareMessage: (String) -> Unit,
    onSongClick: (Song) -> Unit
) {
    var shareText by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .testTag("social_screen")
            .padding(16.dp)
    ) {
        Text(
            text = "Social Feed",
            color = Color.White,
            fontSize = 24.sp,
            fontWeight = FontWeight.ExtraBold,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // Share Dialog Panel if currentSong is loaded
        if (currentSong != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A)),
                border = BorderStroke(1.dp, Color(0xFF2B2B2B))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Currently Listening To:", color = MusicGreenBright, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text("'${currentSong.title}' by ${currentSong.artist}", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = shareText,
                        onValueChange = { shareText = it },
                        placeholder = { Text("Add your music thoughts...", color = Color.Gray, fontSize = 12.sp) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MusicGreen,
                            unfocusedBorderColor = Color(0xFF333333),
                            focusedContainerColor = Color(0xFF121212),
                            unfocusedContainerColor = Color(0xFF121212),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 2,
                        textStyle = LocalTextStyle.current.copy(fontSize = 13.sp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = {
                            if (shareText.isNotEmpty()) {
                                onShareMessage(shareText)
                                shareText = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = MusicGreen),
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Icon(Icons.Filled.Share, contentDescription = "Post", tint = Color.Black, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Post Track", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(posts) { post ->
                val associatedSong = allSongs.find { it.id == post.songId }
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF151515), shape = RoundedCornerShape(12.dp))
                        .border(1.dp, Color(0xFF242424), shape = RoundedCornerShape(12.dp))
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Avatar
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .background(Color(0xFF2E2E2E), shape = CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                post.username.take(1).uppercase(),
                                color = MusicGreenBright,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(post.username, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text(
                                text = android.text.format.DateUtils.getRelativeTimeSpanString(post.timestamp).toString(),
                                color = Color.Gray,
                                fontSize = 10.sp
                            )
                        }
                        IconButton(onClick = { onLikePost(post) }) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (post.isLikedByMe) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                    contentDescription = "Like",
                                    tint = if (post.isLikedByMe) MusicGreen else Color.Gray,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(post.likes.toString(), color = Color.White, fontSize = 12.sp)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = post.message,
                        color = Color.LightGray,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    )

                    // Associated Music Card attachment
                    associatedSong?.let { song ->
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFF1C1C1C), shape = RoundedCornerShape(8.dp))
                                .spotifyClickable { onSongClick(song) }
                                .padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color(0xFF2E2E2E), shape = RoundedCornerShape(4.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.MusicNote, contentDescription = "Song attachment", tint = MusicGreen)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(song.title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                Text(song.artist, color = Color.Gray, fontSize = 10.sp)
                            }
                            Icon(Icons.Filled.PlayArrow, contentDescription = "Listen", tint = MusicGreen, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}

// --- Floating Mini Player ---
@Composable
fun MiniPlayerBar(
    song: Song,
    isPlaying: Boolean,
    playbackPositionMs: Long,
    onPlayPauseToggle: () -> Unit,
    onBarClick: () -> Unit,
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    isShuffleEnabled: Boolean,
    isRepeatEnabled: Boolean,
    onToggleShuffle: () -> Unit,
    onToggleRepeat: () -> Unit,
    onSeek: (Long) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF121212))
            .border(1.dp, Color(0xFF222222), shape = RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp))
            .padding(vertical = 4.dp)
    ) {
        // Interactive Seek Slider at the top of the MiniPlayerBar
        Slider(
            value = playbackPositionMs.toFloat(),
            onValueChange = { onSeek(it.toLong()) },
            valueRange = 0f..(song.durationMs.toFloat().coerceAtLeast(1f)),
            colors = SliderDefaults.colors(
                thumbColor = MusicGreen,
                activeTrackColor = MusicGreen,
                inactiveTrackColor = Color(0xFF333333)
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .height(18.dp)
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Album art & Title clickable area to expand to fullscreen player
            Row(
                modifier = Modifier
                    .weight(1.2f)
                    .clickable { onBarClick() },
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFF222222)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.MusicNote, contentDescription = "Song artwork", tint = MusicGreen)
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = song.title,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = song.artist,
                        color = Color.Gray,
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Centralized/aligned Playback Control Buttons Row
            Row(
                modifier = Modifier.weight(1.8f),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Shuffle Button
                IconButton(onClick = onToggleShuffle, modifier = Modifier.size(36.dp)) {
                    Icon(
                        imageVector = Icons.Default.Shuffle,
                        contentDescription = "Shuffle",
                        tint = if (isShuffleEnabled) MusicGreen else Color.Gray,
                        modifier = Modifier.size(16.dp)
                    )
                }

                // Skip Previous
                IconButton(onClick = onPrevious, modifier = Modifier.size(36.dp)) {
                    Icon(
                        imageVector = Icons.Default.SkipPrevious,
                        contentDescription = "Skip Previous",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }

                // Play / Pause Circle Action
                IconButton(
                    onClick = onPlayPauseToggle,
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color.White, shape = CircleShape)
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                        contentDescription = "Play/Pause",
                        tint = Color.Black,
                        modifier = Modifier.size(22.dp)
                    )
                }

                // Skip Next
                IconButton(onClick = onNext, modifier = Modifier.size(36.dp)) {
                    Icon(
                        imageVector = Icons.Default.SkipNext,
                        contentDescription = "Skip Next",
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                }

                // Repeat Button
                IconButton(onClick = onToggleRepeat, modifier = Modifier.size(36.dp)) {
                    Icon(
                        imageVector = Icons.Default.Repeat,
                        contentDescription = "Repeat",
                        tint = if (isRepeatEnabled) MusicGreen else Color.Gray,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

// --- Fullscreen Premium Player Overlay ---
@Composable
fun FullscreenPlayerSheet(
    song: Song,
    isPlaying: Boolean,
    positionMs: Long,
    isHighQuality: Boolean,
    downloadProgress: Map<String, Float>,
    lyrics: String?,
    isLoadingLyrics: Boolean,
    isShuffleEnabled: Boolean,
    isRepeatEnabled: Boolean,
    onToggleShuffle: () -> Unit,
    onToggleRepeat: () -> Unit,
    onClose: () -> Unit,
    onPlayPauseToggle: () -> Unit,
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    onSeek: (Long) -> Unit,
    onLikeToggle: () -> Unit,
    onDownloadToggle: () -> Unit,
    onHighQualityToggle: () -> Unit,
    onShareToSocial: (String) -> Unit
) {
    var isSharingActive by remember { mutableStateOf(false) }
    var shareCaption by remember { mutableStateOf("Vibing to this on BeatStream! 🎧🔥") }

    val infiniteTransition = rememberInfiniteTransition(label = "rotating_artwork")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    // Backdrop Gradient representing deep soundscapes
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF1E3524), Color(0xFF040404)),
                    startY = 0f
                )
            )
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onClose) {
                    Icon(Icons.Filled.KeyboardArrowDown, contentDescription = "Collapse", tint = Color.White, modifier = Modifier.size(32.dp))
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("PLAYING FROM LIBRARY", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    Text(song.album, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
                IconButton(onClick = onHighQualityToggle) {
                    Icon(
                        imageVector = if (isHighQuality) Icons.Filled.GraphicEq else Icons.Outlined.GraphicEq,
                        contentDescription = "Toggle HQ",
                        tint = if (isHighQuality) Color(0xFFE5A93B) else Color.Gray
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Rotating Vinyl Artwork placeholder representing high quality
            Box(
                modifier = Modifier
                    .size(260.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF090909))
                    .border(4.dp, if (isPlaying) MusicGreen else Color.DarkGray, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(240.dp)
                        .clip(CircleShape)
                        .rotate(if (isPlaying) rotation else 0f)
                        .background(
                            Brush.sweepGradient(
                                colors = listOf(Color(0xFF121212), Color(0xFF2A2A2A), Color(0xFF121212))
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.MusicNote, contentDescription = "Artwork", tint = MusicGreen, modifier = Modifier.size(96.dp))
                }
                // Center pin
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .background(Color.Black, shape = CircleShape)
                        .border(1.dp, Color.DarkGray, CircleShape)
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Song Info & HQ Tag
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(song.title, color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                        if (isHighQuality) {
                            Spacer(modifier = Modifier.width(8.dp))
                            Box(
                                modifier = Modifier
                                    .background(Color(0xFFE5A93B), shape = RoundedCornerShape(4.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text("320kbps", color = Color.Black, fontSize = 9.sp, fontWeight = FontWeight.ExtraBold)
                            }
                        }
                    }
                    Text(song.artist, color = Color.Gray, fontSize = 16.sp, fontWeight = FontWeight.Medium)
                }

                // Favorite Checkbox
                IconButton(onClick = onLikeToggle) {
                    Icon(
                        imageVector = if (song.isLiked) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = "Like Track",
                        tint = if (song.isLiked) MusicGreen else Color.White,
                        modifier = Modifier.size(28.dp)
                    )
                }

                // Download Checkbox
                if (song.isDownloaded) {
                    IconButton(onClick = onDownloadToggle) {
                        Icon(Icons.Default.DownloadDone, contentDescription = "Downloaded", tint = MusicGreen, modifier = Modifier.size(28.dp))
                    }
                } else {
                    val progress = downloadProgress[song.id]
                    if (progress != null) {
                        CircularProgressIndicator(
                            progress = { progress },
                            color = MusicGreen,
                            modifier = Modifier.size(28.dp),
                            strokeWidth = 3.dp,
                        )
                    } else {
                        IconButton(onClick = onDownloadToggle) {
                            Icon(Icons.Default.Download, contentDescription = "Download Track", tint = Color.White, modifier = Modifier.size(28.dp))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Progress Bar Slider
            val progress = (positionMs.toFloat() / song.durationMs).coerceIn(0f, 1f)
            Slider(
                value = progress,
                onValueChange = { onSeek((it * song.durationMs).toLong()) },
                colors = SliderDefaults.colors(
                    thumbColor = Color.White,
                    activeTrackColor = MusicGreen,
                    inactiveTrackColor = Color.DarkGray
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(formatDuration(positionMs), color = Color.Gray, fontSize = 12.sp)
                Text(formatDuration(song.durationMs), color = Color.Gray, fontSize = 12.sp)
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Core Audio Controls
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Shuffle button
                IconButton(onClick = onToggleShuffle, modifier = Modifier.size(48.dp)) {
                    Icon(
                        imageVector = Icons.Default.Shuffle,
                        contentDescription = "Shuffle",
                        tint = if (isShuffleEnabled) MusicGreen else Color.Gray,
                        modifier = Modifier.size(24.dp)
                    )
                }

                IconButton(onClick = onPrevious, modifier = Modifier.size(48.dp)) {
                    Icon(Icons.Filled.SkipPrevious, contentDescription = "Previous", tint = Color.White, modifier = Modifier.size(36.dp))
                }

                IconButton(
                    onClick = onPlayPauseToggle,
                    modifier = Modifier
                        .size(64.dp)
                        .background(Color.White, shape = CircleShape)
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                        contentDescription = "Play/Pause",
                        tint = Color.Black,
                        modifier = Modifier.size(36.dp)
                    )
                }

                IconButton(onClick = onNext, modifier = Modifier.size(48.dp)) {
                    Icon(Icons.Filled.SkipNext, contentDescription = "Next", tint = Color.White, modifier = Modifier.size(36.dp))
                }

                // Repeat button
                IconButton(onClick = onToggleRepeat, modifier = Modifier.size(48.dp)) {
                    Icon(
                        imageVector = Icons.Default.Repeat,
                        contentDescription = "Repeat",
                        tint = if (isRepeatEnabled) MusicGreen else Color.Gray,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Lyrics Box or Share Caption Input
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .background(Color(0xFF2E1A1A).copy(alpha = 0.3f), shape = RoundedCornerShape(12.dp))
                    .border(1.dp, Color(0xFF3E2A2A).copy(alpha = 0.5f), shape = RoundedCornerShape(12.dp))
                    .padding(16.dp)
            ) {
                if (isSharingActive) {
                    Column(modifier = Modifier.fillMaxSize()) {
                        Text("Share with Friends on social feed:", color = MusicGreenBright, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        OutlinedTextField(
                            value = shareCaption,
                            onValueChange = { shareCaption = it },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MusicGreen,
                                unfocusedBorderColor = Color(0xFF444444),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            ),
                            modifier = Modifier.weight(1f).fillMaxWidth(),
                            textStyle = LocalTextStyle.current.copy(fontSize = 13.sp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.align(Alignment.End)) {
                            TextButton(onClick = { isSharingActive = false }) {
                                Text("Cancel", color = Color.Gray)
                            }
                            Button(
                                onClick = {
                                    onShareToSocial(shareCaption)
                                    isSharingActive = false
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = MusicGreen)
                            ) {
                                Text("Post", color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                } else {
                    Column(modifier = Modifier.fillMaxSize()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Real-time AI Lyrics", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            IconButton(onClick = { isSharingActive = true }, modifier = Modifier.size(24.dp)) {
                                Icon(Icons.Filled.Share, contentDescription = "Share", tint = Color.White, modifier = Modifier.size(16.dp))
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))

                        if (isLoadingLyrics) {
                            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = MusicGreen)
                            }
                        } else {
                            LazyColumn(modifier = Modifier.weight(1f)) {
                                item {
                                    Text(
                                        text = lyrics ?: "No lyrics available for this song.",
                                        color = Color.LightGray,
                                        fontSize = 14.sp,
                                        lineHeight = 20.sp,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// --- Spotify & Google Unified Connection Flow Dialog ---
@Composable
fun SpotifyLinkDialog(
    onDismiss: () -> Unit,
    onLinkSuccess: (String, String, String) -> Unit
) {
    var googleEmail by remember { mutableStateOf("rinkibairagi1989@gmail.com") }
    var phoneNumber by remember { mutableStateOf("+91 98765 43210") }
    var spotifyUsername by remember { mutableStateOf("rinki_spotify") }
    var isGoogleAuthenticated by remember { mutableStateOf(false) }
    var linkingProgress by remember { mutableStateOf(false) }
    var showGoogleAccountPicker by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF161616)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .border(1.dp, Color(0xFF2C2C2C), shape = RoundedCornerShape(16.dp))
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.AccountCircle,
                        contentDescription = "Google Link",
                        tint = Color(0xFF4285F4),
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.Default.Link,
                        contentDescription = "Link",
                        tint = Color.Gray,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.Default.GraphicEq,
                        contentDescription = "Spotify Link",
                        tint = MusicGreen,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                Text("Direct Account Bridge", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Sign in with Google and link your mobile phone to directly take your Spotify account to your Google profile for synchronized Phonk & folk music recommendations.",
                    color = Color.Gray,
                    fontSize = 11.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(20.dp))

                // STEP 1: Google Sign-In Section
                if (!isGoogleAuthenticated) {
                    Button(
                        onClick = { showGoogleAccountPicker = true },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Text(
                                "G ",
                                color = Color(0xFF4285F4),
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 18.sp
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                "Sign in with Google",
                                color = Color.Black,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }

                    if (showGoogleAccountPicker) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF222222)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    isGoogleAuthenticated = true
                                    showGoogleAccountPicker = false
                                }
                                .padding(4.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AccountCircle,
                                    contentDescription = "User Email",
                                    tint = MusicGreen,
                                    modifier = Modifier.size(24.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text("Rinki Bairagi", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    Text(googleEmail, color = Color.Gray, fontSize = 11.sp)
                                }
                            }
                        }
                    }
                } else {
                    // Google Signed In State Indicator
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E2E1E)),
                        border = BorderStroke(1.dp, MusicGreen.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = "Signed In",
                                tint = MusicGreen,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("Signed in via Google", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text(googleEmail, color = Color.Gray, fontSize = 11.sp)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // STEP 2: Phone Number Input (Enabled after Google Sign In or by default)
                OutlinedTextField(
                    value = phoneNumber,
                    onValueChange = { phoneNumber = it },
                    label = { Text("Mobile Number") },
                    leadingIcon = {
                        Icon(Icons.Default.Phone, contentDescription = "Phone Icon", tint = Color.Gray)
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MusicGreen,
                        unfocusedBorderColor = Color(0xFF444444),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                // STEP 3: Spotify Username Input
                OutlinedTextField(
                    value = spotifyUsername,
                    onValueChange = { spotifyUsername = it },
                    label = { Text("Spotify Account Username") },
                    leadingIcon = {
                        Icon(Icons.Default.GraphicEq, contentDescription = "Spotify Icon", tint = Color.Gray)
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MusicGreen,
                        unfocusedBorderColor = Color(0xFF444444),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(24.dp))

                if (linkingProgress) {
                    CircularProgressIndicator(color = MusicGreen)
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End
                    ) {
                        TextButton(onClick = onDismiss) {
                            Text("Cancel", color = Color.Gray)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Button(
                            onClick = {
                                if (spotifyUsername.isNotEmpty()) {
                                    linkingProgress = true
                                    onLinkSuccess(googleEmail, phoneNumber, spotifyUsername)
                                }
                            },
                            enabled = isGoogleAuthenticated || spotifyUsername.isNotEmpty(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MusicGreen,
                                disabledContainerColor = Color.DarkGray
                            )
                        ) {
                            Text("Bridge Accounts", color = Color.Black, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// --- Custom Playlist Creation Dialog ---
@Composable
fun CreatePlaylistDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text("Create Custom Playlist", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Playlist Title") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MusicGreen,
                        unfocusedBorderColor = Color(0xFF444444),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = desc,
                    onValueChange = { desc = it },
                    label = { Text("Description (Optional)") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MusicGreen,
                        unfocusedBorderColor = Color(0xFF444444),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    maxLines = 3
                )

                Spacer(modifier = Modifier.height(24.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel", color = Color.Gray)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Button(
                        onClick = {
                            if (name.isNotEmpty()) {
                                onConfirm(name, desc)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = MusicGreen)
                    ) {
                        Text("Create & Sync", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// --- Add Track To Playlist Dialog ---
@Composable
fun AddToPlaylistDialog(
    song: Song,
    playlists: List<Playlist>,
    onDismiss: () -> Unit,
    onPlaylistSelected: (Long) -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text("Add Track to Playlist", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                Text("Select a custom synced playlist to add '${song.title}':", color = Color.Gray, fontSize = 11.sp)
                Spacer(modifier = Modifier.height(16.dp))

                if (playlists.isEmpty()) {
                    Text("No playlists available. Please create one first in your Library tab!", color = Color.Gray, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                } else {
                    LazyColumn(
                        modifier = Modifier.heightIn(max = 200.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(playlists) { playlist ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onPlaylistSelected(playlist.playlistId) }
                                    .background(Color(0xFF2A2A2A), shape = RoundedCornerShape(8.dp))
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.QueueMusic, contentDescription = "Playlist icon", tint = MusicGreen, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(playlist.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                TextButton(onClick = onDismiss, modifier = Modifier.align(Alignment.End)) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        }
    }
}

// --- Helper Functions ---
fun formatDuration(ms: Long): String {
    val totalSecs = ms / 1000
    val mins = totalSecs / 60
    val secs = totalSecs % 60
    return String.format("%02d:%02d", mins, secs)
}

@Composable
fun Modifier.spotifyClickable(
    enabled: Boolean = true,
    onClick: () -> Unit
): Modifier {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val isHovered by interactionSource.collectIsHoveredAsState()

    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.96f else if (isHovered) 1.02f else 1.0f,
        animationSpec = spring(stiffness = Spring.StiffnessLow),
        label = "click_scale"
    )

    val backgroundColor by animateColorAsState(
        targetValue = if (isPressed) Color(0xFF222222) else if (isHovered) Color(0xFF1C1C1C) else Color.Transparent,
        animationSpec = tween(durationMillis = 150),
        label = "click_bg"
    )

    return this
        .graphicsLayer(scaleX = scale, scaleY = scale)
        .background(backgroundColor, shape = RoundedCornerShape(8.dp))
        .clickable(
            interactionSource = interactionSource,
            indication = androidx.compose.foundation.LocalIndication.current,
            enabled = enabled,
            onClick = onClick
        )
}
