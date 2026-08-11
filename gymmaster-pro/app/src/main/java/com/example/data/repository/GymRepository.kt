package com.example.data.repository

import android.content.Context
import android.util.Log
import com.example.data.local.AppDatabase
import com.example.data.local.GymDao
import com.example.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.*

class GymRepository(private val gymDao: GymDao) {

    // --- Flows ---
    val settings: Flow<GymSettings?> = gymDao.getSettingsFlow()
    val allPlans: Flow<List<MembershipPlan>> = gymDao.getAllPlans()
    val allTrainers: Flow<List<Trainer>> = gymDao.getAllTrainers()
    val allMembers: Flow<List<Member>> = gymDao.getAllMembers()
    val allPayments: Flow<List<Payment>> = gymDao.getAllPayments()
    val allRenewals: Flow<List<RenewalEntry>> = gymDao.getAllRenewals()
    val allAttendance: Flow<List<Attendance>> = gymDao.getAllAttendance()
    val allTrainerAttendance: Flow<List<TrainerAttendance>> = gymDao.getAllTrainerAttendance()

    fun getMemberById(memberId: String): Flow<Member?> = gymDao.getMemberById(memberId)
    fun getTrainerById(trainerId: String): Flow<Trainer?> = gymDao.getTrainerById(trainerId)
    fun getRenewalsForMember(memberId: String): Flow<List<RenewalEntry>> = gymDao.getRenewalsForMember(memberId)
    fun getAttendanceForDate(date: String): Flow<List<Attendance>> = gymDao.getAttendanceForDate(date)
    fun getTrainerAttendanceForDate(date: String): Flow<List<TrainerAttendance>> = gymDao.getTrainerAttendanceForDate(date)
    fun getAttendanceForMember(memberId: String): Flow<List<Attendance>> = gymDao.getAttendanceForMember(memberId)
    fun getTrainerAttendanceForTrainer(trainerId: String): Flow<List<TrainerAttendance>> = gymDao.getTrainerAttendanceForTrainer(trainerId)
    fun getWorkoutForMember(memberId: String): Flow<WorkoutPlan?> = gymDao.getWorkoutForMember(memberId)
    fun getDietForMember(memberId: String): Flow<DietPlan?> = gymDao.getDietForMember(memberId)

    // --- Direct Suspend Operations ---
    suspend fun getSettingsDirect(): GymSettings? = gymDao.getSettingsDirect()
    suspend fun getUserById(uid: String): User? = gymDao.getUserById(uid)
    suspend fun insertUser(user: User) = gymDao.insertUser(user)
    suspend fun getMemberByIdDirect(memberId: String): Member? = gymDao.getMemberByIdDirect(memberId)
    suspend fun getTrainerByIdDirect(trainerId: String): Trainer? = gymDao.getTrainerByIdDirect(trainerId)

    // --- Mutations ---
    suspend fun saveSettings(settings: GymSettings) = withContext(Dispatchers.IO) {
        gymDao.insertSettings(settings)
    }

    suspend fun savePlan(plan: MembershipPlan) = withContext(Dispatchers.IO) {
        gymDao.insertPlan(plan)
    }

    suspend fun deletePlan(planId: String) = withContext(Dispatchers.IO) {
        gymDao.deletePlan(planId)
    }

    suspend fun saveTrainer(trainer: Trainer) = withContext(Dispatchers.IO) {
        gymDao.insertTrainer(trainer)
    }

    suspend fun deleteTrainer(trainerId: String) = withContext(Dispatchers.IO) {
        gymDao.deleteTrainer(trainerId)
    }

    suspend fun saveMember(member: Member) = withContext(Dispatchers.IO) {
        gymDao.insertMember(member)
    }

    suspend fun deleteMember(memberId: String) = withContext(Dispatchers.IO) {
        gymDao.deleteMember(memberId)
    }

    suspend fun savePayment(payment: Payment) = withContext(Dispatchers.IO) {
        gymDao.insertPayment(payment)
        // Auto-update member's payment status if they are the payer
        val member = gymDao.getMemberByIdDirect(payment.memberId)
        if (member != null && payment.status == "Paid") {
            gymDao.updateMemberPaymentStatus(payment.memberId, "paid")
        } else if (member != null && payment.status == "Pending") {
            gymDao.updateMemberPaymentStatus(payment.memberId, "pending")
        }
    }

    suspend fun getPaymentsForMemberDirect(memberId: String): List<Payment> = withContext(Dispatchers.IO) {
        gymDao.getPaymentsForMemberDirect(memberId)
    }

    suspend fun deletePayment(paymentId: Int) = withContext(Dispatchers.IO) {
        gymDao.deletePayment(paymentId)
    }

    suspend fun saveWorkout(workout: WorkoutPlan) = withContext(Dispatchers.IO) {
        gymDao.insertWorkout(workout)
    }

    suspend fun saveDiet(diet: DietPlan) = withContext(Dispatchers.IO) {
        gymDao.insertDiet(diet)
    }

    private val lastScanTimes = java.util.concurrent.ConcurrentHashMap<String, Long>()

    suspend fun markAttendance(memberId: String): String = withContext(Dispatchers.IO) {
        val lastScan = lastScanTimes[memberId] ?: 0L
        val nowMs = System.currentTimeMillis()
        if (nowMs - lastScan < 3000) {
            return@withContext "Scan ignored: Please wait a few seconds between scans."
        }
        lastScanTimes[memberId] = nowMs

        val today = getTodayDate()
        val nowTime = getCurrentTime()
        val member = gymDao.getMemberByIdDirect(memberId) ?: return@withContext "Member not found"

        val existing = gymDao.getLatestAttendanceForMemberAndDate(memberId, today)
        if (existing == null || existing.checkOut != null) {
            // Check-In
            val checkInLog = Attendance(
                memberId = memberId,
                memberName = member.name,
                date = today,
                checkIn = nowTime,
                checkOut = null
            )
            val insertedId = gymDao.insertAttendance(checkInLog)
            
            // Sync to Firestore
            try {
                val uid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: "owner"
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                val map = hashMapOf(
                    "attendanceId" to insertedId,
                    "memberId" to memberId,
                    "memberName" to member.name,
                    "date" to today,
                    "checkIn" to nowTime,
                    "checkOut" to null
                )
                db.collection("admins").document(uid).collection("attendance").document(insertedId.toString()).set(map)
                    .addOnSuccessListener {
                        Log.d("GymRepository", "Member check-in stored in Firestore")
                    }
                    .addOnFailureListener { e ->
                        Log.e("GymRepository", "Failed to store check-in in Firestore", e)
                    }
            } catch (e: Exception) {
                Log.e("GymRepository", "Firestore is not available: ${e.message}")
            }

            return@withContext "Checked in: ${member.name} at $nowTime"
        } else {
            // Check-Out
            val checkOutLog = existing.copy(checkOut = nowTime)
            gymDao.insertAttendance(checkOutLog)
            
            // Sync to Firestore
            try {
                val uid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: "owner"
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                val map = hashMapOf(
                    "attendanceId" to existing.attendanceId,
                    "memberId" to memberId,
                    "memberName" to member.name,
                    "date" to today,
                    "checkIn" to existing.checkIn,
                    "checkOut" to nowTime
                )
                db.collection("admins").document(uid).collection("attendance").document(existing.attendanceId.toString()).set(map)
                    .addOnSuccessListener {
                        Log.d("GymRepository", "Member check-out updated in Firestore")
                    }
                    .addOnFailureListener { e ->
                        Log.e("GymRepository", "Failed to update check-out in Firestore", e)
                    }
            } catch (e: Exception) {
                Log.e("GymRepository", "Firestore is not available: ${e.message}")
            }

            return@withContext "Checked out: ${member.name} at $nowTime"
        }
    }

    suspend fun markTrainerAttendance(trainerId: String): String = withContext(Dispatchers.IO) {
        val lastScan = lastScanTimes[trainerId] ?: 0L
        val nowMs = System.currentTimeMillis()
        if (nowMs - lastScan < 3000) {
            return@withContext "Scan ignored: Please wait a few seconds between scans."
        }
        lastScanTimes[trainerId] = nowMs

        val today = getTodayDate()
        val nowTime = getCurrentTime()
        val trainer = gymDao.getTrainerByIdDirect(trainerId) ?: return@withContext "Trainer not found"

        val latest = gymDao.getLatestTrainerAttendanceForDate(trainerId, today)
        if (latest == null || latest.checkOut != null) {
            // Check-In
            val log = TrainerAttendance(
                trainerId = trainerId,
                trainerName = trainer.name,
                date = today,
                checkIn = nowTime,
                checkOut = null
            )
            val insertedId = gymDao.insertTrainerAttendance(log)

            // Sync to Firestore
            try {
                val uid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: "owner"
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                val map = hashMapOf(
                    "id" to insertedId,
                    "trainerId" to trainerId,
                    "trainerName" to trainer.name,
                    "date" to today,
                    "checkIn" to nowTime,
                    "checkOut" to null
                )
                db.collection("admins").document(uid).collection("trainer_attendance").document(insertedId.toString()).set(map)
                    .addOnSuccessListener {
                        Log.d("GymRepository", "Trainer check-in stored in Firestore")
                    }
                    .addOnFailureListener { e ->
                        Log.e("GymRepository", "Failed to store trainer check-in in Firestore", e)
                    }
            } catch (e: Exception) {
                Log.e("GymRepository", "Firestore is not available: ${e.message}")
            }

            return@withContext "Trainer Checked In: ${trainer.name} at $nowTime"
        } else {
            // Check-Out
            val updated = latest.copy(checkOut = nowTime)
            gymDao.insertTrainerAttendance(updated)

            // Sync to Firestore
            try {
                val uid = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: "owner"
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                val map = hashMapOf(
                    "id" to latest.id,
                    "trainerId" to trainerId,
                    "trainerName" to trainer.name,
                    "date" to today,
                    "checkIn" to latest.checkIn,
                    "checkOut" to nowTime
                )
                db.collection("admins").document(uid).collection("trainer_attendance").document(latest.id.toString()).set(map)
                    .addOnSuccessListener {
                        Log.d("GymRepository", "Trainer check-out updated in Firestore")
                    }
                    .addOnFailureListener { e ->
                        Log.e("GymRepository", "Failed to update trainer check-out in Firestore", e)
                    }
            } catch (e: Exception) {
                Log.e("GymRepository", "Firestore is not available: ${e.message}")
            }

            return@withContext "Trainer Checked Out: ${trainer.name} at $nowTime"
        }
    }

    suspend fun performOneClickRenewal(
        memberId: String,
        planId: String,
        amount: Double,
        paymentMethod: String
    ): String = withContext(Dispatchers.IO) {
        val member = gymDao.getMemberByIdDirect(memberId) ?: return@withContext "Member not found"
        val plan = gymDao.getPlanById(planId) ?: return@withContext "Plan not found"

        // Calculate new expiry date
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        var baseDate = Date()
        try {
            val currentExpiry = dateFormat.parse(member.expiryDate)
            if (currentExpiry != null && currentExpiry.after(Date())) {
                baseDate = currentExpiry // Extend from current active expiry
            }
        } catch (e: Exception) {
            // Default to today
        }

        val cal = Calendar.getInstance()
        cal.time = baseDate
        cal.add(Calendar.DAY_OF_YEAR, plan.durationDays)
        val newExpiry = dateFormat.format(cal.time)
        val todayStr = getTodayDate()

        gymDao.performOneClickRenewal(
            memberId = memberId,
            newExpiryDate = newExpiry,
            planName = plan.name,
            amount = amount,
            paymentMethod = paymentMethod,
            date = todayStr
        )

        return@withContext "Membership renewed until $newExpiry"
    }

    // --- Seeding ---
    suspend fun seedIfNeeded() = withContext(Dispatchers.IO) {
        val existingSettings = gymDao.getSettingsDirect()
        if (existingSettings != null) {
            Log.d("GymRepository", "Database already seeded.")
            return@withContext
        }

        Log.d("GymRepository", "Seeding database with pristine setup...")

        // 1. Settings
        val settings = GymSettings(
            gymName = "GymMaster Pro",
            address = "My Fitness Club",
            phone = "+91 ",
            gstNumber = "",
            currency = "₹",
            workingHours = "06:00 AM - 10:00 PM",
            themeColor = "#0056D2"
        )
        gymDao.insertSettings(settings)

        // 2. Users
        gymDao.insertUser(User("owner", "Admin Owner", "owner@gym.com", "owner"))
        gymDao.insertUser(User("owner_arnav", "Arnav Bairagi", "shadowfall07042008@gmail.com", "owner"))
        gymDao.insertUser(User("trainer_john", "Trainer Staff", "trainer@gym.com", "trainer", "T01"))
        gymDao.insertUser(User("reception_alice", "Receptionist Staff", "receptionist@gym.com", "receptionist"))

        // 3. Plans
        val planGold = MembershipPlan("P01", "Gold Plan", 4999.0, 90, "Gym Access, Cardio Area, Steam, Group Batches")
        val planSilver = MembershipPlan("P02", "Silver Plan", 1999.0, 30, "Gym Access, Cardio Area, Standard Locker")
        val planPlatinum = MembershipPlan("P03", "Platinum Annual", 14999.0, 365, "All Access, VIP Locker, Steam, Nutritionist Coach, Personal Trainer (12 Sessions)")
        gymDao.insertPlan(planGold)
        gymDao.insertPlan(planSilver)
        gymDao.insertPlan(planPlatinum)
    }

    // --- Helper date calculations ---
    fun getTodayDate(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    }

    private fun getCurrentTime(): String {
        return SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
    }

    suspend fun saveAttendanceDirect(attendance: Attendance) = withContext(Dispatchers.IO) {
        gymDao.insertAttendance(attendance)
    }

    suspend fun saveTrainerAttendanceDirect(attendance: TrainerAttendance) = withContext(Dispatchers.IO) {
        gymDao.insertTrainerAttendance(attendance)
    }

    suspend fun getLatestTrainerAttendanceForDate(trainerId: String, date: String): TrainerAttendance? = withContext(Dispatchers.IO) {
        gymDao.getLatestTrainerAttendanceForDate(trainerId, date)
    }

    suspend fun saveRenewalDirect(renewal: RenewalEntry) = withContext(Dispatchers.IO) {
        gymDao.insertRenewal(renewal)
    }
}
