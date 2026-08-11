package com.example.ui.screens

import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.example.playback.AudioPlayerManager
import com.example.ui.theme.ThemeTokens

private enum class EqHapticType {
    HEAVY, MEDIUM, LIGHT, TICK
}

private fun triggerEqHaptic(context: android.content.Context, type: EqHapticType) {
    try {
        val intensity = ThemeConfig.hapticIntensity.value
        if (intensity < 0.05f) return // Off
        val vibrator = context.getSystemService(android.content.Context.VIBRATOR_SERVICE) as? Vibrator
        if (vibrator != null && vibrator.hasVibrator()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val effect = when (type) {
                    EqHapticType.HEAVY -> VibrationEffect.createOneShot(45, (200 * intensity).toInt().coerceIn(1, 255))
                    EqHapticType.MEDIUM -> VibrationEffect.createOneShot(25, (130 * intensity).toInt().coerceIn(1, 255))
                    EqHapticType.LIGHT -> VibrationEffect.createOneShot(12, (80 * intensity).toInt().coerceIn(1, 255))
                    EqHapticType.TICK -> VibrationEffect.createOneShot(6, (45 * intensity).toInt().coerceIn(1, 255))
                }
                vibrator.vibrate(effect)
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(when (type) {
                    EqHapticType.HEAVY -> (40 * intensity).toLong().coerceAtLeast(1L)
                    EqHapticType.MEDIUM -> (20 * intensity).toLong().coerceAtLeast(1L)
                    EqHapticType.LIGHT -> (10 * intensity).toLong().coerceAtLeast(1L)
                    EqHapticType.TICK -> (5 * intensity).toLong().coerceAtLeast(1L)
                })
            }
        }
    } catch (e: Exception) {
        // Fallback
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EqualizerScreen(navController: NavController) {
    val scrollState = rememberScrollState()
    val context = LocalContext.current

    // AudioPlayerManager State flows
    val isEnabled by AudioPlayerManager.equalizerEnabled.collectAsState()
    val bandMode by AudioPlayerManager.equalizerBandMode.collectAsState()
    val bands by AudioPlayerManager.equalizerBands.collectAsState()
    val selectedPreset by AudioPlayerManager.selectedPreset.collectAsState()
    val preampLevel by AudioPlayerManager.preampLevel.collectAsState()
    val bassBoostStrength by AudioPlayerManager.bassBoostStrength.collectAsState()
    val trebleBoostStrength by AudioPlayerManager.trebleBoostStrength.collectAsState()
    val virtualizerStrength by AudioPlayerManager.virtualizerStrength.collectAsState()
    val loudnessStrength by AudioPlayerManager.loudnessStrength.collectAsState()
    val stereoBalance by AudioPlayerManager.stereoBalance.collectAsState()
    val leftChannelGain by AudioPlayerManager.leftChannelGain.collectAsState()
    val rightChannelGain by AudioPlayerManager.rightChannelGain.collectAsState()
    val surroundEnabled by AudioPlayerManager.surroundEnabled.collectAsState()
    val surroundStrength by AudioPlayerManager.surroundStrength.collectAsState()
    val reverbPreset by AudioPlayerManager.reverbPreset.collectAsState()
    val customPresets by AudioPlayerManager.customPresets.collectAsState()

    var showPresetMenu by remember { mutableStateOf(false) }
    var showReverbMenu by remember { mutableStateOf(false) }
    var showSaveDialog by remember { mutableStateOf(false) }
    var showImportDialog by remember { mutableStateOf(false) }
    var showExportDialog by remember { mutableStateOf(false) }
    var presetNameInput by remember { mutableStateOf("") }
    var importJsonInput by remember { mutableStateOf("") }
    var importNameInput by remember { mutableStateOf("") }

    val builtInPresets = listOf(
        "Flat", "Normal", "Bass Booster", "Extra Bass", "Deep Bass", "Heavy Bass",
        "Vocal", "Podcast", "Speech", "Acoustic", "Classical", "Jazz", "Blues",
        "Rock", "Soft Rock", "Hard Rock", "Metal", "Pop", "Dance", "EDM", "House",
        "Techno", "Trance", "Dubstep", "Hip-Hop", "Rap", "Trap", "Phonk", "Lo-Fi",
        "Chill", "Ambient", "Piano", "Orchestra", "Bollywood", "Punjabi", "Devotional",
        "Gaming", "Movie", "Cinema", "Surround", "Studio Monitor", "Party", "Car Audio",
        "Headphones", "Earbuds", "Outdoor", "Night Listening"
    )

    val reverbOptions = listOf("None", "Small Room", "Medium Room", "Large Room", "Plate", "Hall")

    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.baseBackground)
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        // Top Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = spacing.medium, vertical = spacing.small),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { navController.navigateUp() }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = colors.textPrimary)
                }
                Text(
                    text = "Audio FX & Equalizer",
                    style = typography.displayHeader,
                    color = colors.textPrimary,
                    modifier = Modifier.padding(start = spacing.small)
                )
            }
            if (isEnabled) {
                IconButton(onClick = {
                    AudioPlayerManager.resetCurrentPreset(context)
                    Toast.makeText(context, "Equalizer reset to flat", Toast.LENGTH_SHORT).show()
                }) {
                    Icon(Icons.Default.Refresh, contentDescription = "Reset", tint = colors.primaryAccent)
                }
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = spacing.medium, vertical = spacing.small)
        ) {
            // Toggle Switch Card
            Card(
                shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
                colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
                border = BorderStroke(1.dp, colors.border),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(spacing.medium),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Enable Equalizer",
                            color = colors.textPrimary,
                            style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "Apply global frequency tuning and high-fidelity sound processing",
                            color = colors.textSecondary,
                            style = typography.labelText
                        )
                    }
                    Switch(
                        checked = isEnabled,
                        onCheckedChange = { AudioPlayerManager.setEqualizerEnabled(context, it) },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = colors.accentOnPrimary,
                            checkedTrackColor = colors.primaryAccent,
                            uncheckedThumbColor = colors.textSecondary,
                            uncheckedTrackColor = colors.border
                        )
                    )
                }
            }

            if (isEnabled) {
                Spacer(modifier = Modifier.height(spacing.medium))

                // Band Mode Selector (5, 10, 15 Bands)
                Card(
                    shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
                    colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
                    border = BorderStroke(1.dp, colors.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(spacing.medium)) {
                        Text("Equalizer Mode", color = colors.textSecondary, style = typography.labelText)
                        Spacer(modifier = Modifier.height(spacing.small))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(spacing.small)
                        ) {
                            listOf(5, 10, 15).forEach { mode ->
                                val active = (bandMode == mode)
                                Button(
                                    onClick = { AudioPlayerManager.setEqualizerBandMode(context, mode) },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (active) colors.primaryAccent else colors.elevatedSurface2,
                                        contentColor = if (active) colors.accentOnPrimary else colors.textPrimary
                                    ),
                                    shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("$mode Bands", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(spacing.medium))

                // Preset Card with Full Controls
                Card(
                    shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
                    colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
                    border = BorderStroke(1.dp, colors.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(spacing.medium)) {
                        Text("Active Sound Preset", color = colors.textSecondary, style = typography.labelText)
                        Spacer(modifier = Modifier.height(spacing.small))
                        Box {
                            Button(
                                onClick = { showPresetMenu = true },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.elevatedSurface2,
                                    contentColor = colors.textPrimary
                                ),
                                shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(selectedPreset, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Dropdown")
                                }
                            }
                            DropdownMenu(
                                expanded = showPresetMenu,
                                onDismissRequest = { showPresetMenu = false },
                                modifier = Modifier
                                    .background(colors.elevatedSurface2)
                                    .sizeIn(maxHeight = 350.dp)
                            ) {
                                customPresets.keys.forEach { preset ->
                                    DropdownMenuItem(
                                        text = { Text("⭐ $preset", color = colors.textPrimary, fontWeight = FontWeight.Bold) },
                                        onClick = {
                                            AudioPlayerManager.applyPreset(context, preset)
                                            showPresetMenu = false
                                        }
                                    )
                                }
                                if (customPresets.isNotEmpty()) {
                                    HorizontalDivider(color = colors.border)
                                }
                                builtInPresets.forEach { preset ->
                                    DropdownMenuItem(
                                        text = { Text(preset, color = colors.textPrimary) },
                                        onClick = {
                                            AudioPlayerManager.applyPreset(context, preset)
                                            showPresetMenu = false
                                        }
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(spacing.medium))

                        // Preset Operations Panel
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(spacing.small)
                        ) {
                            Button(
                                onClick = {
                                    presetNameInput = ""
                                    showSaveDialog = true
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = colors.elevatedSurface2, contentColor = colors.primaryAccent),
                                shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Save New", fontSize = 11.sp)
                            }

                            Button(
                                onClick = {
                                    importNameInput = ""
                                    importJsonInput = ""
                                    showImportDialog = true
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = colors.elevatedSurface2, contentColor = colors.textPrimary),
                                shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.ExitToApp, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Import", fontSize = 11.sp)
                            }

                            if (customPresets.containsKey(selectedPreset)) {
                                Button(
                                    onClick = {
                                        showExportDialog = true
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = colors.elevatedSurface2, contentColor = colors.textPrimary),
                                    shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Export", fontSize = 11.sp)
                                }

                                Button(
                                    onClick = {
                                        AudioPlayerManager.deleteCustomPreset(context, selectedPreset)
                                        Toast.makeText(context, "Preset '$selectedPreset' deleted", Toast.LENGTH_SHORT).show()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = colors.elevatedSurface2, contentColor = Color.Red),
                                    shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Delete", fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(spacing.medium))

                // Custom Scrollable Audio Console Sliders Card (Console Mixing Deck)
                Card(
                    shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
                    colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
                    border = BorderStroke(1.dp, colors.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(spacing.medium)) {
                        Text("Tuning Console (Scroll Horizontally)", color = colors.textSecondary, style = typography.labelText)
                        Spacer(modifier = Modifier.height(spacing.medium))

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(220.dp)
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(20.dp)
                        ) {
                            // 1. Preamp Slider
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.width(55.dp)
                            ) {
                                val preampDB = preampLevel / 100
                                Text(
                                    text = "${if (preampDB > 0) "+" else ""}$preampDB",
                                    color = colors.primaryAccent,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Slider(
                                    value = preampLevel.toFloat(),
                                    onValueChange = { 
                                        AudioPlayerManager.setPreampLevel(context, it.toInt())
                                        triggerEqHaptic(context, EqHapticType.TICK)
                                    },
                                    valueRange = -1500f..1500f,
                                    modifier = Modifier.weight(1f),
                                    colors = SliderDefaults.colors(
                                        activeTrackColor = colors.primaryAccent,
                                        inactiveTrackColor = colors.border,
                                        thumbColor = colors.primaryAccent
                                    )
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "PRE",
                                    color = colors.textPrimary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Preamp",
                                    color = colors.textSecondary,
                                    fontSize = 9.sp
                                )
                            }

                            VerticalDivider(color = colors.border, modifier = Modifier.padding(vertical = 12.dp))

                            // 2. Frequency Band Sliders
                            val hzList = when (bandMode) {
                                5 -> AudioPlayerManager.freq5.map { if (it >= 1000) "${it / 1000}k" else "${it}H" }
                                10 -> AudioPlayerManager.freq10.map { if (it >= 1000) "${it / 1000}k" else "${it}H" }
                                else -> AudioPlayerManager.freq15.map { if (it >= 1000) "${it / 1000}k" else "${it}H" }
                            }

                            for (i in 0 until bandMode) {
                                val level = bands[i] ?: 0
                                val dBVal = level / 100
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.width(50.dp)
                                ) {
                                    Text(
                                        text = "${if (dBVal > 0) "+" else ""}$dBVal",
                                        color = if (dBVal != 0) colors.primaryAccent else colors.textSecondary,
                                        fontSize = 11.sp,
                                        fontWeight = if (dBVal != 0) FontWeight.Bold else FontWeight.Normal
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Slider(
                                        value = level.toFloat(),
                                        onValueChange = { 
                                            AudioPlayerManager.setEqualizerBandLevel(context, i, it.toInt())
                                            triggerEqHaptic(context, EqHapticType.TICK)
                                        },
                                        valueRange = -1500f..1500f,
                                        modifier = Modifier.weight(1f),
                                        colors = SliderDefaults.colors(
                                            activeTrackColor = colors.primaryAccent,
                                            inactiveTrackColor = colors.border,
                                            thumbColor = colors.primaryAccent
                                        )
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = hzList.getOrElse(i) { "$i" },
                                        color = colors.textPrimary,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Hz",
                                        color = colors.textSecondary,
                                        fontSize = 9.sp
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(spacing.medium))

                // Professional DSP Enhancements Card
                Card(
                    shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
                    colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
                    border = BorderStroke(1.dp, colors.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(spacing.medium)) {
                        Text("DSP Master Enhancements", color = colors.textSecondary, style = typography.labelText)
                        Spacer(modifier = Modifier.height(spacing.medium))

                        // Sub-Bass Boost Strength
                        Column(modifier = Modifier.padding(vertical = spacing.small)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Sub-Bass Boost", color = colors.textPrimary, style = typography.bodyText)
                                Text("${bassBoostStrength / 10}%", color = colors.primaryAccent, style = typography.bodyText.copy(fontWeight = FontWeight.Bold))
                            }
                            Slider(
                                                                value = bassBoostStrength.toFloat(),
                                                                onValueChange = { 
                                                                    AudioPlayerManager.setBassBoostStrength(context, it.toInt())
                                                                    triggerEqHaptic(context, EqHapticType.TICK)
                                                                },
                                                                valueRange = 0f..1000f,
                                colors = SliderDefaults.colors(
                                    activeTrackColor = colors.primaryAccent,
                                    inactiveTrackColor = colors.border,
                                    thumbColor = colors.primaryAccent
                                )
                            )
                        }

                        // Treble Boost Strength
                        Column(modifier = Modifier.padding(vertical = spacing.small)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Crystal Treble Boost", color = colors.textPrimary, style = typography.bodyText)
                                Text("${trebleBoostStrength / 10}%", color = colors.primaryAccent, style = typography.bodyText.copy(fontWeight = FontWeight.Bold))
                            }
                            Slider(
                                                                value = trebleBoostStrength.toFloat(),
                                                                onValueChange = { 
                                                                    AudioPlayerManager.setTrebleBoostStrength(context, it.toInt())
                                                                    triggerEqHaptic(context, EqHapticType.TICK)
                                                                },
                                                                valueRange = 0f..1000f,
                                colors = SliderDefaults.colors(
                                    activeTrackColor = colors.primaryAccent,
                                    inactiveTrackColor = colors.border,
                                    thumbColor = colors.primaryAccent
                                )
                            )
                        }

                        // Spatial Virtualizer Strength
                        Column(modifier = Modifier.padding(vertical = spacing.small)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("3D Spatial Virtualizer", color = colors.textPrimary, style = typography.bodyText)
                                Text("${virtualizerStrength / 10}%", color = colors.primaryAccent, style = typography.bodyText.copy(fontWeight = FontWeight.Bold))
                            }
                            Slider(
                                                                value = virtualizerStrength.toFloat(),
                                                                onValueChange = { 
                                                                    AudioPlayerManager.setVirtualizerStrength(context, it.toInt())
                                                                    triggerEqHaptic(context, EqHapticType.TICK)
                                                                },
                                                                valueRange = 0f..1000f,
                                colors = SliderDefaults.colors(
                                    activeTrackColor = colors.primaryAccent,
                                    inactiveTrackColor = colors.border,
                                    thumbColor = colors.primaryAccent
                                )
                            )
                        }

                        // Loudness Gain Strength
                        Column(modifier = Modifier.padding(vertical = spacing.small)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Loudness Maximizer", color = colors.textPrimary, style = typography.bodyText)
                                Text("${loudnessStrength / 10}%", color = colors.primaryAccent, style = typography.bodyText.copy(fontWeight = FontWeight.Bold))
                            }
                            Slider(
                                                                value = loudnessStrength.toFloat(),
                                                                onValueChange = { 
                                                                    AudioPlayerManager.setLoudnessStrength(context, it.toInt())
                                                                    triggerEqHaptic(context, EqHapticType.TICK)
                                                                },
                                                                valueRange = 0f..1000f,
                                colors = SliderDefaults.colors(
                                    activeTrackColor = colors.primaryAccent,
                                    inactiveTrackColor = colors.border,
                                    thumbColor = colors.primaryAccent
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(spacing.medium))

                // Reverb & Surround Card
                Card(
                    shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
                    colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
                    border = BorderStroke(1.dp, colors.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(spacing.medium)) {
                        Text("Environment Reverb & Surround", color = colors.textSecondary, style = typography.labelText)
                        Spacer(modifier = Modifier.height(spacing.medium))

                        // Surround Simulator Enable and Strength
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Surround Sound Simulation", color = colors.textPrimary, style = typography.bodyText.copy(fontWeight = FontWeight.Bold))
                                Text("Simulate multi-channel speaker setup", color = colors.textSecondary, fontSize = 11.sp)
                            }
                            Switch(
                                checked = surroundEnabled,
                                onCheckedChange = { AudioPlayerManager.setSurroundEnabled(context, it) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = colors.accentOnPrimary,
                                    checkedTrackColor = colors.primaryAccent,
                                    uncheckedThumbColor = colors.textSecondary,
                                    uncheckedTrackColor = colors.border
                                )
                            )
                        }

                        if (surroundEnabled) {
                            Spacer(modifier = Modifier.height(spacing.small))
                            Column {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Surround Field Strength", color = colors.textPrimary, style = typography.bodyText)
                                    Text("${surroundStrength / 10}%", color = colors.primaryAccent, style = typography.bodyText.copy(fontWeight = FontWeight.Bold))
                                }
                                Slider(
                                                                    value = surroundStrength.toFloat(),
                                                                    onValueChange = { 
                                                                        AudioPlayerManager.setSurroundStrength(context, it.toInt())
                                                                        triggerEqHaptic(context, EqHapticType.TICK)
                                                                    },
                                                                    valueRange = 0f..1000f,
                                    colors = SliderDefaults.colors(
                                        activeTrackColor = colors.primaryAccent,
                                        inactiveTrackColor = colors.border,
                                        thumbColor = colors.primaryAccent
                                    )
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(spacing.medium))

                        // Reverb Option Selection
                        Text("Acoustic Reverb Preset", color = colors.textPrimary, style = typography.bodyText.copy(fontWeight = FontWeight.Bold))
                        Spacer(modifier = Modifier.height(spacing.small))
                        Box {
                            Button(
                                onClick = { showReverbMenu = true },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.elevatedSurface2,
                                    contentColor = colors.textPrimary
                                ),
                                shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(reverbPreset, style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Dropdown")
                                }
                            }
                            DropdownMenu(
                                expanded = showReverbMenu,
                                onDismissRequest = { showReverbMenu = false },
                                modifier = Modifier.background(colors.elevatedSurface2)
                            ) {
                                reverbOptions.forEach { option ->
                                    DropdownMenuItem(
                                        text = { Text(option, color = colors.textPrimary) },
                                        onClick = {
                                            AudioPlayerManager.setReverbPreset(context, option)
                                            showReverbMenu = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(spacing.medium))

                // Channel Stereo Balance & Volume Card
                Card(
                    shape = RoundedCornerShape(ThemeTokens.shapes.sheetRadius),
                    colors = CardDefaults.cardColors(containerColor = colors.elevatedSurface1),
                    border = BorderStroke(1.dp, colors.border),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(spacing.medium)) {
                        Text("Stereo Controls", color = colors.textSecondary, style = typography.labelText)
                        Spacer(modifier = Modifier.height(spacing.medium))

                        // Stereo Balance Slider
                        Column(modifier = Modifier.padding(vertical = spacing.small)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Stereo Balance (L / R)", color = colors.textPrimary, style = typography.bodyText)
                                val balanceText = when {
                                    stereoBalance < -0.05f -> "Left ${(stereoBalance * -100).toInt()}%"
                                    stereoBalance > 0.05f -> "Right ${(stereoBalance * 100).toInt()}%"
                                    else -> "Center"
                                }
                                Text(balanceText, color = colors.primaryAccent, style = typography.bodyText.copy(fontWeight = FontWeight.Bold))
                            }
                            Slider(
                                                                value = stereoBalance,
                                                                onValueChange = { 
                                                                    AudioPlayerManager.setStereoBalance(context, it)
                                                                    triggerEqHaptic(context, EqHapticType.TICK)
                                                                },
                                                                valueRange = -1.0f..1.0f,
                                colors = SliderDefaults.colors(
                                    activeTrackColor = colors.primaryAccent,
                                    inactiveTrackColor = colors.border,
                                    thumbColor = colors.primaryAccent
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(spacing.small))

                        // Independent Channel Gain Sliders
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(spacing.medium)
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Left Channel", color = colors.textPrimary, fontSize = 12.sp)
                                    Text("${(leftChannelGain * 100).toInt()}%", color = colors.primaryAccent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                                Slider(
                                                                    value = leftChannelGain,
                                                                    onValueChange = { 
                                                                        AudioPlayerManager.setLeftRightGains(context, it, rightChannelGain)
                                                                        triggerEqHaptic(context, EqHapticType.TICK)
                                                                    },
                                                                    valueRange = 0.0f..1.0f,
                                    colors = SliderDefaults.colors(
                                        activeTrackColor = colors.primaryAccent,
                                        inactiveTrackColor = colors.border,
                                        thumbColor = colors.primaryAccent
                                    )
                                )
                            }

                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text("Right Channel", color = colors.textPrimary, fontSize = 12.sp)
                                    Text("${(rightChannelGain * 100).toInt()}%", color = colors.primaryAccent, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                                Slider(
                                                                    value = rightChannelGain,
                                                                    onValueChange = { 
                                                                        AudioPlayerManager.setLeftRightGains(context, leftChannelGain, it)
                                                                        triggerEqHaptic(context, EqHapticType.TICK)
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
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 80.dp, horizontal = 40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Equalizer is disabled.\nTurn it on at the top to access the professional tuning console, presets, and DSP acoustic master effects.",
                        color = colors.textSecondary,
                        textAlign = TextAlign.Center,
                        style = typography.bodyMedium,
                        lineHeight = 22.sp
                    )
                }
            }
        }
    }

    // 1. Dialog: Save Custom Preset
    if (showSaveDialog) {
        AlertDialog(
            onDismissRequest = { showSaveDialog = false },
            title = { Text("Save Custom Preset", color = colors.textPrimary) },
            text = {
                Column {
                    Text("Enter a unique name for your custom sound tuning:", color = colors.textSecondary)
                    Spacer(modifier = Modifier.height(spacing.small))
                    TextField(
                        value = presetNameInput,
                        onValueChange = { presetNameInput = it },
                        singleLine = true,
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = colors.elevatedSurface2,
                            unfocusedContainerColor = colors.elevatedSurface2,
                            focusedTextColor = colors.textPrimary,
                            unfocusedTextColor = colors.textPrimary,
                            cursorColor = colors.primaryAccent
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val name = presetNameInput.trim()
                        if (name.isNotEmpty()) {
                            AudioPlayerManager.createCustomPreset(context, name)
                            Toast.makeText(context, "Saved preset '$name'", Toast.LENGTH_SHORT).show()
                            showSaveDialog = false
                        } else {
                            Toast.makeText(context, "Please enter a valid name", Toast.LENGTH_SHORT).show()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent, contentColor = colors.accentOnPrimary)
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { showSaveDialog = false }) {
                    Text("Cancel", color = colors.primaryAccent)
                }
            },
            containerColor = colors.elevatedSurface1
        )
    }

    // 2. Dialog: Import Preset
    if (showImportDialog) {
        AlertDialog(
            onDismissRequest = { showImportDialog = false },
            title = { Text("Import Preset Code", color = colors.textPrimary) },
            text = {
                Column {
                    Text("Preset Name:", color = colors.textSecondary, fontSize = 12.sp)
                    TextField(
                        value = importNameInput,
                        onValueChange = { importNameInput = it },
                        singleLine = true,
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = colors.elevatedSurface2,
                            unfocusedContainerColor = colors.elevatedSurface2,
                            focusedTextColor = colors.textPrimary,
                            unfocusedTextColor = colors.textPrimary
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(spacing.small))
                    Text("Paste JSON array code:", color = colors.textSecondary, fontSize = 12.sp)
                    TextField(
                        value = importJsonInput,
                        onValueChange = { importJsonInput = it },
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = colors.elevatedSurface2,
                            unfocusedContainerColor = colors.elevatedSurface2,
                            focusedTextColor = colors.textPrimary,
                            unfocusedTextColor = colors.textPrimary
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(100.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val name = importNameInput.trim()
                        val json = importJsonInput.trim()
                        if (name.isNotEmpty() && json.isNotEmpty()) {
                            val success = AudioPlayerManager.importCustomPreset(context, name, json)
                            if (success) {
                                Toast.makeText(context, "Imported preset '$name'", Toast.LENGTH_SHORT).show()
                                showImportDialog = false
                            } else {
                                Toast.makeText(context, "Invalid preset code format", Toast.LENGTH_SHORT).show()
                            }
                        } else {
                            Toast.makeText(context, "Fill in all fields", Toast.LENGTH_SHORT).show()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent, contentColor = colors.accentOnPrimary)
                ) {
                    Text("Import")
                }
            },
            dismissButton = {
                TextButton(onClick = { showImportDialog = false }) {
                    Text("Cancel", color = colors.primaryAccent)
                }
            },
            containerColor = colors.elevatedSurface1
        )
    }

    // 3. Dialog: Export Preset Code
    if (showExportDialog) {
        val exportCode = AudioPlayerManager.exportCustomPreset(selectedPreset)
        AlertDialog(
            onDismissRequest = { showExportDialog = false },
            title = { Text("Export Preset Code", color = colors.textPrimary) },
            text = {
                Column {
                    Text("Copy and share this code for the preset '$selectedPreset':", color = colors.textSecondary)
                    Spacer(modifier = Modifier.height(spacing.small))
                    TextField(
                        value = exportCode,
                        onValueChange = {},
                        readOnly = true,
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = colors.elevatedSurface2,
                            unfocusedContainerColor = colors.elevatedSurface2,
                            focusedTextColor = colors.textPrimary,
                            unfocusedTextColor = colors.textPrimary
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showExportDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = colors.primaryAccent, contentColor = colors.accentOnPrimary)
                ) {
                    Text("Done")
                }
            },
            containerColor = colors.elevatedSurface1
        )
    }
}
