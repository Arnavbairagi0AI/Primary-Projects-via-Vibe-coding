package com.example.ui.screens

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.data.model.Song
import com.example.data.repository.MusicRepository
import com.example.playback.AudioPlayerManager
import com.example.playback.YouTubeDownloader
import com.example.ui.theme.ThemeTokens
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

data class YouTubeMetadata(
    val videoId: String,
    val title: String,
    val author: String,
    val thumbnailUrl: String,
    val streamUrl: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun YouTubeConverterScreen(navController: NavController, repository: MusicRepository) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var urlInput by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var metadata by remember { mutableStateOf<YouTubeMetadata?>(null) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isSaving by remember { mutableStateOf(false) }
    var downloadProgress by remember { mutableStateOf(-1f) }

    // Real-time URL validation check
    val isUrlInputValid = remember(urlInput) {
        YouTubeDownloader.isValidYouTubeUrl(urlInput)
    }

    // Audio states for the inline YouTube player
    var isLocalPlaying by remember { mutableStateOf(false) }
    var streamDuration by remember { mutableStateOf(180000L) } // default 3 minutes in ms

    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    // Custom pulse scale animation for visualizer
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isLocalPlaying) 1.12f else 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutLinearInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    fun fetchMetadataAndStream(videoUrl: String) {
        isLoading = true
        errorMessage = null
        metadata = null

        val videoId = YouTubeDownloader.extractVideoId(videoUrl)
        if (videoId == null) {
            errorMessage = "Invalid YouTube URL format. Please paste a valid YouTube video link."
            isLoading = false
            return
        }

        coroutineScope.launch {
            val result = withContext(Dispatchers.IO) {
                try {
                    val metaPair = YouTubeDownloader.fetchMetadata(videoId)
                    val resolvedStreamUrl = "https://api.vevioz.com/@api/button/mp3/$videoId"

                    if (metaPair != null) {
                        YouTubeMetadata(
                            videoId = videoId,
                            title = metaPair.first,
                            author = metaPair.second,
                            thumbnailUrl = "https://img.youtube.com/vi/$videoId/hqdefault.jpg",
                            streamUrl = resolvedStreamUrl
                        )
                    } else {
                        // Fallback with default thumbnail and titles
                        YouTubeMetadata(
                            videoId = videoId,
                            title = "YouTube Video ($videoId)",
                            author = "YouTube Channel",
                            thumbnailUrl = "https://img.youtube.com/vi/$videoId/hqdefault.jpg",
                            streamUrl = resolvedStreamUrl
                        )
                    }
                } catch (e: Exception) {
                    val resolvedStreamUrl = "https://api.vevioz.com/@api/button/mp3/$videoId"
                    YouTubeMetadata(
                        videoId = videoId,
                        title = "YouTube Stream ($videoId)",
                        author = "YouTube Audio",
                        thumbnailUrl = "https://img.youtube.com/vi/$videoId/hqdefault.jpg",
                        streamUrl = resolvedStreamUrl
                    )
                }
            }

            isLoading = false
            if (result != null) {
                metadata = result
                Toast.makeText(context, "YouTube link processed successfully!", Toast.LENGTH_SHORT).show()
            } else {
                errorMessage = "Failed to connect to YouTube services. Please check your network."
            }
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.baseBackground)
            .statusBarsPadding()
            .navigationBarsPadding(),
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = spacing.medium, vertical = spacing.small),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { navController.navigateUp() }) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = colors.textPrimary
                    )
                }
                Text(
                    text = "YouTube Link MP3 Player",
                    style = typography.displayHeader,
                    color = colors.textPrimary,
                    modifier = Modifier.padding(start = spacing.small)
                )
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(scrollState)
                .padding(spacing.medium),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header Description
            Text(
                text = "Stream or convert any YouTube video link directly into a high-fidelity MP3 music player experience. You can also download and permanently store converted MP3s directly into your local library.",
                style = typography.bodyMedium,
                color = colors.textSecondary,
                modifier = Modifier.padding(bottom = spacing.large),
                textAlign = TextAlign.Start
            )

            // Input Section
            Card(
                shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
                colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
                border = BorderStroke(1.dp, colors.border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(spacing.medium)) {
                    Text(
                        text = "Paste YouTube Link",
                        style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = colors.textPrimary,
                        modifier = Modifier.padding(bottom = spacing.small)
                    )

                    OutlinedTextField(
                        value = urlInput,
                        onValueChange = { urlInput = it },
                        placeholder = { Text("https://www.youtube.com/watch?v=...", color = colors.textMuted) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Filled.Link,
                                contentDescription = "Link Icon",
                                tint = colors.primaryAccent
                            )
                        },
                        trailingIcon = {
                            if (urlInput.isNotEmpty()) {
                                IconButton(onClick = { urlInput = "" }) {
                                    Icon(
                                        imageVector = Icons.Filled.Clear,
                                        contentDescription = "Clear",
                                        tint = colors.textSecondary
                                    )
                                }
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = colors.primaryAccent,
                            unfocusedBorderColor = colors.border,
                            focusedTextColor = colors.textPrimary,
                            unfocusedTextColor = colors.textPrimary
                        )
                    )

                    Spacer(modifier = Modifier.height(spacing.medium))

                    Button(
                        onClick = { fetchMetadataAndStream(urlInput) },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = isUrlInputValid && !isLoading,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.primaryAccent,
                            contentColor = colors.accentOnPrimary,
                            disabledContainerColor = colors.elevatedSurface2
                        ),
                        shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius)
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(18.dp),
                                color = colors.accentOnPrimary,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(spacing.small))
                            Text("Processing Link...", style = typography.labelText)
                        } else {
                            Icon(Icons.Filled.Bolt, contentDescription = "Convert", modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(spacing.small))
                            Text("Parse & Convert Link", style = typography.labelText.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(spacing.large))

            // Error Display
            AnimatedVisibility(visible = errorMessage != null) {
                errorMessage?.let { error ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = colors.error.copy(alpha = 0.15f)),
                        border = BorderStroke(1.dp, colors.error.copy(alpha = 0.5f)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = spacing.medium)
                    ) {
                        Row(
                            modifier = Modifier.padding(spacing.medium),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Filled.Error, contentDescription = "Error", tint = colors.error)
                            Spacer(modifier = Modifier.width(spacing.medium))
                            Text(error, color = colors.error, style = typography.bodyMedium)
                        }
                    }
                }
            }

            // Converter Results & Embedded Player UI
            AnimatedVisibility(
                visible = metadata != null,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                metadata?.let { meta ->
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Card(
                            shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
                            colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
                            border = BorderStroke(1.dp, colors.border),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(spacing.medium),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                // Cover Art Thumbnail
                                Box(
                                    modifier = Modifier
                                        .size(200.dp)
                                        .clip(RoundedCornerShape(ThemeTokens.shapes.sheetRadius))
                                        .background(colors.elevatedSurface2)
                                        .align(Alignment.CenterHorizontally)
                                ) {
                                    AsyncImage(
                                        model = meta.thumbnailUrl,
                                        contentDescription = meta.title,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                    Box(
                                        modifier = Modifier
                                            .align(Alignment.TopEnd)
                                            .padding(spacing.small)
                                            .background(
                                                Color.Black.copy(alpha = 0.75f),
                                                RoundedCornerShape(4.dp)
                                            )
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = "YouTube MP3",
                                            color = colors.primaryAccent,
                                            style = typography.labelText.copy(fontWeight = FontWeight.Bold, fontSize = 10.sp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(spacing.medium))

                                // Song details
                                Text(
                                    text = meta.title,
                                    style = typography.songTitleLarge,
                                    color = colors.textPrimary,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis,
                                    textAlign = TextAlign.Center
                                )

                                Text(
                                    text = meta.author,
                                    style = typography.bodyMedium,
                                    color = colors.textSecondary,
                                    maxLines = 1,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(top = 2.dp)
                                )

                                Spacer(modifier = Modifier.height(spacing.medium))

                                // Audio Waveform & Visualizer
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp)
                                        .background(colors.elevatedSurface2.copy(alpha = 0.5f), RoundedCornerShape(8.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        listOf(12, 28, 18, 38, 22, 44, 30, 24, 14, 28, 42, 20, 36, 16, 8, 24, 34, 18, 44, 28).forEachIndexed { i, heightVal ->
                                            val animatedHeight = animateDpAsState(
                                                targetValue = if (isLocalPlaying) {
                                                    (heightVal * pulseScale).dp
                                                } else {
                                                    (heightVal / 2).dp
                                                },
                                                animationSpec = tween(300 + (i * 15)),
                                                label = "waveBar"
                                            )
                                            Box(
                                                modifier = Modifier
                                                    .width(4.dp)
                                                    .height(animatedHeight.value)
                                                    .clip(CircleShape)
                                                    .background(
                                                        if (isLocalPlaying) colors.primaryAccent else colors.textMuted
                                                    )
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(spacing.medium))

                                // Control Buttons
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Button(
                                        onClick = {
                                            val songId = "youtube_${meta.videoId}"
                                            val youtubeSong = Song(
                                                id = songId,
                                                title = meta.title,
                                                artist = meta.author,
                                                album = "YouTube Link",
                                                duration = streamDuration,
                                                uri = meta.streamUrl,
                                                path = "",
                                                categoryTags = "YouTube"
                                            )
                                            AudioPlayerManager.playSong(context, youtubeSong)
                                            isLocalPlaying = true
                                            Toast.makeText(context, "Streaming YouTube MP3 stream directly...", Toast.LENGTH_SHORT).show()
                                        },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = colors.primaryAccent,
                                            contentColor = colors.accentOnPrimary
                                        ),
                                        shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                                        contentPadding = PaddingValues(horizontal = spacing.large, vertical = spacing.small)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.PlayArrow,
                                            contentDescription = "Stream",
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Spacer(modifier = Modifier.width(spacing.small))
                                        Text("Play Stream in Player", style = typography.labelText.copy(fontWeight = FontWeight.Bold))
                                    }
                                }

                                Spacer(modifier = Modifier.height(spacing.large))

                                HorizontalDivider(color = colors.border, thickness = 1.dp)

                                Spacer(modifier = Modifier.height(spacing.medium))

                                // Persistent save and download action
                                Column(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Button(
                                        onClick = {
                                            isSaving = true
                                            downloadProgress = 0f
                                            coroutineScope.launch {
                                                val localFile = YouTubeDownloader.downloadAudioStream(
                                                    context,
                                                    meta.videoId,
                                                    meta.streamUrl
                                                ) { progress ->
                                                    downloadProgress = progress
                                                }
                                                
                                                if (localFile != null) {
                                                    val songId = "youtube_${meta.videoId}"
                                                    val youtubeSong = Song(
                                                        id = songId,
                                                        title = meta.title,
                                                        artist = meta.author,
                                                        album = "YouTube Download",
                                                        duration = streamDuration,
                                                        uri = localFile.toURI().toString(),
                                                        path = localFile.absolutePath,
                                                        isFavorite = false,
                                                        timesPlayed = 0,
                                                        lastPlayed = 0,
                                                        dateAdded = System.currentTimeMillis(),
                                                        categoryTags = "YouTube"
                                                    )
                                                    repository.insertSong(youtubeSong)
                                                    Toast.makeText(context, "YouTube MP3 downloaded and stored successfully!", Toast.LENGTH_LONG).show()
                                                } else {
                                                    Toast.makeText(context, "Failed to download YouTube audio stream.", Toast.LENGTH_LONG).show()
                                                }
                                                isSaving = false
                                                downloadProgress = -1f
                                            }
                                        },
                                        enabled = !isSaving,
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = colors.primaryAccent,
                                            contentColor = colors.accentOnPrimary,
                                            disabledContainerColor = colors.elevatedSurface2
                                        ),
                                        shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        if (isSaving) {
                                            val progressText = if (downloadProgress >= 0f) {
                                                "Downloading: ${(downloadProgress * 100).toInt()}%"
                                            } else {
                                                "Connecting..."
                                            }
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                CircularProgressIndicator(
                                                    modifier = Modifier.size(18.dp),
                                                    color = colors.accentOnPrimary,
                                                    strokeWidth = 2.dp
                                                )
                                                Spacer(modifier = Modifier.width(spacing.small))
                                                Text(progressText, style = typography.labelText.copy(fontWeight = FontWeight.Bold))
                                            }
                                        } else {
                                            Icon(Icons.Filled.Download, contentDescription = "Download to Local", modifier = Modifier.size(18.dp))
                                            Spacer(modifier = Modifier.width(spacing.small))
                                            Text("Download & Store MP3 to Local Files", style = typography.labelText.copy(fontWeight = FontWeight.Bold))
                                        }
                                    }

                                    if (isSaving && downloadProgress >= 0f) {
                                        Spacer(modifier = Modifier.height(spacing.small))
                                        LinearProgressIndicator(
                                            progress = downloadProgress,
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(4.dp)
                                                .clip(RoundedCornerShape(2.dp)),
                                            color = colors.primaryAccent,
                                            trackColor = colors.border
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
}
