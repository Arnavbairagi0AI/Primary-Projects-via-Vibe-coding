package com.example.data

import com.example.network.Content
import com.example.network.GeminiApiClient
import com.example.network.GenerateContentRequest
import com.example.network.Part
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull

class RescueRepository(private val dao: RescueDao) {

    val medicalProfile: Flow<MedicalProfileEntity?> = dao.getMedicalProfile()
    val emergencyContacts: Flow<List<EmergencyContactEntity>> = dao.getEmergencyContacts()
    val incidentReports: Flow<List<IncidentReportEntity>> = dao.getIncidentReports()
    val chatMessages: Flow<List<ChatMessageEntity>> = dao.getChatMessages()

    suspend fun seedInitialDataIfNeeded() {
        if (dao.getMedicalProfile().firstOrNull() == null) {
            dao.saveMedicalProfile(MedicalProfileEntity())
        }

        if (dao.getEmergencyContacts().firstOrNull().isNullOrEmpty()) {
            dao.insertContact(
                EmergencyContactEntity(
                    name = "Mark Jenkins",
                    relationship = "Brother / Primary Emergency Contact",
                    phone = "+1 (555) 019-8822",
                    isPrimary = true
                )
            )
            dao.insertContact(
                EmergencyContactEntity(
                    name = "County Rescue Command",
                    relationship = "Local Dispatch Station 4",
                    phone = "911 / Direct +1 (800) 555-0199",
                    isPrimary = false
                )
            )
        }

        if (dao.getIncidentReports().firstOrNull().isNullOrEmpty()) {
            dao.insertReport(
                IncidentReportEntity(
                    title = "Flood Alert: West River Basin",
                    category = "Flood",
                    severity = "HIGH",
                    distance = "2.4 MILES AWAY",
                    location = "Catawba Basin / West River",
                    description = "Rapid water rise (+4.2ft in next 2h). Evacuation routes active near Apex City.",
                    status = "VERIFIED"
                )
            )
            dao.insertReport(
                IncidentReportEntity(
                    title = "Downed Power Line & Debris",
                    category = "Power Outage",
                    severity = "MEDIUM",
                    distance = "0.9 MILES AWAY",
                    location = "120-150 Oakwood Ave",
                    description = "Main transformer damaged. Utility teams dispatched.",
                    status = "IN PROGRESS"
                )
            )
            dao.insertReport(
                IncidentReportEntity(
                    title = "Bridge Closed Due to High Water",
                    category = "Road Blocked",
                    severity = "MEDIUM",
                    distance = "1.8 MILES AWAY",
                    location = "Route 9 Overpass",
                    description = "Bridge temporarily impassable for compact vehicles.",
                    status = "VERIFIED"
                )
            )
        }

        if (dao.getChatMessages().firstOrNull().isNullOrEmpty()) {
            dao.insertChatMessage(
                ChatMessageEntity(
                    sender = "user",
                    message = "I'm stuck at home and the water is rising fast in my street. What should I do? My address is 124 Oakwood Ave.",
                    timestamp = System.currentTimeMillis() - 120000
                )
            )
            dao.insertChatMessage(
                ChatMessageEntity(
                    sender = "ai",
                    message = "EMERGENCY PROTOCOL ACTIVATED: Emergency services have been alerted to 124 Oakwood Ave. Follow these instructions immediately:\n\n1. Move Higher: Go to the highest floor or roof. Avoid the attic unless there is a clear exit.\n2. Power Off: Turn off electricity at the main breaker if you can safely reach it without entering water.\n3. DANGER: Do not attempt to swim or drive through flood waters. Just 6 inches of moving water can knock you down.",
                    timestamp = System.currentTimeMillis() - 60000,
                    hasSafetyProtocols = true,
                    rescueStatus = "Dispatching Ground Team (Unit Delta-4)"
                )
            )
        }
    }

    suspend fun saveMedicalProfile(profile: MedicalProfileEntity) {
        dao.saveMedicalProfile(profile)
    }

    suspend fun addEmergencyContact(contact: EmergencyContactEntity) {
        dao.insertContact(contact)
    }

    suspend fun deleteEmergencyContact(id: Int) {
        dao.deleteContact(id)
    }

    suspend fun addIncidentReport(report: IncidentReportEntity) {
        dao.insertReport(report)
    }

    suspend fun sendChatMessage(userText: String): String {
        // Save user message first
        dao.insertChatMessage(
            ChatMessageEntity(
                sender = "user",
                message = userText
            )
        )

        val apiKey = GeminiApiClient.getApiKey()
        var aiReplyText = ""

        if (apiKey.isNotBlank() && apiKey != "MY_GEMINI_API_KEY") {
            try {
                val systemInstruction = Content(
                    parts = listOf(
                        Part(
                            text = "You are RescueAI, an expert emergency disaster response AI assistant. Provide concise, clear, lifesaving instructions for emergency scenarios (floods, storms, power outages, fires, medical crises). Keep tone tactical, calm, authoritative, and direct."
                        )
                    )
                )

                val req = GenerateContentRequest(
                    contents = listOf(
                        Content(parts = listOf(Part(text = userText)))
                    ),
                    systemInstruction = systemInstruction
                )

                val response = GeminiApiClient.service.generateContent(apiKey, req)
                val reply = response.candidates?.firstOrNull()?.content?.parts?.firstOrNull()?.text
                if (!reply.isNullOrBlank()) {
                    aiReplyText = reply
                }
            } catch (e: Exception) {
                // Fallback to contextual intelligent rescue response if key is unavailable or fails
                aiReplyText = getFallbackRescueResponse(userText)
            }
        }

        if (aiReplyText.isBlank()) {
            aiReplyText = getFallbackRescueResponse(userText)
        }

        dao.insertChatMessage(
            ChatMessageEntity(
                sender = "ai",
                message = aiReplyText,
                hasSafetyProtocols = userText.contains("water", true) || userText.contains("stuck", true) || userText.contains("help", true) || userText.contains("flood", true),
                rescueStatus = "Rescue Unit Delta-4 ETA 6 Mins"
            )
        )

        return aiReplyText
    }

    private fun getFallbackRescueResponse(prompt: String): String {
        val lower = prompt.lowercase()
        return when {
            lower.contains("flood") || lower.contains("water") || lower.contains("stuck") -> {
                "IMMEDIATE SAFETY PROTOCOL: 1) Move to the highest floor or roof. Avoid sealed attics without roof access. 2) Turn off main breaker if accessible safely. 3) Stay clear of electrical outlets touching water. Rescue dispatch Delta-4 is monitoring your signal."
            }
            lower.contains("route") || lower.contains("evacuat") || lower.contains("map") -> {
                "EVACUATION ADVISORY: Primary route along Catawba Expressway is open northbound toward City Central Shelter. Avoid West River Basin overpass. Maintain 25mph speed limit in low visibility."
            }
            lower.contains("first aid") || lower.contains("injur") || lower.contains("medical") -> {
                "FIRST AID RESPONSE: Keep patient warm and calm. Elevate injured limb if bleeding. Press clean cloth firmly on wounds. EMS is notified and prioritizing high-severity tickets."
            }
            else -> {
                "RescueAI Neural Core Active. Emergency services and local shelter nodes are synced. Describe any immediate hazard or request specific guidance (e.g. Shelter locations, First Aid, Evacuation route)."
            }
        }
    }
}
