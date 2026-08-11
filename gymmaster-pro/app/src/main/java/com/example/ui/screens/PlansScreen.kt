package com.example.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.*
import com.example.ui.GymViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlansScreen(viewModel: GymViewModel) {
    val plans by viewModel.allPlans.collectAsState()
    val settings by viewModel.settings.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    val currency = settings?.currency ?: "₹"

    var showAddDialog by remember { mutableStateOf(false) }
    var editingPlan by remember { mutableStateOf<MembershipPlan?>(null) }
    var showDeleteConfirm by remember { mutableStateOf<MembershipPlan?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Membership Plans",
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Configure pricing tier periods and listed benefits",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                )
            }

            if (currentUser?.role == "owner") {
                Button(
                    onClick = {
                        editingPlan = null
                        showAddDialog = true
                    },
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(imageVector = Icons.Filled.Add, contentDescription = "Add")
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add Plan", fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Full Access Banner
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🔓 Full Access Active: All membership tiers & features are 100% unlocked. No Razorpay payment or subscription required.",
                    style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium),
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (plans.isEmpty()) {
            Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                Text("No membership plans defined yet.", color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(plans) { plan ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.1f))
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(imageVector = Icons.Filled.FitnessCenter, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                    Text(
                                        text = plan.name,
                                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }

                                Row {
                                    if (currentUser?.role == "owner") {
                                        IconButton(onClick = {
                                            editingPlan = plan
                                            showAddDialog = true
                                        }) {
                                            Icon(imageVector = Icons.Filled.Edit, contentDescription = "Edit", tint = MaterialTheme.colorScheme.primary)
                                        }
                                        IconButton(onClick = { showDeleteConfirm = plan }) {
                                            Icon(imageVector = Icons.Filled.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.Bottom
                            ) {
                                Column {
                                    Text("Duration Period", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                    Text(
                                        text = "${plan.durationDays} Days",
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Text("Price Tier", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                    Text(
                                        text = "$currency${plan.price.toInt()}",
                                        style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))
                            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                            Spacer(modifier = Modifier.height(8.dp))

                            Text("Bundled Benefits:", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))

                            Spacer(modifier = Modifier.height(4.dp))

                            // Benefits chips
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                plan.benefits.split(",").forEach { benefit ->
                                    if (benefit.isNotBlank()) {
                                        Box(
                                            modifier = Modifier
                                                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f), RoundedCornerShape(6.dp))
                                                .padding(horizontal = 8.dp, vertical = 3.dp)
                                        ) {
                                            Text(benefit.trim(), fontSize = 11.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
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

    // --- Add/Edit Plan Dialog ---
    if (showAddDialog) {
        var pId by remember { mutableStateOf(editingPlan?.planId ?: "P-${(10..99).random()}") }
        var name by remember { mutableStateOf(editingPlan?.name ?: "") }
        var price by remember { mutableStateOf(editingPlan?.price?.toString() ?: "") }
        var duration by remember { mutableStateOf(editingPlan?.durationDays?.toString() ?: "") }
        var benefits by remember { mutableStateOf(editingPlan?.benefits ?: "") }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text(if (editingPlan == null) "Create Plan" else "Edit Plan", fontWeight = FontWeight.Bold) },
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
                        label = { Text("Plan Name (e.g. Gold, Premium) *") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = price,
                        onValueChange = { price = it },
                        label = { Text("Price Tier ($currency) *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = duration,
                        onValueChange = { duration = it },
                        label = { Text("Duration Period (Days) *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = benefits,
                        onValueChange = { benefits = it },
                        label = { Text("Benefits (comma-separated, e.g. Steam, VIP Locker) *") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isNotBlank() && price.isNotBlank() && duration.isNotBlank() && benefits.isNotBlank()) {
                            val plan = MembershipPlan(
                                planId = pId,
                                name = name,
                                price = price.toDoubleOrNull() ?: 2999.0,
                                durationDays = duration.toIntOrNull() ?: 30,
                                benefits = benefits
                            )
                            viewModel.addOrUpdatePlan(plan)
                            showAddDialog = false
                        } else {
                            viewModel.showFeedback("Please complete all fields")
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Save Plan", fontWeight = FontWeight.Bold)
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
        val plan = showDeleteConfirm!!
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = null },
            title = { Text("Delete Membership Tier?", fontWeight = FontWeight.Bold) },
            text = { Text("Are you absolutely sure you want to delete the plan: ${plan.name}? This will affect member registrations.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deletePlan(plan.planId)
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
}
