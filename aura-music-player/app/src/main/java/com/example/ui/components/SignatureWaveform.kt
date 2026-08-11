package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.theme.ThemeTokens
import kotlin.math.sin

/**
 * A beautiful, precise audio waveform component that supports:
 * 1. Animated wave mode (ideal for placing behind/around the player seek bar).
 * 2. Static decorative wave mode (ideal for empty state illustrations).
 */
@Composable
fun SignatureWaveform(
    modifier: Modifier = Modifier,
    isPlaying: Boolean = false,
    barCount: Int = 45,
    color: Color = ThemeTokens.colors.primaryAccent,
    inactiveColor: Color = ThemeTokens.colors.textMuted.copy(alpha = 0.3f),
    progress: Float = 0f // 0f to 1f representation of the playback position
) {
    val infiniteTransition = rememberInfiniteTransition(label = "waveform")
    
    // Animate phase continuously when playing
    val animatedPhase by if (isPlaying) {
        infiniteTransition.animateFloat(
            initialValue = 0f,
            targetValue = 2f * java.lang.Math.PI.toFloat(),
            animationSpec = infiniteRepeatable(
                animation = tween(1500, easing = LinearEasing),
                repeatMode = RepeatMode.Restart
            ),
            label = "phase"
        )
    } else {
        remember { mutableStateOf(0f) }
    }

    Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height
        val barWidth = (width / barCount) * 0.65f
        val gap = (width / barCount) * 0.35f

        for (i in 0 until barCount) {
            // Generate a natural-looking audio wave shape using multiple sine harmonics
            val normalizedIndex = i.toFloat() / barCount
            
            // Envelope function to taper the edges so it looks like a localized packet
            val envelope = sin(normalizedIndex * java.lang.Math.PI.toFloat())
            
            // Primary wave frequency
            val primaryWave = sin(normalizedIndex * 12f + animatedPhase)
            // Secondary higher frequency harmonic
            val secondaryWave = sin(normalizedIndex * 24f - animatedPhase * 1.5f) * 0.4f
            
            // Combine and scale
            val rawAmplitude = (primaryWave + secondaryWave) / 1.4f
            // Absolute amplitude tapered by envelope
            val amplitude = (rawAmplitude * rawAmplitude * envelope).coerceIn(0.1f, 1.0f)
            
            // Dynamic scale when playing vs paused
            val scaleFactor = if (isPlaying) 0.85f else 0.4f
            val finalHeight = height * amplitude * scaleFactor

            val x = i * (barWidth + gap) + barWidth / 2
            val startY = (height - finalHeight) / 2
            val endY = startY + finalHeight

            // Choose color based on whether this bar has been traversed by progress
            val isFilled = normalizedIndex <= progress
            val barColor = if (isFilled) color else inactiveColor

            drawLine(
                color = barColor,
                start = Offset(x, startY),
                end = Offset(x, endY),
                strokeWidth = barWidth,
                cap = StrokeCap.Round
            )
        }
    }
}

/**
 * A beautiful empty-state illustration using the static abstracted waveform motif.
 */
@Composable
fun WaveformEmptyState(
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
    actionButton: (@Composable () -> Unit)? = null
) {
    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(spacing.large),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Abstracted static waveform illustration
        Box(
            modifier = Modifier
                .height(100.dp)
                .fillMaxWidth(0.7f),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val width = size.width
                val height = size.height
                val barCount = 30
                val barWidth = (width / barCount) * 0.5f
                val gap = (width / barCount) * 0.5f

                for (i in 0 until barCount) {
                    val normalizedIndex = i.toFloat() / barCount
                    val envelope = sin(normalizedIndex * java.lang.Math.PI.toFloat())
                    
                    // Complex static harmonics
                    val wave1 = sin(normalizedIndex * 10f)
                    val wave2 = sin(normalizedIndex * 20f) * 0.3f
                    val wave3 = sin(normalizedIndex * 5f) * 0.5f
                    
                    val amplitude = ((wave1 + wave2 + wave3) / 1.8f * envelope).coerceIn(-1.0f, 1.0f)
                    val barHeight = height * Math.abs(amplitude) * 0.8f

                    val x = i * (barWidth + gap) + barWidth / 2
                    val startY = (height - barHeight) / 2
                    val endY = startY + barHeight

                    // Beautiful gradient-like effect from primary accent to muted text color
                    val lerpRatio = normalizedIndex
                    val r = colors.primaryAccent.red + lerpRatio * (colors.textMuted.red - colors.primaryAccent.red)
                    val g = colors.primaryAccent.green + lerpRatio * (colors.textMuted.green - colors.primaryAccent.green)
                    val b = colors.primaryAccent.blue + lerpRatio * (colors.textMuted.blue - colors.primaryAccent.blue)
                    val a = 0.9f + lerpRatio * (0.25f - 0.9f)
                    val barColor = Color(red = r, green = g, blue = b, alpha = a)

                    drawLine(
                        color = barColor,
                        start = Offset(x, startY),
                        end = Offset(x, endY),
                        strokeWidth = barWidth,
                        cap = StrokeCap.Round
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(spacing.medium))

        Text(
            text = title,
            style = typography.songTitleLarge,
            color = colors.textPrimary,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(spacing.extraSmall))

        Text(
            text = subtitle,
            style = typography.bodyText,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )

        if (actionButton != null) {
            Spacer(modifier = Modifier.height(spacing.medium))
            actionButton()
        }
    }
}

@Composable
fun FallbackAlbumArt(
    modifier: Modifier = Modifier,
    iconSize: Dp = 24.dp
) {
    val colors = ThemeTokens.colors
    Box(
        modifier = modifier
            .background(
                Brush.linearGradient(
                    colors = listOf(
                        colors.primaryAccent.copy(alpha = 0.4f),
                        colors.elevatedSurface2
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = Icons.Filled.MusicNote,
            contentDescription = null,
            tint = colors.primaryAccent,
            modifier = Modifier.size(iconSize)
        )
    }
}
