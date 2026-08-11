package com.example.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.IncidentReportEntity
import com.example.ui.RescueViewModel
import com.example.ui.theme.*

@Composable
fun ReportsScreen(
    viewModel: RescueViewModel
) {
    val context = LocalContext.current
    val reports by viewModel.incidentReports.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(RescueBackground)
            .padding(16.dp)
            .testTag("reports_screen")
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            // Screen Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Disaster Reports Feed",
                        style = MaterialTheme.typography.titleLarge,
                        color = Color.White
                    )
                    Text(
                        text = "Real-time verified reports from rescue nodes and local citizens",
                        style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                        color = RescueOnSurfaceVariant
                    )
                }

                Surface(
                    color = RescueSurfaceContainerHigh,
                    shape = CircleShape
                ) {
                    Text(
                        text = "${reports.size} Reports",
                        style = MaterialTheme.typography.labelMedium,
                        color = RescuePrimary,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }

            // Reports List
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(reports) { report ->
                    ReportCard(report = report)
                }
            }
        }

        // Floating Action Button to File New Report
        FloatingActionButton(
            onClick = { showAddDialog = true },
            containerColor = RescuePrimaryContainer,
            contentColor = RescueOnPrimaryContainer,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(bottom = 16.dp, end = 16.dp)
                .testTag("add_report_fab")
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.AddAlert, contentDescription = "New Report")
                Text("Report Incident", style = MaterialTheme.typography.titleMedium.copy(fontSize = 14.sp))
            }
        }
    }

    // Add Incident Report Dialog
    if (showAddDialog) {
        var title by remember { mutableStateOf("") }
        var category by remember { mutableStateOf("Flood") }
        var severity by remember { mutableStateOf("HIGH") }
        var location by remember { mutableStateOf("124 Oakwood Ave") }
        var description by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("File Emergency Report", color = Color.White) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Incident Title (e.g., Tree Blocking Road)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = location,
                        onValueChange = { location = it },
                        label = { Text("Location / Address") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = severity == "HIGH",
                            onClick = { severity = "HIGH" },
                            label = { Text("HIGH") },
                            colors = FilterChipDefaults.filterChipColors(selectedContainerColor = RescueErrorContainer)
                        )
                        FilterChip(
                            selected = severity == "MEDIUM",
                            onClick = { severity = "MEDIUM" },
                            label = { Text("MEDIUM") },
                            colors = FilterChipDefaults.filterChipColors(selectedContainerColor = RescueTertiaryContainer)
                        )
                        FilterChip(
                            selected = severity == "LOW",
                            onClick = { severity = "LOW" },
                            label = { Text("LOW") },
                            colors = FilterChipDefaults.filterChipColors(selectedContainerColor = RescuePrimaryContainer)
                        )
                    }

                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Description & Notes") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (title.isNotBlank()) {
                            viewModel.addIncidentReport(
                                title = title,
                                category = category,
                                severity = severity,
                                location = location,
                                description = description.ifBlank { "Report submitted via RescueAI citizen network." }
                            )
                            Toast.makeText(context, "Incident Report Submitted!", Toast.LENGTH_SHORT).show()
                            showAddDialog = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RescuePrimaryContainer)
                ) {
                    Text("SUBMIT REPORT")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("CANCEL", color = RescueOnSurfaceVariant)
                }
            },
            containerColor = RescueSurfaceContainerHigh
        )
    }
}

@Composable
fun ReportCard(report: IncidentReportEntity) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(18.dp)),
        colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.85f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = when (report.category) {
                            "Flood" -> Icons.Default.Water
                            "Power Outage" -> Icons.Default.Bolt
                            "Road Blocked" -> Icons.Default.Block
                            else -> Icons.Default.Warning
                        },
                        contentDescription = report.category,
                        tint = if (report.severity == "HIGH") RescueError else RescueTertiary,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "${report.category.uppercase()} • ${report.distance}",
                        style = MaterialTheme.typography.labelMedium,
                        color = if (report.severity == "HIGH") RescueError else RescueTertiary
                    )
                }

                Surface(
                    color = when (report.status) {
                        "VERIFIED" -> Color(0xFF15803D).copy(alpha = 0.3f)
                        "IN PROGRESS" -> RescueTertiaryContainer.copy(alpha = 0.3f)
                        else -> RescueSurfaceContainerHigh
                    },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = report.status,
                        style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                        color = when (report.status) {
                            "VERIFIED" -> Color(0xFF4ADE80)
                            "IN PROGRESS" -> RescueTertiary
                            else -> RescueOnSurface
                        },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = report.title,
                style = MaterialTheme.typography.titleMedium,
                color = Color.White
            )

            Text(
                text = report.location,
                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                color = RescuePrimary
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = report.description,
                style = MaterialTheme.typography.bodyMedium,
                color = RescueOnSurfaceVariant
            )
        }
    }
}
