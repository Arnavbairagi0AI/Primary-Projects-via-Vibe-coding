/*
 * Developed by Arnav Bairagi
 * © Arnav Bairagi. All Rights Reserved.
 */

package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Canvas
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import coil.compose.AsyncImage
import android.content.Intent
import androidx.compose.ui.platform.LocalContext
import com.example.data.model.*
import com.example.ui.GymViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrainersScreen(viewModel: GymViewModel) {
    val context = LocalContext.current
    val trainers by viewModel.allTrainers.collectAsState()
    val members by viewModel.allMembers.collectAsState()
    val settings by viewModel.settings.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    val currency = settings?.currency ?: "₹"

    var showAddDialog by remember { mutableStateOf(false) }
    var editingTrainer by remember { mutableStateOf<Trainer?>(null) }
    var showDeleteConfirm by remember { mutableStateOf<Trainer?>(null) }
    var selectedTrainerForDetail by remember { mutableStateOf<Trainer?>(null) }
    var trainerToShowQr by remember { mutableStateOf<Trainer?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        if (selectedTrainerForDetail != null) {
            // Roster / Detail sub-view
            val trainer = selectedTrainerForDetail!!
            val assignedMembers = members.filter { it.trainerId == trainer.trainerId }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.clickable { selectedTrainerForDetail = null }
            ) {
                Icon(imageVector = Icons.Filled.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Back to Trainers list", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Trainer Header Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Trainer Initials Badge
                    val initials = trainer.name.split(" ")
                        .take(2)
                        .map { it.firstOrNull() ?: "" }
                        .joinToString("")
                        .uppercase()
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .background(MaterialTheme.colorScheme.primaryContainer, CircleShape)
                            .border(1.dp, MaterialTheme.colorScheme.primary, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = initials,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column {
                        Text(
                            text = trainer.name,
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = trainer.specialization,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "Experience: ${trainer.experience} years • Phone: ${trainer.phone}",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Assigned Members Roster (${assignedMembers.size})",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )

            Spacer(modifier = Modifier.height(12.dp))

            if (assignedMembers.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                    Text("No members assigned to this trainer yet.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(assignedMembers) { member ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
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
                                    Text("Plan: ${member.membershipPlan} • Phone: ${member.phone}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                }

                                Box(
                                    modifier = Modifier
                                        .background(
                                            color = if (member.status == "active") Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFEF4444).copy(alpha = 0.15f),
                                            shape = RoundedCornerShape(6.dp)
                                        )
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = member.status.uppercase(),
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (member.status == "active") Color(0xFF10B981) else Color(0xFFEF4444)
                                    )
                                }
                            }
                        }
                    }
                }
            }

        } else {
            // Primary Trainers List View
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Coaching Staff",
                        style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Manage professional instructors and fitness specialization fields",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                    )
                }

                if (currentUser?.role == "owner") {
                    Button(
                        onClick = {
                            editingTrainer = null
                            showAddDialog = true
                        },
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(imageVector = Icons.Filled.Add, contentDescription = "Add")
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Add Trainer", fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (trainers.isEmpty()) {
                Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(imageVector = Icons.Filled.Sports, contentDescription = "Empty", modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("No trainers registered.", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f))
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(trainers) { trainer ->
                        val trainerRosterCount = members.count { it.trainerId == trainer.trainerId }

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { selectedTrainerForDetail = trainer },
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Trainer Initials Badge
                                val initials = trainer.name.split(" ")
                                    .take(2)
                                    .map { it.firstOrNull() ?: "" }
                                    .joinToString("")
                                    .uppercase()
                                Box(
                                    modifier = Modifier
                                        .size(56.dp)
                                        .background(MaterialTheme.colorScheme.primaryContainer, CircleShape)
                                        .border(1.dp, MaterialTheme.colorScheme.primary, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = initials,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }

                                Spacer(modifier = Modifier.width(16.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = trainer.name,
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = trainer.specialization,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Text(
                                        text = "Roster Size: $trainerRosterCount active members",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                }

                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    if (currentUser?.role == "owner") {
                                        IconButton(onClick = {
                                            trainerToShowQr = trainer
                                        }) {
                                            Icon(imageVector = Icons.Filled.QrCodeScanner, contentDescription = "View QR Pass", tint = Color(0xFF10B981))
                                        }

                                        IconButton(onClick = {
                                            editingTrainer = trainer
                                            showAddDialog = true
                                        }) {
                                            Icon(imageVector = Icons.Filled.Edit, contentDescription = "Edit", tint = MaterialTheme.colorScheme.primary)
                                        }

                                        IconButton(onClick = { showDeleteConfirm = trainer }) {
                                            Icon(imageVector = Icons.Filled.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                                        }
                                    } else {
                                        Icon(imageVector = Icons.Filled.ArrowForwardIos, contentDescription = "Detail", modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // --- Add/Edit Trainer Dialog ---
    if (showAddDialog) {
        var tId by remember { mutableStateOf(editingTrainer?.trainerId ?: "T-${System.currentTimeMillis() % 1000000}${(10..99).random()}") }
        var name by remember { mutableStateOf(editingTrainer?.name ?: "") }
        var phone by remember { mutableStateOf(editingTrainer?.phone ?: "+91 ") }
        var specialization by remember { mutableStateOf(editingTrainer?.specialization ?: "") }
        var experience by remember { mutableStateOf(editingTrainer?.experience?.toString() ?: "") }
        var salary by remember { mutableStateOf(editingTrainer?.salary?.toString() ?: "") }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text(if (editingTrainer == null) "Add Trainer" else "Edit Trainer", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Trainer Full Name *") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone Number *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = specialization,
                        onValueChange = { specialization = it },
                        label = { Text("Specialization (e.g. Yoga, Bodybuilding)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = experience,
                        onValueChange = { experience = it },
                        label = { Text("Experience (Years) *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = salary,
                        onValueChange = { salary = it },
                        label = { Text("Monthly Salary ($currency) *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isNotBlank() && phone.isNotBlank() && experience.isNotBlank() && salary.isNotBlank()) {
                            val trainer = Trainer(
                                trainerId = tId,
                                name = name,
                                phone = phone,
                                specialization = specialization,
                                experience = experience.toIntOrNull() ?: 3,
                                salary = salary.toDoubleOrNull() ?: 25000.0,
                                photo = editingTrainer?.photo ?: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=120"
                            )
                            viewModel.addOrUpdateTrainer(trainer)
                            showAddDialog = false
                        } else {
                            viewModel.showFeedback("Please complete all mandatory fields")
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Save Trainer", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Cancel")
                }
            },
            shape = RoundedCornerShape(16.dp)
        )
    }

    // --- Delete Confirmation Dialog ---
    if (showDeleteConfirm != null) {
        val trainer = showDeleteConfirm!!
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = null },
            title = { Text("Remove Trainer Staff?", fontWeight = FontWeight.Bold) },
            text = { Text("Are you sure you want to remove ${trainer.name} from the coaching roster? Assigned members will require reassignment.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteTrainer(trainer.trainerId)
                        showDeleteConfirm = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                    shape = RoundedCornerShape(8.dp)
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

    // --- Trainer QR Pass Dialog ---
    if (trainerToShowQr != null) {
        val trainer = trainerToShowQr!!
        AlertDialog(
            onDismissRequest = { trainerToShowQr = null },
            title = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("⚡ STAFF ACCESS PASS ⚡", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(trainer.name, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                    Text(trainer.specialization, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                }
            },
            text = {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val qrText = remember(trainer.trainerId) {
                        trainer.trainerId
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
                            .size(180.dp)
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

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Trainer ID: ${trainer.trainerId}",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Scan this staff pass at the reception to check-in or check-out.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Developed by Arnav Bairagi\n© Arnav Bairagi. All Rights Reserved.",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { trainerToShowQr = null }) {
                    Text("Close")
                }
            },
            dismissButton = {
                Button(
                    onClick = {
                        val qrText = trainer.trainerId
                        com.example.util.ShareHelper.generateAndShareQrCode(
                            context = context,
                            qrText = qrText,
                            userName = trainer.name,
                            title = "🏋️ GymMaster Pro - Trainer Staff Access Pass 🏋️",
                            description = "Here is your Trainer Staff Access Pass:",
                            details = "• Staff ID: ${trainer.trainerId}\n• Specialization: ${trainer.specialization}"
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(imageVector = Icons.Filled.Share, contentDescription = "Share", modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Share Pass", fontWeight = FontWeight.Bold)
                }
            }
        )
    }
}
