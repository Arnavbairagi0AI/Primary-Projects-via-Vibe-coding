package com.example.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface LeadDao {
    @Query("SELECT * FROM leads ORDER BY timestamp DESC")
    fun getAllLeads(): Flow<List<LeadEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLead(lead: LeadEntity)

    @Query("DELETE FROM leads WHERE id = :id")
    suspend fun deleteLeadById(id: Int)

    @Query("DELETE FROM leads")
    suspend fun clearAllLeads()

    // Calorie Tracking Queries
    @Query("SELECT * FROM calorie_logs ORDER BY timestamp DESC")
    fun getAllCalorieLogs(): Flow<List<CalorieLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCalorieLog(log: CalorieLog)

    @Query("DELETE FROM calorie_logs WHERE id = :id")
    suspend fun deleteCalorieLogById(id: Int)

    @Query("DELETE FROM calorie_logs")
    suspend fun clearAllCalorieLogs()

    // Weight Log Queries
    @Query("SELECT * FROM weight_logs ORDER BY timestamp ASC")
    fun getAllWeightLogs(): Flow<List<WeightLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWeightLog(log: WeightLog)

    @Query("DELETE FROM weight_logs WHERE id = :id")
    suspend fun deleteWeightLogById(id: Int)

    @Query("DELETE FROM weight_logs")
    suspend fun clearAllWeightLogs()
}
