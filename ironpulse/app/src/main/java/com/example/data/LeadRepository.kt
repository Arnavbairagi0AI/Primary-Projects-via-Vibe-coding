package com.example.data

import kotlinx.coroutines.flow.Flow

class LeadRepository(private val leadDao: LeadDao) {
    val allLeads: Flow<List<LeadEntity>> = leadDao.getAllLeads()

    suspend fun insertLead(lead: LeadEntity) {
        leadDao.insertLead(lead)
    }

    suspend fun deleteLeadById(id: Int) {
        leadDao.deleteLeadById(id)
    }

    suspend fun clearAllLeads() {
        leadDao.clearAllLeads()
    }

    // Calorie Tracking
    val allCalorieLogs: Flow<List<CalorieLog>> = leadDao.getAllCalorieLogs()

    suspend fun insertCalorieLog(log: CalorieLog) {
        leadDao.insertCalorieLog(log)
    }

    suspend fun deleteCalorieLogById(id: Int) {
        leadDao.deleteCalorieLogById(id)
    }

    suspend fun clearAllCalorieLogs() {
        leadDao.clearAllCalorieLogs()
    }

    // Weight Tracking
    val allWeightLogs: Flow<List<WeightLog>> = leadDao.getAllWeightLogs()

    suspend fun insertWeightLog(log: WeightLog) {
        leadDao.insertWeightLog(log)
    }

    suspend fun deleteWeightLogById(id: Int) {
        leadDao.deleteWeightLogById(id)
    }

    suspend fun clearAllWeightLogs() {
        leadDao.clearAllWeightLogs()
    }
}
