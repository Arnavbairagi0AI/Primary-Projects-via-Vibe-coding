package com.example.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import android.content.ClipboardManager
import android.content.ClipData
import androidx.compose.foundation.border
import java.io.File
import androidx.compose.ui.graphics.toArgb
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.*
import com.example.ui.GymViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.lazy.LazyListState

@Composable
fun StatusBadge(status: String, modifier: Modifier = Modifier) {
    val (emoji, text, color) = when (status) {
        "Paid" -> Triple("🟢", "Paid", Color(0xFF10B981))
        "Pending" -> Triple("🟠", "Pending", Color(0xFFF59E0B))
        "Overdue" -> Triple("🔴", "Overdue", Color(0xFFEF4444))
        else -> Triple("⚪", status, Color.Gray)
    }

    Surface(
        color = color.copy(alpha = 0.08f),
        shape = RoundedCornerShape(20.dp),
        border = BorderStroke(1.dp, color.copy(alpha = 0.25f)),
        modifier = modifier
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = emoji,
                fontSize = 10.sp
            )
            Text(
                text = text,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = color
                ),
                maxLines = 1,
                softWrap = false,
                overflow = TextOverflow.Clip
            )
        }
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
fun SummaryCard(
    title: String,
    value: String,
    icon: ImageVector,
    iconColor: Color,
    trend: String,
    trendColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(4.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = 2.dp
        ),
        border = BorderStroke(0.5.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .background(iconColor.copy(alpha = 0.12f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = iconColor,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }

            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                ),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(5.dp)
                        .background(trendColor, CircleShape)
                )
                Text(
                    text = trend,
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.SemiBold,
                        color = trendColor
                    ),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun SkeletonRow() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)),
        border = BorderStroke(0.5.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f), CircleShape)
            )

            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Box(
                    modifier = Modifier
                        .width(120.dp)
                        .height(14.dp)
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f), RoundedCornerShape(4.dp))
                )
                Box(
                    modifier = Modifier
                        .width(80.dp)
                        .height(10.dp)
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(4.dp))
                )
            }

            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Box(
                    modifier = Modifier
                        .width(60.dp)
                        .height(14.dp)
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f), RoundedCornerShape(4.dp))
                )
                Box(
                    modifier = Modifier
                        .width(50.dp)
                        .height(16.dp)
                        .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
                )
            }
        }
    }
}

fun formatMonthLabel(monthKey: String): String {
    if (monthKey.length < 7) return monthKey
    val year = monthKey.substring(2, 4)
    val monthNum = monthKey.substring(5, 7)
    val monthName = when (monthNum) {
        "01" -> "Jan"
        "02" -> "Feb"
        "03" -> "Mar"
        "04" -> "Apr"
        "05" -> "May"
        "06" -> "Jun"
        "07" -> "Jul"
        "08" -> "Aug"
        "09" -> "Sep"
        "10" -> "Oct"
        "11" -> "Nov"
        "12" -> "Dec"
        else -> monthNum
    }
    return "$monthName '$year"
}

@Composable
fun MonthlyRevenueChart(
    monthlyData: List<Pair<String, Double>>,
    currency: String,
    modifier: Modifier = Modifier
) {
    val maxRevenue = monthlyData.maxOfOrNull { it.second } ?: 1.0
    val maxVal = if (maxRevenue == 0.0) 1.0 else maxRevenue

    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(0.5.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Revenue Trends",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Monthly overview of paid gym receipts",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Icon(
                    imageVector = Icons.Default.BarChart,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
            ) {
                val primaryColor = MaterialTheme.colorScheme.primary
                val secondaryColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.05f)
                val gridColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)
                val labelColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)

                Canvas(modifier = Modifier.fillMaxSize()) {
                    val width = size.width
                    val height = size.height
                    
                    val paddingLeft = 50.dp.toPx()
                    val paddingBottom = 24.dp.toPx()
                    val paddingTop = 12.dp.toPx()
                    val paddingRight = 12.dp.toPx()

                    val chartWidth = width - paddingLeft - paddingRight
                    val chartHeight = height - paddingTop - paddingBottom

                    // Draw grid lines and Y-axis labels
                    val gridLines = 4
                    for (i in 0..gridLines) {
                        val y = paddingTop + chartHeight * (1 - i.toFloat() / gridLines)
                        drawLine(
                            color = gridColor,
                            start = androidx.compose.ui.geometry.Offset(paddingLeft, y),
                            end = androidx.compose.ui.geometry.Offset(width - paddingRight, y),
                            strokeWidth = 1.dp.toPx()
                        )
                        
                        // Y Label
                        val labelVal = (maxVal * i / gridLines).toInt()
                        val labelText = if (labelVal >= 1000) "${labelVal / 1000}k" else "$labelVal"
                        drawContext.canvas.nativeCanvas.drawText(
                            "$currency$labelText",
                            paddingLeft - 10.dp.toPx(),
                            y + 4.dp.toPx(),
                            android.graphics.Paint().apply {
                                color = labelColor.toArgb()
                                textSize = 10.sp.toPx()
                                textAlign = android.graphics.Paint.Align.RIGHT
                                isAntiAlias = true
                            }
                        )
                    }

                    // Draw Bars
                    val barCount = monthlyData.size
                    val spacing = chartWidth / (barCount * 2 + 1)
                    val barWidth = spacing * 1.4f

                    monthlyData.forEachIndexed { index, (monthKey, revenue) ->
                        val barHeight = (revenue / maxVal).toFloat() * chartHeight
                        val x = paddingLeft + spacing + index * (barWidth + spacing)
                        val y = paddingTop + chartHeight - barHeight

                        // Draw background bar track
                        drawRoundRect(
                            color = secondaryColor,
                            topLeft = androidx.compose.ui.geometry.Offset(x, paddingTop),
                            size = androidx.compose.ui.geometry.Size(barWidth, chartHeight),
                            cornerRadius = androidx.compose.ui.geometry.CornerRadius(4.dp.toPx())
                        )

                        // Draw foreground active bar
                        drawRoundRect(
                            color = primaryColor,
                            topLeft = androidx.compose.ui.geometry.Offset(x, y),
                            size = androidx.compose.ui.geometry.Size(barWidth, barHeight),
                            cornerRadius = androidx.compose.ui.geometry.CornerRadius(4.dp.toPx())
                        )

                        // Draw X-axis label (Month)
                        val monthLabel = formatMonthLabel(monthKey)
                        drawContext.canvas.nativeCanvas.drawText(
                            monthLabel,
                            x + barWidth / 2,
                            height - 4.dp.toPx(),
                            android.graphics.Paint().apply {
                                color = labelColor.toArgb()
                                textSize = 9.sp.toPx()
                                textAlign = android.graphics.Paint.Align.CENTER
                                isAntiAlias = true
                            }
                        )
                    }
                }
            }
        }
    }
}

fun exportPaymentsToCsv(context: Context, paymentsList: List<Payment>) {
    val csvHeader = "Payment ID,Member ID,Member Name,Amount,Plan,Method,Date,Status,Transaction ID,Type\n"
    val csvBody = paymentsList.joinToString("\n") { payment ->
        "${payment.paymentId},${payment.memberId},\"${payment.memberName}\",${payment.amount},\"${payment.planName}\",${payment.paymentMethod},${payment.date},${payment.status},${payment.transactionId ?: "N/A"},${payment.type}"
    }
    val csvContent = csvHeader + csvBody

    try {
        val fileName = "payments_export_${System.currentTimeMillis()}.csv"
        val file = File(context.cacheDir, fileName)
        file.writeBytes(csvContent.toByteArray())

        // Get file URI and share it
        val fileUri = androidx.core.content.FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )

        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/csv"
            putExtra(Intent.EXTRA_SUBJECT, "GymMaster Payments Export")
            putExtra(Intent.EXTRA_STREAM, fileUri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Export CSV"))
    } catch (e: Exception) {
        Toast.makeText(context, "Failed to export CSV: ${e.message}", Toast.LENGTH_SHORT).show()
    }
}

fun getDayOfWeek(dateStr: String): Int {
    try {
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
        val date = sdf.parse(dateStr) ?: return 1
        val calendar = java.util.Calendar.getInstance()
        calendar.time = date
        val calDay = calendar.get(java.util.Calendar.DAY_OF_WEEK)
        return when (calDay) {
            java.util.Calendar.MONDAY -> 1
            java.util.Calendar.TUESDAY -> 2
            java.util.Calendar.WEDNESDAY -> 3
            java.util.Calendar.THURSDAY -> 4
            java.util.Calendar.FRIDAY -> 5
            java.util.Calendar.SATURDAY -> 6
            java.util.Calendar.SUNDAY -> 7
            else -> 1
        }
    } catch (e: Exception) {
        return 1
    }
}

@Composable
fun WeeklyRevenueHeatmap(
    payments: List<Payment>,
    currency: String,
    modifier: Modifier = Modifier
) {
    val dailyRevenue = remember(payments) {
        val revenueMap = mutableMapOf(
            1 to 0.0,
            2 to 0.0,
            3 to 0.0,
            4 to 0.0,
            5 to 0.0,
            6 to 0.0,
            7 to 0.0
        )
        
        val paidPayments = payments.filter { it.status.equals("Paid", ignoreCase = true) }
        for (payment in paidPayments) {
            val dayOfWeek = getDayOfWeek(payment.date)
            revenueMap[dayOfWeek] = (revenueMap[dayOfWeek] ?: 0.0) + payment.amount
        }
        revenueMap
    }

    val maxDayRevenue = dailyRevenue.values.maxOfOrNull { it } ?: 1.0
    val maxVal = if (maxDayRevenue == 0.0) 1.0 else maxDayRevenue

    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(0.5.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Weekly Collection Heatmap",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Peak payment days of the week",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            val dayNames = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                dayNames.forEachIndexed { index, name ->
                    val dayNum = index + 1
                    val rev = dailyRevenue[dayNum] ?: 0.0
                    val ratio = (rev / maxVal).toFloat()
                    
                    val baseColor = MaterialTheme.colorScheme.primary
                    val cellColor = if (rev == 0.0) {
                        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.03f)
                    } else {
                        baseColor.copy(alpha = 0.12f + (ratio * 0.88f))
                    }

                    val textColor = if (rev != 0.0 && ratio > 0.4f) {
                        MaterialTheme.colorScheme.onPrimary
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    }

                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .background(cellColor, RoundedCornerShape(8.dp))
                            .border(
                                0.5.dp, 
                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f), 
                                RoundedCornerShape(8.dp)
                            )
                            .padding(vertical = 10.dp, horizontal = 2.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = name,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, fontSize = 9.sp),
                            color = if (rev != 0.0 && ratio > 0.4f) textColor else textColor.copy(alpha = 0.6f)
                        )
                        Text(
                            text = if (rev >= 1000) "${(rev / 1000).toInt()}k" else "${rev.toInt()}",
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.ExtraBold, fontSize = 10.sp),
                            color = textColor
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun BulkNotifyDialog(
    overduePayments: List<Payment>,
    members: List<Member>,
    currency: String,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var activeQueueIndex by remember { mutableStateOf(-1) }

    val totalOverdueCount = overduePayments.size
    val totalOverdueAmount = overduePayments.sumOf { it.amount }.toInt()

    val combinedReportText = remember(overduePayments) {
        "🚨 *OVERDUE GYM PAYMENTS REPORT* 🚨\n\n" +
        overduePayments.joinToString("\n\n") { payment ->
            "• *${payment.memberName}* (ID: ${payment.memberId})\n" +
            "  Plan: ${payment.planName}\n" +
            "  Overdue since: ${payment.date}\n" +
            "  Amount: $currency${payment.amount.toInt()}"
        } + "\n\nTotal Overdue: $currency$totalOverdueAmount"
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Campaign,
                    contentDescription = null,
                    tint = Color(0xFF25D366)
                )
                Text(
                    text = if (activeQueueIndex >= 0) "Bulk Send Queue (${activeQueueIndex + 1}/$totalOverdueCount)" else "Bulk WhatsApp Reminders"
                )
            }
        },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (activeQueueIndex >= 0 && activeQueueIndex < totalOverdueCount) {
                    val currentPayment = overduePayments[activeQueueIndex]
                    val memberObj = members.find { it.memberId == currentPayment.memberId }
                    val phone = memberObj?.phone
                    val cleanPhone = phone?.filter { it.isDigit() } ?: ""
                    val formattedPhone = if (cleanPhone.length == 10) "91$cleanPhone" else cleanPhone
                    val message = "Dear ${currentPayment.memberName}, your gym payment of $currency${currentPayment.amount.toInt()} for the ${currentPayment.planName} plan is overdue since ${currentPayment.date}. Please pay at your earliest convenience to continue your workouts. Thank you!"

                    Text(
                        text = "Automated assistant guides you contact by contact. Click launch to open chat with prefilled message, then app will advance to next contact.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.05f)),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "Current Member:",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = currentPayment.memberName,
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Amount: $currency${currentPayment.amount.toInt()} | Plan: ${currentPayment.planName}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "Phone: ${phone ?: "N/A"}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = message,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(10.dp),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                activeQueueIndex = -1
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Cancel")
                        }

                        Button(
                            onClick = {
                                if (activeQueueIndex + 1 < totalOverdueCount) {
                                    activeQueueIndex++
                                } else {
                                    activeQueueIndex = -1
                                    Toast.makeText(context, "Completed bulk reminders queue!", Toast.LENGTH_SHORT).show()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Skip", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }

                        Button(
                            onClick = {
                                if (formattedPhone.isNotEmpty()) {
                                    val intent = Intent(Intent.ACTION_VIEW).apply {
                                        data = Uri.parse("https://api.whatsapp.com/send?phone=$formattedPhone&text=${Uri.encode(message)}")
                                    }
                                    try {
                                        context.startActivity(intent)
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Could not open WhatsApp", Toast.LENGTH_SHORT).show()
                                    }
                                } else {
                                    Toast.makeText(context, "No phone number available for this member", Toast.LENGTH_SHORT).show()
                                }

                                if (activeQueueIndex + 1 < totalOverdueCount) {
                                    activeQueueIndex++
                                } else {
                                    activeQueueIndex = -1
                                    Toast.makeText(context, "Completed bulk reminders queue!", Toast.LENGTH_SHORT).show()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366)),
                            modifier = Modifier.weight(1.5f)
                        ) {
                            Icon(imageVector = Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Launch")
                        }
                    }
                } else {
                    Text(
                        text = "You have $totalOverdueCount overdue payments. Choose an action below for bulk notification.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = {
                                activeQueueIndex = 0
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Start Send Queue", fontSize = 11.sp, maxLines = 1)
                        }

                        Button(
                            onClick = {
                                val sendIntent: Intent = Intent().apply {
                                    action = Intent.ACTION_SEND
                                    putExtra(Intent.EXTRA_TEXT, combinedReportText)
                                    type = "text/plain"
                                    setPackage("com.whatsapp")
                                }
                                try {
                                    context.startActivity(sendIntent)
                                } catch (e: Exception) {
                                    // Fallback to chooser if WhatsApp package not found directly
                                    val chooser = Intent.createChooser(Intent().apply {
                                        action = Intent.ACTION_SEND
                                        putExtra(Intent.EXTRA_TEXT, combinedReportText)
                                        type = "text/plain"
                                    }, "Share Overdue Report")
                                    context.startActivity(chooser)
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366)),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Share via WhatsApp", fontSize = 11.sp, maxLines = 1)
                        }
                    }

                    OutlinedButton(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("GymMaster Overdue Summary", combinedReportText)
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "Report copied to clipboard!", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Copy Combined Summary Text")
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))

                    Text(
                        text = "Or notify individual members below:",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Box(modifier = Modifier.heightIn(max = 240.dp)) {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(overduePayments) { payment ->
                                val memberObj = members.find { it.memberId == payment.memberId }
                                val phone = memberObj?.phone
                                val cleanPhone = phone?.filter { it.isDigit() } ?: ""
                                val formattedPhone = if (cleanPhone.length == 10) "91$cleanPhone" else cleanPhone
                                val message = "Dear ${payment.memberName}, your gym payment of $currency${payment.amount.toInt()} for the ${payment.planName} plan is overdue since ${payment.date}. Please pay at your earliest convenience to continue your workouts. Thank you!"

                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                                        .padding(8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = payment.memberName,
                                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Text(
                                            text = "Overdue: $currency${payment.amount.toInt()} (${payment.date})",
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.error
                                        )
                                    }

                                    IconButton(
                                        onClick = {
                                            if (formattedPhone.isNotEmpty()) {
                                                val intent = Intent(Intent.ACTION_VIEW).apply {
                                                    data = Uri.parse("https://api.whatsapp.com/send?phone=$formattedPhone&text=${Uri.encode(message)}")
                                                }
                                                try {
                                                    context.startActivity(intent)
                                                } catch (e: Exception) {
                                                    Toast.makeText(context, "Could not open WhatsApp", Toast.LENGTH_SHORT).show()
                                                }
                                            } else {
                                                Toast.makeText(context, "No phone number available", Toast.LENGTH_SHORT).show()
                                            }
                                        },
                                        modifier = Modifier
                                            .size(36.dp)
                                            .background(Color(0xFF25D366).copy(alpha = 0.15f), CircleShape)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Send,
                                            contentDescription = "Send WhatsApp",
                                            tint = Color(0xFF25D366),
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

@Composable
fun PaymentItemRow(
    payment: Payment,
    currency: String,
    todayDate: String,
    currentUserRole: String?,
    memberPhone: String? = null,
    onClick: () -> Unit,
    onDelete: () -> Unit,
    onToggleStatus: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }

    val computedStatus = if (payment.status.equals("Paid", ignoreCase = true)) "Paid"
                         else if (payment.date < todayDate) "Overdue"
                         else "Pending"

    val colors = listOf(Color(0xFF3B82F6), Color(0xFF10B981), Color(0xFFF59E0B), Color(0xFFEC4899), Color(0xFF8B5CF6))
    val avatarBgColor = colors[Math.abs(payment.memberName.hashCode()) % colors.size]
    val initials = payment.memberName.split(" ")
        .mapNotNull { it.firstOrNull()?.toString() }
        .take(2)
        .joinToString("")
        .uppercase()

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        border = BorderStroke(0.5.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(avatarBgColor.copy(alpha = 0.15f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = initials,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = avatarBgColor
                    )
                )
            }

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = payment.memberName,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                    
                    Text(
                        text = "$currency${payment.amount.toInt()}",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "ID: ${payment.memberId} • ${payment.planName}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false)
                    )

                    Text(
                        text = payment.date,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        maxLines = 1
                    )
                }

                Spacer(modifier = Modifier.height(2.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        StatusBadge(status = computedStatus)
                        
                        Box(
                            modifier = Modifier
                                .background(
                                    color = if (payment.type == "new") Color(0xFF6366F1).copy(alpha = 0.12f) else Color(0xFFEC4899).copy(alpha = 0.12f),
                                    shape = RoundedCornerShape(4.dp)
                                )
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = payment.type.uppercase(),
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (payment.type == "new") Color(0xFF6366F1) else Color(0xFFEC4899)
                            )
                        }

                        if (computedStatus == "Overdue") {
                            val context = LocalContext.current
                            val cleanPhone = memberPhone?.filter { it.isDigit() } ?: ""
                            val formattedPhone = if (cleanPhone.length == 10) "91$cleanPhone" else cleanPhone
                            val message = "Dear ${payment.memberName}, your gym payment of $currency${payment.amount.toInt()} for the ${payment.planName} plan is overdue since ${payment.date}. Please pay at your earliest convenience to continue your workouts. Thank you!"

                            OutlinedButton(
                                onClick = {
                                    if (formattedPhone.isNotEmpty()) {
                                        val intent = Intent(Intent.ACTION_VIEW).apply {
                                            data = Uri.parse("https://api.whatsapp.com/send?phone=$formattedPhone&text=${Uri.encode(message)}")
                                        }
                                        try {
                                            context.startActivity(intent)
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Could not open WhatsApp", Toast.LENGTH_SHORT).show()
                                        }
                                    } else {
                                        Toast.makeText(context, "No phone number available for this member", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                border = BorderStroke(1.dp, Color(0xFF25D366)),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF25D366)),
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                                modifier = Modifier.height(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.NotificationsActive,
                                    contentDescription = "Notify via WhatsApp",
                                    modifier = Modifier.size(12.dp),
                                    tint = Color(0xFF25D366)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Notify", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        val toggleText = if (computedStatus == "Paid") "Mark Pending" else "Mark Paid"
                        val toggleIcon = if (computedStatus == "Paid") Icons.Default.HourglassTop else Icons.Default.Check
                        val toggleColor = if (computedStatus == "Paid") Color(0xFFF59E0B) else Color(0xFF10B981)

                        OutlinedButton(
                            onClick = onToggleStatus,
                            border = BorderStroke(1.dp, toggleColor.copy(alpha = 0.5f)),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = toggleColor),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                            modifier = Modifier.height(28.dp)
                        ) {
                            Icon(
                                imageVector = toggleIcon,
                                contentDescription = toggleText,
                                modifier = Modifier.size(12.dp),
                                tint = toggleColor
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(toggleText, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Box {
                        IconButton(
                            onClick = { showMenu = true },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.MoreVert,
                                contentDescription = "Action Menu",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        DropdownMenu(
                            expanded = showMenu,
                            onDismissRequest = { showMenu = false }
                        ) {
                            DropdownMenuItem(
                                text = { Text("View Receipt") },
                                leadingIcon = { Icon(Icons.Default.Receipt, contentDescription = null, modifier = Modifier.size(16.dp)) },
                                onClick = {
                                    showMenu = false
                                    onClick()
                                }
                            )
                            DropdownMenuItem(
                                text = { Text(if (computedStatus == "Paid") "Mark as Pending" else "Mark as Paid") },
                                leadingIcon = { 
                                    Icon(
                                        imageVector = if (computedStatus == "Paid") Icons.Default.HourglassTop else Icons.Default.Check, 
                                        contentDescription = null, 
                                        modifier = Modifier.size(16.dp)
                                    ) 
                                },
                                onClick = {
                                    showMenu = false
                                    onToggleStatus()
                                }
                            )
                            if (currentUserRole == "owner") {
                                HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                                DropdownMenuItem(
                                    text = { Text("Delete Log", color = MaterialTheme.colorScheme.error) },
                                    leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(16.dp)) },
                                    onClick = {
                                        showMenu = false
                                        onDelete()
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentsScreen(viewModel: GymViewModel) {
    val payments by viewModel.firestorePaymentsState.collectAsState()
    val members by viewModel.allMembers.collectAsState()
    val plans by viewModel.allPlans.collectAsState()
    val settings by viewModel.settings.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    val currency = settings?.currency ?: "₹"
    val todayDate = viewModel.todayDate
    val currentMonthPrefix = todayDate.take(7)

    // Selection States
    var showAddBottomSheet by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf<Payment?>(null) }
    var selectedPaymentDetail by remember { mutableStateOf<Payment?>(null) }

    // Search and Sort
    var searchQuery by remember { mutableStateOf("") }
    val debouncedSearchQuery by produceState(initialValue = "") {
        snapshotFlow { searchQuery }
            .collectLatest {
                delay(300)
                value = it
            }
    }
    var selectedSortOption by remember { mutableStateOf("Newest") }

    // Filter Chips
    var quickFilter by remember { mutableStateOf("All") }
    var customStartDate by remember { mutableStateOf<String?>(null) }
    var customEndDate by remember { mutableStateOf<String?>(null) }
    var showCustomDatePickerDialog by remember { mutableStateOf(false) }
    var showBulkNotifyDialog by remember { mutableStateOf(false) }

    // Skeleton loader state
    var isLoadingState by remember { mutableStateOf(true) }
    LaunchedEffect(payments) {
        if (payments.isNotEmpty() || viewModel.allPayments.value.isNotEmpty()) {
            isLoadingState = false
        } else {
            delay(800)
            isLoadingState = false
        }
    }

    // Dynamic counts
    val allCount = payments.size
    val paidCount = payments.count { it.status.equals("Paid", ignoreCase = true) }
    val overdueCount = payments.count { !it.status.equals("Paid", ignoreCase = true) && it.date < todayDate }
    val pendingCount = payments.count { !it.status.equals("Paid", ignoreCase = true) && it.date >= todayDate }
    val todayCount = payments.count { it.date == todayDate }
    val monthCount = payments.count { it.date.startsWith(currentMonthPrefix) }
    val customCount = remember(payments, customStartDate, customEndDate) {
        payments.count { customStartDate != null && customEndDate != null && it.date >= customStartDate!! && it.date <= customEndDate!! }
    }

    // Calculations directly from Firestore list
    val totalRevenue = remember(payments) {
        payments.filter { it.status.equals("Paid", ignoreCase = true) }.sumOf { it.amount }
    }
    val totalOutstanding = remember(payments) {
        payments.filter { !it.status.equals("Paid", ignoreCase = true) && it.date < todayDate }.sumOf { it.amount }
    }
    val totalPending = remember(payments) {
        payments.filter { !it.status.equals("Paid", ignoreCase = true) && it.date >= todayDate }.sumOf { it.amount }
    }

    val monthlyRevenueData = remember(payments) {
        val paidPayments = payments.filter { it.status.equals("Paid", ignoreCase = true) }
        val grouped = paidPayments.groupBy { it.date.take(7) }
        val months = grouped.keys.sorted().takeLast(6)
        if (months.isEmpty()) {
            val currentMonth = todayDate.take(7)
            listOf(currentMonth to 0.0)
        } else {
            months.map { month ->
                val total = grouped[month]?.sumOf { it.amount } ?: 0.0
                month to total
            }
        }
    }

    // Processed Payments list (Filter + Search + Sort)
    val processedPayments = remember(payments, quickFilter, debouncedSearchQuery, selectedSortOption, customStartDate, customEndDate, members) {
        var list = payments.filter { payment ->
            val computedStatus = if (payment.status.equals("Paid", ignoreCase = true)) "Paid"
                                 else if (payment.date < todayDate) "Overdue"
                                 else "Pending"

            when (quickFilter) {
                "All" -> true
                "Paid" -> computedStatus == "Paid"
                "Pending" -> computedStatus == "Pending"
                "Overdue" -> computedStatus == "Overdue"
                "Today" -> payment.date == todayDate
                "This Month" -> payment.date.startsWith(currentMonthPrefix)
                "Custom Date" -> {
                    customStartDate != null && customEndDate != null &&
                    payment.date >= customStartDate!! && payment.date <= customEndDate!!
                }
                else -> true
            }
        }

        // Search logic
        if (debouncedSearchQuery.isNotBlank()) {
            list = list.filter { payment ->
                val memberObj = members.find { it.memberId == payment.memberId }
                val phoneMatch = memberObj?.phone?.contains(debouncedSearchQuery) ?: false
                payment.memberName.contains(debouncedSearchQuery, ignoreCase = true) ||
                payment.memberId.contains(debouncedSearchQuery, ignoreCase = true) ||
                payment.transactionId?.contains(debouncedSearchQuery, ignoreCase = true) == true ||
                payment.paymentId.toString().contains(debouncedSearchQuery, ignoreCase = true) ||
                phoneMatch
            }
        }

        // Sorting logic
        when (selectedSortOption) {
            "Newest" -> list.sortedByDescending { it.date }
            "Oldest" -> list.sortedBy { it.date }
            "Highest Amount" -> list.sortedByDescending { it.amount }
            "Lowest Amount" -> list.sortedBy { it.amount }
            "Pending First" -> list.sortedWith(compareBy<Payment> { it.status.equals("Paid", ignoreCase = true) }.thenByDescending { it.date })
            "Paid First" -> list.sortedWith(compareByDescending<Payment> { it.status.equals("Paid", ignoreCase = true) }.thenByDescending { it.date })
            else -> list
        }
    }

    val lazyListState = rememberLazyListState()
    var isFabVisible by remember { mutableStateOf(true) }
    var previousIndex by remember { mutableStateOf(0) }
    var previousScrollOffset by remember { mutableStateOf(0) }

    LaunchedEffect(lazyListState.firstVisibleItemIndex, lazyListState.firstVisibleItemScrollOffset) {
        val currentIndex = lazyListState.firstVisibleItemIndex
        val currentOffset = lazyListState.firstVisibleItemScrollOffset
        if (currentIndex > previousIndex) {
            isFabVisible = false
        } else if (currentIndex < previousIndex) {
            isFabVisible = true
        } else {
            if (currentOffset > previousScrollOffset + 10) {
                isFabVisible = false
            } else if (currentOffset < previousScrollOffset - 10) {
                isFabVisible = true
            }
        }
        previousIndex = currentIndex
        previousScrollOffset = currentOffset
    }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            state = lazyListState,
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // --- HEADER SECTION (Administrator, logout button only, no avatar) ---
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Hello,",
                            style = MaterialTheme.typography.bodyLarge.copy(
                                fontWeight = FontWeight.Normal,
                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                            )
                        )
                        Text(
                            text = currentUser?.name ?: "Administrator",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Administrator",
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        )
                    }

                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        val context = LocalContext.current
                        IconButton(
                            onClick = {
                                exportPaymentsToCsv(context, processedPayments)
                            },
                            modifier = Modifier
                                .size(40.dp)
                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Download,
                                contentDescription = "Download CSV",
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }

                        val overduePaymentsList = payments.filter { !it.status.equals("Paid", ignoreCase = true) && it.date < todayDate }
                        IconButton(
                            onClick = {
                                if (overduePaymentsList.isNotEmpty()) {
                                    showBulkNotifyDialog = true
                                } else {
                                    Toast.makeText(context, "No overdue payments to notify", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier
                                .size(40.dp)
                                .background(Color(0xFF25D366).copy(alpha = 0.15f), CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Campaign,
                                contentDescription = "Bulk Notify Overdue Members",
                                tint = Color(0xFF25D366)
                            )
                        }

                        IconButton(
                            onClick = { viewModel.logout() },
                            modifier = Modifier
                                .size(40.dp)
                                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.ExitToApp,
                                contentDescription = "Logout",
                                tint = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
            }

            // --- FINANCIAL SUMMARY SECTION (Responsive 2x2 cards) ---
            item {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.fillMaxWidth()) {
                        SummaryCard(
                            title = "Total Revenue",
                            value = "$currency${totalRevenue.toInt()}",
                            icon = Icons.Default.TrendingUp,
                            iconColor = Color(0xFF10B981),
                            trend = "Paid = $paidCount",
                            trendColor = Color(0xFF10B981),
                            modifier = Modifier.weight(1f)
                        )
                        SummaryCard(
                            title = "Outstanding Balance",
                            value = "$currency${totalOutstanding.toInt()}",
                            icon = Icons.Default.Warning,
                            iconColor = Color(0xFFEF4444),
                            trend = "Outstanding = $currency${totalOutstanding.toInt()}",
                            trendColor = Color(0xFFEF4444),
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Row(modifier = Modifier.fillMaxWidth()) {
                        SummaryCard(
                            title = "Pending Payments",
                            value = "$pendingCount",
                            icon = Icons.Default.HourglassTop,
                            iconColor = Color(0xFFF59E0B),
                            trend = "Pending = $pendingCount",
                            trendColor = Color(0xFFF59E0B),
                            modifier = Modifier.weight(1f)
                        )
                        SummaryCard(
                            title = "Payments Received",
                            value = "$paidCount",
                            icon = Icons.Default.CheckCircle,
                            iconColor = Color(0xFF10B981),
                            trend = "Paid = $paidCount",
                            trendColor = Color(0xFF10B981),
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // --- REVENUE TRENDS CHART ---
            item {
                MonthlyRevenueChart(
                    monthlyData = monthlyRevenueData,
                    currency = currency,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // --- WEEKLY REVENUE HEATMAP ---
            item {
                WeeklyRevenueHeatmap(
                    payments = payments,
                    currency = currency,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // --- SEARCH BAR (Full Width, M3 style) ---
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by Name, Member ID, Phone, Txn ID...", maxLines = 1, overflow = TextOverflow.Ellipsis) },
                    leadingIcon = { Icon(imageVector = Icons.Default.Search, contentDescription = "Search") },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(imageVector = Icons.Default.Clear, contentDescription = "Clear")
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .testTag("payments_search_bar"),
                    shape = RoundedCornerShape(20.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f),
                        focusedContainerColor = MaterialTheme.colorScheme.surface,
                        unfocusedContainerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }

            // --- FILTERS & SORT ROW (Pill style, horizontally scrollable) ---
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Sort Dropdown Trigger Chip as a Pill
                    var expandedSortMenu by remember { mutableStateOf(false) }
                    Box {
                        FilterChip(
                            selected = selectedSortOption != "Newest",
                            onClick = { expandedSortMenu = true },
                            label = {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(imageVector = Icons.Default.Sort, contentDescription = "Sort", modifier = Modifier.size(16.dp))
                                    Text(selectedSortOption)
                                    Icon(imageVector = Icons.Default.ArrowDropDown, contentDescription = null, modifier = Modifier.size(16.dp))
                                }
                            },
                            shape = CircleShape,
                            modifier = Modifier.height(36.dp),
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                                selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        )
                        DropdownMenu(
                            expanded = expandedSortMenu,
                            onDismissRequest = { expandedSortMenu = false }
                        ) {
                            val sortOptions = listOf("Newest", "Oldest", "Highest Amount", "Lowest Amount", "Pending First", "Paid First")
                            sortOptions.forEach { option ->
                                DropdownMenuItem(
                                    text = { Text(option) },
                                    onClick = {
                                        selectedSortOption = option
                                        expandedSortMenu = false
                                    }
                                )
                            }
                        }
                    }

                    Box(modifier = Modifier.width(1.dp).height(24.dp).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)))

                    // Quick Filter Chips
                    val filterOptions = listOf(
                        "All" to "🔍 All ($allCount)",
                        "Paid" to "🟢 Paid ($paidCount)",
                        "Pending" to "🟠 Pending ($pendingCount)",
                        "Overdue" to "🔴 Overdue ($overdueCount)",
                        "Today" to "📅 Today ($todayCount)",
                        "This Month" to "🗓️ Month ($monthCount)",
                        "Custom Date" to "📅 Custom (${if (customStartDate != null) customCount else 0})"
                    )

                    filterOptions.forEach { (filterKey, filterLabel) ->
                        val isSelected = quickFilter == filterKey
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                if (filterKey == "Custom Date") {
                                    showCustomDatePickerDialog = true
                                } else {
                                    quickFilter = filterKey
                                }
                            },
                            label = {
                                Text(
                                    text = filterLabel,
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                    ),
                                    softWrap = false
                                )
                            },
                            shape = CircleShape,
                            modifier = Modifier.height(36.dp),
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                                selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        )
                    }
                }
            }

            // --- PAYMENTS LIST / EMPTY STATE / SKELETONS ---
            if (isLoadingState) {
                items(5) {
                    SkeletonRow()
                }
            } else if (payments.isEmpty()) {
                // Modern Empty State (Absolute Empty Firestore)
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 48.dp, horizontal = 24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(90.dp)
                                    .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Payments,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(48.dp)
                                )
                            }

                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = "No Payment Records Yet",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = "Payments recorded for members will appear here.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }

                            Button(
                                onClick = { showAddBottomSheet = true },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(imageVector = Icons.Default.Add, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("+ Record First Payment", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            } else if (processedPayments.isEmpty()) {
                // No matching search/filter results
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 80.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.CreditCardOff,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "No payments match selected filters",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                            )
                        }
                    }
                }
            } else {
                items(processedPayments) { payment ->
                    val memberObj = members.find { it.memberId == payment.memberId }
                    val memberPhone = memberObj?.phone
                    PaymentItemRow(
                        payment = payment,
                        currency = currency,
                        todayDate = todayDate,
                        currentUserRole = currentUser?.role,
                        memberPhone = memberPhone,
                        onClick = { selectedPaymentDetail = payment },
                        onDelete = { showDeleteConfirm = payment },
                        onToggleStatus = {
                            val newStatus = if (payment.status.equals("Paid", ignoreCase = true)) "Pending" else "Paid"
                            viewModel.addPayment(payment.copy(status = newStatus))
                        }
                    )
                }
            }
        }

        // --- FLOATING ACTION BUTTON ("+") IN THE BOTTOM RIGHT ---
        if (currentUser?.role != "trainer") {
            AnimatedVisibility(
                visible = isFabVisible,
                enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
                exit = slideOutVertically(targetOffsetY = { it }) + fadeOut(),
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(16.dp)
            ) {
                FloatingActionButton(
                    onClick = { showAddBottomSheet = true },
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary,
                    shape = CircleShape,
                    modifier = Modifier.testTag("floating_add_payment_btn")
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = "Record Payment")
                }
            }
        }
    }

    // --- CUSTOM DATE RANGE DIALOG ---
    if (showCustomDatePickerDialog) {
        var startInput by remember { mutableStateOf(customStartDate ?: todayDate) }
        var endInput by remember { mutableStateOf(customEndDate ?: todayDate) }

        AlertDialog(
            onDismissRequest = { showCustomDatePickerDialog = false },
            title = { Text("Select Date Range", fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = startInput,
                        onValueChange = { startInput = it },
                        label = { Text("Start Date (YYYY-MM-DD)") },
                        placeholder = { Text("e.g. 2026-07-01") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = endInput,
                        onValueChange = { endInput = it },
                        label = { Text("End Date (YYYY-MM-DD)") },
                        placeholder = { Text("e.g. 2026-07-14") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        customStartDate = startInput
                        customEndDate = endInput
                        quickFilter = "Custom Date"
                        showCustomDatePickerDialog = false
                    }
                ) {
                    Text("Apply Range")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showCustomDatePickerDialog = false
                    }
                ) {
                    Text("Cancel")
                }
            }
        )
    }

    // --- RECORD PAYMENT BOTTOM SHEET ---
    if (showAddBottomSheet) {
        var selectedMember by remember { mutableStateOf(members.firstOrNull()) }
        var selectedPlan by remember { mutableStateOf(plans.firstOrNull()) }
        var amountStr by remember { mutableStateOf(selectedPlan?.price?.toString() ?: "1999") }
        var selectedMethod by remember { mutableStateOf("UPI") }
        var paymentStatus by remember { mutableStateOf("Paid") }
        var paymentType by remember { mutableStateOf("renewal") }
        var dateStr by remember { mutableStateOf(todayDate) }
        var notesStr by remember { mutableStateOf("") }

        LaunchedEffect(selectedMember) {
            val matchedPlan = plans.find { it.name == selectedMember?.membershipPlan }
            if (matchedPlan != null) {
                selectedPlan = matchedPlan
                amountStr = matchedPlan.price.toString()
            }
        }

        ModalBottomSheet(
            onDismissRequest = { showAddBottomSheet = false },
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            containerColor = MaterialTheme.colorScheme.surface,
            dragHandle = { BottomSheetDefaults.DragHandle() }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 8.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = "Record Payment",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.primary
                )

                if (members.isEmpty()) {
                    Text("No members registered. Please add members first.")
                } else {
                    // Searchable Payer Member Selector
                    var isMemberSelectorExpanded by remember { mutableStateOf(false) }
                    var memberSearchQuery by remember { mutableStateOf("") }

                    Text("Select Payer Member *", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                    
                    OutlinedCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { isMemberSelectorExpanded = !isMemberSelectorExpanded },
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(selectedMember?.name ?: "No member selected", fontWeight = FontWeight.Bold)
                                Text("ID: ${selectedMember?.memberId ?: "N/A"}", style = MaterialTheme.typography.bodySmall)
                            }
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                        }
                    }

                    if (isMemberSelectorExpanded) {
                        OutlinedTextField(
                            value = memberSearchQuery,
                            onValueChange = { memberSearchQuery = it },
                            placeholder = { Text("Search members by name or ID...") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) }
                        )
                        
                        val filteredDropdownMembers = members.filter {
                            it.name.contains(memberSearchQuery, ignoreCase = true) ||
                            it.memberId.contains(memberSearchQuery, ignoreCase = true)
                        }

                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 160.dp),
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                        ) {
                            LazyColumn(modifier = Modifier.fillMaxWidth()) {
                                items(filteredDropdownMembers) { member ->
                                    DropdownMenuItem(
                                        text = { Text("${member.name} (${member.memberId})") },
                                        onClick = {
                                            selectedMember = member
                                            isMemberSelectorExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Select Plan Context
                    var isPlanExpanded by remember { mutableStateOf(false) }
                    Text("Select Plan Context", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
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
                                Text(selectedPlan?.name ?: "Select Plan")
                                Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                            }
                        }
                        DropdownMenu(
                            expanded = isPlanExpanded,
                            onDismissRequest = { isPlanExpanded = false },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            plans.forEach { plan ->
                                DropdownMenuItem(
                                    text = { Text("${plan.name} - $currency${plan.price}") },
                                    onClick = {
                                        selectedPlan = plan
                                        amountStr = plan.price.toString()
                                        isPlanExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Amount Text Field
                    OutlinedTextField(
                        value = amountStr,
                        onValueChange = { amountStr = it },
                        label = { Text("Amount ($currency) *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )

                    // Payment Method Selection Chips
                    Text("Payment Method *", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("UPI", "Cash", "Card").forEach { method ->
                            val isSelected = selectedMethod == method
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedMethod = method },
                                label = { Text(method) },
                                shape = RoundedCornerShape(8.dp)
                            )
                        }
                    }

                    // Payment Date Field
                    OutlinedTextField(
                        value = dateStr,
                        onValueChange = { dateStr = it },
                        label = { Text("Date (YYYY-MM-DD) *") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )

                    // Notes Field
                    OutlinedTextField(
                        value = notesStr,
                        onValueChange = { notesStr = it },
                        label = { Text("Notes / Remarks (Optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp)
                    )

                    // Status Selection Chips
                    Text("Status *", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        listOf("Paid", "Pending", "Overdue").forEach { status ->
                            val isSelected = paymentStatus == status
                            FilterChip(
                                selected = isSelected,
                                onClick = { paymentStatus = status },
                                label = { Text(status) },
                                shape = RoundedCornerShape(8.dp)
                            )
                        }
                    }

                    // Action buttons
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedButton(
                            onClick = { showAddBottomSheet = false },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Cancel")
                        }

                        Button(
                            onClick = {
                                val member = selectedMember
                                if (member != null && amountStr.isNotBlank()) {
                                    val newPayment = Payment(
                                        memberId = member.memberId,
                                        memberName = member.name,
                                        amount = amountStr.toDoubleOrNull() ?: 1999.0,
                                        paymentMethod = selectedMethod,
                                        date = dateStr,
                                        planName = selectedPlan?.name ?: member.membershipPlan,
                                        status = paymentStatus,
                                        transactionId = "TXN-" + System.currentTimeMillis().toString().takeLast(6),
                                        type = paymentType
                                    )
                                    viewModel.addPayment(newPayment)
                                    showAddBottomSheet = false
                                } else {
                                    viewModel.showFeedback("Please fill mandatory details")
                                }
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            enabled = selectedMember != null
                        ) {
                            Text("Save", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }

    // --- DELETE CONFIRMATION DIALOG ---
    if (showDeleteConfirm != null) {
        val payment = showDeleteConfirm!!
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = null },
            title = { Text("Delete Payment Log?", fontWeight = FontWeight.Bold) },
            text = { Text("Are you absolutely sure you want to delete this payment log of $currency${payment.amount} by ${payment.memberName}? This will alter revenue calculations.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deletePayment(payment.paymentId)
                        showDeleteConfirm = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Confirm Delete", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = null }) {
                    Text("Cancel")
                }
            },
            shape = RoundedCornerShape(16.dp)
        )
    }

    // --- DETAILED INVOICE RECEIPT DIALOG ---
    if (selectedPaymentDetail != null) {
        val payment = selectedPaymentDetail!!
        val context = LocalContext.current
        val computedStatus = if (payment.status.equals("Paid", ignoreCase = true)) "Paid"
                             else if (payment.date < todayDate) "Overdue"
                             else "Pending"

        AlertDialog(
            onDismissRequest = { selectedPaymentDetail = null },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.ReceiptLong,
                        contentDescription = "Invoice",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text("Payment Receipt", fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = when (computedStatus) {
                                "Paid" -> Color(0xFF10B981).copy(alpha = 0.08f)
                                "Pending" -> Color(0xFFF59E0B).copy(alpha = 0.08f)
                                else -> Color(0xFFEF4444).copy(alpha = 0.08f)
                            }
                        ),
                        border = BorderStroke(
                            1.dp,
                            when (computedStatus) {
                                "Paid" -> Color(0xFF10B981).copy(alpha = 0.2f)
                                "Pending" -> Color(0xFFF59E0B).copy(alpha = 0.2f)
                                else -> Color(0xFFEF4444).copy(alpha = 0.2f)
                            }
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "Transaction Status",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            StatusBadge(status = computedStatus)
                        }
                    }

                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Billing Information",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.primary
                        )
                        HorizontalDivider(thickness = 1.dp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))

                        DetailRow(label = "Payer Member", value = payment.memberName)
                        DetailRow(label = "Member ID", value = payment.memberId)
                        DetailRow(label = "Membership Plan", value = payment.planName)
                        DetailRow(label = "Transaction Type", value = payment.type.uppercase())
                        DetailRow(label = "Logged Date", value = payment.date)
                    }

                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Transaction Details",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.primary
                        )
                        HorizontalDivider(thickness = 1.dp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))

                        DetailRow(label = "Payment Method", value = payment.paymentMethod)
                        DetailRow(label = "Transaction ID", value = payment.transactionId ?: "N/A")

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Total Charged",
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = "$currency${payment.amount.toInt()}",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                val clip = android.content.ClipData.newPlainText("Transaction ID", payment.transactionId ?: "")
                                clipboard.setPrimaryClip(clip)
                                android.widget.Toast.makeText(context, "Copied Transaction ID to Clipboard", android.widget.Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(imageVector = Icons.Filled.ContentCopy, contentDescription = "Copy", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Copy ID", fontSize = 12.sp)
                        }

                        Button(
                            onClick = {
                                android.widget.Toast.makeText(context, "Receipt shared successfully!", android.widget.Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(imageVector = Icons.Filled.Share, contentDescription = "Share", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Share", fontSize = 12.sp)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { selectedPaymentDetail = null }) {
                    Text("Close")
                }
            },
            shape = RoundedCornerShape(16.dp)
        )
    }

    if (showBulkNotifyDialog) {
        val overduePayments = payments.filter { !it.status.equals("Paid", ignoreCase = true) && it.date < todayDate }
        BulkNotifyDialog(
            overduePayments = overduePayments,
            members = members,
            currency = currency,
            onDismiss = { showBulkNotifyDialog = false }
        )
    }
}
