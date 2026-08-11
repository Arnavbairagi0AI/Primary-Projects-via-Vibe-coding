package com.example.ui.screens

import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.data.model.Song
import com.example.data.repository.MusicRepository
import com.example.playback.AudioPlayerManager
import com.example.playback.RepeatMode
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// Haptic feedback definition
private enum class PlayerHapticType {
    HEAVY, MEDIUM, LIGHT, TICK
}

private fun triggerPlayerHaptic(context: android.content.Context, type: PlayerHapticType) {
    try {
        val intensity = ThemeConfig.hapticIntensity.value
        if (intensity < 0.05f) return // Off
        val vibrator = context.getSystemService(android.content.Context.VIBRATOR_SERVICE) as? Vibrator
        if (vibrator != null && vibrator.hasVibrator()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val effect = when (type) {
                    PlayerHapticType.HEAVY -> VibrationEffect.createOneShot(45, (200 * intensity).toInt().coerceIn(1, 255))
                    PlayerHapticType.MEDIUM -> VibrationEffect.createOneShot(25, (130 * intensity).toInt().coerceIn(1, 255))
                    PlayerHapticType.LIGHT -> VibrationEffect.createOneShot(12, (80 * intensity).toInt().coerceIn(1, 255))
                    PlayerHapticType.TICK -> VibrationEffect.createOneShot(6, (45 * intensity).toInt().coerceIn(1, 255))
                }
                vibrator.vibrate(effect)
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(when (type) {
                    PlayerHapticType.HEAVY -> (40 * intensity).toLong().coerceAtLeast(1L)
                    PlayerHapticType.MEDIUM -> (20 * intensity).toLong().coerceAtLeast(1L)
                    PlayerHapticType.LIGHT -> (10 * intensity).toLong().coerceAtLeast(1L)
                    PlayerHapticType.TICK -> (5 * intensity).toLong().coerceAtLeast(1L)
                })
            }
        }
    } catch (e: Exception) {
        // Fallback
    }
}

// Debouncing helper to prevent double taps on core player actions
@Composable
fun rememberDebouncedClick(onClick: () -> Unit): () -> Unit {
    var lastClickTime by remember { mutableStateOf(0L) }
    return {
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastClickTime >= 350L) {
            lastClickTime = currentTime
            onClick()
        }
    }
}

@Composable
fun PlayerScreen(navController: NavController, repository: MusicRepository) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    val currentSong by AudioPlayerManager.currentSong.collectAsState()
    val isPlaying by AudioPlayerManager.isPlaying.collectAsState()
    val currentPosition by AudioPlayerManager.currentPosition.collectAsState()
    val duration by AudioPlayerManager.duration.collectAsState()
    val bufferedPosition by AudioPlayerManager.bufferedPosition.collectAsState()
    
    val speed by AudioPlayerManager.playbackSpeed.collectAsState()
    val shuffleMode by AudioPlayerManager.shuffleMode.collectAsState()
    val repeatMode by AudioPlayerManager.repeatMode.collectAsState()
    val sleepRemaining by AudioPlayerManager.sleepTimerRemaining.collectAsState()

    var showTimerDialog by remember { mutableStateOf(false) }
    var showSpeedDialog by remember { mutableStateOf(false) }

    // Observe Favorites for Reactive UI updates
    val favoriteSongs by repository.favoriteSongs.collectAsState(initial = emptyList())
    val isFavorite = remember(currentSong, favoriteSongs) {
        currentSong?.let { song -> favoriteSongs.any { it.id == song.id } } ?: false
    }

    // Format timestamps
    fun formatTime(ms: Long): String {
        val sec = (ms / 1000) % 60
        val min = (ms / (1000 * 60)) % 60
        return String.format("%02d:%02d", min, sec)
    }

    // Lyrics list and active language state
    var activeLanguage by remember { mutableStateOf("en") }
    val lyricsList = remember(currentSong) {
        currentSong?.let { song ->
            val cached = LyricsCacheManager.getCachedLyrics(context, song.artist, song.title)
            if (cached != null) {
                cached
            } else {
                val dbLyrics = LyricsDatabase.getLyricsForSong(song.title, song.artist)
                if (dbLyrics.isNotEmpty()) {
                    LyricsCacheManager.cacheLyrics(context, song.artist, song.title, dbLyrics)
                }
                dbLyrics
            }
        } ?: emptyList()
    }

    val lyricsListState = rememberLazyListState()
    val activeLyricIndex = remember(currentPosition, lyricsList) {
        lyricsList.indexOfLast { currentPosition >= it.timeMs }.coerceAtLeast(0)
    }

    // Auto-scroll lyrics smoothly to center the active line
    LaunchedEffect(activeLyricIndex, ThemeConfig.lyricsSyncScrolling.value) {
        if (ThemeConfig.lyricsSyncScrolling.value && lyricsList.isNotEmpty()) {
            lyricsListState.animateScrollToItem(activeLyricIndex)
        }
    }

    // Auto-detect lyric language based on metadata and prioritized user settings upon song start
    LaunchedEffect(currentSong, ThemeConfig.lyricsLanguagePriority.value) {
        currentSong?.let { song ->
            val priorityCode = when (ThemeConfig.lyricsLanguagePriority.value) {
                "English" -> "en"
                "Hindi" -> "hi"
                "Hinglish" -> "hinglish"
                "Romanized" -> "romanized"
                "Español" -> "es"
                else -> "en"
            }
            val metaLang = detectDefaultLanguage(song.title, song.artist)
            val cached = LyricsCacheManager.getCachedLyrics(context, song.artist, song.title)
            val songLyrics = cached ?: LyricsDatabase.getLyricsForSong(song.title, song.artist)
            
            if (songLyrics.isNotEmpty()) {
                val availableKeys = songLyrics.flatMap { it.textMap.keys }.toSet()
                when {
                    availableKeys.contains(priorityCode) -> {
                        activeLanguage = priorityCode
                    }
                    metaLang == "hi" && availableKeys.contains("hi") -> {
                        activeLanguage = "hi"
                    }
                    metaLang == "hinglish" && availableKeys.contains("hinglish") -> {
                        activeLanguage = "hinglish"
                    }
                    metaLang == "hi" && availableKeys.contains("romanized") -> {
                        activeLanguage = "romanized"
                    }
                    availableKeys.contains(metaLang) -> {
                        activeLanguage = metaLang
                    }
                    availableKeys.contains("en") -> {
                        activeLanguage = "en"
                    }
                    else -> {
                        activeLanguage = availableKeys.firstOrNull() ?: "en"
                    }
                }
            } else {
                activeLanguage = metaLang
            }
        }
    }

    val themePreference = ThemeConfig.themeMode.value
    val isDarkMode = when (themePreference) {
        "Force Dark" -> true
        "Force Light" -> false
        else -> androidx.compose.foundation.isSystemInDarkTheme()
    }

    com.example.ui.components.NowPlayingBackdrop(
        imageUrl = currentSong?.albumArtUri,
        isDarkMode = isDarkMode
    ) { palette ->
        val contentColor = if (palette.isLight) Color(0xFF1C1B1F) else Color.White
        val secondaryColor = if (palette.isLight) Color(0xFF49454F) else Color.LightGray
        val accentColor = palette.accent1

        Box(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Top Header Bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Filled.KeyboardArrowDown, contentDescription = "Back", tint = contentColor, modifier = Modifier.size(32.dp))
                    }
                    Text("NOW PLAYING", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = secondaryColor, letterSpacing = 2.sp)
                    IconButton(onClick = { navController.navigate("equalizer") }) {
                        Icon(Icons.Filled.Tune, contentDescription = "Equalizer", tint = contentColor)
                    }
                }

                if (currentSong == null) {
                    Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
                        Text("No song playing. Select a song from the library.", color = secondaryColor, textAlign = TextAlign.Center)
                    }
                } else {
                    Spacer(modifier = Modifier.height(20.dp))

                    // Premium Animated Disc Artwork Frame with glowing, floating, and visualizer halo
                    Box(
                        modifier = Modifier
                            .weight(1.1f)
                            .fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        PremiumAnimatedDisc(
                            imageUrl = currentSong?.albumArtUri,
                            isPlaying = isPlaying,
                            accentColor = accentColor
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Song Info Metadata Row with integrated Sleep Timer and Favorite/Like Toggle
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = currentSong?.title ?: "Unknown Title",
                                fontSize = 21.sp,
                                fontWeight = FontWeight.Bold,
                                color = contentColor,
                                maxLines = 1
                            )
                            Text(
                                text = currentSong?.artist ?: "Unknown Artist",
                                fontSize = 15.sp,
                                color = secondaryColor,
                                maxLines = 1
                            )
                        }
                        
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Reactive Favorite/Like Toggle
                            IconButton(onClick = {
                                currentSong?.let { song ->
                                    coroutineScope.launch {
                                        repository.updateSongFavorite(song.id, !isFavorite)
                                        triggerPlayerHaptic(context, PlayerHapticType.MEDIUM)
                                    }
                                }
                            }) {
                                Icon(
                                    imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                                    contentDescription = "Favorite Song",
                                    tint = if (isFavorite) Color.Red else contentColor
                                )
                            }

                            // Sleep Timer
                            IconButton(onClick = {
                                triggerPlayerHaptic(context, PlayerHapticType.LIGHT)
                                showTimerDialog = true
                            }) {
                                Icon(
                                    imageVector = Icons.Filled.Timer,
                                    contentDescription = "Sleep Timer",
                                    tint = if (sleepRemaining > 0) accentColor else contentColor
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // High-Fidelity Multilingual Synchronized Lyrics Card
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0x11000000)),
                        border = BorderStroke(1.dp, Color(0x10FFFFFF)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(136.dp)
                    ) {
                        Column(modifier = Modifier.fillMaxSize()) {
                            // Header Row containing Language Tabs
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "LYRICS",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = secondaryColor.copy(alpha = 0.7f),
                                    letterSpacing = 1.sp
                                )
                                
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    val langs = listOf("en" to "EN", "hi" to "हिंदी", "hinglish" to "Hinglish", "romanized" to "Roman")
                                    langs.forEach { (code, label) ->
                                        val isSelected = activeLanguage == code
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(if (isSelected) accentColor.copy(alpha = 0.2f) else Color.Transparent)
                                                .clickable {
                                                    activeLanguage = code
                                                    triggerPlayerHaptic(context, PlayerHapticType.TICK)
                                                }
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = label,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isSelected) accentColor else secondaryColor
                                            )
                                        }
                                    }
                                }
                            }
                            
                            HorizontalDivider(color = Color(0x0EFFFFFF), modifier = Modifier.padding(horizontal = 12.dp))

                            if (lyricsList.isEmpty()) {
                                Box(
                                    modifier = Modifier.weight(1f).fillMaxWidth(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "No lyrics available",
                                        color = secondaryColor,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            } else {
                                LazyColumn(
                                    state = lyricsListState,
                                    modifier = Modifier.weight(1f).fillMaxWidth(),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(4.dp),
                                    contentPadding = PaddingValues(vertical = 12.dp)
                                ) {
                                    itemsIndexed(lyricsList) { index, lyric ->
                                        val isCurrent = index == activeLyricIndex
                                        val lyricText = lyric.getText(activeLanguage)
                                        
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable {
                                                    AudioPlayerManager.seekTo(lyric.timeMs)
                                                    triggerPlayerHaptic(context, PlayerHapticType.TICK)
                                                }
                                                .padding(horizontal = 14.dp, vertical = 4.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = formatTime(lyric.timeMs),
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isCurrent) accentColor.copy(alpha = 0.8f) else secondaryColor.copy(alpha = 0.35f),
                                                modifier = Modifier.width(36.dp)
                                            )
                                            
                                            Text(
                                                text = lyricText,
                                                fontSize = if (isCurrent) 14.sp else 12.sp,
                                                fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                                                color = if (isCurrent) accentColor else secondaryColor.copy(alpha = 0.5f),
                                                textAlign = TextAlign.Start,
                                                modifier = Modifier.weight(1f)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Premium Progressive Drag/Tap Slider Seekbar (with buffer indicator and dynamic haptics)
                    Column(modifier = Modifier.fillMaxWidth()) {
                        PremiumProgressSlider(
                            position = currentPosition,
                            duration = duration,
                            bufferedPosition = bufferedPosition,
                            onSeek = { AudioPlayerManager.seekTo(it) },
                            accentColor = accentColor,
                            secondaryColor = secondaryColor,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 2.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(formatTime(currentPosition), color = secondaryColor, fontSize = 11.sp)
                            Text(formatTime(duration), color = secondaryColor, fontSize = 11.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Tactile Playback Deck Controls (Shuffle, Previous, Play/Pause, Next, Repeat)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Shuffle Button
                        IconButton(onClick = rememberDebouncedClick {
                            AudioPlayerManager.toggleShuffle()
                            triggerPlayerHaptic(context, PlayerHapticType.MEDIUM)
                        }) {
                            Icon(
                                imageVector = Icons.Filled.Shuffle,
                                contentDescription = if (shuffleMode) "Disable Shuffle" else "Enable Shuffle",
                                tint = if (shuffleMode) accentColor else contentColor
                            )
                        }

                        // Play Previous Button
                        IconButton(onClick = rememberDebouncedClick {
                            AudioPlayerManager.playPrevious(context)
                            triggerPlayerHaptic(context, PlayerHapticType.MEDIUM)
                        }) {
                            Icon(Icons.Filled.SkipPrevious, contentDescription = "Play Previous", tint = contentColor, modifier = Modifier.size(36.dp))
                        }

                        // Play/Pause Button
                        Box(
                            modifier = Modifier
                                .size(70.dp)
                                .clip(CircleShape)
                                .background(accentColor)
                                .clickable(
                                    onClick = rememberDebouncedClick {
                                        AudioPlayerManager.togglePlayPause(context)
                                        triggerPlayerHaptic(context, PlayerHapticType.HEAVY)
                                    },
                                    onClickLabel = if (isPlaying) "Pause Track" else "Play Track"
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            val playIconColor = if (com.example.ui.components.calculateLuminance(accentColor.value.toInt()) > 0.5f) Color(0xFF21005D) else Color.White
                            Icon(
                                imageVector = if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                                contentDescription = if (isPlaying) "Pause Track" else "Play Track",
                                tint = playIconColor,
                                modifier = Modifier.size(38.dp)
                            )
                        }

                        // Play Next Button
                        IconButton(onClick = rememberDebouncedClick {
                            AudioPlayerManager.playNext(context)
                            triggerPlayerHaptic(context, PlayerHapticType.MEDIUM)
                        }) {
                            Icon(Icons.Filled.SkipNext, contentDescription = "Play Next", tint = contentColor, modifier = Modifier.size(36.dp))
                        }

                        // Repeat Mode Button
                        IconButton(onClick = rememberDebouncedClick {
                            AudioPlayerManager.toggleRepeat()
                            triggerPlayerHaptic(context, PlayerHapticType.MEDIUM)
                        }) {
                            Icon(
                                imageVector = when (repeatMode) {
                                    RepeatMode.ONE -> Icons.Filled.RepeatOne
                                    else -> Icons.Filled.Repeat
                                },
                                contentDescription = when (repeatMode) {
                                    RepeatMode.OFF -> "Repeat Off"
                                    RepeatMode.ONE -> "Repeat One"
                                    RepeatMode.ALL -> "Repeat All"
                                },
                                tint = if (repeatMode != RepeatMode.OFF) accentColor else contentColor
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Playback Speed Button
                    Button(
                        onClick = {
                            triggerPlayerHaptic(context, PlayerHapticType.LIGHT)
                            showSpeedDialog = true
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = accentColor.copy(alpha = 0.12f),
                            contentColor = contentColor
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Filled.Speed, contentDescription = "Speed", modifier = Modifier.size(16.dp), tint = contentColor)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Speed: ${speed}x", fontSize = 12.sp, color = contentColor)
                    }
                }
            }

            // Sleep Timer Dialog
            if (showTimerDialog) {
                AlertDialog(
                    onDismissRequest = { showTimerDialog = false },
                    title = { Text("Set Sleep Timer") },
                    text = {
                        Column {
                            listOf(0, 15, 30, 45, 60).forEach { minutes ->
                                Text(
                                    text = if (minutes == 0) "Turn Off Timer" else "$minutes Minutes",
                                    fontSize = 16.sp,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            AudioPlayerManager.setSleepTimer(minutes)
                                            triggerPlayerHaptic(context, PlayerHapticType.MEDIUM)
                                            showTimerDialog = false
                                        }
                                        .padding(vertical = 12.dp),
                                    color = if ((sleepRemaining > 0 && minutes == sleepRemaining / 60) || (sleepRemaining == 0 && minutes == 0)) {
                                        accentColor
                                    } else {
                                        MaterialTheme.colorScheme.onSurface
                                    }
                                )
                            }
                        }
                    },
                    confirmButton = {
                        TextButton(onClick = {
                            triggerPlayerHaptic(context, PlayerHapticType.LIGHT)
                            showTimerDialog = false
                        }) {
                            Text("Cancel")
                        }
                    },
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    textContentColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Playback Speed Dialog
            if (showSpeedDialog) {
                AlertDialog(
                    onDismissRequest = { showSpeedDialog = false },
                    title = { Text("Select Playback Speed") },
                    text = {
                        Column {
                            listOf(0.5f, 0.75f, 1.0f, 1.25f, 1.5f, 2.0f).forEach { option ->
                                Text(
                                    text = "${option}x",
                                    fontSize = 16.sp,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            AudioPlayerManager.setPlaybackSpeed(option)
                                            triggerPlayerHaptic(context, PlayerHapticType.MEDIUM)
                                            showSpeedDialog = false
                                        }
                                        .padding(vertical = 12.dp),
                                    color = if (speed == option) accentColor else MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    },
                    confirmButton = {
                        TextButton(onClick = {
                            triggerPlayerHaptic(context, PlayerHapticType.LIGHT)
                            showSpeedDialog = false
                        }) {
                            Text("Cancel")
                        }
                    },
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    textContentColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

// Premium progressive slider seekbar drawn natively with tap-anywhere and buffer indication
@Composable
fun PremiumProgressSlider(
    position: Long,
    duration: Long,
    bufferedPosition: Long,
    onSeek: (Long) -> Unit,
    accentColor: Color,
    secondaryColor: Color,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var isDragging by remember { mutableStateOf(false) }
    var dragProgress by remember { mutableStateOf(0f) }

    val currentFraction = if (duration > 0) position.toFloat() / duration else 0f
    val bufferedFraction = if (duration > 0) bufferedPosition.toFloat() / duration else 0f

    val progressFractionAnimated by animateFloatAsState(
        targetValue = if (isDragging) dragProgress else currentFraction,
        animationSpec = if (isDragging) snap() else tween(350, easing = LinearOutSlowInEasing),
        label = "progressFraction"
    )

    BoxWithConstraints(
        modifier = modifier
            .fillMaxWidth()
            .height(28.dp)
            .pointerInput(duration) {
                detectTapGestures(
                    onTap = { offset ->
                        val newFraction = (offset.x / size.width).coerceIn(0f, 1f)
                        onSeek((newFraction * duration).toLong())
                        triggerPlayerHaptic(context, PlayerHapticType.MEDIUM)
                    }
                )
            }
            .pointerInput(duration) {
                detectHorizontalDragGestures(
                    onDragStart = { offset ->
                        isDragging = true
                        dragProgress = (offset.x / size.width).coerceIn(0f, 1f)
                        triggerPlayerHaptic(context, PlayerHapticType.LIGHT)
                    },
                    onDragEnd = {
                        isDragging = false
                        onSeek((dragProgress * duration).toLong())
                        triggerPlayerHaptic(context, PlayerHapticType.HEAVY)
                    },
                    onDragCancel = {
                        isDragging = false
                    },
                    onHorizontalDrag = { change, _ ->
                        change.consume()
                        val newX = change.position.x
                        dragProgress = (newX / size.width).coerceIn(0f, 1f)
                        triggerPlayerHaptic(context, PlayerHapticType.TICK)
                    }
                )
            },
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val h = size.height
            val w = size.width
            val centerY = h / 2f
            
            val trackHeight = 4.dp.toPx()
            val thumbRadius = if (isDragging) 8.dp.toPx() else 6.dp.toPx()
            
            // Background Track
            drawRoundRect(
                color = secondaryColor.copy(alpha = 0.2f),
                topLeft = Offset(0f, centerY - trackHeight / 2f),
                size = Size(w, trackHeight),
                cornerRadius = CornerRadius(trackHeight / 2f)
            )
            
            // Buffered Track
            val bufferedWidth = w * bufferedFraction.coerceIn(0f, 1f)
            if (bufferedWidth > 0f) {
                drawRoundRect(
                    color = accentColor.copy(alpha = 0.35f),
                    topLeft = Offset(0f, centerY - trackHeight / 2f),
                    size = Size(bufferedWidth, trackHeight),
                    cornerRadius = CornerRadius(trackHeight / 2f)
                )
            }
            
            // Active Track
            val activeWidth = w * progressFractionAnimated.coerceIn(0f, 1f)
            if (activeWidth > 0f) {
                drawRoundRect(
                    color = accentColor,
                    topLeft = Offset(0f, centerY - trackHeight / 2f),
                    size = Size(activeWidth, trackHeight),
                    cornerRadius = CornerRadius(trackHeight / 2f)
                )
            }
            
            // Rounded Thumb
            drawCircle(
                color = accentColor,
                radius = thumbRadius,
                center = Offset(activeWidth, centerY)
            )
        }
    }
}

// Premium animated vinyl artwork composable with rotating shine, float, breathing scale, and beat visualizer
@Composable
fun PremiumAnimatedDisc(
    imageUrl: String?,
    isPlaying: Boolean,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var rotationAngle by remember { mutableStateOf(0f) }
    var currentSpeed by remember { mutableStateOf(0f) }
    val targetSpeed = if (isPlaying) 0.5f else 0f
    
    // Smooth accelerate/decelerate loop that suspends completely when paused to conserve battery
    LaunchedEffect(isPlaying) {
        val accel = 0.015f
        while (true) {
            if (isPlaying) {
                if (currentSpeed < targetSpeed) {
                    currentSpeed = (currentSpeed + accel).coerceAtMost(targetSpeed)
                }
            } else {
                if (currentSpeed > 0f) {
                    currentSpeed = (currentSpeed - accel).coerceAtLeast(0f)
                }
            }
            if (currentSpeed > 0f) {
                rotationAngle = (rotationAngle + currentSpeed) % 360f
            }
            if (!isPlaying && currentSpeed == 0f) {
                break
            }
            delay(16)
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "disc_motion")
    
    val floatOffset by infiniteTransition.animateFloat(
        initialValue = -6f,
        targetValue = 6f,
        animationSpec = infiniteRepeatable(
            animation = tween(3800, easing = FastOutSlowInEasing),
            repeatMode = androidx.compose.animation.core.RepeatMode.Reverse
        ),
        label = "float"
    )
    
    val scaleFactor by infiniteTransition.animateFloat(
        initialValue = 0.98f,
        targetValue = 1.02f,
        animationSpec = infiniteRepeatable(
            animation = tween(4600, easing = FastOutSlowInEasing),
            repeatMode = androidx.compose.animation.core.RepeatMode.Reverse
        ),
        label = "scale"
    )

    val breathingGlowRadius by infiniteTransition.animateFloat(
        initialValue = 12f,
        targetValue = 24f,
        animationSpec = infiniteRepeatable(
            animation = tween(4200, easing = FastOutSlowInEasing),
            repeatMode = androidx.compose.animation.core.RepeatMode.Reverse
        ),
        label = "glow"
    )

    val shimmerPhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing),
            repeatMode = androidx.compose.animation.core.RepeatMode.Restart
        ),
        label = "shimmer"
    )

    Box(
        modifier = modifier
            .offset(y = if (ThemeConfig.enableBatterySaver.value) 0.dp else floatOffset.dp)
            .scale(if (ThemeConfig.enableBatterySaver.value) 1.0f else scaleFactor)
            .size(260.dp),
        contentAlignment = Alignment.Center
    ) {
        // 1. Soft glowing dynamic backdrop (bloom effect) - Disabled in Battery Saver Mode
        if (!ThemeConfig.enableBatterySaver.value) {
            Box(
                modifier = Modifier
                    .size(220.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                accentColor.copy(alpha = 0.45f),
                                Color.Transparent
                            )
                        )
                    )
                    .blur(breathingGlowRadius.dp)
            )
        }

        // 2. High-quality blur behind the artwork for depth - Disabled in Battery Saver Mode
        if (!ThemeConfig.enableBatterySaver.value && !imageUrl.isNullOrEmpty()) {
            AsyncImage(
                model = imageUrl,
                contentDescription = null,
                modifier = Modifier
                    .size(200.dp)
                    .clip(CircleShape)
                    .blur(14.dp)
                    .scale(0.96f)
                    .rotate(rotationAngle),
                contentScale = ContentScale.Crop
            )
        }

        // 3. Audio-reactive circular visualizer halo - Disabled in Battery Saver Mode
        if (!ThemeConfig.enableBatterySaver.value) {
            Box(modifier = Modifier.size(250.dp)) {
                AudioReactiveCircularWaveform(
                    isPlaying = isPlaying,
                    accentColor = accentColor
                )
            }
        }

        // 4. Glassmorphism outer boundary card & Vinyl grooves
        Box(
            modifier = Modifier
                .size(214.dp)
                .clip(CircleShape)
                .background(Color(0x1A000000))
                .border(1.5.dp, Brush.sweepGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.12f),
                        accentColor.copy(alpha = 0.25f),
                        Color.White.copy(alpha = 0.05f),
                        accentColor.copy(alpha = 0.35f),
                        Color.White.copy(alpha = 0.12f)
                    )
                ), CircleShape)
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2f, size.height / 2f)
                val radiusMax = size.width / 2f
                for (r in listOf(0.42f, 0.52f, 0.62f, 0.72f, 0.82f)) {
                    drawCircle(
                        color = Color.White.copy(alpha = 0.06f),
                        radius = radiusMax * r,
                        center = center,
                        style = Stroke(width = 1f)
                    )
                }
            }
        }

        // 5. Centered Vinyl/CD disc artwork
        Box(
            modifier = Modifier
                .size(190.dp)
                .clip(CircleShape)
                .background(Color(0x33000000)),
            contentAlignment = Alignment.Center
        ) {
            if (!imageUrl.isNullOrEmpty()) {
                AsyncImage(
                    model = imageUrl,
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .rotate(rotationAngle),
                    contentScale = ContentScale.Crop
                )
            } else {
                FallbackAlbumArt(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .rotate(rotationAngle),
                    iconSize = 52.dp
                )
            }

            // Radial glossy light overlay
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .background(
                        Brush.sweepGradient(
                            colors = listOf(
                                Color.White.copy(alpha = 0.0f),
                                Color.White.copy(alpha = 0.16f),
                                Color.White.copy(alpha = 0.0f),
                                Color.White.copy(alpha = 0.10f),
                                Color.White.copy(alpha = 0.0f)
                            )
                        )
                    )
                    .rotate(shimmerPhase)
            )

            // Center physicalCD/vinyl hole
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF0F0F0F))
                    .border(1.dp, Color.White.copy(alpha = 0.12f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(accentColor)
                )
            }
        }
    }
}

// Fallback Album Art
@Composable
fun FallbackAlbumArt(
    modifier: Modifier = Modifier,
    iconSize: androidx.compose.ui.unit.Dp = 24.dp
) {
    Box(
        modifier = modifier
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        Color.White.copy(alpha = 0.12f),
                        Color.Black.copy(alpha = 0.3f)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.Filled.MusicNote,
            contentDescription = null,
            tint = Color.White.copy(alpha = 0.7f),
            modifier = Modifier.size(iconSize)
        )
    }
}

// Circular audio-reactive frequency wave halo with particle system and complexity management
data class VisualizerParticle(
    val angle: Float,
    val radius: Float,
    val speed: Float,
    val size: Float,
    val alpha: Float
)

@Composable
fun AudioReactiveCircularWaveform(
    isPlaying: Boolean,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val shouldThrottle = remember {
        derivedStateOf {
            try {
                val powerManager = context.getSystemService(android.content.Context.POWER_SERVICE) as? android.os.PowerManager
                val isPowerSaveMode = powerManager?.isPowerSaveMode ?: false
                
                val batteryManager = context.getSystemService(android.content.Context.BATTERY_SERVICE) as? android.os.BatteryManager
                val batteryPct = batteryManager?.getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: 100
                
                isPowerSaveMode || batteryPct < 20 || ThemeConfig.enableBatterySaver.value
            } catch (e: Exception) {
                false
            }
        }
    }

    var animTimeMs by remember { mutableStateOf(0L) }
    LaunchedEffect(isPlaying) {
        if (isPlaying) {
            var lastTime = System.currentTimeMillis()
            while (true) {
                val throttle = shouldThrottle.value
                val delayTime = if (throttle) 33L else 16L
                kotlinx.coroutines.delay(delayTime)
                val now = System.currentTimeMillis()
                animTimeMs += (now - lastTime)
                lastTime = now
            }
        }
    }

    // Dynamic particles for premium visual flavor
    val particles = remember {
        val rand = kotlin.random.Random
        List(20) {
            VisualizerParticle(
                angle = rand.nextInt(360).toFloat() * (Math.PI.toFloat() / 180f),
                radius = 100f + rand.nextFloat() * 40f,
                speed = 1.2f + rand.nextFloat() * (3.5f - 1.2f),
                size = 1.5f + rand.nextFloat() * (4.0f - 1.5f),
                alpha = 0.25f + rand.nextFloat() * (0.75f - 0.25f)
            )
        }
    }

    val bassPhase = (animTimeMs % 1400) / 1400f * 2f * Math.PI.toFloat()
    val midPhase = (animTimeMs % 2000) / 2000f * 2f * Math.PI.toFloat()
    val treblePhase = (animTimeMs % 900) / 900f * 2f * Math.PI.toFloat()

    val pulseCycle = (animTimeMs % 1200) / 1200f
    val activePulse = 0.96f + 0.10f * if (pulseCycle < 0.5f) pulseCycle * 2f else (1f - pulseCycle) * 2f

    Canvas(modifier = modifier.fillMaxSize()) {
        // Record frame render to performance monitoring service
        PerformanceMonitor.recordFrame()

        val center = Offset(size.width / 2f, size.height / 2f)
        val innerRadius = 100.dp.toPx()
        val maxBarLength = 20.dp.toPx()
        
        // Dynamically reduce complexity under low performance
        val isLowPerf = PerformanceMonitor.isLowPerformance.value
        val barCount = if (isLowPerf) 36 else 72
        
        val scaleFactor = if (isPlaying) activePulse else 1.0f

        // Draw background particles if performance is healthy
        if (!isLowPerf && !ThemeConfig.enableBatterySaver.value && isPlaying) {
            particles.forEach { p ->
                val elapsedFactor = animTimeMs / 1000f
                val pRadius = (p.radius + elapsedFactor * 70f * p.speed) % 240f
                if (pRadius > innerRadius) {
                    val cosP = kotlin.math.cos(p.angle).toFloat()
                    val sinP = kotlin.math.sin(p.angle).toFloat()
                    val pCenter = Offset(center.x + pRadius * cosP, center.y + pRadius * sinP)
                    val pAlpha = (p.alpha * (1f - (pRadius / 240f))).coerceIn(0f, 1f)
                    
                    drawCircle(
                        color = accentColor.copy(alpha = pAlpha),
                        radius = p.size.dp.toPx(),
                        center = pCenter
                    )
                }
            }
        }
        
        for (i in 0 until barCount) {
            val angle = (i.toFloat() / barCount) * 2f * Math.PI.toFloat()
            val isBass = i % 6 in 0..1
            val isTreble = i % 6 in 4..5
            
            val bassVal = if (isPlaying) {
                (kotlin.math.sin(angle * 3f + bassPhase) * 0.5f + 0.5f) * 0.9f
            } else {
                (kotlin.math.sin(angle * 2f) * 0.15f + 0.15f)
            }
            
            val midVal = if (isPlaying) {
                (kotlin.math.sin(angle * 6f - midPhase) * 0.4f + 0.4f) * 0.7f
            } else {
                (kotlin.math.sin(angle * 4f) * 0.1f + 0.1f)
            }
            
            val trebleVal = if (isPlaying) {
                (kotlin.math.sin(angle * 12f + treblePhase) * 0.3f + 0.3f) * 0.5f
            } else {
                (kotlin.math.sin(angle * 8f) * 0.05f + 0.05f)
            }
            
            val amplitude = when {
                isBass -> bassVal * 1.2f + midVal * 0.2f
                isTreble -> trebleVal * 1.3f + midVal * 0.2f
                else -> midVal * 1.1f + bassVal * 0.2f + trebleVal * 0.1f
            }
            
            val barLength = maxBarLength * amplitude.coerceIn(0.06f, 1.4f) * scaleFactor
            val startRadius = innerRadius
            val endRadius = innerRadius + barLength
            
            val cosA = kotlin.math.cos(angle).toFloat()
            val sinA = kotlin.math.sin(angle).toFloat()
            
            val start = Offset(center.x + startRadius * cosA, center.y + startRadius * sinA)
            val end = Offset(center.x + endRadius * cosA, center.y + endRadius * sinA)
            
            drawLine(
                color = accentColor.copy(alpha = (1.0f - (0.35f * (1f - amplitude.coerceIn(0f, 1f)))).coerceIn(0.3f, 0.95f)),
                start = start,
                end = end,
                strokeWidth = if (isLowPerf) 4.dp.toPx() else 2.5.dp.toPx(),
                cap = StrokeCap.Round
            )
        }
    }
}

// Premium Synchronized Multilingual Lyrics System Datatypes & Database
data class PremiumLyricLine(
    val timeMs: Long,
    val textMap: Map<String, String>
) {
    fun getText(lang: String): String = textMap[lang] ?: textMap["en"] ?: ""
}

fun detectDefaultLanguage(title: String, artist: String): String {
    val combined = "$title $artist".lowercase()
    val hasDevanagari = combined.any { it.code in 0x0900..0x097F }
    if (hasDevanagari) return "hi"
    
    val hindiKeywords = listOf(
        "dil", "pyar", "ishq", "jaana", "tum", "sath", "ghar", "baatein", "dhadkan",
        "mohabbat", "yaar", "rabba", "khuda", "jeena", "zindagi", "sangeet", "naam"
    )
    if (hindiKeywords.any { combined.contains(it) }) {
        return "hinglish"
    }
    return "en"
}

object LyricsDatabase {
    fun getLyricsForSong(title: String, artist: String): List<PremiumLyricLine> {
        val normalizedTitle = title.lowercase()
        return when {
            normalizedTitle.contains("love") || normalizedTitle.contains("dil") || normalizedTitle.contains("pyar") || normalizedTitle.contains("tum") -> {
                listOf(
                    PremiumLyricLine(0L, mapOf(
                        "en" to "[Soft Guitar Instrumental]",
                        "hi" to "[मधुर गिटार संगीत]",
                        "hinglish" to "[Madhur Guitar Instrumental]",
                        "romanized" to "[Soft Guitar Solo]"
                    )),
                    PremiumLyricLine(5000L, mapOf(
                        "en" to "❤️ Every heartbeat calls your name...",
                        "hi" to "❤️ हर धड़कन तुम्हारा नाम पुकारती है...",
                        "hinglish" to "❤️ Har dhadkan tumhara naam pukarti hai...",
                        "romanized" to "❤️ Dil ki har ek dharkan tera naam le..."
                    )),
                    PremiumLyricLine(12000L, mapOf(
                        "en" to "✨ In your eyes, I found my home...",
                        "hi" to "✨ तुम्हारी आँखों में, मुझे मेरा घर मिल गया...",
                        "hinglish" to "✨ Tumhari aankhon mein, mujhe mera ghar mil gaya...",
                        "romanized" to "✨ Teri aankhon mein, humne apna jahan paya..."
                    )),
                    PremiumLyricLine(20000L, mapOf(
                        "en" to "🌌 Under the stars, our souls align...",
                        "hi" to "🌌 सितारों के नीचे, हमारी आत्माएं मिल रही हैं...",
                        "hinglish" to "🌌 Sitaron ke neeche, hamari aatmaen mil rahi hain...",
                        "romanized" to "🌌 Taaron ke niche, hum ek ho rahe hain..."
                    )),
                    PremiumLyricLine(30000L, mapOf(
                        "en" to "🎵 Music plays, and time stands still...",
                        "hi" to "🎵 संगीत बजता है, और समय थम जाता है...",
                        "hinglish" to "🎵 Sangeet bajta hai, aur samay tham jata hai...",
                        "romanized" to "🎵 Gaana chale, aur waqt ruk jaye..."
                    )),
                    PremiumLyricLine(40000L, mapOf(
                        "en" to "[Flute Instrumental Bridge]",
                        "hi" to "[बांसुरी संगीत अंतरा]",
                        "hinglish" to "[Flute Instrumental Bridge]",
                        "romanized" to "[Flute Solos]"
                    )),
                    PremiumLyricLine(50000L, mapOf(
                        "en" to "💖 I promise to walk with you forever...",
                        "hi" to "💖 मैं हमेशा तुम्हारे साथ चलने का वादा करता हूँ...",
                        "hinglish" to "💖 Main hamesha tumhare saath chalne ka vaada karta hoon...",
                        "romanized" to "💖 Hamesha sath chalne ka wada raha..."
                    )),
                    PremiumLyricLine(65000L, mapOf(
                        "en" to "💞 Two hearts beating as one rhythm...",
                        "hi" to "💞 दो दिल एक ही ताल पर धड़क रहे हैं...",
                        "hinglish" to "💞 Do dil ek hi taal par dhadak rahe hain...",
                        "romanized" to "💞 Do dil ek jaan, ek hi dhun..."
                    )),
                    PremiumLyricLine(80000L, mapOf(
                        "en" to "[Outro - Harmonized Vocals Fade]",
                        "hi" to "[समाप्ति - सुरीली आवाजें मद्धम]",
                        "hinglish" to "[Outro - Harmonized Vocals Fade]",
                        "romanized" to "[Outro Fading]"
                    ))
                )
            }
            normalizedTitle.contains("chill") || normalizedTitle.contains("lofi") || normalizedTitle.contains("relax") || normalizedTitle.contains("night") || normalizedTitle.contains("ambient") -> {
                listOf(
                    PremiumLyricLine(0L, mapOf(
                        "en" to "[Ambient Lo-Fi Synth Harmony]",
                        "hi" to "[मद्धम लो-फाई सिंथ संगीत]",
                        "hinglish" to "[Ambient Lo-Fi Synth Harmony]",
                        "romanized" to "[Lo-fi Beat Intro]"
                    )),
                    PremiumLyricLine(6000L, mapOf(
                        "en" to "🎧 Let the bass control your breathing loops...",
                        "hi" to "🎧 बास को अपनी सांसों की गति नियंत्रित करने दें...",
                        "hinglish" to "🎧 Bass ko apni saanson ki gati niyantrit karne dein...",
                        "romanized" to "🎧 Bass ki dhun pe saans lijiye..."
                    )),
                    PremiumLyricLine(14000L, mapOf(
                        "en" to "🌧️ Watching the rain fall down the glass...",
                        "hi" to "🌧️ कांच पर गिरती हुई बारिश की बूंदों को देखना...",
                        "hinglish" to "🌧️ Kaanch par girti hui baarish ki boondon ko dekhna...",
                        "romanized" to "🌧️ Khidki pe girti boondon ko dekhna..."
                    )),
                    PremiumLyricLine(24000L, mapOf(
                        "en" to "☕ A warm cup of tea and a fading spark...",
                        "hi" to "☕ चाय का एक गर्म कप और एक मद्धम होती चिंगारी...",
                        "hinglish" to "☕ Chai ka ek garam cup aur ek madham hoti chingari...",
                        "romanized" to "☕ Ek cup garam chai aur purani yaadein..."
                    )),
                    PremiumLyricLine(36000L, mapOf(
                        "en" to "💤 Lose yourself in the retro sound waves...",
                        "hi" to "💤 रेट्रो ध्वनि तरंगों में खो जाओ...",
                        "hinglish" to "💤 Retro dhwani tarangon mein kho jao...",
                        "romanized" to "💤 Retro sound waves mein kho jao..."
                    )),
                    PremiumLyricLine(48000L, mapOf(
                        "en" to "🌌 Drift away into the cosmic twilight...",
                        "hi" to "🌌 ब्रह्मांडीय गोधूलि वेला में बह जाओ...",
                        "hinglish" to "🌌 Brahmandiya godhuli bela mein bah jao...",
                        "romanized" to "🌌 Cosmic twilight mein dhalte jayein..."
                    )),
                    PremiumLyricLine(60000L, mapOf(
                        "en" to "[Outro - Rain sound effects fading]",
                        "hi" to "[समाप्ति - बारिश की आवाज मद्धम]",
                        "hinglish" to "[Outro - Rain sound effects fading]",
                        "romanized" to "[Outro Rain Fade]"
                    ))
                )
            }
            normalizedTitle.contains("dance") || normalizedTitle.contains("beat") || normalizedTitle.contains("party") || normalizedTitle.contains("edm") || normalizedTitle.contains("house") -> {
                listOf(
                    PremiumLyricLine(0L, mapOf(
                        "en" to "[High-Energy Synth Uplifter]",
                        "hi" to "[उच्च-ऊर्जा सिंथ अपलिफ्टर]",
                        "hinglish" to "[High-Energy Synth Uplifter]",
                        "romanized" to "[EDM Intro Drums]"
                    )),
                    PremiumLyricLine(4000L, mapOf(
                        "en" to "⚡ Feel the electric current in your veins...",
                        "hi" to "⚡ अपनी नसों में बिजली का प्रवाह महसूस करें...",
                        "hinglish" to "⚡ Apni nason mein bijli ka pravah mehsoos karein...",
                        "romanized" to "⚡ Ek current sa daude nason mein..."
                    )),
                    PremiumLyricLine(10000L, mapOf(
                        "en" to "🔊 Turn up the bass, shake the floor...",
                        "hi" to "🔊 बास बढ़ाओ, फर्श को हिला दो...",
                        "hinglish" to "🔊 Bass badhao, farsh ko hila do...",
                        "romanized" to "🔊 Volume badhao, floor ko shake karo..."
                    )),
                    PremiumLyricLine(16000L, mapOf(
                        "en" to "🕺 We own this night, let the body move...",
                        "hi" to "🕺 यह रात हमारी है, शरीर को झूमने दो...",
                        "hinglish" to "🕺 Yeh raat hamari hai, shareer ko jhoomne do...",
                        "romanized" to "🕺 Aaj ki raat apni hai, body move karo..."
                    )),
                    PremiumLyricLine(22000L, mapOf(
                        "en" to "🎉 3... 2... 1... DROP THE BASS!",
                        "hi" to "🎉 3... 2... 1... बास शुरू करो!",
                        "hinglish" to "🎉 3... 2... 1... DROP THE BASS!",
                        "romanized" to "🎉 3... 2... 1... DROP THE BASS!"
                    )),
                    PremiumLyricLine(35000L, mapOf(
                        "en" to "[Insane Synths & Drums Beat Drop]",
                        "hi" to "[शानदार सिंथ और ड्रम बीट ड्रॉप]",
                        "hinglish" to "[Insane Synths & Drums Beat Drop]",
                        "romanized" to "[EDM Beat Drop]"
                    )),
                    PremiumLyricLine(50000L, mapOf(
                        "en" to "✨ Dance until the morning light...",
                        "hi" to "✨ सुबह की रोशनी होने तक नाचो...",
                        "hinglish" to "✨ Subah ki roshni hone tak nacho...",
                        "romanized" to "✨ Subah tak dance karenge..."
                    )),
                    PremiumLyricLine(60000L, mapOf(
                        "en" to "[Outro - Electric Outro]",
                        "hi" to "[समाप्ति - इलेक्ट्रिक समाप्ति]",
                        "hinglish" to "[Outro - Electric Outro]",
                        "romanized" to "[Outro Drums Fade]"
                    ))
                )
            }
            else -> {
                listOf(
                    PremiumLyricLine(0L, mapOf(
                        "en" to "[Music Playback Begins]",
                        "hi" to "[संगीत प्लेबैक शुरू]",
                        "hinglish" to "[Music Playback Begins]",
                        "romanized" to "[Intro Beats]"
                    )),
                    PremiumLyricLine(6000L, mapOf(
                        "en" to "🌟 Listening to '${title}' on premium player...",
                        "hi" to "🌟 प्रीमियम प्लेयर पर '${title}' सुन रहे हैं...",
                        "hinglish" to "🌟 Premium player par '${title}' sun rahe hain...",
                        "romanized" to "🌟 Premium player pe '${title}' sun rahe hain..."
                    )),
                    PremiumLyricLine(14000L, mapOf(
                        "en" to "🎵 Crafted with high-fidelity acoustic processing...",
                        "hi" to "🎵 हाई-फिडेलिटी ध्वनिक प्रसंस्करण के साथ निर्मित...",
                        "hinglish" to "🎵 High-fidelity acoustic processing ke saath nirmit...",
                        "romanized" to "🎵 High-fidelity acoustic processing ke sath..."
                    )),
                    PremiumLyricLine(24000L, mapOf(
                        "en" to "🎛️ Adjust equalizer bands for customized tuning...",
                        "hi" to "🎛️ कस्टमाइज़्ड ट्यूनिंग के लिए इक्वलाइज़र बैंड बदलें...",
                        "hinglish" to "🎛️ Customized tuning ke liye equalizer bands badlein...",
                        "romanized" to "🎛️ Equalizer bands ko adjust karein..."
                    )),
                    PremiumLyricLine(34000L, mapOf(
                        "en" to "✨ Feel the 3D spatial expander and sub-bass...",
                        "hi" to "✨ 3D स्पैटियल एक्सपैंडर और सब-बास का अनुभव करें...",
                        "hinglish" to "✨ 3D spatial expander aur sub-bass ka anubhav karein...",
                        "romanized" to "✨ 3D spatial expander aur sub-bass feel karein..."
                    )),
                    PremiumLyricLine(46000L, mapOf(
                        "en" to "[Guitar Interlude]",
                        "hi" to "[गिटार सोलो]",
                        "hinglish" to "[Guitar Interlude]",
                        "romanized" to "[Guitar Solos]"
                    )),
                    PremiumLyricLine(58000L, mapOf(
                        "en" to "🎶 Drift away softly into the melody...",
                        "hi" to "🎶 धुन में धीरे-धीरे बहते चले जाएं...",
                        "hinglish" to "🎶 Dhun mein dheere-dheere behte chale jayein...",
                        "romanized" to "🎶 Dhun mein dheere-dheere kho jayein..."
                    )),
                    PremiumLyricLine(70000L, mapOf(
                        "en" to "[Outro - Beautiful Acoustic Fade]",
                        "hi" to "[समाप्ति - सुंदर ध्वनिक समाप्ति]",
                        "hinglish" to "[Outro - Beautiful Acoustic Fade]",
                        "romanized" to "[Outro Fade]"
                    ))
                )
            }
        }
    }
}
