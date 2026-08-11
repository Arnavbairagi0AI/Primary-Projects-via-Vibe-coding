package com.example.util

import android.content.Context
import com.example.data.model.Member

object GeminiHelper {
    private var appContext: Context? = null
    private val aiService: AiService by lazy { AiServiceFactory.getService() }

    fun initialize(context: Context) {
        appContext = context.applicationContext
    }

    private fun getContext(): Context {
        return appContext ?: throw IllegalStateException("GeminiHelper is not initialized with a Context. Please call initialize(context) first.")
    }

    suspend fun generateContent(prompt: String, systemInstruction: String? = null): String {
        return try {
            aiService.generateContent(getContext(), prompt, systemInstruction)
        } catch (e: AiException) {
            "Error: ${e.code}: ${e.message}"
        } catch (e: Exception) {
            "Error: UNKNOWN: ${e.message ?: e.toString()}"
        }
    }

    suspend fun generateWorkoutAndDietPlans(member: Member, trainerName: String?): String? {
        return try {
            aiService.generateWorkoutPlan(getContext(), member, trainerName)
        } catch (e: AiException) {
            "Error: ${e.code}: ${e.message}"
        } catch (e: Exception) {
            "Error: UNKNOWN: ${e.message ?: e.toString()}"
        }
    }

    suspend fun generatePremiumCoachPlan(member: Member, trainerName: String?): String? {
        return try {
            aiService.generateCombinedPlan(getContext(), member, trainerName)
        } catch (e: AiException) {
            "Error: ${e.code}: ${e.message}"
        } catch (e: Exception) {
            "Error: UNKNOWN: ${e.message ?: e.toString()}"
        }
    }
}
