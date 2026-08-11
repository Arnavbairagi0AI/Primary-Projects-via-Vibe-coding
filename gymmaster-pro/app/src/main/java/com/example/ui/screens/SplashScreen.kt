/*
 * Developed by Arnav Bairagi
 * © Arnav Bairagi. All Rights Reserved.
 */

package com.example.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.draw.clip
import com.example.R

@Composable
fun SplashScreen() {
    val infiniteTransition = rememberInfiniteTransition(label = "splash_pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.9f,
        targetValue = 1.1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.primary,
                        MaterialTheme.colorScheme.primaryContainer
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .padding(32.dp)
                .fillMaxHeight()
        ) {
            Spacer(modifier = Modifier.weight(1f))

            // Pulse Fitness Logo
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .scale(scale)
                    .background(
                        color = Color.White.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(28.dp)
                    )
                    .padding(4.dp),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.img_gymmaster_logo),
                    contentDescription = "GymMaster Pro World Class Logo",
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(RoundedCornerShape(24.dp))
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "GymMaster Pro",
                fontSize = 32.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White,
                letterSpacing = 2.sp
            )

            Text(
                text = "Elite Operational & Coaching Suite",
                fontSize = 14.sp,
                color = Color.White.copy(alpha = 0.8f),
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(top = 4.dp),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.weight(1f))

            // Developer & Copyright Branding Footer (MANDATORY)
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Text(
                    text = "Developed by Arnav Bairagi",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    letterSpacing = 0.5.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "© Arnav Bairagi. All Rights Reserved.",
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.7f),
                    fontWeight = FontWeight.Normal
                )
            }
        }
    }
}
