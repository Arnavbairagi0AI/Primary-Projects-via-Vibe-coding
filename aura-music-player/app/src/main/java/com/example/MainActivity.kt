package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import coil.compose.AsyncImage
import com.example.data.repository.MusicRepository
import com.example.playback.AudioPlayerManager
import com.example.ui.screens.*
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.theme.ThemeTokens
import com.example.ui.components.lighten
import com.example.ui.components.desaturate
import com.example.ui.components.darken

class MainActivity : ComponentActivity() {
    private val repository by lazy { MusicRepository(applicationContext) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        com.example.ui.screens.ThemeConfig.initialize(applicationContext)
        enableEdgeToEdge()
        
        setContent {
            // Apply User-Selected Theme settings dynamically
            val themePreference = ThemeConfig.themeMode.value
            val useDarkTheme = when (themePreference) {
                "Force Dark" -> true
                "Force Light" -> false
                else -> isSystemInDarkTheme()
            }

            MyApplicationTheme(darkTheme = useDarkTheme) {
                val navController = rememberNavController()
                val currentBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = currentBackStackEntry?.destination?.route

                val context = LocalContext.current
                val currentSong by AudioPlayerManager.currentSong.collectAsState()
                val isPlaying by AudioPlayerManager.isPlaying.collectAsState()
                val currentPosition by AudioPlayerManager.currentPosition.collectAsState()
                val duration by AudioPlayerManager.duration.collectAsState()
                val progress = if (duration > 0) currentPosition.toFloat() / duration.toFloat() else 0f
                val songs by repository.allSongs.collectAsState(initial = emptyList())

                // List of routes where we hide Bottom Bar & Mini Player
                val hideBottomBarRoutes = listOf("splash", "onboarding", "player")

                val colors = ThemeTokens.colors
                val typography = ThemeTokens.typography
                val spacing = ThemeTokens.spacing

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        if (currentRoute != null && !hideBottomBarRoutes.any { currentRoute.startsWith(it) }) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.Transparent)
                            ) {
                                // Floating persistent Mini Player pinned directly above navigation with smooth slide-up entrance/exit transition
                                val showMiniPlayer = songs.isNotEmpty() && currentSong != null
                                AnimatedVisibility(
                                    visible = showMiniPlayer,
                                    enter = slideInVertically(
                                        initialOffsetY = { it },
                                        animationSpec = tween(durationMillis = 350, easing = FastOutSlowInEasing)
                                    ) + fadeIn(animationSpec = tween(350)),
                                    exit = slideOutVertically(
                                        targetOffsetY = { it },
                                        animationSpec = tween(durationMillis = 250, easing = FastOutSlowInEasing)
                                    ) + fadeOut(animationSpec = tween(250))
                                ) {
                                    MiniPlayer(
                                        title = currentSong?.title ?: "Unknown",
                                        artist = currentSong?.artist ?: "Unknown",
                                        albumArtUrl = currentSong?.albumArtUri,
                                        isPlaying = isPlaying,
                                        progress = progress,
                                        onPlayPauseToggle = {
                                            AudioPlayerManager.togglePlayPause(context)
                                        },
                                        onSkipNext = {
                                            AudioPlayerManager.playNext(context)
                                        },
                                        onClicked = {
                                            navController.navigate("player")
                                        }
                                    )
                                }

                                // Bottom Navigation Bar
                                NavigationBar(
                                    containerColor = colors.elevatedSurface1,
                                    tonalElevation = 8.dp
                                ) {
                                    val items = listOf(
                                        NavItem("Home", "home", Icons.Filled.Home),
                                        NavItem("Library", "library", Icons.Filled.MusicNote),
                                        NavItem("Folders", "folders", Icons.Filled.Folder),
                                        NavItem("Queue", "queue", Icons.AutoMirrored.Filled.PlaylistPlay),
                                        NavItem("Settings", "settings", Icons.Filled.Settings)
                                    )

                                    items.forEach { item ->
                                        val isSelected = currentBackStackEntry?.destination?.hierarchy?.any { it.route == item.route } == true
                                        NavigationBarItem(
                                            selected = isSelected,
                                            onClick = {
                                                navController.navigate(item.route) {
                                                    popUpTo(navController.graph.findStartDestination().id) {
                                                        saveState = true
                                                    }
                                                    launchSingleTop = true
                                                    restoreState = true
                                                }
                                            },
                                            icon = { Icon(item.icon, contentDescription = item.label) },
                                            label = { Text(item.label, style = typography.labelText) },
                                            colors = NavigationBarItemDefaults.colors(
                                                selectedIconColor = colors.accentOnPrimary,
                                                selectedTextColor = colors.primaryAccent,
                                                unselectedIconColor = colors.textSecondary,
                                                unselectedTextColor = colors.textSecondary,
                                                indicatorColor = colors.primaryAccent
                                            )
                                        )
                                    }
                                }
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "splash",
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        composable("splash") { SplashScreen(navController) }
                        composable("onboarding") { OnboardingScreen(navController) }
                        composable("home") { HomeScreen(navController, repository) }
                        composable("library") { LibraryScreen(navController, repository) }
                        composable("folders") { FolderScreen(navController, repository) }
                        composable("queue") { QueueScreen(navController) }
                        composable("settings") { SettingsScreen(navController, repository) }
                        composable("player") { PlayerScreen(navController, repository) }
                        composable("equalizer") { EqualizerScreen(navController) }
                        composable("youtube_converter") { YouTubeConverterScreen(navController, repository) }
                        composable(
                            route = "playlist/{playlistId}",
                            arguments = listOf(navArgument("playlistId") { type = NavType.IntType })
                        ) { backStackEntry ->
                            val pId = backStackEntry.arguments?.getInt("playlistId") ?: 0
                            PlaylistScreen(navController, repository, pId)
                        }
                    }
                }
            }
        }
    }
}

data class NavItem(val label: String, val route: String, val icon: androidx.compose.ui.graphics.vector.ImageVector)

@Composable
fun MiniPlayer(
    title: String,
    artist: String,
    albumArtUrl: String?,
    isPlaying: Boolean,
    progress: Float,
    onPlayPauseToggle: () -> Unit,
    onSkipNext: () -> Unit,
    onClicked: () -> Unit
) {
    val context = LocalContext.current
    var palette by remember { mutableStateOf(com.example.ui.components.getDefaultPalette()) }
    
    LaunchedEffect(albumArtUrl) {
        palette = com.example.ui.components.extractPaletteFromUrl(context, albumArtUrl)
    }

    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    val accentColor = palette.accent1
    val dominantColor = palette.dominant

    val isReducedMotion = remember(context) { com.example.ui.components.isReducedMotionEnabled(context) }
    val duration = if (isReducedMotion) 0 else 700

    val animatedDominant by animateColorAsState(
        targetValue = if (colors.isLight) dominantColor.lighten(0.4f) else dominantColor.desaturate(0.3f).darken(0.4f),
        animationSpec = tween(duration, easing = FastOutSlowInEasing),
        label = "miniDominant"
    )
    val animatedAccent by animateColorAsState(
        targetValue = if (colors.isLight) accentColor.lighten(0.3f) else accentColor.desaturate(0.2f).darken(0.3f),
        animationSpec = tween(duration, easing = FastOutSlowInEasing),
        label = "miniAccent"
    )

    val borderBrush = remember(animatedDominant, animatedAccent) {
        Brush.horizontalGradient(
            colors = listOf(
                animatedDominant.copy(alpha = 0.5f),
                animatedAccent.copy(alpha = 0.5f)
            )
        )
    }

    Card(
        shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = spacing.medium, vertical = spacing.extraSmall)
            .clickable { onClicked() }
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            animatedDominant.copy(alpha = 0.25f),
                            animatedAccent.copy(alpha = 0.15f)
                        )
                    )
                )
                .background(colors.elevatedSurface1.copy(alpha = 0.85f))
                .border(BorderStroke(1.dp, borderBrush), RoundedCornerShape(ThemeTokens.shapes.cardRadius))
        ) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(spacing.small),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (albumArtUrl != null) {
                        AsyncImage(
                            model = albumArtUrl,
                            contentDescription = title,
                            modifier = Modifier
                                .size(46.dp)
                                .clip(RoundedCornerShape(spacing.small)),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        com.example.ui.components.FallbackAlbumArt(
                            modifier = Modifier
                                .size(46.dp)
                                .clip(RoundedCornerShape(spacing.small)),
                            iconSize = 20.dp
                        )
                    }
                    Spacer(modifier = Modifier.width(spacing.medium))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = title,
                            color = colors.textPrimary,
                            style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            maxLines = 1
                        )
                        Text(
                            text = artist,
                            color = colors.textSecondary,
                            style = typography.labelText,
                            maxLines = 1
                        )
                    }
                    IconButton(onClick = onSkipNext) {
                        Icon(
                            imageVector = Icons.Filled.SkipNext,
                            contentDescription = "Skip Next",
                            tint = colors.textPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    IconButton(
                        onClick = onPlayPauseToggle,
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(colors.primaryAccent)
                    ) {
                        Icon(
                            imageVector = if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                            contentDescription = "Play/Pause",
                            tint = colors.accentOnPrimary,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
                // Thin elegant progress bar right under mini player content
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(3.dp)
                        .padding(horizontal = spacing.medium)
                        .clip(CircleShape),
                    color = colors.primaryAccent,
                    trackColor = colors.border
                )
                Spacer(modifier = Modifier.height(spacing.extraSmall))
            }
        }
    }
}
