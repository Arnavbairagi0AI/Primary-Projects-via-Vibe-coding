package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.EmergencyContactEntity
import com.example.data.IncidentReportEntity
import com.example.data.MedicalProfileEntity
import com.example.data.RescueDatabase
import com.example.data.RescueRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class RescueViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: RescueRepository

    val medicalProfile: StateFlow<MedicalProfileEntity?>
    val emergencyContacts: StateFlow<List<EmergencyContactEntity>>
    val incidentReports: StateFlow<List<IncidentReportEntity>>
    val chatMessages: StateFlow<List<com.example.data.ChatMessageEntity>>

    private val _sosCountdown = MutableStateFlow(5)
    val sosCountdown: StateFlow<Int> = _sosCountdown.asStateFlow()

    private val _isSosCounting = MutableStateFlow(false)
    val isSosCounting: StateFlow<Boolean> = _isSosCounting.asStateFlow()

    private val _isSosActive = MutableStateFlow(false)
    val isSosActive: StateFlow<Boolean> = _isSosActive.asStateFlow()

    private val _sosCancelled = MutableStateFlow(false)
    val sosCancelled: StateFlow<Boolean> = _sosCancelled.asStateFlow()

    private val _isSendingChat = MutableStateFlow(false)
    val isSendingChat: StateFlow<Boolean> = _isSendingChat.asStateFlow()

    private val _safetyBroadcastSent = MutableStateFlow(false)
    val safetyBroadcastSent: StateFlow<Boolean> = _safetyBroadcastSent.asStateFlow()

    private var countdownJob: Job? = null

    init {
        val database = RescueDatabase.getDatabase(application)
        repository = RescueRepository(database.rescueDao())

        viewModelScope.launch {
            repository.seedInitialDataIfNeeded()
        }

        medicalProfile = repository.medicalProfile.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            MedicalProfileEntity()
        )

        emergencyContacts = repository.emergencyContacts.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            emptyList()
        )

        incidentReports = repository.incidentReports.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            emptyList()
        )

        chatMessages = repository.chatMessages.stateIn(
            viewModelScope,
            SharingStarted.WhileSubscribed(5000),
            emptyList()
        )
    }

    fun startSosCountdown() {
        if (_isSosCounting.value || _isSosActive.value) return
        _isSosCounting.value = true
        _sosCancelled.value = false
        _sosCountdown.value = 5

        countdownJob?.cancel()
        countdownJob = viewModelScope.launch {
            while (_sosCountdown.value > 0 && _isSosCounting.value) {
                delay(1000)
                _sosCountdown.value -= 1
            }
            if (_sosCountdown.value == 0 && _isSosCounting.value) {
                triggerEmergency()
            }
        }
    }

    fun cancelSos() {
        countdownJob?.cancel()
        _isSosCounting.value = false
        _isSosActive.value = false
        _sosCancelled.value = true
        _sosCountdown.value = 5
    }

    fun triggerEmergency() {
        countdownJob?.cancel()
        _isSosCounting.value = false
        _isSosActive.value = true
        _sosCancelled.value = false
    }

    fun resetSosState() {
        cancelSos()
        _sosCancelled.value = false
    }

    fun sendChatMessage(text: String) {
        if (text.isBlank()) return
        viewModelScope.launch {
            _isSendingChat.value = true
            repository.sendChatMessage(text)
            _isSendingChat.value = false
        }
    }

    fun saveMedicalProfile(name: String, bloodType: String, conditions: String, phone: String, note: String) {
        viewModelScope.launch {
            repository.saveMedicalProfile(
                MedicalProfileEntity(
                    id = 1,
                    name = name,
                    bloodType = bloodType,
                    conditions = conditions,
                    primaryPhone = phone,
                    emergencyNote = note
                )
            )
        }
    }

    fun addEmergencyContact(name: String, relationship: String, phone: String, isPrimary: Boolean) {
        viewModelScope.launch {
            repository.addEmergencyContact(
                EmergencyContactEntity(
                    name = name,
                    relationship = relationship,
                    phone = phone,
                    isPrimary = isPrimary
                )
            )
        }
    }

    fun deleteEmergencyContact(id: Int) {
        viewModelScope.launch {
            repository.deleteEmergencyContact(id)
        }
    }

    fun addIncidentReport(title: String, category: String, severity: String, location: String, description: String) {
        viewModelScope.launch {
            repository.addIncidentReport(
                IncidentReportEntity(
                    title = title,
                    category = category,
                    severity = severity,
                    distance = "NEARBY",
                    location = location,
                    description = description,
                    status = "VERIFIED"
                )
            )
        }
    }

    fun broadcastSafetyStatus() {
        viewModelScope.launch {
            _safetyBroadcastSent.value = true
            delay(3000)
            _safetyBroadcastSent.value = false
        }
    }
}
