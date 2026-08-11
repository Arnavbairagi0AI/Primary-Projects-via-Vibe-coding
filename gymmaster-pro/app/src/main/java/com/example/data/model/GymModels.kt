package com.example.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class User(
    @PrimaryKey val uid: String,
    val name: String,
    val email: String,
    val role: String, // "owner", "trainer", "receptionist"
    val trainerId: String? = null, // if role is trainer
    val profilePhoto: String? = null
)

@Entity(tableName = "settings")
data class GymSettings(
    @PrimaryKey val id: Int = 1, // Single row
    val gymName: String = "GymMaster Pro",
    val logoUrl: String = "",
    val address: String = "123 Fitness St, Health City",
    val phone: String = "+1 555-0199",
    val gstNumber: String = "GSTIN123456789",
    val currency: String = "₹",
    val workingHours: String = "06:00 AM - 10:00 PM",
    val themeColor: String = "#FF3D00", // Hex value
    val whatsappBusinessToken: String = "",
    val whatsappBusinessPhoneId: String = "",
    val aiProvider: String = "Gemini"
)

@Entity(tableName = "plans")
data class MembershipPlan(
    @PrimaryKey val planId: String,
    val name: String, // e.g. Gold, Silver, Premium
    val price: Double,
    val durationDays: Int, // e.g. 30, 90, 365
    val benefits: String // Comma separated, e.g. "Cardio, Gym Access, Trainer"
)

@Entity(tableName = "trainers")
data class Trainer(
    @PrimaryKey val trainerId: String,
    val name: String,
    val phone: String,
    val specialization: String,
    val experience: Int, // in years
    val salary: Double,
    val photo: String? = null, // Image URI/path
    val email: String = "",
    val joiningDate: String = ""
)

@Entity(tableName = "members")
data class Member(
    @PrimaryKey val memberId: String,
    val name: String,
    val phone: String,
    val email: String,
    val age: Int,
    val gender: String,
    val membershipPlan: String, // Plan ID or name
    val joiningDate: String, // YYYY-MM-DD
    val expiryDate: String, // YYYY-MM-DD
    val trainerId: String?, // Assigned Trainer ID
    val height: Double, // in cm
    val weight: Double, // in kg
    val bloodGroup: String,
    val photo: String? = null, // URI
    val status: String, // "active", "expired", "frozen"
    val paymentStatus: String, // "paid", "pending"
    val notes: String = "",
    val emergencyContact: String = "",
    val bmi: Double = 0.0,
    val bmiCategory: String = "",
    
    // REDESIGNED NEW FIELDS
    val fitnessGoal: String = "",
    val experience: String = "",
    val trainingPreference: String = "",
    val workoutDays: String = "",
    val workoutDuration: String = "",
    val medicalConditions: String = "",
    val injuries: String = "",
    val painLevel: Int = 0,
    val doctorRestrictions: String = "",
    val foodAllergies: String = "",
    val foodsToAvoid: String = "",
    val dietPreference: String = "",
    val waterIntake: Double = 0.0,
    val sleepHours: String = "",
    val occupation: String = "",
    val activityLevel: String = "",
    val stressLevel: String = "",
    val smoking: String = "",
    val alcohol: String = "",
    val bodyFat: Double = 0.0,
    val muscleMass: Double = 0.0,
    val waist: Double = 0.0,
    val chest: Double = 0.0,
    val arms: Double = 0.0,
    val thighs: Double = 0.0,
    val calves: Double = 0.0,
    val neck: Double = 0.0,
    val restingHeartRate: Int = 0,
    val bloodPressure: String = "",
    val specialInstructions: String = "",
    val createdAt: String = "",
    val updatedAt: String = ""
) {
    companion object {
        fun calculateBmi(heightCm: Double, weightKg: Double): Double {
            if (heightCm <= 0.0) return 0.0
            val heightM = heightCm / 100.0
            val bmi = weightKg / (heightM * heightM)
            return Math.round(bmi * 100.0) / 100.0
        }

        fun getBmiCategory(bmi: Double): String {
            if (bmi <= 0.0) return "Unknown"
            return when {
                bmi < 18.5 -> "Underweight"
                bmi < 25.0 -> "Normal"
                bmi < 30.0 -> "Overweight"
                else -> "Obese"
            }
        }
    }
}

@Entity(tableName = "renewals")
data class RenewalEntry(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val memberId: String,
    val renewedOn: String, // YYYY-MM-DD
    val previousExpiryDate: String,
    val newExpiryDate: String,
    val planName: String,
    val amount: Double,
    val paymentId: String
)

@Entity(tableName = "attendance")
data class Attendance(
    @PrimaryKey(autoGenerate = true) val attendanceId: Int = 0,
    val memberId: String,
    val memberName: String,
    val date: String, // YYYY-MM-DD
    val checkIn: String?, // HH:MM:SS
    val checkOut: String? // HH:MM:SS
)

@Entity(tableName = "payments")
data class Payment(
    @PrimaryKey(autoGenerate = true) val paymentId: Int = 0,
    val memberId: String,
    val memberName: String,
    val amount: Double,
    val paymentMethod: String, // "Cash", "UPI", "Card"
    val date: String, // YYYY-MM-DD
    val planName: String,
    val status: String, // "Paid", "Pending"
    val transactionId: String,
    val type: String // "new", "renewal"
)

@Entity(tableName = "workouts")
data class WorkoutPlan(
    @PrimaryKey val memberId: String, // 1 to 1 with Member
    val monday: String = "",
    val tuesday: String = "",
    val wednesday: String = "",
    val thursday: String = "",
    val friday: String = "",
    val notes: String = ""
)

@Entity(tableName = "diet_plans")
data class DietPlan(
    @PrimaryKey val memberId: String, // 1 to 1 with Member
    val breakfast: String = "",
    val lunch: String = "",
    val dinner: String = "",
    val snacks: String = "",
    val calories: Int = 2000,
    val protein: Int = 120, // grams
    val notes: String = ""
)

@Entity(tableName = "trainer_attendance")
data class TrainerAttendance(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val trainerId: String,
    val trainerName: String,
    val date: String, // YYYY-MM-DD
    val checkIn: String?, // HH:MM:SS
    val checkOut: String? // HH:MM:SS
)
