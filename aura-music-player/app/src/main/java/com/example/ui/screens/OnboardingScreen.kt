package com.example.ui.screens

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.Context
import androidx.navigation.NavController
import com.example.R
import com.example.ui.theme.ThemeTokens
import kotlinx.coroutines.launch

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingScreen(navController: NavController) {
    val context = LocalContext.current
    val completeOnboarding = {
        val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("onboarding_completed", true).apply()
        navController.navigate("home") {
            popUpTo("onboarding") { inclusive = true }
        }
    }

    val pagerState = rememberPagerState(pageCount = { 3 })
    val coroutineScope = rememberCoroutineScope()

    val pages = listOf(
        OnboardingData(
            title = "All Your Music, Locally Sourced",
            description = "Aura Player automatically scans your internal storage, SD Card, and folders to assemble your collection.",
            imageRes = R.drawable.img_onboarding_music_1784109036047
        ),
        OnboardingData(
            title = "Professional Grade Equalizer",
            description = "Sculpt your audio with dynamic bass boost, virtualizer controls, and rich M3 graphic equalizer presets.",
            imageRes = R.drawable.img_app_icon_1784109000179
        ),
        OnboardingData(
            title = "Seamless Cloud Backup",
            description = "Never lose your playlists. Synchronize favorites, folders, and custom settings across your devices in real-time.",
            imageRes = R.drawable.img_onboarding_music_1784109036047
        )
    )

    val colors = ThemeTokens.colors
    val typography = ThemeTokens.typography
    val spacing = ThemeTokens.spacing

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.baseBackground)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Skip button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(spacing.large)
                    .statusBarsPadding(),
                horizontalArrangement = Arrangement.End
            ) {
                TextButton(onClick = { completeOnboarding() }) {
                    Text("Skip", color = colors.textSecondary, style = typography.bodyMedium)
                }
            }

            // Swipeable content
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) { position ->
                val page = pages[position]
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = spacing.extraLarge),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(260.dp)
                            .clip(RoundedCornerShape(ThemeTokens.shapes.sheetRadius))
                            .background(colors.primaryAccent.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Image(
                            painter = painterResource(id = page.imageRes),
                            contentDescription = page.title,
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Crop
                        )
                    }
                    Spacer(modifier = Modifier.height(40.dp))
                    Text(
                        text = page.title,
                        style = typography.displayHeader,
                        color = colors.textPrimary,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(spacing.medium))
                    Text(
                        text = page.description,
                        style = typography.bodyText,
                        color = colors.textSecondary,
                        textAlign = TextAlign.Center,
                        lineHeight = 22.sp
                    )
                }
            }

            // Bottom controls
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(spacing.extraLarge),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Indicator dots
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    repeat(3) { index ->
                        val isSelected = pagerState.currentPage == index
                        Box(
                            modifier = Modifier
                                .size(if (isSelected) 24.dp else 8.dp, 8.dp)
                                .clip(CircleShape)
                                .background(if (isSelected) colors.primaryAccent else colors.textMuted.copy(alpha = 0.4f))
                        )
                    }
                }
                Spacer(modifier = Modifier.height(spacing.extraLarge))

                // CTA Button
                Button(
                    onClick = {
                        if (pagerState.currentPage < 2) {
                            coroutineScope.launch {
                                pagerState.animateScrollToPage(pagerState.currentPage + 1)
                            }
                        } else {
                            completeOnboarding()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(ThemeTokens.shapes.cardRadius),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.primaryAccent,
                        contentColor = colors.accentOnPrimary
                    )
                ) {
                    Text(
                        text = if (pagerState.currentPage == 2) "Get Started" else "Next",
                        style = typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }
            }
        }
    }
}

data class OnboardingData(
    val title: String,
    val description: String,
    val imageRes: Int
)
