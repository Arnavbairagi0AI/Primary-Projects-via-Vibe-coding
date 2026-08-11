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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.*
import com.example.ui.GymViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(viewModel: GymViewModel) {
    val settings by viewModel.settings.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    var gymName by remember { mutableStateOf("") }
    var logo by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var currency by remember { mutableStateOf("₹") }
    var workingHours by remember { mutableStateOf("") }
    var themeColor by remember { mutableStateOf("#0056D2") }
    var whatsappBusinessToken by remember { mutableStateOf("") }
    var whatsappBusinessPhoneId by remember { mutableStateOf("") }

    var adminName by remember { mutableStateOf("") }
    var adminPhoto by remember { mutableStateOf("") }

    // Sync input fields with DB settings
    LaunchedEffect(settings) {
        settings?.let {
            gymName = it.gymName
            logo = it.logoUrl
            phone = it.phone
            address = it.address
            currency = it.currency
            workingHours = it.workingHours
            themeColor = it.themeColor
            whatsappBusinessToken = it.whatsappBusinessToken
            whatsappBusinessPhoneId = it.whatsappBusinessPhoneId
        }
    }

    LaunchedEffect(currentUser) {
        currentUser?.let {
            adminName = it.name
            adminPhoto = it.profilePhoto ?: ""
        }
    }

    val canEdit = currentUser?.role == "owner"

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // --- Admin Profile Section ---
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (adminPhoto.isNotBlank()) {
                        coil.compose.AsyncImage(
                            model = adminPhoto,
                            contentDescription = "Profile Photo Preview",
                            modifier = Modifier
                                .size(60.dp)
                                .clip(CircleShape)
                                .border(1.5.dp, MaterialTheme.colorScheme.primary, CircleShape),
                            contentScale = androidx.compose.ui.layout.ContentScale.Crop
                        )
                    } else {
                        val initials = adminName.firstOrNull()?.toString()?.uppercase() ?: "A"
                        Box(
                            modifier = Modifier
                                .size(60.dp)
                                .background(MaterialTheme.colorScheme.primaryContainer, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = initials,
                                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                    Column {
                        Text(
                            text = "Administrator Profile",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "Manage your admin display credentials and profile avatar",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }

                Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))

                OutlinedTextField(
                    value = adminName,
                    onValueChange = { adminName = it },
                    label = { Text("Full Name *") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = canEdit,
                    singleLine = true
                )

                OutlinedTextField(
                    value = currentUser?.email ?: "",
                    onValueChange = {},
                    label = { Text("Email Address") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = false,
                    singleLine = true
                )

                OutlinedTextField(
                    value = adminPhoto,
                    onValueChange = { adminPhoto = it },
                    label = { Text("Profile Photo URL") },
                    placeholder = { Text("https://example.com/photo.jpg") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = canEdit,
                    singleLine = true
                )

                if (canEdit) {
                    Button(
                        onClick = {
                            if (adminName.isNotBlank()) {
                                viewModel.updateAdminProfile(adminName, adminPhoto)
                            } else {
                                viewModel.showFeedback("Profile Name cannot be blank.")
                            }
                        },
                        modifier = Modifier.align(Alignment.End),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Save, contentDescription = "Save Profile", modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Update Profile", fontSize = 12.sp)
                    }
                }
            }
        }

        // --- Subscription & License Status Card ---
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.2f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "🔓",
                        fontSize = 18.sp
                    )
                    Text(
                        text = "Access & Subscription Status",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                Text(
                    text = "• Access Mode: Full Unrestricted Access (No Email / Sign-In Required)",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "• Subscription: Lifetime Premium Unlocked (Razorpay Payment Bypassed)",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "• AI Workouts & Diets: Unlimited Access Active",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Column {
            Text(
                text = "Gym Configurations",
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold)
            )
            Text(
                text = "Manage business variables, localized currencies, and theme branding",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Re-branding Theme Palette widget
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(imageVector = Icons.Filled.Palette, contentDescription = "Palette", tint = MaterialTheme.colorScheme.primary)
                    Text(
                        text = "Dynamic Brand Re-Theming",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }
                Text(
                    text = "Select a branding accent. This rewrites the Material primary color dynamically.",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Color Preset circles
                val colorPresets = listOf(
                    Triple("Professional Polish", "#0056D2", Color(0xFF0056D2)),
                    Triple("Royal Indigo", "#3F51B5", Color(0xFF3F51B5)),
                    Triple("Crimson Strength", "#D32F2F", Color(0xFFD32F2F)),
                    Triple("Emerald Fitness", "#00796B", Color(0xFF00796B)),
                    Triple("Amethyst Gym", "#7B1FA2", Color(0xFF7B1FA2)),
                    Triple("Gold Standard", "#D4AF37", Color(0xFFD4AF37))
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    colorPresets.forEach { (name, hex, col) ->
                        val isSelected = themeColor.equals(hex, ignoreCase = true)
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.clickable {
                                if (canEdit) {
                                    themeColor = hex
                                }
                            }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(col, CircleShape)
                                    .border(
                                        width = if (isSelected) 3.dp else 1.dp,
                                        color = if (isSelected) MaterialTheme.colorScheme.onSurface else Color.Transparent,
                                        shape = CircleShape
                                    )
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(name.substringBefore(" "), fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }

        // Gym Profile input fields
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(imageVector = Icons.Filled.Business, contentDescription = "Gym Info", tint = MaterialTheme.colorScheme.primary)
                    Text(
                        text = "Business Coordinates",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }

                OutlinedTextField(
                    value = gymName,
                    onValueChange = { gymName = it },
                    label = { Text("Gym Franchise Name *") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = canEdit,
                    singleLine = true
                )

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Contact Phone *") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = canEdit,
                    singleLine = true
                )

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Facility Address *") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = canEdit
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Currency Picker
                    var isCurrencyExpanded by remember { mutableStateOf(false) }
                    Box(modifier = Modifier.weight(1.0f)) {
                        OutlinedTextField(
                            value = currency,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Local Currency *") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { if (canEdit) isCurrencyExpanded = true },
                            enabled = canEdit,
                            trailingIcon = { Icon(Icons.Default.Palette, null) }
                        )
                        DropdownMenu(
                            expanded = isCurrencyExpanded,
                            onDismissRequest = { isCurrencyExpanded = false },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            listOf("₹", "$", "£", "€", "¥").forEach { cur ->
                                DropdownMenuItem(text = { Text(cur) }, onClick = {
                                    currency = cur
                                    isCurrencyExpanded = false
                                })
                            }
                        }
                    }

                    OutlinedTextField(
                        value = workingHours,
                        onValueChange = { workingHours = it },
                        label = { Text("Operational Hours *") },
                        modifier = Modifier.weight(1.2f),
                        enabled = canEdit,
                        singleLine = true
                    )
                }
            }
        }

        // WhatsApp Business API Configuration Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Filled.Business,
                        contentDescription = "WhatsApp Config",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "WhatsApp Cloud API Integration (Optional)",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }

                Text(
                    text = "Provide Meta Developer API details to send Member QR Access Cards directly to their WhatsApp chats. If not configured, sharing will default to WhatsApp app deep links.",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )

                OutlinedTextField(
                    value = whatsappBusinessToken,
                    onValueChange = { whatsappBusinessToken = it },
                    label = { Text("WhatsApp Business Access Token") },
                    placeholder = { Text("EAABw...") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = canEdit,
                    singleLine = true
                )

                OutlinedTextField(
                    value = whatsappBusinessPhoneId,
                    onValueChange = { whatsappBusinessPhoneId = it },
                    label = { Text("WhatsApp Business Phone Number ID") },
                    placeholder = { Text("10955...") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = canEdit,
                    singleLine = true
                )
            }
        }

        // Save Button
        if (canEdit) {
            Button(
                onClick = {
                    if (gymName.isNotBlank() && phone.isNotBlank() && address.isNotBlank()) {
                        viewModel.updateSettings(
                            gymName = gymName,
                            address = address,
                            phone = phone,
                            gstNumber = settings?.gstNumber ?: "GST-MOCK-992",
                            currency = currency,
                            workingHours = workingHours,
                            themeColor = themeColor,
                            whatsappBusinessToken = whatsappBusinessToken,
                            whatsappBusinessPhoneId = whatsappBusinessPhoneId
                        )
                    } else {
                        viewModel.showFeedback("Mandatory fields (*) are required")
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(imageVector = Icons.Filled.Save, contentDescription = "Save")
                Spacer(modifier = Modifier.width(6.dp))
                Text("Save and Apply Styling Theme", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
            }
        } else {
            // Read-Only Banner for trainers/receptionists
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "⚠️ View-Only Mode: Settings variables can only be altered by the Owner.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Developed by Arnav Bairagi\n© Arnav Bairagi. All Rights Reserved.",
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.8f),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)
        )
    }
}
