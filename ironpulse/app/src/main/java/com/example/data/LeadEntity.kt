package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "leads")
data class LeadEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val age: Int,
    val gender: String,
    val city: String,
    val weight: Double,
    val weightUnit: String,
    val height: Double,
    val heightUnit: String,
    val activityLevel: String,
    val goal: String,
    val timeline: String,
    val limitations: String,
    val phone: String, // WhatsApp
    val email: String,
    val bmi: Double,
    val bmiCategory: String,
    val calorieTarget: Int,
    val proteinGrams: Int,
    val carbGrams: Int,
    val fatGrams: Int,
    val dietPlan: String = "",
    val workoutPlan: String = "",
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "calorie_logs")
data class CalorieLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val mealName: String,
    val calories: Int,
    val protein: Int = 0,
    val carbs: Int = 0,
    val fats: Int = 0,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "weight_logs")
data class WeightLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val weight: Double,
    val note: String = "",
    val timestamp: Long = System.currentTimeMillis()
)
