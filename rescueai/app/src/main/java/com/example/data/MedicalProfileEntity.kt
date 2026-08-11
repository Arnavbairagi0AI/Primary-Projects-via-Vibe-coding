package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "medical_profile")
data class MedicalProfileEntity(
    @PrimaryKey val id: Int = 1,
    val name: String = "Sarah Jenkins",
    val bloodType: String = "O+ Negative",
    val conditions: String = "Asthma, Nut Allergy",
    val primaryPhone: String = "+1 (555) 019-2834",
    val emergencyNote: String = "Requires inhaler in severe smoke/dust environments."
)
