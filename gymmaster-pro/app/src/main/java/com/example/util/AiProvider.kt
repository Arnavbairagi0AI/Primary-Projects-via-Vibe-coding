package com.example.util

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.example.BuildConfig
import com.example.data.model.Member
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.SocketTimeoutException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

// --- Network Detection ---
object NetworkHelper {
    fun isInternetAvailable(context: Context): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return false
        val activeNetwork = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}

// --- Specific Exceptions ---
sealed class AiException(message: String, val code: String) : Exception(message) {
    class NoInternet : AiException("No Internet Connection. Please check your connectivity and try again.", "NO_INTERNET")
    class ApiKeyMissing : AiException("Gemini API Key Missing. Please configure it in the Secrets panel in AI Studio.", "API_KEY_MISSING")
    class AuthFailed(details: String) : AiException("Gemini Authentication Failed: $details", "AUTH_FAILED")
    class QuotaExceeded(details: String) : AiException("Gemini Quota Exceeded / Rate Limited: $details", "QUOTA_EXCEEDED")
    class InvalidResponse(details: String) : AiException("Gemini Returned Invalid Response: $details", "INVALID_RESPONSE")
    class Timeout(details: String) : AiException("Server Timeout: $details", "TIMEOUT")
    class Unknown(details: String) : AiException("Unknown Error: $details", "UNKNOWN")
}

// --- AI Provider Layer ---
interface AiProvider {
    val providerName: String
    
    suspend fun generateContent(
        context: Context,
        prompt: String,
        systemInstruction: String? = null
    ): String

    suspend fun generateWorkoutAndDietPlans(
        context: Context,
        member: Member,
        trainerName: String?
    ): String

    suspend fun generatePremiumCoachPlan(
        context: Context,
        member: Member,
        trainerName: String?
    ): String
}

// --- Retry and Logging Helper ---
object AiRequestHelper {
    suspend fun <T> retryWithBackoff(
        provider: String,
        block: suspend () -> T
    ): T {
        var attempt = 0
        val delays = listOf(1000L, 2000L, 4000L)
        while (true) {
            try {
                return block()
            } catch (e: AiException) {
                attempt++
                if (attempt > 3 || e is AiException.NoInternet || e is AiException.ApiKeyMissing) {
                    throw e
                }
                logFailedRequest(provider, attempt, e)
                val delayMs = delays.getOrElse(attempt - 1) { 4000L }
                android.util.Log.w("AiProvider", "Attempt $attempt failed. Retrying in ${delayMs / 1000}s... Error: ${e.message}")
                delay(delayMs)
            } catch (e: Exception) {
                attempt++
                if (attempt > 3) {
                    val fallbackEx = AiException.Unknown(e.message ?: e.toString())
                    logFailedRequest(provider, attempt, fallbackEx)
                    throw fallbackEx
                }
                logFailedRequest(provider, attempt, e)
                val delayMs = delays.getOrElse(attempt - 1) { 4000L }
                android.util.Log.w("AiProvider", "Attempt $attempt failed. Retrying in ${delayMs / 1000}s... Error: ${e.message}")
                delay(delayMs)
            }
        }
    }

    private fun logFailedRequest(provider: String, attempt: Int, e: Throwable) {
        val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date())
        val httpStatus: Int
        val errorCode: String
        val responseBody: String
        
        if (e is AiException) {
            errorCode = e.code
            when (e) {
                is AiException.AuthFailed -> {
                    httpStatus = 401
                    responseBody = e.message ?: ""
                }
                is AiException.QuotaExceeded -> {
                    httpStatus = 429
                    responseBody = e.message ?: ""
                }
                is AiException.Timeout -> {
                    httpStatus = 504
                    responseBody = e.message ?: ""
                }
                is AiException.InvalidResponse -> {
                    httpStatus = 200
                    responseBody = e.message ?: ""
                }
                else -> {
                    httpStatus = 0
                    responseBody = e.message ?: ""
                }
            }
        } else {
            httpStatus = 0
            errorCode = "UNKNOWN"
            responseBody = e.message ?: e.toString()
        }
        
        // Log to Logcat
        android.util.Log.e("AiProvider", """
            [FAILED AI REQUEST]
            Provider: $provider
            Timestamp: $timestamp
            Attempt: $attempt
            HTTP Status: $httpStatus
            Error Code: $errorCode
            Response Body: $responseBody
            Exception: ${e.stackTraceToString()}
        """.trimIndent())
    }
}

// --- AI Provider Implementations ---
class GeminiRestProvider : AiProvider {
    override val providerName: String = "Gemini"

    private val BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/"
    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private fun checkPreconditions(context: Context): String {
        if (!NetworkHelper.isInternetAvailable(context)) {
            throw AiException.NoInternet()
        }
        val apiKey = BuildConfig.GEMINI_API_KEY
        if (apiKey.isEmpty() || apiKey == "MY_GEMINI_API_KEY" || apiKey == "YOUR_API_KEY") {
            throw AiException.ApiKeyMissing()
        }
        return apiKey
    }

    override suspend fun generateContent(
        context: Context,
        prompt: String,
        systemInstruction: String?
    ): String = withContext(Dispatchers.IO) {
        AiRequestHelper.retryWithBackoff(providerName) {
            val apiKey = checkPreconditions(context)
            val model = "gemini-2.5-flash-lite"
            val url = "$BASE_URL$model:generateContent?key=$apiKey"

            val jsonRequest = JSONObject().apply {
                val contentsArray = JSONArray().apply {
                    put(JSONObject().apply {
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply {
                                put("text", prompt)
                            })
                        })
                    })
                }
                put("contents", contentsArray)

                if (systemInstruction != null) {
                    put("systemInstruction", JSONObject().apply {
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply {
                                put("text", systemInstruction)
                            })
                        })
                    })
                }
            }

            val body = jsonRequest.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url(url)
                .post(body)
                .build()

            try {
                client.newCall(request).execute().use { response ->
                    val responseBody = response.body?.string() ?: throw AiException.InvalidResponse("Empty response body")
                    if (!response.isSuccessful) {
                        handleHttpError(response.code, responseBody)
                    }

                    val jsonResponse = JSONObject(responseBody)
                    val candidates = jsonResponse.optJSONArray("candidates")
                    if (candidates != null && candidates.length() > 0) {
                        val firstCandidate = candidates.getJSONObject(0)
                        val content = firstCandidate.optJSONObject("content")
                        if (content != null) {
                            val parts = content.optJSONArray("parts")
                            if (parts != null && parts.length() > 0) {
                                return@retryWithBackoff parts.getJSONObject(0).optString("text", "No text in response")
                            }
                        }
                    }
                    throw AiException.InvalidResponse("Unexpected JSON structure: $responseBody")
                }
            } catch (e: Exception) {
                if (e is AiException) throw e
                if (e is SocketTimeoutException) {
                    throw AiException.Timeout(e.message ?: "Socket Timeout")
                }
                if (e is IOException) {
                    throw AiException.Timeout("Network/IO failure: ${e.message}")
                }
                throw AiException.Unknown(e.message ?: e.toString())
            }
        }
    }

    override suspend fun generateWorkoutAndDietPlans(
        context: Context,
        member: Member,
        trainerName: String?
    ): String = withContext(Dispatchers.IO) {
        AiRequestHelper.retryWithBackoff(providerName) {
            val apiKey = checkPreconditions(context)
            val model = "gemini-2.5-flash-lite"
            val url = "$BASE_URL$model:generateContent?key=$apiKey"

            val prompt = """
                Generate a personalized, custom 5-day workout plan and a nutrition/diet plan in JSON format for the following gym member:
                Name: ${member.name}
                Age: ${member.age}
                Gender: ${member.gender}
                Height: ${member.height} cm
                Weight: ${member.weight} kg
                Blood Group: ${member.bloodGroup}
                Notes/Goals/Medical History: ${member.notes}
                Membership Plan: ${member.membershipPlan}
                Assigned Trainer: ${trainerName ?: "None / General Gym Staff"}

                REDESIGNED PROFILE DETAILS:
                Primary Fitness Goal: ${member.fitnessGoal}
                Fitness Experience: ${member.experience}
                Training Preference: ${member.trainingPreference}
                Workout Frequency: ${member.workoutDays} per week
                Workout Duration: ${member.workoutDuration} per session
                Medical Conditions: ${member.medicalConditions}
                Previous Injuries: ${member.injuries}
                Current Pain Level: ${member.painLevel}/10
                Doctor Restrictions: ${member.doctorRestrictions}
                Food Allergies: ${member.foodAllergies}
                Foods They Cannot Eat: ${member.foodsToAvoid}
                Diet Preference: ${member.dietPreference}
                Daily Water Intake Goal: ${member.waterIntake} Litres
                Sleep Level: ${member.sleepHours} hours
                Occupation: ${member.occupation}
                Daily Activity Level: ${member.activityLevel}
                Stress Level: ${member.stressLevel}
                Smoking Status: ${member.smoking}
                Alcohol Frequency: ${member.alcohol}
                Body Fat %: ${member.bodyFat}%
                Muscle Mass: ${member.muscleMass} kg
                Measurements - Waist: ${member.waist} cm, Chest: ${member.chest} cm, Arms: ${member.arms} cm, Thighs: ${member.thighs} cm, Calves: ${member.calves} cm, Neck: ${member.neck} cm
                Resting Heart Rate: ${member.restingHeartRate} bpm
                Blood Pressure: ${member.bloodPressure}
                Special AI Instructions: ${member.specialInstructions}

                CORE TAILORING DIRECTIVES (INDIA LOCALE):
                1. INDIAN NUTRITION ONLY: Generate meal plans using commonly available Indian foods only, unless explicitly requested otherwise (e.g. if trainer requests quinoa, salmon, avocado toast, kale smoothie in Special AI Instructions).
                   Standard food options to select from:
                   - Breakfast: Poha, Upma, Idli, Dosa, Uttapam, Paratha, Chapati, Vegetable Sandwich, Sprouts Chaat, Oats, Dalia, Paneer Bhurji, Boiled Eggs, Besan Chilla, Moong Chilla.
                   - Lunch: Roti, Chapati, Rice, Brown Rice, Dal, Rajma, Chole, Sambar, Vegetable Curry, Paneer Curry, Chicken Curry, Fish Curry, Egg Curry, Curd, Salad.
                   - Evening Snack: Roasted Chana, Peanuts, Fruit (Banana, Apple, etc.), Coconut Water, Buttermilk, Protein Shake (optional), Sprouts, Makhana.
                   - Dinner: Chapati, Dal, Paneer, Chicken, Fish, Mixed Vegetables, Rice, Soup, Salad.
                   - Drinks: Water, Lemon Water, Coconut Water, Buttermilk, Milk, Black Coffee, Green Tea. Avoid expensive imported drinks (such as matcha, kombucha) unless requested.
                2. RESPECT DIETARY PREFERENCE: Match member's Diet Preference (`member.dietPreference`) exactly. It can be Vegetarian, Vegan, Eggetarian, Jain, Non-Vegetarian, High Protein Vegetarian, South Indian Diet, North Indian Diet, Marathi Diet, Gujarati Diet, Punjabi Diet, Bengali Diet, Tamil Diet, Telugu Diet, Kerala Diet, Karnataka Diet, Rajasthani Diet, etc. Tailor ingredients, regional flavor profile, and spice levels accordingly.
                3. RESPECT RELIGIOUS & FOOD RESTRICTIONS:
                   - Never recommend Beef or Pork to any Indian member unless explicitly requested.
                   - Jain Diet: If 'Jain' is selected or specified, strictly exclude all root vegetables (absolutely NO onions, NO garlic, NO potatoes, NO carrots, NO radish, NO ginger, etc.).
                   - Vegetarian Only: Absolutely NO meat, poultry, fish, seafood, or eggs. Dairy is permitted.
                   - Vegan Only: Absolutely NO animal products (NO meat, poultry, fish, eggs, dairy, milk, curd, paneer, butter, ghee, honey, whey protein).
                   - Egg-Free: Permitted vegetarian foods, but absolutely NO eggs.
                   - Dairy-Free: Absolutely NO milk, paneer, curd, cheese, butter, ghee, whey protein. Substitute with soy/almond milk or water-based options.
                   - Gluten-Free: Absolutely NO wheat (roti, paratha, chapati), semolina (suji/upma). Recommend rice, ragi, jowar, bajra, besan (chickpea flour), or amaranth instead.
                   - Nut-Free: Absolutely NO peanuts, tree nuts, or seeds.
                   - Seafood-Free: Absolutely NO fish, prawns, or shellfish.
                   - All allergies listed under Food Allergies or Foods They Cannot Eat must be strictly and completely excluded.
                4. BUDGET-FRIENDLY MEAL PLANS:
                   - Economy Tier: If the member's membership plan, budget, or instructions suggest budget constraints, focus on affordable local Indian foods (chapati, rice, local dals, eggs, milk, curd, seasonal local veggies, peanuts, roasted chana, soy chunks, sprouts). Avoid expensive nuts, imported seeds, berries, extra-virgin olive oil, expensive whey isolate, or salmon.
                   - Standard Tier: Balance paneer, chicken, standard whey protein, and common nuts/seeds.
                   - Premium Tier: Elite customized plans with premium health foods, high-quality supplements, or specific imports if requested.
                5. TRAINING TAILORING:
                   - Tailor workout exercises to the member's Training Preference (`member.trainingPreference`): e.g. Gym Machines (use gym machines), Free Weights (use dumbbells, barbells, kettlebells), Home Workout / Bodyweight Training (use bodyweight, bands, simple setups, with clear bodyweight alternatives).
                   - Match frequency to Workout Frequency per week, and duration to Workout Duration per session.
                   - Ensure maximum safety: list safety modifications/precautions for any previous injuries, medical conditions, current pain levels, or doctor restrictions.
                6. SPELLING & METRIC: Use Indian English spellings (e.g. warm-up, stabilisation) and strictly use metric units (kg, cm, litres).

                You MUST strictly return ONLY a JSON object with this exact structure:
                {
                  "workout": {
                    "monday": "Full day's specific workout routine details matching preferences and safe limits",
                    "tuesday": "Full day's specific workout routine details matching preferences and safe limits",
                    "wednesday": "Full day's specific workout routine details matching preferences and safe limits",
                    "thursday": "Full day's specific workout routine details matching preferences and safe limits",
                    "friday": "Full day's specific workout routine details matching preferences and safe limits",
                    "notes": "General safety tips, injury precautions, and trainer instructions"
                  },
                  "diet": {
                    "breakfast": "Full breakfast menu details with Indian portion sizes",
                    "lunch": "Full lunch menu details with Indian portion sizes",
                    "dinner": "Full dinner menu details with Indian portion sizes",
                    "snacks": "Evening snack and sports supplement/protein recommendations",
                    "calories": 2200,
                    "protein": 130,
                    "notes": "Hydration, lifestyle tips, and diet preferences notes"
                  }
                }
                Do not include any markdown, triple backticks, or text before or after the JSON.
            """.trimIndent()

            val jsonRequest = JSONObject().apply {
                val contentsArray = JSONArray().apply {
                    put(JSONObject().apply {
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply {
                                put("text", prompt)
                            })
                        })
                    })
                }
                put("contents", contentsArray)

                put("generationConfig", JSONObject().apply {
                    put("responseMimeType", "application/json")
                })

                put("systemInstruction", JSONObject().apply {
                    put("parts", JSONArray().apply {
                        put(JSONObject().apply {
                            put("text", "You are GymMaster Pro's elite, professional AI Fitness & Nutrition Coach. You operate strictly in India, formulating customized regimens using Indian foods, metric units, and tailored gym/home training preferences. You only output valid JSON.")
                        })
                    })
                })
            }

            val body = jsonRequest.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url(url)
                .post(body)
                .build()

            try {
                client.newCall(request).execute().use { response ->
                    val responseBody = response.body?.string() ?: throw AiException.InvalidResponse("Empty response body")
                    if (!response.isSuccessful) {
                        handleHttpError(response.code, responseBody)
                    }

                    val jsonResponse = JSONObject(responseBody)
                    val candidates = jsonResponse.optJSONArray("candidates")
                    if (candidates != null && candidates.length() > 0) {
                        val firstCandidate = candidates.getJSONObject(0)
                        val content = firstCandidate.optJSONObject("content")
                        if (content != null) {
                            val parts = content.optJSONArray("parts")
                            if (parts != null && parts.length() > 0) {
                                val text = parts.getJSONObject(0).optString("text", "")
                                // Simple validation to ensure it parses as JSON
                                try {
                                    JSONObject(text)
                                    return@retryWithBackoff text
                                } catch (e: Exception) {
                                    throw AiException.InvalidResponse("Returned text is not valid JSON: $text")
                                }
                            }
                        }
                    }
                    throw AiException.InvalidResponse("Unexpected JSON structure: $responseBody")
                }
            } catch (e: Exception) {
                if (e is AiException) throw e
                if (e is SocketTimeoutException) {
                    throw AiException.Timeout(e.message ?: "Socket Timeout")
                }
                if (e is IOException) {
                    throw AiException.Timeout("Network/IO failure: ${e.message}")
                }
                throw AiException.Unknown(e.message ?: e.toString())
            }
        }
    }

    override suspend fun generatePremiumCoachPlan(
        context: Context,
        member: Member,
        trainerName: String?
    ): String = withContext(Dispatchers.IO) {
        AiRequestHelper.retryWithBackoff(providerName) {
            val apiKey = checkPreconditions(context)
            val model = "gemini-2.5-flash-lite"
            val url = "$BASE_URL${model}:generateContent?key=$apiKey"

            val prompt = """
                Generate a fast, high-quality, customized workout and nutrition coaching plan in JSON format for:
                Name: ${member.name}
                Age: ${member.age}
                Gender: ${member.gender}
                Height: ${member.height} cm
                Weight: ${member.weight} kg
                BMI: ${member.bmi} (${member.bmiCategory})
                Goals/Notes: ${member.notes}
                Membership: ${member.membershipPlan}
                Trainer: ${trainerName ?: "None / General Staff"}

                REDESIGNED PROFILE DETAILS:
                Primary Fitness Goal: ${member.fitnessGoal}
                Fitness Experience: ${member.experience}
                Training Preference: ${member.trainingPreference}
                Workout Frequency: ${member.workoutDays} per week
                Workout Duration: ${member.workoutDuration} per session
                Medical Conditions: ${member.medicalConditions}
                Previous Injuries: ${member.injuries}
                Current Pain Level: ${member.painLevel}/10
                Doctor Restrictions: ${member.doctorRestrictions}
                Food Allergies: ${member.foodAllergies}
                Foods They Cannot Eat: ${member.foodsToAvoid}
                Diet Preference: ${member.dietPreference}
                Daily Water Intake Goal: ${member.waterIntake} Litres
                Sleep Level: ${member.sleepHours} hours
                Occupation: ${member.occupation}
                Daily Activity Level: ${member.activityLevel}
                Stress Level: ${member.stressLevel}
                Smoking Status: ${member.smoking}
                Alcohol Frequency: ${member.alcohol}
                Body Fat %: ${member.bodyFat}%
                Muscle Mass: ${member.muscleMass} kg
                Measurements - Waist: ${member.waist} cm, Chest: ${member.chest} cm, Arms: ${member.arms} cm, Thighs: ${member.thighs} cm, Calves: ${member.calves} cm, Neck: ${member.neck} cm
                Resting Heart Rate: ${member.restingHeartRate} bpm
                Blood Pressure: ${member.bloodPressure}
                Special AI Instructions: ${member.specialInstructions}

                CORE TAILORING DIRECTIVES (INDIA LOCALE):
                1. INDIAN NUTRITION ONLY: Generate meal plans using commonly available Indian foods only, unless explicitly requested otherwise (e.g. if trainer requests quinoa, salmon, avocado toast, kale smoothie in Special AI Instructions).
                   Standard food options to select from:
                   - Breakfast: Poha, Upma, Idli, Dosa, Uttapam, Paratha, Chapati, Vegetable Sandwich, Sprouts Chaat, Oats, Dalia, Paneer Bhurji, Boiled Eggs, Besan Chilla, Moong Chilla.
                   - Lunch: Roti, Chapati, Rice, Brown Rice, Dal, Rajma, Chole, Sambar, Vegetable Curry, Paneer Curry, Chicken Curry, Fish Curry, Egg Curry, Curd, Salad.
                   - Evening Snack: Roasted Chana, Peanuts, Fruit (Banana, Apple, etc.), Coconut Water, Buttermilk, Protein Shake (optional), Sprouts, Makhana.
                   - Dinner: Chapati, Dal, Paneer, Chicken, Fish, Mixed Vegetables, Rice, Soup, Salad.
                   - Drinks: Water, Lemon Water, Coconut Water, Buttermilk, Milk, Black Coffee, Green Tea. Avoid expensive imported drinks (such as matcha, kombucha) unless requested.
                2. RESPECT DIETARY PREFERENCE: Match member's Diet Preference (`member.dietPreference`) exactly. It can be Vegetarian, Vegan, Eggetarian, Jain, Non-Vegetarian, High Protein Vegetarian, South Indian Diet, North Indian Diet, Marathi Diet, Gujarati Diet, Punjabi Diet, Bengali Diet, Tamil Diet, Telugu Diet, Kerala Diet, Karnataka Diet, Rajasthani Diet, etc. Tailor ingredients, regional flavor profile, and spice levels accordingly.
                3. RESPECT RELIGIOUS & FOOD RESTRICTIONS:
                   - Never recommend Beef or Pork to any Indian member unless explicitly requested.
                   - Jain Diet: If 'Jain' is selected or specified, strictly exclude all root vegetables (absolutely NO onions, NO garlic, NO potatoes, NO carrots, NO radish, NO ginger, etc.).
                   - Vegetarian Only: Absolutely NO meat, poultry, fish, seafood, or eggs. Dairy is permitted.
                   - Vegan Only: Absolutely NO animal products (NO meat, poultry, fish, eggs, dairy, milk, curd, paneer, butter, ghee, honey, whey protein).
                   - Egg-Free: Permitted vegetarian foods, but absolutely NO eggs.
                   - Dairy-Free: Absolutely NO milk, paneer, curd, cheese, butter, ghee, whey protein. Substitute with soy/almond milk or water-based options.
                   - Gluten-Free: Absolutely NO wheat (roti, paratha, chapati), semolina (suji/upma). Recommend rice, ragi, jowar, bajra, besan (chickpea flour), or amaranth instead.
                   - Nut-Free: Absolutely NO peanuts, tree nuts, or seeds.
                   - Seafood-Free: Absolutely NO fish, prawns, or shellfish.
                   - All allergies listed under Food Allergies or Foods They Cannot Eat must be strictly and completely excluded.
                4. BUDGET-FRIENDLY MEAL PLANS:
                   - Economy Tier: If the member's membership plan, budget, or instructions suggest budget constraints, focus on affordable local Indian foods (chapati, rice, local dals, eggs, milk, curd, seasonal local veggies, peanuts, roasted chana, soy chunks, sprouts). Avoid expensive nuts, imported seeds, berries, extra-virgin olive oil, expensive whey isolate, or salmon.
                   - Standard Tier: Balance paneer, chicken, standard whey protein, and common nuts/seeds.
                   - Premium Tier: Elite customized plans with premium health foods, high-quality supplements, or specific imports if requested.
                5. TRAINING TAILORING:
                   - Tailor workout exercises to the member's Training Preference (`member.trainingPreference`): e.g. Gym Machines (use gym machines), Free Weights (use dumbbells, barbells, kettlebells), Home Workout / Bodyweight Training (use bodyweight, bands, simple setups, with clear bodyweight alternatives).
                   - Match frequency to Workout Frequency per week, and duration to Workout Duration per session.
                   - Ensure maximum safety: list safety modifications/precautions for any previous injuries, medical conditions, current pain levels, or doctor restrictions.
                6. SPELLING & METRIC: Use Indian English spellings (e.g. warm-up, stabilisation) and strictly use metric units (kg, cm, litres).

                Return strictly a raw JSON object with this exact structure (no markdown formatting, no backticks, no wrap):
                {
                  "workout": {
                    "warmup": "Dynamic warmup sequence with metric values and Indian English",
                    "strengthTraining": "Specific sets, reps, and resistance exercises tailored to preference and safety",
                    "cardio": "Intensity and cardio protocol tailored to preference and safety",
                    "core": "Core stability sequence tailored to preference and safety",
                    "cooldown": "Post-workout cooldown details tailored to preference and safety",
                    "stretching": "Static stretches tailored to preference and safety",
                    "recoveryTips": "Recovery and muscle soreness relief advice customized for India",
                    "notes": "Coaching cues and instructions"
                  },
                  "nutrition": {
                    "breakfast": "Breakfast details with Indian foods and portions",
                    "morningSnack": "Morning snack option using Indian foods and portions",
                    "lunch": "Lunch details with Indian foods and portions",
                    "preWorkout": "Pre-workout fueling and timing using Indian foods",
                    "postWorkout": "Post-workout recovery fuel using Indian foods",
                    "dinner": "Dinner details with Indian foods and portions",
                    "hydration": "Water target and hydration tips",
                    "supplements": "Supplement recommendations matching diet/budget tier",
                    "calories": 2000,
                    "protein": 130,
                    "carbohydrates": 180,
                    "fat": 60,
                    "notes": "Indian nutrition tips and guidelines"
                  },
                  "metadata": {
                    "goal": "Explain tailored fitness goal based on profile",
                    "confidenceScore": 99,
                    "bmi": ${member.bmi},
                    "healthAdvice": "Custom advice based on BMI category",
                    "sleep": "Optimized sleep duration and hygiene guidelines for recovery",
                    "dailyMotivation": "An inspiring, high-energy motivational quote",
                    "safetyNotes": "Precautions and warning labels based on injury/medical profiles"
                  }
                }
            """.trimIndent()

            val jsonRequest = JSONObject().apply {
                val contentsArray = JSONArray().apply {
                    put(JSONObject().apply {
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply {
                                put("text", prompt)
                            })
                        })
                    })
                }
                put("contents", contentsArray)

                put("generationConfig", JSONObject().apply {
                    put("responseMimeType", "application/json")
                })

                put("systemInstruction", JSONObject().apply {
                    put("parts", JSONArray().apply {
                        put(JSONObject().apply {
                            put("text", "You are GymMaster Pro's premium, world-class AI Fitness & Nutrition Smart Coach. You operate strictly in India, formulating elite customized regimens using Indian foods, metric units, and tailored training preferences. You only output valid JSON.")
                        })
                    })
                })
            }

            val body = jsonRequest.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url(url)
                .post(body)
                .build()

            try {
                client.newCall(request).execute().use { response ->
                    val responseBody = response.body?.string() ?: throw AiException.InvalidResponse("Empty response body")
                    if (!response.isSuccessful) {
                        handleHttpError(response.code, responseBody)
                    }

                    val jsonResponse = JSONObject(responseBody)
                    val candidates = jsonResponse.optJSONArray("candidates")
                    if (candidates != null && candidates.length() > 0) {
                        val firstCandidate = candidates.getJSONObject(0)
                        val content = firstCandidate.optJSONObject("content")
                        if (content != null) {
                            val parts = content.optJSONArray("parts")
                            if (parts != null && parts.length() > 0) {
                                val text = parts.getJSONObject(0).optString("text", "")
                                // Verify JSON formatting
                                try {
                                    JSONObject(text)
                                    return@retryWithBackoff text
                                } catch (e: Exception) {
                                    throw AiException.InvalidResponse("Returned text is not valid JSON: $text")
                                }
                            }
                        }
                    }
                    throw AiException.InvalidResponse("Unexpected JSON structure: $responseBody")
                }
            } catch (e: Exception) {
                if (e is AiException) throw e
                if (e is SocketTimeoutException) {
                    throw AiException.Timeout(e.message ?: "Socket Timeout")
                }
                if (e is IOException) {
                    throw AiException.Timeout("Network/IO failure: ${e.message}")
                }
                throw AiException.Unknown(e.message ?: e.toString())
            }
        }
    }

    private fun handleHttpError(code: Int, body: String) {
        val json = try { JSONObject(body) } catch (e: Exception) { null }
        val message = json?.optJSONArray("error")?.optJSONObject(0)?.optString("message")
            ?: json?.optJSONObject("error")?.optString("message")
            ?: "HTTP Error $code"

        when (code) {
            401, 403 -> throw AiException.AuthFailed(message)
            429 -> throw AiException.QuotaExceeded(message)
            504 -> throw AiException.Timeout(message)
            else -> throw AiException.Unknown("HTTP $code: $message")
        }
    }
}

// --- Mock/Fallback AI Support (Requirement 9) ---
class MockFallbackProvider : AiProvider {
    override val providerName: String = "Mock/Fallback"
    
    override suspend fun generateContent(context: Context, prompt: String, systemInstruction: String?): String = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) {
        kotlinx.coroutines.delay(1000)
        "Mock Response: For prompt '$prompt', the AI Coach suggests focusing on progressive overload and high-protein intake."
    }
    
    override suspend fun generateWorkoutAndDietPlans(context: Context, member: Member, trainerName: String?): String = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) {
        kotlinx.coroutines.delay(1200)
        org.json.JSONObject().apply {
            put("workout", org.json.JSONObject().apply {
                put("monday", "Mock Monday: Upper Body compound focus (bench press, rows, overhead press) for ${member.name}")
                put("tuesday", "Mock Tuesday: Lower Body compound focus (squats, deadlifts, calf raises)")
                put("wednesday", "Mock Wednesday: Active recovery (30 mins light cardio / mobility exercises)")
                put("thursday", "Mock Thursday: Shoulder/Arm conditioning routine")
                put("friday", "Mock Friday: High Intensity Interval Training (HIIT) + Core stability")
                put("notes", "Maintain proper posture and hydrate. Assigned trainer: ${trainerName ?: "General Gym Coach"}")
            })
            put("diet", org.json.JSONObject().apply {
                put("breakfast", "Mock Breakfast: 3 egg whites, 1 cup rolled oats with honey and a banana")
                put("lunch", "Mock Lunch: Grilled chicken breast (150g) with brown rice and mixed green vegetables")
                put("dinner", "Mock Dinner: Baked salmon/tofu with sweet potato mash and asparagus")
                put("snacks", "Mock Snacks: Whey protein isolate shake and a handful of mixed almonds")
                put("calories", 2250)
                put("protein", 135)
                put("notes", "Drink 3 to 4 liters of clean water daily.")
            })
        }.toString()
    }
    
    override suspend fun generatePremiumCoachPlan(context: Context, member: Member, trainerName: String?): String = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Default) {
        kotlinx.coroutines.delay(1500)
        org.json.JSONObject().apply {
            put("workout", org.json.JSONObject().apply {
                put("warmup", "Dynamic stretching: arm circles, hip opener drills, and 5 mins on rowing machine")
                put("strengthTraining", "Strength focus: Back Squat 4x8, Romanian Deadlift 3x10, DB Press 3x10 for ${member.name}")
                put("cardio", "Aerobic base: 20 minutes moderate brisk walking on treadmill at 6% incline")
                put("core", "Plank holds 3x45s, Hanging leg raises 3x12")
                put("cooldown", "Static stretching for hamstrings, quads, and shoulders")
                put("stretching", "Extended hip flexor and lower back release stretches")
                put("recoveryTips", "Ensure minimum 8 hours of sleep. Foam roll active muscle groups.")
                put("notes", "Keep rest intervals to 90 seconds. Assigned trainer: ${trainerName ?: "General Staff"}.")
            })
            put("nutrition", org.json.JSONObject().apply {
                put("breakfast", "Oatmeal with chia seeds, banana, and scoop of protein powder; 2 boiled egg whites")
                put("morningSnack", "Low-fat Greek yogurt with blueberries")
                put("lunch", "Tuna/Turkey wrap with whole wheat tortilla, spinach, tomatoes, and hummus side")
                put("preWorkout", "Medium apple with a tablespoon of natural peanut butter 45 minutes prior")
                put("postWorkout", "1 scoop whey protein shake with water and a banana")
                put("dinner", "Grilled lean steak or tempeh with roasted broccoli and quinoa")
                put("hydration", "Aim for 3.5 to 4 liters of water throughout the day")
                put("supplements", "Daily multivitamin and Omega-3 capsule")
                put("calories", 2100)
                put("protein", 150)
                put("carbohydrates", 215)
                put("fat", 65)
                put("notes", "Perfect for metabolic conditioning.")
            })
            put("metadata", org.json.JSONObject().apply {
                put("goal", "Lean Recomposition and Conditioning")
                put("confidenceScore", 98)
                put("bmi", member.bmi)
            })
        }.toString()
    }
}

// --- AI Provider Manager (Requirement 8) ---
object AiProviderManager {
    var currentProvider: AiProvider = GeminiRestProvider()
}
