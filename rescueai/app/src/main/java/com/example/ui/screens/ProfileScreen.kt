package com.example.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.RescueViewModel
import com.example.ui.theme.*

@Composable
fun ProfileScreen(
    viewModel: RescueViewModel
) {
    val context = LocalContext.current
    val medicalProfile by viewModel.medicalProfile.collectAsState()
    val emergencyContacts by viewModel.emergencyContacts.collectAsState()

    val scrollState = rememberScrollState()

    var isEditingProfile by remember { mutableStateOf(false) }
    var name by remember(medicalProfile) { mutableStateOf(medicalProfile?.name ?: "Sarah Jenkins") }
    var bloodType by remember(medicalProfile) { mutableStateOf(medicalProfile?.bloodType ?: "O+ Negative") }
    var conditions by remember(medicalProfile) { mutableStateOf(medicalProfile?.conditions ?: "Asthma, Nut Allergy") }
    var phone by remember(medicalProfile) { mutableStateOf(medicalProfile?.primaryPhone ?: "+1 (555) 019-2834") }
    var note by remember(medicalProfile) { mutableStateOf(medicalProfile?.emergencyNote ?: "Requires inhaler in severe smoke/dust environments.") }

    var showAddContactDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(RescueBackground)
            .verticalScroll(scrollState)
            .padding(16.dp)
            .testTag("profile_screen"),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // Header Profile Summary
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(24.dp)),
            colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.85f))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .clip(CircleShape)
                                .background(RescuePrimaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Person, contentDescription = "User Avatar", tint = RescueOnPrimaryContainer, modifier = Modifier.size(28.dp))
                        }

                        Column {
                            Text(text = medicalProfile?.name ?: "Sarah Jenkins", style = MaterialTheme.typography.titleLarge, color = Color.White)
                            Text(text = "Emergency Medical Pass ID #8841-A", style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp), color = RescueOnSurfaceVariant)
                        }
                    }

                    TextButton(onClick = { isEditingProfile = !isEditingProfile }) {
                        Text(if (isEditingProfile) "SAVE" else "EDIT", color = RescuePrimary, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                Spacer(modifier = Modifier.height(16.dp))

                if (isEditingProfile) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Full Name") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = bloodType,
                            onValueChange = { bloodType = it },
                            label = { Text("Blood Type") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = conditions,
                            onValueChange = { conditions = it },
                            label = { Text("Medical Conditions & Allergies") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text("Phone Number") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = note,
                            onValueChange = { note = it },
                            label = { Text("Emergency Note for Paramedics") },
                            modifier = Modifier.fillMaxWidth()
                        )

                        Button(
                            onClick = {
                                viewModel.saveMedicalProfile(name, bloodType, conditions, phone, note)
                                isEditingProfile = false
                                Toast.makeText(context, "Medical Profile Saved!", Toast.LENGTH_SHORT).show()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = RescuePrimaryContainer),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("SAVE MEDICAL PROFILE")
                        }
                    }
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Blood Type", style = MaterialTheme.typography.labelMedium, color = RescueOnSurfaceVariant)
                            Text(medicalProfile?.bloodType ?: "O+ Negative", style = MaterialTheme.typography.titleMedium, color = RescueError)
                        }
                        Column {
                            Text("Primary Phone", style = MaterialTheme.typography.labelMedium, color = RescueOnSurfaceVariant)
                            Text(medicalProfile?.primaryPhone ?: "+1 (555) 019-2834", style = MaterialTheme.typography.titleMedium, color = Color.White)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text("Conditions & Allergies", style = MaterialTheme.typography.labelMedium, color = RescueOnSurfaceVariant)
                    Text(medicalProfile?.conditions ?: "Asthma, Nut Allergy", style = MaterialTheme.typography.bodyLarge, color = Color.White)

                    Spacer(modifier = Modifier.height(8.dp))

                    Text("Emergency Paramedic Note", style = MaterialTheme.typography.labelMedium, color = RescueOnSurfaceVariant)
                    Text(medicalProfile?.emergencyNote ?: "Requires inhaler in severe smoke/dust environments.", style = MaterialTheme.typography.bodyMedium, color = RescueOnSurfaceVariant)
                }
            }
        }

        // Emergency Contacts Section
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Emergency Contacts", style = MaterialTheme.typography.titleLarge, color = Color.White)
            IconButton(onClick = { showAddContactDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Add Contact", tint = RescuePrimary)
            }
        }

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            emergencyContacts.forEach { contact ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(16.dp)),
                    colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.85f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                imageVector = if (contact.isPrimary) Icons.Default.Star else Icons.Default.Person,
                                contentDescription = contact.name,
                                tint = if (contact.isPrimary) RescueTertiary else RescuePrimary
                            )
                            Column {
                                Text(contact.name, style = MaterialTheme.typography.titleMedium, color = Color.White)
                                Text("${contact.relationship} • ${contact.phone}", style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp), color = RescueOnSurfaceVariant)
                            }
                        }

                        IconButton(onClick = { viewModel.deleteEmergencyContact(contact.id) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete", tint = RescueOnSurfaceVariant)
                        }
                    }
                }
            }
        }

        // Telemetry & Device Status Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(20.dp)),
            colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.85f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Device Telemetry & Status", style = MaterialTheme.typography.titleMedium, color = Color.White)
                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))

                TelemetryRow(label = "GPS Signal", value = "Strong (High Accuracy)", color = Color(0xFF4ADE80))
                TelemetryRow(label = "Battery Health", value = "92% (Normal Power Mode)", color = Color.White)
                TelemetryRow(label = "Offline Map Data", value = "Updated 2h ago (River Basin Pack)", color = RescuePrimary)
                TelemetryRow(label = "Encrypted Mesh Node", value = "Connected (3 Nearby Relays)", color = Color(0xFF4ADE80))
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }

    // Add Emergency Contact Dialog
    if (showAddContactDialog) {
        var cName by remember { mutableStateOf("") }
        var cRelation by remember { mutableStateOf("") }
        var cPhone by remember { mutableStateOf("") }
        var cIsPrimary by remember { mutableStateOf(false) }

        AlertDialog(
            onDismissRequest = { showAddContactDialog = false },
            title = { Text("Add Emergency Contact", color = Color.White) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(value = cName, onValueChange = { cName = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = cRelation, onValueChange = { cRelation = it }, label = { Text("Relationship (e.g. Spouse)") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = cPhone, onValueChange = { cPhone = it }, label = { Text("Phone Number") }, modifier = Modifier.fillMaxWidth())
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = cIsPrimary, onCheckedChange = { cIsPrimary = it })
                        Text("Set as Primary Emergency Contact", color = RescueOnSurface, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (cName.isNotBlank() && cPhone.isNotBlank()) {
                            viewModel.addEmergencyContact(cName, cRelation, cPhone, cIsPrimary)
                            showAddContactDialog = false
                            Toast.makeText(context, "Contact Added!", Toast.LENGTH_SHORT).show()
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RescuePrimaryContainer)
                ) {
                    Text("ADD CONTACT")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddContactDialog = false }) {
                    Text("CANCEL", color = RescueOnSurfaceVariant)
                }
            },
            containerColor = RescueSurfaceContainerHigh
        )
    }
}

@Composable
fun TelemetryRow(label: String, value: String, color: Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = RescueOnSurfaceVariant)
        Text(value, style = MaterialTheme.typography.labelMedium, color = color)
    }
}
