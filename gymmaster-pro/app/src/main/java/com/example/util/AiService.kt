package com.example.util

import android.content.Context
import com.example.data.model.Member
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.util.concurrent.ConcurrentHashMap

// --- AI Service Interface (Decoupled Layer) ---
interface AiService {
    suspend fun generateWorkoutPlan(context: Context, member: Member, trainerName: String?): String
    suspend fun generateNutritionPlan(context: Context, member: Member, trainerName: String?): String
    suspend fun generateCombinedPlan(context: Context, member: Member, trainerName: String?): String
    suspend fun generateContent(context: Context, prompt: String, systemInstruction: String? = null): String
}

// --- Singleton Decoupled AI Service Implementation ---
object AiServiceFactory {
    private val serviceInstance: AiService by lazy { AiServiceImpl() }
    
    fun getService(): AiService = serviceInstance
}

class AiServiceImpl : AiService {
    
    // Cache for successfully generated plans to improve performance and prevent duplicate hits
    private val planCache = ConcurrentHashMap<String, String>()
    
    // Active jobs map to deduplicate duplicate requests for the same member simultaneously
    private val activeJobs = ConcurrentHashMap<String, Deferred<String>>()
    private val jobsMutex = Mutex()

    // Helper to get cache key based on operation and member ID
    private fun getCacheKey(operation: String, memberId: String): String = "${operation}_${memberId}"

    override suspend fun generateWorkoutPlan(
        context: Context,
        member: Member,
        trainerName: String?
    ): String = withContext(Dispatchers.IO) {
        val cacheKey = getCacheKey("workout", member.memberId)
        
        // 1. Check Cache
        planCache[cacheKey]?.let {
            android.util.Log.d("AiService", "Cache hit for workout plan: ${member.memberId}")
            return@withContext it
        }

        // 2. Deduplicate/Queue active requests
        val deferred = jobsMutex.withLock {
            activeJobs.getOrPut(cacheKey) {
                async {
                    val provider = AiProviderManager.currentProvider
                    android.util.Log.i("AiService", "Generating workout plan via ${provider.providerName} for ${member.memberId}")
                    provider.generateWorkoutAndDietPlans(context, member, trainerName)
                }
            }
        }

        try {
            val result = deferred.await()
            // Cache successful result
            planCache[cacheKey] = result
            result
        } finally {
            jobsMutex.withLock {
                activeJobs.remove(cacheKey)
            }
        }
    }

    override suspend fun generateNutritionPlan(
        context: Context,
        member: Member,
        trainerName: String?
    ): String = withContext(Dispatchers.IO) {
        val cacheKey = getCacheKey("nutrition", member.memberId)
        
        // 1. Check Cache
        planCache[cacheKey]?.let {
            android.util.Log.d("AiService", "Cache hit for nutrition plan: ${member.memberId}")
            return@withContext it
        }

        // 2. Deduplicate/Queue active requests
        val deferred = jobsMutex.withLock {
            activeJobs.getOrPut(cacheKey) {
                async {
                    val provider = AiProviderManager.currentProvider
                    android.util.Log.i("AiService", "Generating nutrition plan via ${provider.providerName} for ${member.memberId}")
                    provider.generateWorkoutAndDietPlans(context, member, trainerName)
                }
            }
        }

        try {
            val result = deferred.await()
            planCache[cacheKey] = result
            result
        } finally {
            jobsMutex.withLock {
                activeJobs.remove(cacheKey)
            }
        }
    }

    override suspend fun generateCombinedPlan(
        context: Context,
        member: Member,
        trainerName: String?
    ): String = withContext(Dispatchers.IO) {
        val cacheKey = getCacheKey("combined", member.memberId)
        
        // 1. Check Cache
        planCache[cacheKey]?.let {
            android.util.Log.d("AiService", "Cache hit for combined premium plan: ${member.memberId}")
            return@withContext it
        }

        // 2. Deduplicate/Queue active requests
        val deferred = jobsMutex.withLock {
            activeJobs.getOrPut(cacheKey) {
                async {
                    val provider = AiProviderManager.currentProvider
                    android.util.Log.i("AiService", "Generating combined premium coach plan via ${provider.providerName} for ${member.memberId}")
                    provider.generatePremiumCoachPlan(context, member, trainerName)
                }
            }
        }

        try {
            val result = deferred.await()
            planCache[cacheKey] = result
            result
        } finally {
            jobsMutex.withLock {
                activeJobs.remove(cacheKey)
            }
        }
    }

    override suspend fun generateContent(
        context: Context,
        prompt: String,
        systemInstruction: String?
    ): String = withContext(Dispatchers.IO) {
        // Content generation calls (un-cached, but using active provider)
        val provider = AiProviderManager.currentProvider
        provider.generateContent(context, prompt, systemInstruction)
    }
}
