package com.example.ui.screens

import android.content.Intent
import androidx.compose.animation.*
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.data.model.*
import com.example.ui.GymViewModel
import com.example.util.GeminiHelper
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

// Data class to hold Gemini generated plans
data class PremiumAiPlan(
    val warmup: String,
    val strengthTraining: String,
    val cardio: String,
    val core: String,
    val cooldown: String,
    val stretching: String,
    val recoveryTips: String,
    val workoutNotes: String,
    
    val breakfast: String,
    val morningSnack: String,
    val lunch: String,
    val preWorkout: String,
    val postWorkout: String,
    val dinner: String,
    val hydration: String,
    val supplements: String,
    val calories: Int,
    val protein: Int,
    val carbs: Int,
    val fat: Int,
    val nutritionNotes: String,
    
    val goal: String,
    val bmi: Double,
    val confidenceScore: Int,
    val generatedDate: String,
    val healthAdvice: String = "",
    val sleep: String = "",
    val dailyMotivation: String = "",
    val safetyNotes: String = ""
)

@Composable
private fun MemberStatusBadge(status: String, modifier: Modifier = Modifier) {
    val (color, label) = when (status.lowercase()) {
        "active" -> Color(0xFF10B981) to "ACTIVE"
        "expired" -> Color(0xFFEF4444) to "EXPIRED"
        "frozen" -> Color(0xFF3B82F6) to "FROZEN"
        else -> Color(0xFF6B7280) to status.uppercase()
    }
    Box(
        modifier = modifier
            .background(color.copy(alpha = 0.12f), RoundedCornerShape(8.dp))
            .border(BorderStroke(1.dp, color.copy(alpha = 0.3f)), RoundedCornerShape(8.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(color, CircleShape)
            )
            Text(
                text = label,
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemberSelectionDialog(
    isOpen: Boolean,
    onDismiss: () -> Unit,
    members: List<Member>,
    selectedMemberId: String?,
    onSelectMember: (String) -> Unit
) {
    if (!isOpen) return
    
    var searchQuery by remember { mutableStateOf("") }
    val filteredList = remember(members, searchQuery) {
        members.filter {
            it.name.contains(searchQuery, ignoreCase = true) ||
            it.memberId.contains(searchQuery, ignoreCase = true) ||
            it.phone.contains(searchQuery)
        }
    }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Select Gym Member",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 380.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by name, ID, or phone...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Close, contentDescription = "Clear")
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("search_member_input"),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true
                )
                
                if (filteredList.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No matching members found.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(filteredList) { m ->
                            val isSelected = m.memberId == selectedMemberId
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        onSelectMember(m.memberId)
                                        onDismiss()
                                    },
                                shape = RoundedCornerShape(12.dp),
                                border = BorderStroke(
                                    width = if (isSelected) 2.dp else 1.dp,
                                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                                ),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surface
                                )
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    // Avatar
                                    if (!m.photo.isNullOrEmpty()) {
                                        AsyncImage(
                                            model = m.photo,
                                            contentDescription = "Profile Photo",
                                            modifier = Modifier
                                                .size(40.dp)
                                                .clip(CircleShape),
                                            contentScale = ContentScale.Crop
                                        )
                                    } else {
                                        val initial = m.name.firstOrNull()?.uppercase() ?: "?"
                                        Box(
                                            modifier = Modifier
                                                .size(40.dp)
                                                .background(
                                                    Brush.linearGradient(
                                                        listOf(
                                                            MaterialTheme.colorScheme.primary,
                                                            MaterialTheme.colorScheme.secondary
                                                        )
                                                    ),
                                                    CircleShape
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = initial,
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp
                                            )
                                        }
                                    }
                                    
                                    // Details
                                    Column(modifier = Modifier.weight(1f)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Text(
                                                text = m.name,
                                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            if (m.status.lowercase() == "active") {
                                                Box(
                                                    modifier = Modifier
                                                        .size(8.dp)
                                                        .background(Color(0xFF10B981), CircleShape)
                                                )
                                            }
                                        }
                                        Text(
                                            text = "ID: #${m.memberId.take(6).uppercase()}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                    }
                                    
                                    // Status Badge
                                    MemberStatusBadge(status = m.status)
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
fun SegmentedTabRow(
    selectedTab: String,
    onTabSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val tabs = listOf("Workout Plan", "Nutrition Plan")
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(6.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            tabs.forEach { tab ->
                val isSelected = selectedTab == tab
                val backgroundBrush = if (isSelected) {
                    Brush.horizontalGradient(
                        listOf(
                            MaterialTheme.colorScheme.primary,
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.85f)
                        )
                    )
                } else {
                    Brush.horizontalGradient(listOf(Color.Transparent, Color.Transparent))
                }
                
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp)
                        .clip(RoundedCornerShape(22.dp))
                        .background(backgroundBrush)
                        .clickable { onTabSelected(tab) }
                        .testTag(if (tab == "Workout Plan") "workout_tab" else "nutrition_tab"),
                    contentAlignment = Alignment.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = if (tab == "Workout Plan") Icons.Default.FitnessCenter else Icons.Default.Restaurant,
                            contentDescription = null,
                            tint = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = tab,
                            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutDietScreen(viewModel: GymViewModel) {
    val members by viewModel.allMembers.collectAsState()
    val currentUser by viewModel.currentUser.collectAsState()
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val coroutineScope = rememberCoroutineScope()

    var activeTab by remember { mutableStateOf("Workout Plan") } // "Workout Plan" or "Nutrition Plan"
    var selectedMemberId by remember { mutableStateOf<String?>(null) }
    var isMemberSelectorOpen by remember { mutableStateOf(false) }
    var showShareDialog by remember { mutableStateOf(false) }

    // Cached map of session-level generated AI plans to prevent redundant Gemini calls
    val aiPlansCache = remember { mutableStateMapOf<String, PremiumAiPlan>() }

    // Auto-select first member if none selected
    LaunchedEffect(members) {
        if (selectedMemberId == null && members.isNotEmpty()) {
            selectedMemberId = members.first().memberId
        }
    }

    val member = members.find { it.memberId == selectedMemberId }

    // Plans flow from VM
    val workoutPlan by viewModel.getWorkoutForMember(selectedMemberId ?: "").collectAsState(initial = null)
    val dietPlan by viewModel.getDietForMember(selectedMemberId ?: "").collectAsState(initial = null)

    // Form editing states - Workout sections
    var warmup by remember { mutableStateOf("") }
    var strengthTraining by remember { mutableStateOf("") }
    var cardio by remember { mutableStateOf("") }
    var core by remember { mutableStateOf("") }
    var cooldown by remember { mutableStateOf("") }
    var stretching by remember { mutableStateOf("") }
    var recoveryTips by remember { mutableStateOf("") }
    var workoutNotes by remember { mutableStateOf("") }

    // Form editing states - Nutrition sections
    var breakfast by remember { mutableStateOf("") }
    var morningSnack by remember { mutableStateOf("") }
    var lunch by remember { mutableStateOf("") }
    var preWorkout by remember { mutableStateOf("") }
    var postWorkout by remember { mutableStateOf("") }
    var dinner by remember { mutableStateOf("") }
    var hydration by remember { mutableStateOf("") }
    var supplements by remember { mutableStateOf("") }
    var calories by remember { mutableStateOf("2000") }
    var protein by remember { mutableStateOf("120") }
    var carbs by remember { mutableStateOf("150") }
    var fat by remember { mutableStateOf("60") }
    var nutritionNotes by remember { mutableStateOf("") }

    // Sync from local Room database WorkoutPlan
    LaunchedEffect(workoutPlan, selectedMemberId) {
        workoutPlan?.let { plan ->
            try {
                val json = JSONObject(plan.notes)
                warmup = json.optString("warmup")
                strengthTraining = json.optString("strengthTraining")
                cardio = json.optString("cardio")
                core = json.optString("core")
                cooldown = json.optString("cooldown")
                stretching = json.optString("stretching")
                recoveryTips = json.optString("recoveryTips")
                workoutNotes = json.optString("notes")
            } catch (e: Exception) {
                // Backward compatibility mapping
                warmup = plan.monday
                strengthTraining = plan.tuesday
                cardio = plan.wednesday
                core = plan.thursday
                cooldown = plan.friday
                stretching = ""
                recoveryTips = ""
                workoutNotes = plan.notes
            }
        } ?: run {
            warmup = ""
            strengthTraining = ""
            cardio = ""
            core = ""
            cooldown = ""
            stretching = ""
            recoveryTips = ""
            workoutNotes = ""
        }
    }

    // Sync from local Room database DietPlan
    LaunchedEffect(dietPlan, selectedMemberId) {
        dietPlan?.let { plan ->
            try {
                val json = JSONObject(plan.notes)
                breakfast = json.optString("breakfast")
                morningSnack = json.optString("morningSnack")
                lunch = json.optString("lunch")
                preWorkout = json.optString("preWorkout")
                postWorkout = json.optString("postWorkout")
                dinner = json.optString("dinner")
                hydration = json.optString("hydration")
                supplements = json.optString("supplements")
                calories = json.optString("calories", plan.calories.toString())
                protein = json.optString("protein", plan.protein.toString())
                carbs = json.optString("carbohydrates", "150")
                fat = json.optString("fat", "60")
                nutritionNotes = json.optString("notes")
            } catch (e: Exception) {
                breakfast = plan.breakfast
                morningSnack = ""
                lunch = plan.lunch
                preWorkout = ""
                postWorkout = ""
                dinner = plan.dinner
                hydration = ""
                supplements = ""
                calories = plan.calories.toString()
                protein = plan.protein.toString()
                carbs = "150"
                fat = "60"
                nutritionNotes = plan.notes
            }
        } ?: run {
            breakfast = ""
            morningSnack = ""
            lunch = ""
            preWorkout = ""
            postWorkout = ""
            dinner = ""
            hydration = ""
            supplements = ""
            calories = "2000"
            protein = "120"
            carbs = "150"
            fat = "60"
            nutritionNotes = ""
        }
    }

    var generatedPlan by remember { mutableStateOf<PremiumAiPlan?>(null) }

    // Sync generatedPlan with session-level cache to prevent unnecessary Gemini requests
    LaunchedEffect(selectedMemberId) {
        generatedPlan = selectedMemberId?.let { aiPlansCache[it] }
    }

    LaunchedEffect(generatedPlan, selectedMemberId) {
        selectedMemberId?.let { mId ->
            if (generatedPlan != null) {
                aiPlansCache[mId] = generatedPlan!!
            } else {
                aiPlansCache.remove(mId)
            }
        }
    }
    var localAiLoading by remember { mutableStateOf(false) }
    var aiProgressStep by remember { mutableStateOf("") }
    var aiErrorMessage by remember { mutableStateOf<String?>(null) }

    val canEdit = currentUser?.role == "owner" || currentUser?.role == "trainer"

    fun savePlanToDatabase(memberId: String) {
        if (!canEdit) return
        val currentMember = member ?: return
        
        // 1. Workout Plan Pack
        val workoutPlanJson = JSONObject().apply {
            put("warmup", warmup)
            put("strengthTraining", strengthTraining)
            put("cardio", cardio)
            put("core", core)
            put("cooldown", cooldown)
            put("stretching", stretching)
            put("recoveryTips", recoveryTips)
            put("notes", workoutNotes)
        }
        val w = WorkoutPlan(
            memberId = memberId,
            monday = warmup,
            tuesday = strengthTraining,
            wednesday = cardio,
            thursday = core,
            friday = cooldown,
            notes = workoutPlanJson.toString()
        )
        viewModel.saveWorkoutPlan(w)

        // 2. Diet Plan Pack
        val dietPlanJson = JSONObject().apply {
            put("breakfast", breakfast)
            put("morningSnack", morningSnack)
            put("lunch", lunch)
            put("preWorkout", preWorkout)
            put("postWorkout", postWorkout)
            put("dinner", dinner)
            put("hydration", hydration)
            put("supplements", supplements)
            put("calories", calories)
            put("protein", protein)
            put("carbohydrates", carbs)
            put("fat", fat)
            put("notes", nutritionNotes)
        }
        val d = DietPlan(
            memberId = memberId,
            breakfast = breakfast,
            lunch = lunch,
            dinner = dinner,
            snacks = morningSnack,
            calories = calories.trim().toIntOrNull() ?: 2000,
            protein = protein.trim().toIntOrNull() ?: 120,
            notes = dietPlanJson.toString()
        )
        viewModel.saveDietPlan(d)

        // 3. Firestore Sync
        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val planMap = hashMapOf(
                "memberId" to memberId,
                "provider" to "Gemini",
                "model" to "gemini-2.5-flash-lite",
                "generatedAt" to System.currentTimeMillis(),
                "workoutPlan" to hashMapOf(
                    "warmup" to warmup,
                    "strengthTraining" to strengthTraining,
                    "cardio" to cardio,
                    "core" to core,
                    "cooldown" to cooldown,
                    "stretching" to stretching,
                    "recoveryTips" to recoveryTips,
                    "notes" to workoutNotes
                ),
                "nutritionPlan" to hashMapOf(
                    "breakfast" to breakfast,
                    "morningSnack" to morningSnack,
                    "lunch" to lunch,
                    "preWorkout" to preWorkout,
                    "postWorkout" to postWorkout,
                    "dinner" to dinner,
                    "hydration" to hydration,
                    "supplements" to supplements,
                    "calories" to (calories.toIntOrNull() ?: 2000),
                    "protein" to (protein.toIntOrNull() ?: 120),
                    "carbohydrates" to (carbs.toIntOrNull() ?: 150),
                    "fat" to (fat.toIntOrNull() ?: 60),
                    "notes" to nutritionNotes
                ),
                "createdAt" to System.currentTimeMillis(),
                "updatedAt" to System.currentTimeMillis(),
                "trainerId" to (currentMember.trainerId ?: ""),
                "aiGenerated" to (generatedPlan != null),
                "version" to 1,
                "goal" to (generatedPlan?.goal ?: "Fit Conditioning"),
                "bmi" to currentMember.bmi,
                "healthAdvice" to (generatedPlan?.healthAdvice ?: ""),
                "sleep" to (generatedPlan?.sleep ?: ""),
                "dailyMotivation" to (generatedPlan?.dailyMotivation ?: ""),
                "safetyNotes" to (generatedPlan?.safetyNotes ?: "")
            )
            db.collection("coach_plans").document(memberId).set(planMap)
                .addOnSuccessListener {
                    viewModel.showFeedback("Successfully synced plan to legacy coach_plans")
                }

            val adminUid = currentUser?.uid ?: "default_owner"
            val membersRef = db.collection("admins").document(adminUid).collection("members").document(memberId)
            
            // 1. Save to subcollection "aiPlan" as "plan_data"
            membersRef.collection("aiPlan").document("plan_data").set(planMap)
                .addOnSuccessListener {
                    viewModel.showFeedback("Successfully synced plan to admins/$adminUid/members/$memberId/aiPlan/plan_data")
                }
            
            // 2. Save to subcollection "aiPlan" as "current"
            membersRef.collection("aiPlan").document("current").set(planMap)

            // 3. Update parent member document field "aiPlan"
            membersRef.update("aiPlan", planMap)
        } catch (e: Exception) {
            viewModel.showFeedback("Saved locally. Firestore is offline.")
        }
    }

    fun generatePremiumCoachPlan(m: Member) {
        coroutineScope.launch {
            localAiLoading = true
            aiErrorMessage = null
            // DO NOT clear generatedPlan = null, keeping previously generated plans visible if generation fails.
            
            try {
                aiProgressStep = "Connecting..."
                delay(800)
                
                aiProgressStep = "Preparing Member..."
                delay(800)
                val trainerName = m.trainerId?.let { viewModel.allTrainers.value.find { t -> t.trainerId == it }?.name }
                
                aiProgressStep = "Generating Workout..."
                delay(800)
                
                aiProgressStep = "Generating Nutrition..."
                val jsonResult = GeminiHelper.generatePremiumCoachPlan(m, trainerName)
                
                if (jsonResult == null) {
                    throw Exception("Could not reach Gemini service. Please verify your internet connection.")
                }
                if (jsonResult.startsWith("Error:")) {
                    throw Exception(jsonResult)
                }

                aiProgressStep = "Saving Plan..."
                delay(800)

                val json = JSONObject(jsonResult)
                val workoutObj = json.getJSONObject("workout")
                val nutritionObj = json.getJSONObject("nutrition")
                val metaObj = json.optJSONObject("metadata")

                val sdf = SimpleDateFormat("MMM dd, yyyy - hh:mm a", Locale.getDefault())
                val todayStr = sdf.format(Date())

                // Update UI state variables immediately
                warmup = workoutObj.optString("warmup")
                strengthTraining = workoutObj.optString("strengthTraining")
                cardio = workoutObj.optString("cardio")
                core = workoutObj.optString("core")
                cooldown = workoutObj.optString("cooldown")
                stretching = workoutObj.optString("stretching")
                recoveryTips = workoutObj.optString("recoveryTips")
                workoutNotes = workoutObj.optString("notes")

                breakfast = nutritionObj.optString("breakfast")
                morningSnack = nutritionObj.optString("morningSnack")
                lunch = nutritionObj.optString("lunch")
                preWorkout = nutritionObj.optString("preWorkout")
                postWorkout = nutritionObj.optString("postWorkout")
                dinner = nutritionObj.optString("dinner")
                hydration = nutritionObj.optString("hydration")
                supplements = nutritionObj.optString("supplements")
                calories = nutritionObj.optInt("calories", 2000).toString()
                protein = nutritionObj.optInt("protein", 120).toString()
                carbs = nutritionObj.optInt("carbohydrates", 150).toString()
                fat = nutritionObj.optInt("fat", 60).toString()
                nutritionNotes = nutritionObj.optString("notes")

                val newPlan = PremiumAiPlan(
                    warmup = warmup,
                    strengthTraining = strengthTraining,
                    cardio = cardio,
                    core = core,
                    cooldown = cooldown,
                    stretching = stretching,
                    recoveryTips = recoveryTips,
                    workoutNotes = workoutNotes,

                    breakfast = breakfast,
                    morningSnack = morningSnack,
                    lunch = lunch,
                    preWorkout = preWorkout,
                    postWorkout = postWorkout,
                    dinner = dinner,
                    hydration = hydration,
                    supplements = supplements,
                    calories = calories.toIntOrNull() ?: 2000,
                    protein = protein.toIntOrNull() ?: 120,
                    carbs = carbs.toIntOrNull() ?: 150,
                    fat = fat.toIntOrNull() ?: 60,
                    nutritionNotes = nutritionNotes,

                    goal = metaObj?.optString("goal") ?: "High-Yield Optimization",
                    bmi = metaObj?.optDouble("bmi", m.bmi) ?: m.bmi,
                    confidenceScore = metaObj?.optInt("confidenceScore", 98) ?: 98,
                    generatedDate = todayStr,
                    healthAdvice = metaObj?.optString("healthAdvice") ?: "",
                    sleep = metaObj?.optString("sleep") ?: "",
                    dailyMotivation = metaObj?.optString("dailyMotivation") ?: "",
                    safetyNotes = metaObj?.optString("safetyNotes") ?: ""
                )
                
                generatedPlan = newPlan
                
                // Requirement 6: If generation succeeds, automatically save to database/Firestore
                savePlanToDatabase(m.memberId)
                
                aiProgressStep = "Completed"
                delay(400)
                viewModel.showFeedback("AI Smart Plan generated and saved successfully!")
            } catch (e: Exception) {
                val errorMsg = e.message ?: "Unknown error"
                val friendlyError = when {
                    errorMsg.contains("NO_INTERNET", ignoreCase = true) || errorMsg.contains("No Internet Connection", ignoreCase = true) ->
                        "No Internet Connection"
                    errorMsg.contains("API_KEY_MISSING", ignoreCase = true) || errorMsg.contains("API Key Missing", ignoreCase = true) ->
                        "Gemini API Key Missing"
                    errorMsg.contains("AUTH_FAILED", ignoreCase = true) || errorMsg.contains("Authentication Failed", ignoreCase = true) ->
                        "Gemini Authentication Failed"
                    errorMsg.contains("QUOTA_EXCEEDED", ignoreCase = true) || errorMsg.contains("Quota Exceeded", ignoreCase = true) ->
                        "Gemini Quota Exceeded"
                    errorMsg.contains("Rate Limited", ignoreCase = true) ->
                        "Gemini Rate Limited"
                    errorMsg.contains("INVALID_RESPONSE", ignoreCase = true) || errorMsg.contains("Invalid Response", ignoreCase = true) || errorMsg.contains("JSON", ignoreCase = true) || errorMsg.contains("parse", ignoreCase = true) || e is org.json.JSONException ->
                        "Gemini Returned Invalid Response"
                    errorMsg.contains("Firebase Connection", ignoreCase = true) ->
                        "Firebase Connection Failed"
                    errorMsg.contains("Cloud Function", ignoreCase = true) ->
                        "Cloud Function Failed"
                    errorMsg.contains("TIMEOUT", ignoreCase = true) || errorMsg.contains("timed out", ignoreCase = true) || errorMsg.contains("Timeout", ignoreCase = true) ->
                        "Server Timeout"
                    else -> "Unknown Error: $errorMsg"
                }
                aiErrorMessage = friendlyError
                viewModel.showFeedback(friendlyError)
            } finally {
                localAiLoading = false
            }
        }
    }

    Scaffold { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Screen Header
                Column {
                    Text(
                        text = "Training & Nutrition Desk",
                        style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = "Formulate high-performance schedules and premium AI-driven athletic regimens",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                    )
                }

                // Member Selector UI Block
                if (members.isEmpty()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                    ) {
                        Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                            Text(
                                text = "Please register members first to configure fitness sheets.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { isMemberSelectorOpen = true }
                            .testTag("member_selector_card"),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            member?.let { m ->
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    // Profile picture / Avatar
                                    if (!m.photo.isNullOrEmpty()) {
                                        AsyncImage(
                                            model = m.photo,
                                            contentDescription = "Profile Photo",
                                            modifier = Modifier
                                                .size(52.dp)
                                                .clip(CircleShape)
                                                .border(1.5.dp, MaterialTheme.colorScheme.primary, CircleShape),
                                            contentScale = ContentScale.Crop
                                        )
                                    } else {
                                        val initial = m.name.firstOrNull()?.uppercase() ?: "?"
                                        Box(
                                            modifier = Modifier
                                                .size(52.dp)
                                                .background(
                                                    Brush.linearGradient(
                                                        listOf(
                                                            MaterialTheme.colorScheme.primary,
                                                            MaterialTheme.colorScheme.secondary
                                                        )
                                                    ),
                                                    CircleShape
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = initial,
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 20.sp
                                            )
                                        }
                                    }
                                    
                                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                        ) {
                                            Text(
                                                text = m.name,
                                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                                color = MaterialTheme.colorScheme.onSurface
                                            )
                                            if (m.status.lowercase() == "active") {
                                                // Glowing Active Indicator
                                                Box(
                                                    modifier = Modifier
                                                        .size(8.dp)
                                                        .background(Color(0xFF10B981), CircleShape)
                                                )
                                            }
                                        }
                                        
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            Text(
                                                text = "ID: #${m.memberId.take(8).uppercase()}",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                            )
                                            Text(
                                                text = "•",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                                            )
                                            Text(
                                                text = "BMI: ${m.bmi}",
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                            )
                                        }
                                    }
                                }
                                
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    MemberStatusBadge(status = m.status)
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = "Open Member Selector",
                                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }
                            } ?: Text(
                                text = "Tap to Select Gym Member",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                modifier = Modifier.padding(vertical = 12.dp)
                            )
                        }
                    }

                    MemberSelectionDialog(
                        isOpen = isMemberSelectorOpen,
                        onDismiss = { isMemberSelectorOpen = false },
                        members = members,
                        selectedMemberId = selectedMemberId,
                        onSelectMember = { id -> selectedMemberId = id }
                    )
                }

                // Modern Segmented Tabs
                SegmentedTabRow(
                    selectedTab = activeTab,
                    onTabSelected = { activeTab = it }
                )

                // Premium AI Smart Coach Section
                member?.let { m ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.tertiary.copy(alpha = 0.3f)),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.08f)
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AutoAwesome,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.tertiary,
                                        modifier = Modifier.size(22.dp)
                                    )
                                    Text(
                                        text = "✨ AI Smart Coach",
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onTertiaryContainer
                                    )
                                }
                            }

                            if (aiErrorMessage != null) {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.4f)
                                    ),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.3f))
                                ) {
                                    Column(
                                        modifier = Modifier.padding(16.dp),
                                        verticalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.Error,
                                                contentDescription = null,
                                                tint = MaterialTheme.colorScheme.error
                                            )
                                            Text(
                                                text = "AI Coach Connection Issue",
                                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                                color = MaterialTheme.colorScheme.onErrorContainer
                                            )
                                        }
                                        Text(
                                            text = aiErrorMessage ?: "",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.8f)
                                        )
                                        Button(
                                            onClick = { generatePremiumCoachPlan(m) },
                                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                                            shape = RoundedCornerShape(8.dp)
                                        ) {
                                            Text("Retry Generation", color = MaterialTheme.colorScheme.onError)
                                        }
                                    }
                                }
                            }

                            if (localAiLoading) {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                ) {
                                    Row(
                                        modifier = Modifier.padding(16.dp),
                                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(28.dp),
                                            strokeWidth = 3.dp,
                                            color = MaterialTheme.colorScheme.tertiary
                                        )
                                        Column {
                                            Text(
                                                text = "Formulating Plan...",
                                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                            )
                                            Text(
                                                text = aiProgressStep,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
                                            )
                                        }
                                    }
                                }
                            }

                            if (generatedPlan == null && !localAiLoading) {
                                Text(
                                    text = "Formulate elite athletic workout sheets, targeted macronutrient dietary plans, and recovery instructions tailored to biometric BMI feedback using the Gemini API.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onTertiaryContainer.copy(alpha = 0.7f),
                                    modifier = Modifier.padding(bottom = 4.dp)
                                )
                                
                                Button(
                                    onClick = { generatePremiumCoachPlan(m) },
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.tertiary),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp)
                                        .testTag("generate_plan_button")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.AutoAwesome,
                                        contentDescription = null,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Generate Plan",
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            generatedPlan?.let { plan ->
                                val trainerName = m.trainerId?.let { tId -> viewModel.allTrainers.value.find { t -> t.trainerId == tId }?.name } ?: "Elite Trainer"
                                
                                Card(
                                    modifier = Modifier.fillMaxWidth().testTag("ai_plan_card"),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)),
                                    shape = RoundedCornerShape(16.dp),
                                    border = BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f))
                                ) {
                                    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                        // Card Header
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                    Icon(
                                                        imageVector = Icons.Default.AutoAwesome,
                                                        contentDescription = null,
                                                        tint = MaterialTheme.colorScheme.primary,
                                                        modifier = Modifier.size(18.dp)
                                                    )
                                                    Text(
                                                        text = "COACH AI INTELLECT",
                                                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, letterSpacing = 1.sp),
                                                        color = MaterialTheme.colorScheme.primary
                                                    )
                                                }
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                    text = "Formulated: ${plan.generatedDate}",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                                )
                                            }

                                            // Premium Gemini AI Badge
                                            Surface(
                                                color = MaterialTheme.colorScheme.primaryContainer,
                                                shape = RoundedCornerShape(20.dp),
                                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f))
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                                ) {
                                                    Icon(
                                                        imageVector = Icons.Default.AutoAwesome,
                                                        contentDescription = null,
                                                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                                                        modifier = Modifier.size(14.dp)
                                                    )
                                                    Text(
                                                        text = "Gemini Premium AI",
                                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                                    )
                                                }
                                            }
                                        }

                                        HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))

                                        // Detailed Metrics Grid (2x3 Grid using Columns and Rows)
                                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                                // Goal
                                                Card(
                                                    modifier = Modifier.weight(1f),
                                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                                ) {
                                                    Column(modifier = Modifier.padding(12.dp)) {
                                                        Text("FITNESS GOAL", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                                        Spacer(modifier = Modifier.height(4.dp))
                                                        Text(plan.goal, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                                    }
                                                }
                                                // Trainer
                                                Card(
                                                    modifier = Modifier.weight(1f),
                                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                                ) {
                                                    Column(modifier = Modifier.padding(12.dp)) {
                                                        Text("TRAINER", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                                        Spacer(modifier = Modifier.height(4.dp))
                                                        Text(trainerName, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                                    }
                                                }
                                            }

                                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                                // BMI Status
                                                Card(
                                                    modifier = Modifier.weight(1f),
                                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                                ) {
                                                    Column(modifier = Modifier.padding(12.dp)) {
                                                        Text("BMI VALUE", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                                        Spacer(modifier = Modifier.height(4.dp))
                                                        Text("${plan.bmi}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                                    }
                                                }
                                                // Confidence Match
                                                Card(
                                                    modifier = Modifier.weight(1f),
                                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                                ) {
                                                    Column(modifier = Modifier.padding(12.dp)) {
                                                        Text("CONFIDENCE SCORE", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                                        Spacer(modifier = Modifier.height(4.dp))
                                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                                            Icon(Icons.Default.Verified, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(14.dp))
                                                            Text("${plan.confidenceScore}% Optimal", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color(0xFF10B981))
                                                        }
                                                    }
                                                }
                                            }

                                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                                // Calories
                                                Card(
                                                    modifier = Modifier.weight(1f),
                                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                                ) {
                                                    Column(modifier = Modifier.padding(12.dp)) {
                                                        Text("ESTIMATED CALORIES", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                                        Spacer(modifier = Modifier.height(4.dp))
                                                        Text("${plan.calories} kcal", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                                    }
                                                }
                                                // Macros Summary
                                                Card(
                                                    modifier = Modifier.weight(1f),
                                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                                ) {
                                                    Column(modifier = Modifier.padding(12.dp)) {
                                                        Text("MACROS RATIO (P / C / F)", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                                                        Spacer(modifier = Modifier.height(4.dp))
                                                        Text("${plan.protein}g / ${plan.carbs}g / ${plan.fat}g", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                                    }
                                                }
                                            }
                                        }

                                        HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))

                                        // Action Panel
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            // Copy Button
                                            Button(
                                                onClick = {
                                                    val copyText = """
                                                        🏋️‍♂️ GYMMASTER PRO ATHLETIC REGIMEN 🏋️‍♂️
                                                        Goal: ${plan.goal}
                                                        Calories: ${plan.calories} kcal
                                                        Protein: ${plan.protein}g | Carbs: ${plan.carbs}g | Fat: ${plan.fat}g
                                                        Formulated: ${plan.generatedDate}
                                                        Developed by Arnav Bairagi
                                                        © Arnav Bairagi. All Rights Reserved.
                                                    """.trimIndent()
                                                    clipboardManager.setText(AnnotatedString(copyText))
                                                    viewModel.showFeedback("Copied summary to clipboard!")
                                                },
                                                modifier = Modifier.weight(1f).height(40.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer, contentColor = MaterialTheme.colorScheme.onSecondaryContainer),
                                                shape = RoundedCornerShape(10.dp)
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                                    Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(14.dp))
                                                    Text("Copy", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }

                                            // Share Button
                                            Button(
                                                onClick = { showShareDialog = true },
                                                modifier = Modifier.weight(1f).height(40.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer, contentColor = MaterialTheme.colorScheme.onSecondaryContainer),
                                                shape = RoundedCornerShape(10.dp)
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(14.dp))
                                                    Text("Share", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }

                                            // Download PDF Button
                                            Button(
                                                onClick = {
                                                    val result = com.example.util.PdfPlanGenerator.downloadPlanPdfToDownloads(context, m, plan, trainerName)
                                                    if (result != null) {
                                                        viewModel.showFeedback(result)
                                                    } else {
                                                        viewModel.showFeedback("Failed to download PDF!")
                                                    }
                                                },
                                                modifier = Modifier.weight(1.2f).height(40.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer, contentColor = MaterialTheme.colorScheme.onSecondaryContainer),
                                                shape = RoundedCornerShape(10.dp)
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                                    Icon(Icons.Default.PictureAsPdf, contentDescription = null, modifier = Modifier.size(14.dp))
                                                    Text("Download", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }

                                            // Print Button
                                            Button(
                                                onClick = {
                                                    com.example.util.PdfPlanGenerator.printPlanPdf(context, m, plan, trainerName)
                                                },
                                                modifier = Modifier.weight(1f).height(40.dp),
                                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer, contentColor = MaterialTheme.colorScheme.onSecondaryContainer),
                                                shape = RoundedCornerShape(10.dp)
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                                    Icon(Icons.Default.Print, contentDescription = null, modifier = Modifier.size(14.dp))
                                                    Text("Print", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                                }
                                            }
                                        }

                                        HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))

                                        // Apply & Save interactive buttons
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                                        ) {
                                            OutlinedButton(
                                                onClick = { generatedPlan = null },
                                                modifier = Modifier.weight(1f).height(48.dp).testTag("cancel_button"),
                                                shape = RoundedCornerShape(12.dp)
                                            ) {
                                                Text("Cancel", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }

                                            OutlinedButton(
                                                onClick = { generatePremiumCoachPlan(m) },
                                                modifier = Modifier.weight(1.2f).height(48.dp).testTag("regenerate_button"),
                                                shape = RoundedCornerShape(12.dp)
                                            ) {
                                                Text("Regenerate", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }

                                            Button(
                                                onClick = {
                                                    // Load values to edit states
                                                    warmup = plan.warmup
                                                    strengthTraining = plan.strengthTraining
                                                    cardio = plan.cardio
                                                    core = plan.core
                                                    cooldown = plan.cooldown
                                                    stretching = plan.stretching
                                                    recoveryTips = plan.recoveryTips
                                                    workoutNotes = plan.workoutNotes

                                                    breakfast = plan.breakfast
                                                    morningSnack = plan.morningSnack
                                                    lunch = plan.lunch
                                                    preWorkout = plan.preWorkout
                                                    postWorkout = plan.postWorkout
                                                    dinner = plan.dinner
                                                    hydration = plan.hydration
                                                    supplements = plan.supplements
                                                    calories = plan.calories.toString()
                                                    protein = plan.protein.toString()
                                                    carbs = plan.carbs.toString()
                                                    fat = plan.fat.toString()
                                                    nutritionNotes = plan.nutritionNotes
                                                    
                                                    viewModel.showFeedback("AI plan applied to workout/nutrition editor!")
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                                                modifier = Modifier.weight(1.1f).height(48.dp).testTag("apply_button"),
                                                shape = RoundedCornerShape(12.dp)
                                            ) {
                                                Text("Apply", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }

                                            Button(
                                                onClick = {
                                                    // Save directly
                                                    warmup = plan.warmup
                                                    strengthTraining = plan.strengthTraining
                                                    cardio = plan.cardio
                                                    core = plan.core
                                                    cooldown = plan.cooldown
                                                    stretching = plan.stretching
                                                    recoveryTips = plan.recoveryTips
                                                    workoutNotes = plan.workoutNotes

                                                    breakfast = plan.breakfast
                                                    morningSnack = plan.morningSnack
                                                    lunch = plan.lunch
                                                    preWorkout = plan.preWorkout
                                                    postWorkout = plan.postWorkout
                                                    dinner = plan.dinner
                                                    hydration = plan.hydration
                                                    supplements = plan.supplements
                                                    calories = plan.calories.toString()
                                                    protein = plan.protein.toString()
                                                    carbs = plan.carbs.toString()
                                                    fat = plan.fat.toString()
                                                    nutritionNotes = plan.nutritionNotes

                                                    savePlanToDatabase(m.memberId)
                                                    viewModel.showFeedback("Successfully saved and synced AI plan!")
                                                    generatedPlan = null
                                                },
                                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                                                modifier = Modifier.weight(1.1f).height(48.dp).testTag("save_button"),
                                                shape = RoundedCornerShape(12.dp)
                                            ) {
                                                Text("Save", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                            }
                                        }
                                    }
                                }

                                // Interactive Dialog for Share option selection
                                if (showShareDialog) {
                                    AlertDialog(
                                        onDismissRequest = { showShareDialog = false },
                                        title = {
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                Icon(Icons.Default.Share, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                                Text("Share Plan Summary")
                                            }
                                        },
                                        text = {
                                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                                Text("Select your preferred sharing channel:", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                
                                                // Share Option 1: PDF Document
                                                Card(
                                                    modifier = Modifier.fillMaxWidth().clickable {
                                                        showShareDialog = false
                                                        com.example.util.PdfPlanGenerator.sharePlan(context, m, plan, trainerName, "pdf")
                                                    },
                                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                                ) {
                                                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                                        Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = Color(0xFFEF4444))
                                                        Column {
                                                            Text("PDF Document", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                                            Text("Share professional A4 print-ready PDF", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                        }
                                                    }
                                                }

                                                // Share Option 2: Text Summary
                                                Card(
                                                    modifier = Modifier.fillMaxWidth().clickable {
                                                        showShareDialog = false
                                                        com.example.util.PdfPlanGenerator.sharePlan(context, m, plan, trainerName, "text")
                                                    },
                                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                                ) {
                                                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                                        Icon(Icons.Default.TextSnippet, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                                        Column {
                                                            Text("Plain Text Summary", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                                            Text("Share as a clean copyable text snippet", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                        }
                                                    }
                                                }

                                                // Share Option 3: WhatsApp
                                                Card(
                                                    modifier = Modifier.fillMaxWidth().clickable {
                                                        showShareDialog = false
                                                        com.example.util.PdfPlanGenerator.sharePlan(context, m, plan, trainerName, "whatsapp")
                                                    },
                                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                                ) {
                                                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                                        Icon(Icons.Default.Phone, contentDescription = null, tint = Color(0xFF10B981))
                                                        Column {
                                                            Text("WhatsApp Messenger", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                                            Text("Share directly to WhatsApp", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                        }
                                                    }
                                                }

                                                // Share Option 4: Email
                                                Card(
                                                    modifier = Modifier.fillMaxWidth().clickable {
                                                        showShareDialog = false
                                                        com.example.util.PdfPlanGenerator.sharePlan(context, m, plan, trainerName, "email")
                                                    },
                                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                                ) {
                                                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                                        Icon(Icons.Default.Email, contentDescription = null, tint = Color(0xFFF59E0B))
                                                        Column {
                                                            Text("Email Client", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                                            Text("Send as structured message via email", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        confirmButton = {
                                            TextButton(onClick = { showShareDialog = false }) {
                                                Text("Close")
                                            }
                                        }
                                    )
                                }
                            }
                        }
                    }
                }

                // Forms Layout Sections with Multi-columns for Tablet/Desktop, single-column for phone
                member?.let { m ->
                    AnimatedContent(
                        targetState = activeTab,
                        transitionSpec = {
                            fadeIn() togetherWith fadeOut()
                        },
                        label = "TabTransition"
                    ) { targetTab ->
                        BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                            val isWide = maxWidth >= 600.dp
                            
                            if (targetTab == "Workout Plan") {
                                Column(
                                    verticalArrangement = Arrangement.spacedBy(16.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = "WORKOUT SPECIFICATION PLAN",
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.primary
                                    )

                                    if (isWide) {
                                        // Grid Layout
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                            WorkoutDietTextArea(
                                                value = warmup,
                                                onValueChange = { warmup = it },
                                                label = "Warm-up Routine",
                                                enabled = canEdit,
                                                icon = Icons.Filled.DirectionsRun,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Dynamic stretching, warm-up exercises, range-of-motion..."
                                            )
                                            WorkoutDietTextArea(
                                                value = strengthTraining,
                                                onValueChange = { strengthTraining = it },
                                                label = "Strength Training",
                                                enabled = canEdit,
                                                icon = Icons.Filled.FitnessCenter,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Compound lifts, isolation, reps, sets, progression..."
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                            WorkoutDietTextArea(
                                                value = cardio,
                                                onValueChange = { cardio = it },
                                                label = "Cardio Training",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Speed,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Cardiovascular drills, speed intervals, duration..."
                                            )
                                            WorkoutDietTextArea(
                                                value = core,
                                                onValueChange = { core = it },
                                                label = "Core Stability",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Accessibility,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Abs, lower back, core exercises..."
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                            WorkoutDietTextArea(
                                                value = cooldown,
                                                onValueChange = { cooldown = it },
                                                label = "Cool Down",
                                                enabled = canEdit,
                                                icon = Icons.Filled.LocalActivity,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Post-workout dynamic decline, targeted breathing..."
                                            )
                                            WorkoutDietTextArea(
                                                value = stretching,
                                                onValueChange = { stretching = it },
                                                label = "Stretching Routine",
                                                enabled = canEdit,
                                                icon = Icons.Filled.SelfImprovement,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Static stretching to accelerate muscle fiber recovery..."
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                            WorkoutDietTextArea(
                                                value = recoveryTips,
                                                onValueChange = { recoveryTips = it },
                                                label = "Recovery Tips",
                                                enabled = canEdit,
                                                icon = Icons.Filled.BatteryChargingFull,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Sleep hygiene, targeted hydration, foam rolling..."
                                            )
                                            WorkoutDietTextArea(
                                                value = workoutNotes,
                                                onValueChange = { workoutNotes = it },
                                                label = "Notes",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Comment,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Specific coaching cues, intensity indicators..."
                                            )
                                        }
                                    } else {
                                        // Standard Single Column
                                        WorkoutDietTextArea(
                                            value = warmup,
                                            onValueChange = { warmup = it },
                                            label = "Warm-up Routine",
                                            enabled = canEdit,
                                            icon = Icons.Filled.DirectionsRun,
                                            placeholder = "Dynamic stretching, warm-up exercises, range-of-motion..."
                                        )
                                        WorkoutDietTextArea(
                                            value = strengthTraining,
                                            onValueChange = { strengthTraining = it },
                                            label = "Strength Training",
                                            enabled = canEdit,
                                            icon = Icons.Filled.FitnessCenter,
                                            placeholder = "Compound lifts, isolation, reps, sets, progression..."
                                        )
                                        WorkoutDietTextArea(
                                            value = cardio,
                                            onValueChange = { cardio = it },
                                            label = "Cardio Training",
                                            enabled = canEdit,
                                            icon = Icons.Filled.Speed,
                                            placeholder = "Cardiovascular drills, speed intervals, duration..."
                                        )
                                        WorkoutDietTextArea(
                                            value = core,
                                            onValueChange = { core = it },
                                            label = "Core Stability",
                                            enabled = canEdit,
                                            icon = Icons.Filled.Accessibility,
                                            placeholder = "Abs, lower back, core exercises..."
                                        )
                                        WorkoutDietTextArea(
                                            value = cooldown,
                                            onValueChange = { cooldown = it },
                                            label = "Cool Down",
                                            enabled = canEdit,
                                            icon = Icons.Filled.LocalActivity,
                                            placeholder = "Post-workout dynamic decline, targeted breathing..."
                                        )
                                        WorkoutDietTextArea(
                                            value = stretching,
                                            onValueChange = { stretching = it },
                                            label = "Stretching Routine",
                                            enabled = canEdit,
                                            icon = Icons.Filled.SelfImprovement,
                                            placeholder = "Static stretching to accelerate muscle fiber recovery..."
                                        )
                                        WorkoutDietTextArea(
                                            value = recoveryTips,
                                            onValueChange = { recoveryTips = it },
                                            label = "Recovery Tips",
                                            enabled = canEdit,
                                            icon = Icons.Filled.BatteryChargingFull,
                                            placeholder = "Sleep hygiene, targeted hydration, foam rolling..."
                                        )
                                        WorkoutDietTextArea(
                                            value = workoutNotes,
                                            onValueChange = { workoutNotes = it },
                                            label = "Notes",
                                            enabled = canEdit,
                                            icon = Icons.Filled.Comment,
                                            placeholder = "Specific coaching cues, intensity indicators..."
                                        )
                                    }
                                }
                            } else {
                                Column(
                                    verticalArrangement = Arrangement.spacedBy(16.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(
                                        text = "NUTRITION AND MACRO PLAN",
                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                        color = Color(0xFF10B981)
                                    )

                                    if (isWide) {
                                        // Grid Layout
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                            WorkoutDietTextArea(
                                                value = breakfast,
                                                onValueChange = { breakfast = it },
                                                label = "Breakfast Meal",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Coffee,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Calorie-tracked breakfast food list and sizes..."
                                            )
                                            WorkoutDietTextArea(
                                                value = morningSnack,
                                                onValueChange = { morningSnack = it },
                                                label = "Morning Snack",
                                                enabled = canEdit,
                                                icon = Icons.Filled.FreeBreakfast,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Nuts, fruits, dairy, or light snacks..."
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                            WorkoutDietTextArea(
                                                value = lunch,
                                                onValueChange = { lunch = it },
                                                label = "Lunch Meal",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Restaurant,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Lean proteins, cruciferous veggies, fiber..."
                                            )
                                            WorkoutDietTextArea(
                                                value = preWorkout,
                                                onValueChange = { preWorkout = it },
                                                label = "Pre-Workout Fuel",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Bolt,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Pre-workout easily digestible fuels..."
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                            WorkoutDietTextArea(
                                                value = postWorkout,
                                                onValueChange = { postWorkout = it },
                                                label = "Post-Workout Recovery",
                                                enabled = canEdit,
                                                icon = Icons.Filled.FlashOn,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Protein shake, fast sugars, recovery timings..."
                                            )
                                            WorkoutDietTextArea(
                                                value = dinner,
                                                onValueChange = { dinner = it },
                                                label = "Dinner Meal",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Restaurant,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Quality proteins, green veggies, healthy fats..."
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                            WorkoutDietTextArea(
                                                value = hydration,
                                                onValueChange = { hydration = it },
                                                label = "Hydration Plan",
                                                enabled = canEdit,
                                                icon = Icons.Filled.LocalDrink,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Water targets and intake schedule..."
                                            )
                                            WorkoutDietTextArea(
                                                value = supplements,
                                                onValueChange = { supplements = it },
                                                label = "Supplements Guide",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Medication,
                                                modifier = Modifier.weight(1f),
                                                placeholder = "Proteins, vitamins, mineral supports..."
                                            )
                                        }

                                        // Macro Inputs Row
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                            WorkoutDietTextArea(
                                                value = calories,
                                                onValueChange = { calories = it },
                                                label = "Calories (kcal)",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Whatshot,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                placeholder = "2000"
                                            )
                                            WorkoutDietTextArea(
                                                value = protein,
                                                onValueChange = { protein = it },
                                                label = "Protein (g)",
                                                enabled = canEdit,
                                                icon = Icons.Filled.FitnessCenter,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                placeholder = "120"
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                            WorkoutDietTextArea(
                                                value = carbs,
                                                onValueChange = { carbs = it },
                                                label = "Carbohydrates (g)",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Grain,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                placeholder = "150"
                                            )
                                            WorkoutDietTextArea(
                                                value = fat,
                                                onValueChange = { fat = it },
                                                label = "Fat (g)",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Opacity,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                placeholder = "60"
                                            )
                                        }

                                        WorkoutDietTextArea(
                                            value = nutritionNotes,
                                            onValueChange = { nutritionNotes = it },
                                            label = "Notes",
                                            enabled = canEdit,
                                            icon = Icons.Filled.Comment,
                                            placeholder = "Cheat rules, diet cycling patterns..."
                                        )
                                    } else {
                                        // Standard Single Column
                                        WorkoutDietTextArea(
                                            value = breakfast,
                                            onValueChange = { breakfast = it },
                                            label = "Breakfast Meal",
                                            enabled = canEdit,
                                            icon = Icons.Filled.Coffee,
                                            placeholder = "Calorie-tracked breakfast food list and sizes..."
                                        )
                                        WorkoutDietTextArea(
                                            value = morningSnack,
                                            onValueChange = { morningSnack = it },
                                            label = "Morning Snack",
                                            enabled = canEdit,
                                            icon = Icons.Filled.FreeBreakfast,
                                            placeholder = "Nuts, fruits, dairy, or light snacks..."
                                        )
                                        WorkoutDietTextArea(
                                            value = lunch,
                                            onValueChange = { lunch = it },
                                            label = "Lunch Meal",
                                            enabled = canEdit,
                                            icon = Icons.Filled.Restaurant,
                                            placeholder = "Lean proteins, cruciferous veggies, fiber..."
                                        )
                                        WorkoutDietTextArea(
                                            value = preWorkout,
                                            onValueChange = { preWorkout = it },
                                            label = "Pre-Workout Fuel",
                                            enabled = canEdit,
                                            icon = Icons.Filled.Bolt,
                                            placeholder = "Pre-workout easily digestible fuels..."
                                        )
                                        WorkoutDietTextArea(
                                            value = postWorkout,
                                            onValueChange = { postWorkout = it },
                                            label = "Post-Workout Recovery",
                                            enabled = canEdit,
                                            icon = Icons.Filled.FlashOn,
                                            placeholder = "Protein shake, fast sugars, recovery timings..."
                                        )
                                        WorkoutDietTextArea(
                                            value = dinner,
                                            onValueChange = { dinner = it },
                                            label = "Dinner Meal",
                                            enabled = canEdit,
                                            icon = Icons.Filled.Restaurant,
                                            placeholder = "Quality proteins, green veggies, healthy fats..."
                                        )
                                        WorkoutDietTextArea(
                                            value = hydration,
                                            onValueChange = { hydration = it },
                                            label = "Hydration Plan",
                                            enabled = canEdit,
                                            icon = Icons.Filled.LocalDrink,
                                            placeholder = "Water targets and intake schedule..."
                                        )
                                        WorkoutDietTextArea(
                                            value = supplements,
                                            onValueChange = { supplements = it },
                                            label = "Supplements Guide",
                                            enabled = canEdit,
                                            icon = Icons.Filled.Medication,
                                            placeholder = "Proteins, vitamins, mineral supports..."
                                        )

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            WorkoutDietTextArea(
                                                value = calories,
                                                onValueChange = { calories = it },
                                                label = "Calories (kcal)",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Whatshot,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                placeholder = "2000"
                                            )
                                            WorkoutDietTextArea(
                                                value = protein,
                                                onValueChange = { protein = it },
                                                label = "Protein (g)",
                                                enabled = canEdit,
                                                icon = Icons.Filled.FitnessCenter,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                placeholder = "120"
                                            )
                                        }

                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                            WorkoutDietTextArea(
                                                value = carbs,
                                                onValueChange = { carbs = it },
                                                label = "Carbohydrates (g)",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Grain,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                placeholder = "150"
                                            )
                                            WorkoutDietTextArea(
                                                value = fat,
                                                onValueChange = { fat = it },
                                                label = "Fat (g)",
                                                enabled = canEdit,
                                                icon = Icons.Filled.Opacity,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                modifier = Modifier.weight(1f),
                                                placeholder = "60"
                                            )
                                        }

                                        WorkoutDietTextArea(
                                            value = nutritionNotes,
                                            onValueChange = { nutritionNotes = it },
                                            label = "Notes",
                                            enabled = canEdit,
                                            icon = Icons.Filled.Comment,
                                            placeholder = "Cheat rules, diet cycling patterns..."
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Generous bottom spacer so scrollable content doesn't get covered by the sticky bar
                if (canEdit && member != null) {
                    Spacer(modifier = Modifier.height(72.dp))
                }
            }

            // Sticky Bottom Save / Action Bar
            if (canEdit && member != null) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter),
                    shadowElevation = 8.dp,
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = { savePlanToDatabase(member.memberId) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .testTag("save_plan_button"),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (activeTab == "Workout Plan") MaterialTheme.colorScheme.primary else Color(0xFF10B981)
                            )
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Icon(Icons.Default.Save, contentDescription = "Save")
                                Text(
                                    text = if (activeTab == "Workout Plan") "Save Workout Routine" else "Save Nutrition Plan",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
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
fun WorkoutDietTextArea(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    enabled: Boolean,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    placeholder: String = ""
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.06f))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Text(
                    text = label,
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
            }
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.fillMaxWidth(),
                enabled = enabled,
                keyboardOptions = keyboardOptions,
                textStyle = MaterialTheme.typography.bodyMedium.copy(
                    lineHeight = 22.sp
                ),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f),
                    disabledBorderColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f),
                    focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.04f),
                    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.04f),
                    disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.01f),
                ),
                placeholder = {
                    Text(
                        text = placeholder.ifBlank { "Describe details..." },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.35f)
                    )
                },
                minLines = 2,
                singleLine = false
            )
        }
    }
}
