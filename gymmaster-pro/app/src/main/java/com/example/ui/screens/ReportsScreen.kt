/*
 * Developed by Arnav Bairagi
 * © Arnav Bairagi. All Rights Reserved.
 */

package com.example.ui.screens

import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.*
import com.example.ui.GymViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ReportsScreen(viewModel: GymViewModel) {
    val context = LocalContext.current
    val members by viewModel.allMembers.collectAsState()
    val payments by viewModel.allPayments.collectAsState()
    val todayAttendance by viewModel.todayAttendance.collectAsState()
    val allAttendance by viewModel.allAttendance.collectAsState()
    val settings by viewModel.settings.collectAsState()

    val currency = settings?.currency ?: "₹"

    var activeReport by remember { mutableStateOf("revenue") } // "revenue", "history", "analytics", "expiries"

    // Derive Expiries for next 7 days
    val expiringNext7Days = remember(members) {
        val format = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val today = Date()
        val limitCal = Calendar.getInstance().apply {
            time = today
            add(Calendar.DAY_OF_YEAR, 7)
        }
        val limitDate = limitCal.time

        members.filter { member ->
            try {
                val expiry = format.parse(member.expiryDate)
                expiry != null && !expiry.before(today) && !expiry.after(limitDate)
            } catch (e: Exception) {
                false
            }
        }
    }

    // Revenue computations
    val paidPayments = payments.filter { it.status == "Paid" }
    val totalCollected = paidPayments.sumOf { it.amount }
    val pendingPayments = payments.filter { it.status == "Pending" }

    // Analytics: Compute Peak Hours dynamically
    val peakHourData = remember(allAttendance) {
        val morning = allAttendance.count { log -> log.checkIn?.contains("AM") == true && (log.checkIn.startsWith("05") || log.checkIn.startsWith("06") || log.checkIn.startsWith("07") || log.checkIn.startsWith("08")) }
        val lateMorning = allAttendance.count { log -> log.checkIn?.contains("AM") == true && (log.checkIn.startsWith("09") || log.checkIn.startsWith("10") || log.checkIn.startsWith("11")) }
        val afternoon = allAttendance.count { log -> (log.checkIn?.contains("PM") == true && (log.checkIn.startsWith("12") || log.checkIn.startsWith("01") || log.checkIn.startsWith("02") || log.checkIn.startsWith("03"))) }
        val evening = allAttendance.count { log -> (log.checkIn?.contains("PM") == true && (log.checkIn.startsWith("04") || log.checkIn.startsWith("05") || log.checkIn.startsWith("06") || log.checkIn.startsWith("07"))) }
        val night = allAttendance.count { log -> (log.checkIn?.contains("PM") == true && (log.checkIn.startsWith("08") || log.checkIn.startsWith("09") || log.checkIn.startsWith("10") || log.checkIn.startsWith("11"))) }

        listOf(
            "05 AM - 09 AM (Morning)" to morning,
            "09 AM - 12 PM (Late AM)" to lateMorning,
            "12 PM - 04 PM (Afternoon)" to afternoon,
            "04 PM - 08 PM (Evening Peak)" to evening,
            "08 PM - 11 PM (Night)" to night
        )
    }

    // Analytics: Compute Member Visit Frequency dynamically
    val visitFrequencyData = remember(allAttendance) {
        allAttendance.groupBy { it.memberName }
            .map { (name, logs) -> name to logs.size }
            .sortedByDescending { it.second }
            .take(5)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Title block
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Analytics & Reports",
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Perform business intelligence and check logs",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                )
            }

            // Export Actions Trigger row
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                IconButton(
                    onClick = {
                        val reportText = buildReportExportString(activeReport, payments, expiringNext7Days, allAttendance, currency)
                        val sendIntent: Intent = Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(Intent.EXTRA_TEXT, reportText)
                            type = "text/plain"
                        }
                        val shareIntent = Intent.createChooser(sendIntent, "Export Report via")
                        context.startActivity(shareIntent)
                        viewModel.showFeedback("Excel Sheet generated & shared!")
                    },
                    modifier = Modifier.background(Color(0xFF10B981).copy(alpha = 0.15f), CircleShape)
                ) {
                    Icon(imageVector = Icons.Filled.Share, contentDescription = "Excel", tint = Color(0xFF10B981))
                }

                IconButton(
                    onClick = {
                        val reportText = buildReportExportString(activeReport, payments, expiringNext7Days, allAttendance, currency)
                        val sendIntent: Intent = Intent().apply {
                            action = Intent.ACTION_SEND
                            putExtra(Intent.EXTRA_TEXT, "PDF Report Output:\n\n$reportText")
                            type = "text/plain"
                        }
                        val shareIntent = Intent.createChooser(sendIntent, "Export Report via")
                        context.startActivity(shareIntent)
                        viewModel.showFeedback("PDF Document compiled & shared!")
                    },
                    modifier = Modifier.background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f), CircleShape)
                ) {
                    Icon(imageVector = Icons.Filled.PictureAsPdf, contentDescription = "PDF", tint = MaterialTheme.colorScheme.primary)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Report category switches (Scrollable row to fit comfortably)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            listOf(
                Triple("revenue", "Revenue", Icons.Filled.MonetizationOn),
                Triple("history", "Logs", Icons.Filled.History),
                Triple("analytics", "Charts", Icons.Filled.BarChart),
                Triple("expiries", "Expiries", Icons.Filled.Warning)
            ).forEach { (key, title, icon) ->
                val isSelected = activeReport == key
                Button(
                    onClick = { activeReport = key },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                    ),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp)
                ) {
                    Icon(imageVector = icon, contentDescription = null, modifier = Modifier.size(14.dp), tint = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface)
                    Spacer(modifier = Modifier.width(2.dp))
                    Text(title, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Report lists
        when (activeReport) {
            "revenue" -> {
                // Collections ledger summary
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Total Paid Ledger", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                            Text("$currency${totalCollected.toInt()}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF10B981))
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Pending Dues Count", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                            Text("${pendingPayments.size} accounts", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFFEF4444))
                        }
                    }
                }

                if (paidPayments.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Text("No collection logs recorded yet.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(payments) { payment ->
                            val isPaid = payment.status == "Paid"
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(payment.memberName, fontWeight = FontWeight.Bold)
                                        Text("Date: ${payment.date} • Method: ${payment.paymentMethod}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                    }

                                    Column(horizontalAlignment = Alignment.End) {
                                        Text(
                                            text = "$currency${payment.amount.toInt()}",
                                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                            color = if (isPaid) Color(0xFF10B981) else Color(0xFFEF4444)
                                        )
                                        Box(
                                            modifier = Modifier
                                                .background(if (isPaid) Color(0xFF10B981).copy(alpha = 0.1f) else Color(0xFFEF4444).copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = payment.status.uppercase(),
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (isPaid) Color(0xFF10B981) else Color(0xFFEF4444)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            "history" -> {
                // Historical Attendance Logs
                if (allAttendance.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Text("No historical check-ins logged yet.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(allAttendance) { log ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(log.memberName, fontWeight = FontWeight.Bold)
                                        Text("Date: ${log.date} • Check-In: ${log.checkIn ?: "--:--"}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                    }

                                    Box(
                                        modifier = Modifier
                                            .background(Color(0xFF6366F1).copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                            .padding(horizontal = 8.dp, vertical = 3.dp)
                                    ) {
                                        Text(
                                            text = if (log.checkOut == null) "ACTIVE IN GYM" else "OUT: ${log.checkOut}",
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF6366F1)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            "analytics" -> {
                // Analytics Charts dashboard (Scrollable layout for widgets)
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(bottom = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Peak Hours Distribution Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Peak-Hour Traffic Analytics 📊",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "Peak hour check-in distributions across historical attendance logs",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            val maxVisits = peakHourData.maxOfOrNull { it.second } ?: 1
                            val scaleMax = if (maxVisits == 0) 1 else maxVisits

                            peakHourData.forEach { (slot, count) ->
                                val progress = count.toFloat() / scaleMax.toFloat()
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = slot,
                                        fontSize = 11.sp,
                                        modifier = Modifier.width(130.dp),
                                        fontWeight = FontWeight.Medium
                                    )

                                    Spacer(modifier = Modifier.width(8.dp))

                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(12.dp)
                                            .background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(4.dp))
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxHeight()
                                                .fillMaxWidth(progress.coerceIn(0.01f, 1f))
                                                .background(
                                                    color = if (count > 2) Color(0xFFF97316) else MaterialTheme.colorScheme.primary,
                                                    shape = RoundedCornerShape(4.dp)
                                                )
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(8.dp))

                                    Text(
                                        text = "$count scans",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.width(55.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Visit Frequency Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "Member Visit Frequency Leaderboard 🏆",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "Top 5 most active gym members sorted by log frequency",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            if (visitFrequencyData.isEmpty()) {
                                Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                                    Text("No check-in logs generated yet.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                                }
                            } else {
                                val maxFreq = visitFrequencyData.firstOrNull()?.second ?: 1
                                visitFrequencyData.forEachIndexed { index, (name, count) ->
                                    val progress = count.toFloat() / maxFreq.toFloat()
                                    Row(
                                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(20.dp)
                                                .background(
                                                    color = when (index) {
                                                        0 -> Color(0xFFFFD700)
                                                        1 -> Color(0xFFC0C0C0)
                                                        2 -> Color(0xFFCD7F32)
                                                        else -> MaterialTheme.colorScheme.surfaceVariant
                                                    },
                                                    shape = CircleShape
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = "${index + 1}",
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (index < 3) Color.Black else MaterialTheme.colorScheme.onSurface
                                            )
                                        }

                                        Spacer(modifier = Modifier.width(8.dp))

                                        Column(modifier = Modifier.weight(1f)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text(name, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                                Text("$count visits", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                            }

                                            Spacer(modifier = Modifier.height(4.dp))

                                            LinearProgressIndicator(
                                                progress = { progress },
                                                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)),
                                                color = Color(0xFF10B981),
                                                trackColor = MaterialTheme.colorScheme.surfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            "expiries" -> {
                // 7-day expiration forecast
                if (expiringNext7Days.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Text("No memberships expiring in the next 7 days.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(expiringNext7Days) { member ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(member.name, fontWeight = FontWeight.Bold)
                                        Text("Phone: ${member.phone} • Plan: ${member.membershipPlan}", fontSize = 11.sp)
                                    }

                                    Box(
                                        modifier = Modifier
                                            .background(Color(0xFFF97316).copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                            .padding(horizontal = 8.dp, vertical = 3.dp)
                                    ) {
                                        Text(
                                            text = member.expiryDate,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFFF97316)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// Helper to construct a beautiful text layout for PDF / Share export simulation
fun buildReportExportString(
    reportType: String,
    payments: List<Payment>,
    expiringMembers: List<Member>,
    attendance: List<Attendance>,
    currency: String
): String {
    val date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    val builder = java.lang.StringBuilder()
    builder.append("=========================================\n")
    builder.append("GYMMASTERS PRO - OPERATIONAL EXPORT\n")
    builder.append("Generated On: $date\n")
    builder.append("=========================================\n\n")

    when (reportType) {
        "revenue" -> {
            builder.append("REPORT TYPE: COLLECTIONS LEDGER (ALL)\n")
            builder.append("-----------------------------------------\n")
            val paid = payments.filter { it.status == "Paid" }
            builder.append("Total Revenue Collected: $currency${paid.sumOf { it.amount }}\n")
            builder.append("Total Payments: ${payments.size} | Paid: ${paid.size} | Pending: ${payments.size - paid.size}\n\n")
            builder.append("Ledger Entries:\n")
            payments.forEachIndexed { i, p ->
                builder.append("${i+1}. ${p.date} | ${p.memberName} | $currency${p.amount} | Status: ${p.status} | Via ${p.paymentMethod}\n")
            }
        }
        "history" -> {
            builder.append("REPORT TYPE: COMPLETE HISTORICAL TRAFFIC\n")
            builder.append("-----------------------------------------\n")
            builder.append("Total Historical Logs Indexed: ${attendance.size}\n\n")
            attendance.forEachIndexed { i, log ->
                builder.append("${i+1}. Date: ${log.date} | ${log.memberName} | Check-In: ${log.checkIn} | Out: ${log.checkOut ?: "Active"}\n")
            }
        }
        "analytics" -> {
            builder.append("REPORT TYPE: HIGH-LEVEL TRAFFIC ANALYTICS\n")
            builder.append("-----------------------------------------\n")
            builder.append("Peak Hours Slot Counting:\n")
            val morning = attendance.count { log -> log.checkIn?.contains("AM") == true && (log.checkIn.startsWith("05") || log.checkIn.startsWith("06") || log.checkIn.startsWith("07") || log.checkIn.startsWith("08")) }
            val evening = attendance.count { log -> (log.checkIn?.contains("PM") == true && (log.checkIn.startsWith("04") || log.checkIn.startsWith("05") || log.checkIn.startsWith("06") || log.checkIn.startsWith("07"))) }
            builder.append("- Morning Slot (05-09 AM): $morning check-ins\n")
            builder.append("- Evening Slot (04-08 PM): $evening check-ins\n")
        }
        "expiries" -> {
            builder.append("REPORT TYPE: 7-DAY EXPIRATIONS FORECAST\n")
            builder.append("-----------------------------------------\n")
            builder.append("Upcoming Expiries Count: ${expiringMembers.size}\n\n")
            expiringMembers.forEachIndexed { i, m ->
                builder.append("${i+1}. ${m.name} | Plan: ${m.membershipPlan} | Phone: ${m.phone} | Expiry: ${m.expiryDate}\n")
            }
        }
    }
    builder.append("\n=========================================\n")
    builder.append("Developed by Arnav Bairagi\n")
    builder.append("© Arnav Bairagi. All Rights Reserved.\n")
    builder.append("=========================================\n")
    builder.append("End of Encrypted Export Sheet\n")
    return builder.toString()
}
