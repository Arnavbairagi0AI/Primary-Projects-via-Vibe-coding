package com.example.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.R
import com.example.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onNavigateToHome: () -> Unit
) {
    var progress by remember { mutableFloatStateOf(0f) }
    var statusText by remember { mutableStateOf("INITIALIZING SATELLITE UPLINK...") }

    val infiniteTransition = rememberInfiniteTransition(label = "GlobeRotation")
    val rotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(15000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    LaunchedEffect(Unit) {
        val statuses = listOf(
            "INITIALIZING SATELLITE UPLINK...",
            "CALIBRATING AI MODELS...",
            "SYNCING EMERGENCY DATABASE...",
            "ESTABLISHING SECURE PROTOCOLS...",
            "READY FOR DEPLOYMENT"
        )
        for (i in 0..100) {
            progress = i / 100f
            val statusIdx = (progress * (statuses.size - 1)).toInt().coerceIn(0, statuses.size - 1)
            statusText = statuses[statusIdx]
            delay(35)
        }
        delay(300)
        onNavigateToHome()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(RescueBackground)
            .testTag("splash_screen")
    ) {
        // Subtle background glow
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            RescuePrimaryContainer.copy(alpha = 0.25f),
                            Color.Transparent
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Globe Icon / Image Container
            Box(
                modifier = Modifier
                    .size(140.dp)
                    .scale(pulseScale)
                    .clip(CircleShape)
                    .background(RescueSurfaceContainer.copy(alpha = 0.6f))
                    .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.img_splash_globe_1785740748378),
                    contentDescription = "Globe Hologram",
                    modifier = Modifier
                        .fillMaxSize()
                        .rotate(rotationAngle),
                    contentScale = ContentScale.Crop
                )
            }

            Spacer(modifier = Modifier.height(36.dp))

            // Logo & Title
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(RescuePrimaryContainer)
                        .border(1.dp, RescuePrimary.copy(alpha = 0.4f), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.MedicalServices,
                        contentDescription = "Medical Services Icon",
                        tint = RescueOnPrimaryContainer,
                        modifier = Modifier.size(28.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Text(
                    text = "Rescue",
                    style = MaterialTheme.typography.displayLarge.copy(fontSize = 38.sp),
                    color = Color.White
                )
                Text(
                    text = "AI",
                    style = MaterialTheme.typography.displayLarge.copy(fontSize = 38.sp),
                    color = RescuePrimary
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Tagline
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .width(32.dp)
                        .height(1.dp)
                        .background(RescuePrimary.copy(alpha = 0.5f))
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "SAVING LIVES WITH AI",
                    style = MaterialTheme.typography.labelMedium,
                    color = RescuePrimary,
                    letterSpacing = 3.sp
                )
                Spacer(modifier = Modifier.width(8.dp))
                Box(
                    modifier = Modifier
                        .width(32.dp)
                        .height(1.dp)
                        .background(RescuePrimary.copy(alpha = 0.5f))
                )
            }

            Spacer(modifier = Modifier.height(48.dp))

            // Progress Bar
            Box(
                modifier = Modifier
                    .width(220.dp)
                    .height(4.dp)
                    .clip(CircleShape)
                    .background(RescueSurfaceContainerHighest)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(progress)
                        .clip(CircleShape)
                        .background(RescuePrimary)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Status Text
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(RescueSecondary)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = statusText,
                    style = MaterialTheme.typography.labelMedium.copy(fontSize = 11.sp),
                    color = RescueOnSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = onNavigateToHome,
                modifier = Modifier
                    .height(44.dp)
                    .testTag("enter_dashboard_button"),
                colors = ButtonDefaults.buttonColors(
                    containerColor = RescuePrimaryContainer,
                    contentColor = RescueOnPrimaryContainer
                ),
                shape = RoundedCornerShape(22.dp)
            ) {
                Text("ENTER DASHBOARD", style = MaterialTheme.typography.labelMedium)
            }
        }

        // Bottom Security Badge
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 32.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(RescueSurfaceContainer.copy(alpha = 0.8f))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Security,
                    contentDescription = "Encrypted Core",
                    tint = RescuePrimary,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "ENCRYPTED NEURAL CORE",
                    style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                    color = RescueOnSurfaceVariant
                )
            }
        }
    }
}
