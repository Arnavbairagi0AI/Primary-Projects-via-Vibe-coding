package com.example.ui.screens

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
import com.example.ui.RescueViewModel
import com.example.ui.theme.*

@Composable
fun HomeScreen(
    viewModel: RescueViewModel,
    onNavigateToTab: (Int) -> Unit
) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    val safetyBroadcastSent by viewModel.safetyBroadcastSent.collectAsState()

    var showFirstAidDialog by remember { mutableStateOf(false) }
    var showOfflineMapsDialog by remember { mutableStateOf(false) }

    val infiniteTransition = rememberInfiniteTransition(label = "Pulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.4f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseAlpha"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(RescueBackground)
            .verticalScroll(scrollState)
            .padding(16.dp)
            .testTag("home_screen"),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Hero Status Section
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp)),
            colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.85f))
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF4ADE80).copy(alpha = pulseAlpha))
                    )
                    Text(
                        text = "SYSTEMS NOMINAL",
                        style = MaterialTheme.typography.labelMedium,
                        color = Color(0xFF4ADE80),
                        fontWeight = FontWeight.Bold
                    )
                }

                Text(
                    text = "Safe - No active threats in your area",
                    style = MaterialTheme.typography.headlineLarge.copy(fontSize = 24.sp),
                    color = Color.White
                )

                Text(
                    text = "AI monitoring is active. No immediate evacuation notices or severe weather alerts for your current GPS coordinates.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = RescueOnSurfaceVariant
                )

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = {
                        viewModel.broadcastSafetyStatus()
                        Toast.makeText(context, "Safety Broadcast Sent to Emergency Contacts", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = RescuePrimaryContainer,
                        contentColor = RescueOnPrimaryContainer
                    ),
                    shape = RoundedCornerShape(24.dp),
                    modifier = Modifier.testTag("broadcast_safety_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.ShareLocation,
                        contentDescription = "Share Location",
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        if (safetyBroadcastSent) "BROADCAST SENT!" else "Broadcast Safety",
                        style = MaterialTheme.typography.titleMedium.copy(fontSize = 14.sp)
                    )
                }
            }
        }

        // Live Disaster Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp))
                .clickable { onNavigateToTab(1) }, // Go to Chat / Disaster details
            colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.85f))
        ) {
            Column {
                // Red indicator bar at top
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .background(RescueSecondaryContainer)
                )

                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = "Warning",
                                    tint = RescueError,
                                    modifier = Modifier.size(16.dp)
                                )
                                Text(
                                    text = "CRITICAL ALERT • 2.4 MILES AWAY",
                                    style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                                    color = RescueError
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Flood Alert: West River Basin",
                                style = MaterialTheme.typography.titleLarge,
                                color = Color.White
                            )
                        }

                        Surface(
                            color = RescueSecondaryContainer.copy(alpha = 0.3f),
                            shape = RoundedCornerShape(12.dp),
                            border = ButtonDefaults.outlinedButtonBorder
                        ) {
                            Text(
                                text = "HIGH SEVERITY",
                                style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                                color = RescueError,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Map Thumbnail Image
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(160.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(RescueSurfaceContainerHighest)
                    ) {
                        AsyncImage(
                            model = "https://lh3.googleusercontent.com/aida-public/AB6AXuAPiF0l9EV-Hvx6sIzsrRJ8qaEURdqqnMuRaruh29ggASJzc6YdWSFRbcO_S1kLrvvu_E3f7isQ6FiG4wDEsfMA3T-mQKJIghKYHZuxWPPSh4bxoGo2xN6T9DDus1CFOf26sIn8_62-lMMhVJnwTrUMCdUpDKMPWL2oVsR62iHfPB4RsKCOIL27MuKK7XtLxLsFcLkiv99clghxajz1VssYE3Sf8o3weZgKkxheeAnGuXirmVHgzpEo",
                            contentDescription = "Disaster Satellite Map",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop,
                            error = painterResource(id = R.drawable.img_hero_banner_1785740735298)
                        )

                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(12.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(RescueBackground.copy(alpha = 0.85f))
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = "Est. Rise: +4.2ft in next 2h",
                                style = MaterialTheme.typography.labelMedium,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }

        // Personal Safety Score Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp)),
            colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.85f))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "Personal Safety Score",
                    style = MaterialTheme.typography.titleMedium,
                    color = RescueOnSurfaceVariant
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Radial Gauge Canvas
                Box(
                    modifier = Modifier.size(160.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val strokeWidth = 12.dp.toPx()
                        // Track Arc
                        drawArc(
                            color = Color(0xFF33353A),
                            startAngle = 135f,
                            sweepAngle = 270f,
                            useCenter = false,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                        )
                        // Score Arc (85%)
                        drawArc(
                            color = RescuePrimary,
                            startAngle = 135f,
                            sweepAngle = 270f * 0.85f,
                            useCenter = false,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                        )
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "85",
                            style = MaterialTheme.typography.displayLarge.copy(fontSize = 44.sp),
                            color = Color.White
                        )
                        Text(
                            text = "/ 100",
                            style = MaterialTheme.typography.labelMedium,
                            color = RescueOnSurfaceVariant
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Reliability: Excellent",
                    style = MaterialTheme.typography.titleMedium,
                    color = RescuePrimary
                )

                Text(
                    text = "Based on current location, route planning, and battery levels.",
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                    color = RescueOnSurfaceVariant
                )
            }
        }

        // Weather Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp)),
            colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.85f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "74°F",
                            style = MaterialTheme.typography.headlineLarge.copy(fontSize = 32.sp),
                            color = Color.White
                        )
                        Text(
                            text = "Thunderstorms Predicted",
                            style = MaterialTheme.typography.bodyMedium,
                            color = RescueOnSurfaceVariant
                        )
                    }

                    Icon(
                        imageVector = Icons.Default.Thunderstorm,
                        contentDescription = "Thunderstorm",
                        tint = RescuePrimary,
                        modifier = Modifier.size(40.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Humidity", style = MaterialTheme.typography.bodyMedium, color = RescueOnSurfaceVariant)
                    Text("88%", style = MaterialTheme.typography.bodyMedium, color = Color.White)
                }
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Wind Velocity", style = MaterialTheme.typography.bodyMedium, color = RescueOnSurfaceVariant)
                    Text("14 mph SE", style = MaterialTheme.typography.bodyMedium, color = Color.White)
                }
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Visibility", style = MaterialTheme.typography.bodyMedium, color = RescueOnSurfaceVariant)
                    Text("2.5 miles", style = MaterialTheme.typography.bodyMedium, color = Color.White)
                }
            }
        }

        // Quick Actions Grid Title
        Text(
            text = "Quick Actions",
            style = MaterialTheme.typography.titleLarge,
            color = Color.White
        )

        // 2x3 Quick Action Grid
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickActionTile(
                    modifier = Modifier
                        .weight(1f)
                        .testTag("action_sos_signal"),
                    icon = Icons.Default.Emergency,
                    iconTint = RescueError,
                    label = "SOS SIGNAL",
                    borderColor = RescueSecondaryContainer,
                    onClick = { onNavigateToTab(2) } // SOS Tab
                )
                QuickActionTile(
                    modifier = Modifier
                        .weight(1f)
                        .testTag("action_ai_advisor"),
                    icon = Icons.Default.SmartToy,
                    iconTint = RescuePrimary,
                    label = "AI ADVISOR",
                    borderColor = RescuePrimaryContainer,
                    onClick = { onNavigateToTab(1) } // Chat Tab
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickActionTile(
                    modifier = Modifier
                        .weight(1f)
                        .testTag("action_report"),
                    icon = Icons.Default.AssignmentLate,
                    iconTint = RescueTertiary,
                    label = "REPORT",
                    borderColor = RescueTertiaryContainer,
                    onClick = { onNavigateToTab(3) } // Reports Tab
                )
                QuickActionTile(
                    modifier = Modifier
                        .weight(1f)
                        .testTag("action_shelters"),
                    icon = Icons.Default.Place,
                    iconTint = RescueOnSurfaceVariant,
                    label = "SHELTERS",
                    borderColor = Color.White.copy(alpha = 0.2f),
                    onClick = {
                        Toast.makeText(context, "Showing 3 Nearby Emergency Shelters", Toast.LENGTH_SHORT).show()
                    }
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickActionTile(
                    modifier = Modifier
                        .weight(1f)
                        .testTag("action_offline_maps"),
                    icon = Icons.Default.Map,
                    iconTint = RescueOnSurfaceVariant,
                    label = "OFFLINE MAPS",
                    borderColor = Color.White.copy(alpha = 0.2f),
                    onClick = { showOfflineMapsDialog = true }
                )
                QuickActionTile(
                    modifier = Modifier
                        .weight(1f)
                        .testTag("action_first_aid"),
                    icon = Icons.Default.MedicalServices,
                    iconTint = RescueOnSurfaceVariant,
                    label = "FIRST AID",
                    borderColor = Color.White.copy(alpha = 0.2f),
                    onClick = { showFirstAidDialog = true }
                )
            }
        }

        // Nearby Resources Horizontal Scroll
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Nearby Resources",
                style = MaterialTheme.typography.titleLarge,
                color = Color.White
            )
            TextButton(onClick = { Toast.makeText(context, "Showing all 12 Emergency Resources", Toast.LENGTH_SHORT).show() }) {
                Text("VIEW ALL →", style = MaterialTheme.typography.labelMedium, color = RescuePrimary)
            }
        }

        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(getNearbyResources()) { resource ->
                ResourceCard(resource = resource)
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
    }

    // First Aid Dialog
    if (showFirstAidDialog) {
        AlertDialog(
            onDismissRequest = { showFirstAidDialog = false },
            title = { Text("Emergency First Aid Guide", color = Color.White) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("• Bleeding: Apply firm pressure with clean cloth.", color = RescueOnSurface)
                    Text("• Severe Asthma: Sit upright, remain calm, administer inhaler (2-4 puffs every 20 min).", color = RescueOnSurface)
                    Text("• Severe Allergies / Anaphylaxis: Inject EpiPen in outer thigh immediately, call 911.", color = RescueOnSurface)
                    Text("• Flood Safety: Avoid wading in water above ankles; beware submerged power lines.", color = RescueOnSurface)
                }
            },
            confirmButton = {
                TextButton(onClick = { showFirstAidDialog = false }) {
                    Text("GOT IT", color = RescuePrimary)
                }
            },
            containerColor = RescueSurfaceContainerHigh
        )
    }

    // Offline Maps Dialog
    if (showOfflineMapsDialog) {
        AlertDialog(
            onDismissRequest = { showOfflineMapsDialog = false },
            title = { Text("Offline Emergency Map", color = Color.White) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Local Region Map Package (Oakwood & River Basin): SYNCED & READY", color = Color(0xFF4ADE80))
                    Text("Shelters, hospitals, and water sources are cached locally for offline use.", color = RescueOnSurfaceVariant)
                }
            },
            confirmButton = {
                TextButton(onClick = { showOfflineMapsDialog = false }) {
                    Text("CLOSE", color = RescuePrimary)
                }
            },
            containerColor = RescueSurfaceContainerHigh
        )
    }
}

@Composable
fun QuickActionTile(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    iconTint: Color,
    label: String,
    borderColor: Color,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier
            .height(96.dp)
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(18.dp))
            .clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.85f))
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = iconTint,
                modifier = Modifier.size(32.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = label,
                style = MaterialTheme.typography.labelMedium,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .width(40.dp)
                    .height(3.dp)
                    .clip(CircleShape)
                    .background(borderColor)
            )
        }
    }
}

data class ResourceItem(
    val name: String,
    val type: String,
    val distance: String,
    val status: String,
    val statusColor: Color,
    val tags: List<String>,
    val imageUrl: String
)

private fun getNearbyResources(): List<ResourceItem> {
    return listOf(
        ResourceItem(
            name = "City Central Hall",
            type = "Shelter",
            distance = "0.8 miles away",
            status = "OPEN",
            statusColor = Color(0xFF4ADE80),
            tags = listOf("CAPACITY: 45%", "PET FRIENDLY"),
            imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCsM7kxoXiFoKcDnuP68kNWiMS2AFEqRyE_sM1FpLVG1N518TcHLtbtIPXhPXSqQjN_SjhpI2xWpNvw_Po_NDwEgjZpcRcWvz4jPPMUBqkvvtuqxm1rL2RE1_Xc7I5YG1Had9cFe8DVgv5m3MFwf3uqYCR9fwEvh27wESEttYGDYblbfpa3goqvp6DnXMI6DP6TAX1vcSgkbvYFgUxuBga5nh-F9ZSRGCb9DA7lDTQ6BVtgPRiZtf6P"
        ),
        ResourceItem(
            name = "Mercy Medical",
            type = "Hospital",
            distance = "1.2 miles away",
            status = "ACTIVE",
            statusColor = Color(0xFF4ADE80),
            tags = listOf("ER: 20M WAIT", "AMBULANCE OK"),
            imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBgsGs--sym8mv0kh0UVhSn9A9pidV-iIEBNe2Cs7aLXxogMxFfH6dqOSJdNWXQnz8mJZk7VPivaw4p3Og44cQNp9HuTFpZN0xkucAItVOJWmDk0yuCwwR1il02ez99MY6A3LLzMbSXm8TznJjSy6bUUsIQPELAZ5z0rX3RUYcCfWUsqee5e6j_YcVDeIT4knNuRqW4Z3knNC_wxvvUdeKUNSCFuUkOv1_ZNf_3dQDdy212mUunxOfc"
        ),
        ResourceItem(
            name = "Starlight Stadium",
            type = "Hub",
            distance = "2.5 miles away",
            status = "NEAR FULL",
            statusColor = Color(0xFFFFB786),
            tags = listOf("CAPACITY: 92%", "WATER / FOOD"),
            imageUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuC_UOJmgp0fm3ad2uTV-xxwXb0xC9tXjQcRtMQ91Nm_fOltzq-VUWQFXUnMrqP5rZvWaPfZU_Lk8defeljZ4IGJqadTIzuOn_MKKImBd3_NJ8_uXnhKc2FxvYq1nIhmi2kFqnL7jFQFg_illt8EFqrmqQBgFB5jFpBHm5i7WR4n481N5u5g5Znozv0HKkq952jXVdjJf_-irWBK8400V0IUEL9B_ldh5Ji8j0ly6UP1W6S6V1np4Ole"
        )
    )
}

@Composable
fun ResourceCard(resource: ResourceItem) {
    Card(
        modifier = Modifier
            .width(260.dp)
            .clip(RoundedCornerShape(20.dp))
            .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(20.dp)),
        colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.85f))
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(110.dp)
                    .background(RescueSurfaceContainerHighest)
            ) {
                AsyncImage(
                    model = resource.imageUrl,
                    contentDescription = resource.name,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }

            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = resource.name,
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.White,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = resource.status,
                        style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                        color = resource.statusColor,
                        fontWeight = FontWeight.Bold
                    )
                }

                Text(
                    text = "${resource.type} • ${resource.distance}",
                    style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                    color = RescueOnSurfaceVariant
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    resource.tags.forEach { tag ->
                        Surface(
                            color = RescueSurfaceContainerLow,
                            shape = RoundedCornerShape(6.dp),
                            border = ButtonDefaults.outlinedButtonBorder
                        ) {
                            Text(
                                text = tag,
                                style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp),
                                color = RescuePrimary,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
