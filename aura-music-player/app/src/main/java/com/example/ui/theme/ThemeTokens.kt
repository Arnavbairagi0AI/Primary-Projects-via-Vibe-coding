package com.example.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// --- COLOR TOKENS ---
data class AppColors(
    val baseBackground: Color,
    val elevatedSurface1: Color,
    val elevatedSurface2: Color,
    val primaryAccent: Color,
    val accentOnPrimary: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,
    val success: Color,
    val error: Color,
    val warning: Color,
    val border: Color,
    val isLight: Boolean
)

val DarkAppColors = AppColors(
    baseBackground = Color(0xFF12141A),       // Deep charcoal-ink
    elevatedSurface1 = Color(0xFF1B1E28),     // Subtle cool tinted dark card
    elevatedSurface2 = Color(0xFF242835),     // Slightly lighter cool dark surface
    primaryAccent = Color(0xFF2FB3A3),        // Saturated precise teal
    accentOnPrimary = Color(0xFF0F3D37),      // Deep contrast color for text on teal
    textPrimary = Color(0xFFF1F3F5),
    textSecondary = Color(0xFF8B949E),        // Mid-gray tuned cool
    textMuted = Color(0xFF5A6270),
    success = Color(0xFF49A586),              // Desaturated calm green
    error = Color(0xFFD66276),                // Desaturated calm red
    warning = Color(0xFFDCA153),              // Desaturated amber-gold
    border = Color(0xFF242933),
    isLight = false
)

val LightAppColors = AppColors(
    baseBackground = Color(0xFFF7F5F1),      // Soft warm-white
    elevatedSurface1 = Color(0xFFEFECE6),    // Warm tinted light card
    elevatedSurface2 = Color(0xFFE6E2D8),    // Slightly darker warm surface
    primaryAccent = Color(0xFF248E81),       // Rich precise teal for light mode contrast
    accentOnPrimary = Color.White,
    textPrimary = Color(0xFF1F2226),
    textSecondary = Color(0xFF6E7681),       // Mid-gray tuned warm
    textMuted = Color(0xFF9EA5B0),
    success = Color(0xFF327C62),
    error = Color(0xFFAB2E42),
    warning = Color(0xFF8E6229),
    border = Color(0xFFE5E2DB),
    isLight = true
)

// --- TYPOGRAPHY TOKENS ---
data class AppTypography(
    val displayHeader: TextStyle, // Slightly condensed, tight letter-spacing, confident
    val songTitleLarge: TextStyle,
    val songTitleMedium: TextStyle,
    val bodyText: TextStyle,
    val bodyMedium: TextStyle,
    val labelText: TextStyle,
    val numeralTabular: TextStyle // Tabular figures for timers, prevents jitter
)

val AppTypographyTokens = AppTypography(
    displayHeader = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        letterSpacing = (-0.75).sp,
        lineHeight = 30.sp
    ),
    songTitleLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        letterSpacing = (-0.5).sp,
        lineHeight = 26.sp
    ),
    songTitleMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.SemiBold,
        fontSize = 15.sp,
        letterSpacing = (-0.25).sp,
        lineHeight = 20.sp
    ),
    bodyText = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        letterSpacing = 0.sp,
        lineHeight = 20.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        letterSpacing = 0.sp,
        lineHeight = 20.sp
    ),
    labelText = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        letterSpacing = 0.5.sp,
        lineHeight = 16.sp
    ),
    numeralTabular = TextStyle(
        fontFamily = FontFamily.Monospace, // Guarantees monospace width / tabular figures
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        letterSpacing = 0.sp,
        fontFeatureSettings = "tnum"
    )
)

// --- SHAPE/RADIUS TOKENS ---
data class AppShapes(
    val cardRadius: Dp = 12.dp,
    val sheetRadius: Dp = 20.dp,
    val buttonRadius: Dp = 50.dp, // Pill shape
    val playerArtRadius: Dp = 16.dp
)

// --- SPACING TOKENS ---
data class AppSpacing(
    val extraSmall: Dp = 4.dp,
    val small: Dp = 8.dp,
    val medium: Dp = 16.dp,
    val large: Dp = 24.dp,
    val extraLarge: Dp = 32.dp
)

// --- MOTION TOKENS ---
data class AppMotion(
    val durationShort: Int = 150,
    val durationMedium: Int = 350,
    val durationLong: Int = 700
)

// --- COMPOSITION LOCALS ---
val LocalAppColors = staticCompositionLocalOf { DarkAppColors }
val LocalAppTypography = staticCompositionLocalOf { AppTypographyTokens }
val LocalAppShapes = staticCompositionLocalOf { AppShapes() }
val LocalAppSpacing = staticCompositionLocalOf { AppSpacing() }
val LocalAppMotion = staticCompositionLocalOf { AppMotion() }

// --- CONVENIENCE OBJECT ---
object ThemeTokens {
    val colors: AppColors
        @Composable
        @ReadOnlyComposable
        get() = LocalAppColors.current

    val typography: AppTypography
        @Composable
        @ReadOnlyComposable
        get() = LocalAppTypography.current

    val shapes: AppShapes
        @Composable
        @ReadOnlyComposable
        get() = LocalAppShapes.current

    val spacing: AppSpacing
        @Composable
        @ReadOnlyComposable
        get() = LocalAppSpacing.current

    val motion: AppMotion
        @Composable
        @ReadOnlyComposable
        get() = LocalAppMotion.current
}
