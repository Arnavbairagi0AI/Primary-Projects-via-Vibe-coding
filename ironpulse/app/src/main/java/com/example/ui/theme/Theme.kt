package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val GymDarkColorScheme = darkColorScheme(
    primary = GymRed,
    onPrimary = TextWhite,
    primaryContainer = GymRedDark,
    onPrimaryContainer = TextWhite,
    secondary = GymSlateLight,
    onSecondary = TextWhite,
    secondaryContainer = GymSlate,
    onSecondaryContainer = TextGray,
    tertiary = GymRedLight,
    onTertiary = GymBlack,
    background = GymBlack,
    onBackground = TextWhite,
    surface = GymSlate,
    onSurface = TextWhite,
    surfaceVariant = GymSlateLight,
    onSurfaceVariant = TextGray,
    outline = TextGrayMuted
)

@Composable
fun MyApplicationTheme(
    content: @Composable () -> Unit
) {
    // We enforce our premium branding dark colors directly
    MaterialTheme(
        colorScheme = GymDarkColorScheme,
        typography = Typography,
        content = content
    )
}
