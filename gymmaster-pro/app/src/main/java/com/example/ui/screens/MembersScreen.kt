/*
 * Developed by Arnav Bairagi
 * © Arnav Bairagi. All Rights Reserved.
 */

package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.lazy.grid.LazyGridState
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.delay
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Canvas
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import coil.compose.AsyncImage
import com.example.data.model.*
import com.example.ui.GymViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun MembersScreen(
    viewModel: GymViewModel,
    onNavigateToMemberProfile: (String) -> Unit
) {
    val context = LocalContext.current
    val members by viewModel.filteredMembers.collectAsState(initial = emptyList())
    val plans by viewModel.allPlans.collectAsState()
    val trainers by viewModel.allTrainers.collectAsState()
    val settings by viewModel.settings.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()

    val currency = settings?.currency ?: "₹"

    var showAddDialog by remember { mutableStateOf(false) }
    var editingMember by remember { mutableStateOf<Member?>(null) }
    var showDeleteConfirm by remember { mutableStateOf<Member?>(null) }
    var memberToShowQr by remember { mutableStateOf<Member?>(null) }
    var newlyRegisteredMember by remember { mutableStateOf<Member?>(null) }
    var newlyRegisteredTrainer by remember { mutableStateOf<Trainer?>(null) }

    // Dialog state for One-Click Renewal
    var memberToRenew by remember { mutableStateOf<Member?>(null) }
    var selectedPlanForRenewal by remember { mutableStateOf<MembershipPlan?>(null) }
    var renewalPaymentMethod by remember { mutableStateOf("UPI") }

    val allMembersRaw by viewModel.allMembers.collectAsState(initial = emptyList())

    var searchQuery by remember { mutableStateOf(viewModel.searchQuery) }
    val debouncedSearchQuery by produceState(initialValue = viewModel.searchQuery) {
        snapshotFlow { searchQuery }
            .collectLatest {
                delay(300)
                value = it
            }
    }

    var statusFilter by remember { mutableStateOf(viewModel.statusFilter) }
    var planFilter by remember { mutableStateOf(viewModel.planFilter) }
    var sortBy by remember { mutableStateOf("Name (A-Z)") }

    LaunchedEffect(debouncedSearchQuery) {
        viewModel.searchQuery = debouncedSearchQuery
    }
    LaunchedEffect(statusFilter) {
        viewModel.statusFilter = statusFilter
    }
    LaunchedEffect(planFilter) {
        viewModel.planFilter = planFilter
    }

    val getDaysUntilExpiry: (String) -> Int? = { expiryDateStr ->
        try {
            val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
            val expiryDate = dateFormat.parse(expiryDateStr)
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

    // Dynamic counts
    val allCount = allMembersRaw.size
    val activeCount = allMembersRaw.count { member ->
        val daysLeft = getDaysUntilExpiry(member.expiryDate)
        val isExpiring = daysLeft != null && daysLeft in 0..7
        val isInactive = member.status.equals("expired", ignoreCase = true) ||
                member.status.equals("frozen", ignoreCase = true) ||
                (daysLeft != null && daysLeft < 0)
        member.status.equals("active", ignoreCase = true) && !isExpiring && !isInactive
    }
    val expiringCount = allMembersRaw.count { member ->
        val daysLeft = getDaysUntilExpiry(member.expiryDate)
        daysLeft != null && daysLeft in 0..7
    }
    val inactiveCount = allMembersRaw.count { member ->
        val daysLeft = getDaysUntilExpiry(member.expiryDate)
        member.status.equals("expired", ignoreCase = true) ||
                member.status.equals("frozen", ignoreCase = true) ||
                (daysLeft != null && daysLeft < 0)
    }
    val planCounts = remember(allMembersRaw, plans) {
        plans.associate { plan ->
            plan.name to allMembersRaw.count { it.membershipPlan.equals(plan.name, ignoreCase = true) }
        }
    }

    // Filtered members list
    val filteredMembers = remember(allMembersRaw, debouncedSearchQuery, statusFilter, planFilter, sortBy, trainers, viewModel.allPayments.value) {
        allMembersRaw.filter { member ->
            val trainerName = trainers.find { it.trainerId == member.trainerId }?.name ?: ""
            val memberPayments = viewModel.allPayments.value.filter { it.memberId == member.memberId }
            val matchesTxnId = memberPayments.any { it.transactionId?.contains(debouncedSearchQuery, ignoreCase = true) == true }

            val matchesQuery = debouncedSearchQuery.isEmpty() ||
                    member.name.contains(debouncedSearchQuery, ignoreCase = true) ||
                    member.phone.contains(debouncedSearchQuery) ||
                    member.email.contains(debouncedSearchQuery, ignoreCase = true) ||
                    member.memberId.contains(debouncedSearchQuery, ignoreCase = true) ||
                    member.membershipPlan.contains(debouncedSearchQuery, ignoreCase = true) ||
                    trainerName.contains(debouncedSearchQuery, ignoreCase = true) ||
                    matchesTxnId

            val daysLeft = getDaysUntilExpiry(member.expiryDate)
            val isExpiring = daysLeft != null && daysLeft in 0..7
            val isInactive = member.status.equals("expired", ignoreCase = true) ||
                    member.status.equals("frozen", ignoreCase = true) ||
                    (daysLeft != null && daysLeft < 0)
            val isActive = member.status.equals("active", ignoreCase = true) && !isExpiring && !isInactive

            val matchesStatus = when (statusFilter) {
                "All" -> true
                "Active" -> isActive
                "Expiring" -> isExpiring
                "Inactive" -> isInactive
                else -> true
            }

            val matchesPlan = planFilter == "All" || member.membershipPlan.equals(planFilter, ignoreCase = true)

            matchesQuery && matchesStatus && matchesPlan
        }.let { list ->
            when (sortBy) {
                "Name (A-Z)" -> list.sortedBy { it.name.lowercase() }
                "Name (Z-A)" -> list.sortedByDescending { it.name.lowercase() }
                "Expiry (Soonest)" -> list.sortedWith(compareBy<Member> {
                    getDaysUntilExpiry(it.expiryDate) ?: Int.MAX_VALUE
                }.thenBy { it.name.lowercase() })
                "Newest Registered" -> list.sortedByDescending { it.memberId }
                else -> list
            }
        }
    }

    val gridState = rememberLazyGridState()
    var isFabVisible by remember { mutableStateOf(true) }
    var previousIndex by remember { mutableStateOf(0) }
    var previousScrollOffset by remember { mutableStateOf(0) }

    LaunchedEffect(gridState.firstVisibleItemIndex, gridState.firstVisibleItemScrollOffset) {
        val currentIndex = gridState.firstVisibleItemIndex
        val currentOffset = gridState.firstVisibleItemScrollOffset
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

    Box(
        modifier = Modifier
            .fillMaxSize()
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Header block (Simple, no "Add Member" button)
            Column {
                Text(
                    text = "Members Directory",
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = "Manage gym memberships and health records",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Search Bar (Full Width, M3 style)
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search by Name, Member ID, Phone...", maxLines = 1, overflow = TextOverflow.Ellipsis) },
                leadingIcon = { Icon(imageVector = Icons.Filled.Search, contentDescription = "Search") },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(imageVector = Icons.Filled.Clear, contentDescription = "Clear")
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .testTag("members_search_bar"),
                shape = RoundedCornerShape(20.dp),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f),
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface
                )
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Scrollable Pill Filters + Sort Dropdown
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Sort Dropdown Trigger Chip as a Pill
                var isSortMenuExpanded by remember { mutableStateOf(false) }
                Box {
                    FilterChip(
                        selected = sortBy != "Name (A-Z)",
                        onClick = { isSortMenuExpanded = true },
                        label = {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Icon(imageVector = Icons.Filled.Sort, contentDescription = "Sort", modifier = Modifier.size(16.dp))
                                Text(sortBy)
                                Icon(imageVector = Icons.Filled.ArrowDropDown, contentDescription = null, modifier = Modifier.size(16.dp))
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
                        expanded = isSortMenuExpanded,
                        onDismissRequest = { isSortMenuExpanded = false }
                    ) {
                        listOf("Name (A-Z)", "Name (Z-A)", "Expiry (Soonest)", "Newest Registered").forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option) },
                                onClick = {
                                    sortBy = option
                                    isSortMenuExpanded = false
                                }
                            )
                        }
                    }
                }

                Box(modifier = Modifier.width(1.dp).height(24.dp).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)))

                // Status Filters
                listOf("All", "Active", "Expiring", "Inactive").forEach { status ->
                    FilterChip(
                        selected = statusFilter == status,
                        onClick = { statusFilter = status },
                        label = {
                            val labelText = when (status) {
                                "All" -> "🔍 All ($allCount)"
                                "Active" -> "🟢 Active ($activeCount)"
                                "Expiring" -> "🟠 Expiring ($expiringCount)"
                                "Inactive" -> "🔴 Inactive ($inactiveCount)"
                                else -> status
                            }
                            Text(labelText)
                        },
                        shape = CircleShape,
                        modifier = Modifier.height(36.dp),
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    )
                }

                Box(modifier = Modifier.width(1.dp).height(24.dp).background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)))

                // Plan Filters
                FilterChip(
                    selected = planFilter == "All",
                    onClick = { planFilter = "All" },
                    label = { Text("All Plans ($allCount)") },
                    shape = CircleShape,
                    modifier = Modifier.height(36.dp),
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                        selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                )
                plans.forEach { plan ->
                    val count = planCounts[plan.name] ?: 0
                    FilterChip(
                        selected = planFilter == plan.name,
                        onClick = { planFilter = plan.name },
                        label = { Text("${plan.name} ($count)") },
                        shape = CircleShape,
                        modifier = Modifier.height(36.dp),
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Members Responsive Grid Layout
            if (filteredMembers.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Icon(
                            imageVector = Icons.Filled.PeopleOutline,
                            contentDescription = "Empty",
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f)
                        )
                        Text(
                            text = if (allMembersRaw.isEmpty()) "No registered members yet" else "No members match selected filters",
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                            fontWeight = FontWeight.Bold
                        )
                        if (allMembersRaw.isNotEmpty() && (searchQuery.isNotEmpty() || statusFilter != "All" || planFilter != "All")) {
                            Button(
                                onClick = {
                                    searchQuery = ""
                                    statusFilter = "All"
                                    planFilter = "All"
                                },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Text("Reset Filters & Clear Search", fontWeight = FontWeight.Bold)
                            }
                        } else if (allMembersRaw.isEmpty() && currentUser?.role != "trainer") {
                            Button(
                                onClick = {
                                    editingMember = null
                                    showAddDialog = true
                                },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Text("+ Register First Member", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            } else {
                LazyVerticalGrid(
                    state = gridState,
                    columns = GridCells.Adaptive(minSize = 300.dp),
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 80.dp) // Leave room for floating action button
                ) {
                    items(filteredMembers, key = { it.memberId }) { member ->
                        val expiryBadgeColor = getExpiryBadgeColor(member.expiryDate, member.status)

                        val interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }
                        val isPressed by interactionSource.collectIsPressedAsState()
                        val cardScale by animateFloatAsState(
                            targetValue = if (isPressed) 0.97f else 1.0f,
                            animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
                            label = "card_scale"
                        )
                        val elevationState by animateDpAsState(
                            targetValue = if (isPressed) 2.dp else 4.dp,
                            label = "card_elevation"
                        )

                        val daysUntilExpiry = getDaysUntilExpiry(member.expiryDate)
                        val isWithinSevenDays = daysUntilExpiry != null && daysUntilExpiry in 0..7

                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .graphicsLayer {
                                    scaleX = cardScale
                                    scaleY = cardScale
                                }
                                .clickable(
                                    interactionSource = interactionSource,
                                    indication = androidx.compose.foundation.LocalIndication.current
                                ) { onNavigateToMemberProfile(member.memberId) },
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(
                                1.dp,
                                if (isPressed) MaterialTheme.colorScheme.primary.copy(alpha = 0.3f) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.06f)
                            ),
                            elevation = CardDefaults.cardElevation(defaultElevation = elevationState)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Member Avatar Badge
                                val initials = member.name.split(" ")
                                    .take(2)
                                    .map { it.firstOrNull() ?: "" }
                                    .joinToString("")
                                    .uppercase()
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .background(MaterialTheme.colorScheme.primaryContainer, CircleShape)
                                        .border(1.5.dp, expiryBadgeColor, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = initials,
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                // Member Info
                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = member.name,
                                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                            color = MaterialTheme.colorScheme.onSurface,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Box(
                                            modifier = Modifier
                                                .size(8.dp)
                                                .background(expiryBadgeColor, CircleShape)
                                        )
                                    }

                                    Text(
                                        text = "${member.membershipPlan} • ID: ${member.memberId}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )

                                    Spacer(modifier = Modifier.height(4.dp))

                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        // Status tag
                                        Box(
                                            modifier = Modifier
                                                .background(
                                                    color = when (member.status) {
                                                        "active" -> Color(0xFF10B981).copy(alpha = 0.15f)
                                                        "expired" -> Color(0xFFEF4444).copy(alpha = 0.15f)
                                                        else -> Color(0xFFF59E0B).copy(alpha = 0.15f)
                                                    },
                                                    shape = RoundedCornerShape(6.dp)
                                                )
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = member.status.uppercase(),
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = when (member.status) {
                                                    "active" -> Color(0xFF10B981)
                                                    "expired" -> Color(0xFFEF4444)
                                                    else -> Color(0xFFF59E0B)
                                                }
                                            )
                                        }

                                        // Payment tag
                                        Box(
                                            modifier = Modifier
                                                .background(
                                                    color = if (member.paymentStatus == "paid") Color(0xFF10B981).copy(alpha = 0.15f) else Color(0xFFF59E0B).copy(alpha = 0.15f),
                                                    shape = RoundedCornerShape(6.dp)
                                                )
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = member.paymentStatus.uppercase(),
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = if (member.paymentStatus == "paid") Color(0xFF10B981) else Color(0xFFF59E0B)
                                            )
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(4.dp))

                                    // Orange Badge for Expiry <= 7 days
                                    if (isWithinSevenDays) {
                                        val badgeText = when (daysUntilExpiry) {
                                            0 -> "🟠 Expires Today"
                                            1 -> "🟠 Expires in 1 Day"
                                            else -> "🟠 Expires in $daysUntilExpiry Days"
                                        }
                                        Box(
                                            modifier = Modifier
                                                .background(
                                                    color = Color(0xFFFF9800).copy(alpha = 0.12f),
                                                    shape = RoundedCornerShape(6.dp)
                                                )
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = badgeText,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFFE65100)
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(2.dp))
                                    }

                                    Text(
                                        text = "Expires: ${member.expiryDate}",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                    )
                                }

                                // Quick Actions
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(2.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    IconButton(
                                        onClick = {
                                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${member.phone}"))
                                            context.startActivity(intent)
                                        },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.Call,
                                            contentDescription = "Call",
                                            tint = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }

                                    IconButton(
                                        onClick = {
                                            val daysLeft = daysUntilExpiry
                                            val isPending = member.paymentStatus.equals("pending", ignoreCase = true)
                                            
                                            val sb = StringBuilder()
                                            sb.append("🏋️ *${settings?.gymName ?: "GymMaster Pro"}* 🏋️\n\n")
                                            sb.append("Hello *${member.name}*,\n\n")
                                            
                                            if (isPending && daysLeft != null && daysLeft in 0..7) {
                                                sb.append("This is a friendly reminder that your membership is expiring in *${daysLeft} days* (on *${member.expiryDate}*) and your membership fee payment is *PENDING*. ⚠️\n\n")
                                                sb.append("Please clear your dues as soon as possible to continue accessing the gym without interruption! 💪")
                                            } else if (isPending) {
                                                sb.append("This is a friendly reminder that your membership fee payment is *PENDING*. ⚠️\n\n")
                                                sb.append("Please clear your dues as soon as possible. Thank you for your support! 💪")
                                            } else if (daysLeft != null && daysLeft in 0..7) {
                                                val daysText = if (daysLeft == 0) "today" else "in *${daysLeft} days*"
                                                sb.append("This is a friendly notification that your membership is about to expire *${daysText}* (on *${member.expiryDate}*). ⏰\n\n")
                                                sb.append("We would love to keep training with you! Please renew your membership at the front desk or open your digital pass to check plans. 🏋️")
                                            } else if (member.status.equals("expired", ignoreCase = true)) {
                                                sb.append("We noticed your membership has *EXPIRED* on *${member.expiryDate}*. 🔴\n\n")
                                                sb.append("We miss seeing you at the gym! Please renew your membership at the front desk or reach out to us. Stay strong! 💪")
                                            } else {
                                                sb.append("Hope you are having a wonderful day and a great workout session! 🔥\n\n")
                                                sb.append("Just a quick status update:\n")
                                                sb.append("• Plan: *${member.membershipPlan}*\n")
                                                sb.append("• Status: *${member.status.uppercase()}*\n")
                                                sb.append("• Expires: *${member.expiryDate}*\n\n")
                                                sb.append("Keep pushing your limits! 🏋️")
                                            }
                                            
                                            val message = sb.toString()
                                            val encodedMsg = java.net.URLEncoder.encode(message, "UTF-8")
                                            val cleanPhone = member.phone.replace("[^0-9]".toRegex(), "")
                                            val phoneWithCountry = if (cleanPhone.length == 10) "91$cleanPhone" else cleanPhone
                                            val url = "https://api.whatsapp.com/send?phone=$phoneWithCountry&text=$encodedMsg"
                                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                            context.startActivity(intent)
                                        },
                                        modifier = Modifier.size(36.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.Message,
                                            contentDescription = "WhatsApp",
                                            tint = Color(0xFF25D366),
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }

                                    var isMenuExpanded by remember { mutableStateOf(false) }
                                    Box {
                                        IconButton(
                                            onClick = { isMenuExpanded = true },
                                            modifier = Modifier.size(36.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Filled.MoreVert,
                                                contentDescription = "Options",
                                                modifier = Modifier.size(18.dp)
                                            )
                                        }
                                        DropdownMenu(
                                            expanded = isMenuExpanded,
                                            onDismissRequest = { isMenuExpanded = false }
                                        ) {
                                            DropdownMenuItem(
                                                text = { Text("View Full Profile") },
                                                onClick = {
                                                    isMenuExpanded = false
                                                    onNavigateToMemberProfile(member.memberId)
                                                },
                                                leadingIcon = { Icon(Icons.Filled.AccountBox, null) }
                                            )

                                            DropdownMenuItem(
                                                text = { Text("View QR Pass / Share") },
                                                onClick = {
                                                    isMenuExpanded = false
                                                    memberToShowQr = member
                                                },
                                                leadingIcon = { Icon(Icons.Filled.QrCodeScanner, null) }
                                            )

                                            if (currentUser?.role != "trainer") {
                                                DropdownMenuItem(
                                                    text = { Text("Edit Details") },
                                                    onClick = {
                                                        isMenuExpanded = false
                                                        editingMember = member
                                                        showAddDialog = true
                                                    },
                                                    leadingIcon = { Icon(Icons.Filled.Edit, null) }
                                                )

                                                DropdownMenuItem(
                                                    text = { Text("Quick Renew") },
                                                    onClick = {
                                                        isMenuExpanded = false
                                                        memberToRenew = member
                                                        selectedPlanForRenewal = plans.find { it.name == member.membershipPlan } ?: plans.firstOrNull()
                                                    },
                                                    leadingIcon = { Icon(Icons.Filled.Autorenew, null) }
                                                )

                                                if (currentUser?.role == "owner") {
                                                    DropdownMenuItem(
                                                        text = { Text("Delete Member", color = Color.Red) },
                                                        onClick = {
                                                            isMenuExpanded = false
                                                            showDeleteConfirm = member
                                                        },
                                                        leadingIcon = { Icon(Icons.Filled.Delete, null, tint = Color.Red) }
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
        }

        // Floating Action Button
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
                    onClick = {
                        editingMember = null
                        showAddDialog = true
                    },
                    modifier = Modifier.testTag("add_member_fab"),
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                ) {
                    Icon(imageVector = Icons.Filled.Add, contentDescription = "Add Member")
                }
            }
        }
    }

    // --- Add/Edit Member Form Overlay ---
    if (showAddDialog) {
        var registerType by remember { mutableStateOf("Member") } // "Member" or "Trainer"
        var mId by remember { mutableStateOf(editingMember?.memberId ?: "M-${System.currentTimeMillis() % 1000000}${(10..99).random()}") }
        var name by remember { mutableStateOf(editingMember?.name ?: "") }
        var phone by remember { mutableStateOf(editingMember?.phone ?: "+91 ") }
        var email by remember { mutableStateOf(editingMember?.email ?: "") }
        var age by remember { mutableStateOf(editingMember?.age?.toString() ?: "") }
        var gender by remember { mutableStateOf(editingMember?.gender ?: "Male") }
        var selectedPlan by remember { mutableStateOf(plans.find { it.name == editingMember?.membershipPlan } ?: plans.firstOrNull()) }
        var trainerId by remember { mutableStateOf(editingMember?.trainerId ?: trainers.firstOrNull()?.trainerId) }
        var height by remember { mutableStateOf(editingMember?.height?.toString() ?: "175") }
        var weight by remember { mutableStateOf(editingMember?.weight?.toString() ?: "70") }
        var bloodGroup by remember { mutableStateOf(editingMember?.bloodGroup ?: "O+") }
        var notes by remember { mutableStateOf(editingMember?.notes ?: "") }
        var emergencyContact by remember { mutableStateOf(editingMember?.emergencyContact ?: "") }
        var status by remember { mutableStateOf(editingMember?.status ?: "active") }
        var paymentStatus by remember { mutableStateOf(editingMember?.paymentStatus ?: "paid") }
        var billingAmount by remember { mutableStateOf(selectedPlan?.price?.toString() ?: "1999") }
        var paymentMethod by remember { mutableStateOf("Cash") }

        // Member Dates
        var joiningDate by remember { mutableStateOf(editingMember?.joiningDate ?: viewModel.todayDate) }
        var expiryDate by remember {
            mutableStateOf(
                editingMember?.expiryDate ?: run {
                    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                    val cal = Calendar.getInstance()
                    cal.add(Calendar.DAY_OF_YEAR, selectedPlan?.durationDays ?: 30)
                    dateFormat.format(cal.time)
                }
            )
        }

        // Trainer registered states
        var trainerSpecialization by remember { mutableStateOf("") }
        var trainerExperience by remember { mutableStateOf("") }
        var trainerSalary by remember { mutableStateOf("25000") }
        var trainerEmail by remember { mutableStateOf("") }
        var trainerJoiningDate by remember { mutableStateOf(viewModel.todayDate) }

        // --- Redesigned Form Options & State Variables ---
        val goalsList = listOf(
            "🏋 Bodybuilding (Muscle Gain)", "💪 Lean Muscle", "⚖ Weight Loss", "🔥 Fat Loss",
            "🧍 General Fitness", "❤️ Improve Health", "🏃 Endurance Training", "⚡ Athletic Performance",
            "🤸 Flexibility & Mobility", "🧘 Yoga", "🥊 Boxing", "🥋 Martial Arts", "🚴 Cycling",
            "🏊 Swimming", "🏃 Running", "🧗 Functional Fitness", "🧓 Senior Fitness",
            "🤰 Post Pregnancy Fitness", "👦 Teen Fitness", "🎯 Custom Goal"
        )
        
        var fitnessGoal by remember {
            val currentGoal = editingMember?.fitnessGoal ?: "🧍 General Fitness"
            val isPreset = currentGoal in goalsList
            mutableStateOf(if (isPreset) currentGoal else "🎯 Custom Goal")
        }
        var otherCustomGoal by remember {
            val currentGoal = editingMember?.fitnessGoal ?: ""
            mutableStateOf(if (currentGoal !in goalsList) currentGoal else "")
        }
        
        var experience by remember { mutableStateOf(editingMember?.experience ?: "Beginner") }
        
        val trainingPrefOptions = listOf(
            "Gym Machines", "Free Weights", "Home Workout", "Bodyweight Training",
            "CrossFit", "HIIT", "Cardio", "Yoga", "Pilates", "Functional Training",
            "Powerlifting", "Olympic Lifting"
        )
        var selectedTrainingPreferences by remember {
            mutableStateOf(
                editingMember?.trainingPreference?.split(",")?.filter { it.isNotBlank() }?.toSet() ?: emptySet()
            )
        }
        
        var workoutDays by remember { mutableStateOf(editingMember?.workoutDays ?: "3 Days") }
        var workoutDuration by remember { mutableStateOf(editingMember?.workoutDuration ?: "60 Minutes") }
        
        val medicalOptions = listOf(
            "Diabetes", "High Blood Pressure", "Low Blood Pressure", "Heart Disease", "Asthma",
            "Thyroid", "Arthritis", "High Cholesterol", "Kidney Disease", "Liver Disease", "PCOS",
            "Obesity", "Anxiety", "Depression", "None", "Other"
        )
        var selectedMedicalConditions by remember {
            val raw = editingMember?.medicalConditions?.split(",")?.filter { it.isNotBlank() } ?: emptyList()
            val preset = medicalOptions.filter { it != "Other" }
            val selected = raw.filter { it in preset }.toSet()
            mutableStateOf(selected + if (raw.any { it !in preset }) setOf("Other") else emptySet())
        }
        var otherMedicalCondition by remember {
            val raw = editingMember?.medicalConditions?.split(",")?.filter { it.isNotBlank() } ?: emptyList()
            val preset = medicalOptions.filter { it != "Other" }
            mutableStateOf(raw.filter { it !in preset }.joinToString(", "))
        }
        
        val injuryOptions = listOf(
            "Neck Injury", "Shoulder Injury", "Rotator Cuff", "Elbow Injury", "Wrist Injury",
            "Lower Back Pain", "Herniated Disc", "Hip Injury", "Knee Injury", "ACL Injury",
            "Ankle Injury", "Foot Injury", "Muscle Tear", "Surgery History", "No Injuries", "Other"
        )
        var selectedInjuries by remember {
            val raw = editingMember?.injuries?.split(",")?.filter { it.isNotBlank() } ?: emptyList()
            val preset = injuryOptions.filter { it != "Other" }
            val selected = raw.filter { it in preset }.toSet()
            mutableStateOf(selected + if (raw.any { it !in preset }) setOf("Other") else emptySet())
        }
        var otherInjury by remember {
            val raw = editingMember?.injuries?.split(",")?.filter { it.isNotBlank() } ?: emptyList()
            val preset = injuryOptions.filter { it != "Other" }
            mutableStateOf(raw.filter { it !in preset }.joinToString(", "))
        }
        
        var painLevel by remember { mutableStateOf(editingMember?.painLevel?.toFloat() ?: 0f) }
        var doctorRestrictions by remember { mutableStateOf(editingMember?.doctorRestrictions ?: "") }
        
        val allergyOptions = listOf(
            "Milk", "Eggs", "Peanuts", "Tree Nuts", "Soy", "Gluten", "Wheat", "Seafood",
            "Shellfish", "Fish", "Sesame", "None", "Other"
        )
        var selectedAllergies by remember {
            val raw = editingMember?.foodAllergies?.split(",")?.filter { it.isNotBlank() } ?: emptyList()
            val preset = allergyOptions.filter { it != "Other" }
            val selected = raw.filter { it in preset }.toSet()
            mutableStateOf(selected + if (raw.any { it !in preset }) setOf("Other") else emptySet())
        }
        var otherAllergy by remember {
            val raw = editingMember?.foodAllergies?.split(",")?.filter { it.isNotBlank() } ?: emptyList()
            val preset = allergyOptions.filter { it != "Other" }
            mutableStateOf(raw.filter { it !in preset }.joinToString(", "))
        }
        
        var foodsToAvoid by remember { mutableStateOf(editingMember?.foodsToAvoid ?: "") }
        var dietPreference by remember { mutableStateOf(editingMember?.dietPreference ?: "Balanced Diet") }
        var waterIntake by remember { mutableStateOf(editingMember?.waterIntake?.toString() ?: "3") }
        
        var sleepHours by remember { mutableStateOf(editingMember?.sleepHours ?: "7 Hours") }
        var occupation by remember { mutableStateOf(editingMember?.occupation ?: "Office Job") }
        var activityLevel by remember { mutableStateOf(editingMember?.activityLevel ?: "Moderately Active") }
        var stressLevel by remember { mutableStateOf(editingMember?.stressLevel ?: "Medium") }
        var smoking by remember { mutableStateOf(editingMember?.smoking ?: "No") }
        var alcohol by remember { mutableStateOf(editingMember?.alcohol ?: "Never") }
        
        var bodyFat by remember { mutableStateOf(editingMember?.bodyFat?.toString() ?: "") }
        var muscleMass by remember { mutableStateOf(editingMember?.muscleMass?.toString() ?: "") }
        var waist by remember { mutableStateOf(editingMember?.waist?.toString() ?: "") }
        var chest by remember { mutableStateOf(editingMember?.chest?.toString() ?: "") }
        var arms by remember { mutableStateOf(editingMember?.arms?.toString() ?: "") }
        var thighs by remember { mutableStateOf(editingMember?.thighs?.toString() ?: "") }
        var calves by remember { mutableStateOf(editingMember?.calves?.toString() ?: "") }
        var neck by remember { mutableStateOf(editingMember?.neck?.toString() ?: "") }
        var restingHeartRate by remember { mutableStateOf(editingMember?.restingHeartRate?.toString() ?: "") }
        var bloodPressure by remember { mutableStateOf(editingMember?.bloodPressure ?: "") }
        
        var specialInstructions by remember { mutableStateOf(editingMember?.specialInstructions ?: "") }
        
        // Collapsible section visibility
        var basicSectionExpanded by remember { mutableStateOf(true) }
        var fitnessSectionExpanded by remember { mutableStateOf(false) }
        var medicalSectionExpanded by remember { mutableStateOf(false) }
        var nutritionSectionExpanded by remember { mutableStateOf(false) }
        var lifestyleSectionExpanded by remember { mutableStateOf(false) }
        var measurementsSectionExpanded by remember { mutableStateOf(false) }

        // Recalculate Member Expiry Date automatically when Plan or Joining Date changes (reactive/responsive UX)
        LaunchedEffect(joiningDate, selectedPlan) {
            if (editingMember == null && selectedPlan != null) {
                try {
                    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                    val parsedDate = dateFormat.parse(joiningDate) ?: Date()
                    val cal = Calendar.getInstance()
                    cal.time = parsedDate
                    cal.add(Calendar.DAY_OF_YEAR, selectedPlan!!.durationDays)
                    expiryDate = dateFormat.format(cal.time)
                } catch (e: Exception) {
                    // Ignore parsing issues
                }
            }
        }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.95f),
            title = {
                Text(
                    text = if (editingMember == null) "Register New $registerType" else "Edit Member: ${editingMember!!.name}",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Only show Role Selector if registering a NEW user (not editing an existing Member)
                    if (editingMember == null) {
                        Text("Choose Registration Role", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Button(
                                onClick = { registerType = "Member" },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("role_member_btn"),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (registerType == "Member") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                                )
                            ) {
                                Text(
                                    text = "Member",
                                    color = if (registerType == "Member") Color.White else MaterialTheme.colorScheme.onSurface,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Button(
                                onClick = { registerType = "Trainer" },
                                modifier = Modifier
                                    .weight(1f)
                                    .testTag("role_trainer_btn"),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (registerType == "Trainer") MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
                                )
                            ) {
                                Text(
                                    text = "Trainer",
                                    color = if (registerType == "Trainer") Color.White else MaterialTheme.colorScheme.onSurface,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                    }

                    if (registerType == "Member") {
                        Text(
                            text = "Fill all appropriate metrics so AI Smart Coach can compile fully customized workout, diet, and recovery schedules.",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )

                        // -------------------------------------------------------------
                        // SECTION 1: BASIC PROFILE INFORMATION
                        // -------------------------------------------------------------
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { basicSectionExpanded = !basicSectionExpanded }
                                        .padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(Icons.Default.Person, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        Text("1. Basic Profile Information", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                    }
                                    val rotation by animateFloatAsState(if (basicSectionExpanded) 180f else 0f)
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = null,
                                        modifier = Modifier.graphicsLayer(rotationZ = rotation)
                                    )
                                }
                                
                                AnimatedVisibility(visible = basicSectionExpanded) {
                                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                        OutlinedTextField(
                                            value = name,
                                            onValueChange = { name = it },
                                            label = { Text("Full Name *") },
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .testTag("member_name_input"),
                                            singleLine = true
                                        )

                                        OutlinedTextField(
                                            value = phone,
                                            onValueChange = { phone = it },
                                            label = { Text("Phone Number *") },
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .testTag("member_phone_input"),
                                            singleLine = true
                                        )

                                        OutlinedTextField(
                                            value = email,
                                            onValueChange = { email = it },
                                            label = { Text("Email Address") },
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .testTag("member_email_input"),
                                            singleLine = true
                                        )

                                        Text("Gender *", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                                        ) {
                                            listOf("Male", "Female", "Other").forEach { g ->
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    modifier = Modifier.clickable { gender = g }
                                                ) {
                                                    RadioButton(selected = gender == g, onClick = { gender = g })
                                                    Text(g, style = MaterialTheme.typography.bodyMedium)
                                                }
                                            }
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            OutlinedTextField(
                                                value = age,
                                                onValueChange = { age = it },
                                                label = { Text("Age *") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .testTag("member_age_input"),
                                                singleLine = true
                                            )
                                            OutlinedTextField(
                                                value = height,
                                                onValueChange = { height = it },
                                                label = { Text("Height (cm) *") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .testTag("member_height_input"),
                                                singleLine = true
                                            )
                                            OutlinedTextField(
                                                value = weight,
                                                onValueChange = { weight = it },
                                                label = { Text("Weight (kg) *") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .testTag("member_weight_input"),
                                                singleLine = true
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            OutlinedTextField(
                                                value = bloodGroup,
                                                onValueChange = { bloodGroup = it },
                                                label = { Text("Blood Group") },
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .testTag("member_blood_group_input"),
                                                singleLine = true
                                            )
                                            OutlinedTextField(
                                                value = emergencyContact,
                                                onValueChange = { emergencyContact = it },
                                                label = { Text("Emergency Contact") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                                modifier = Modifier
                                                    .weight(1.5f)
                                                    .testTag("member_emergency_contact_input"),
                                                singleLine = true
                                            )
                                        }

                                        Text("Select Membership Plan *", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .horizontalScroll(rememberScrollState()),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            plans.forEach { p ->
                                                FilterChip(
                                                    selected = selectedPlan?.planId == p.planId,
                                                    onClick = {
                                                        selectedPlan = p
                                                        billingAmount = p.price.toString()
                                                    },
                                                    label = { Text("${p.name} (${currency}${p.price})") }
                                                )
                                            }
                                        }

                                        Text("Assign Personal Trainer", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .horizontalScroll(rememberScrollState()),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            FilterChip(
                                                selected = trainerId == null,
                                                onClick = { trainerId = null },
                                                label = { Text("No Assigned Trainer") }
                                            )
                                            trainers.forEach { t ->
                                                FilterChip(
                                                    selected = trainerId == t.trainerId,
                                                    onClick = { trainerId = t.trainerId },
                                                    label = { Text(t.name) }
                                                )
                                            }
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            OutlinedTextField(
                                                value = joiningDate,
                                                onValueChange = { joiningDate = it },
                                                label = { Text("Joining Date (YYYY-MM-DD) *") },
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .testTag("member_joining_date_input"),
                                                singleLine = true
                                            )
                                            OutlinedTextField(
                                                value = expiryDate,
                                                onValueChange = { expiryDate = it },
                                                label = { Text("Expiry Date (YYYY-MM-DD)") },
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .testTag("member_expiry_date_input"),
                                                singleLine = true,
                                                readOnly = true
                                            )
                                        }

                                        // Only show payment setup if creating a new member
                                        if (editingMember == null) {
                                            Text("Initial Billing Configuration", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                            
                                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                OutlinedTextField(
                                                    value = billingAmount,
                                                    onValueChange = { billingAmount = it },
                                                    label = { Text("Billing Amount *") },
                                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                    modifier = Modifier
                                                        .weight(1f)
                                                        .testTag("member_billing_amount_input"),
                                                    singleLine = true
                                                )
                                                OutlinedTextField(
                                                    value = paymentMethod,
                                                    onValueChange = { paymentMethod = it },
                                                    label = { Text("Payment Method") },
                                                    placeholder = { Text("Cash, Card, UPI...") },
                                                    modifier = Modifier
                                                        .weight(1f)
                                                        .testTag("member_payment_method_input"),
                                                    singleLine = true
                                                )
                                            }

                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.spacedBy(16.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text("Mark Immediately as Paid?", style = MaterialTheme.typography.bodyMedium)
                                                Switch(
                                                    checked = paymentStatus == "paid",
                                                    onCheckedChange = { paymentStatus = if (it) "paid" else "pending" }
                                                )
                                            }
                                        } else {
                                            // Edit status of member
                                            Text("Membership Status", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                                            ) {
                                                listOf("active", "expired", "frozen").forEach { s ->
                                                    FilterChip(
                                                        selected = status == s,
                                                        onClick = { status = s },
                                                        label = { Text(s.uppercase(Locale.getDefault())) }
                                                    )
                                                }
                                            }
                                        }

                                        OutlinedTextField(
                                            value = notes,
                                            onValueChange = { notes = it },
                                            label = { Text("General Notes / Receptionist Remarks") },
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .testTag("member_general_notes_input"),
                                            minLines = 2
                                        )
                                    }
                                }
                            }
                        }

                        // -------------------------------------------------------------
                        // SECTION 2: PRIMARY FITNESS GOAL & SCHEDULE
                        // -------------------------------------------------------------
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { fitnessSectionExpanded = !fitnessSectionExpanded }
                                        .padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(Icons.Default.Star, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        Text("2. Fitness Goals & Preferences", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                    }
                                    val rotation by animateFloatAsState(if (fitnessSectionExpanded) 180f else 0f)
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = null,
                                        modifier = Modifier.graphicsLayer(rotationZ = rotation)
                                    )
                                }

                                AnimatedVisibility(visible = fitnessSectionExpanded) {
                                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                        Text("Primary Fitness Goal (Select One) *", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        FlowRow(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            goalsList.forEach { goalOption ->
                                                FilterChip(
                                                    selected = fitnessGoal == goalOption,
                                                    onClick = { fitnessGoal = goalOption },
                                                    label = { Text(goalOption, style = MaterialTheme.typography.bodySmall) }
                                                )
                                            }
                                        }

                                        if (fitnessGoal == "🎯 Custom Goal") {
                                            OutlinedTextField(
                                                value = otherCustomGoal,
                                                onValueChange = { otherCustomGoal = it },
                                                label = { Text("Specify Custom Fitness Goal *") },
                                                modifier = Modifier.fillMaxWidth(),
                                                singleLine = true
                                            )
                                        }

                                        Text("Fitness Experience Level", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .horizontalScroll(rememberScrollState()),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            listOf("Beginner", "Intermediate", "Advanced", "Professional Athlete").forEach { exp ->
                                                FilterChip(
                                                    selected = experience == exp,
                                                    onClick = { experience = exp },
                                                    label = { Text(exp) }
                                                )
                                            }
                                        }

                                        Text("Training Preferences (Select Multiple)", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        FlowRow(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            trainingPrefOptions.forEach { pref ->
                                                val isSelected = selectedTrainingPreferences.contains(pref)
                                                FilterChip(
                                                    selected = isSelected,
                                                    onClick = {
                                                        selectedTrainingPreferences = if (isSelected) {
                                                            selectedTrainingPreferences - pref
                                                        } else {
                                                            selectedTrainingPreferences + pref
                                                        }
                                                    },
                                                    label = { Text(pref, style = MaterialTheme.typography.bodySmall) }
                                                )
                                            }
                                        }

                                        Text("Weekly Workout Frequency", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .horizontalScroll(rememberScrollState()),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            listOf("2 Days", "3 Days", "4 Days", "5 Days", "6 Days", "Everyday").forEach { day ->
                                                FilterChip(
                                                    selected = workoutDays == day,
                                                    onClick = { workoutDays = day },
                                                    label = { Text(day) }
                                                )
                                            }
                                        }

                                        Text("Ideal Session Duration", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .horizontalScroll(rememberScrollState()),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            listOf("30 Minutes", "45 Minutes", "60 Minutes", "90 Minutes", "120 Minutes").forEach { dur ->
                                                FilterChip(
                                                    selected = workoutDuration == dur,
                                                    onClick = { workoutDuration = dur },
                                                    label = { Text(dur) }
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // -------------------------------------------------------------
                        // SECTION 3: MEDICAL & HEALTH CONDITIONS
                        // -------------------------------------------------------------
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { medicalSectionExpanded = !medicalSectionExpanded }
                                        .padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        Text("3. Medical & Health Conditions", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                    }
                                    val rotation by animateFloatAsState(if (medicalSectionExpanded) 180f else 0f)
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = null,
                                        modifier = Modifier.graphicsLayer(rotationZ = rotation)
                                    )
                                }

                                AnimatedVisibility(visible = medicalSectionExpanded) {
                                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                        Text("Existing Medical Conditions", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        FlowRow(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            medicalOptions.forEach { cond ->
                                                val isSelected = selectedMedicalConditions.contains(cond)
                                                FilterChip(
                                                    selected = isSelected,
                                                    onClick = {
                                                        selectedMedicalConditions = if (isSelected) {
                                                            selectedMedicalConditions - cond
                                                        } else {
                                                            selectedMedicalConditions + cond
                                                        }
                                                    },
                                                    label = { Text(cond, style = MaterialTheme.typography.bodySmall) }
                                                )
                                            }
                                        }

                                        if (selectedMedicalConditions.contains("Other")) {
                                            OutlinedTextField(
                                                value = otherMedicalCondition,
                                                onValueChange = { otherMedicalCondition = it },
                                                label = { Text("Specify Other Medical Conditions") },
                                                modifier = Modifier.fillMaxWidth(),
                                                singleLine = true
                                            )
                                        }

                                        Text("Previous/Existing Injuries", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        FlowRow(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            injuryOptions.forEach { inj ->
                                                val isSelected = selectedInjuries.contains(inj)
                                                FilterChip(
                                                    selected = isSelected,
                                                    onClick = {
                                                        selectedInjuries = if (isSelected) {
                                                            selectedInjuries - inj
                                                        } else {
                                                            selectedInjuries + inj
                                                        }
                                                    },
                                                    label = { Text(inj, style = MaterialTheme.typography.bodySmall) }
                                                )
                                            }
                                        }

                                        if (selectedInjuries.contains("Other")) {
                                            OutlinedTextField(
                                                value = otherInjury,
                                                onValueChange = { otherInjury = it },
                                                label = { Text("Specify Other Injuries") },
                                                modifier = Modifier.fillMaxWidth(),
                                                singleLine = true
                                            )
                                        }

                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.12f)),
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Column(modifier = Modifier.padding(10.dp)) {
                                                Row(
                                                    modifier = Modifier.fillMaxWidth(),
                                                    horizontalArrangement = Arrangement.SpaceBetween,
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Text("Current Self-Reported Pain Level", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                                    Card(
                                                        colors = CardDefaults.cardColors(
                                                            containerColor = if (painLevel > 6f) MaterialTheme.colorScheme.error else if (painLevel > 3f) MaterialTheme.colorScheme.tertiary else MaterialTheme.colorScheme.primary
                                                        )
                                                    ) {
                                                        Text("${painLevel.toInt()}/10", modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), color = Color.White, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                                                    }
                                                }
                                                Slider(
                                                    value = painLevel,
                                                    onValueChange = { painLevel = it },
                                                    valueRange = 0f..10f,
                                                    steps = 9,
                                                    modifier = Modifier.fillMaxWidth()
                                                )
                                                Text(
                                                    text = when (painLevel.toInt()) {
                                                        0 -> "No Pain 🟢"
                                                        in 1..3 -> "Mild Pain 🟡"
                                                        in 4..6 -> "Moderate Pain 🟠"
                                                        else -> "Severe Pain 🔴 - Take extreme precautions"
                                                    },
                                                    style = MaterialTheme.typography.bodySmall,
                                                    fontWeight = FontWeight.Bold,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }

                                        OutlinedTextField(
                                            value = doctorRestrictions,
                                            onValueChange = { doctorRestrictions = it },
                                            label = { Text("Physician/Doctor Restrictions (if any)") },
                                            placeholder = { Text("e.g. Avoid squatting, avoid spinal compression, lower cardiovascular intensity...") },
                                            modifier = Modifier.fillMaxWidth(),
                                            minLines = 2
                                        )
                                    }
                                }
                            }
                        }

                        // -------------------------------------------------------------
                        // SECTION 4: FOOD & NUTRITION RESTRICTIONS
                        // -------------------------------------------------------------
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { nutritionSectionExpanded = !nutritionSectionExpanded }
                                        .padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(Icons.Default.List, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        Text("4. Food & Nutrition Restrictions", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                    }
                                    val rotation by animateFloatAsState(if (nutritionSectionExpanded) 180f else 0f)
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = null,
                                        modifier = Modifier.graphicsLayer(rotationZ = rotation)
                                    )
                                }

                                AnimatedVisibility(visible = nutritionSectionExpanded) {
                                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                        Text("Food Allergies (Select Multiple)", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        FlowRow(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            allergyOptions.forEach { alg ->
                                                val isSelected = selectedAllergies.contains(alg)
                                                FilterChip(
                                                    selected = isSelected,
                                                    onClick = {
                                                        selectedAllergies = if (isSelected) {
                                                            selectedAllergies - alg
                                                        } else {
                                                            selectedAllergies + alg
                                                        }
                                                    },
                                                    label = { Text(alg, style = MaterialTheme.typography.bodySmall) }
                                                )
                                            }
                                        }

                                        if (selectedAllergies.contains("Other")) {
                                            OutlinedTextField(
                                                value = otherAllergy,
                                                onValueChange = { otherAllergy = it },
                                                label = { Text("Specify Other Food Allergies") },
                                                modifier = Modifier.fillMaxWidth(),
                                                singleLine = true
                                            )
                                        }

                                        OutlinedTextField(
                                            value = foodsToAvoid,
                                            onValueChange = { foodsToAvoid = it },
                                            label = { Text("Foods They Cannot Eat / Avoid") },
                                            placeholder = { Text("e.g. No Beef, No Pork, avoid deep fried foods, dislikes broccoli...") },
                                            modifier = Modifier.fillMaxWidth(),
                                            minLines = 2
                                        )

                                        Text("Dietary Preference", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        FlowRow(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                                            verticalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            listOf("Vegetarian", "Vegan", "Eggetarian", "Jain", "Non-Vegetarian", "Keto", "Paleo", "Mediterranean", "High Protein", "Low Carb", "Low Fat", "Balanced Diet", "Custom").forEach { diet ->
                                                FilterChip(
                                                    selected = dietPreference == diet,
                                                    onClick = { dietPreference = diet },
                                                    label = { Text(diet, style = MaterialTheme.typography.bodySmall) }
                                                )
                                            }
                                        }

                                        OutlinedTextField(
                                            value = waterIntake,
                                            onValueChange = { waterIntake = it },
                                            label = { Text("Current Daily Water Intake (Litres)") },
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                            modifier = Modifier.fillMaxWidth(),
                                            singleLine = true
                                        )
                                    }
                                }
                            }
                        }

                        // -------------------------------------------------------------
                        // SECTION 5: LIFESTYLE & HABITS
                        // -------------------------------------------------------------
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { lifestyleSectionExpanded = !lifestyleSectionExpanded }
                                        .padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(Icons.Default.Settings, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        Text("5. Lifestyle & Habits", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                    }
                                    val rotation by animateFloatAsState(if (lifestyleSectionExpanded) 180f else 0f)
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = null,
                                        modifier = Modifier.graphicsLayer(rotationZ = rotation)
                                    )
                                }

                                AnimatedVisibility(visible = lifestyleSectionExpanded) {
                                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                        Text("Sleep Level (per Night)", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .horizontalScroll(rememberScrollState()),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            listOf("Less than 5 Hours", "6 Hours", "7 Hours", "8 Hours", "9+ Hours").forEach { hour ->
                                                FilterChip(
                                                    selected = sleepHours == hour,
                                                    onClick = { sleepHours = hour },
                                                    label = { Text(hour) }
                                                )
                                            }
                                        }

                                        Text("Occupation Category", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .horizontalScroll(rememberScrollState()),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            listOf("Student", "Office Job", "Manual Labour", "Driver", "Athlete", "Homemaker", "Business", "Other").forEach { occ ->
                                                FilterChip(
                                                    selected = occupation == occ,
                                                    onClick = { occupation = occ },
                                                    label = { Text(occ) }
                                                )
                                            }
                                        }

                                        Text("Daily Activity Level", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .horizontalScroll(rememberScrollState()),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            listOf("Sedentary", "Lightly Active", "Moderately Active", "Very Active").forEach { act ->
                                                FilterChip(
                                                    selected = activityLevel == act,
                                                    onClick = { activityLevel = act },
                                                    label = { Text(act) }
                                                )
                                            }
                                        }

                                        Text("Daily Stress Level", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            listOf("Low", "Medium", "High").forEach { stress ->
                                                FilterChip(
                                                    selected = stressLevel == stress,
                                                    onClick = { stressLevel = stress },
                                                    modifier = Modifier.weight(1f),
                                                    label = { Text(stress, modifier = Modifier.fillMaxWidth(), style = MaterialTheme.typography.bodyMedium.copy(textAlign = androidx.compose.ui.text.style.TextAlign.Center)) }
                                                )
                                            }
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text("Smoking Status", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                    listOf("Yes", "No").forEach { smok ->
                                                        FilterChip(
                                                            selected = smoking == smok,
                                                            onClick = { smoking = smok },
                                                            label = { Text(smok) }
                                                        )
                                                    }
                                                }
                                            }
                                            Column(modifier = Modifier.weight(1.5f)) {
                                                Text("Alcohol Frequency", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                                Row(
                                                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    listOf("Never", "Occasionally", "Weekly", "Frequently").forEach { alc ->
                                                        FilterChip(
                                                            selected = alcohol == alc,
                                                            onClick = { alcohol = alc },
                                                            label = { Text(alc) }
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // -------------------------------------------------------------
                        // SECTION 6: MEASUREMENTS & AI INSTRUCTIONS
                        // -------------------------------------------------------------
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { measurementsSectionExpanded = !measurementsSectionExpanded }
                                        .padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Icon(Icons.Default.Edit, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        Text("6. Body Metrics & AI Instructions", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                                    }
                                    val rotation by animateFloatAsState(if (measurementsSectionExpanded) 180f else 0f)
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = null,
                                        modifier = Modifier.graphicsLayer(rotationZ = rotation)
                                    )
                                }

                                AnimatedVisibility(visible = measurementsSectionExpanded) {
                                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                        val heightVal = height.toDoubleOrNull() ?: 175.0
                                        val weightVal = weight.toDoubleOrNull() ?: 70.0
                                        val bmiVal = Member.calculateBmi(heightVal, weightVal)
                                        val bmiCat = Member.getBmiCategory(bmiVal)

                                        Card(
                                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(12.dp).fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Column {
                                                    Text("Calculated Body Mass Index (BMI)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f))
                                                    Text("$bmiVal", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onPrimaryContainer)
                                                }
                                                Card(
                                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                                                    shape = RoundedCornerShape(8.dp)
                                                ) {
                                                    Text(
                                                        text = bmiCat,
                                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                                        color = Color.White,
                                                        style = MaterialTheme.typography.labelMedium,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                }
                                            }
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                            OutlinedTextField(
                                                value = bodyFat,
                                                onValueChange = { bodyFat = it },
                                                label = { Text("Body Fat %") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                singleLine = true
                                            )
                                            OutlinedTextField(
                                                value = muscleMass,
                                                onValueChange = { muscleMass = it },
                                                label = { Text("Muscle Mass (kg)") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                singleLine = true
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                            OutlinedTextField(
                                                value = chest,
                                                onValueChange = { chest = it },
                                                label = { Text("Chest Circumference (cm)") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                singleLine = true
                                            )
                                            OutlinedTextField(
                                                value = waist,
                                                onValueChange = { waist = it },
                                                label = { Text("Waist Circumference (cm)") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                singleLine = true
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                            OutlinedTextField(
                                                value = arms,
                                                onValueChange = { arms = it },
                                                label = { Text("Arm Size (cm)") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                singleLine = true
                                            )
                                            OutlinedTextField(
                                                value = thighs,
                                                onValueChange = { thighs = it },
                                                label = { Text("Thigh Size (cm)") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                singleLine = true
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                            OutlinedTextField(
                                                value = calves,
                                                onValueChange = { calves = it },
                                                label = { Text("Calf Size (cm)") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                singleLine = true
                                            )
                                            OutlinedTextField(
                                                value = neck,
                                                onValueChange = { neck = it },
                                                label = { Text("Neck Size (cm)") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                singleLine = true
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                            OutlinedTextField(
                                                value = restingHeartRate,
                                                onValueChange = { restingHeartRate = it },
                                                label = { Text("Resting Heart Rate (bpm)") },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                singleLine = true
                                            )
                                            OutlinedTextField(
                                                value = bloodPressure,
                                                onValueChange = { bloodPressure = it },
                                                label = { Text("Blood Pressure (e.g. 120/80)") },
                                                modifier = Modifier.weight(1f),
                                                singleLine = true
                                            )
                                        }

                                        OutlinedTextField(
                                            value = specialInstructions,
                                            onValueChange = { specialInstructions = it },
                                            label = { Text("AI Smart Coach Direct Instructions") },
                                            placeholder = { Text("e.g. Prioritize fat burn around glutes, build cardiovascular endurance for a half-marathon, suggest high-calcium options...") },
                                            modifier = Modifier.fillMaxWidth(),
                                            minLines = 3
                                        )
                                    }
                                }
                            }
                        }
                    } else {
                        // Save Trainer Staff (Keep simple default trainer fields intact)
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Trainer Full Name *") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("trainer_name_input"),
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text("Trainer Phone *") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("trainer_phone_input"),
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = trainerEmail,
                            onValueChange = { trainerEmail = it },
                            label = { Text("Trainer Email Address *") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("trainer_email_input"),
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = trainerSpecialization,
                            onValueChange = { trainerSpecialization = it },
                            label = { Text("Specialization (e.g., CrossFit, Bodybuilding)") },
                            placeholder = { Text("CrossFit, Powerlifting, Yoga...") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("trainer_specialization_input"),
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = trainerSalary,
                            onValueChange = { trainerSalary = it },
                            label = { Text("Monthly Base Salary *") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("trainer_salary_input"),
                            singleLine = true
                        )

                        OutlinedTextField(
                            value = trainerJoiningDate,
                            onValueChange = { trainerJoiningDate = it },
                            label = { Text("Trainer Joining Date *") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("trainer_joining_date_input"),
                            singleLine = true
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (registerType == "Member") {
                            if (name.isNotBlank() && phone.isNotBlank() && selectedPlan != null) {
                                val planObj = selectedPlan!!

                                val calculatedBmiVal = Member.calculateBmi(
                                    height.toDoubleOrNull() ?: 175.0,
                                    weight.toDoubleOrNull() ?: 70.0
                                )
                                val calculatedBmiCatVal = Member.getBmiCategory(calculatedBmiVal)

                                // Gather fitness goal custom vs list choice
                                val resolvedFitnessGoal = if (fitnessGoal == "🎯 Custom Goal") {
                                    otherCustomGoal.ifBlank { "🎯 Custom Goal" }
                                } else {
                                    fitnessGoal
                                }

                                val m = Member(
                                    memberId = mId,
                                    name = name,
                                    phone = phone,
                                    email = email,
                                    age = age.toIntOrNull() ?: 25,
                                    gender = gender,
                                    membershipPlan = planObj.name,
                                    joiningDate = joiningDate,
                                    expiryDate = expiryDate,
                                    trainerId = trainerId,
                                    height = height.toDoubleOrNull() ?: 175.0,
                                    weight = weight.toDoubleOrNull() ?: 70.0,
                                    bloodGroup = bloodGroup,
                                    photo = editingMember?.photo ?: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=120",
                                    status = if (editingMember != null) status else "active",
                                    paymentStatus = if (editingMember != null) editingMember!!.paymentStatus else paymentStatus,
                                    notes = notes,
                                    emergencyContact = emergencyContact,
                                    bmi = calculatedBmiVal,
                                    bmiCategory = calculatedBmiCatVal,
                                    
                                    // New Fitness profile fields
                                    fitnessGoal = resolvedFitnessGoal,
                                    experience = experience,
                                    trainingPreference = selectedTrainingPreferences.joinToString(","),
                                    workoutDays = workoutDays,
                                    workoutDuration = workoutDuration,
                                    medicalConditions = (selectedMedicalConditions + if (otherMedicalCondition.isNotBlank()) setOf(otherMedicalCondition) else emptySet()).filter { it.isNotBlank() && it != "Other" }.distinct().joinToString(","),
                                    injuries = (selectedInjuries + if (otherInjury.isNotBlank()) setOf(otherInjury) else emptySet()).filter { it.isNotBlank() && it != "Other" }.distinct().joinToString(","),
                                    painLevel = painLevel.toInt(),
                                    doctorRestrictions = doctorRestrictions,
                                    foodAllergies = (selectedAllergies + if (otherAllergy.isNotBlank()) setOf(otherAllergy) else emptySet()).filter { it.isNotBlank() && it != "Other" }.distinct().joinToString(","),
                                    foodsToAvoid = foodsToAvoid,
                                    dietPreference = dietPreference,
                                    waterIntake = waterIntake.toDoubleOrNull() ?: 3.0,
                                    sleepHours = sleepHours,
                                    occupation = occupation,
                                    activityLevel = activityLevel,
                                    stressLevel = stressLevel,
                                    smoking = smoking,
                                    alcohol = alcohol,
                                    bodyFat = bodyFat.toDoubleOrNull() ?: 0.0,
                                    muscleMass = muscleMass.toDoubleOrNull() ?: 0.0,
                                    waist = waist.toDoubleOrNull() ?: 0.0,
                                    chest = chest.toDoubleOrNull() ?: 0.0,
                                    arms = arms.toDoubleOrNull() ?: 0.0,
                                    thighs = thighs.toDoubleOrNull() ?: 0.0,
                                    calves = calves.toDoubleOrNull() ?: 0.0,
                                    neck = neck.toDoubleOrNull() ?: 0.0,
                                    restingHeartRate = restingHeartRate.toIntOrNull() ?: 0,
                                    bloodPressure = bloodPressure,
                                    specialInstructions = specialInstructions,
                                    createdAt = editingMember?.createdAt ?: viewModel.todayDate,
                                    updatedAt = viewModel.todayDate
                                )

                                viewModel.addOrUpdateMember(
                                    member = m,
                                    initialPaymentMethod = paymentMethod,
                                    initialAmount = billingAmount.toDoubleOrNull() ?: planObj.price
                                )
                                if (editingMember == null) {
                                    newlyRegisteredMember = m
                                }
                                showAddDialog = false
                            } else {
                                viewModel.showFeedback("Please complete Name, Phone, and Membership Plan")
                            }
                        } else {
                            // Save Trainer Staff
                            if (name.isNotBlank() && phone.isNotBlank() && trainerEmail.isNotBlank() && trainerJoiningDate.isNotBlank()) {
                                val trainer = Trainer(
                                    trainerId = "T-${System.currentTimeMillis() % 1000000}${(10..99).random()}",
                                    name = name,
                                    phone = phone,
                                    specialization = trainerSpecialization.ifBlank { "General Fitness Coach" },
                                    experience = 3, // default general experience
                                    salary = trainerSalary.toDoubleOrNull() ?: 25000.0,
                                    photo = "https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=120",
                                    email = trainerEmail,
                                    joiningDate = trainerJoiningDate
                                )
                                viewModel.addOrUpdateTrainer(trainer)
                                newlyRegisteredTrainer = trainer
                                showAddDialog = false
                            } else {
                                viewModel.showFeedback("Please complete Name, Phone, Email, and Joining Date for Trainer")
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(text = if (registerType == "Member") "Save Member" else "Save Trainer", fontWeight = FontWeight.Bold)
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
        val member = showDeleteConfirm!!
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = null },
            title = { Text("Delete Member?", fontWeight = FontWeight.Bold) },
            text = { Text("Are you absolutely sure you want to delete ${member.name}? This is irreversible and will erase all physical metrics.") },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteMember(member.memberId)
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

    // --- Quick Renewal dialog ---
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
                        text = "Instantly renew member. The database transaction extends the expiry date atomically.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )

                    var isPlanExpanded by remember { mutableStateOf(false) }
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedButton(
                            onClick = { isPlanExpanded = true },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(selectedPlanForRenewal?.name ?: "Select Plan")
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
                                Text("Amount", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                Text(
                                    text = "$currency${plan.price}",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("Extension", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                Text(
                                    text = "+${plan.durationDays} Days",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = Color(0xFF10B981)
                                )
                            }
                        }
                    }

                    Text("Payment Method", style = MaterialTheme.typography.labelMedium)
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

    // --- Member QR Pass Dialog ---
    if (memberToShowQr != null) {
        val member = memberToShowQr!!
        AlertDialog(
            onDismissRequest = { memberToShowQr = null },
            title = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Text("⚡ GYM MEMBER ACCESS PASS ⚡", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(member.name, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold))
                    Text("Plan: ${member.membershipPlan}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                }
            },
            text = {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val qrText = remember(member.memberId) {
                        member.memberId
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
                        text = "Member ID: ${member.memberId}",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Expiry Date: ${member.expiryDate}",
                        fontSize = 11.sp,
                        color = if (member.status == "expired") Color.Red else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Share this digital pass with the member. They can scan it at the reception desk to register check-in and check-out.",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
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
                TextButton(onClick = { memberToShowQr = null }) {
                    Text("Close")
                }
            },
            dismissButton = {
                Button(
                    onClick = {
                        val qrText = member.memberId
                        com.example.util.ShareHelper.generateAndShareQrCode(
                            context = context,
                            qrText = qrText,
                            userName = member.name,
                            title = "🏋️ GymMaster Pro - Member Access Pass 🏋️",
                            description = "Here is your Digital Gym Access Pass:",
                            details = "• Member ID: ${member.memberId}\n• Membership Plan: ${member.membershipPlan}\n• Expiry Date: ${member.expiryDate}"
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

    // --- Newly Registered Member Pass Dialog ---
    if (newlyRegisteredMember != null) {
        val member = newlyRegisteredMember!!
        AlertDialog(
            onDismissRequest = { newlyRegisteredMember = null },
            title = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Icon(imageVector = Icons.Filled.CheckCircle, contentDescription = "Success", tint = Color(0xFF10B981), modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Registration Successful!", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF10B981))
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(member.name, style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold))
                    Text("Plan: ${member.membershipPlan}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                }
            },
            text = {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val qrText = remember(member.memberId) {
                        member.memberId
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
                        text = "Member ID: ${member.memberId}",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "You can share this unique digital pass with ${member.name} now! This pass is scanned at the desk to log attendance.",
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
                Button(
                    onClick = { newlyRegisteredMember = null },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF64748B)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Close", fontWeight = FontWeight.Bold, color = Color.White)
                }
            },
            dismissButton = {
                Button(
                    onClick = {
                        val qrText = member.memberId
                        com.example.util.ShareHelper.generateAndShareQrCode(
                            context = context,
                            qrText = qrText,
                            userName = member.name,
                            title = "🏋️ GymMaster Pro - Member Access Pass 🏋️",
                            description = "Here is your Digital Gym Access Pass:",
                            details = "• Member ID: ${member.memberId}\n• Membership Plan: ${member.membershipPlan}\n• Expiry Date: ${member.expiryDate}"
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

    // --- Newly Registered Trainer Pass Dialog ---
    if (newlyRegisteredTrainer != null) {
        val trainer = newlyRegisteredTrainer!!
        AlertDialog(
            onDismissRequest = { newlyRegisteredTrainer = null },
            title = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Icon(imageVector = Icons.Filled.CheckCircle, contentDescription = "Success", tint = Color(0xFF10B981), modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Registration Successful!", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color(0xFF10B981))
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(trainer.name, style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold))
                    Text("Role: Staff (Trainer)", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
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
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "You can share this unique digital pass with ${trainer.name} now! This pass is scanned at the desk to log staff shift attendance.",
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
                Button(
                    onClick = { newlyRegisteredTrainer = null },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF64748B)),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Close", fontWeight = FontWeight.Bold, color = Color.White)
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

// Helper to determine expiry warning color levels
fun getExpiryBadgeColor(expiryDateStr: String, status: String): Color {
    if (status == "frozen") return Color(0xFFF59E0B) // Amber
    val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val today = Date()
    return try {
        val expiryDate = dateFormat.parse(expiryDateStr)
        if (expiryDate == null) {
            Color(0xFF10B981)
        } else if (expiryDate.before(today)) {
            Color(0xFFEF4444) // Expired Red 🔴
        } else {
            val diffMs = expiryDate.time - today.time
            val diffDays = diffMs / (1000 * 60 * 60 * 24)
            if (diffDays <= 3) {
                Color(0xFFF97316) // Expiring soon Orange 🟠
            } else {
                Color(0xFF10B981) // Safe Green 🟢
            }
        }
    } catch (e: Exception) {
        Color(0xFF10B981)
    }
}
