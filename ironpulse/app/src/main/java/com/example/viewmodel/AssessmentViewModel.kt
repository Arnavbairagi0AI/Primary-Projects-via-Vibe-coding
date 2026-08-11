package com.example.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.BuildConfig
import com.example.data.AppDatabase
import com.example.data.LeadEntity
import com.example.data.LeadRepository
import com.example.data.CalorieLog
import com.example.data.WeightLog
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

enum class ScreenStep {
    WELCOME,
    BASIC_INFO,
    BODY_STATS,
    GOALS,
    LEAD_CAPTURE,
    RESULTS,
    ADMIN_LEADS,
    CODE_EXPORTER
}

class AssessmentViewModel(application: Application) : AndroidViewModel(application) {

    private val leadDao = AppDatabase.getDatabase(application).leadDao()
    private val repository = LeadRepository(leadDao)

    // Reactive Leads List for Owner-Facing Dashboard
    val allCapturedLeads: StateFlow<List<LeadEntity>> = repository.allItemsStateFlow()

    private fun LeadRepository.allItemsStateFlow(): StateFlow<List<LeadEntity>> {
        return allLeads.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )
    }

    // Calorie and Weight Tracker StateFlows
    val calorieLogs: StateFlow<List<CalorieLog>> = repository.allCalorieLogs.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    val weightLogs: StateFlow<List<WeightLog>> = repository.allWeightLogs.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Navigation State
    private val _currentStep = MutableStateFlow(ScreenStep.WELCOME)
    val currentStep: StateFlow<ScreenStep> = _currentStep.asStateFlow()

    // Form Field States
    val name = MutableStateFlow("")
    val age = MutableStateFlow("25")
    val gender = MutableStateFlow("Male")
    val city = MutableStateFlow("")

    // Body Stats
    val weight = MutableStateFlow("70")
    val weightUnit = MutableStateFlow("kg") // "kg" or "lbs"
    val height = MutableStateFlow("175")
    val heightUnit = MutableStateFlow("cm") // "cm" or "ft/in"
    val heightFeet = MutableStateFlow("5")
    val heightInches = MutableStateFlow("9")
    val activityLevel = MutableStateFlow("Moderate") // "Sedentary", "Light", "Moderate", "Active", "Very Active"

    // Goals
    val primaryGoal = MutableStateFlow("Build Muscle") // "Lose Fat", "Build Muscle", "General Fitness", "Improve Stamina"
    val targetTimeline = MutableStateFlow("3 months") // "1 month", "3 months", "6 months"
    val limitations = MutableStateFlow("")

    // Lead Capture
    val phone = MutableStateFlow("+91")
    val email = MutableStateFlow("")

    // Calculated Metrics
    private val _bmi = MutableStateFlow(0.0)
    val bmi: StateFlow<Double> = _bmi.asStateFlow()

    private val _bmiCategory = MutableStateFlow("")
    val bmiCategory: StateFlow<String> = _bmiCategory.asStateFlow()

    private val _calorieTarget = MutableStateFlow(2000)
    val calorieTarget: StateFlow<Int> = _calorieTarget.asStateFlow()

    private val _proteinGrams = MutableStateFlow(120)
    val proteinGrams: StateFlow<Int> = _proteinGrams.asStateFlow()

    private val _carbGrams = MutableStateFlow(220)
    val carbGrams: StateFlow<Int> = _carbGrams.asStateFlow()

    private val _fatGrams = MutableStateFlow(65)
    val fatGrams: StateFlow<Int> = _fatGrams.asStateFlow()

    // Gemini API Coach Advice States
    private val _coachAdvice = MutableStateFlow("")
    val coachAdvice: StateFlow<String> = _coachAdvice.asStateFlow()

    private val _isGeneratingAdvice = MutableStateFlow(false)
    val isGeneratingAdvice: StateFlow<Boolean> = _isGeneratingAdvice.asStateFlow()

    private val _generationError = MutableStateFlow<String?>(null)
    val generationError: StateFlow<String?> = _generationError.asStateFlow()

    // Google Sign-In Mock Integration State
    private val _isGoogleSignedIn = MutableStateFlow(false)
    val isGoogleSignedIn: StateFlow<Boolean> = _isGoogleSignedIn.asStateFlow()

    private val _googleEmail = MutableStateFlow("")
    val googleEmail: StateFlow<String> = _googleEmail.asStateFlow()

    private val _googleName = MutableStateFlow("")
    val googleName: StateFlow<String> = _googleName.asStateFlow()

    fun signInWithGoogle(selectedName: String, selectedEmail: String) {
        _isGoogleSignedIn.value = true
        _googleName.value = selectedName
        _googleEmail.value = selectedEmail
        
        name.value = selectedName
        email.value = selectedEmail
    }

    fun signOutGoogle() {
        _isGoogleSignedIn.value = false
        _googleName.value = ""
        _googleEmail.value = ""
        
        name.value = ""
        email.value = ""
    }

    // AI Diet Planner States
    private val _dietPlan = MutableStateFlow("")
    val dietPlan: StateFlow<String> = _dietPlan.asStateFlow()

    private val _isGeneratingDietPlan = MutableStateFlow(false)
    val isGeneratingDietPlan: StateFlow<Boolean> = _isGeneratingDietPlan.asStateFlow()

    // AI Exercise / Workout Planner States
    private val _workoutPlan = MutableStateFlow("")
    val workoutPlan: StateFlow<String> = _workoutPlan.asStateFlow()

    private val _isGeneratingWorkoutPlan = MutableStateFlow(false)
    val isGeneratingWorkoutPlan: StateFlow<Boolean> = _isGeneratingWorkoutPlan.asStateFlow()

    // Thank You Dialog State
    private val _showThankYouDialog = MutableStateFlow(false)
    val showThankYouDialog: StateFlow<Boolean> = _showThankYouDialog.asStateFlow()

    fun dismissThankYouDialog() {
        _showThankYouDialog.value = false
    }

    // Progress percentage
    val formProgress: Float
        get() = when (_currentStep.value) {
            ScreenStep.WELCOME -> 0.05f
            ScreenStep.BASIC_INFO -> 0.25f
            ScreenStep.BODY_STATS -> 0.50f
            ScreenStep.GOALS -> 0.75f
            ScreenStep.LEAD_CAPTURE -> 0.90f
            ScreenStep.RESULTS -> 1.0f
            else -> 1.0f
        }

    fun navigateTo(step: ScreenStep) {
        _currentStep.value = step
    }

    fun goBack() {
        _currentStep.value = when (_currentStep.value) {
            ScreenStep.BASIC_INFO -> ScreenStep.WELCOME
            ScreenStep.BODY_STATS -> ScreenStep.BASIC_INFO
            ScreenStep.GOALS -> ScreenStep.BODY_STATS
            ScreenStep.LEAD_CAPTURE -> ScreenStep.GOALS
            ScreenStep.RESULTS -> ScreenStep.LEAD_CAPTURE
            ScreenStep.ADMIN_LEADS -> ScreenStep.WELCOME
            ScreenStep.CODE_EXPORTER -> ScreenStep.WELCOME
            else -> ScreenStep.WELCOME
        }
    }

    // Perform calculations and proceed to lead wall
    fun calculateAndProceed() {
        val calculatedWeightKg = getWeightInKg()
        val calculatedHeightCm = getHeightInCm()
        val parsedAge = age.value.toIntOrNull() ?: 25

        // 1. BMI Calculation
        val heightM = calculatedHeightCm / 100.0
        val bmiVal = if (heightM > 0) calculatedWeightKg / (heightM * heightM) else 0.0
        _bmi.value = Math.round(bmiVal * 10.0) / 10.0

        _bmiCategory.value = when {
            _bmi.value < 18.5 -> "Underweight"
            _bmi.value < 25.0 -> "Normal weight"
            _bmi.value < 30.0 -> "Overweight"
            else -> "Obese"
        }

        // 2. BMR (Mifflin-St Jeor)
        val isMale = gender.value.equals("Male", ignoreCase = true)
        val bmr = if (isMale) {
            10.0 * calculatedWeightKg + 6.25 * calculatedHeightCm - 5.0 * parsedAge + 5.0
        } else {
            10.0 * calculatedWeightKg + 6.25 * calculatedHeightCm - 5.0 * parsedAge - 161.0
        }

        // 3. TDEE
        val activityMultiplier = when (activityLevel.value) {
            "Sedentary" -> 1.2
            "Light" -> 1.375
            "Moderate" -> 1.55
            "Active" -> 1.725
            "Very Active" -> 1.9
            else -> 1.2
        }
        val tdee = bmr * activityMultiplier

        // 4. Calorie Target by Goal
        val goalCal = when (primaryGoal.value) {
            "Lose Fat" -> tdee - 500.0
            "Build Muscle" -> tdee + 350.0
            else -> tdee // Maintenance
        }
        // Safety limit
        val minCals = if (isMale) 1500.0 else 1200.0
        val finalCals = Math.max(goalCal, minCals).toInt()
        _calorieTarget.value = finalCals

        // 5. Macros by Goal
        val (pPct, cPct, fPct) = when (primaryGoal.value) {
            "Lose Fat" -> Triple(0.40, 0.35, 0.25)
            "Build Muscle" -> Triple(0.30, 0.50, 0.20)
            "General Fitness" -> Triple(0.25, 0.50, 0.25)
            "Improve Stamina" -> Triple(0.20, 0.60, 0.20)
            else -> Triple(0.25, 0.50, 0.25)
        }

        _proteinGrams.value = ((finalCals * pPct) / 4.0).toInt()
        _carbGrams.value = ((finalCals * cPct) / 4.0).toInt()
        _fatGrams.value = ((finalCals * fPct) / 9.0).toInt()

        // Generate coach advice (starts API call or uses rule fallback)
        triggerCoachAdviceGeneration()

        _currentStep.value = ScreenStep.LEAD_CAPTURE
    }

    fun recalculateMetrics(newWeight: Double, newHeight: Double, newWeightUnit: String, newHeightUnit: String) {
        weight.value = newWeight.toString()
        height.value = newHeight.toString()
        weightUnit.value = newWeightUnit
        heightUnit.value = newHeightUnit

        val calculatedWeightKg = if (newWeightUnit == "lbs") newWeight * 0.45359237 else newWeight
        val calculatedHeightCm = if (newHeightUnit == "ft/in") newHeight * 2.54 else newHeight

        val parsedAge = age.value.toIntOrNull() ?: 25

        // 1. BMI Calculation
        val heightM = calculatedHeightCm / 100.0
        val bmiVal = if (heightM > 0) calculatedWeightKg / (heightM * heightM) else 0.0
        _bmi.value = Math.round(bmiVal * 10.0) / 10.0

        _bmiCategory.value = when {
            _bmi.value < 18.5 -> "Underweight"
            _bmi.value < 25.0 -> "Normal weight"
            _bmi.value < 30.0 -> "Overweight"
            else -> "Obese"
        }

        // 2. BMR (Mifflin-St Jeor)
        val isMale = gender.value.equals("Male", ignoreCase = true)
        val bmr = if (isMale) {
            10.0 * calculatedWeightKg + 6.25 * calculatedHeightCm - 5.0 * parsedAge + 5.0
        } else {
            10.0 * calculatedWeightKg + 6.25 * calculatedHeightCm - 5.0 * parsedAge - 161.0
        }

        // 3. TDEE
        val activityMultiplier = when (activityLevel.value) {
            "Sedentary" -> 1.2
            "Light" -> 1.375
            "Moderate" -> 1.55
            "Active" -> 1.725
            "Very Active" -> 1.9
            else -> 1.2
        }
        val tdee = bmr * activityMultiplier

        // 4. Calorie Target by Goal
        val goalCal = when (primaryGoal.value) {
            "Lose Fat" -> tdee - 500.0
            "Build Muscle" -> tdee + 350.0
            else -> tdee // Maintenance
        }
        val minCals = if (isMale) 1500.0 else 1200.0
        val finalCals = Math.max(goalCal, minCals).toInt()
        _calorieTarget.value = finalCals

        // 5. Macros by Goal
        val (pPct, cPct, fPct) = when (primaryGoal.value) {
            "Lose Fat" -> Triple(0.40, 0.35, 0.25)
            "Build Muscle" -> Triple(0.30, 0.50, 0.20)
            "General Fitness" -> Triple(0.25, 0.50, 0.25)
            "Improve Stamina" -> Triple(0.20, 0.60, 0.20)
            else -> Triple(0.25, 0.50, 0.25)
        }

        _proteinGrams.value = ((finalCals * pPct) / 4.0).toInt()
        _carbGrams.value = ((finalCals * cPct) / 4.0).toInt()
        _fatGrams.value = ((finalCals * fPct) / 9.0).toInt()
    }

    private fun getWeightInKg(): Double {
        val raw = weight.value.toDoubleOrNull() ?: 70.0
        return if (weightUnit.value == "lbs") raw * 0.45359237 else raw
    }

    private fun getHeightInCm(): Double {
        if (heightUnit.value == "ft/in") {
            val ft = heightFeet.value.toDoubleOrNull() ?: 5.0
            val inch = heightInches.value.toDoubleOrNull() ?: 9.0
            return (ft * 12.0 + inch) * 2.54
        }
        return height.value.toDoubleOrNull() ?: 175.0
    }

    // Submit captured lead and save to Room database
    fun submitLeadAndUnlock() {
        viewModelScope.launch(Dispatchers.IO) {
            val finalDietPlan = _dietPlan.value.ifBlank {
                generateLocalDietPlan(primaryGoal.value, _calorieTarget.value, limitations.value.trim().ifBlank { "None" })
            }
            val finalWorkoutPlan = _workoutPlan.value.ifBlank {
                generateLocalWorkoutPlan(primaryGoal.value, limitations.value.trim().ifBlank { "None" })
            }

            val lead = LeadEntity(
                name = name.value.trim().ifBlank { "Guest User" },
                age = age.value.toIntOrNull() ?: 25,
                gender = gender.value,
                city = city.value.trim().ifBlank { "N/A" },
                weight = if (weightUnit.value == "lbs") {
                    (weight.value.toDoubleOrNull() ?: 70.0) * 0.45359237
                } else {
                    weight.value.toDoubleOrNull() ?: 70.0
                },
                weightUnit = weightUnit.value,
                height = if (heightUnit.value == "ft/in") {
                    (heightFeet.value.toDoubleOrNull() ?: 5.0) * 12.0 + (heightInches.value.toDoubleOrNull() ?: 9.0)
                } else {
                    height.value.toDoubleOrNull() ?: 175.0
                },
                heightUnit = heightUnit.value,
                activityLevel = activityLevel.value,
                goal = primaryGoal.value,
                timeline = targetTimeline.value,
                limitations = limitations.value.trim().ifBlank { "None" },
                phone = phone.value.trim().ifBlank { "N/A" },
                email = email.value.trim().ifBlank { "guest@example.com" },
                bmi = _bmi.value,
                bmiCategory = _bmiCategory.value,
                calorieTarget = _calorieTarget.value,
                proteinGrams = _proteinGrams.value,
                carbGrams = _carbGrams.value,
                fatGrams = _fatGrams.value,
                dietPlan = finalDietPlan,
                workoutPlan = finalWorkoutPlan
            )

            // Persist lead to SQLite Room Database
            repository.insertLead(lead)

            // Log lead JSON format in logcat as requested
            val leadJsonLog = """
                {
                  "name": "${lead.name}",
                  "age": ${lead.age},
                  "city": "${lead.city}",
                  "phone": "${lead.phone}",
                  "email": "${lead.email}",
                  "goal": "${lead.goal}",
                  "bmi": ${lead.bmi},
                  "calorieTarget": ${lead.calorieTarget},
                  "timestamp": ${lead.timestamp}
                }
            """.trimIndent()
            println("CAPTURED LEAD DATA:\n$leadJsonLog")

            // Go to the results view
            withContext(Dispatchers.Main) {
                _showThankYouDialog.value = true
                _currentStep.value = ScreenStep.RESULTS
            }
        }
    }

    fun deleteLead(leadId: Int) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteLeadById(leadId)
        }
    }

    fun clearAllCapturedLeads() {
        viewModelScope.launch(Dispatchers.IO) {
            repository.clearAllLeads()
        }
    }

    // Double-Engine: Call Gemini REST API directly or fallback to rule-based generation
    private fun triggerCoachAdviceGeneration() {
        _isGeneratingAdvice.value = true
        _generationError.value = null
        _coachAdvice.value = ""

        val clientName = name.value.trim().ifBlank { "Champion" }
        val goal = primaryGoal.value
        val cal = _calorieTarget.value
        val limit = limitations.value.trim().ifBlank { "None" }
        val time = targetTimeline.value

        val prompt = """
            You are an elite personal trainer and expert strength coach. Write a highly personalized, energetic, and encouraging fitness plan summary for our client.
            
            Client Profile:
            - Name: $clientName
            - Goal: $goal
            - Target Calories: $cal kcal/day
            - Injury/Limitations: $limit
            - Timeline: $time
            
            Requirements:
            - Write exactly 4-5 sentences.
            - Address the client directly by their name ($clientName).
            - Use a highly professional, encouraging, and authoritative coaching tone (never robotic or flat).
            - Explicitly reference their specific goal ($goal) and how their daily calorie target ($cal kcal) will act as the catalyst for their progress.
            - If they have limitations or injuries ($limit), provide a smart coaching recommendation (e.g., knee-friendly squat variations or high-stability core alternatives). If no limitations, encourage heavy multi-joint compounds.
            - Write in a single clean paragraph. DO NOT use markdown, bullet points, numbered lists, or headers.
        """.trimIndent()

        viewModelScope.launch(Dispatchers.IO) {
            val apiKey = BuildConfig.GEMINI_API_KEY
            if (apiKey.isBlank() || apiKey == "MY_GEMINI_API_KEY") {
                // No key or placeholder -> Fallback to spectacular rule-based generator
                val backup = generateLocalCoachSummary(clientName, goal, cal, limit, time)
                withContext(Dispatchers.Main) {
                    _coachAdvice.value = backup
                    _isGeneratingAdvice.value = false
                }
                return@launch
            }

            try {
                val client = OkHttpClient.Builder()
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .readTimeout(15, TimeUnit.SECONDS)
                    .writeTimeout(15, TimeUnit.SECONDS)
                    .build()

                val jsonPayload = """
                    {
                      "contents": [{
                        "parts": [{
                          "text": ${escapeJsonString(prompt)}
                        }]
                      }]
                    }
                """.trimIndent()

                val body = jsonPayload.toRequestBody("application/json; charset=utf-8".toMediaType())
                val request = Request.Builder()
                    .url("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$apiKey")
                    .post(body)
                    .build()

                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    val rawBody = response.body?.string() ?: ""
                    val extractedText = extractTextFromJson(rawBody)
                    withContext(Dispatchers.Main) {
                        if (extractedText.isNotBlank()) {
                            _coachAdvice.value = extractedText
                        } else {
                            _coachAdvice.value = generateLocalCoachSummary(clientName, goal, cal, limit, time)
                        }
                        _isGeneratingAdvice.value = false
                    }
                } else {
                    throw Exception("HTTP Error: ${response.code}")
                }
            } catch (e: Exception) {
                // If network failure, fallback gracefully so first-launch is beautiful
                val backup = generateLocalCoachSummary(clientName, goal, cal, limit, time)
                withContext(Dispatchers.Main) {
                    _coachAdvice.value = backup
                    _isGeneratingAdvice.value = false
                }
            }
        }
    }

    private fun escapeJsonString(str: String): String {
        return "\"" + str.replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t") + "\""
    }

    // Manual parser designed to extract the generated text from Gemini's JSON response string
    private fun extractTextFromJson(json: String): String {
        try {
            val search = "\"text\":"
            var index = json.indexOf(search)
            if (index == -1) return ""
            index += search.length

            val startQuote = json.indexOf('"', index)
            if (startQuote == -1) return ""

            val sb = java.lang.StringBuilder()
            var i = startQuote + 1
            while (i < json.length) {
                val c = json[i]
                if (c == '"') {
                    if (i > 0 && json[i - 1] == '\\') {
                        sb.append(c)
                    } else {
                        break
                    }
                } else if (c == '\\') {
                    if (i + 1 < json.length && json[i + 1] == 'n') {
                        sb.append('\n')
                        i++
                    } else if (i + 1 < json.length && json[i + 1] == 't') {
                        sb.append('\t')
                        i++
                    } else if (i + 1 < json.length && json[i + 1] == '"') {
                        sb.append('"')
                        i++
                    } else if (i + 1 < json.length && json[i + 1] == '\\') {
                        sb.append('\\')
                        i++
                    }
                } else {
                    sb.append(c)
                }
                i++
            }
            return sb.toString().trim()
        } catch (e: Exception) {
            return ""
        }
    }

    // Calorie Tracking Database Operations
    fun addCalorieLog(mealName: String, calories: Int, protein: Int = 0, carbs: Int = 0, fats: Int = 0) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertCalorieLog(
                CalorieLog(
                    mealName = mealName,
                    calories = calories,
                    protein = protein,
                    carbs = carbs,
                    fats = fats
                )
            )
        }
    }

    fun deleteCalorieLog(id: Int) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteCalorieLogById(id)
        }
    }

    fun clearCalorieLogs() {
        viewModelScope.launch(Dispatchers.IO) {
            repository.clearAllCalorieLogs()
        }
    }

    // Weight Tracking Database Operations
    fun addWeightLog(weightValue: Double, note: String = "") {
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertWeightLog(
                WeightLog(
                    weight = weightValue,
                    note = note
                )
            )
        }
    }

    fun deleteWeightLog(id: Int) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteWeightLogById(id)
        }
    }

    fun clearWeightLogs() {
        viewModelScope.launch(Dispatchers.IO) {
            repository.clearAllWeightLogs()
        }
    }

    // AI Diet Planner Generation
    fun generateDietPlan() {
        _isGeneratingDietPlan.value = true
        _dietPlan.value = ""

        val clientName = name.value.trim().ifBlank { "Champion" }
        val goal = primaryGoal.value
        val cal = _calorieTarget.value
        val limit = limitations.value.trim().ifBlank { "None" }

        val prompt = """
            You are a certified sports nutritionist and diet planner. Write a daily meal plan summary for our client $clientName who wants to "$goal" with a target daily intake of $cal kcal.
            
            Client Profile:
            - Name: $clientName
            - Goal: $goal
            - Target Intake: $cal kcal/day
            - Dietary Limitations: $limit
            
            Requirements:
            - Provide 4 distinct meal sections: Breakfast, Lunch, Dinner, and Snack.
            - Provide detailed meal descriptions including macronutrients (protein, carbs, fats) and calorie content for each meal.
            - Ensure the total calories sum up to approximately $cal kcal.
            - Add a professional dietary coaching tip at the end.
            - Keep it concise, energetic, structured, and easy to read. Under 200 words.
        """.trimIndent()

        viewModelScope.launch(Dispatchers.IO) {
            val apiKey = BuildConfig.GEMINI_API_KEY
            if (apiKey.isBlank() || apiKey == "MY_GEMINI_API_KEY") {
                val backup = generateLocalDietPlan(goal, cal, limit)
                withContext(Dispatchers.Main) {
                    _dietPlan.value = backup
                    _isGeneratingDietPlan.value = false
                }
                return@launch
            }

            try {
                val client = OkHttpClient.Builder()
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .readTimeout(15, TimeUnit.SECONDS)
                    .writeTimeout(15, TimeUnit.SECONDS)
                    .build()

                val jsonPayload = """
                    {
                      "contents": [{
                        "parts": [{
                          "text": ${escapeJsonString(prompt)}
                        }]
                      }]
                    }
                """.trimIndent()

                val body = jsonPayload.toRequestBody("application/json; charset=utf-8".toMediaType())
                val request = Request.Builder()
                    .url("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$apiKey")
                    .post(body)
                    .build()

                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    val rawBody = response.body?.string() ?: ""
                    val extractedText = extractTextFromJson(rawBody)
                    withContext(Dispatchers.Main) {
                        if (extractedText.isNotBlank()) {
                            _dietPlan.value = extractedText
                        } else {
                            _dietPlan.value = generateLocalDietPlan(goal, cal, limit)
                        }
                        _isGeneratingDietPlan.value = false
                    }
                } else {
                    throw Exception("HTTP Error: ${response.code}")
                }
            } catch (e: Exception) {
                val backup = generateLocalDietPlan(goal, cal, limit)
                withContext(Dispatchers.Main) {
                    _dietPlan.value = backup
                    _isGeneratingDietPlan.value = false
                }
            }
        }
    }

    fun generateWorkoutPlan() {
        _isGeneratingWorkoutPlan.value = true
        _workoutPlan.value = ""

        val clientName = name.value.trim().ifBlank { "Champion" }
        val goal = primaryGoal.value
        val cal = _calorieTarget.value
        val limit = limitations.value.trim().ifBlank { "None" }

        val prompt = """
            You are a certified athletic coach and elite strength specialist. Write a customized workout plan and progression routine for our client $clientName who wants to "$goal".
            
            Client Profile:
            - Name: $clientName
            - Goal: $goal
            - Target Intake: $cal kcal/day
            - Dietary & Physical Limitations: $limit
            
            Requirements:
            - Clearly divide into dynamic warmups, cardio, "WHAT TO DO" (aerobics/mobility), and "WHAT TO LIFT" (specific compound lifting exercises, reps, sets, and progress targets).
            - Guide them on which specific weights to choose, what compound exercises to focus on, and how to lift safely.
            - Ensure any injuries or physical limitations ($limit) are accounted for with high-stability alternatives.
            - Keep it concise, high-intensity, structured, and easy to read. Under 200 words.
        """.trimIndent()

        viewModelScope.launch(Dispatchers.IO) {
            val apiKey = BuildConfig.GEMINI_API_KEY
            if (apiKey.isBlank() || apiKey == "MY_GEMINI_API_KEY") {
                val backup = generateLocalWorkoutPlan(goal, limit)
                withContext(Dispatchers.Main) {
                    _workoutPlan.value = backup
                    _isGeneratingWorkoutPlan.value = false
                }
                return@launch
            }

            try {
                val client = OkHttpClient.Builder()
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .readTimeout(15, TimeUnit.SECONDS)
                    .writeTimeout(15, TimeUnit.SECONDS)
                    .build()

                val jsonPayload = """
                    {
                      "contents": [{
                        "parts": [{
                          "text": ${escapeJsonString(prompt)}
                        }]
                      }]
                    }
                """.trimIndent()

                val body = jsonPayload.toRequestBody("application/json; charset=utf-8".toMediaType())
                val request = Request.Builder()
                    .url("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=$apiKey")
                    .post(body)
                    .build()

                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    val rawBody = response.body?.string() ?: ""
                    val extractedText = extractTextFromJson(rawBody)
                    withContext(Dispatchers.Main) {
                        if (extractedText.isNotBlank()) {
                            _workoutPlan.value = extractedText
                        } else {
                            _workoutPlan.value = generateLocalWorkoutPlan(goal, limit)
                        }
                        _isGeneratingWorkoutPlan.value = false
                    }
                } else {
                    throw Exception("HTTP Error: ${response.code}")
                }
            } catch (e: Exception) {
                val backup = generateLocalWorkoutPlan(goal, limit)
                withContext(Dispatchers.Main) {
                    _workoutPlan.value = backup
                    _isGeneratingWorkoutPlan.value = false
                }
            }
        }
    }

    private fun generateLocalWorkoutPlan(goal: String, limit: String): String {
        val exerciseSplit = when (goal) {
            "Lose Fat" -> """
                🏃 **WHAT TO DO (Fat Loss / Conditioning)**
                - High-Intensity Interval Training (HIIT): 15 mins (30s sprint, 30s rest) on treadmill or assault bike.
                - Daily Steps: Target 10,000+ steps.
                
                🏋️ **WHAT TO LIFT (High Metabolic Demands)**
                1. Barbell Back Squats: 4 sets x 10-12 reps (moderate weight to keep heart rate high)
                2. Dumbbell Incline Bench Press: 3 sets x 12 reps
                3. Romanian Deadlifts: 3 sets x 12 reps (focus on hamstrings/glutes)
                4. Cable Lat Pulldowns: 3 sets x 12 reps
                
                💡 **PRO TIP:** Keep rest times strictly under 45-60 seconds between sets to maximize calorie burn.
            """.trimIndent()
            "Build Muscle" -> """
                🔥 **WHAT TO DO (Warm-up & Hypertrophy)**
                - Dynamic Warm-up: 5-8 mins of arm circles, leg swings, and bodyweight squats.
                
                🏋️ **WHAT TO LIFT (Strength & Size)**
                1. Barbell Back Squats: 4 sets x 6-8 reps (heavy load, focus on progression)
                2. Flat Barbell Bench Press: 4 sets x 8 reps
                3. Barbell Conventional Deadlifts: 3 sets x 5 reps (intense full-body recruitment)
                4. Barbell Bent-Over Rows: 3 sets x 8 reps
                
                💡 **PRO TIP:** Aim to increase weight or reps every week (progressive overload). Sleep at least 8 hours for muscle recovery.
            """.trimIndent()
            "General Fitness" -> """
                🧘 **WHAT TO DO (Systemic Fitness & Core)**
                - Cardio Base: 20 mins of steady-state jog or incline walk at 65% max heart rate.
                
                🏋️ **WHAT TO LIFT (Functional Strength)**
                1. Dumbbell Goblet Squats: 3 sets x 10 reps
                2. Push-ups / Assisted Chest Press: 3 sets x 12 reps
                3. Dumbbell Romanian Deadlifts: 3 sets x 10 reps
                4. Seated Cable Rows: 3 sets x 12 reps
                5. Plank Holds: 3 sets x 45-60 seconds
                
                💡 **PRO TIP:** Focus on perfect form and mind-muscle connection. Consistency is the primary catalyst!
            """.trimIndent()
            else -> """
                ⚡ **WHAT TO DO (Stamina & Endurance)**
                - Aerobic Engine: 20-30 mins of moderate-pace rowing or swimming.
                
                🏋️ **WHAT TO LIFT (Muscular Endurance)**
                1. Barbell Squats: 3 sets x 15 reps (light to moderate weight)
                2. Overhead Dumbbell Shoulder Press: 3 sets x 15 reps
                3. Bodyweight Pull-ups / Lat Pulldowns: 3 sets x 12-15 reps
                4. Kettlebell Swings: 3 sets x 20 reps
                
                💡 **PRO TIP:** Control the eccentric (lowering) phase of the movement. Breathe steadily and stay hydrated!
            """.trimIndent()
        }
        
        val modifiedSplit = if (limit.isNotBlank() && !limit.equals("none", ignoreCase = true)) {
            "⚠️ **LIMITATION ADJUSTMENT ($limit):** Modify squats or deadlifts with high-stability machines (e.g. Leg Press or Smith Machine) if needed. Avoid loading any painful ranges.\n\n$exerciseSplit"
        } else {
            exerciseSplit
        }
        
        return modifiedSplit
    }

    private fun generateLocalDietPlan(goal: String, calories: Int, limit: String): String {
        val calculatedProtein = (calories * 0.3 / 4).toInt()
        val calculatedCarbs = (calories * 0.45 / 4).toInt()
        val calculatedFats = (calories * 0.25 / 9).toInt()

        return """
            🍳 **BREAKFAST (approx. ${Math.round(calories * 0.25)} kcal)**
            - High-Protein Oats Bowl: 70g rolled oats cooked in almond milk, 1.5 scoops Whey protein, 15g peanut butter, and 40g fresh blueberries.
            - Macros: Protein: 45g, Carbs: 55g, Fats: 12g

            🥗 **LUNCH (approx. ${Math.round(calories * 0.35)} kcal)**
            - Grilled Herb Chicken & Quinoa: 180g lean chicken breast, 150g cooked quinoa, 100g steamed broccoli, and 1 tsp olive oil dressing.
            - Macros: Protein: 50g, Carbs: 48g, Fats: 10g

            🥩 **DINNER (approx. ${Math.round(calories * 0.3)} kcal)**
            - Pan-Seared Salmon Fillet: 160g salmon fillet or lean beef, 200g sweet potato mash, and asparagus with fresh spinach salad.
            - Macros: Protein: 40g, Carbs: 45g, Fats: 16g

            🍌 **SNACKS & FUEL (approx. ${Math.round(calories * 0.1)} kcal)**
            - Recovery Greek Yogurt Cup: 200g 0% Greek Yogurt with 1 medium banana and a pinch of cinnamon.
            - Macros: Protein: 20g, Carbs: 30g, Fats: 1g

            💡 **DIETARY COACHING TIP:**
            Drink at least 3-4 liters of water throughout the day. Fuel your body within 2 hours of your workouts to maximize recovery. Avoid processed sugars and keep your sodium in check!
        """.trimIndent()
    }

    private fun generateLocalCoachSummary(
        name: String,
        goal: String,
        calorieTarget: Int,
        limitations: String,
        timeline: String
    ): String {
        val goalAction = when (goal) {
            "Lose Fat" -> "igniting your metabolic rate and sculpting your composition by trimming excess body fat while safeguarding performance and muscle mass"
            "Build Muscle" -> "sparking muscle hypertrophy, adding rich muscle thickness, and driving your strength numbers through the roof"
            "General Fitness" -> "maximizing your systemic physical conditioning, eliminating afternoon energy dips, and building a balanced athletic foundation"
            else -> "shattering your conditioning plateaus and boosting muscular endurance, expanding oxygen capacity for peak stamina"
        }

        val calorieDirective = when (goal) {
            "Lose Fat" -> "We have configured a precise fat-loss deficit fueling plan targeting $calorieTarget daily calories. This is calibrated to utilize fat reserves as primary fuel while fully feeding your intensive gym training cycles."
            "Build Muscle" -> "To construct high-quality lean muscle tissue, we are prescribing a clean caloric surplus with a goal of $calorieTarget daily calories. This delivers a rich flow of energy and amino acids required to trigger structural growth."
            else -> "To fuel your active training lifestyle, we are targeting $calorieTarget daily calories. This aligns perfectly with your systemic energy output, accelerating recovery and maintaining dynamic physical homeostasis."
        }

        val injuryAdvice = if (limitations.isNotBlank() && !limitations.equals("none", ignoreCase = true)) {
            "Acknowledging your $limitations, we will program intelligent exercise selections with high-stability alternatives to train around this safely while ensuring continuous strength adaptation."
        } else {
            "With your joint health and mobility at 100%, we are perfectly cleared to load fundamental compound lifts—such as squats, deadlifts, and overhead presses—to elicit a massive hormonal response and rapid progress."
        }

        val motivationClose = when (goal) {
            "Lose Fat" -> "Prepare to dominate your training, $name. Over the next $timeline, our focus is absolute execution—results are guaranteed!"
            "Build Muscle" -> "Let's load the iron and execute, $name. The next $timeline is about moving heavy loads and eating with true purpose. Let's grow!"
            else -> "Your upgraded training chapter begins right now, $name. Over this $timeline protocol, you will break your limits and discover exactly what your body is capable of!"
        }

        return "Hey $name, welcome to your assessment! Over the next $timeline, our primary objective is $goalAction. $calorieDirective $injuryAdvice $motivationClose"
    }

    // Premium, fully self-contained HTML/CSS/JS Single-File Web assessment tool code
    fun getWebWidgetCode(): String {
        return """<!--
========================================================================
             PREMIUM GYM LEAD-GENERATION ASSESSMENT WIDGET
========================================================================
DESIGNED FOR: Gym Owners, Personal Trainers, and Health Clubs
FUNCTION: High-converting lead-generator that embeds anywhere (WordPress, Wix, Webflow, custom site)
FEATURES:
- Responsive multi-step wizard
- Live biometrics (BMI, Mifflin-St Jeor daily calories, Goal adjusted macros)
- Lead Capture wall (unlocks results only on submitting WhatsApp & Email)
- PDF Client Report Generation (via jsPDF)
- Clean webhook connection point for CRMs (Formspree, Zapier, Make, Google Sheets)
- High-fidelity dark activewear branding (Red / Deep Dark / Crisp White)

DEPLOYMENT INSTRUCTIONS:
1. Copy the entire content of this single file.
2. Paste it into an HTML element on your website.
3. Replace the placeholder branding values in the code config below.
4. Set up your webhook URL (e.g. Google Sheets webhook or Zapier webhook) on line 640.
========================================================================
-->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IronPulse Fitness Assessment Tool</title>
    <!-- Tailwind CSS CDN for elegant layouts -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- FontAwesome for fitness icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- jsPDF for client-side PDF download -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #0A0A0A;
            color: #f1f5f9;
        }
        
        h1, h2, h3, h4, .brand-header {
            font-family: 'Space Grotesk', sans-serif;
        }

        .gym-glow {
            box-shadow: 0 0 25px rgba(220, 38, 38, 0.2);
        }

        .gym-glow-btn {
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.35);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .gym-glow-btn:hover {
            box-shadow: 0 6px 22px rgba(220, 38, 38, 0.5);
            transform: translateY(-2px);
        }

        .custom-blur {
            filter: blur(8px);
            pointer-events: none;
            user-select: none;
        }

        .step-transition {
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
    </style>
</head>
<body class="min-h-screen flex flex-col justify-between py-4 px-2 sm:px-6">

    <!-- Header -->
    <header class="max-w-4xl w-full mx-auto flex justify-between items-center py-4 px-4 bg-[#161616]/85 rounded-2xl border border-white/5 mb-6 backdrop-blur-md">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-600/30">
                <i class="fa-solid fa-dumbbell"></i>
            </div>
            <div>
                <span class="brand-header text-lg font-black tracking-tight text-white uppercase">IRON<span class="text-red-600">PULSE</span></span>
                <span class="block text-[10px] text-zinc-500 tracking-wider uppercase -mt-1">Gym & Fitness</span>
            </div>
        </div>
        <div class="text-right">
            <span class="text-xs text-zinc-400 block"><i class="fa-solid fa-phone text-red-600 text-[10px] mr-1"></i> +1 (555) 019-9231</span>
            <span class="text-[10px] text-zinc-500 block">@ironpulse_gym</span>
        </div>
    </header>

    <!-- Main Widget Card -->
    <main class="max-w-3xl w-full mx-auto bg-[#161616] border border-white/5 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex-grow flex flex-col justify-center">
        <!-- Background Ambient Red Blobs -->
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-red-600/5 rounded-full filter blur-[120px] pointer-events-none"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-red-900/5 rounded-full filter blur-[120px] pointer-events-none"></div>

        <!-- Dynamic Multi-Step Progress Bar -->
        <div id="progressBarContainer" class="mb-8 hidden flex justify-between items-center border-b border-white/5 pb-4">
            <div>
                <span id="stepIndicatorText" class="text-xs font-black tracking-wider text-white uppercase">Step 1 of 4</span>
                <span id="stepPercentText" class="block text-[10px] text-zinc-400 mt-0.5">25% Complete</span>
            </div>
            <div id="segmentedProgressBar" class="flex gap-1.5">
                <div class="step-dot w-4 h-1 bg-red-600 rounded-full transition-all duration-300"></div>
                <div class="step-dot w-4 h-1 bg-zinc-800 rounded-full transition-all duration-300"></div>
                <div class="step-dot w-4 h-1 bg-zinc-800 rounded-full transition-all duration-300"></div>
                <div class="step-dot w-4 h-1 bg-zinc-800 rounded-full transition-all duration-300"></div>
            </div>
        </div>

        <!-- ==================== STEP 1: WELCOME SCREEN ==================== -->
        <div id="stepWelcome" class="step-transition flex flex-col items-center text-center py-6">
            <div class="w-20 h-20 bg-red-500/10 border border-red-500/20 text-red-500 rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-xl shadow-red-500/5">
                <i class="fa-solid fa-bolt"></i>
            </div>
            <h1 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight max-w-xl">
                Get Your Personalized <span class="text-red-500">Fitness Plan</span> in 60 Seconds
            </h1>
            <p class="mt-4 text-zinc-400 text-sm sm:text-base max-w-md leading-relaxed">
                Our advanced diagnostic tool calculates your BMI, daily caloric needs, and personalized macro split to fast-track your training success.
            </p>
            <button onclick="goToStep(2)" class="mt-8 px-8 py-4 bg-red-600 text-white font-semibold rounded-2xl gym-glow-btn flex items-center gap-3 hover:bg-red-500">
                Start My Free Assessment <i class="fa-solid fa-arrow-right"></i>
            </button>
            <div class="mt-8 flex items-center gap-6 justify-center text-xs text-zinc-500">
                <span><i class="fa-solid fa-circle-check text-red-500/80 mr-1"></i> No Credit Card</span>
                <span><i class="fa-solid fa-circle-check text-red-500/80 mr-1"></i> Detailed Report</span>
                <span><i class="fa-solid fa-circle-check text-red-500/80 mr-1"></i> Takes 1 Min</span>
            </div>
        </div>

        <!-- ==================== STEP 2: BASIC INFO ==================== -->
        <div id="stepBasicInfo" class="step-transition hidden">
            <h2 class="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span class="w-8 h-8 bg-zinc-800 text-red-500 text-sm font-bold rounded-lg flex items-center justify-center">1</span> Tell Us About Yourself
            </h2>
            <p class="text-zinc-400 text-xs mb-6">Let's collect some foundational statistics to customize your algorithms.</p>
            
            <div class="space-y-5">
                <div>
                    <label class="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">What is your name?</label>
                    <input type="text" id="inputName" placeholder="e.g., John Doe" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">Age</label>
                        <input type="number" id="inputAge" value="25" min="12" max="100" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-red-600 transition">
                    </div>
                    <div>
                        <label class="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">Gender</label>
                        <select id="selectGender" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-red-600 transition">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">City Location</label>
                    <input type="text" id="inputCity" placeholder="e.g., New York" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition">
                </div>
            </div>

            <div class="flex gap-3 mt-8">
                <button onclick="goToStep(1)" class="w-1/3 py-3.5 bg-zinc-800 hover:bg-zinc-750 text-white font-semibold rounded-xl transition">
                    Back
                </button>
                <button onclick="validateAndGo(3)" class="w-2/3 py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition">
                    Next Step
                </button>
            </div>
        </div>

        <!-- ==================== STEP 3: BODY STATS ==================== -->
        <div id="stepBodyStats" class="step-transition hidden">
            <h2 class="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span class="w-8 h-8 bg-zinc-800 text-red-500 text-sm font-bold rounded-lg flex items-center justify-center">2</span> Enter Your Body Dimensions
            </h2>
            <p class="text-zinc-400 text-xs mb-6">Weight and height details power your metabolic and body index models.</p>

            <div class="space-y-6">
                <!-- Weight with unit toggle -->
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Current Weight</label>
                        <div class="flex bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
                            <button onclick="setWeightUnit('kg')" id="btnUnitKg" class="px-3 py-1 text-xs font-bold rounded-md bg-red-600 text-white transition">KG</button>
                            <button onclick="setWeightUnit('lbs')" id="btnUnitLbs" class="px-3 py-1 text-xs font-bold rounded-md text-zinc-500 hover:text-white transition">LBS</button>
                        </div>
                    </div>
                    <input type="number" id="inputWeight" value="70" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-red-600 transition">
                </div>

                <!-- Height with unit toggle -->
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Height</label>
                        <div class="flex bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
                            <button onclick="setHeightUnit('cm')" id="btnUnitCm" class="px-3 py-1 text-xs font-bold rounded-md bg-red-600 text-white transition">CM</button>
                            <button onclick="setHeightUnit('ft')" id="btnUnitFt" class="px-3 py-1 text-xs font-bold rounded-md text-zinc-500 hover:text-white transition">FT/IN</button>
                        </div>
                    </div>
                    <!-- CM Input -->
                    <div id="heightCmContainer">
                        <input type="number" id="inputHeightCm" value="175" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-red-600 transition">
                    </div>
                    <!-- FT/IN Input -->
                    <div id="heightFtContainer" class="grid grid-cols-2 gap-3 hidden">
                        <input type="number" id="inputHeightFt" value="5" placeholder="Feet" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-red-600 transition">
                        <input type="number" id="inputHeightIn" value="9" placeholder="Inches" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-red-600 transition">
                    </div>
                </div>

                <!-- Activity Level -->
                <div>
                    <label class="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">Current Daily Activity Level</label>
                    <select id="selectActivity" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-red-600 transition">
                        <option value="Sedentary">Sedentary (Little to no exercise)</option>
                        <option value="Light">Light (Active 1-3 days/week)</option>
                        <option value="Moderate" selected>Moderate (Active 3-5 days/week)</option>
                        <option value="Active">Active (Heavy gym 6-7 days/week)</option>
                        <option value="Very Active">Very Active (Elite athletic job / athlete)</option>
                    </select>
                </div>
            </div>

            <div class="flex gap-3 mt-8">
                <button onclick="goToStep(2)" class="w-1/3 py-3.5 bg-zinc-800 hover:bg-zinc-750 text-white font-semibold rounded-xl transition">
                    Back
                </button>
                <button onclick="validateAndGo(4)" class="w-2/3 py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition">
                    Next Step
                </button>
            </div>
        </div>

        <!-- ==================== STEP 4: GOALS ==================== -->
        <div id="stepGoals" class="step-transition hidden">
            <h2 class="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span class="w-8 h-8 bg-zinc-800 text-red-500 text-sm font-bold rounded-lg flex items-center justify-center">3</span> Establish Your Benchmarks
            </h2>
            <p class="text-zinc-400 text-xs mb-6">Clarify your performance objectives and physical limits.</p>

            <div class="space-y-5">
                <div>
                    <label class="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">Primary Fitness Objective</label>
                    <select id="selectGoal" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-red-600 transition">
                        <option value="Lose Fat">Lose Fat (Deficit caloric program)</option>
                        <option value="Build Muscle" selected>Build Muscle (Surplus rebuilding program)</option>
                        <option value="General Fitness">General Fitness (Maintenance conditioning)</option>
                        <option value="Improve Stamina">Improve Stamina (Aerobic endurance carb program)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">Target Timeline</label>
                    <select id="selectTimeline" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-red-600 transition">
                        <option value="1 month">1 Month (Accelerated trial)</option>
                        <option value="3 months" selected>3 Months (Optimal body recomp)</option>
                        <option value="6 months">6 Months (Complete body overhaul)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">Known Injuries or Physical Limitations <span class="text-zinc-500">(Optional)</span></label>
                    <input type="text" id="inputLimitations" placeholder="e.g., Left knee pain, lower back stiffness, none" class="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 transition">
                </div>
            </div>

            <div class="flex gap-3 mt-8">
                <button onclick="goToStep(3)" class="w-1/3 py-3.5 bg-zinc-800 hover:bg-zinc-750 text-white font-semibold rounded-xl transition">
                    Back
                </button>
                <button onclick="runCalculationsAndShowCapture()" class="w-2/3 py-3.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl transition">
                    Calculate My Plan
                </button>
            </div>
        </div>

        <!-- ==================== STEP 5: LEAD CAPTURE (BLUR LOCK) ==================== -->
        <div id="stepLeadCapture" class="step-transition hidden relative z-10 py-4 flex flex-col items-center">
            <div class="w-16 h-16 bg-red-600/15 text-red-500 rounded-full flex items-center justify-center text-2xl mb-4 border border-red-500/10">
                <i class="fa-solid fa-lock"></i>
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white text-center leading-tight">
                Your Personalized <span class="text-red-500">Plan is Ready!</span>
            </h2>
            <p class="text-zinc-400 text-xs sm:text-sm text-center max-w-md mt-2 leading-relaxed">
                Enter your details below to unlock your custom calorie targets, macro ratios, and full assessment report instantly.
            </p>

            <div class="w-full max-w-md bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 mt-6 shadow-xl space-y-4">
                <div>
                    <label class="block text-zinc-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Full Name</label>
                    <input type="text" id="leadName" readonly class="w-full bg-zinc-900/60 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-zinc-400 text-sm focus:outline-none">
                </div>
                <div>
                    <label class="block text-zinc-300 text-[10px] font-semibold uppercase tracking-wider mb-1.5">WhatsApp / Phone Number</label>
                    <input type="tel" id="leadPhone" placeholder="e.g., +1 (555) 000-0000" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-zinc-650 focus:outline-none focus:border-red-600 transition">
                </div>
                <div>
                    <label class="block text-zinc-300 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Email Address</label>
                    <input type="email" id="leadEmail" placeholder="e.g., name@gmail.com" class="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-zinc-650 focus:outline-none focus:border-red-600 transition">
                </div>
                <div class="flex items-center gap-2 text-[10px] text-zinc-500 pt-1">
                    <input type="checkbox" checked class="accent-red-600 h-3 w-3">
                    <span>Send me training adjustments on WhatsApp.</span>
                </div>
                <button onclick="submitLeadData()" class="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl gym-glow-btn flex items-center justify-center gap-2 text-sm mt-2">
                    Send My Full Plan & Unlock <i class="fa-solid fa-unlock text-xs"></i>
                </button>
            </div>
            
            <p class="text-[10px] text-zinc-600 text-center mt-4">We safeguard your private info. Unsubscribe anytime.</p>
        </div>

        <!-- ==================== STEP 6: ASSESSMENT RESULTS SCREEN ==================== -->
        <div id="stepResults" class="step-transition hidden space-y-6">
            <!-- Blur overlay lock during capturing step -->
            <div id="resultsLockWrapper" class="">
                
                <!-- Gym Head Banner -->
                <div class="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                    <div>
                        <div class="text-xs text-red-500 font-semibold tracking-wider uppercase">Assessment Prepared For</div>
                        <h3 id="resultNameLabel" class="text-xl font-bold text-white">John Doe</h3>
                        <p id="resultMetaLabel" class="text-xs text-zinc-500">25 Years • Male • Chicago</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="downloadPlanPDF()" class="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition">
                            <i class="fa-solid fa-file-pdf text-red-500"></i> Download PDF
                        </button>
                        <button onclick="restartAssessment()" class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition">
                            <i class="fa-solid fa-rotate-left"></i> Restart
                        </button>
                    </div>
                </div>

                <!-- Dashboard Cards Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <!-- BMI Card -->
                    <div class="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                            <span class="text-zinc-400 text-xs font-semibold tracking-wider uppercase block mb-1">Your BMI</span>
                            <h4 id="resultBmiVal" class="text-4xl font-extrabold text-white">22.8</h4>
                        </div>
                        <div class="mt-4">
                            <span id="resultBmiCat" class="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block">Normal Weight</span>
                        </div>
                    </div>

                    <!-- Calories Card -->
                    <div class="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 flex flex-col justify-between sm:col-span-2">
                        <div class="flex justify-between items-start">
                            <div>
                                <span class="text-zinc-400 text-xs font-semibold tracking-wider uppercase block mb-1">Caloric Blueprint</span>
                                <h4 id="resultCalVal" class="text-4xl font-extrabold text-red-500">2,650</h4>
                                <p class="text-[10px] text-zinc-500 mt-1">Calorie target calibrated for <span id="resultGoalLabel" class="text-zinc-300">Build Muscle</span></p>
                            </div>
                            <div class="w-12 h-12 bg-red-600/10 text-red-500 rounded-xl flex items-center justify-center text-lg border border-red-500/15">
                                <i class="fa-solid fa-fire-flame-curved"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Macros Breakdown -->
                <div class="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 mt-4">
                    <span class="text-zinc-400 text-xs font-semibold tracking-wider uppercase block mb-4">Target Macronutrients (Daily Split)</span>
                    <div class="grid grid-cols-3 gap-3">
                        <!-- Protein -->
                        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-center">
                            <span class="text-red-500 font-bold text-sm block">PROTEIN</span>
                            <span id="resultProteinGrams" class="text-2xl font-black text-white block mt-1">165g</span>
                            <span class="text-[9px] text-zinc-500 block">4 kcal / gram</span>
                        </div>
                        <!-- Carbs -->
                        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-center">
                            <span class="text-amber-500 font-bold text-sm block">CARBS</span>
                            <span id="resultCarbGrams" class="text-2xl font-black text-white block mt-1">280g</span>
                            <span class="text-[9px] text-zinc-500 block">4 kcal / gram</span>
                        </div>
                        <!-- Fats -->
                        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 text-center">
                            <span class="text-blue-500 font-bold text-sm block">FATS</span>
                            <span id="resultFatGrams" class="text-2xl font-black text-white block mt-1">60g</span>
                            <span class="text-[9px] text-zinc-500 block">9 kcal / gram</span>
                        </div>
                    </div>
                </div>

                <!-- Custom Coach Advice -->
                <div class="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 mt-4 relative overflow-hidden">
                    <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-red-600/5 rounded-full filter blur-2xl"></div>
                    <span class="text-zinc-400 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 mb-3">
                        <i class="fa-solid fa-brain text-red-500"></i> AI Personal Coach Advice Summary
                    </span>
                    <p id="resultCoachAdvice" class="text-zinc-300 text-xs sm:text-sm leading-relaxed italic">
                        Hey John, Welcome to your fitness report! Our analysis indicates your body needs around 2,650 calories daily to pack on healthy muscle over the next 3 months...
                    </p>
                    <div class="mt-4 flex items-center gap-3 pt-3 border-t border-zinc-850">
                        <div class="w-8 h-8 bg-zinc-800 text-zinc-300 font-bold rounded-full flex items-center justify-center text-xs">
                            MT
                        </div>
                        <div>
                            <span class="block text-[11px] font-semibold text-white">Coach Marcus Tanner</span>
                            <span class="block text-[9px] text-zinc-500">Elite Performance Specialist • IronPulse</span>
                        </div>
                    </div>
                </div>

                <!-- Custom Workout Recommendation -->
                <div class="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 mt-4">
                    <span class="text-zinc-400 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 mb-3">
                        <i class="fa-solid fa-dumbbell text-red-500"></i> Tailored Athletic Training Splits
                    </span>
                    <pre id="resultWorkoutPlan" class="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 font-sans"></pre>
                </div>

                <!-- Custom Diet Plan Template -->
                <div class="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 mt-4">
                    <span class="text-zinc-400 text-xs font-semibold tracking-wider uppercase flex items-center gap-2 mb-3">
                        <i class="fa-solid fa-utensils text-red-500"></i> Customized Nutritional Protocol
                    </span>
                    <pre id="resultDietPlan" class="text-zinc-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 font-sans"></pre>
                </div>

                <!-- Unlock Success Alert -->
                <div class="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-xs">
                    <i class="fa-solid fa-circle-check text-base"></i>
                    <span><strong>Assessment unlocked!</strong> We have emailed your custom plan. Our trainer will contact you on WhatsApp within 24 hours to schedule your free onboarding.</span>
                </div>

            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="max-w-4xl w-full mx-auto flex flex-col sm:flex-row justify-between items-center py-4 px-4 bg-zinc-950/20 border-t border-zinc-900 mt-6 gap-3 text-zinc-600 text-xs">
        <p>© 2026 IronPulse Gym. All rights reserved.</p>
        <p class="text-[10px] text-zinc-700">Powered by <span class="text-red-500/80">My Agency Design Solutions</span></p>
    </footer>

    <!-- ==================== JAVASCRIPT LOGIC ==================== -->
    <script>
        // --- branding and configuration settings ---
        const GYM_NAME = "IronPulse Gym";
        const WEBHOOK_URL = ""; // INSERT YOUR GOOGLE SHEETS / ZAPIER WEBHOOK HERE (e.g. "https://hooks.zapier.com/...")

        // --- form state tracking ---
        let currentStep = 1;
        let weightUnit = 'kg';
        let heightUnit = 'cm';

        // Biometrics
        let calculatedBmi = 0;
        let bmiCategory = "";
        let calculatedCalories = 0;
        let proteinGrams = 0;
        let carbGrams = 0;
        let fatGrams = 0;

        function goToStep(step) {
            // Hide all steps
            document.getElementById('stepWelcome').classList.add('hidden');
            document.getElementById('stepBasicInfo').classList.add('hidden');
            document.getElementById('stepBodyStats').classList.add('hidden');
            document.getElementById('stepGoals').classList.add('hidden');
            document.getElementById('stepLeadCapture').classList.add('hidden');
            document.getElementById('stepResults').classList.add('hidden');

            const pBar = document.getElementById('progressBarContainer');

            if (step === 1) {
                pBar.classList.add('hidden');
                document.getElementById('stepWelcome').classList.remove('hidden');
            } else if (step === 2) {
                pBar.classList.remove('hidden');
                document.getElementById('stepBasicInfo').classList.remove('hidden');
                updateProgressBar(1, 4, 'Step 1 of 4: Basic Stats', '25%');
            } else if (step === 3) {
                pBar.classList.remove('hidden');
                document.getElementById('stepBodyStats').classList.remove('hidden');
                updateProgressBar(2, 4, 'Step 2 of 4: Body Dimensions', '50%');
            } else if (step === 4) {
                pBar.classList.remove('hidden');
                document.getElementById('stepGoals').classList.remove('hidden');
                updateProgressBar(3, 4, 'Step 3 of 4: Goal Benchmarks', '75%');
            } else if (step === 5) {
                pBar.classList.remove('hidden');
                document.getElementById('stepLeadCapture').classList.remove('hidden');
                updateProgressBar(4, 4, 'Final Step: Unlock Report', '95%');
            } else if (step === 6) {
                pBar.classList.add('hidden'); // finished
                document.getElementById('stepResults').classList.remove('hidden');
            }
            
            currentStep = step;
        }

        function updateProgressBar(step, total, text, pct) {
            document.getElementById('stepIndicatorText').innerText = text;
            document.getElementById('stepPercentText').innerText = pct + ' Complete';
            
            const dots = document.getElementById('segmentedProgressBar').children;
            for (let i = 0; i < dots.length; i++) {
                const dotStep = i + 1;
                if (dotStep < step) {
                    dots[i].className = "step-dot w-4 h-1 bg-red-600 rounded-full transition-all duration-300";
                } else if (dotStep === step) {
                    dots[i].className = "step-dot w-8 h-1 bg-red-600 rounded-full transition-all duration-300";
                } else {
                    dots[i].className = "step-dot w-4 h-1 bg-zinc-800 rounded-full transition-all duration-300";
                }
            }
        }

        function validateAndGo(nextStep) {
            if (nextStep === 3) {
                const name = document.getElementById('inputName').value.trim();
                if (!name) {
                    alert('Please enter your name to continue.');
                    return;
                }
                document.getElementById('leadName').value = name;
            }
            goToStep(nextStep);
        }

        function setWeightUnit(unit) {
            weightUnit = unit;
            const btnKg = document.getElementById('btnUnitKg');
            const btnLbs = document.getElementById('btnUnitLbs');
            
            if (unit === 'kg') {
                btnKg.className = "px-3 py-1 text-xs font-bold rounded-md bg-red-600 text-white transition";
                btnLbs.className = "px-3 py-1 text-xs font-bold rounded-md text-zinc-500 hover:text-white transition";
            } else {
                btnKg.className = "px-3 py-1 text-xs font-bold rounded-md text-zinc-500 hover:text-white transition";
                btnLbs.className = "px-3 py-1 text-xs font-bold rounded-md bg-red-600 text-white transition";
            }
        }

        function setHeightUnit(unit) {
            heightUnit = unit;
            const btnCm = document.getElementById('btnUnitCm');
            const btnFt = document.getElementById('btnUnitFt');
            const cmCont = document.getElementById('heightCmContainer');
            const ftCont = document.getElementById('heightFtContainer');

            if (unit === 'cm') {
                btnCm.className = "px-3 py-1 text-xs font-bold rounded-md bg-red-600 text-white transition";
                btnFt.className = "px-3 py-1 text-xs font-bold rounded-md text-zinc-500 hover:text-white transition";
                cmCont.classList.remove('hidden');
                ftCont.classList.add('hidden');
            } else {
                btnCm.className = "px-3 py-1 text-xs font-bold rounded-md text-zinc-500 hover:text-white transition";
                btnFt.className = "px-3 py-1 text-xs font-bold rounded-md bg-red-600 text-white transition";
                cmCont.classList.add('hidden');
                ftCont.classList.remove('hidden');
            }
        }

        function runCalculationsAndShowCapture() {
            // Extract raw data
            const rawWeight = parseFloat(document.getElementById('inputWeight').value) || 70;
            const age = parseInt(document.getElementById('inputAge').value) || 25;
            const gender = document.getElementById('selectGender').value;
            const activity = document.getElementById('selectActivity').value;
            const goal = document.getElementById('selectGoal').value;
            
            // Normalize Weight to KG
            let weightKg = rawWeight;
            if (weightUnit === 'lbs') {
                weightKg = rawWeight * 0.45359237;
            }

            // Normalize Height to CM
            let heightCm = 175;
            if (heightUnit === 'cm') {
                heightCm = parseFloat(document.getElementById('inputHeightCm').value) || 175;
            } else {
                const ft = parseFloat(document.getElementById('inputHeightFt').value) || 5;
                const inches = parseFloat(document.getElementById('inputHeightIn').value) || 9;
                heightCm = (ft * 12 + inches) * 2.54;
            }

            // 1. BMI Calculation
            const heightM = heightCm / 100;
            calculatedBmi = weightKg / (heightM * heightM);
            calculatedBmi = Math.round(calculatedBmi * 10) / 10;

            if (calculatedBmi < 18.5) {
                bmiCategory = "Underweight";
            } else if (calculatedBmi < 25) {
                bmiCategory = "Normal weight";
            } else if (calculatedBmi < 30) {
                bmiCategory = "Overweight";
            } else {
                bmiCategory = "Obese";
            }

            // 2. BMR (Mifflin-St Jeor)
            let bmr = 0;
            if (gender === "Male") {
                bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
            } else {
                bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
            }

            // 3. TDEE
            let activityMultiplier = 1.2;
            switch(activity) {
                case 'Sedentary': activityMultiplier = 1.2; break;
                case 'Light': activityMultiplier = 1.375; break;
                case 'Moderate': activityMultiplier = 1.55; break;
                case 'Active': activityMultiplier = 1.725; break;
                case 'Very Active': activityMultiplier = 1.9; break;
            }
            const tdee = bmr * activityMultiplier;

            // 4. Goal Adjustment
            let goalCals = tdee;
            if (goal === "Lose Fat") {
                goalCals = tdee - 500;
            } else if (goal === "Build Muscle") {
                goalCals = tdee + 350;
            }
            
            const minCals = gender === "Male" ? 1500 : 1200;
            calculatedCalories = Math.max(Math.round(goalCals), minCals);

            // 5. Macros split
            let pPct = 0.25, cPct = 0.50, fPct = 0.25;
            if (goal === "Lose Fat") {
                pPct = 0.40; cPct = 0.35; fPct = 0.25;
            } else if (goal === "Build Muscle") {
                pPct = 0.30; cPct = 0.50; fPct = 0.20;
            } else if (goal === "Improve Stamina") {
                pPct = 0.20; cPct = 0.60; fPct = 0.20;
            }

            proteinGrams = Math.round((calculatedCalories * pPct) / 4);
            carbGrams = Math.round((calculatedCalories * cPct) / 4);
            fatGrams = Math.round((calculatedCalories * fPct) / 9);

            // Go to lead capture screen
            goToStep(5);
        }

        function generateLocalCoachAdvice(name, goal, cal, limits, timeline) {
            let goalAction = "";
            let calorieDirective = "";
            let injuryAdvice = "";
            let motivationClose = "";

            if (goal === "Lose Fat") {
                goalAction = "igniting your metabolism and stripping away subcutaneous fat while conserving strength";
                calorieDirective = "We are prescribing a controlled energy deficit of " + cal + " calories daily. This is the precise biological window to trigger Lipolysis without downregulating your metabolic rate.";
                motivationClose = "Let's dial in the nutrition, " + name + ". The next " + timeline + " is about precise energy balance and unrelenting work ethic!";
            } else if (goal === "Build Muscle") {
                goalAction = "triggering protein synthesis, building heavy muscle density, and setting new physical plateaus";
                calorieDirective = "We are fueling your muscle hypertrophy with an anabolic calorie surplus target of " + cal + " calories daily. This powers structural recovery and cellular hydration.";
                motivationClose = "Time to work, " + name + ". Over the next " + timeline + ", we are moving heavier loads and eating with true muscle-building focus!";
            } else if (goal === "Improve Stamina") {
                goalAction = "supercharging your cardiorespiratory limits, glycogen efficiency, and lactic thresholds";
                calorieDirective = "We have structured an endurance carbohydrate-dominant protocol fueling you with " + cal + " daily calories to keep muscle glycogen saturated.";
                motivationClose = "Gear up, " + name + ". In this " + timeline + " aerobic conditioning cycle, we are going to expand your physical stamina horizons!";
            } else {
                goalAction = "elevating your overall physical functional conditioning and boosting cellular vitality";
                calorieDirective = "We are stabilizing your caloric maintenance at " + cal + " daily calories. This is structured to match your standard kinetic activity output perfectly.";
                motivationClose = "Let's elevate your life, " + name + ". Over this " + timeline + " body reconstitution cycle, we are going to build a resilient daily engine!";
            }

            if (limits && limits.toLowerCase() !== 'none') {
                injuryAdvice = "Acknowledging your " + limits + ", we will program highly focused joint-friendly vectors to safe-guard training health while reinforcing continuous force progression.";
            } else {
                injuryAdvice = "With 100% mobility clearance, we are green-lit to program standard Compound movements (squat, lift, press) to generate the maximum growth response.";
            }

            return "Hey " + name + ", welcome to your custom profile! Over the next " + timeline + ", our primary objective is " + goalAction + ". " + calorieDirective + " " + injuryAdvice + " " + motivationClose;
        }

        function generateJSWorkoutPlan(goal, limit) {
            let exerciseSplit = "";
            if (goal === "Lose Fat") {
                exerciseSplit = "🏃 WHAT TO DO (Fat Loss / Conditioning)\n" +
                    "- High-Intensity Interval Training (HIIT): 15 mins (30s sprint, 30s rest) on treadmill or assault bike.\n" +
                    "- Daily Steps: Target 10,000+ steps.\n\n" +
                    "🏋️ WHAT TO LIFT (High Metabolic Demands)\n" +
                    "1. Barbell Back Squats: 4 sets x 10-12 reps (moderate weight to keep heart rate high)\n" +
                    "2. Dumbbell Incline Bench Press: 3 sets x 12 reps\n" +
                    "3. Romanian Deadlifts: 3 sets x 12 reps (focus on hamstrings/glutes)\n" +
                    "4. Cable Lat Pulldowns: 3 sets x 12 reps\n\n" +
                    "💡 PRO TIP: Keep rest times strictly under 45-60 seconds between sets to maximize calorie burn.";
            } else if (goal === "Build Muscle") {
                exerciseSplit = "🔥 WHAT TO DO (Warm-up & Hypertrophy)\n" +
                    "- Dynamic Warm-up: 5-8 mins of arm circles, leg swings, and bodyweight squats.\n\n" +
                    "🏋️ WHAT TO LIFT (Strength & Size)\n" +
                    "1. Barbell Back Squats: 4 sets x 6-8 reps (heavy load, focus on progression)\n" +
                    "2. Flat Barbell Bench Press: 4 sets x 8 reps\n" +
                    "3. Barbell Conventional Deadlifts: 3 sets x 5 reps (intense full-body recruitment)\n" +
                    "4. Barbell Bent-Over Rows: 3 sets x 8 reps\n\n" +
                    "💡 PRO TIP: Aim to increase weight or reps every week (progressive overload). Sleep at least 8 hours for muscle recovery.";
            } else if (goal === "General Fitness") {
                exerciseSplit = "🧘 WHAT TO DO (Systemic Fitness & Core)\n" +
                    "- Cardio Base: 20 mins of steady-state jog or incline walk at 65% max heart rate.\n\n" +
                    "🏋️ WHAT TO LIFT (Functional Strength)\n" +
                    "1. Dumbbell Goblet Squats: 3 sets x 10 reps\n" +
                    "2. Push-ups / Assisted Chest Press: 3 sets x 12 reps\n" +
                    "3. Dumbbell Romanian Deadlifts: 3 sets x 10 reps\n" +
                    "4. Seated Cable Rows: 3 sets x 12 reps\n" +
                    "5. Plank Holds: 3 sets x 45-60 seconds\n\n" +
                    "💡 PRO TIP: Focus on perfect form and mind-muscle connection. Consistency is the primary catalyst!";
            } else {
                exerciseSplit = "⚡ WHAT TO DO (Stamina & Endurance)\n" +
                    "- Aerobic Engine: 20-30 mins of moderate-pace rowing or swimming.\n\n" +
                    "🏋️ WHAT TO LIFT (Muscular Endurance)\n" +
                    "1. Barbell Squats: 3 sets x 15 reps (light to moderate weight)\n" +
                    "2. Overhead Dumbbell Shoulder Press: 3 sets x 15 reps\n" +
                    "3. Bodyweight Pull-ups / Lat Pulldowns: 3 sets x 12-15 reps\n" +
                    "4. Kettlebell Swings: 3 sets x 20 reps\n\n" +
                    "💡 PRO TIP: Control the eccentric (lowering) phase of the movement. Breathe steadily and stay hydrated!";
            }

            if (limit && limit.toLowerCase() !== 'none' && limit.trim() !== '') {
                return "⚠️ LIMITATION ADJUSTMENT (" + limit + "):\nModify squats or deadlifts with high-stability machines (e.g. Leg Press or Smith Machine) if needed. Avoid loading any painful ranges.\n\n" + exerciseSplit;
            } else {
                return exerciseSplit;
            }
        }

        function generateJSDietPlan(goal, calories, limit) {
            const calBreakfast = Math.round(calories * 0.25);
            const calLunch = Math.round(calories * 0.35);
            const calDinner = Math.round(calories * 0.3);
            const calSnack = Math.round(calories * 0.1);

            return "🍳 BREAKFAST (approx. " + calBreakfast + " kcal)\n" +
                "- High-Protein Oats Bowl: 70g rolled oats cooked in almond milk, 1.5 scoops Whey protein, 15g peanut butter, and 40g fresh blueberries.\n" +
                "- Macros: Protein: 45g, Carbs: 55g, Fats: 12g\n\n" +
                "🥗 LUNCH (approx. " + calLunch + " kcal)\n" +
                "- Grilled Herb Chicken & Quinoa: 180g lean chicken breast, 150g cooked quinoa, 100g steamed broccoli, and 1 tsp olive oil dressing.\n" +
                "- Macros: Protein: 50g, Carbs: 48g, Fats: 10g\n\n" +
                "🥩 DINNER (approx. " + calDinner + " kcal)\n" +
                "- Pan-Seared Salmon Fillet: 160g salmon fillet or lean beef, 200g sweet potato mash, and asparagus with fresh spinach salad.\n" +
                "- Macros: Protein: 40g, Carbs: 45g, Fats: 16g\n\n" +
                "🍌 SNACKS & FUEL (approx. " + calSnack + " kcal)\n" +
                "- Recovery Greek Yogurt Cup: 200g 0% Greek Yogurt with 1 medium banana and a pinch of cinnamon.\n" +
                "- Macros: Protein: 20g, Carbs: 30g, Fats: 1g\n\n" +
                "💡 DIETARY COACHING TIP:\n" +
                "Drink at least 3-4 liters of water throughout the day. Fuel your body within 2 hours of your workouts to maximize recovery. Avoid processed sugars and keep your sodium in check!";
        }

        function submitLeadData() {
            const phone = document.getElementById('leadPhone').value.trim();
            const email = document.getElementById('leadEmail').value.trim();
            const name = document.getElementById('inputName').value.trim();
            const age = parseInt(document.getElementById('inputAge').value) || 25;
            const city = document.getElementById('inputCity').value.trim();
            const goal = document.getElementById('selectGoal').value;
            const timeline = document.getElementById('selectTimeline').value;
            const limits = document.getElementById('inputLimitations').value.trim() || "None";

            const finalPhone = phone || 'N/A';
            const finalEmail = email || 'guest@example.com';

            // Display loading indicator state or go to step 6 immediately
            // Populate results fields
            document.getElementById('resultNameLabel').innerText = name;
            document.getElementById('resultMetaLabel').innerText = age + ' Years • ' + document.getElementById('selectGender').value + ' • ' + (city || "Online Kiosk");
            document.getElementById('resultBmiVal').innerText = calculatedBmi;
            document.getElementById('resultBmiCat').innerText = bmiCategory;
            
            // Set BMI category colors
            const catLabel = document.getElementById('resultBmiCat');
            if (bmiCategory === "Normal weight") {
                catLabel.className = "px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block";
            } else if (bmiCategory === "Underweight" || bmiCategory === "Overweight") {
                catLabel.className = "px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-block";
            } else {
                catLabel.className = "px-2.5 py-1 text-[10px] font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20 inline-block";
            }

            document.getElementById('resultCalVal').innerText = calculatedCalories.toLocaleString();
            document.getElementById('resultGoalLabel').innerText = goal;
            document.getElementById('resultProteinGrams').innerText = proteinGrams + 'g';
            document.getElementById('resultCarbGrams').innerText = carbGrams + 'g';
            document.getElementById('resultFatGrams').innerText = fatGrams + 'g';
            
            // Build Coach Advice Text
            const adviceText = generateLocalCoachAdvice(name, goal, calculatedCalories, limits, timeline);
            document.getElementById('resultCoachAdvice').innerText = adviceText;

            // Generate and set workout & diet recommendations
            const workoutText = generateJSWorkoutPlan(goal, limits);
            document.getElementById('resultWorkoutPlan').innerText = workoutText;

            const dietText = generateJSDietPlan(goal, calculatedCalories, limits);
            document.getElementById('resultDietPlan').innerText = dietText;

            // Prepare Structured Lead JSON Data
            const leadPayload = {
                name: name,
                age: age,
                city: city || "Unknown",
                phone: phone,
                email: email,
                goal: goal,
                bmi: calculatedBmi,
                calorieTarget: calculatedCalories,
                timestamp: Date.now()
            };

            // Log lead data to console as strictly required in formatting
            console.log("CAPTURED LEAD DATA JSON:", JSON.stringify(leadPayload, null, 2));

            // Webhook CRM connection point
            if (WEBHOOK_URL) {
                fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(leadPayload)
                })
                .then(res => console.log('Lead synced to CRM Webhook successfully.'))
                .catch(err => console.error('Error syncing lead to webhook:', err));
            }

            // Unlock and go to step 6 (Results)
            goToStep(6);
        }

        function restartAssessment() {
            // Reset inputs
            document.getElementById('inputName').value = "";
            document.getElementById('inputCity').value = "";
            document.getElementById('inputLimitations').value = "";
            document.getElementById('leadPhone').value = "";
            document.getElementById('leadEmail').value = "";
            
            goToStep(1);
        }

        // PDF Generation function using jsPDF library
        function downloadPlanPDF() {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                const name = document.getElementById('resultNameLabel').innerText;
                const meta = document.getElementById('resultMetaLabel').innerText;
                const bmi = document.getElementById('resultBmiVal').innerText;
                const bmiCat = document.getElementById('resultBmiCat').innerText;
                const calories = document.getElementById('resultCalVal').innerText;
                const goal = document.getElementById('resultGoalLabel').innerText;
                const protein = document.getElementById('resultProteinGrams').innerText;
                const carbs = document.getElementById('resultCarbGrams').innerText;
                const fats = document.getElementById('resultFatGrams').innerText;
                const advice = document.getElementById('resultCoachAdvice').innerText;
                const workoutPlan = document.getElementById('resultWorkoutPlan').innerText;
                const dietPlan = document.getElementById('resultDietPlan').innerText;

                // PAGE 1: METRICS PROFILE & ADVICE
                doc.setFillColor(11, 12, 16); // Dark background header
                doc.rect(0, 0, 210, 45, 'F');
                
                // Gym logo / brand title in header
                doc.setTextColor(229, 9, 20); // Red
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(22);
                doc.text("IRONPULSE GYM", 15, 20);
                
                doc.setTextColor(150, 150, 150);
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(10);
                doc.text("ELITE ATHLETIC ASSESSMENT REPORT", 15, 28);
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(12);
                doc.text("Personalized Coaching Blueprint", 15, 36);

                // Section: Client Profile
                doc.setTextColor(20, 20, 20);
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(14);
                doc.text("CLIENT METRIC PROFILE", 15, 60);
                doc.setDrawColor(229, 9, 20);
                doc.setLineWidth(1);
                doc.line(15, 63, 195, 63);

                doc.setFont("Helvetica", "normal");
                doc.setFontSize(11);
                doc.text("Client Name: " + name, 15, 72);
                doc.text("Profile Info: " + meta, 15, 79);
                doc.text("Fitness Objective: " + goal, 15, 86);

                // Section: Biometrics
                doc.setFont("Helvetica", "bold");
                doc.text("Calculated Biometrics:", 15, 98);
                doc.setFont("Helvetica", "normal");
                doc.text("- Body Mass Index (BMI): " + bmi + " (" + bmiCat + ")", 20, 106);
                doc.text("- Recommended Caloric Target: " + calories + " kcal / day", 20, 113);

                // Section: Macronutrients
                doc.setFont("Helvetica", "bold");
                doc.text("Macronutrient Daily Ratios:", 15, 126);
                doc.setFont("Helvetica", "normal");
                doc.text("- Daily Protein Intake Target: " + protein, 20, 134);
                doc.text("- Daily Carbohydrate Target: " + carbs, 20, 141);
                doc.text("- Daily Healthy Fats Target: " + fats, 20, 148);

                // Section: AI Advice
                doc.setFont("Helvetica", "bold");
                doc.text("Personalized Coaching Recommendation Summary:", 15, 162);
                
                doc.setFont("Helvetica", "oblique");
                doc.setFontSize(10);
                const splitAdvice = doc.splitTextToSize(advice, 180);
                doc.text(splitAdvice, 15, 170);

                // PAGE 2: WORKOUT PLAN RECOMMENDATION
                doc.addPage();
                doc.setFillColor(11, 12, 16); // Dark background header
                doc.rect(0, 0, 210, 30, 'F');
                doc.setTextColor(229, 9, 20); // Red
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(14);
                doc.text("TAILORED ATHLETIC TRAINING SPLITS", 15, 18);

                doc.setTextColor(20, 20, 20);
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(10);
                const splitWorkout = doc.splitTextToSize(workoutPlan, 180);
                doc.text(splitWorkout, 15, 45);

                // PAGE 3: DIET TEMPLATE RECOMMENDATION
                doc.addPage();
                doc.setFillColor(11, 12, 16); // Dark background header
                doc.rect(0, 0, 210, 30, 'F');
                doc.setTextColor(229, 9, 20); // Red
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(14);
                doc.text("4-WEEK CUSTOM NUTRITIONAL PROTOCOL", 15, 18);

                doc.setTextColor(20, 20, 20);
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(10);
                const splitDiet = doc.splitTextToSize(dietPlan, 180);
                doc.text(splitDiet, 15, 45);

                // Signature stamp at bottom of page 3
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(11);
                doc.text("Marcus Tanner", 15, 230);
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(9);
                doc.text("Elite Performance Specialist, IronPulse", 15, 235);

                // Footer branding
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text("Report generated by IronPulse Kiosk Platform. © 2026 IronPulse.", 15, 280);

                doc.save("IronPulse-Fitness-Assessment-" + name.replace(/\s+/g, '-') + ".pdf");
            } catch (err) {
                alert("Error during PDF Generation, compiling results...");
                console.error(err);
            }
        }
    </script>
</body>
</html>
"""
    }
}
