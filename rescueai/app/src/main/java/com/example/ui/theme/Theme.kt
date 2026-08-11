package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val RescueDarkColorScheme = darkColorScheme(
    primary = RescuePrimary,
    onPrimary = RescueOnPrimary,
    primaryContainer = RescuePrimaryContainer,
    onPrimaryContainer = RescueOnPrimaryContainer,
    secondary = RescueSecondary,
    secondaryContainer = RescueSecondaryContainer,
    onSecondaryContainer = RescueOnSecondaryContainer,
    tertiary = RescueTertiary,
    tertiaryContainer = RescueTertiaryContainer,
    background = RescueBackground,
    onBackground = RescueOnSurface,
    surface = RescueSurface,
    onSurface = RescueOnSurface,
    surfaceVariant = RescueSurfaceContainerHighest,
    onSurfaceVariant = RescueOnSurfaceVariant,
    outline = RescueOutline,
    outlineVariant = RescueOutlineVariant,
    error = RescueError,
    errorContainer = RescueErrorContainer
)

@Composable
fun RescueAITheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = RescueDarkColorScheme,
        typography = Typography,
        content = content
    )
}
