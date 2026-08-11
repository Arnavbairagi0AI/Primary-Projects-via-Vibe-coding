package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "incident_reports")
data class IncidentReportEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,
    val category: String, // Flood, Power Outage, Fallen Tree, Road Blocked, Medical, Fire
    val severity: String, // HIGH, MEDIUM, LOW
    val distance: String,
    val location: String,
    val timestamp: Long = System.currentTimeMillis(),
    val description: String,
    val status: String = "VERIFIED" // VERIFIED, IN PROGRESS, RESOLVED
)
