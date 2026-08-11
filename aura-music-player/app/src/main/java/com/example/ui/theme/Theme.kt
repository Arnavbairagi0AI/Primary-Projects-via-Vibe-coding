package com.example.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext


private val PreciseDarkColorScheme = darkColorScheme(
    primary = DarkAppColors.primaryAccent,
    onPrimary = DarkAppColors.accentOnPrimary,
    background = DarkAppColors.baseBackground,
    onBackground = DarkAppColors.textPrimary,
    surface = DarkAppColors.elevatedSurface1,
    onSurface = DarkAppColors.textPrimary,
    surfaceVariant = DarkAppColors.elevatedSurface2,
    onSurfaceVariant = DarkAppColors.textSecondary,
    outline = DarkAppColors.border
)

private val PreciseLightColorScheme = lightColorScheme(
    primary = LightAppColors.primaryAccent,
    onPrimary = LightAppColors.accentOnPrimary,
    background = LightAppColors.baseBackground,
    onBackground = LightAppColors.textPrimary,
    surface = LightAppColors.elevatedSurface1,
    onSurface = LightAppColors.textPrimary,
    surfaceVariant = LightAppColors.elevatedSurface2,
    onSurfaceVariant = LightAppColors.textSecondary,
    outline = LightAppColors.border
)

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  // Dynamic color is available on Android 12+
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  val colorScheme =
    when {
      dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
        val context = LocalContext.current
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      }

      darkTheme -> PreciseDarkColorScheme
      else -> PreciseLightColorScheme
    }

  val appColors = if (darkTheme) DarkAppColors else LightAppColors

  CompositionLocalProvider(
      LocalAppColors provides appColors,
      LocalAppTypography provides AppTypographyTokens,
      LocalAppShapes provides AppShapes(),
      LocalAppSpacing provides AppSpacing(),
      LocalAppMotion provides AppMotion()
  ) {
      MaterialTheme(
          colorScheme = colorScheme,
          typography = Typography,
          content = content
      )
  }
}

