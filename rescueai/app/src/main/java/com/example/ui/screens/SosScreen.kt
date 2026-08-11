package com.example.ui.screens

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.RescueViewModel
import com.example.ui.theme.*

@Composable
fun SosScreen(
    viewModel: RescueViewModel,
    onNavigateToProfile: () -> Unit
) {
    val context = LocalContext.current
    val medicalProfile by viewModel.medicalProfile.collectAsState()
    val countdown by viewModel.sosCountdown.collectAsState()
    val isCounting by viewModel.isSosCounting.collectAsState()
    val isActive by viewModel.isSosActive.collectAsState()
    val isCancelled by viewModel.sosCancelled.collectAsState()

    val scrollState = rememberScrollState()

    val infiniteTransition = rememberInfiniteTransition(label = "SosPulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "sosPulseScale"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(RescueBackground)
            .testTag("sos_screen")
    ) {
        // Red Pulsing Atmospheric Background
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            RescueSecondaryContainer.copy(alpha = if (isActive || isCounting) 0.35f else 0.15f),
                            Color.Transparent
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Medical Profile Preview Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(20.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(20.dp))
                    .clickable { onNavigateToProfile() }
                    .testTag("medical_profile_preview_card"),
                colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.75f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.MedicalServices,
                                contentDescription = "Medical Services",
                                tint = RescuePrimary,
                                modifier = Modifier.size(20.dp)
                            )
                            Text(
                                text = "MEDICAL PROFILE",
                                style = MaterialTheme.typography.labelMedium,
                                color = RescueOnSurfaceVariant,
                                letterSpacing = 1.5.sp
                            )
                        }

                        Surface(
                            color = RescueSecondaryContainer,
                            shape = CircleShape
                        ) {
                            Text(
                                text = medicalProfile?.bloodType ?: "O+ Negative",
                                style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                                color = RescueOnSecondaryContainer,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Name",
                                style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                                color = RescueOnSurfaceVariant
                            )
                            Text(
                                text = medicalProfile?.name ?: "Sarah Jenkins",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Conditions",
                                style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                                color = RescueOnSurfaceVariant
                            )
                            Text(
                                text = medicalProfile?.conditions ?: "Asthma, Nut Allergy",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color.White
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Central SOS Core
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier.size(240.dp),
                    contentAlignment = Alignment.Center
                ) {
                    // Countdown Outer Arc Canvas
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val strokeWidth = 8.dp.toPx()
                        drawArc(
                            color = Color.White.copy(alpha = 0.15f),
                            startAngle = -90f,
                            sweepAngle = 360f,
                            useCenter = false,
                            style = Stroke(width = strokeWidth)
                        )
                        val progressSweep = if (isCounting) (countdown / 5f) * 360f else if (isActive) 360f else 0f
                        drawArc(
                            color = if (isActive) RescueSecondaryContainer else RescuePrimary,
                            startAngle = -90f,
                            sweepAngle = progressSweep,
                            useCenter = false,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                        )
                    }

                    // Main SOS Circle Button
                    Box(
                        modifier = Modifier
                            .size(210.dp)
                            .scale(if (isCounting || isActive) pulseScale else 1f)
                            .clip(CircleShape)
                            .background(if (isActive) RescueErrorContainer else RescueSecondaryContainer)
                            .border(4.dp, RescueOnSecondaryContainer, CircleShape)
                            .clickable {
                                if (!isCounting && !isActive) {
                                    viewModel.startSosCountdown()
                                } else {
                                    viewModel.cancelSos()
                                }
                            }
                            .testTag("sos_button"),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "SOS",
                                style = MaterialTheme.typography.displayLarge.copy(
                                    fontSize = 64.sp,
                                    fontWeight = FontWeight.Black
                                ),
                                color = Color.White
                            )

                            Row(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                modifier = Modifier.padding(top = 4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(Color.White.copy(alpha = 0.8f))
                                )
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(Color.White.copy(alpha = 0.8f))
                                )
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .clip(CircleShape)
                                        .background(Color.White.copy(alpha = 0.8f))
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                Text(
                    text = when {
                        isActive -> "EMERGENCY ACTIVE"
                        isCounting -> "0:0$countdown"
                        isCancelled -> "CANCELLED"
                        else -> "TAP / HOLD FOR SOS"
                    },
                    style = MaterialTheme.typography.headlineLarge.copy(fontSize = 36.sp),
                    color = if (isActive) RescueError else RescuePrimary,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    text = when {
                        isActive -> "Encrypted location & medical profile transmitted to rescue dispatch."
                        isCounting -> "Hold or tap Cancel within $countdown seconds"
                        else -> "Touch SOS to activate emergency protocol"
                    },
                    style = MaterialTheme.typography.bodyMedium,
                    color = RescueOnSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Quick Actions Bento Grid
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                SosActionCard(
                    modifier = Modifier.testTag("sos_send_gps"),
                    icon = Icons.Default.LocationOn,
                    iconColor = RescuePrimary,
                    iconBg = RescuePrimary.copy(alpha = 0.2f),
                    title = "Send GPS Coordinates",
                    borderColor = RescuePrimary,
                    onClick = {
                        Toast.makeText(context, "Transmitting Encrypted GPS: 35.2271° N, 80.8431° W", Toast.LENGTH_SHORT).show()
                    }
                )

                SosActionCard(
                    modifier = Modifier.testTag("sos_notify_contacts"),
                    icon = Icons.Default.Group,
                    iconColor = RescueTertiary,
                    iconBg = RescueTertiary.copy(alpha = 0.2f),
                    title = "Notify Emergency Contacts",
                    borderColor = RescueTertiary,
                    onClick = {
                        Toast.makeText(context, "SMS Broadcast Sent to 2 Emergency Contacts", Toast.LENGTH_SHORT).show()
                    }
                )

                SosActionCard(
                    modifier = Modifier.testTag("sos_alert_rescue"),
                    icon = Icons.Default.Emergency,
                    iconColor = RescueError,
                    iconBg = RescueError.copy(alpha = 0.2f),
                    title = "Alert Nearest Rescue Teams",
                    borderColor = RescueError,
                    onClick = {
                        viewModel.triggerEmergency()
                        Toast.makeText(context, "Nearest Ground Rescue Unit Delta-4 Alerted!", Toast.LENGTH_SHORT).show()
                    }
                )
            }

            // Cancel SOS Button
            OutlinedButton(
                onClick = { viewModel.cancelSos() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
                    .testTag("cancel_sos_button"),
                shape = CircleShape,
                border = ButtonDefaults.outlinedButtonBorder.copy(brush = Brush.horizontalGradient(listOf(RescueOutlineVariant, RescueOutlineVariant)))
            ) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Cancel",
                    tint = RescueOnSurfaceVariant
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Cancel SOS",
                    style = MaterialTheme.typography.titleMedium,
                    color = RescueOnSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun SosActionCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    iconColor: Color,
    iconBg: Color,
    title: String,
    borderColor: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(18.dp))
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainerHigh.copy(alpha = 0.9f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(iconBg),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = title,
                        tint = iconColor,
                        modifier = Modifier.size(24.dp)
                    )
                }

                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White
                )
            }

            Icon(
                imageVector = Icons.Default.ChevronRight,
                contentDescription = "Go",
                tint = RescueOnSurfaceVariant
            )
        }
    }
}
