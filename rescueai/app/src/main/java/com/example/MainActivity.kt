package com.example

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import com.example.ui.RescueViewModel
import com.example.ui.components.DrawerContent
import com.example.ui.screens.*
import com.example.ui.theme.*
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val viewModel: RescueViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            RescueAITheme {
                RescueAppContent(viewModel = viewModel)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RescueAppContent(viewModel: RescueViewModel) {
    val context = LocalContext.current
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val coroutineScope = rememberCoroutineScope()

    var showSplash by remember { mutableStateOf(true) }
    var selectedTab by remember { mutableIntStateOf(0) }

    val medicalProfile by viewModel.medicalProfile.collectAsState()
    val isSosActive by viewModel.isSosActive.collectAsState()

    if (showSplash) {
        SplashScreen(
            onNavigateToHome = { showSplash = false }
        )
    } else {
        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                DrawerContent(
                    medicalProfile = medicalProfile,
                    currentSelectedTab = selectedTab,
                    onSelectTab = { selectedTab = it },
                    onShowSplash = { showSplash = true },
                    onCloseDrawer = {
                        coroutineScope.launch { drawerState.close() }
                    }
                )
            }
        ) {
            Scaffold(
                modifier = Modifier
                    .fillMaxSize()
                    .testTag("main_scaffold"),
                containerColor = RescueBackground,
                topBar = {
                    TopAppBar(
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = RescueSurfaceContainer.copy(alpha = 0.95f),
                            titleContentColor = Color.White
                        ),
                        navigationIcon = {
                            IconButton(
                                onClick = {
                                    coroutineScope.launch { drawerState.open() }
                                },
                                modifier = Modifier.testTag("open_drawer_button")
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Menu,
                                    contentDescription = "Open Menu",
                                    tint = RescueOnSurface
                                )
                            }
                        },
                        title = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(RescuePrimaryContainer),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.MedicalServices,
                                        contentDescription = "Logo",
                                        tint = RescueOnPrimaryContainer,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "RescueAI",
                                    style = MaterialTheme.typography.titleLarge.copy(fontSize = 20.sp),
                                    fontWeight = FontWeight.Bold
                                )

                                if (isSosActive) {
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Surface(
                                        color = RescueErrorContainer,
                                        shape = CircleShape
                                    ) {
                                        Text(
                                            text = "SOS ACTIVE",
                                            style = MaterialTheme.typography.labelMedium.copy(fontSize = 9.sp),
                                            color = RescueError,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                        },
                        actions = {
                            IconButton(onClick = {
                                Toast.makeText(context, "1 Active Alert: Flood Warning (West River Basin)", Toast.LENGTH_SHORT).show()
                            }) {
                                BadgedBox(
                                    badge = {
                                        Badge(containerColor = RescueError) {
                                            Text("1", color = Color.White, fontSize = 9.sp)
                                        }
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Notifications,
                                        contentDescription = "Notifications",
                                        tint = RescueOnSurface
                                    )
                                }
                            }
                        }
                    )
                },
                bottomBar = {
                    NavigationBar(
                        containerColor = RescueSurfaceContainer,
                        contentColor = RescueOnSurface,
                        tonalElevation = 8.dp
                    ) {
                        NavigationBarItem(
                            selected = selectedTab == 0,
                            onClick = { selectedTab = 0 },
                            icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                            label = { Text("Home", fontSize = 11.sp) },
                            modifier = Modifier.testTag("nav_home"),
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = RescueOnPrimaryContainer,
                                selectedTextColor = RescuePrimary,
                                indicatorColor = RescuePrimaryContainer
                            )
                        )

                        NavigationBarItem(
                            selected = selectedTab == 1,
                            onClick = { selectedTab = 1 },
                            icon = { Icon(Icons.Default.SmartToy, contentDescription = "AI Assistant") },
                            label = { Text("AI Assistant", fontSize = 11.sp) },
                            modifier = Modifier.testTag("nav_chat"),
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = RescueOnPrimaryContainer,
                                selectedTextColor = RescuePrimary,
                                indicatorColor = RescuePrimaryContainer
                            )
                        )

                        NavigationBarItem(
                            selected = selectedTab == 2,
                            onClick = { selectedTab = 2 },
                            icon = {
                                Icon(
                                    Icons.Default.Emergency,
                                    contentDescription = "SOS",
                                    tint = if (selectedTab == 2) Color.White else RescueError
                                )
                            },
                            label = {
                                Text(
                                    "SOS",
                                    fontSize = 11.sp,
                                    color = RescueError,
                                    fontWeight = FontWeight.Bold
                                )
                            },
                            modifier = Modifier.testTag("nav_sos"),
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Color.White,
                                selectedTextColor = RescueError,
                                indicatorColor = RescueSecondaryContainer
                            )
                        )

                        NavigationBarItem(
                            selected = selectedTab == 3,
                            onClick = { selectedTab = 3 },
                            icon = { Icon(Icons.Default.Assessment, contentDescription = "Reports") },
                            label = { Text("Reports", fontSize = 11.sp) },
                            modifier = Modifier.testTag("nav_reports"),
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = RescueOnPrimaryContainer,
                                selectedTextColor = RescuePrimary,
                                indicatorColor = RescuePrimaryContainer
                            )
                        )

                        NavigationBarItem(
                            selected = selectedTab == 4,
                            onClick = { selectedTab = 4 },
                            icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                            label = { Text("Profile", fontSize = 11.sp) },
                            modifier = Modifier.testTag("nav_profile"),
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = RescueOnPrimaryContainer,
                                selectedTextColor = RescuePrimary,
                                indicatorColor = RescuePrimaryContainer
                            )
                        )
                    }
                }
            ) { innerPadding ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    Crossfade(
                        targetState = selectedTab,
                        label = "TabCrossfade"
                    ) { tab ->
                        when (tab) {
                            0 -> HomeScreen(
                                viewModel = viewModel,
                                onNavigateToTab = { selectedTab = it }
                            )
                            1 -> ChatScreen(
                                viewModel = viewModel
                            )
                            2 -> SosScreen(
                                viewModel = viewModel,
                                onNavigateToProfile = { selectedTab = 4 }
                            )
                            3 -> ReportsScreen(
                                viewModel = viewModel
                            )
                            4 -> ProfileScreen(
                                viewModel = viewModel
                            )
                        }
                    }
                }
            }
        }
    }
}
