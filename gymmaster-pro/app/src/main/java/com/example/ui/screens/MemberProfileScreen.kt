package com.example.ui.screens

import kotlinx.coroutines.launch
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.*
import com.example.ui.GymViewModel
import com.example.ui.hooks.useGenerateMemberPlan
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import kotlin.random.Random

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemberProfileScreen(
    viewModel: GymViewModel,
    memberId: String,
    onNavigateBack: () -> Unit
) {
    val members by viewModel.allMembers.collectAsState()
    val payments by viewModel.allPayments.collectAsState()
    val trainers by viewModel.allTrainers.collectAsState()
    val settings by viewModel.settings.collectAsState()

    val currency = settings?.currency ?: "₹"
    val context = LocalContext.current

    val member = members.find { it.memberId == memberId }
    val daysUntilExpiry = remember(member) {
        if (member == null) null else {
            try {
                val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
                val expiryDate = dateFormat.parse(member.expiryDate)
                if (expiryDate != null) {
                    val today = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).parse(
                        java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(java.util.Date())
                    ) ?: java.util.Date()
                    val diffMs = expiryDate.time - today.time
                    (diffMs / (1000 * 60 * 60 * 24)).toInt()
                } else null
            } catch (e: Exception) {
                null
            }
        }
    }
    val isWithinSevenDays = daysUntilExpiry != null && daysUntilExpiry in 0..7

    val memberPayments = payments.filter { it.memberId == memberId && it.status == "Paid" }
    val assignedTrainer = trainers.find { it.trainerId == member?.trainerId }

    val workoutPlan by viewModel.getWorkoutForMember(memberId).collectAsState(initial = null)
    val dietPlan by viewModel.getDietForMember(memberId).collectAsState(initial = null)

    var smartCoachData by remember { mutableStateOf<Map<String, Any>?>(null) }
    var fetchingSmartCoach by remember { mutableStateOf(false) }
    var smartCoachFetchError by remember { mutableStateOf<String?>(null) }

    val generatorState = useGenerateMemberPlan(viewModel, memberId)

    LaunchedEffect(memberId) {
        fetchingSmartCoach = true
        smartCoachFetchError = null
        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            db.collection("members").document(memberId).get()
                .addOnSuccessListener { document ->
                    if (document != null && document.exists()) {
                        val coachMap = document.get("smartCoach") as? Map<String, Any>
                        smartCoachData = coachMap
                    }
                    fetchingSmartCoach = false
                }
                .addOnFailureListener { e ->
                    smartCoachFetchError = e.localizedMessage ?: "Failed to fetch smart coach plan"
                    fetchingSmartCoach = false
                }
        } catch (e: Exception) {
            smartCoachFetchError = e.localizedMessage ?: "Firestore is not available"
            fetchingSmartCoach = false
        }
    }

    LaunchedEffect(generatorState.isSuccess) {
        if (generatorState.isSuccess) {
            fetchingSmartCoach = true
            try {
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                db.collection("members").document(memberId).get()
                    .addOnSuccessListener { document ->
                        if (document != null && document.exists()) {
                            val coachMap = document.get("smartCoach") as? Map<String, Any>
                            smartCoachData = coachMap
                        }
                        fetchingSmartCoach = false
                    }
            } catch (e: Exception) {
                fetchingSmartCoach = false
            }
        }
    }

    if (member == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Member record not found.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                Spacer(modifier = Modifier.height(12.dp))
                Button(onClick = onNavigateBack) {
                    Text("Go Back")
                }
            }
        }
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Back Header
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.clickable { onNavigateBack() }
        ) {
            Icon(imageVector = Icons.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.primary)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Back to Directory", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
        }

        // Primary Member Header Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Member Avatar Initials Badge
                    val initials = member.name.split(" ")
                        .take(2)
                        .map { it.firstOrNull() ?: "" }
                        .joinToString("")
                        .uppercase()
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .background(MaterialTheme.colorScheme.primaryContainer, CircleShape)
                            .border(1.5.dp, MaterialTheme.colorScheme.primary, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = initials,
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column {
                        Text(
                            text = member.name,
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "Member ID: ${member.memberId} • Joining: ${member.joiningDate}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            // Active status tag
                            Box(
                                modifier = Modifier
                                    .background(
                                        color = if (member.status == "active") Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFEF4444).copy(alpha = 0.15f),
                                        shape = RoundedCornerShape(6.dp)
                                    )
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = member.status.uppercase(),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (member.status == "active") Color(0xFF10B981) else Color(0xFFEF4444)
                                )
                            }

                            // Payment status tag
                            Box(
                                modifier = Modifier
                                    .background(
                                        color = if (member.paymentStatus == "paid") Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFF59E0B).copy(alpha = 0.15f),
                                        shape = RoundedCornerShape(6.dp)
                                    )
                                    .padding(horizontal = 8.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = member.paymentStatus.uppercase(),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (member.paymentStatus == "paid") Color(0xFF10B981) else Color(0xFFF59E0B)
                                )
                            }

                            // Expiring soon badge within 7 days
                            if (isWithinSevenDays) {
                                Box(
                                    modifier = Modifier
                                        .background(
                                            color = Color(0xFFF97316).copy(alpha = 0.15f),
                                            shape = RoundedCornerShape(6.dp)
                                        )
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = if (daysUntilExpiry == 0) "⚠️ EXPIRES TODAY" else "⚠️ EXPIRES IN $daysUntilExpiry DAYS",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFFF97316)
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                Spacer(modifier = Modifier.height(8.dp))
                
                val context = androidx.compose.ui.platform.LocalContext.current
                
                // WhatsApp Cloud Reminders Integration Panel
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.25f)
                    ),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Message,
                                contentDescription = "WhatsApp Cloud Reminders",
                                tint = Color(0xFF25D366),
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "WhatsApp Cloud Reminders",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        Text(
                            text = "Select Message Template:",
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        
                        var selectedTemplate by remember { mutableStateOf("membership_expiring") }
                        val templates = listOf(
                            Pair("membership_expiring", "Membership Expiring"),
                            Pair("fees_pending", "Fees Pending"),
                            Pair("payment_received", "Payment Received"),
                            Pair("membership_activated", "Membership Activated"),
                            Pair("membership_renewed", "Membership Renewed"),
                            Pair("birthday_wishes", "Birthday Wishes")
                        )
                        
                        var isDropdownExpanded by remember { mutableStateOf(false) }
                        
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { isDropdownExpanded = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.15f))
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = templates.find { it.first == selectedTemplate }?.second ?: "Select Template",
                                        color = MaterialTheme.colorScheme.onSurface,
                                        style = MaterialTheme.typography.bodyMedium
                                    )
                                    Icon(
                                        imageVector = Icons.Filled.ArrowDropDown,
                                        contentDescription = "Dropdown",
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            
                            DropdownMenu(
                                expanded = isDropdownExpanded,
                                onDismissRequest = { isDropdownExpanded = false },
                                modifier = Modifier.fillMaxWidth(0.9f)
                            ) {
                                templates.forEach { (key, label) ->
                                    DropdownMenuItem(
                                        text = { Text(label) },
                                        onClick = {
                                            selectedTemplate = key
                                            isDropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(12.dp))
                        
                        var previewText by remember { mutableStateOf("") }
                        var isPreparing by remember { mutableStateOf(false) }
                        val coroutineScope = rememberCoroutineScope()
                        
                        Text(
                            text = "Message Preview:",
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp)
                                    .defaultMinSize(minHeight = 80.dp),
                                contentAlignment = if (previewText.isEmpty() && !isPreparing) Alignment.Center else Alignment.TopStart
                            ) {
                                if (isPreparing) {
                                    CircularProgressIndicator(
                                        modifier = Modifier
                                            .size(24.dp)
                                            .align(Alignment.Center),
                                        strokeWidth = 2.dp,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                } else if (previewText.isEmpty()) {
                                    Text(
                                        text = "Click 'Preview Message' to fetch from cloud function...",
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                                        ),
                                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                                    )
                                } else {
                                    Text(
                                        text = previewText,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            // Preview Message Button
                            OutlinedButton(
                                onClick = {
                                    coroutineScope.launch {
                                        isPreparing = true
                                        val msg = viewModel.prepareReminderMessage(member.memberId, selectedTemplate)
                                        if (msg != null) {
                                            previewText = msg
                                        } else {
                                            viewModel.showFeedback("Failed to prepare reminder message from Cloud Function.")
                                        }
                                        isPreparing = false
                                    }
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("preview_message_button")
                                    .height(44.dp),
                                shape = RoundedCornerShape(8.dp),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary)
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Visibility,
                                    contentDescription = "Preview Message",
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Preview", fontWeight = FontWeight.Bold)
                            }
                            
                            // Send WhatsApp Button
                            Button(
                                onClick = {
                                    coroutineScope.launch {
                                        isPreparing = true
                                        val msg = if (previewText.isNotEmpty()) previewText else {
                                            viewModel.prepareReminderMessage(member.memberId, selectedTemplate)
                                        }
                                        isPreparing = false
                                        
                                        if (msg != null) {
                                            previewText = msg
                                            try {
                                                val encodedMsg = java.net.URLEncoder.encode(msg, "UTF-8")
                                                val cleanPhone = member.phone.replace("[^0-9]".toRegex(), "")
                                                val phoneWithCountry = if (cleanPhone.length == 10) "91$cleanPhone" else cleanPhone
                                                val url = "https://api.whatsapp.com/send?phone=$phoneWithCountry&text=$encodedMsg"
                                                val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                                                context.startActivity(intent)
                                                viewModel.showFeedback("Opening WhatsApp Share Link...")
                                            } catch (e: Exception) {
                                                viewModel.showFeedback("Error opening WhatsApp")
                                            }
                                        } else {
                                            viewModel.showFeedback("Failed to prepare message.")
                                        }
                                    }
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("send_whatsapp_button")
                                    .height(44.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366)),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Send,
                                    contentDescription = "Send WhatsApp",
                                    tint = Color.White,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Send", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // Contact and Emergency Coordinates
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Contact & Emergency Details", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Filled.Call, contentDescription = "Phone", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Phone: ${member.phone}", fontSize = 13.sp)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Filled.Email, contentDescription = "Email", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Email: ${member.email.ifBlank { "Not Provided" }}", fontSize = 13.sp)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Filled.ContactPhone, contentDescription = "Emergency", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Emergency Contact: ${member.emergencyContact.ifBlank { "Not Configured" }}", fontSize = 13.sp)
                }
            }
        }

        // Real-Time Attendance Status Card
        val allAttendance by viewModel.allAttendance.collectAsState()
        val memberLogs = remember(allAttendance, memberId) {
            allAttendance.filter { it.memberId == memberId }
        }
        val latestLog = memberLogs.firstOrNull()
        val todayDate = viewModel.todayDate
        val isCheckedInToday = latestLog != null && latestLog.date == todayDate && latestLog.checkOut == null

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (isCheckedInToday) Color(0xFFE6F4EA) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
            ),
            border = BorderStroke(
                width = 1.dp,
                color = if (isCheckedInToday) Color(0xFF34D399) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
            )
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(
                            color = if (isCheckedInToday) Color(0xFF34D399) else Color(0xFF94A3B8),
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isCheckedInToday) Icons.Filled.CheckCircle else Icons.Filled.ExitToApp,
                        contentDescription = "Attendance",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }

                Column(modifier = Modifier.weight(1.0f)) {
                    Text(
                        text = "Real-Time Attendance Status",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = if (isCheckedInToday) Color(0xFF065F46) else MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = if (isCheckedInToday) "Currently Checked-In" else "Currently Checked-Out",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = if (isCheckedInToday) Color(0xFF047857) else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = when {
                            isCheckedInToday -> "Entered at ${latestLog?.checkIn ?: "--:--"}"
                            latestLog != null -> "Last Active: ${latestLog.date} (${latestLog.checkIn ?: ""}-${latestLog.checkOut ?: "In Gym"})"
                            else -> "No check-ins logged yet."
                        },
                        fontSize = 12.sp,
                        color = if (isCheckedInToday) Color(0xFF065F46).copy(alpha = 0.8f) else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Mobile Attendance QR simulation card
        Card(
            onClick = {
                viewModel.scanQRCode(member.memberId)
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Mobile Contactless Access QR",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    text = "Tap this digital pass to simulate scanning it at the reception desk scanner for instant check-in/out.",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Beautiful, fully functional standard scannable QR Code using ZXing
                val qrText = remember(member.memberId) {
                    val localIp = viewModel.getLocalServerUrl().substringAfter("http://").substringBefore(":")
                    "http://$localIp:8080/checkin?id=${member.memberId}"
                }
                val bitMatrix = remember(qrText) {
                    try {
                        QRCodeWriter().encode(qrText, BarcodeFormat.QR_CODE, 200, 200)
                    } catch (e: Exception) {
                        null
                    }
                }

                Box(
                    modifier = Modifier
                        .size(160.dp)
                        .background(Color.White, RoundedCornerShape(12.dp))
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    if (bitMatrix != null) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val matrixWidth = bitMatrix.width
                            val matrixHeight = bitMatrix.height
                            val cellW = size.width / matrixWidth
                            val cellH = size.height / matrixHeight

                            for (x in 0 until matrixWidth) {
                                for (y in 0 until matrixHeight) {
                                    if (bitMatrix.get(x, y)) {
                                        drawRect(
                                            color = Color.Black,
                                            topLeft = Offset(x * cellW, y * cellH),
                                            size = Size(cellW, cellH)
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        Text("QR Error", color = Color.Red, fontSize = 11.sp)
                    }
                }

                Text(
                    text = "TAP PASS TO SIMULATE QR SCAN ⚡",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                Text(
                    text = "MEMBER ID: ${member.memberId}",
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )

                Spacer(modifier = Modifier.height(4.dp))
                Spacer(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                )
                Spacer(modifier = Modifier.height(4.dp))

                // Action buttons: Generate QR, Download QR, Share QR
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Generate QR (with feedback / success trigger)
                    Button(
                        onClick = {
                            viewModel.showFeedback("Contactless QR Access Card Generated Successfully! ⚡")
                        },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("generate_qr_button")
                            .height(36.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer,
                            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                        ),
                        contentPadding = PaddingValues(horizontal = 4.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.QrCode,
                            contentDescription = "Generate",
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(3.dp))
                        Text("Generate QR", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }

                    // Download QR Menu
                    var isDownloadMenuExpanded by remember { mutableStateOf(false) }
                    Box(modifier = Modifier.weight(1f)) {
                        Button(
                            onClick = { isDownloadMenuExpanded = true },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("download_qr_button")
                                .height(36.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                            ),
                            contentPadding = PaddingValues(horizontal = 4.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Download,
                                contentDescription = "Download",
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(3.dp))
                            Text("Download", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }

                        DropdownMenu(
                            expanded = isDownloadMenuExpanded,
                            onDismissRequest = { isDownloadMenuExpanded = false }
                        ) {
                            DropdownMenuItem(
                                leadingIcon = { Icon(Icons.Filled.Image, null, modifier = Modifier.size(16.dp)) },
                                text = { Text("Download PNG Image", fontSize = 12.sp) },
                                onClick = {
                                    isDownloadMenuExpanded = false
                                    val localIp = viewModel.getLocalServerUrl().substringAfter("http://").substringBefore(":")
                                    val publicQrUrl = "http://$localIp:8080/member/QR${member.memberId}"
                                    val result = com.example.util.ShareHelper.downloadQrAsPng(context, publicQrUrl, member.name)
                                    if (result != null) {
                                        viewModel.showFeedback("Success: QR downloaded as PNG. $result")
                                    } else {
                                        viewModel.showFeedback("Error downloading PNG")
                                    }
                                }
                            )
                            DropdownMenuItem(
                                leadingIcon = { Icon(Icons.Filled.PictureAsPdf, null, modifier = Modifier.size(16.dp)) },
                                text = { Text("Download PDF Document", fontSize = 12.sp) },
                                onClick = {
                                    isDownloadMenuExpanded = false
                                    val localIp = viewModel.getLocalServerUrl().substringAfter("http://").substringBefore(":")
                                    val publicQrUrl = "http://$localIp:8080/member/QR${member.memberId}"
                                    val result = com.example.util.ShareHelper.downloadQrAsPdf(
                                        context = context,
                                        qrText = publicQrUrl,
                                        userName = member.name,
                                        planName = member.membershipPlan,
                                        status = member.status
                                    )
                                    if (result != null) {
                                        viewModel.showFeedback("Success: QR downloaded as PDF. $result")
                                    } else {
                                        viewModel.showFeedback("Error downloading PDF")
                                    }
                                }
                            )
                            DropdownMenuItem(
                                leadingIcon = { Icon(Icons.Filled.ContentCopy, null, modifier = Modifier.size(16.dp)) },
                                text = { Text("Copy Public QR Link", fontSize = 12.sp) },
                                onClick = {
                                    isDownloadMenuExpanded = false
                                    val localIp = viewModel.getLocalServerUrl().substringAfter("http://").substringBefore(":")
                                    val publicQrUrl = "http://$localIp:8080/member/QR${member.memberId}"
                                    val clipboardManager = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                    val clip = android.content.ClipData.newPlainText("Gym Member Pass QR Link", publicQrUrl)
                                    clipboardManager.setPrimaryClip(clip)
                                    viewModel.showFeedback("Copied QR Link to clipboard! 📋")
                                }
                            )
                        }
                    }

                    // Share QR
                    Button(
                        onClick = {
                            val localIp = viewModel.getLocalServerUrl().substringAfter("http://").substringBefore(":")
                            val publicQrUrl = "http://$localIp:8080/member/QR${member.memberId}"
                            val settingsVal = settings
                            val isTokenConfigured = settingsVal != null && 
                                settingsVal.whatsappBusinessToken.isNotBlank() && 
                                settingsVal.whatsappBusinessPhoneId.isNotBlank()
                            
                            if (isTokenConfigured && settingsVal != null) {
                                viewModel.showFeedback("Sending QR Access Card directly via WhatsApp Business API... 📤")
                                val encodedText = java.net.URLEncoder.encode(publicQrUrl, "UTF-8")
                                val qrImgApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=$encodedText"
                                val caption = "Hello ${member.name}, here is your digital QR access card for ${settingsVal.gymName}! Please present this at the reception desk to check-in / check-out. Active Access Link: $publicQrUrl"
                                
                                com.example.util.ShareHelper.sendWhatsAppApiImage(
                                    token = settingsVal.whatsappBusinessToken,
                                    phoneId = settingsVal.whatsappBusinessPhoneId,
                                    recipientPhone = member.phone,
                                    imageUrl = qrImgApiUrl,
                                    caption = caption,
                                    onResult = { success, msg ->
                                        if (success) {
                                            viewModel.showFeedback("Successfully sent QR image directly via WhatsApp Cloud API! 💚")
                                        } else {
                                            viewModel.showFeedback("WhatsApp API Error: $msg")
                                        }
                                    }
                                )
                            } else {
                                try {
                                    val encodedMsg = java.net.URLEncoder.encode(
                                        "Hello ${member.name}, here is your digital gym access pass link: $publicQrUrl. Open it to scan your QR code at the desk! 💪",
                                        "UTF-8"
                                    )
                                    val cleanPhone = member.phone.replace("[^0-9]".toRegex(), "")
                                    val phoneWithCountry = if (cleanPhone.length == 10) "91$cleanPhone" else cleanPhone
                                    val url = "https://api.whatsapp.com/send?phone=$phoneWithCountry&text=$encodedMsg"
                                    val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                                    context.startActivity(intent)
                                    viewModel.showFeedback("Opening WhatsApp Share Link...")
                                } catch (e: Exception) {
                                    viewModel.showFeedback("Error opening WhatsApp")
                                }
                            }
                        },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("share_qr_button")
                            .height(36.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF25D366),
                            contentColor = Color.White
                        ),
                        contentPadding = PaddingValues(horizontal = 4.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Share,
                            contentDescription = "Share",
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(3.dp))
                        Text("Share QR", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Anatomical / Health Metrics Dashboard Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Anatomical & Health Statistics", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Age", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text("${member.age} yrs", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Gender", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text(member.gender, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Height", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text("${member.height.toInt()} cm", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Weight", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text("${member.weight.toInt()} kg", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Blood", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Text(member.bloodGroup, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.Red)
                    }
                }

                val memberBmi = if (member.bmi > 0.0) member.bmi else Member.calculateBmi(member.height, member.weight)
                val memberBmiCategory = if (!member.bmiCategory.isNullOrBlank()) member.bmiCategory else Member.getBmiCategory(memberBmi)

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f), RoundedCornerShape(10.dp))
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Body Mass Index (BMI)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                        Text(
                            text = String.format(java.util.Locale.US, "%.2f", memberBmi),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Box(
                        modifier = Modifier
                            .background(
                                color = when (memberBmiCategory) {
                                    "Normal" -> Color(0xFF10B981).copy(alpha = 0.15f)
                                    "Underweight" -> Color(0xFF3B82F6).copy(alpha = 0.15f)
                                    "Overweight" -> Color(0xFFF59E0B).copy(alpha = 0.15f)
                                    "Obese" -> Color(0xFFEF4444).copy(alpha = 0.15f)
                                    else -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.15f)
                                },
                                shape = RoundedCornerShape(8.dp)
                            )
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = memberBmiCategory.uppercase(),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = when (memberBmiCategory) {
                                "Normal" -> Color(0xFF10B981)
                                "Underweight" -> Color(0xFF3B82F6)
                                "Overweight" -> Color(0xFFF59E0B)
                                "Obese" -> Color(0xFFEF4444)
                                else -> MaterialTheme.colorScheme.onSurface
                            }
                        )
                    }
                }

                Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))

                Text("Assigned Trainer:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                Text(
                    text = assignedTrainer?.name ?: "No Coach Assigned",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )

                if (!member.notes.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Medical Notes / Physical Goals:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    Text(text = member.notes, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f))
                }
            }
        }

        // Active Fitness sheets previews
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Active Workouts & Diets Preview", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))

                // Workout exercise preview
                Column {
                    Text("Monday Workout Schedule:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    val mondayWorkout = workoutPlan?.monday
                    Text(
                        text = if (mondayWorkout.isNullOrBlank()) "Rest / Free Day" else mondayWorkout,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                    )
                }

                Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))

                // Diet breakfast/nutrition preview
                Column {
                    Text("Nutrition Breakfast Details:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                    val breakfastDiet = dietPlan?.breakfast
                    Text(
                        text = if (breakfastDiet.isNullOrBlank()) "Standard Healthy Diet" else breakfastDiet,
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Daily Goals: ${dietPlan?.calories ?: 2000} kcal • ${dietPlan?.protein ?: 110}g Protein",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )
                }
            }
        }

        // --- GEMINI AI SMART COACH ---
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.05f)
            ),
            border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.15f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Header Row
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
                            imageVector = Icons.Filled.AutoAwesome,
                            contentDescription = "AI Smart Coach",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(20.dp)
                        )
                        Text(
                            text = "Gemini AI Smart Coach",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }

                    if (generatorState.isLoading || fetchingSmartCoach) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    } else {
                        IconButton(
                            onClick = { generatorState.generatePlan(member) },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Refresh,
                                contentDescription = "Regenerate Plan",
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                Text(
                    text = "Personalized elite fitness, nutrition, and recovery insights tailored to physical parameters, lifestyle goals, and BMI profile.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )

                if (generatorState.isLoading || fetchingSmartCoach) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                            Text(
                                "Analyzing parameters & crafting elite plan...",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                        }
                    }
                } else if (generatorState.error != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                            .padding(12.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = "Failed to Generate Plan",
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.error,
                                fontSize = 13.sp
                            )
                            Text(
                                text = generatorState.error ?: "Unknown error",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                            Button(
                                onClick = { generatorState.generatePlan(member) },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                modifier = Modifier.align(Alignment.End).height(32.dp)
                            ) {
                                Text("Retry", fontSize = 12.sp)
                            }
                        }
                    }
                } else if (smartCoachData == null) {
                    // Empty state
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = "No Smart Coach plan generated yet",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                            Button(
                                onClick = { generatorState.generatePlan(member) },
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.AutoAwesome,
                                        contentDescription = "Generate",
                                        modifier = Modifier.size(14.dp)
                                    )
                                    Text("Generate AI Plan", fontSize = 12.sp)
                                }
                            }
                        }
                    }
                } else {
                    // Main layout with Tabs
                    var selectedAiTab by remember { mutableStateOf(0) }
                    val tabs = listOf("Workout", "Nutrition", "Health Tips")

                    TabRow(
                        selectedTabIndex = selectedAiTab,
                        containerColor = Color.Transparent,
                        contentColor = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        tabs.forEachIndexed { index, title ->
                            Tab(
                                selected = selectedAiTab == index,
                                onClick = { selectedAiTab = index },
                                text = { Text(title, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    val workoutCoachMap = smartCoachData?.get("workoutPlan") as? Map<String, Any>
                    val nutritionCoachMap = smartCoachData?.get("nutritionPlan") as? Map<String, Any>
                    val healthCoachMap = smartCoachData?.get("healthTips") as? Map<String, Any>

                    when (selectedAiTab) {
                        0 -> {
                            // Workout Plan
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                AiPlanItem(
                                    title = "Daily Routine",
                                    content = workoutCoachMap?.get("daily")?.toString() ?: "No plan data"
                                )
                                AiPlanItem(
                                    title = "Weekly Splits",
                                    content = workoutCoachMap?.get("weekly")?.toString() ?: "No plan data"
                                )
                                AiPlanItem(
                                    title = "Monthly Milestones",
                                    content = workoutCoachMap?.get("monthly")?.toString() ?: "No plan data"
                                )
                            }
                        }
                        1 -> {
                            // Nutrition Plan
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                AiPlanItem(
                                    title = "Breakfast",
                                    content = nutritionCoachMap?.get("breakfast")?.toString() ?: "No plan data"
                                )
                                AiPlanItem(
                                    title = "Lunch",
                                    content = nutritionCoachMap?.get("lunch")?.toString() ?: "No plan data"
                                )
                                AiPlanItem(
                                    title = "Dinner",
                                    content = nutritionCoachMap?.get("dinner")?.toString() ?: "No plan data"
                                )
                                AiPlanItem(
                                    title = "Snacks & Shakes",
                                    content = nutritionCoachMap?.get("snacks")?.toString() ?: "No plan data"
                                )
                                AiPlanItem(
                                    title = "Hydration Guidance",
                                    content = nutritionCoachMap?.get("hydration")?.toString() ?: "No plan data"
                                )
                                AiPlanItem(
                                    title = "Supplements Suggestions",
                                    content = nutritionCoachMap?.get("supplements")?.toString() ?: "No plan data"
                                )
                            }
                        }
                        2 -> {
                            // Health Tips
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                AiPlanItem(
                                    title = "Recovery Plan",
                                    content = healthCoachMap?.get("recovery")?.toString() ?: "No plan data"
                                )
                                AiPlanItem(
                                    title = "Sleep & Hygiene",
                                    content = healthCoachMap?.get("sleep")?.toString() ?: "No plan data"
                                )
                                AiPlanItem(
                                    title = "Strength & Progression",
                                    content = healthCoachMap?.get("strength")?.toString() ?: "No plan data"
                                )
                                AiPlanItem(
                                    title = "Cardiovascular Fitness",
                                    content = healthCoachMap?.get("cardio")?.toString() ?: "No plan data"
                                )
                            }
                        }
                    }
                }
            }
        }

        // Timeline of Paid Renewals Table/List
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Billing & Renewals Ledger Timeline", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))

                if (memberPayments.isEmpty()) {
                    Text("No billing payments found registered.", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        memberPayments.forEach { pay ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f), RoundedCornerShape(10.dp))
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(text = pay.planName, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    Text(text = "Date: ${pay.date} • Code: ${pay.transactionId}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                }

                                Text(
                                    text = "$currency${pay.amount.toInt()}",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = Color(0xFF10B981)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AiPlanItem(title: String, content: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = content,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
        )
    }
}
