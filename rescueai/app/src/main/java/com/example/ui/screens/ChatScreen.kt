package com.example.ui.screens

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ChatMessageEntity
import com.example.ui.RescueViewModel
import com.example.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun ChatScreen(
    viewModel: RescueViewModel
) {
    val context = LocalContext.current
    val chatMessages by viewModel.chatMessages.collectAsState()
    val isSending by viewModel.isSendingChat.collectAsState()

    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(chatMessages.size) {
        if (chatMessages.isNotEmpty()) {
            listState.animateScrollToItem(chatMessages.size - 1)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(RescueBackground)
            .testTag("chat_screen")
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 110.dp) // space for floating input bar
        ) {
            // Header Active Threat Bar
            Surface(
                color = RescueSurfaceContainer.copy(alpha = 0.9f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(RescueError)
                        )
                        Text(
                            text = "ACTIVE THREAT DETECTED",
                            style = MaterialTheme.typography.labelMedium,
                            color = RescueError,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Surface(
                        color = RescueErrorContainer.copy(alpha = 0.3f),
                        shape = CircleShape
                    ) {
                        Text(
                            text = "MONITORING 124 OAKWOOD AVE",
                            style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                            color = RescueError,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }
            }

            // Chat Messages List
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                items(chatMessages) { message ->
                    ChatMessageBubble(message = message)
                }

                if (isSending) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.padding(start = 8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(RescueSurfaceContainerHighest),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.SmartToy,
                                    contentDescription = "AI Assistant",
                                    tint = RescuePrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                                color = RescuePrimary
                            )
                            Text(
                                text = "RescueAI Neural Processing...",
                                style = MaterialTheme.typography.bodyMedium.copy(fontSize = 12.sp),
                                color = RescueOnSurfaceVariant
                            )
                        }
                    }
                }
            }
        }

        // Floating Bottom Sticky Interaction Area
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            RescueBackground.copy(alpha = 0.95f),
                            RescueBackground
                        )
                    )
                )
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            // Quick Action Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp)
            ) {
                item {
                    SuggestionChip(
                        icon = Icons.Default.WaterDrop,
                        label = "Flooding near me",
                        onClick = {
                            viewModel.sendChatMessage("Are there any flooded roads or rising water notices near 124 Oakwood Ave?")
                        }
                    )
                }
                item {
                    SuggestionChip(
                        icon = Icons.Default.HealthAndSafety,
                        label = "Emergency guidance",
                        onClick = {
                            viewModel.sendChatMessage("What is the immediate safety protocol if flood water reaches my porch?")
                        }
                    )
                }
                item {
                    SuggestionChip(
                        icon = Icons.Default.DirectionsRun,
                        label = "Find safe route",
                        onClick = {
                            viewModel.sendChatMessage("Show me the safest open route to the nearest shelter at City Central Hall.")
                        }
                    )
                }
            }

            // Input Bar
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(28.dp))
                    .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(28.dp)),
                colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainer.copy(alpha = 0.9f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { Toast.makeText(context, "Voice Input Mode Active", Toast.LENGTH_SHORT).show() }) {
                        Icon(Icons.Default.Mic, contentDescription = "Voice Input", tint = RescueOnSurfaceVariant)
                    }
                    IconButton(onClick = { Toast.makeText(context, "Attach Emergency Photo", Toast.LENGTH_SHORT).show() }) {
                        Icon(Icons.Default.Image, contentDescription = "Attach Photo", tint = RescueOnSurfaceVariant)
                    }
                    IconButton(onClick = { Toast.makeText(context, "Location Tagged: 124 Oakwood Ave", Toast.LENGTH_SHORT).show() }) {
                        Icon(Icons.Default.LocationOn, contentDescription = "Location", tint = RescuePrimary)
                    }

                    TextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        placeholder = { Text("Describe emergency...", color = RescueOnSurfaceVariant) },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("chat_input_field"),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color.Transparent,
                            unfocusedContainerColor = Color.Transparent,
                            disabledContainerColor = Color.Transparent,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        singleLine = true
                    )

                    IconButton(
                        onClick = {
                            if (inputText.isNotBlank()) {
                                viewModel.sendChatMessage(inputText)
                                inputText = ""
                            }
                        },
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(RescuePrimary)
                            .testTag("send_message_button")
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "Send", tint = RescueOnPrimary)
                    }
                }
            }
        }
    }
}

@Composable
fun ChatMessageBubble(message: ChatMessageEntity) {
    val isUser = message.sender == "user"

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Top
    ) {
        if (!isUser) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(RescueSurfaceContainerHighest)
                    .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.SmartToy,
                    contentDescription = "AI",
                    tint = RescuePrimary,
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
        }

        Card(
            modifier = Modifier
                .widthIn(max = 300.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 20.dp,
                        topEnd = 20.dp,
                        bottomStart = if (isUser) 20.dp else 4.dp,
                        bottomEnd = if (isUser) 4.dp else 20.dp
                    )
                )
                .border(
                    width = 1.dp,
                    color = if (isUser) Color.Transparent else if (message.hasSafetyProtocols) RescueTertiary else Color.White.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(20.dp)
                ),
            colors = CardDefaults.cardColors(
                containerColor = if (isUser) RescuePrimaryContainer else RescueSurfaceContainer.copy(alpha = 0.9f)
            )
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                if (!isUser && message.hasSafetyProtocols) {
                    Text(
                        text = "IMMEDIATE SAFETY PROTOCOLS",
                        style = MaterialTheme.typography.labelMedium,
                        color = RescueTertiary,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                Text(
                    text = message.message,
                    style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp),
                    color = if (isUser) RescueOnPrimaryContainer else RescueOnSurface
                )

                if (!isUser && message.hasSafetyProtocols) {
                    Spacer(modifier = Modifier.height(12.dp))

                    // Structured guidance cards
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainerLow),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Default.Stairs, contentDescription = "Move Higher", tint = RescueTertiary)
                                Column {
                                    Text("Move Higher", style = MaterialTheme.typography.titleMedium.copy(fontSize = 13.sp), color = RescueTertiary)
                                    Text("Go to highest floor or roof.", style = MaterialTheme.typography.bodyMedium.copy(fontSize = 11.sp), color = RescueOnSurfaceVariant)
                                }
                            }
                        }

                        Card(
                            colors = CardDefaults.cardColors(containerColor = RescueSurfaceContainerLow),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Default.Bolt, contentDescription = "Power Off", tint = RescuePrimary)
                                Column {
                                    Text("Power Off", style = MaterialTheme.typography.titleMedium.copy(fontSize = 13.sp), color = RescuePrimary)
                                    Text("Shut off main electrical breaker if safe.", style = MaterialTheme.typography.bodyMedium.copy(fontSize = 11.sp), color = RescueOnSurfaceVariant)
                                }
                            }
                        }

                        // Danger Callout
                        Card(
                            colors = CardDefaults.cardColors(containerColor = RescueSecondaryContainer.copy(alpha = 0.3f)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(10.dp),
                                verticalAlignment = Alignment.Top,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Default.Warning, contentDescription = "Danger", tint = RescueSecondary)
                                Column {
                                    Text("DANGER", style = MaterialTheme.typography.titleMedium.copy(fontSize = 12.sp), color = RescueSecondary, fontWeight = FontWeight.Bold)
                                    Text("Do not swim or drive through moving flood waters.", style = MaterialTheme.typography.bodyMedium.copy(fontSize = 11.sp), color = RescueOnSecondaryContainer)
                                }
                            }
                        }
                    }
                }

                if (!message.rescueStatus.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Rescue Status: ${message.rescueStatus}",
                        style = MaterialTheme.typography.labelMedium.copy(fontSize = 10.sp),
                        color = RescuePrimary
                    )
                }
            }
        }
    }
}

@Composable
fun SuggestionChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Surface(
        color = RescueSurfaceContainerHigh,
        shape = CircleShape,
        border = ButtonDefaults.outlinedButtonBorder,
        modifier = Modifier.clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(imageVector = icon, contentDescription = label, tint = RescueOnSurface, modifier = Modifier.size(16.dp))
            Text(text = label, style = MaterialTheme.typography.labelMedium, color = RescueOnSurface)
        }
    }
}
