package com.example.ui.screens

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.data.repository.MusicRepository
import com.example.ui.theme.ThemeTokens
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

// Central global theme settings flow
object ThemeConfig {
    private var prefs: android.content.SharedPreferences? = null

    val themeMode = mutableStateOf("System Default") // "System Default", "Force Dark", "Force Light"
    val language = mutableStateOf("English") // English, Español, Deutsch, Français, 日本語
    val enableBackgroundBlur = mutableStateOf(true)
    val lyricsLanguagePriority = mutableStateOf("English") // English, Español, Hindi, Hinglish, Romanized
    val hapticIntensity = mutableStateOf(1.0f) // 0.0f to 1.0f
    val lyricsSyncScrolling = mutableStateOf(true)
    val enableBatterySaver = mutableStateOf(false)
    val librarySortOrder = mutableStateOf("Alphabetical") // "Alphabetical", "Date Added", "File Size"

    fun initialize(context: android.content.Context) {
        val p = context.applicationContext.getSharedPreferences("theme_config_prefs", android.content.Context.MODE_PRIVATE)
        prefs = p
        themeMode.value = p.getString("theme_mode", "System Default") ?: "System Default"
        language.value = p.getString("language", "English") ?: "English"
        enableBackgroundBlur.value = p.getBoolean("background_blur", true)
        lyricsLanguagePriority.value = p.getString("lyrics_lang_priority", "English") ?: "English"
        hapticIntensity.value = p.getFloat("haptic_intensity", 1.0f)
        lyricsSyncScrolling.value = p.getBoolean("lyrics_sync_scrolling", true)
        enableBatterySaver.value = p.getBoolean("battery_saver", false)
        librarySortOrder.value = p.getString("library_sort_order", "Alphabetical") ?: "Alphabetical"
    }

    fun save() {
        prefs?.edit()?.apply {
            putString("theme_mode", themeMode.value)
            putString("language", language.value)
            putBoolean("background_blur", enableBackgroundBlur.value)
            putString("lyrics_lang_priority", lyricsLanguagePriority.value)
            putFloat("haptic_intensity", hapticIntensity.value)
            putBoolean("lyrics_sync_scrolling", lyricsSyncScrolling.value)
            putBoolean("battery_saver", enableBatterySaver.value)
            putString("library_sort_order", librarySortOrder.value)
            apply()
        }
    }
}

private fun triggerSettingsHaptic(context: android.content.Context, durationMs: Long) {
    try {
        val vibrator = context.getSystemService(android.content.Context.VIBRATOR_SERVICE) as? android.os.Vibrator
        if (vibrator != null && vibrator.hasVibrator()) {
            val intensity = ThemeConfig.hapticIntensity.value
            if (intensity > 0.05f) {
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    val amplitude = (255 * intensity).toInt().coerceIn(1, 255)
                    val effect = android.os.VibrationEffect.createOneShot(durationMs, amplitude)
                    vibrator.vibrate(effect)
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(durationMs)
                }
            }
        }
    } catch (e: Exception) {
        // Fallback
    }
}

@Composable
fun SettingsScreen(navController: NavController, repository: MusicRepository) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var showThemeMenu by remember { mutableStateOf(false) }
    var showLangMenu by remember { mutableStateOf(false) }
    var showLyricsLangMenu by remember { mutableStateOf(false) }

    var backupText by remember { mutableStateOf("") }
    var showBackupDialog by remember { mutableStateOf(false) }
    var isExportMode by remember { mutableStateOf(false) }

    val themes = listOf("System Default", "Force Dark", "Force Light")
    val languages = listOf("English", "Español", "Deutsch", "Français", "日本語")

    val cachedLyrics = remember { mutableStateListOf<Pair<String, Int>>() }
    LaunchedEffect(Unit) {
        cachedLyrics.clear()
        cachedLyrics.addAll(LyricsCacheManager.getAllCachedSongs(context))
    }

    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.baseBackground)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(scrollState)
            .padding(spacing.medium)
    ) {
        // Top Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = spacing.small),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Preferences & Settings",
                style = typography.displayHeader,
                color = colors.textPrimary
            )
        }

        Spacer(modifier = Modifier.height(spacing.medium))

        // Access & Subscription Status Banner
        Card(
            shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
            colors = CardDefaults.cardColors(containerColor = colors.primaryAccent.copy(alpha = 0.12f)),
            border = BorderStroke(1.dp, colors.primaryAccent.copy(alpha = 0.4f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(spacing.medium)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.VerifiedUser,
                        contentDescription = "Full Access Unlocked",
                        tint = colors.primaryAccent,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(spacing.small))
                    Text(
                        text = "Full Access Unlocked",
                        style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = colors.primaryAccent
                    )
                }
                Spacer(modifier = Modifier.height(spacing.extraSmall))
                Text(
                    text = "• All premium features, YouTube converter, Equalizer & DSP unlocked\n• No subscription or Razorpay payment required (100% Free)\n• Direct offline access — no email registration or sign-in needed",
                    style = typography.labelText,
                    color = colors.textPrimary,
                    lineHeight = 18.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(spacing.large))

        // Visual Customization Section
        Text(
            text = "Visual & Language Customization",
            style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
            color = colors.primaryAccent,
            modifier = Modifier.padding(bottom = spacing.small)
        )
        
        Card(
            shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
            colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(spacing.medium)) {
                // Theme Selection Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showThemeMenu = true }
                        .padding(vertical = spacing.small),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Palette, contentDescription = "Theme", tint = colors.primaryAccent)
                        Spacer(modifier = Modifier.width(spacing.medium))
                        Column {
                            Text("Aesthetic Theme Mode", color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Text("Adjust system look and feel", color = colors.textSecondary, style = typography.labelText)
                        }
                    }
                    Box {
                        Text(ThemeConfig.themeMode.value, color = colors.primaryAccent, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                        DropdownMenu(
                            expanded = showThemeMenu,
                            onDismissRequest = { showThemeMenu = false },
                            modifier = Modifier.background(colors.elevatedSurface2)
                        ) {
                            themes.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option, color = colors.textPrimary) },
                                    onClick = {
                                        ThemeConfig.themeMode.value = option
                                        ThemeConfig.save()
                                        showThemeMenu = false
                                        Toast.makeText(context, "Theme preference applied!", Toast.LENGTH_SHORT).show()
                                        triggerSettingsHaptic(context, 10L)
                                    }
                                )
                            }
                        }
                    }
                }

                HorizontalDivider(color = colors.border.copy(alpha = 0.5f), modifier = Modifier.padding(vertical = spacing.small))

                // Language Selection Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showLangMenu = true }
                        .padding(vertical = spacing.small),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Language, contentDescription = "Language", tint = colors.primaryAccent)
                        Spacer(modifier = Modifier.width(spacing.medium))
                        Column {
                            Text("Language Localization", color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Text("Select application localized dialect", color = colors.textSecondary, style = typography.labelText)
                        }
                    }
                    Box {
                        Text(ThemeConfig.language.value, color = colors.primaryAccent, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                        DropdownMenu(
                            expanded = showLangMenu,
                            onDismissRequest = { showLangMenu = false },
                            modifier = Modifier.background(colors.elevatedSurface2)
                        ) {
                            languages.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option, color = colors.textPrimary) },
                                    onClick = {
                                        ThemeConfig.language.value = option
                                        ThemeConfig.save()
                                        showLangMenu = false
                                        Toast.makeText(context, "Language updated to $option!", Toast.LENGTH_SHORT).show()
                                        triggerSettingsHaptic(context, 10L)
                                    }
                                )
                            }
                        }
                    }
                }

                HorizontalDivider(color = colors.border.copy(alpha = 0.5f), modifier = Modifier.padding(vertical = spacing.small))

                // Dynamic Background Blur Toggle Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = spacing.small),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Filled.BlurOn, contentDescription = "Background Blur", tint = colors.primaryAccent)
                        Spacer(modifier = Modifier.width(spacing.medium))
                        Column {
                            Text("Dynamic Background Blur", color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Text("Blur ambient album art (disable for lower-GPU/power savings)", color = colors.textSecondary, style = typography.labelText)
                        }
                    }
                    Switch(
                        checked = ThemeConfig.enableBackgroundBlur.value,
                        onCheckedChange = {
                            ThemeConfig.enableBackgroundBlur.value = it
                            ThemeConfig.save()
                            triggerSettingsHaptic(context, 15L)
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = colors.accentOnPrimary,
                            checkedTrackColor = colors.primaryAccent,
                            uncheckedThumbColor = colors.textSecondary,
                            uncheckedTrackColor = colors.elevatedSurface2
                        )
                    )
                }

                HorizontalDivider(color = colors.border.copy(alpha = 0.5f), modifier = Modifier.padding(vertical = spacing.small))

                // Battery Saver Mode Toggle Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = spacing.small),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Filled.BatterySaver, contentDescription = "Battery Saver", tint = colors.primaryAccent)
                        Spacer(modifier = Modifier.width(spacing.medium))
                        Column {
                            Text("Battery Saver Mode", color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Text("Disable heavy UI animations, dynamic blurs, and visualizers globally", color = colors.textSecondary, style = typography.labelText)
                        }
                    }
                    Switch(
                        checked = ThemeConfig.enableBatterySaver.value,
                        onCheckedChange = {
                            ThemeConfig.enableBatterySaver.value = it
                            ThemeConfig.save()
                            triggerSettingsHaptic(context, 15L)
                            Toast.makeText(context, if (it) "Battery Saver Mode enabled!" else "Battery Saver Mode disabled!", Toast.LENGTH_SHORT).show()
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = colors.accentOnPrimary,
                            checkedTrackColor = colors.primaryAccent,
                            uncheckedThumbColor = colors.textSecondary,
                            uncheckedTrackColor = colors.elevatedSurface2
                        )
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(spacing.medium))

        // Now Playing & Lyrics Options Section
        Text(
            text = "Now Playing & Lyrics",
            style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
            color = colors.primaryAccent,
            modifier = Modifier.padding(bottom = spacing.small)
        )

        Card(
            shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
            colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(spacing.medium)) {
                // Priority Language Selection Row
                val lyricsLanguages = listOf("English", "Hindi", "Hinglish", "Romanized", "Español")
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showLyricsLangMenu = true }
                        .padding(vertical = spacing.small),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Translate, contentDescription = "Lyrics Language", tint = colors.primaryAccent)
                        Spacer(modifier = Modifier.width(spacing.medium))
                        Column {
                            Text("Lyrics Priority Language", color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Text("Prioritize lyrics track language when available", color = colors.textSecondary, style = typography.labelText)
                        }
                    }
                    Box {
                        Text(ThemeConfig.lyricsLanguagePriority.value, color = colors.primaryAccent, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                        DropdownMenu(
                            expanded = showLyricsLangMenu,
                            onDismissRequest = { showLyricsLangMenu = false },
                            modifier = Modifier.background(colors.elevatedSurface2)
                        ) {
                            lyricsLanguages.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option, color = colors.textPrimary) },
                                    onClick = {
                                        ThemeConfig.lyricsLanguagePriority.value = option
                                        ThemeConfig.save()
                                        showLyricsLangMenu = false
                                        Toast.makeText(context, "Lyrics priority language set to $option!", Toast.LENGTH_SHORT).show()
                                        triggerSettingsHaptic(context, 10L)
                                    }
                                )
                            }
                        }
                    }
                }

                HorizontalDivider(color = colors.border.copy(alpha = 0.5f), modifier = Modifier.padding(vertical = spacing.small))

                // Synchronized Lyrics Scrolling Toggle Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = spacing.small),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Filled.Sync, contentDescription = "Sync Lyrics", tint = colors.primaryAccent)
                        Spacer(modifier = Modifier.width(spacing.medium))
                        Column {
                            Text("Synchronized Scrolling", color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Text("Lyrics automatically scroll with song playback", color = colors.textSecondary, style = typography.labelText)
                        }
                    }
                    Switch(
                        checked = ThemeConfig.lyricsSyncScrolling.value,
                        onCheckedChange = {
                            ThemeConfig.lyricsSyncScrolling.value = it
                            ThemeConfig.save()
                            triggerSettingsHaptic(context, 15L)
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = colors.accentOnPrimary,
                            checkedTrackColor = colors.primaryAccent,
                            uncheckedThumbColor = colors.textSecondary,
                            uncheckedTrackColor = colors.elevatedSurface2
                        )
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(spacing.medium))

        // Haptics & Performance Options Section
        Text(
            text = "Haptics & Performance",
            style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
            color = colors.primaryAccent,
            modifier = Modifier.padding(bottom = spacing.small)
        )

        Card(
            shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
            colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(spacing.medium)) {
                // Haptic Intensity Slider Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = spacing.small),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Vibration, contentDescription = "Haptics", tint = colors.primaryAccent)
                    Spacer(modifier = Modifier.width(spacing.medium))
                    Column(modifier = Modifier.weight(1f)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Haptic Feedback Strength", color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                            Text(
                                text = if (ThemeConfig.hapticIntensity.value < 0.05f) "Off" else "${(ThemeConfig.hapticIntensity.value * 100).toInt()}%",
                                color = colors.primaryAccent,
                                style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                            )
                        }
                        Text("Customize feedback strength of playback and seek controls", color = colors.textSecondary, style = typography.labelText)
                        
                        Spacer(modifier = Modifier.height(spacing.small))
                        
                        Slider(
                            value = ThemeConfig.hapticIntensity.value,
                            onValueChange = {
                                ThemeConfig.hapticIntensity.value = it
                                ThemeConfig.save()
                                // Tactile slide response
                                triggerSettingsHaptic(context, 8L)
                            },
                            valueRange = 0.0f..1.0f,
                            colors = SliderDefaults.colors(
                                activeTrackColor = colors.primaryAccent,
                                inactiveTrackColor = colors.border,
                                thumbColor = colors.primaryAccent
                            )
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(spacing.large))

        // Data Storage & Synchronization Section
        Text(
            text = "Data Storage & Synchronization",
            style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
            color = colors.primaryAccent,
            modifier = Modifier.padding(bottom = spacing.small)
        )

        Card(
            shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
            colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(spacing.medium)) {
                // Export JSON Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            coroutineScope.launch {
                                try {
                                    val dbPlaylists = repository.allPlaylists.first()
                                    val dbFolders = repository.allCustomFolders.first()

                                    val rootJson = JSONObject()
                                    
                                    // Playlists JSON Array
                                    val playlistsArray = JSONArray()
                                    dbPlaylists.forEach { p ->
                                        val pJson = JSONObject()
                                        pJson.put("id", p.id)
                                        pJson.put("name", p.name)
                                        pJson.put("isSmart", p.isSmart)
                                        pJson.put("smartType", p.smartType ?: "")
                                        playlistsArray.put(pJson)
                                    }
                                    rootJson.put("playlists", playlistsArray)

                                    // Folders JSON Array
                                    val foldersArray = JSONArray()
                                    dbFolders.forEach { f ->
                                        val fJson = JSONObject()
                                        fJson.put("id", f.id)
                                        fJson.put("path", f.path)
                                        fJson.put("displayName", f.displayName)
                                        foldersArray.put(fJson)
                                    }
                                    rootJson.put("folders", foldersArray)

                                    backupText = rootJson.toString(2)
                                    isExportMode = true
                                    showBackupDialog = true
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Export error: ${e.message}", Toast.LENGTH_LONG).show()
                                }
                            }
                        }
                        .padding(vertical = spacing.small),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Backup, contentDescription = "Export Backup", tint = colors.primaryAccent)
                    Spacer(modifier = Modifier.width(spacing.medium))
                    Column {
                        Text("Export Configuration", color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                        Text("Save playlists and custom folder bookmarks", color = colors.textSecondary, style = typography.labelText)
                    }
                }

                HorizontalDivider(color = colors.border.copy(alpha = 0.5f), modifier = Modifier.padding(vertical = spacing.small))

                // Import JSON Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            backupText = ""
                            isExportMode = false
                            showBackupDialog = true
                        }
                        .padding(vertical = spacing.small),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Restore, contentDescription = "Import Backup", tint = colors.primaryAccent)
                    Spacer(modifier = Modifier.width(spacing.medium))
                    Column {
                        Text("Import Configuration", color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                        Text("Restore playlists and custom bookmarks from JSON", color = colors.textSecondary, style = typography.labelText)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(spacing.medium))

        // Offline Lyrics Cache Manager Section
        Text(
            text = "Offline Lyrics Storage",
            style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
            color = colors.primaryAccent,
            modifier = Modifier.padding(bottom = spacing.small)
        )

        Card(
            shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
            colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
            border = BorderStroke(1.dp, colors.border),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(spacing.medium)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Offline Lyrics Cache",
                            color = colors.textPrimary,
                            style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        val totalSize = cachedLyrics.sumOf { it.second }
                        Text(
                            text = "${cachedLyrics.size} tracks cached (${String.format("%.2f", totalSize / 1024f)} KB occupied)",
                            color = colors.textSecondary,
                            style = typography.labelText
                        )
                    }
                    if (cachedLyrics.isNotEmpty()) {
                        Button(
                            onClick = {
                                LyricsCacheManager.clearAllCache(context)
                                cachedLyrics.clear()
                                triggerSettingsHaptic(context, 15L)
                                Toast.makeText(context, "All offline lyrics cache cleared!", Toast.LENGTH_SHORT).show()
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = colors.error.copy(alpha = 0.15f),
                                contentColor = colors.error
                            ),
                            contentPadding = PaddingValues(horizontal = spacing.medium, vertical = spacing.extraSmall)
                        ) {
                            Icon(Icons.Filled.DeleteSweep, contentDescription = "Clear All Cache", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(spacing.small))
                            Text("Clear All")
                        }
                    }
                }

                if (cachedLyrics.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = spacing.medium),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No cached lyrics offline", color = colors.textMuted, style = typography.labelText)
                    }
                } else {
                    Spacer(modifier = Modifier.height(spacing.medium))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 200.dp)
                            .verticalScroll(rememberScrollState())
                    ) {
                        cachedLyrics.forEach { (songKey, sizeBytes) ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = spacing.extraSmall),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = songKey,
                                        color = colors.textPrimary,
                                        style = typography.labelText.copy(fontWeight = FontWeight.Bold),
                                        maxLines = 1
                                    )
                                    Text(
                                        text = "${sizeBytes} bytes",
                                        color = colors.textSecondary,
                                        style = typography.labelText
                                    )
                                }
                                IconButton(
                                    onClick = {
                                        LyricsCacheManager.deleteCacheForSong(context, songKey)
                                        cachedLyrics.removeIf { it.first == songKey }
                                        triggerSettingsHaptic(context, 10L)
                                        Toast.makeText(context, "Cache removed for track!", Toast.LENGTH_SHORT).show()
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.DeleteOutline,
                                        contentDescription = "Delete cache",
                                        tint = colors.textSecondary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(spacing.large))

        // Device Licensing Info Section
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
                Text("Aura Music Player", color = colors.textPrimary, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                Text("Version 2.4.0-Beta • Stable build", color = colors.textSecondary, style = typography.labelText)
                Spacer(modifier = Modifier.height(spacing.extraSmall))
                Text("Built securely using Android SDK & Precise Audio Engine", color = colors.textSecondary, style = typography.labelText)
            }
        }

        // Backup and Restore interactive modal Dialog
        if (showBackupDialog) {
            AlertDialog(
                onDismissRequest = { showBackupDialog = false },
                title = { 
                    Text(
                        text = if (isExportMode) "Export Backup Configuration" else "Import Configuration", 
                        color = colors.textPrimary
                    ) 
                },
                text = {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Text(
                            text = if (isExportMode) {
                                "Copy the JSON string below and save it to keep a backup. You can use the copy button below."
                            } else {
                                "Paste your previously exported JSON configuration below to restore your playlists and custom bookmarks."
                            },
                            color = colors.textSecondary,
                            style = typography.labelText,
                            modifier = Modifier.padding(bottom = spacing.small)
                        )
                        OutlinedTextField(
                            value = backupText,
                            onValueChange = { if (!isExportMode) backupText = it },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp),
                            placeholder = { Text("{\n  \"playlists\": [],\n  \"folders\": []\n}", color = colors.textMuted) },
                            readOnly = isExportMode,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = colors.textPrimary,
                                unfocusedTextColor = colors.textPrimary,
                                focusedBorderColor = colors.primaryAccent,
                                unfocusedBorderColor = colors.border,
                                focusedLabelColor = colors.primaryAccent,
                                unfocusedLabelColor = colors.textSecondary
                            )
                        )
                    }
                },
                confirmButton = {
                    if (isExportMode) {
                        Button(
                            onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                val clip = android.content.ClipData.newPlainText("Aura Backup JSON", backupText)
                                clipboard.setPrimaryClip(clip)
                                Toast.makeText(context, "Copied backup to clipboard!", Toast.LENGTH_SHORT).show()
                                showBackupDialog = false
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = colors.primaryAccent,
                                contentColor = colors.accentOnPrimary
                            )
                        ) {
                            Icon(Icons.Filled.ContentCopy, contentDescription = "Copy", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Copy JSON")
                        }
                    } else {
                        Button(
                            onClick = {
                                if (backupText.trim().isEmpty()) {
                                    Toast.makeText(context, "Please paste some JSON configuration text first.", Toast.LENGTH_SHORT).show()
                                    return@Button
                                }
                                try {
                                    val rootObj = JSONObject(backupText)
                                    
                                    // Parse and restore playlists with duplicate checks
                                    val playlistsArray = rootObj.optJSONArray("playlists")
                                    if (playlistsArray != null) {
                                        coroutineScope.launch {
                                            val existingPlaylists = repository.allPlaylists.first()
                                            var importedCount = 0
                                            for (i in 0 until playlistsArray.length()) {
                                                val pObj = playlistsArray.getJSONObject(i)
                                                val name = pObj.getString("name")
                                                val isSmart = pObj.getBoolean("isSmart")
                                                val smartType = if (pObj.has("smartType")) pObj.getString("smartType").let { if (it.isEmpty()) null else it } else null
                                                
                                                // Prevent duplicating existing playlists by checking name or smartType
                                                val isDuplicate = existingPlaylists.any { existing ->
                                                    existing.name.equals(name, ignoreCase = true) ||
                                                    (smartType != null && existing.isSmart && existing.smartType == smartType)
                                                }
                                                if (!isDuplicate) {
                                                    repository.createPlaylist(name, isSmart, smartType)
                                                    importedCount++
                                                }
                                            }
                                        }
                                    }

                                    // Parse and restore folders with duplicate checks
                                    val foldersArray = rootObj.optJSONArray("folders")
                                    if (foldersArray != null) {
                                        coroutineScope.launch {
                                            val existingFolders = repository.allCustomFolders.first()
                                            var importedCount = 0
                                            for (i in 0 until foldersArray.length()) {
                                                val fObj = foldersArray.getJSONObject(i)
                                                val path = fObj.getString("path")
                                                val displayName = fObj.getString("displayName")
                                                
                                                val isDuplicate = existingFolders.any { it.path == path }
                                                if (!isDuplicate) {
                                                    repository.addCustomFolder(path, displayName)
                                                    importedCount++
                                                }
                                            }
                                        }
                                    }

                                    Toast.makeText(context, "Configuration restored and synchronized successfully!", Toast.LENGTH_SHORT).show()
                                    showBackupDialog = false
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Invalid JSON structure. Please verify formatting.", Toast.LENGTH_LONG).show()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = colors.primaryAccent,
                                contentColor = colors.accentOnPrimary
                            )
                        ) {
                            Text("Import & Restore")
                        }
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showBackupDialog = false }) {
                        Text("Close", color = colors.textSecondary)
                    }
                },
                containerColor = colors.elevatedSurface1,
                titleContentColor = colors.textPrimary,
                textContentColor = colors.textPrimary
            )
        }
    }
}
