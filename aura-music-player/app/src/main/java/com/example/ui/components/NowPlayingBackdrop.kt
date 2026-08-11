package com.example.ui.components

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.provider.Settings
import android.view.accessibility.AccessibilityManager
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.palette.graphics.Palette
import coil.ImageLoader
import coil.compose.AsyncImage
import coil.request.ImageRequest
import coil.request.SuccessResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class NowPlayingPalette(
    val dominant: Color,
    val accent1: Color,
    val accent2: Color,
    val isLight: Boolean
)

// Global memory cache of extracted palettes by imageUrl
private val paletteCache = mutableMapOf<String, NowPlayingPalette>()

fun calculateLuminance(colorInt: Int): Float {
    val r = android.graphics.Color.red(colorInt) / 255f
    val g = android.graphics.Color.green(colorInt) / 255f
    val b = android.graphics.Color.blue(colorInt) / 255f
    return 0.2126f * r + 0.7152f * g + 0.0722f * b
}

fun getDefaultPalette(): NowPlayingPalette {
    return NowPlayingPalette(
        dominant = Color(0xFF1E112D), // Moody dark purple default
        accent1 = Color(0xFFD0BCFF),
        accent2 = Color(0xFF381E72),
        isLight = false
    )
}

fun isReducedMotionEnabled(context: Context): Boolean {
    try {
        val scale = Settings.Global.getFloat(
            context.contentResolver,
            Settings.Global.TRANSITION_ANIMATION_SCALE,
            1.0f
        )
        return scale == 0f
    } catch (e: Exception) {
        return false
    }
}

// Extracted Palette helper
suspend fun extractPaletteFromUrl(context: Context, url: String?): NowPlayingPalette = withContext(Dispatchers.IO) {
    if (url.isNullOrEmpty()) {
        return@withContext getDefaultPalette()
    }
    if (paletteCache.containsKey(url)) {
        return@withContext paletteCache[url]!!
    }

    try {
        val loader = ImageLoader(context)
        val request = ImageRequest.Builder(context)
            .data(url)
            .allowHardware(false) // essential for reading pixels
            .build()

        val result = loader.execute(request)
        val bitmap = if (result is SuccessResult) {
            (result.drawable as? BitmapDrawable)?.bitmap
        } else {
            null
        }

        val palette = if (bitmap != null) {
            val p = Palette.from(bitmap).generate()
            
            val dominantInt = p.getDominantColor(0xFF1E112D.toInt())
            val vibrantInt = p.getVibrantColor(p.getLightVibrantColor(p.getDarkVibrantColor(dominantInt)))
            val mutedInt = p.getMutedColor(p.getLightMutedColor(p.getDarkMutedColor(dominantInt)))

            val dominantColor = Color(dominantInt)
            val accent1Color = Color(vibrantInt)
            val accent2Color = Color(mutedInt)
            val isLight = calculateLuminance(dominantInt) > 0.5f

            NowPlayingPalette(
                dominant = dominantColor,
                accent1 = accent1Color,
                accent2 = accent2Color,
                isLight = isLight
            )
        } else {
            getDefaultPalette()
        }

        paletteCache[url] = palette
        palette
    } catch (e: Exception) {
        getDefaultPalette()
    }
}

fun Color.darken(factor: Float = 0.5f): Color {
    return Color(
        red = this.red * (1f - factor),
        green = this.green * (1f - factor),
        blue = this.blue * (1f - factor),
        alpha = this.alpha
    )
}

fun Color.desaturate(factor: Float = 0.3f): Color {
    val gray = 0.2126f * this.red + 0.7152f * this.green + 0.0722f * this.blue
    return Color(
        red = this.red * (1f - factor) + gray * factor,
        green = this.green * (1f - factor) + gray * factor,
        blue = this.blue * (1f - factor) + gray * factor,
        alpha = this.alpha
    )
}

fun Color.lighten(factor: Float = 0.5f): Color {
    return Color(
        red = this.red + (1f - this.red) * factor,
        green = this.green + (1f - this.green) * factor,
        blue = this.blue + (1f - this.blue) * factor,
        alpha = this.alpha
    )
}

@Composable
fun NowPlayingBackdrop(
    imageUrl: String?,
    isDarkMode: Boolean,
    modifier: Modifier = Modifier,
    onPaletteLoaded: (NowPlayingPalette) -> Unit = {},
    content: @Composable BoxScope.(NowPlayingPalette) -> Unit
) {
    val context = LocalContext.current
    var paletteState by remember { mutableStateOf(getDefaultPalette()) }

    // Asynchronously load the palette
    LaunchedEffect(imageUrl) {
        val extracted = extractPaletteFromUrl(context, imageUrl)
        paletteState = extracted
        onPaletteLoaded(extracted)
    }

    val finalPalette = remember(paletteState, isDarkMode) {
        if (isDarkMode) {
            // "In Dark Mode: darken/desaturate the extracted palette for the backdrop so it stays moody, not washed out."
            NowPlayingPalette(
                dominant = paletteState.dominant.desaturate(0.3f).darken(0.4f),
                accent1 = paletteState.accent1.desaturate(0.2f).darken(0.3f),
                accent2 = paletteState.accent2.desaturate(0.2f).darken(0.3f),
                isLight = false
            )
        } else {
            // "In Light Mode: lighten the scrim so backdrops feel airy, not muddy."
            NowPlayingPalette(
                dominant = paletteState.dominant.lighten(0.4f),
                accent1 = paletteState.accent1.lighten(0.3f),
                accent2 = paletteState.accent2.lighten(0.3f),
                isLight = true
            )
        }
    }

    val isReducedMotion = remember(context) { isReducedMotionEnabled(context) }
    val duration = if (isReducedMotion) 0 else 700

    val animatedDominant by animateColorAsState(
        targetValue = finalPalette.dominant,
        animationSpec = tween(duration, easing = FastOutSlowInEasing),
        label = "animatedDominant"
    )
    val animatedAccent1 by animateColorAsState(
        targetValue = finalPalette.accent1,
        animationSpec = tween(duration, easing = FastOutSlowInEasing),
        label = "animatedAccent1"
    )
    val animatedAccent2 by animateColorAsState(
        targetValue = finalPalette.accent2,
        animationSpec = tween(duration, easing = FastOutSlowInEasing),
        label = "animatedAccent2"
    )

    Box(modifier = modifier.fillMaxSize()) {
        // Blurred album art background
        if (com.example.ui.screens.ThemeConfig.enableBackgroundBlur.value && !imageUrl.isNullOrEmpty()) {
            AsyncImage(
                model = imageUrl,
                contentDescription = null,
                modifier = Modifier
                    .fillMaxSize()
                    .blur(50.dp),
                contentScale = ContentScale.Crop
            )
        }

        // Overlay with gradient made of animated colors for seamless dynamic transitions
        val scrimBrush = remember(animatedDominant, animatedAccent1, animatedAccent2) {
            Brush.verticalGradient(
                colors = listOf(
                    animatedDominant.copy(alpha = 0.5f),
                    animatedAccent1.copy(alpha = 0.7f),
                    animatedAccent2.copy(alpha = 0.9f)
                )
            )
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(scrimBrush)
        )

        // Render the children on top
        content(paletteState)
    }
}
