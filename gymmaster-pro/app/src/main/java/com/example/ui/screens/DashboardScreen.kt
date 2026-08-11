package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.*
import com.example.ui.GymViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DashboardScreen(
    viewModel: GymViewModel,
    onNavigateToMembers: () -> Unit,
    onNavigateToPayments: () -> Unit,
    onNavigateToAttendance: () -> Unit
) {
    val members by viewModel.firestoreMembersState.collectAsState()
    val payments by viewModel.firestorePaymentsState.collectAsState()
    val allAttendance by viewModel.firestoreAttendanceState.collectAsState()
    val plans by viewModel.allPlans.collectAsState()
    val settings by viewModel.settings.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    val firestoreLoading by viewModel.firestoreLoading.collectAsState()
    val firestoreError by viewModel.firestoreError.collectAsState()

    if (firestoreError != null) {
        Box(
            modifier = Modifier.fillMaxSize().padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Warning,
                    contentDescription = "Error Icon",
                    modifier = Modifier.size(64.dp),
                    tint = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = firestoreError ?: "Unable to load dashboard data.",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.error,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Please check your network connection and try again.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f),
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(24.dp))
                Button(
                    onClick = { viewModel.startFirestoreDashboardListeners() },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Retry")
                }
            }
        }
        return
    }

    if (firestoreLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator()
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Loading Live Dashboard...",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                )
            }
        }
        return
    }

    val currency = settings?.currency ?: "₹"

    // Dialog state for One-Click Renewal
    var memberToRenew by remember { mutableStateOf<Member?>(null) }
    var selectedPlanForRenewal by remember { mutableStateOf<MembershipPlan?>(null) }
    var renewalPaymentMethod by remember { mutableStateOf("UPI") }

    // Derive stats
    val totalMembers = members.size
    val activeMembers = members.count { it.status == "active" }
    val expiredMembers = members.count { it.status == "expired" }
    val frozenMembers = members.count { it.status == "frozen" }

    // Today's Date
    val todayStr = viewModel.todayDate

    // Today's attendance count (ignoring duplicate scans)
    val attendanceTodayCount = remember(allAttendance, todayStr) {
        allAttendance
            .filter { it.date == todayStr && it.checkIn != null }
            .distinctBy { it.memberId }
            .size
    }

    // Today's revenue
    val todayRevenue = payments
        .filter { it.date == todayStr && it.status.equals("Paid", ignoreCase = true) }
        .sumOf { it.amount }

    // Monthly prefix (e.g. "2026-07")
    val currentMonthPrefix = remember { SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(Date()) }

    // Monthly revenue (Sum of all paid membership payments for that month)
    val monthlyRevenue = payments
        .filter { it.date.startsWith(currentMonthPrefix) && it.status.equals("Paid", ignoreCase = true) }
        .sumOf { it.amount }

    // Pending payments
    val pendingPaymentsSum = payments
        .filter { it.status.equals("Pending", ignoreCase = true) }
        .sumOf { it.amount }

    // Expiring soon (within 3 days)
    val expiringMembersList = remember(members) {
        val format = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val today = Date()
        val limitCal = Calendar.getInstance().apply {
            time = today
            add(Calendar.DAY_OF_YEAR, 3)
        }
        val limitDate = limitCal.time

        members.filter { member ->
            if (member.status == "frozen") return@filter false
            try {
                val expiry = format.parse(member.expiryDate)
                expiry != null && !expiry.before(today) && !expiry.after(limitDate)
            } catch (e: Exception) {
                false
            }
        }
    }

    val expiredMembersList = remember(members) {
        members.filter { it.status == "expired" }
    }

    // Combined Alerts List (expired or expiring in 3 days)
    val dashboardAlerts = remember(expiringMembersList, expiredMembersList) {
        expiringMembersList + expiredMembersList
    }

    // Last 3 Months Revenue Trend Data
    val monthlyData = remember(payments) {
        val format = SimpleDateFormat("yyyy-MM", Locale.getDefault())
        val labelFormat = SimpleDateFormat("MMM", Locale.getDefault())
        
        val cal = Calendar.getInstance()
        val m3 = cal.time
        val m3Label = labelFormat.format(m3) + " (Today)"
        val m3Prefix = format.format(m3)
        
        cal.add(Calendar.MONTH, -1)
        val m2 = cal.time
        val m2Label = labelFormat.format(m2)
        val m2Prefix = format.format(m2)
        
        cal.add(Calendar.MONTH, -1)
        val m1 = cal.time
        val m1Label = labelFormat.format(m1)
        val m1Prefix = format.format(m1)
        
        val r1 = payments.filter { it.date.startsWith(m1Prefix) && it.status.equals("Paid", ignoreCase = true) }.sumOf { it.amount }
        val r2 = payments.filter { it.date.startsWith(m2Prefix) && it.status.equals("Paid", ignoreCase = true) }.sumOf { it.amount }
        val r3 = payments.filter { it.date.startsWith(m3Prefix) && it.status.equals("Paid", ignoreCase = true) }.sumOf { it.amount }
        
        listOf(
            Triple(m1Label, r1, m1Prefix),
            Triple(m2Label, r2, m2Prefix),
            Triple(m3Label, r3, m3Prefix)
        )
    }
    val allRevenueZero = monthlyData.all { it.second == 0.0 }

    // Last 3 Days Attendance Trend Data
    val dailyAttendanceData = remember(allAttendance) {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        
        val cal = Calendar.getInstance()
        val todayDateStr = dateFormat.format(cal.time)
        val todayLabel = "Today"
        
        cal.add(Calendar.DAY_OF_YEAR, -1)
        val yesterdayDateStr = dateFormat.format(cal.time)
        val yesterdayLabel = "Yesterday"
        
        cal.add(Calendar.DAY_OF_YEAR, -1)
        val twoDaysAgoDateStr = dateFormat.format(cal.time)
        val twoDaysAgoLabel = "2 Days Ago"
        
        val countTwoDaysAgo = allAttendance
            .filter { it.date == twoDaysAgoDateStr && it.checkIn != null }
            .distinctBy { it.memberId }
            .size
            
        val countYesterday = allAttendance
            .filter { it.date == yesterdayDateStr && it.checkIn != null }
            .distinctBy { it.memberId }
            .size
            
        val countToday = allAttendance
            .filter { it.date == todayDateStr && it.checkIn != null }
            .distinctBy { it.memberId }
            .size
            
        listOf(
            Triple(twoDaysAgoLabel, countTwoDaysAgo, twoDaysAgoDateStr),
            Triple(yesterdayLabel, countYesterday, yesterdayDateStr),
            Triple(todayLabel, countToday, todayDateStr)
        )
    }
    val allAttendanceZero = dailyAttendanceData.all { it.second == 0 }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Welcoming Title Section
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Dashboard",
                        style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "Live operations center for ${settings?.gymName ?: "GymMaster Pro"}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                    )
                }
                Box(
                    modifier = Modifier
                        .background(
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                            CircleShape
                        )
                        .padding(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Dashboard,
                        contentDescription = "Dashboard Active",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }

        // Summary Stats Grid
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard(
                        title = "Total Members",
                        value = "$totalMembers",
                        icon = Icons.Filled.People,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToMembers
                    )
                    StatCard(
                        title = "Active Members",
                        value = "$activeMembers",
                        icon = Icons.Filled.CheckCircle,
                        color = Color(0xFF10B981), // Green
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToMembers
                    )
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard(
                        title = "Expired",
                        value = "$expiredMembers",
                        icon = Icons.Filled.Cancel,
                        color = Color(0xFFEF4444), // Red
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToMembers
                    )
                    StatCard(
                        title = "Today's Attendance",
                        value = "$attendanceTodayCount",
                        icon = Icons.Filled.QrCodeScanner,
                        color = Color(0xFF6366F1), // Indigo
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToAttendance
                    )
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard(
                        title = "Today's Revenue",
                        value = "$currency${todayRevenue.toInt()}",
                        icon = Icons.Filled.Payments,
                        color = Color(0xFFF59E0B), // Amber
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToPayments
                    )
                    StatCard(
                        title = "Monthly Revenue",
                        value = "$currency${monthlyRevenue.toInt()}",
                        icon = Icons.Filled.MonetizationOn,
                        color = Color(0xFF10B981), // Emerald
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToPayments
                    )
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatCard(
                        title = "Pending Dues",
                        value = "$currency${pendingPaymentsSum.toInt()}",
                        icon = Icons.Filled.HourglassBottom,
                        color = Color(0xFFEF4444), // Crimson Red
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToPayments
                    )
                    StatCard(
                        title = "Expiring Soon",
                        value = "${expiringMembersList.size}",
                        icon = Icons.Filled.Warning,
                        color = Color(0xFFF97316), // Orange
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToMembers
                    )
                }
            }
        }

        // Expiry & Expired Actionable Panel (Priority Renewals)
        if (dashboardAlerts.isNotEmpty() && currentUser?.role != "trainer") {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp), // rounded-3xl
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFFE7E0EC).copy(alpha = 0.4f) // bg-[#E7E0EC]/40
                    ),
                    border = BorderStroke(1.dp, Color(0xFFE2E8F0).copy(alpha = 0.5f)) // border-slate-200/50
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(Color(0xFFBA1A1A), CircleShape) // red dot
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Priority Renewals",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                            }
                            TextButton(onClick = onNavigateToMembers) {
                                Text(
                                    text = "View All",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Alert Members list
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            dashboardAlerts.take(4).forEach { member ->
                                val isExpired = member.status == "expired"
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color.White, RoundedCornerShape(16.dp))
                                        .border(1.dp, Color(0xFFF1F5F9), RoundedCornerShape(16.dp))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        // Initials Avatar
                                        val initials = member.name.split(" ").take(2).map { it.firstOrNull() ?: "" }.joinToString("").uppercase()
                                        val avatarBg = when (member.membershipPlan.lowercase()) {
                                            "gold" -> Color(0xFFD1E4FF)
                                            "silver" -> Color(0xFFE0E2EC)
                                            else -> Color(0xFFFFDBCB)
                                        }
                                        val avatarText = when (member.membershipPlan.lowercase()) {
                                            "gold" -> Color(0xFF001D36)
                                            "silver" -> Color(0xFF191C1E)
                                            else -> Color(0xFF311300)
                                        }
                                        Box(
                                            modifier = Modifier
                                                .size(44.dp)
                                                .background(avatarBg, CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = initials,
                                                fontWeight = FontWeight.Bold,
                                                color = avatarText,
                                                fontSize = 14.sp
                                            )
                                        }

                                        Spacer(modifier = Modifier.width(12.dp))

                                        Column {
                                            Text(
                                                text = member.name,
                                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            Text(
                                                text = if (isExpired) "Expired: ${member.expiryDate}" else "Expires soon: ${member.expiryDate}",
                                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                                                color = if (isExpired) Color(0xFFBA1A1A) else Color(0xFF8B5000)
                                            )
                                        }
                                    }

                                    Button(
                                        onClick = {
                                            memberToRenew = member
                                            selectedPlanForRenewal = plans.find { it.name == member.membershipPlan } ?: plans.firstOrNull()
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
                                        shape = RoundedCornerShape(100.dp),
                                        modifier = Modifier.height(34.dp)
                                    ) {
                                        Text("RENEW", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Quick Action Banner
        item {
            Card(
                onClick = onNavigateToAttendance,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp), // rounded-3xl
                colors = CardDefaults.cardColors(containerColor = Color(0xFF001D36)), // bg-[#001D36]
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Ready for check-in?",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color(0xFFD1E4FF) // text-[#D1E4FF]
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Scan Member QR",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .background(Color(0xFF0056D2), RoundedCornerShape(16.dp)), // bg-[#0056D2] rounded-2xl
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Filled.QrCodeScanner,
                            contentDescription = "Scan QR",
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }

        // Charts Section (Revenue & Attendance trends)
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Monthly Revenue Trend",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Historic and current monthly collection in $currency",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Draw a beautiful custom Bar Chart using Canvas
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(150.dp)
                            .padding(top = 8.dp)
                    ) {
                        if (allRevenueZero) {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No Revenue Data Available",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                )
                            }
                        }

                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val months = monthlyData.map { it.first }
                            val values = monthlyData.map { it.second }
                            val maxValue = (values.maxOrNull() ?: 1.0).coerceAtLeast(10000.0)

                            val barWidth = 40.dp.toPx()
                            val spacing = (size.width - (barWidth * months.size)) / (months.size + 1)

                            // Grid Lines
                            val gridLines = 4
                            for (i in 0..gridLines) {
                                val y = size.height - (size.height / gridLines) * i
                                drawLine(
                                    color = Color(0xFFE2E8F0),
                                    start = Offset(0f, y),
                                    end = Offset(size.width, y),
                                    strokeWidth = 1f
                                )
                            }

                            // Bars
                            for (i in months.indices) {
                                val x = spacing + i * (barWidth + spacing)
                                val barHeight = (values[i] / maxValue).toFloat() * (size.height - 30.dp.toPx())
                                val y = size.height - barHeight - 20.dp.toPx()

                                if (barHeight > 0f) {
                                    // Draw bar with rounded corners
                                    drawRoundRect(
                                        brush = Brush.verticalGradient(
                                            colors = listOf(
                                                Color(0xFF0056D2),
                                                Color(0xFF64B5F6)
                                            )
                                        ),
                                        topLeft = Offset(x, y),
                                        size = androidx.compose.ui.geometry.Size(barWidth, barHeight),
                                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(10f, 10f)
                                    )
                                }
                            }
                        }

                        // Labels overlays for Month & Amount
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .align(Alignment.BottomCenter)
                                .padding(horizontal = 8.dp),
                            horizontalArrangement = Arrangement.SpaceAround
                        ) {
                            monthlyData.forEach { (name, value, prefix) ->
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "$currency${value.toInt()}",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                        color = if (value > 0.0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                    )
                                    Text(
                                        text = name,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Attendance Trend Section
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Daily Member Check-Ins",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Scan traffic logs for the last 3 days",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Sparkline or Bars
                    Column(modifier = Modifier.fillMaxWidth()) {
                        if (allAttendanceZero) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(40.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No Attendance Data Available",
                                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                )
                            }
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(80.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            dailyAttendanceData.forEach { (label, count, date) ->
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Bottom,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .width(32.dp)
                                            .height((count * 15).dp)
                                            .clip(RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp))
                                            .background(if (count > 0) MaterialTheme.colorScheme.primary.copy(alpha = 0.8f) else Color.Transparent),
                                        contentAlignment = Alignment.TopCenter
                                    ) {
                                        // Empty content inside since we show count below
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "$count",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (count > 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = label,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal Sheet or Dialog for Instant Renewal
    if (memberToRenew != null) {
        val member = memberToRenew!!
        AlertDialog(
            onDismissRequest = { memberToRenew = null },
            title = {
                Text(
                    text = "One-Click Renewal: ${member.name}",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text(
                        text = "Select a plan to extend this membership. Expiries are calculated atomically to prevent billing errors.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )

                    // Membership Plan Dropdown selection
                    var isPlanExpanded by remember { mutableStateOf(false) }
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedButton(
                            onClick = { isPlanExpanded = true },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = selectedPlanForRenewal?.name ?: "Select Plan",
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Icon(
                                    imageVector = Icons.Filled.ArrowDropDown,
                                    contentDescription = "Drop",
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                        DropdownMenu(
                            expanded = isPlanExpanded,
                            onDismissRequest = { isPlanExpanded = false },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            plans.forEach { plan ->
                                DropdownMenuItem(
                                    text = { Text("${plan.name} (${plan.durationDays} days) - $currency${plan.price}") },
                                    onClick = {
                                        selectedPlanForRenewal = plan
                                        isPlanExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Pre-filled fields
                    selectedPlanForRenewal?.let { plan ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(
                                    MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                                    RoundedCornerShape(10.dp)
                                )
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("Amount Payable", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                Text(
                                    text = "$currency${plan.price}",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("Extension Period", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                Text(
                                    text = "+${plan.durationDays} Days",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = Color(0xFF10B981)
                                )
                            }
                        }
                    }

                    // Payment Method selector
                    Text(
                        text = "Payment Method",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold)
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("UPI", "Cash", "Card").forEach { method ->
                            val isSelected = renewalPaymentMethod == method
                            Card(
                                onClick = { renewalPaymentMethod = method },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(40.dp),
                                shape = RoundedCornerShape(8.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                                )
                            ) {
                                Box(
                                    modifier = Modifier.fillMaxSize(),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = method,
                                        color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
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
                        val plan = selectedPlanForRenewal
                        if (plan != null) {
                            viewModel.renewMember(
                                memberId = member.memberId,
                                planId = plan.planId,
                                amount = plan.price,
                                paymentMethod = renewalPaymentMethod
                            )
                            memberToRenew = null
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(8.dp),
                    enabled = selectedPlanForRenewal != null
                ) {
                    Text("Confirm Renewal", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { memberToRenew = null }) {
                    Text("Cancel")
                }
            },
            shape = RoundedCornerShape(16.dp)
        )
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {}
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        shape = RoundedCornerShape(24.dp), // rounded-3xl
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, Color(0xFFF1F5F9)), // border-slate-100
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .background(color.copy(alpha = 0.1f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(20.dp)
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = title,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                letterSpacing = 0.5.sp
            )
        }
    }
}
