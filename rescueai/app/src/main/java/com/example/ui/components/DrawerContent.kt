package com.example.ui.components

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.MedicalProfileEntity
import com.example.ui.theme.*

@Composable
fun DrawerContent(
    medicalProfile: MedicalProfileEntity?,
    currentSelectedTab: Int,
    onSelectTab: (Int) -> Unit,
    onShowSplash: () -> Unit,
    onCloseDrawer: () -> Unit
) {
    val context = LocalContext.current

    ModalDrawerSheet(
        drawerContainerColor = RescueSurfaceContainer,
        drawerContentColor = RescueOnSurface,
        modifier = Modifier.width(300.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                // Header
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(RescuePrimaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.MedicalServices,
                            contentDescription = "Logo",
                            tint = RescueOnPrimaryContainer
                        )
                    }

                    Column {
                        Text(
                            text = "RescueAI",
                            style = MaterialTheme.typography.headlineLarge.copy(fontSize = 22.sp),
                            color = Color.White
                        )
                        Text(
                            text = "Command & Dispatch Protocol",
                            style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                            color = RescuePrimary
                        )
                    }
                }

                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))

                // Profile Badge
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainerHigh)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(RescuePrimary.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Person, contentDescription = "Profile", tint = RescuePrimary)
                        }

                        Column {
                            Text(
                                text = medicalProfile?.name ?: "Sarah Jenkins",
                                style = MaterialTheme.typography.titleMedium.copy(fontSize = 14.sp),
                                color = Color.White
                            )
                            Text(
                                text = "Blood: ${medicalProfile?.bloodType ?: "O+ Negative"}",
                                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 11.sp),
                                color = RescueOnSurfaceVariant
                            )
                        }
                    }
                }

                // Drawer Navigation Links
                NavigationDrawerItem(
                    label = { Text("Home Dashboard") },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    selected = currentSelectedTab == 0,
                    onClick = {
                        onSelectTab(0)
                        onCloseDrawer()
                    },
                    modifier = Modifier.testTag("drawer_item_home")
                )

                NavigationDrawerItem(
                    label = { Text("AI Assistant") },
                    icon = { Icon(Icons.Default.SmartToy, contentDescription = "Chat") },
                    selected = currentSelectedTab == 1,
                    onClick = {
                        onSelectTab(1)
                        onCloseDrawer()
                    },
                    modifier = Modifier.testTag("drawer_item_chat")
                )

                NavigationDrawerItem(
                    label = { Text("Emergency SOS") },
                    icon = { Icon(Icons.Default.Emergency, contentDescription = "SOS", tint = RescueError) },
                    selected = currentSelectedTab == 2,
                    onClick = {
                        onSelectTab(2)
                        onCloseDrawer()
                    },
                    modifier = Modifier.testTag("drawer_item_sos")
                )

                NavigationDrawerItem(
                    label = { Text("Disaster Reports") },
                    icon = { Icon(Icons.Default.Assessment, contentDescription = "Reports") },
                    selected = currentSelectedTab == 3,
                    onClick = {
                        onSelectTab(3)
                        onCloseDrawer()
                    },
                    modifier = Modifier.testTag("drawer_item_reports")
                )

                NavigationDrawerItem(
                    label = { Text("Medical Profile") },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    selected = currentSelectedTab == 4,
                    onClick = {
                        onSelectTab(4)
                        onCloseDrawer()
                    },
                    modifier = Modifier.testTag("drawer_item_profile")
                )

                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))

                NavigationDrawerItem(
                    label = { Text("Intro & Splash Screen") },
                    icon = { Icon(Icons.Default.Public, contentDescription = "Splash") },
                    selected = false,
                    onClick = {
                        onShowSplash()
                        onCloseDrawer()
                    }
                )

                NavigationDrawerItem(
                    label = { Text("Satellite Mesh Status") },
                    icon = { Icon(Icons.Default.CellTower, contentDescription = "Mesh") },
                    selected = false,
                    onClick = {
                        Toast.makeText(context, "Satellite Mesh Signal: 98% Strong", Toast.LENGTH_SHORT).show()
                        onCloseDrawer()
                    }
                )
            }

            // Footer
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "RescueAI Protocol v4.0.1",
                    style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                    color = RescueOnSurfaceVariant
                )
                Text(
                    text = "Encrypted Local & Neural Mesh",
                    style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                    color = RescueOutline
                )
            }
        }
    }
}
