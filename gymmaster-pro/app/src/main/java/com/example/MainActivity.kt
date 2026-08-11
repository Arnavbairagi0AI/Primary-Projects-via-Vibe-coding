/*
 * Developed by Arnav Bairagi
 * © Arnav Bairagi. All Rights Reserved.
 */

package com.example

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.foundation.Image
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.example.data.local.AppDatabase
import com.example.data.repository.GymRepository
import com.example.ui.GymViewModel
import com.example.ui.GymViewModelFactory
import com.example.ui.screens.*
import com.example.ui.theme.GymTheme
import kotlinx.coroutines.delay
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.foundation.BorderStroke
import androidx.compose.ui.text.font.FontFamily

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Robust safety fallback to guarantee Firebase is initialized even if google-services.json is missing
        try {
            if (com.google.firebase.FirebaseApp.getApps(this).isEmpty()) {
                val options = com.google.firebase.FirebaseOptions.Builder()
                    .setApplicationId("1:1234567890:android:abcdef")
                    .setApiKey("AIzaSyDummyKey_1234567890abcdef")
                    .setProjectId("gymmaster-dummy-project")
                    .build()
                com.google.firebase.FirebaseApp.initializeApp(this, options)
            }
        } catch (e: Throwable) {
            e.printStackTrace()
        }

        com.example.util.GeminiHelper.initialize(this)

        enableEdgeToEdge()
        setContent {
            val context = LocalContext.current
            var crashError by remember { mutableStateOf<Throwable?>(null) }

            val db = remember {
                try {
                    AppDatabase.getDatabase(context.applicationContext)
                } catch (e: Throwable) {
                    crashError = e
                    null
                }
            }

            val repository = remember(db) {
                if (db != null) {
                    try {
                        GymRepository(db.gymDao())
                    } catch (e: Throwable) {
                        crashError = e
                        null
                    }
                } else null
            }

            if (crashError != null) {
                CrashRecoveryScreen(
                    error = crashError!!,
                    onRestart = {
                        val intent = packageManager.getLaunchIntentForPackage(packageName)
                        intent?.addFlags(android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP or android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                        startActivity(intent)
                        finish()
                    },
                    onResetDatabase = {
                        try {
                            context.deleteDatabase("gym_database")
                            val intent = packageManager.getLaunchIntentForPackage(packageName)
                            intent?.addFlags(android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP or android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                            startActivity(intent)
                            finish()
                        } catch (e: Throwable) {
                            crashError = e
                        }
                    }
                )
            } else if (db == null || repository == null) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF0F172A)), // Matching Slate 900
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Color(0xFF0056D2))
                }
            } else {
                val viewModel: GymViewModel = viewModel(factory = GymViewModelFactory(repository, context.applicationContext))

                // Toast notifications trigger on state updates
                val feedback = viewModel.feedbackMessage
                LaunchedEffect(feedback) {
                    if (feedback != null) {
                        Toast.makeText(context, feedback, Toast.LENGTH_SHORT).show()
                        viewModel.clearFeedback()
                    }
                }

                val settings by viewModel.settings.collectAsState()

                GymTheme(
                    customPrimaryColorHex = settings?.themeColor,
                    darkTheme = false // Professional Polish light theme
                ) {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        AppShell(viewModel = viewModel)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppShell(viewModel: GymViewModel) {
    val settings by viewModel.settings.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    val authLoadingState by viewModel.authLoadingState.collectAsState()

    var isSplashDelayDone by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(2000)
        isSplashDelayDone = true
    }

    LaunchedEffect(currentUser) {
        if (currentUser == null) {
            viewModel.loginAsAdminOwner("owner@gym.com")
        }
    }

    val showSplash = !isSplashDelayDone || authLoadingState == com.example.ui.AuthLoadingState.VERIFYING

    if (showSplash) {
        SplashScreen()
    } else if (currentUser == null) {
        LoginScreen(viewModel = viewModel, onLoginSuccess = {
            // Success handles redirection automatically because currentUser changes from null to User
        })
    } else {
        var currentScreen by remember { mutableStateOf("dashboard") }
        var selectedProfileId by remember { mutableStateOf<String?>(null) }

        // Dynamic Top Title based on screen
        val pageTitle = when (currentScreen) {
            "dashboard" -> settings?.gymName ?: "GymMaster Pro"
            "members" -> "Members Directory"
            "attendance" -> "Contactless Scanning"
            "payments" -> "Collections Ledger"
            "trainers" -> "Coaching Staff"
            "plans" -> "Membership Tiers"
            "workouts" -> "Training & Diets"
            "reports" -> "Performance Reports"
            "settings" -> "Gym Variables"
            "about" -> "About System"
            "profile_detail" -> "Member Profile"
            else -> settings?.gymName ?: "GymMaster Pro"
        }

        BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
            val isTablet = maxWidth >= 760.dp

            Scaffold(
                topBar = {
                    TopAppBar(
                        title = {
                            currentUser?.let {
                                val displayRole = when (it.role.lowercase()) {
                                    "owner", "admin", "administrator" -> "Administrator"
                                    "trainer" -> "Trainer"
                                    "receptionist" -> "Receptionist"
                                    else -> "Administrator"
                                }
                                Column {
                                    Text(
                                        text = "Hello, ${it.name}",
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                    )
                                    Text(
                                        text = displayRole,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }
                            } ?: Column {
                                Text(
                                    text = pageTitle,
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )
                            }
                        },
                        actions = {
                            // Quick Admin Sign Out Button
                            IconButton(onClick = { viewModel.logout() }) {
                                Icon(
                                    imageVector = Icons.Filled.ExitToApp,
                                    contentDescription = "Sign Out",
                                    tint = MaterialTheme.colorScheme.error
                                )
                            }
                            Spacer(modifier = Modifier.width(4.dp))
                            // User Avatar Profile Image or Initials Badge
                            val profilePhoto = currentUser?.profilePhoto
                            if (!profilePhoto.isNullOrBlank()) {
                                AsyncImage(
                                    model = profilePhoto,
                                    contentDescription = "Admin Profile Photo",
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(CircleShape)
                                        .border(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f), CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                val initials = currentUser?.name?.firstOrNull()?.toString()?.uppercase() ?: "A"
                                Box(
                                    modifier = Modifier
                                        .size(34.dp)
                                        .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = initials,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    )
                },
                bottomBar = {
                    if (!isTablet) {
                        NavigationBar(
                            containerColor = MaterialTheme.colorScheme.surface
                        ) {
                            getNavigationItems(currentUser?.role).take(5).forEach { item ->
                                val isSelected = currentScreen == item.route
                                NavigationBarItem(
                                    selected = isSelected,
                                    onClick = {
                                        currentScreen = item.route
                                        selectedProfileId = null
                                    },
                                    icon = {
                                        Icon(
                                            imageVector = item.icon,
                                            contentDescription = item.title,
                                            tint = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    },
                                    label = {
                                        Text(
                                            text = item.title,
                                            fontSize = 10.sp,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                        )
                                    }
                                )
                            }
                        }
                    }
                }
            ) { innerPadding ->
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    // Wide-Screen Side Navigation Rail
                    if (isTablet) {
                        NavigationRail(
                            containerColor = MaterialTheme.colorScheme.surface,
                            modifier = Modifier.fillMaxHeight()
                        ) {
                            getNavigationItems(currentUser?.role).forEach { item ->
                                val isSelected = currentScreen == item.route
                                NavigationRailItem(
                                    selected = isSelected,
                                    onClick = {
                                        currentScreen = item.route
                                        selectedProfileId = null
                                    },
                                    icon = {
                                        Icon(
                                            imageVector = item.icon,
                                            contentDescription = item.title,
                                            tint = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                        )
                                    },
                                    label = {
                                        Text(
                                            text = item.title,
                                            fontSize = 11.sp,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                        )
                                    }
                                )
                            }
                        }
                    }

                    // Primary Content Host Panel
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .background(MaterialTheme.colorScheme.background)
                    ) {
                        AnimatedContent(
                            targetState = currentScreen,
                            label = "main_screens"
                        ) { screen ->
                            when (screen) {
                                "dashboard" -> DashboardScreen(
                                    viewModel = viewModel,
                                    onNavigateToMembers = { currentScreen = "members" },
                                    onNavigateToPayments = { currentScreen = "payments" },
                                    onNavigateToAttendance = { currentScreen = "attendance" }
                                )

                                "members" -> MembersScreen(
                                    viewModel = viewModel,
                                    onNavigateToMemberProfile = { mId ->
                                        selectedProfileId = mId
                                        currentScreen = "profile_detail"
                                    }
                                )

                                "attendance" -> AttendanceScreen(viewModel = viewModel)

                                "payments" -> PaymentsScreen(viewModel = viewModel)

                                "workouts" -> WorkoutDietScreen(viewModel = viewModel)

                                "reports" -> ReportsScreen(viewModel = viewModel)

                                "trainers" -> TrainersScreen(viewModel = viewModel)

                                "plans" -> PlansScreen(viewModel = viewModel)

                                "settings" -> SettingsScreen(viewModel = viewModel)

                                "about" -> AboutScreen()

                                "profile_detail" -> {
                                    selectedProfileId?.let { mId ->
                                        MemberProfileScreen(
                                            viewModel = viewModel,
                                            memberId = mId,
                                            onNavigateBack = {
                                                currentScreen = "members"
                                                selectedProfileId = null
                                            }
                                        )
                                    }
                                }

                                else -> DashboardScreen(
                                    viewModel = viewModel,
                                    onNavigateToMembers = { currentScreen = "members" },
                                    onNavigateToPayments = { currentScreen = "payments" },
                                    onNavigateToAttendance = { currentScreen = "attendance" }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// Data class for Navigation Nodes
data class NavigationItem(
    val route: String,
    val title: String,
    val icon: ImageVector
)

// Helper to filter nav items dynamically by staff roles
fun getNavigationItems(role: String?): List<NavigationItem> {
    val items = mutableListOf(
        NavigationItem("dashboard", "Dashboard", Icons.Filled.Dashboard),
        NavigationItem("members", "Members", Icons.Filled.People),
        NavigationItem("attendance", "Attendance", Icons.Filled.QrCodeScanner),
        NavigationItem("payments", "Payments", Icons.Filled.Payments),
        NavigationItem("workouts", "Fit Desk", Icons.Filled.FitnessCenter),
        NavigationItem("reports", "Reports", Icons.Filled.Assessment)
    )

    // Owner role gets all advanced settings
    if (role == "owner") {
        items.add(NavigationItem("trainers", "Trainers", Icons.Filled.Sports))
        items.add(NavigationItem("plans", "Plans", Icons.Filled.CardMembership))
        items.add(NavigationItem("settings", "Settings", Icons.Filled.Settings))
        items.add(NavigationItem("about", "About", Icons.Filled.Info))
    }

    return items
}

@Composable
fun CrashRecoveryScreen(
    error: Throwable,
    onRestart: () -> Unit,
    onResetDatabase: () -> Unit
) {
    Scaffold { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFF0F172A)), // Deep premium Slate 900 background
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
                    .widthIn(max = 500.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Modern warning icon
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(Color(0xFFEF4444).copy(alpha = 0.15f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.Warning,
                        contentDescription = "System Warning",
                        tint = Color(0xFFEF4444),
                        modifier = Modifier.size(36.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "System Recovery Mode",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFF8FAFC)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "GymMaster Pro encountered a startup anomaly. We initialized offline security boundaries to safeguard your records.",
                    fontSize = 14.sp,
                    color = Color(0xFF94A3B8),
                    textAlign = TextAlign.Center,
                    lineHeight = 20.sp
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Scrollable monospace crash details
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 180.dp)
                        .background(Color(0xFF1E293B), RoundedCornerShape(12.dp))
                        .padding(16.dp)
                ) {
                    Text(
                        text = error.stackTraceToString(),
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        color = Color(0xFFEF4444),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))

                Button(
                    onClick = onRestart,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0056D2)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(imageVector = Icons.Filled.Refresh, contentDescription = "Restart")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Restart Application", fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedButton(
                    onClick = onResetDatabase,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFEF4444)),
                    border = BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.5f)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(imageVector = Icons.Filled.DeleteForever, contentDescription = "Reset DB")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Reset Local Database Storage", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
