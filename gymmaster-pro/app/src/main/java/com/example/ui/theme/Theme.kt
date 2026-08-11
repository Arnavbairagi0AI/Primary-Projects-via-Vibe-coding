package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Premium dark athletic color palette (Slate 900 / Slate 800)
private val GymDarkColorScheme = darkColorScheme(
    primary = Color(0xFFE64A19), // Sporty orange default
    secondary = Color(0xFF475569), // Slate 600
    tertiary = Color(0xFFF97316), // Orange 500
    background = Color(0xFF0F172A), // Slate 900
    surface = Color(0xFF1E293B), // Slate 800
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFFF8FAFC), // Slate 50
    onSurface = Color(0xFFF1F5F9), // Slate 100
    surfaceVariant = Color(0xFF334155), // Slate 700
    onSurfaceVariant = Color(0xFFCBD5E1), // Slate 300
    error = Color(0xFFEF4444) // Red 500
)

private val GymLightColorScheme = lightColorScheme(
    primary = Color(0xFF0056D2), // Professional blue
    secondary = Color(0xFF44474E), // Charcoal body text
    tertiary = Color(0xFF0056D2),
    background = Color(0xFFF3F4F9), // Soft clean light gray-blue background
    surface = Color.White,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color(0xFF1C1B1F), // Off-black text
    onSurface = Color(0xFF1C1B1F),
    surfaceVariant = Color(0xFFE7E0EC), // Soft container highlight
    onSurfaceVariant = Color(0xFF44474E),
    error = Color(0xFFBA1A1A) // Polished error red
)

@Composable
fun GymTheme(
    customPrimaryColorHex: String? = null,
    darkTheme: Boolean = false, // Default to light theme for Professional Polish
    content: @Composable () -> Unit
) {
    val primaryColor = if (!customPrimaryColorHex.isNullOrBlank()) {
        try {
            val cleanHex = customPrimaryColorHex.trim()
            Color(android.graphics.Color.parseColor(cleanHex))
        } catch (e: Exception) {
            Color(0xFF0056D2) // Fallback professional blue
        }
    } else {
        Color(0xFF0056D2)
    }

    val baseScheme = if (darkTheme) GymDarkColorScheme else GymLightColorScheme
    val colorScheme = baseScheme.copy(
        primary = primaryColor,
        tertiary = primaryColor
    )

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
