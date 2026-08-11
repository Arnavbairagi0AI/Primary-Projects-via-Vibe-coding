package com.example.data

import com.example.BuildConfig
import com.squareup.moshi.JsonClass
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.ResponseBody
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Query
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

// --- Moshi Mapped Gemini Request Models ---

@JsonClass(generateAdapter = true)
data class GeminiPart(
    val text: String? = null
)

@JsonClass(generateAdapter = true)
data class GeminiContent(
    val parts: List<GeminiPart>
)

@JsonClass(generateAdapter = true)
data class GeminiGenerationConfig(
    val responseMimeType: String? = null,
    val temperature: Float? = null
)

@JsonClass(generateAdapter = true)
data class GeminiRequest(
    val contents: List<GeminiContent>,
    val generationConfig: GeminiGenerationConfig? = null,
    val systemInstruction: GeminiContent? = null
)

// --- Moshi Mapped Gemini Response Models ---

@JsonClass(generateAdapter = true)
data class GeminiCandidate(
    val content: GeminiContent? = null
)

@JsonClass(generateAdapter = true)
data class GeminiResponse(
    val candidates: List<GeminiCandidate>? = null
)

// --- Retrofit Interface ---
interface GeminiApiEndpoint {
    @POST("v1beta/models/gemini-3.5-flash:generateContent")
    suspend fun generateContent(
        @Query("key") apiKey: String,
        @Body request: GeminiRequest
    ): GeminiResponse
}

// --- Gemini Recommendation Model ---
@JsonClass(generateAdapter = true)
data class RecommendationResult(
    val recommendedSongIds: List<String>,
    val personalizedMessage: String,
    val customReasoningMap: Map<String, String> // songId -> custom reasoning
)

object GeminiClient {
    private const val BASE_URL = "https://generativelanguage.googleapis.com/"

    private val moshi: Moshi = Moshi.Builder()
        .addLast(KotlinJsonAdapterFactory())
        .build()

    // 60-second timeouts as mandated by the gemini-api skill rules
    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    val api: GeminiApiEndpoint = retrofit.create(GeminiApiEndpoint::class.java)

    suspend fun getRecommendations(
        userHistoryText: String,
        availableSongsListText: String
    ): RecommendationResult = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.GEMINI_API_KEY
        if (apiKey.isEmpty() || apiKey == "MY_GEMINI_API_KEY") {
            return@withContext getFallbackRecommendations()
        }

        val prompt = """
            You are BeatStream's AI Music Recommendation Engine. Based on the user's listening history and a list of available songs, select 3-4 songs that match their taste, and generate a personal message and a reasoning for each recommended song.
            
            [USER HISTORY]:
            $userHistoryText
            
            [AVAILABLE SONGS]:
            $availableSongsListText
            
            Return ONLY a valid JSON object matching the following structure:
            {
              "recommendedSongIds": ["song_id_1", "song_id_2"],
              "personalizedMessage": "A friendly personalized message explaining why this curated vibe was picked for them today.",
              "customReasoningMap": {
                "song_id_1": "We noticed you enjoy energetic pop, so this upbeat song will keep your energy high!",
                "song_id_2": "Because you listened to chill acoustic tracks, this calming lofi track is perfect for winding down."
              }
            }
            Do not enclose the JSON in markdown code blocks or add any other text. Return ONLY the raw JSON string.
        """.trimIndent()

        val request = GeminiRequest(
            contents = listOf(
                GeminiContent(parts = listOf(GeminiPart(text = prompt)))
            ),
            generationConfig = GeminiGenerationConfig(
                responseMimeType = "application/json",
                temperature = 0.7f
            ),
            systemInstruction = GeminiContent(
                parts = listOf(GeminiPart(text = "You are a professional music curator. You always return raw JSON strictly matching the requested structure."))
            )
        )

        try {
            val response = api.generateContent(apiKey, request)
            val jsonText = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
            if (!jsonText.isNullOrEmpty()) {
                val adapter = moshi.adapter(RecommendationResult::class.java)
                adapter.fromJson(jsonText) ?: getFallbackRecommendations()
            } else {
                getFallbackRecommendations()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            getFallbackRecommendations()
        }
    }

    private fun getFallbackRecommendations(): RecommendationResult {
        return RecommendationResult(
            recommendedSongIds = listOf("song_ocean", "song_lofi_rain", "song_synth_wave"),
            personalizedMessage = "We've curated a soothing, ambient mix of lo-fi, chill wave, and synth soundscapes to elevate your focus and keep you in your creative zone.",
            customReasoningMap = mapOf(
                "song_ocean" to "A refreshing ambient breeze, recommended based on your recent chill listening.",
                "song_lofi_rain" to "Perfect calming rhythms for coding, writing, or winding down.",
                "song_synth_wave" to "A high-fidelity retro beat to keep your mental flow state active."
            )
        )
    }

    // Dynamic Lyrics Generator
    suspend fun generateLyrics(songTitle: String, artist: String): String = withContext(Dispatchers.IO) {
        val apiKey = BuildConfig.GEMINI_API_KEY
        if (apiKey.isEmpty() || apiKey == "MY_GEMINI_API_KEY") {
            return@withContext "[Verse 1]\nSilent waves and midnight glows\nTracing paths where nobody knows\nEvery heartbeat, a quiet song\nWe've been searching for so long...\n\n[Chorus]\nAnd we stream into the deep blue\nEvery melody reminds me of you\nHigh fidelity, high emotion\nLost in our beautiful ocean..."
        }

        val prompt = "Generate a beautifully structured, poetic set of lyrics for a song titled '$songTitle' by '$artist'. Include Verse, Chorus, and Bridge sections. Keep it compact, expressive, and formatted with clean line breaks."
        val request = GeminiRequest(
            contents = listOf(GeminiContent(parts = listOf(GeminiPart(text = prompt))))
        )

        try {
            val response = api.generateContent(apiKey, request)
            response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text ?: "Lyrics unavailable"
        } catch (e: Exception) {
            "Error loading lyrics: ${e.message}"
        }
    }
}
