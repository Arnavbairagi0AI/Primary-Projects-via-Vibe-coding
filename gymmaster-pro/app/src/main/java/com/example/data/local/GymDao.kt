package com.example.data.local

import androidx.room.*
import com.example.data.model.*
import kotlinx.coroutines.flow.Flow

@Dao
interface GymDao {

    // --- Users ---
    @Query("SELECT * FROM users WHERE uid = :uid LIMIT 1")
    suspend fun getUserById(uid: String): User?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User)

    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<User>>

    // --- Settings ---
    @Query("SELECT * FROM settings WHERE id = 1 LIMIT 1")
    fun getSettingsFlow(): Flow<GymSettings?>

    @Query("SELECT * FROM settings WHERE id = 1 LIMIT 1")
    suspend fun getSettingsDirect(): GymSettings?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSettings(settings: GymSettings)

    // --- Membership Plans ---
    @Query("SELECT * FROM plans")
    fun getAllPlans(): Flow<List<MembershipPlan>>

    @Query("SELECT * FROM plans WHERE planId = :planId LIMIT 1")
    suspend fun getPlanById(planId: String): MembershipPlan?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlan(plan: MembershipPlan)

    @Query("DELETE FROM plans WHERE planId = :planId")
    suspend fun deletePlan(planId: String)

    // --- Trainers ---
    @Query("SELECT * FROM trainers")
    fun getAllTrainers(): Flow<List<Trainer>>

    @Query("SELECT * FROM trainers WHERE trainerId = :trainerId LIMIT 1")
    suspend fun getTrainerByIdDirect(trainerId: String): Trainer?

    @Query("SELECT * FROM trainers WHERE trainerId = :trainerId LIMIT 1")
    fun getTrainerById(trainerId: String): Flow<Trainer?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTrainer(trainer: Trainer)

    @Query("DELETE FROM trainers WHERE trainerId = :trainerId")
    suspend fun deleteTrainer(trainerId: String)

    // --- Members ---
    @Query("SELECT * FROM members ORDER BY name ASC")
    fun getAllMembers(): Flow<List<Member>>

    @Query("SELECT * FROM members WHERE memberId = :memberId LIMIT 1")
    fun getMemberById(memberId: String): Flow<Member?>

    @Query("SELECT * FROM members WHERE memberId = :memberId LIMIT 1")
    suspend fun getMemberByIdDirect(memberId: String): Member?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMember(member: Member)

    @Query("DELETE FROM members WHERE memberId = :memberId")
    suspend fun deleteMember(memberId: String)

    @Query("UPDATE members SET status = :status WHERE memberId = :memberId")
    suspend fun updateMemberStatus(memberId: String, status: String)

    @Query("UPDATE members SET paymentStatus = :paymentStatus WHERE memberId = :memberId")
    suspend fun updateMemberPaymentStatus(memberId: String, paymentStatus: String)

    // --- Renewals ---
    @Query("SELECT * FROM renewals WHERE memberId = :memberId ORDER BY renewedOn DESC")
    fun getRenewalsForMember(memberId: String): Flow<List<RenewalEntry>>

    @Query("SELECT * FROM renewals ORDER BY renewedOn DESC")
    fun getAllRenewals(): Flow<List<RenewalEntry>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRenewal(renewal: RenewalEntry)

    // --- Attendance ---
    @Query("SELECT * FROM attendance ORDER BY date DESC, checkIn DESC")
    fun getAllAttendance(): Flow<List<Attendance>>

    @Query("SELECT * FROM attendance WHERE date = :date ORDER BY checkIn DESC")
    fun getAttendanceForDate(date: String): Flow<List<Attendance>>

    @Query("SELECT * FROM attendance WHERE memberId = :memberId ORDER BY date DESC")
    fun getAttendanceForMember(memberId: String): Flow<List<Attendance>>

    @Query("SELECT * FROM attendance WHERE memberId = :memberId AND date = :date LIMIT 1")
    suspend fun getAttendanceForMemberAndDate(memberId: String, date: String): Attendance?

    @Query("SELECT * FROM attendance WHERE memberId = :memberId AND date = :date ORDER BY attendanceId DESC LIMIT 1")
    suspend fun getLatestAttendanceForMemberAndDate(memberId: String, date: String): Attendance?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAttendance(attendance: Attendance): Long

    // --- Trainer Attendance ---
    @Query("SELECT * FROM trainer_attendance ORDER BY date DESC, checkIn DESC")
    fun getAllTrainerAttendance(): Flow<List<TrainerAttendance>>

    @Query("SELECT * FROM trainer_attendance WHERE date = :date ORDER BY checkIn DESC")
    fun getTrainerAttendanceForDate(date: String): Flow<List<TrainerAttendance>>

    @Query("SELECT * FROM trainer_attendance WHERE trainerId = :trainerId ORDER BY date DESC")
    fun getTrainerAttendanceForTrainer(trainerId: String): Flow<List<TrainerAttendance>>

    @Query("SELECT * FROM trainer_attendance WHERE trainerId = :trainerId AND date = :date ORDER BY id DESC LIMIT 1")
    suspend fun getLatestTrainerAttendanceForDate(trainerId: String, date: String): TrainerAttendance?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTrainerAttendance(attendance: TrainerAttendance): Long

    // --- Payments ---
    @Query("SELECT * FROM payments ORDER BY date DESC")
    fun getAllPayments(): Flow<List<Payment>>

    @Query("SELECT * FROM payments WHERE memberId = :memberId")
    suspend fun getPaymentsForMemberDirect(memberId: String): List<Payment>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayment(payment: Payment)

    @Query("DELETE FROM payments WHERE paymentId = :paymentId")
    suspend fun deletePayment(paymentId: Int)

    // --- Workouts ---
    @Query("SELECT * FROM workouts WHERE memberId = :memberId LIMIT 1")
    fun getWorkoutForMember(memberId: String): Flow<WorkoutPlan?>

    @Query("SELECT * FROM workouts WHERE memberId = :memberId LIMIT 1")
    suspend fun getWorkoutForMemberDirect(memberId: String): WorkoutPlan?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWorkout(workout: WorkoutPlan)

    // --- Diet Plans ---
    @Query("SELECT * FROM diet_plans WHERE memberId = :memberId LIMIT 1")
    fun getDietForMember(memberId: String): Flow<DietPlan?>

    @Query("SELECT * FROM diet_plans WHERE memberId = :memberId LIMIT 1")
    suspend fun getDietForMemberDirect(memberId: String): DietPlan?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDiet(diet: DietPlan)

    // --- High-level transactions ---
    @Transaction
    suspend fun performOneClickRenewal(
        memberId: String,
        newExpiryDate: String,
        planName: String,
        amount: Double,
        paymentMethod: String,
        date: String
    ) {
        val member = getMemberByIdDirect(memberId) ?: return
        val updatedMember = member.copy(
            expiryDate = newExpiryDate,
            status = "active",
            paymentStatus = "paid"
        )
        insertMember(updatedMember)

        val payment = Payment(
            memberId = memberId,
            memberName = member.name,
            amount = amount,
            paymentMethod = paymentMethod,
            date = date,
            planName = planName,
            status = "Paid",
            transactionId = "TXN-REN-" + System.currentTimeMillis().toString().takeLast(6),
            type = "renewal"
        )
        insertPayment(payment)

        // Find the newly generated paymentId or rely on local insertion.
        // Let's create the renewal history entry:
        val renewal = RenewalEntry(
            memberId = memberId,
            renewedOn = date,
            previousExpiryDate = member.expiryDate,
            newExpiryDate = newExpiryDate,
            planName = planName,
            amount = amount,
            paymentId = "REN-" + System.currentTimeMillis().toString().takeLast(6)
        )
        insertRenewal(renewal)
    }
}
