package com.example.ui.screens

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Log
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.example.data.model.*
import com.example.ui.GymViewModel
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.google.zxing.*
import com.google.zxing.common.HybridBinarizer
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

// Helper structures for Historical Attendance
data class HistoricalLog(
    val name: String,
    val id: String,
    val role: String, // "Member" / "Trainer"
    val checkIn: String?,
    val checkOut: String?,
    val duration: String,
    val status: String,
    val date: String,
    val rawTimestamp: Long
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceScreen(viewModel: GymViewModel) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()

    // Data flow from state
    val members by viewModel.allMembers.collectAsState()
    val trainers by viewModel.allTrainers.collectAsState()
    val memberLogs by viewModel.todayAttendance.collectAsState()
    val trainerLogs by viewModel.todayTrainerAttendance.collectAsState()
    val allAttendance by viewModel.allAttendance.collectAsState()
    val allTrainerAttendance by viewModel.allTrainerAttendance.collectAsState()
    val settings by viewModel.settings.collectAsState()
    val latestScanResult by viewModel.latestScanResult.collectAsState()

    // Navigation and tab states - RETAIN SELECTED TAB ACCROSS NAVIGATION
    var selectedTab by rememberSaveable { mutableStateOf(0) } // 0 for Members, 1 for Trainers
    var searchQuery by remember { mutableStateOf("") }
    var trainerSearchQuery by remember { mutableStateOf("") }
    
    // Trainer Filter & Sort States
    var trainerFilter by remember { mutableStateOf("All") } // "All", "Present", "Absent", "Late", "Working", "Checked Out", "On Leave"
    var trainerSort by remember { mutableStateOf("Newest") } // "Newest", "Oldest", "Name A-Z", "Name Z-A", "Check-In Time", "Check-Out Time", "Experience"

    // Historical table states
    var historySearchQuery by remember { mutableStateOf("") }
    var historyRoleFilter by remember { mutableStateOf("All") } // "All", "Member", "Trainer"
    var historyStatusFilter by remember { mutableStateOf("All") } // "All", "Checked In", "Checked Out"
    var historySortBy by remember { mutableStateOf("Newest") } // "Newest", "Oldest", "Name A-Z", "Name Z-A", "Duration"

    // Camera and Scan state
    var isCameraEnabled by remember { mutableStateOf(true) }
    var lensFacing by remember { mutableIntStateOf(CameraSelector.LENS_FACING_BACK) }
    var isTorchOn by remember { mutableStateOf(false) }
    var isScanningActive by remember { mutableStateOf(true) }
    var isInitializing by remember { mutableStateOf(false) }

    // Dialog & Override States
    var showAddTrainerDialog by remember { mutableStateOf(false) }
    var selectedTrainerForDetail by remember { mutableStateOf<Trainer?>(null) }

    // Custom success/error indicator visual overrides
    var scanAnimationState by remember { mutableStateOf<String?>(null) } // "SUCCESS", "ERROR", null
    var showSuccessCard by remember { mutableStateOf(false) }

    // Ignored duplicate scans track
    var lastScannedCode by remember { mutableStateOf("") }
    var lastScanTime by remember { mutableLongStateOf(0L) }

    // Request camera permission Launcher
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasCameraPermission = isGranted
        if (!isGranted) {
            viewModel.showFeedback("Camera permission denied. Grant it in device settings.")
        }
    }

    // Handle incoming Scan Results
    LaunchedEffect(latestScanResult) {
        if (latestScanResult != null) {
            val result = latestScanResult!!
            if (result.status == "ERROR") {
                scanAnimationState = "ERROR"
                delay(2000)
                scanAnimationState = null
                viewModel.clearLatestScanResult()
                isScanningActive = true
            } else {
                scanAnimationState = "SUCCESS"
                delay(1000)
                scanAnimationState = null
                showSuccessCard = true
                // Notify administrative alert / toast
                viewModel.showFeedback("Notification: ${result.name} logged as ${result.status.replace("_", " ")}!")
                // Hold member info view for 5 seconds, then return to scanning
                delay(5000)
                showSuccessCard = false
                viewModel.clearLatestScanResult()
                isScanningActive = true
            }
        } else {
            showSuccessCard = false
            scanAnimationState = null
        }
    }

    // Filter registrations for simulator quick desk search
    val filteredMembers = remember(members, searchQuery) {
        members.filter {
            it.name.contains(searchQuery, ignoreCase = true) ||
                    it.memberId.contains(searchQuery, ignoreCase = true) ||
                    it.phone.contains(searchQuery, ignoreCase = true)
        }
    }

    // Parse Check-In helper
    fun isCheckInLate(timeStr: String?): Boolean {
        if (timeStr.isNullOrEmpty()) return false
        try {
            val upper = timeStr.uppercase().trim()
            val isPm = upper.contains("PM")
            val clean = upper.replace("AM", "").replace("PM", "").trim()
            val parts = clean.split(":")
            val hr = if (parts.isNotEmpty()) parts[0].toIntOrNull() ?: 0 else 0
            val actualHr = if (isPm && hr != 12) hr + 12 else if (!isPm && hr == 12) 0 else hr
            if (actualHr >= 10) return true
        } catch (e: Exception) {}
        return false
    }

    // Duration calculation helper
    fun calculateDuration(checkIn: String?, checkOut: String?): String {
        if (checkIn.isNullOrEmpty() || checkOut.isNullOrEmpty()) return "--"
        if (listOf("Absent", "On Leave", "Holiday").contains(checkIn)) return "--"
        try {
            val sdf = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.US)
            val dateIn = sdf.parse(checkIn)
            val dateOut = sdf.parse(checkOut)
            if (dateIn != null && dateOut != null) {
                var diffMs = dateOut.time - dateIn.time
                if (diffMs < 0) {
                    diffMs += 24 * 60 * 60 * 1000L
                }
                val diffMins = diffMs / (1000 * 60)
                val hrs = diffMins / 60
                val mins = diffMins % 60
                return if (hrs > 0) "${hrs}h ${mins}m" else "${mins}m"
            }
        } catch (e: Exception) {}
        return "--"
    }

    // String date/time to epoch timestamp parser for sorting
    fun parseDateTimeToTimestamp(dateStr: String, timeStr: String?): Long {
        try {
            val cleanedTime = timeStr ?: "00:00 AM"
            val dateParts = dateStr.split("-")
            if (dateParts.size >= 3) {
                val year = dateParts[0].toIntOrNull() ?: 2026
                val month = dateParts[1].toIntOrNull() ?: 1
                val day = dateParts[2].toIntOrNull() ?: 1
                val upperTime = cleanedTime.uppercase().trim()
                val isPm = upperTime.contains("PM")
                val isAm = upperTime.contains("AM")
                val clean = upperTime.replace("AM", "").replace("PM", "").trim()
                val parts = clean.split(":")
                var hour = if (parts.isNotEmpty()) parts[0].toIntOrNull() ?: 0 else 0
                val min = if (parts.size >= 2) parts[1].toIntOrNull() ?: 0 else 0
                if (isPm && hour != 12) hour += 12
                if (isAm && hour == 12) hour = 0
                val calendar = java.util.Calendar.getInstance()
                calendar.set(year, month - 1, day, hour, min, 0)
                return calendar.timeInMillis
            }
        } catch (e: Exception) {}
        return 0L
    }

    // Historical Logs Assembler
    val historicalLogs = remember(allAttendance, allTrainerAttendance) {
        val membersLogs = allAttendance.map { a ->
            val duration = calculateDuration(a.checkIn, a.checkOut)
            val status = if (a.checkOut == null) "Checked In" else "Checked Out"
            HistoricalLog(
                name = a.memberName,
                id = a.memberId,
                role = "Member",
                checkIn = a.checkIn,
                checkOut = a.checkOut,
                duration = duration,
                status = status,
                date = a.date,
                rawTimestamp = parseDateTimeToTimestamp(a.date, a.checkIn)
            )
        }
        val coachesLogs = allTrainerAttendance.map { t ->
            val duration = calculateDuration(t.checkIn, t.checkOut)
            val status = if (t.checkOut == null) "Checked In" else "Checked Out"
            HistoricalLog(
                name = t.trainerName,
                id = t.trainerId,
                role = "Trainer",
                checkIn = t.checkIn,
                checkOut = t.checkOut,
                duration = duration,
                status = status,
                date = t.date,
                rawTimestamp = parseDateTimeToTimestamp(t.date, t.checkIn)
            )
        }
        (membersLogs + coachesLogs).sortedByDescending { it.rawTimestamp }
    }

    // Filtered and Sorted History list
    val filteredAndSortedHistory = remember(historicalLogs, historySearchQuery, historyRoleFilter, historyStatusFilter, historySortBy) {
        var list = historicalLogs.filter { log ->
            val matchesSearch = log.name.contains(historySearchQuery, ignoreCase = true) ||
                    log.id.contains(historySearchQuery, ignoreCase = true) ||
                    log.date.contains(historySearchQuery, ignoreCase = true)
            val matchesRole = when (historyRoleFilter) {
                "Member" -> log.role == "Member"
                "Trainer" -> log.role == "Trainer"
                else -> true
            }
            val matchesStatus = when (historyStatusFilter) {
                "Checked In" -> log.status == "Checked In"
                "Checked Out" -> log.status == "Checked Out"
                else -> true
            }
            matchesSearch && matchesRole && matchesStatus
        }
        
        list = when (historySortBy) {
            "Oldest" -> list.sortedBy { it.rawTimestamp }
            "Name A-Z" -> list.sortedBy { it.name.lowercase() }
            "Name Z-A" -> list.sortedByDescending { it.name.lowercase() }
            "Duration" -> list.sortedByDescending { 
                val dur = it.duration
                if (dur == "--") -1
                else {
                    var totalMin = 0
                    if (dur.contains("h")) {
                        val parts = dur.split("h")
                        val h = parts[0].trim().toIntOrNull() ?: 0
                        val mStr = parts.getOrNull(1)?.replace("m", "")?.trim() ?: ""
                        val m = mStr.toIntOrNull() ?: 0
                        totalMin = h * 60 + m
                    } else if (dur.contains("m")) {
                        totalMin = dur.replace("m", "").trim().toIntOrNull() ?: 0
                    }
                    totalMin
                }
            }
            else -> list.sortedByDescending { it.rawTimestamp } // "Newest"
        }
        list
    }

    // Helper to extract initials from Name
    fun getInitials(name: String): String {
        val parts = name.trim().split("\\s+".toRegex())
        if (parts.isEmpty()) return "TR"
        if (parts.size == 1) return parts[0].take(2).uppercase()
        return (parts[0].take(1) + parts[1].take(1)).uppercase()
    }

    // Filter and Sort Trainers based on UI criteria
    val filteredAndSortedTrainers = remember(trainers, trainerLogs, trainerSearchQuery, trainerFilter, trainerSort) {
        var list = trainers.filter { t ->
            t.name.contains(trainerSearchQuery, ignoreCase = true) ||
                    t.trainerId.contains(trainerSearchQuery, ignoreCase = true) ||
                    t.phone.contains(trainerSearchQuery, ignoreCase = true) ||
                    t.specialization.contains(trainerSearchQuery, ignoreCase = true)
        }
        
        if (trainerFilter != "All") {
            list = list.filter { t ->
                val log = trainerLogs.find { it.trainerId == t.trainerId }
                val statusText = when {
                    log == null || log.checkIn == "Absent" -> "Absent"
                    log.checkIn == "On Leave" -> "On Leave"
                    log.checkIn == "Holiday" -> "Holiday"
                    log.checkOut != null -> "Checked Out"
                    else -> if (isCheckInLate(log.checkIn)) "Late" else "Present"
                }
                
                when (trainerFilter) {
                    "Present" -> statusText == "Present" || statusText == "Late" || statusText == "Checked Out"
                    "Absent" -> statusText == "Absent"
                    "Late" -> statusText == "Late"
                    "Working" -> log != null && log.checkIn != null && !listOf("Absent", "On Leave", "Holiday").contains(log.checkIn) && log.checkOut == null
                    "Checked Out" -> statusText == "Checked Out"
                    "On Leave" -> statusText == "On Leave"
                    else -> true
                }
            }
        }
        
        list = when (trainerSort) {
            "Oldest" -> list.sortedBy { it.joiningDate.ifBlank { it.trainerId } }
            "Name A-Z" -> list.sortedBy { it.name.lowercase() }
            "Name Z-A" -> list.sortedByDescending { it.name.lowercase() }
            "Check-In Time" -> list.sortedBy { t ->
                val log = trainerLogs.find { it.trainerId == t.trainerId }
                log?.checkIn ?: "ZZZZZZ"
            }
            "Check-Out Time" -> list.sortedBy { t ->
                val log = trainerLogs.find { it.trainerId == t.trainerId }
                log?.checkOut ?: "ZZZZZZ"
            }
            "Experience" -> list.sortedByDescending { it.experience }
            else -> list.sortedByDescending { t -> t.joiningDate.ifBlank { t.trainerId } } // Newest
        }
        list
    }

    // Scroll container
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .testTag("attendance_desk_root"),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        
        // Header Section - Gym Reception Desk Title
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)),
            shape = RoundedCornerShape(16.dp)
        ) {
            Row(
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(MaterialTheme.colorScheme.primary, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.Face,
                        contentDescription = "Reception Hub",
                        tint = MaterialTheme.colorScheme.onPrimary
                    )
                }
                Column {
                    Text(
                        text = "Reception Desk Control Hub",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Contactless RFID / QR check-in & manual registers",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
            }
        }

        // Camera Feed Frame Container (Contactless Attendance)
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.12f)),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(
                            imageVector = Icons.Filled.PlayArrow,
                            contentDescription = "Camera Stream",
                            tint = if (isCameraEnabled && isScanningActive) Color(0xFF10B981) else Color.Gray,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Live QR Scanner Feed",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                    }
                    
                    // Controls Row
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        IconButton(
                            onClick = { isTorchOn = !isTorchOn },
                            modifier = Modifier.size(28.dp),
                            enabled = isCameraEnabled
                        ) {
                            Icon(
                                imageVector = if (isTorchOn) Icons.Filled.Notifications else Icons.Filled.Refresh,
                                contentDescription = "Toggle Torch",
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        IconButton(
                            onClick = {
                                lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) {
                                    CameraSelector.LENS_FACING_FRONT
                                } else {
                                    CameraSelector.LENS_FACING_BACK
                                }
                            },
                            modifier = Modifier.size(28.dp),
                            enabled = isCameraEnabled
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Share,
                                contentDescription = "Flip Camera",
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        IconButton(
                            onClick = { isCameraEnabled = !isCameraEnabled },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                imageVector = if (isCameraEnabled) Icons.Filled.Check else Icons.Filled.Clear,
                                contentDescription = "Enable Camera",
                                modifier = Modifier.size(16.dp),
                                tint = if (isCameraEnabled) MaterialTheme.colorScheme.primary else Color.Red
                            )
                        }
                    }
                }

                // Inner camera frame box
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color.Black),
                    contentAlignment = Alignment.Center
                ) {
                    if (isCameraEnabled) {
                        if (!hasCameraPermission) {
                            Button(onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) }) {
                                Text("Grant Camera Permission", fontSize = 11.sp)
                            }
                        } else {
                            EmbeddedQRScanner(
                                modifier = Modifier.fillMaxSize(),
                                lensFacing = lensFacing,
                                isTorchOn = isTorchOn,
                                isScanningActive = isScanningActive,
                                scanAnimationState = scanAnimationState,
                                isInitializing = isInitializing,
                                onInitializingChanged = { isInitializing = it },
                                onCodeScanned = { code ->
                                    if (code != lastScannedCode || System.currentTimeMillis() - lastScanTime > 3000) {
                                        lastScannedCode = code
                                        lastScanTime = System.currentTimeMillis()
                                        isScanningActive = false
                                        viewModel.scanQRCode(code)
                                    }
                                }
                            )
                            
                            // Glowing overlay scanner bounds
                            Box(
                                modifier = Modifier
                                    .size(130.dp)
                                    .border(
                                        width = 2.dp,
                                        color = when (scanAnimationState) {
                                            "SUCCESS" -> Color(0xFF10B981)
                                            "ERROR" -> Color(0xFFEF4444)
                                            else -> MaterialTheme.colorScheme.primary
                                        },
                                        shape = RoundedCornerShape(12.dp)
                                    )
                            )
                        }
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(
                                imageVector = Icons.Filled.Lock,
                                contentDescription = "Camera Closed",
                                tint = Color.White.copy(alpha = 0.3f),
                                modifier = Modifier.size(36.dp)
                            )
                            Text("Camera Feed Suspended", color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp)
                        }
                    }
                }

                // Scanner Real-Time Verification Card
                AnimatedVisibility(visible = showSuccessCard && latestScanResult != null) {
                    latestScanResult?.let { result ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = if (result.status == "CHECK_IN") Color(0xFFE6F4EA) else Color(0xFFFEF7E0)
                            ),
                            border = BorderStroke(
                                width = 1.dp,
                                color = if (result.status == "CHECK_IN") Color(0xFF10B981) else Color(0xFFF97316)
                            )
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(12.dp)
                                    .fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
                                        .background(
                                            color = if (result.status == "CHECK_IN") Color(0xFF10B981) else Color(0xFFF97316),
                                            shape = CircleShape
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (result.status == "CHECK_IN") Icons.Filled.CheckCircle else Icons.Filled.Info,
                                        contentDescription = "Success",
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = result.name,
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                        color = Color.Black
                                    )
                                    Text(
                                        text = result.message,
                                        fontSize = 11.sp,
                                        color = Color.Black.copy(alpha = 0.7f)
                                    )
                                }
                                Text(
                                    text = result.timestamp,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = Color.Black.copy(alpha = 0.6f)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Quick Selector Tabs
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = MaterialTheme.colorScheme.surface,
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
        ) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = { Text("👥 Members", fontWeight = FontWeight.Bold, fontSize = 13.sp) },
                modifier = Modifier.testTag("tab_members")
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = { Text("🏋️ Trainers", fontWeight = FontWeight.Bold, fontSize = 13.sp) },
                modifier = Modifier.testTag("tab_trainers")
            )
        }

        // TABBED MAIN PANEL CONTENT
        if (selectedTab == 0) {
            // MEMBERS ATTENDANCE TAB
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                
                // Member Dashboard Statistics
                val membersInToday = memberLogs.map { it.memberId }.distinct().size
                val currentlyInside = memberLogs.count { it.checkOut == null }
                val absentMembers = (members.size - membersInToday).coerceAtLeast(0)
                val lateCheckIns = memberLogs.count { isCheckInLate(it.checkIn) }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                    ) {
                        Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Members In", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("$membersInToday", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                    ) {
                        Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Currently In", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("$currentlyInside", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                    ) {
                        Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Absent Total", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("$absentMembers", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                    ) {
                        Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Late Check", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("$lateCheckIns", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                }

                // Member Simulation Quick Passes Panel
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "RFID / QR Desk Simulator Pass",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "Quick scan test simulation for member check-in & check-out",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                        )
                        
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = { Text("Search member name, ID or phone...", fontSize = 12.sp) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("simulator_member_search"),
                            shape = RoundedCornerShape(10.dp),
                            singleLine = true
                        )

                        if (filteredMembers.isEmpty()) {
                            Text("No members match search query.", fontSize = 11.sp, color = Color.Gray)
                        } else {
                            LazyRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                contentPadding = PaddingValues(vertical = 4.dp)
                            ) {
                                items(filteredMembers.take(8)) { m ->
                                    Button(
                                        onClick = { viewModel.scanQRCode(m.memberId) },
                                        modifier = Modifier.testTag("simulator_pass_btn_${m.memberId}"),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                            contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                                        ),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                    ) {
                                        Text("${m.name} [Scan]", fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }

                // Member Attendance List
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Member Attendance List",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "Total Members: ${members.size}",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }

                    if (members.isEmpty()) {
                        Text("No registered members found.", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            members.forEach { m ->
                                val log = memberLogs.find { it.memberId == m.memberId }
                                val checkInTime = log?.checkIn ?: "--"
                                val checkOutTime = log?.checkOut ?: "--"
                                val statusStr = if (log == null) "Absent" else if (log.checkOut == null) "Checked In" else "Checked Out"
                                val statusColor = if (statusStr == "Checked In") Color(0xFF10B981) else if (statusStr == "Checked Out") Color(0xFF3B82F6) else Color(0xFFEF4444)

                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = m.name,
                                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold)
                                            )
                                            Surface(
                                                color = statusColor.copy(alpha = 0.12f),
                                                shape = RoundedCornerShape(4.dp)
                                            ) {
                                                Text(
                                                    text = statusStr.uppercase(),
                                                    fontSize = 8.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = statusColor,
                                                    modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                                )
                                            }
                                        }
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text("Member ID: ${m.memberId} • Phone: ${m.phone}", fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                        Text("Plan: ${m.membershipPlan} • Membership Status: ${m.status.uppercase()}", fontSize = 9.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                                        ) {
                                            Text("Check In: $checkInTime", fontSize = 9.sp, fontWeight = FontWeight.SemiBold)
                                            Text("Check Out: $checkOutTime", fontSize = 9.sp, fontWeight = FontWeight.SemiBold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // TRAINERS ATTENDANCE TAB (Fully Upgraded)
            val totalTrainers = trainers.size
            val presentTrainersCount = trainerLogs.map { it.trainerId }.distinct().size
            val absentTrainersCount = (totalTrainers - presentTrainersCount).coerceAtLeast(0)
            val lateTrainersCount = trainerLogs.count { isCheckInLate(it.checkIn) }
            val checkedOutTrainersCount = trainerLogs.count { it.checkOut != null }
            val currentlyWorkingTrainersCount = trainerLogs.count { it.checkOut == null && !listOf("Absent", "On Leave", "Holiday").contains(it.checkIn) }

            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                
                // Trainer Dashboard Summary Cards
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Card(
                            modifier = Modifier.weight(1f),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.15f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Total Trainers", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary)
                                Text("$totalTrainers", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                            }
                        }
                        Card(
                            modifier = Modifier.weight(1f),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFE6F4EA)),
                            border = BorderStroke(1.dp, Color(0xFF10B981).copy(alpha = 0.3f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Present Today", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF10B981))
                                Text("$presentTrainersCount", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF0F5132))
                            }
                        }
                        Card(
                            modifier = Modifier.weight(1f),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFFCE8E6)),
                            border = BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.3f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Absent Today", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFEF4444))
                                Text("$absentTrainersCount", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF842029))
                            }
                        }
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Card(
                            modifier = Modifier.weight(1f),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF7E0)),
                            border = BorderStroke(1.dp, Color(0xFFF97316).copy(alpha = 0.3f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Late Arrivals", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFF97316))
                                Text("$lateTrainersCount", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF664D03))
                            }
                        }
                        Card(
                            modifier = Modifier.weight(1f),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F0FE)),
                            border = BorderStroke(1.dp, Color(0xFF3B82F6).copy(alpha = 0.3f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Checked Out", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF3B82F6))
                                Text("$checkedOutTrainersCount", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF084298))
                            }
                        }
                        Card(
                            modifier = Modifier.weight(1f),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFF3E8FF)),
                            border = BorderStroke(1.dp, Color(0xFF8B5CF6).copy(alpha = 0.3f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("Currently Working", fontSize = 10.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF8B5CF6))
                                Text("$currentlyWorkingTrainersCount", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF4C1D95))
                            }
                        }
                    }
                }

                // Trainer Graphical Analytics Section
                TrainerAnalyticsSection(
                    totalTrainers = totalTrainers,
                    presentToday = presentTrainersCount,
                    absentToday = absentTrainersCount,
                    lateToday = lateTrainersCount,
                    workingToday = currentlyWorkingTrainersCount,
                    trainerHistory = allTrainerAttendance
                )

                // Trainer Simulation Quick RFID/QR Pass
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Trainer Access Desk Simulator",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "Simulate contactless scans for staff members",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                        )

                        if (trainers.isEmpty()) {
                            Text("No registered trainers to simulate.", fontSize = 11.sp, color = Color.Gray)
                        } else {
                            LazyRow(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                contentPadding = PaddingValues(vertical = 4.dp)
                            ) {
                                items(trainers) { t ->
                                    Button(
                                        onClick = { viewModel.scanQRCode(t.trainerId) },
                                        modifier = Modifier.testTag("simulator_trainer_btn_${t.trainerId}"),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = MaterialTheme.colorScheme.primaryContainer,
                                            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                        ),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                    ) {
                                        Text("${t.name} [Scan]", fontSize = 11.sp)
                                    }
                                }
                            }
                        }
                    }
                }

                // Search, Filter & Sort Controls
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.08f))
                ) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        // Search Outlined Box
                        OutlinedTextField(
                            value = trainerSearchQuery,
                            onValueChange = { trainerSearchQuery = it },
                            placeholder = { Text("Search by name, ID, phone, position...", fontSize = 12.sp) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("trainer_attendance_search_field"),
                            shape = RoundedCornerShape(8.dp),
                            singleLine = true,
                            leadingIcon = { Icon(Icons.Filled.Search, "Search Icon", modifier = Modifier.size(18.dp)) }
                        )

                        // Filters Scroll Panel
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("Filter by Status", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                val filtersList = listOf("All", "Present", "Absent", "Late", "Working", "Checked Out", "On Leave")
                                items(filtersList) { f ->
                                    val isSelected = trainerFilter == f
                                    FilterChip(
                                        selected = isSelected,
                                        onClick = { trainerFilter = f },
                                        label = { Text(f, fontSize = 11.sp) },
                                        modifier = Modifier.testTag("trainer_filter_chip_$f")
                                    )
                                }
                            }
                        }

                        // Sorting Dropdown Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Sort list by", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            
                            var showSortMenu by remember { mutableStateOf(false) }
                            Box {
                                Button(
                                    onClick = { showSortMenu = true },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                        contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                                    ),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                    modifier = Modifier.testTag("trainer_sort_btn")
                                ) {
                                    Text(trainerSort, fontSize = 11.sp)
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(Icons.Filled.ArrowDropDown, "Sort options", modifier = Modifier.size(14.dp))
                                }
                                DropdownMenu(
                                    expanded = showSortMenu,
                                    onDismissRequest = { showSortMenu = false }
                                ) {
                                    val sortsList = listOf("Newest", "Oldest", "Name A-Z", "Name Z-A", "Check-In Time", "Check-Out Time", "Experience")
                                    sortsList.forEach { s ->
                                        DropdownMenuItem(
                                            text = { Text(s, fontSize = 12.sp) },
                                            onClick = {
                                                trainerSort = s
                                                showSortMenu = false
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Trainer Cards List Section
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Staff Members Attendance",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "Showing ${filteredAndSortedTrainers.size} of $totalTrainers",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }

                    if (trainers.isEmpty()) {
                        // EMPTY STATE
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.1f)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(
                                modifier = Modifier
                                    .padding(24.dp)
                                    .fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text(
                                    text = "👨‍🏫 No Trainers Registered Yet",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center
                                )
                                Text(
                                    text = "Register your first trainer to begin tracking attendance.",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
                                    textAlign = TextAlign.Center
                                )
                                Button(
                                    onClick = { showAddTrainerDialog = true },
                                    modifier = Modifier.testTag("register_first_trainer_btn")
                                ) {
                                    Icon(Icons.Filled.Add, "Add Icon", modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Register Trainer", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    } else if (filteredAndSortedTrainers.isEmpty()) {
                        Text(
                            text = "No trainers found matching current filters.",
                            fontSize = 12.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(vertical = 12.dp)
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            filteredAndSortedTrainers.forEach { t ->
                                val log = trainerLogs.find { it.trainerId == t.trainerId }
                                
                                // Beautiful Trainer Card
                                TrainerAttendanceCard(
                                    trainer = t,
                                    log = log,
                                    isCheckInLate = { isCheckInLate(it) },
                                    getInitials = { getInitials(it) },
                                    onClick = { selectedTrainerForDetail = t }
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
        Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.08f))

        // Unified Attendance History Section
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                text = "Attendance History (${filteredAndSortedHistory.size})",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.primary
            )
            
            // Filters and Search for History Ledger
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.05f))
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = historySearchQuery,
                        onValueChange = { historySearchQuery = it },
                        placeholder = { Text("Search logs by name, ID or date...", fontSize = 11.sp) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                            .testTag("history_search_field"),
                        shape = RoundedCornerShape(8.dp),
                        singleLine = true,
                        leadingIcon = { Icon(Icons.Filled.Search, "Search", modifier = Modifier.size(16.dp)) }
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Role selection dropdown
                        var showRoleMenu by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.weight(1f)) {
                            Button(
                                onClick = { showRoleMenu = true },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(36.dp)
                                    .testTag("history_role_btn"),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text("Role: $historyRoleFilter", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Icon(Icons.Filled.ArrowDropDown, "down", modifier = Modifier.size(12.dp))
                            }
                            DropdownMenu(expanded = showRoleMenu, onDismissRequest = { showRoleMenu = false }) {
                                listOf("All", "Member", "Trainer").forEach { r ->
                                    DropdownMenuItem(text = { Text(r, fontSize = 11.sp) }, onClick = { historyRoleFilter = r; showRoleMenu = false })
                                }
                            }
                        }

                        // Status selection dropdown
                        var showStatusMenu by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.weight(1f)) {
                            Button(
                                onClick = { showStatusMenu = true },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(36.dp)
                                    .testTag("history_status_btn"),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text("Status: $historyStatusFilter", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Icon(Icons.Filled.ArrowDropDown, "down", modifier = Modifier.size(12.dp))
                            }
                            DropdownMenu(expanded = showStatusMenu, onDismissRequest = { showStatusMenu = false }) {
                                listOf("All", "Checked In", "Checked Out").forEach { s ->
                                    DropdownMenuItem(text = { Text(s, fontSize = 11.sp) }, onClick = { historyStatusFilter = s; showStatusMenu = false })
                                }
                            }
                        }

                        // Sort dropdown
                        var showSortMenu by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.weight(1f)) {
                            Button(
                                onClick = { showSortMenu = true },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(36.dp)
                                    .testTag("history_sort_btn"),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text("Sort: $historySortBy", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Icon(Icons.Filled.ArrowDropDown, "down", modifier = Modifier.size(12.dp))
                            }
                            DropdownMenu(expanded = showSortMenu, onDismissRequest = { showSortMenu = false }) {
                                listOf("Newest", "Oldest", "Name A-Z", "Name Z-A", "Duration").forEach { s ->
                                    DropdownMenuItem(text = { Text(s, fontSize = 11.sp) }, onClick = { historySortBy = s; showSortMenu = false })
                                }
                            }
                        }
                    }
                }
            }

            // History Logs Table View
            Card(
                modifier = Modifier.fillMaxWidth(),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.05f))
            ) {
                Column(modifier = Modifier.padding(8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    // Header Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                            .padding(vertical = 6.dp, horizontal = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Name / Role", modifier = Modifier.weight(1.5f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text("Check In", modifier = Modifier.weight(1f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text("Check Out", modifier = Modifier.weight(1f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text("Dur / Date", modifier = Modifier.weight(1.2f), fontSize = 10.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.End)
                    }

                    if (filteredAndSortedHistory.isEmpty()) {
                        Text(
                            text = "No history records found.",
                            modifier = Modifier
                                .padding(12.dp)
                                .fillMaxWidth(),
                            fontSize = 11.sp,
                            color = Color.Gray,
                            textAlign = TextAlign.Center
                        )
                    } else {
                        filteredAndSortedHistory.forEach { log ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 6.dp, horizontal = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1.5f)) {
                                    Text(log.name, fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(
                                        text = log.role.uppercase() + " • ID: " + log.id,
                                        fontSize = 8.sp,
                                        color = if (log.role == "Trainer") MaterialTheme.colorScheme.primary else Color.Gray,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                                Text(
                                    text = log.checkIn ?: "--",
                                    modifier = Modifier.weight(1f),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = log.checkOut ?: "--",
                                    modifier = Modifier.weight(1f),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                                Column(modifier = Modifier.weight(1.2f), horizontalAlignment = Alignment.End) {
                                    Text(log.duration, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                    Text(log.date, fontSize = 8.sp, color = Color.Gray)
                                }
                            }
                            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.03f))
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(48.dp)) // Protect content from bottom nav
    }

    // --- DIALOG 1: REGISTER TRAINER STAFF DIALOG ---
    if (showAddTrainerDialog) {
        var tName by remember { mutableStateOf("") }
        var tPhone by remember { mutableStateOf("+91 ") }
        var tEmail by remember { mutableStateOf("") }
        var tSpecialization by remember { mutableStateOf("Personal Trainer") }
        var tExperience by remember { mutableStateOf("3") }
        var tSalary by remember { mutableStateOf("25000") }
        var isSubmitting by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showAddTrainerDialog = false },
            title = { Text("Register New Trainer Staff", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = tName,
                        onValueChange = { tName = it },
                        label = { Text("Trainer Name *") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = tPhone,
                        onValueChange = { tPhone = it },
                        label = { Text("Phone Number *") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = tEmail,
                        onValueChange = { tEmail = it },
                        label = { Text("Email Address") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    // Specialization Picker
                    var specExpanded by remember { mutableStateOf(false) }
                    Box {
                        OutlinedTextField(
                            value = tSpecialization,
                            onValueChange = {},
                            label = { Text("Specialization / Position") },
                            modifier = Modifier.fillMaxWidth(),
                            readOnly = true,
                            trailingIcon = {
                                IconButton(onClick = { specExpanded = true }) {
                                    Icon(Icons.Filled.ArrowDropDown, "spec")
                                }
                            }
                        )
                        DropdownMenu(expanded = specExpanded, onDismissRequest = { specExpanded = false }) {
                            val positions = listOf("Coach", "Personal Trainer", "Yoga Instructor", "Nutritionist", "Manager", "Receptionist")
                            positions.forEach { p ->
                                DropdownMenuItem(
                                    text = { Text(p) },
                                    onClick = {
                                        tSpecialization = p
                                        specExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = tExperience,
                            onValueChange = { tExperience = it },
                            label = { Text("Experience (Yrs)") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = tSalary,
                            onValueChange = { tSalary = it },
                            label = { Text("Salary") },
                            modifier = Modifier.weight(1.2f),
                            singleLine = true
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (tName.isBlank() || tPhone.isBlank()) {
                            viewModel.showFeedback("Error: Name and Phone are required!")
                            return@Button
                        }
                        isSubmitting = true
                        val newTrainerId = "T-" + (100000..999999).random()
                        val sdfToday = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
                        val t = Trainer(
                            trainerId = newTrainerId,
                            name = tName.trim(),
                            phone = tPhone.trim(),
                            specialization = tSpecialization,
                            experience = tExperience.toIntOrNull() ?: 2,
                            salary = tSalary.toDoubleOrNull() ?: 20000.0,
                            photo = null,
                            email = tEmail.trim(),
                            joiningDate = sdfToday
                        )
                        viewModel.addOrUpdateTrainer(t)
                        showAddTrainerDialog = false
                    },
                    enabled = !isSubmitting
                ) {
                    Text("Register Staff", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddTrainerDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // --- DIALOG 2: TRAINER DETAILS, HISTORY & ADMIN MANUAL CONTROLS ---
    if (selectedTrainerForDetail != null) {
        val trainer = selectedTrainerForDetail!!
        val todayStr = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
        
        // Find historical data for this trainer
        val trainerLogsHistory = allTrainerAttendance.filter { it.trainerId == trainer.trainerId }
        val currentMonthPrefix = java.text.SimpleDateFormat("yyyy-MM", java.util.Locale.US).format(java.util.Date())
        val last30DaysLogs = trainerLogsHistory.filter { it.date >= get30DaysAgoDate() }
        
        // Compute Metrics
        val presentCount = last30DaysLogs.count { !listOf("Absent", "On Leave", "Holiday").contains(it.checkIn) }
        val attendancePct = ((presentCount.toFloat() / 30f) * 100f).toInt().coerceAtMost(100)
        val lateCount = last30DaysLogs.count { isCheckInLate(it.checkIn) }
        val leavesCount = last30DaysLogs.count { it.checkIn == "On Leave" }
        
        // Avg check in time helper
        val avgCheckIn = getAverageCheckInTime(last30DaysLogs)
        val avgWorkingHours = getAverageWorkingHours(last30DaysLogs)
        val totalHoursThisMonth = getTotalHoursThisMonth(trainerLogsHistory, currentMonthPrefix)

        // Find today's log if exists
        val todayLog = trainerLogs.find { it.trainerId == trainer.trainerId }

        // Local Admin overrides state
        var manualStatus by remember { mutableStateOf(
            when {
                todayLog == null -> "Absent"
                todayLog.checkIn == "Absent" -> "Absent"
                todayLog.checkIn == "On Leave" -> "On Leave"
                todayLog.checkIn == "Holiday" -> "Holiday"
                else -> "Present"
            }
        ) }
        
        var manualCheckInTime by remember { mutableStateOf(
            if (todayLog != null && !listOf("Absent", "On Leave", "Holiday").contains(todayLog.checkIn)) {
                todayLog.checkIn ?: ""
            } else {
                "09:00 AM"
            }
        ) }
        
        var manualCheckOutTime by remember { mutableStateOf(
            if (todayLog != null && todayLog.checkOut != null) {
                todayLog.checkOut ?: ""
            } else {
                ""
            }
        ) }

        var isUpdatingAttendance by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { selectedTrainerForDetail = null },
            title = {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            getInitials(trainer.name),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                    Column {
                        Text(trainer.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text("${trainer.specialization} • Exp: ${trainer.experience} Yrs", fontSize = 11.sp, color = Color.Gray)
                    }
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // History Stats Section
                    Text("30-Day Metrics Ledger", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                    ) {
                        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Column {
                                    Text("Attendance Rate", fontSize = 9.sp, color = Color.Gray)
                                    Text("$attendancePct%", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = MaterialTheme.colorScheme.primary)
                                }
                                Column {
                                    Text("Late Check-Ins", fontSize = 9.sp, color = Color.Gray)
                                    Text("$lateCount days", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFFF97316))
                                }
                                Column {
                                    Text("On Approved Leave", fontSize = 9.sp, color = Color.Gray)
                                    Text("$leavesCount days", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF8B5CF6))
                                }
                            }
                            Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.08f))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Column {
                                    Text("Avg Check-In", fontSize = 9.sp, color = Color.Gray)
                                    Text(avgCheckIn, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                                Column {
                                    Text("Avg Shift Hours", fontSize = 9.sp, color = Color.Gray)
                                    Text(avgWorkingHours, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                                Column {
                                    Text("Total Hours (Month)", fontSize = 9.sp, color = Color.Gray)
                                    Text(totalHoursThisMonth, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFF10B981))
                                }
                            }
                        }
                    }

                    // Today's Status Override Section
                    Text("Admin Manual Override (Today)", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.12f))
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            
                            // Select Attendance Status Label Row
                            Text("Current Attendance Status:", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                val statuses = listOf("Present", "Absent", "On Leave", "Holiday")
                                statuses.forEach { st ->
                                    val isSel = manualStatus == st
                                    Button(
                                        onClick = { manualStatus = st },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (isSel) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                                            contentColor = if (isSel) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                        ),
                                        shape = RoundedCornerShape(6.dp),
                                        contentPadding = PaddingValues(horizontal = 2.dp, vertical = 2.dp)
                                    ) {
                                        Text(st, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }

                            // Quick Shortcuts
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Button(
                                    onClick = {
                                        val nowTimeStr = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.US).format(java.util.Date())
                                        manualStatus = "Present"
                                        manualCheckInTime = nowTimeStr
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD1E7DD), contentColor = Color(0xFF0F5132)),
                                    shape = RoundedCornerShape(4.dp),
                                    contentPadding = PaddingValues(2.dp)
                                ) {
                                    Text("Check In Now", fontSize = 10.sp)
                                }
                                Button(
                                    onClick = {
                                        val nowTimeStr = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.US).format(java.util.Date())
                                        manualStatus = "Present"
                                        manualCheckOutTime = nowTimeStr
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFCFE2FF), contentColor = Color(0xFF084298)),
                                    shape = RoundedCornerShape(4.dp),
                                    contentPadding = PaddingValues(2.dp)
                                ) {
                                    Text("Check Out Now", fontSize = 10.sp)
                                }
                            }

                            // Correct Exact Times Inputs
                            if (manualStatus == "Present") {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedTextField(
                                        value = manualCheckInTime,
                                        onValueChange = { manualCheckInTime = it },
                                        label = { Text("Check-In Time", fontSize = 10.sp) },
                                        modifier = Modifier.weight(1f),
                                        singleLine = true
                                    )
                                    OutlinedTextField(
                                        value = manualCheckOutTime,
                                        onValueChange = { manualCheckOutTime = it },
                                        label = { Text("Check-Out Time", fontSize = 10.sp) },
                                        modifier = Modifier.weight(1f),
                                        singleLine = true,
                                        placeholder = { Text("--") }
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        isUpdatingAttendance = true
                        
                        // Send Manual Override to ViewModel / Firestore
                        viewModel.manualMarkTrainerAttendance(
                            trainerId = trainer.trainerId,
                            dateStr = todayStr,
                            checkInTime = if (manualStatus == "Present") manualCheckInTime.trim() else null,
                            checkOutTime = if (manualStatus == "Present" && manualCheckOutTime.isNotBlank()) manualCheckOutTime.trim() else null,
                            status = manualStatus
                        )
                        
                        selectedTrainerForDetail = null
                    },
                    enabled = !isUpdatingAttendance
                ) {
                    Text("Save Changes", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedTrainerForDetail = null }) {
                    Text("Close")
                }
            }
        )
    }
}

// Helper calculation metrics functions inside Details popup
private fun get30DaysAgoDate(): String {
    val cal = java.util.Calendar.getInstance()
    cal.add(java.util.Calendar.DAY_OF_YEAR, -30)
    return java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(cal.time)
}

private fun getAverageCheckInTime(logs: List<TrainerAttendance>): String {
    val validTimes = logs.mapNotNull { it.checkIn }.filter { 
        it.isNotEmpty() && !listOf("Absent", "On Leave", "Holiday").contains(it) 
    }
    if (validTimes.isEmpty()) return "--:--"
    
    var totalMinutes = 0
    var count = 0
    validTimes.forEach { timeStr ->
        try {
            val upper = timeStr.uppercase().trim()
            val isPm = upper.contains("PM")
            val clean = upper.replace("AM", "").replace("PM", "").trim()
            val parts = clean.split(":")
            var hr = parts[0].toInt()
            val min = if (parts.size > 1) parts[1].toInt() else 0
            if (isPm && hr != 12) hr += 12
            if (!isPm && hr == 12) hr = 0
            totalMinutes += hr * 60 + min
            count++
        } catch (e: Exception) {}
    }
    if (count == 0) return "--:--"
    val avgMinutes = totalMinutes / count
    val avgHr = avgMinutes / 60
    val avgMin = avgMinutes % 60
    val amPm = if (avgHr >= 12) "PM" else "AM"
    val displayHr = when {
        avgHr == 0 -> 12
        avgHr > 12 -> avgHr - 12
        else -> avgHr
    }
    return String.format("%02d:%02d %s", displayHr, avgMin, amPm)
}

private fun getAverageWorkingHours(logs: List<TrainerAttendance>): String {
    val validLogs = logs.filter { it.checkIn != null && it.checkOut != null && !listOf("Absent", "On Leave", "Holiday").contains(it.checkIn) }
    if (validLogs.isEmpty()) return "0.0h"
    var totalHours = 0.0
    var count = 0
    validLogs.forEach { log ->
        val h = calculateTrainerDurationHours(log.checkIn, log.checkOut)
        if (h > 0.0) {
            totalHours += h
            count++
        }
    }
    if (count == 0) return "0.0h"
    return String.format(java.util.Locale.US, "%.1fh", totalHours / count.toDouble())
}

private fun getTotalHoursThisMonth(logs: List<TrainerAttendance>, prefix: String): String {
    val monthLogs = logs.filter { it.date.startsWith(prefix) && it.checkIn != null && it.checkOut != null }
    var totalHours = 0.0
    monthLogs.forEach { log ->
        totalHours += calculateTrainerDurationHours(log.checkIn, log.checkOut)
    }
    return String.format(java.util.Locale.US, "%.1fh", totalHours)
}

private fun calculateTrainerDurationHours(checkIn: String?, checkOut: String?): Double {
    if (checkIn.isNullOrEmpty() || checkOut.isNullOrEmpty() || 
        listOf("Absent", "On Leave", "Holiday").contains(checkIn)) return 0.0
    try {
        val sdf = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.US)
        val dateIn = sdf.parse(checkIn)
        val dateOut = sdf.parse(checkOut)
        if (dateIn != null && dateOut != null) {
            var diffMs = dateOut.time - dateIn.time
            if (diffMs < 0) {
                diffMs += 24 * 60 * 60 * 1000L
            }
            return diffMs.toDouble() / (1000.0 * 60.0 * 60.0)
        }
    } catch (e: Exception) {}
    return 0.0
}

// Inner Composable components for cleaner modular layout
@Composable
fun TrainerAttendanceCard(
    trainer: Trainer,
    log: TrainerAttendance?,
    isCheckInLate: (String?) -> Boolean,
    getInitials: (String) -> String,
    onClick: () -> Unit
) {
    val checkInTime = log?.checkIn ?: "--"
    val checkOutTime = log?.checkOut ?: "--"
    
    // Status & Badge Coloring
    val statusColor: Color
    val statusText: String
    val workingStatusText: String
    val isWorking: Boolean
    
    when {
        log == null || log.checkIn == "Absent" -> {
            statusText = "Absent"
            statusColor = Color(0xFFEF4444) // Red
            workingStatusText = "Absent Today"
            isWorking = false
        }
        log.checkIn == "On Leave" -> {
            statusText = "On Leave"
            statusColor = Color(0xFF8B5CF6) // Purple
            workingStatusText = "On Approved Leave"
            isWorking = false
        }
        log.checkIn == "Holiday" -> {
            statusText = "Holiday"
            statusColor = Color(0xFF6B7280) // Gray
            workingStatusText = "Holiday"
            isWorking = false
        }
        log.checkOut != null -> {
            statusText = "Checked Out"
            statusColor = Color(0xFF3B82F6) // Blue
            workingStatusText = "⚪ Shift Completed"
            isWorking = false
        }
        else -> {
            val isLate = isCheckInLate(log.checkIn)
            if (isLate) {
                statusText = "Late"
                statusColor = Color(0xFFF97316) // Orange
            } else {
                statusText = "Present"
                statusColor = Color(0xFF10B981) // Green
            }
            workingStatusText = "🟢 Currently Working"
            isWorking = true
        }
    }
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .testTag("trainer_attendance_card_${trainer.trainerId}"),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(12.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Initials Avatar (Circular) - DO NOT DISPLAY PROFILE PHOTO
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(
                        color = statusColor.copy(alpha = 0.12f),
                        shape = CircleShape
                    )
                    .border(1.5.dp, statusColor.copy(alpha = 0.4f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = getInitials(trainer.name),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = statusColor
                )
            }
            
            // Details
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = trainer.name,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    
                    // Status Badge
                    Surface(
                        color = statusColor.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(6.dp),
                        border = BorderStroke(1.dp, statusColor.copy(alpha = 0.3f))
                    ) {
                        Text(
                            text = statusText.uppercase(),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = statusColor,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(2.dp))
                
                Text(
                    text = "ID: ${trainer.trainerId} • Phone: ${trainer.phone}",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
                
                Text(
                    text = "${trainer.specialization} • ${trainer.experience} Years Exp",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Shift: 09:00 AM - 05:00 PM",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                    Text(
                        text = workingStatusText,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isWorking) Color(0xFF10B981) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "Check In: $checkInTime",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Check Out: $checkOutTime",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

@Composable
fun TrainerAnalyticsSection(
    totalTrainers: Int,
    presentToday: Int,
    absentToday: Int,
    lateToday: Int,
    workingToday: Int,
    trainerHistory: List<TrainerAttendance>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.12f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Coaching Staff Analytics",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = "Live attendance statistics and metrics",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
            )
            Spacer(modifier = Modifier.height(16.dp))
            
            // Row 1: Today's Attendance Gauge & Stats
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Today's attendance % radial gauge
                Box(
                    modifier = Modifier.size(80.dp),
                    contentAlignment = Alignment.Center
                ) {
                    val attendancePct = if (totalTrainers > 0) (presentToday.toFloat() / totalTrainers.toFloat()) else 0f
                    CircularProgressIndicator(
                        progress = attendancePct,
                        modifier = Modifier.fillMaxSize(),
                        color = Color(0xFF10B981),
                        strokeWidth = 8.dp,
                        trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                    )
                    Text(
                        text = "${(attendancePct * 100).toInt()}%",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "Today's Attendance Rate",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                    )
                    Text(
                        text = "$presentToday / $totalTrainers Trainers Present",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )
                    
                    // Simple progress bar for Working vs Completed
                    val workingPct = if (presentToday > 0) (workingToday.toFloat() / presentToday.toFloat()) else 0f
                    LinearProgressIndicator(
                        progress = workingPct,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp)),
                        color = Color(0xFF3B82F6),
                        trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                    )
                    
                    Text(
                        text = "Currently working: $workingToday | Shift completed: ${presentToday - workingToday}",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Divider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.12f))
            Spacer(modifier = Modifier.height(12.dp))
            
            // Row 2: Weekly Attendance Trend (Drawn with Canvas bars)
            Text(
                text = "Weekly Attendance Trend",
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            // Compute attendance for the last 7 days
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
            val daySdf = java.text.SimpleDateFormat("EEE", java.util.Locale.US)
            val last7Days = remember(trainerHistory) {
                (0..6).reversed().map { offset ->
                    val cal = java.util.Calendar.getInstance()
                    cal.add(java.util.Calendar.DAY_OF_YEAR, -offset)
                    val dateStr = sdf.format(cal.time)
                    val dayLabel = daySdf.format(cal.time)
                    val count = trainerHistory.count { it.date == dateStr && !listOf("Absent", "On Leave", "Holiday").contains(it.checkIn) }
                    dayLabel to count
                }
            }
            
            val maxCount = last7Days.maxOf { it.second }.coerceAtLeast(1)
            
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp)
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                last7Days.forEach { (dayLabel, count) ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Bottom,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = if (count > 0) "$count" else "",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(
                            modifier = Modifier
                                .width(16.dp)
                                .fillMaxHeight(fraction = (count.toFloat() / maxCount.toFloat()).coerceIn(0.1f, 1f))
                                .background(
                                    color = if (count > 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f),
                                    shape = RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)
                                )
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = dayLabel,
                            fontSize = 10.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                }
            }
        }
    }
}

// Inline CameraX + ML Kit QR Scanner implementation
@Composable
fun EmbeddedQRScanner(
    modifier: Modifier = Modifier,
    lensFacing: Int = CameraSelector.LENS_FACING_BACK,
    isTorchOn: Boolean = false,
    isScanningActive: Boolean = true,
    scanAnimationState: String? = null,
    onCodeScanned: (String) -> Unit,
    isInitializing: Boolean,
    onInitializingChanged: (Boolean) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }
    
    var camera: Camera? by remember { mutableStateOf(null) }
    val previewView = remember { PreviewView(context) }

    // Re-bind whenever lens selection or permissions update
    LaunchedEffect(lensFacing) {
        onInitializingChanged(true)
        val cameraProviderProvider = ProcessCameraProvider.getInstance(context)
        
        cameraProviderProvider.addListener({
            try {
                val cameraProvider = cameraProviderProvider.get()
                cameraProvider.unbindAll()

                val preview = Preview.Builder().build().apply {
                    setSurfaceProvider(previewView.surfaceProvider)
                }

                // Barcode analyzer utilizing ML Kit
                val barcodeScanner = BarcodeScanning.getClient()
                val imageAnalyzer = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also { analyzer ->
                        analyzer.setAnalyzer(cameraExecutor) { imageProxy ->
                            @OptIn(ExperimentalGetImage::class)
                            val mediaImage = imageProxy.image
                            if (mediaImage != null && isScanningActive) {
                                val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                                barcodeScanner.process(image)
                                    .addOnSuccessListener { barcodes ->
                                        for (barcode in barcodes) {
                                            val rawValue = barcode.rawValue
                                            if (!rawValue.isNullOrEmpty()) {
                                                onCodeScanned(rawValue)
                                                break
                                            }
                                        }
                                    }
                                    .addOnCompleteListener {
                                        imageProxy.close()
                                    }
                            } else {
                                imageProxy.close()
                            }
                        }
                    }

                val cameraSelector = CameraSelector.Builder()
                    .requireLensFacing(lensFacing)
                    .build()

                camera = cameraProvider.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageAnalyzer
                )
                
                onInitializingChanged(false)
            } catch (exc: Exception) {
                Log.e("EmbeddedQRScanner", "Use case binding failed", exc)
                onInitializingChanged(false)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    // Toggle Flashlight/Torch state
    LaunchedEffect(isTorchOn, camera) {
        camera?.let {
            if (it.cameraInfo.hasFlashUnit()) {
                it.cameraControl.enableTorch(isTorchOn)
            }
        }
    }

    // Clean up resources on dispose
    DisposableEffect(Unit) {
        onDispose {
            cameraExecutor.shutdown()
        }
    }

    // Scanner Reticle Overlay Layer (Standard scanning frames)
    Box(modifier = modifier) {
        AndroidView(
            factory = { previewView },
            modifier = Modifier.fillMaxSize()
        )

        // Pulsing Scan Reticle guide overlay
        val infiniteTransition = rememberInfiniteTransition(label = "ReticlePulsing")
        val alphaMultiplier by infiniteTransition.animateFloat(
            initialValue = 0.3f,
            targetValue = 0.9f,
            animationSpec = infiniteRepeatable(
                animation = tween(1200, easing = LinearEasing),
                repeatMode = RepeatMode.Reverse
            ),
            label = "alpha"
        )

        // Draw HUD Frame overlay with canvas
        Canvas(modifier = Modifier.fillMaxSize()) {
            val width = size.width
            val height = size.height
            val boxSize = 200.dp.toPx()
            
            val left = (width - boxSize) / 2
            val top = (height - boxSize) / 2
            val right = left + boxSize
            val bottom = top + boxSize

            // Outer dark bounds tint
            drawRect(
                color = Color.Black.copy(alpha = 0.6f)
            )

            // Punch out scanning window clear hole
            drawRect(
                color = Color.Transparent,
                topLeft = Offset(left, top),
                size = androidx.compose.ui.geometry.Size(boxSize, boxSize),
                blendMode = androidx.compose.ui.graphics.BlendMode.Clear
            )

            // Draw visual green framing corners
            val strokeWidth = 3.dp.toPx()
            val cornerLength = 20.dp.toPx()
            val themeColor = if (scanAnimationState == "SUCCESS") Color(0xFF10B981) 
                             else if (scanAnimationState == "ERROR") Color(0xFFEF4444) 
                             else Color(0xFF10B981).copy(alpha = alphaMultiplier)

            // Top-Left corner
            drawLine(themeColor, Offset(left, top), Offset(left + cornerLength, top), strokeWidth)
            drawLine(themeColor, Offset(left, top), Offset(left, top + cornerLength), strokeWidth)

            // Top-Right corner
            drawLine(themeColor, Offset(right, top), Offset(right - cornerLength, top), strokeWidth)
            drawLine(themeColor, Offset(right, top), Offset(right, top + cornerLength), strokeWidth)

            // Bottom-Left corner
            drawLine(themeColor, Offset(left, bottom), Offset(left + cornerLength, bottom), strokeWidth)
            drawLine(themeColor, Offset(left, bottom), Offset(left, bottom - cornerLength), strokeWidth)

            // Bottom-Right corner
            drawLine(themeColor, Offset(right, bottom), Offset(right - cornerLength, bottom), strokeWidth)
            drawLine(themeColor, Offset(right, bottom), Offset(right, bottom - cornerLength), strokeWidth)
        }

        // Overlay status info
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            contentAlignment = Alignment.BottomCenter
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Flash, lens controls
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Spacer(modifier = Modifier.weight(1f))
                }

                Card(
                    colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.65f)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        if (isInitializing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(12.dp),
                                color = MaterialTheme.colorScheme.primary,
                                strokeWidth = 1.5.dp
                            )
                        }
                        Text(
                            text = if (isInitializing) "INITIALIZING SENSORS..." 
                                   else if (scanAnimationState == "SUCCESS") "BADGE MATCHED!" 
                                   else if (scanAnimationState == "ERROR") "INVALID PASS BADGE"
                                   else "ALIGN QR PASS IN RETICLE",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = if (scanAnimationState == "SUCCESS") Color(0xFF10B981) 
                                    else if (scanAnimationState == "ERROR") Color(0xFFEF4444)
                                    else Color.White
                        )
                    }
                }
            }
        }
    }
}

// ZXing bits for decoding QR files from photo library
private fun getBitmapFromUri(context: Context, uri: Uri): Bitmap? {
    return try {
        val contentResolver = context.contentResolver
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            ImageDecoder.decodeBitmap(ImageDecoder.createSource(contentResolver, uri)) { decoder, _, _ ->
                decoder.isMutableRequired = true
            }
        } else {
            @Suppress("DEPRECATION")
            MediaStore.Images.Media.getBitmap(contentResolver, uri)
        }
    } catch (e: Exception) {
        Log.e("AttendanceScreen", "Error reading gallery bitmap", e)
        null
    }
}

private fun decodeQrFromBitmap(bitmap: Bitmap): String? {
    val width = bitmap.width
    val height = bitmap.height
    val pixels = IntArray(width * height)
    bitmap.getPixels(pixels, 0, width, 0, 0, width, height)
    val source = RGBLuminanceSource(width, height, pixels)
    val binaryBitmap = BinaryBitmap(HybridBinarizer(source))
    return try {
        val reader = MultiFormatReader()
        val hints = mapOf(
            DecodeHintType.TRY_HARDER to true,
            DecodeHintType.POSSIBLE_FORMATS to listOf(BarcodeFormat.QR_CODE)
        )
        val result = reader.decode(binaryBitmap, hints)
        result.text
    } catch (e: Exception) {
        Log.e("AttendanceScreen", "ZXing decoding failed", e)
        null
    }
}
