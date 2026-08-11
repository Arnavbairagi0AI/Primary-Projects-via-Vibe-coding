/*
 * Developed by Arnav Bairagi
 * © Arnav Bairagi. All Rights Reserved.
 */

package com.example.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.GymRepository
import com.example.data.repository.GymHttpServer
import com.example.util.GeminiHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class ScanResult(
    val status: String, // "CHECK_IN", "CHECK_OUT", "ERROR"
    val message: String,
    val name: String,
    val timestamp: String
)

class GymViewModel(
    private val repository: GymRepository,
    private val context: android.content.Context
) : ViewModel() {

    // --- Session / Role State ---
    private val defaultOwnerUser = User("owner_uid", "Arnav Bairagi", "owner@gym.com", "owner", null, null)
    private val _currentUser = MutableStateFlow<User?>(defaultOwnerUser)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _authLoadingState = MutableStateFlow(AuthLoadingState.VERIFYING)
    val authLoadingState: StateFlow<AuthLoadingState> = _authLoadingState.asStateFlow()

    private val sharedPrefs by lazy {
        context.getSharedPreferences("gym_admin_session", android.content.Context.MODE_PRIVATE)
    }

    private fun getFallbackUserSession(): User? {
        val email = sharedPrefs.getString("email", null) ?: return null
        val uid = sharedPrefs.getString("uid", "owner") ?: "owner"
        val name = sharedPrefs.getString("name", "Admin Owner") ?: "Admin Owner"
        val role = sharedPrefs.getString("role", "owner") ?: "owner"
        val profilePhoto = sharedPrefs.getString("profilePhoto", null)
        return User(uid, name, email, role, null, profilePhoto)
    }

    private fun saveFallbackUserSession(user: User) {
        sharedPrefs.edit().apply {
            putString("email", user.email)
            putString("uid", user.uid)
            putString("name", user.name)
            putString("role", user.role)
            putString("profilePhoto", user.profilePhoto)
            apply()
        }
    }

    private fun clearFallbackUserSession() {
        sharedPrefs.edit().clear().apply()
    }

    fun fetchAdminProfile(email: String, onComplete: (User) -> Unit = {}) {
        viewModelScope.launch {
            val defaultName = if (email.equals("shadowfall07042008@gmail.com", ignoreCase = true)) "Arnav Bairagi" else "Alex Mercer"
            val cachedName = sharedPrefs.getString("name", null)
            val cachedPhoto = sharedPrefs.getString("profilePhoto", null)
            val cachedRole = sharedPrefs.getString("role", "owner") ?: "owner"
            
            val hasCache = cachedName != null
            var currentName = cachedName ?: "Loading profile..."
            var currentPhoto = cachedPhoto
            var currentRole = cachedRole

            // Get UID from Firebase Auth if available, otherwise generate a deterministic unique UID from email
            val uid = try {
                com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid
                    ?: "offline_uid_" + email.replace("@", "_").replace(".", "_")
            } catch (t: Throwable) {
                "offline_uid_" + email.replace("@", "_").replace(".", "_")
            }

            // If we don't have a cache, set name as "Loading profile..." immediately in current user state
            if (!hasCache) {
                val loadingUser = User(uid, "Loading profile...", email, currentRole, null, currentPhoto)
                _currentUser.value = loadingUser
            }

            // Sync from Firebase Auth
            try {
                val fbUser = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser
                if (fbUser != null && fbUser.email.equals(email, ignoreCase = true)) {
                    if (!fbUser.displayName.isNullOrBlank()) {
                        currentName = fbUser.displayName!!
                    }
                    if (fbUser.photoUrl != null) {
                        currentPhoto = fbUser.photoUrl.toString()
                    }
                }
            } catch (t: Throwable) {
                t.printStackTrace()
            }

            // Fetch from Firestore
            try {
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                // Fetch profile document inside admins/{uid}/profile/admin_profile
                db.collection("admins").document(uid).collection("profile").document("admin_profile").get()
                    .addOnSuccessListener { document ->
                        if (document != null && document.exists()) {
                            val fName = document.getString("fullName") ?: document.getString("name")
                            val fPhoto = document.getString("profilePhoto") ?: document.getString("photoUrl")
                            val fRole = document.getString("role")

                            if (!fName.isNullOrBlank()) currentName = fName
                            if (fPhoto != null) currentPhoto = fPhoto
                            if (!fRole.isNullOrBlank()) currentRole = fRole

                            val finalUser = User(uid, currentName, email, currentRole, null, currentPhoto)
                            _currentUser.value = finalUser
                            saveFallbackUserSession(finalUser)
                            onComplete(finalUser)
                            
                            // Initialize listeners and perform sync
                            startFirestoreDashboardListeners()
                            viewModelScope.launch {
                                repository.seedIfNeeded()
                                syncLocalDataToFirestore()
                            }
                        } else {
                            if (currentName == "Loading profile...") {
                                currentName = defaultName
                            }
                            val adminMap = hashMapOf(
                                "fullName" to currentName,
                                "email" to email,
                                "profilePhoto" to (currentPhoto ?: ""),
                                "role" to currentRole
                            )
                            db.collection("admins").document(uid).collection("profile").document("admin_profile").set(adminMap)
                            val finalUser = User(uid, currentName, email, currentRole, null, currentPhoto)
                            _currentUser.value = finalUser
                            saveFallbackUserSession(finalUser)
                            onComplete(finalUser)
                            
                            // Initialize listeners and perform sync
                            startFirestoreDashboardListeners()
                            viewModelScope.launch {
                                repository.seedIfNeeded()
                                syncLocalDataToFirestore()
                            }
                        }
                    }
                    .addOnFailureListener {
                        if (currentName == "Loading profile...") {
                            currentName = defaultName
                        }
                        val finalUser = User(uid, currentName, email, currentRole, null, currentPhoto)
                        _currentUser.value = finalUser
                        saveFallbackUserSession(finalUser)
                        onComplete(finalUser)
                        
                        startFirestoreDashboardListeners()
                        viewModelScope.launch {
                            repository.seedIfNeeded()
                            syncLocalDataToFirestore()
                        }
                    }
            } catch (e: Exception) {
                if (currentName == "Loading profile...") {
                    currentName = defaultName
                }
                val finalUser = User(uid, currentName, email, currentRole, null, currentPhoto)
                _currentUser.value = finalUser
                saveFallbackUserSession(finalUser)
                onComplete(finalUser)
                
                startFirestoreDashboardListeners()
                viewModelScope.launch {
                    repository.seedIfNeeded()
                    syncLocalDataToFirestore()
                }
            }
        }
    }

    fun updateAdminProfile(fullName: String, profilePhoto: String) {
        val current = _currentUser.value ?: return
        val photoUrlVal = if (profilePhoto.isBlank()) null else profilePhoto
        val updatedUser = current.copy(name = fullName, profilePhoto = photoUrlVal)
        _currentUser.value = updatedUser
        saveFallbackUserSession(updatedUser)

        viewModelScope.launch {
            try {
                val uid = current.uid
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                val adminMap = hashMapOf(
                    "fullName" to fullName,
                    "email" to current.email,
                    "profilePhoto" to profilePhoto,
                    "role" to current.role
                )
                db.collection("admins").document(uid).collection("profile").document("admin_profile").set(adminMap)
            } catch (t: Throwable) {
                t.printStackTrace()
            }

            try {
                val fbUser = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser
                if (fbUser != null && fbUser.email.equals(current.email, ignoreCase = true)) {
                    val profileUpdates = com.google.firebase.auth.UserProfileChangeRequest.Builder()
                        .setDisplayName(fullName)
                        .setPhotoUri(if (profilePhoto.isNotBlank()) android.net.Uri.parse(profilePhoto) else null)
                        .build()
                    fbUser.updateProfile(profileUpdates)
                }
            } catch (t: Throwable) {
                t.printStackTrace()
            }

            showFeedback("Admin profile updated successfully!")
        }
    }

    fun verifySession() {
        viewModelScope.launch {
            _authLoadingState.value = AuthLoadingState.VERIFYING
            
            var fbUser: com.google.firebase.auth.FirebaseUser? = null
            try {
                fbUser = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser
            } catch (e: Throwable) {
                e.printStackTrace()
            }
            
            val isDummy = try {
                com.google.firebase.FirebaseApp.getInstance().options.apiKey.contains("DummyKey")
            } catch (e: Throwable) {
                true
            }

            if (fbUser != null) {
                try {
                    fbUser.getIdToken(false)
                        .addOnCompleteListener { task ->
                            if (task.isSuccessful) {
                                val token = task.result?.token
                                if (!token.isNullOrEmpty()) {
                                    val email = fbUser.email ?: ""
                                    val isAdmin = email.equals("owner@gym.com", ignoreCase = true) ||
                                                  email.equals("shadowfall07042008@gmail.com", ignoreCase = true)
                                    
                                    if (isAdmin) {
                                        fetchAdminProfile(email)
                                        showFeedback("Session restored successfully")
                                    } else {
                                        try {
                                            com.google.firebase.auth.FirebaseAuth.getInstance().signOut()
                                        } catch (t: Throwable) {}
                                        clearFallbackUserSession()
                                        _currentUser.value = defaultOwnerUser
                                        showFeedback("Full Access Mode: Administrator enabled.")
                                    }
                                } else {
                                    try {
                                        com.google.firebase.auth.FirebaseAuth.getInstance().signOut()
                                    } catch (t: Throwable) {}
                                    clearFallbackUserSession()
                                    _currentUser.value = defaultOwnerUser
                                    showFeedback("Full Access Mode active.")
                                }
                            } else {
                                val exception = task.exception
                                if (exception is com.google.firebase.auth.FirebaseAuthInvalidUserException) {
                                    try {
                                        com.google.firebase.auth.FirebaseAuth.getInstance().signOut()
                                    } catch (t: Throwable) {}
                                    clearFallbackUserSession()
                                    _currentUser.value = defaultOwnerUser
                                    showFeedback("Full Access Mode active.")
                                } else if (isDummy) {
                                    val email = fbUser.email ?: "owner@gym.com"
                                    fetchAdminProfile(email)
                                } else {
                                    val email = fbUser.email ?: ""
                                    val isAdmin = email.equals("owner@gym.com", ignoreCase = true) ||
                                                  email.equals("shadowfall07042008@gmail.com", ignoreCase = true)
                                    if (isAdmin) {
                                        fetchAdminProfile(email)
                                    } else {
                                        try {
                                            com.google.firebase.auth.FirebaseAuth.getInstance().signOut()
                                        } catch (t: Throwable) {}
                                        clearFallbackUserSession()
                                        _currentUser.value = defaultOwnerUser
                                        showFeedback("Full Access Mode: Administrator enabled.")
                                    }
                                }
                            }
                            _authLoadingState.value = AuthLoadingState.COMPLETED
                        }
                } catch (e: Throwable) {
                    _currentUser.value = defaultOwnerUser
                    _authLoadingState.value = AuthLoadingState.COMPLETED
                }
            } else {
                val fallbackUser = getFallbackUserSession()
                if (fallbackUser != null) {
                    _currentUser.value = fallbackUser
                    fetchAdminProfile(fallbackUser.email)
                } else {
                    _currentUser.value = defaultOwnerUser
                }
                _authLoadingState.value = AuthLoadingState.COMPLETED
            }
        }
    }

    // --- Database State Flows ---
    val settings: StateFlow<GymSettings?> = repository.settings
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val allPlans: StateFlow<List<MembershipPlan>> = repository.allPlans
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allTrainers: StateFlow<List<Trainer>> = repository.allTrainers
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allMembers: StateFlow<List<Member>> = repository.allMembers
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allPayments: StateFlow<List<Payment>> = repository.allPayments
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allRenewals: StateFlow<List<RenewalEntry>> = repository.allRenewals
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allAttendance: StateFlow<List<Attendance>> = repository.allAttendance
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allTrainerAttendance: StateFlow<List<TrainerAttendance>> = repository.allTrainerAttendance
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _latestScanResult = MutableStateFlow<ScanResult?>(null)
    val latestScanResult: StateFlow<ScanResult?> = _latestScanResult.asStateFlow()

    fun clearLatestScanResult() {
        _latestScanResult.value = null
    }

    // --- Dynamic Search & Filters ---
    private val _searchQuery = MutableStateFlow("")
    var searchQuery: String
        get() = _searchQuery.value
        set(value) { _searchQuery.value = value }

    private val _statusFilter = MutableStateFlow("All")
    var statusFilter: String
        get() = _statusFilter.value
        set(value) { _statusFilter.value = value }

    private val _planFilter = MutableStateFlow("All")
    var planFilter: String
        get() = _planFilter.value
        set(value) { _planFilter.value = value }

    private val _trainerFilter = MutableStateFlow("All")
    var trainerFilter: String
        get() = _trainerFilter.value
        set(value) { _trainerFilter.value = value }

    val filteredMembers: Flow<List<Member>> = combine(
        repository.allMembers,
        _searchQuery,
        _statusFilter,
        _planFilter,
        _trainerFilter
    ) { members, query, status, plan, trainer ->
        members.filter { member ->
            val matchesQuery = query.isEmpty() ||
                    member.name.contains(query, ignoreCase = true) ||
                    member.phone.contains(query) ||
                    member.email.contains(query, ignoreCase = true)

            val isExpiring = try {
                val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
                val expiryDate = dateFormat.parse(member.expiryDate)
                if (expiryDate != null) {
                    val today = java.util.Date()
                    val diffMs = expiryDate.time - today.time
                    val diffDays = diffMs / (1000 * 60 * 60 * 24)
                    diffDays in 0..3
                } else false
            } catch (e: Exception) {
                false
            }

            val isInactive = member.status.equals("expired", ignoreCase = true) || member.status.equals("frozen", ignoreCase = true)
            val isActiveAndNotExpiring = member.status.equals("active", ignoreCase = true) && !isExpiring

            val matchesStatus = when (status) {
                "All" -> true
                "Active" -> isActiveAndNotExpiring
                "Expiring" -> isExpiring
                "Inactive" -> isInactive
                else -> member.status.equals(status, ignoreCase = true)
            }

            val matchesPlan = plan == "All" || member.membershipPlan.equals(plan, ignoreCase = true)
            val matchesTrainer = trainer == "All" || member.trainerId == trainer

            matchesQuery && matchesStatus && matchesPlan && matchesTrainer
        }
    }

    // --- Today's Attendance Flow ---
    val todayDate: String = repository.getTodayDate()
    val todayAttendance: StateFlow<List<Attendance>> = repository.getAttendanceForDate(todayDate)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val todayTrainerAttendance: StateFlow<List<TrainerAttendance>> = repository.getTrainerAttendanceForDate(todayDate)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // --- Firestore Realtime Dashboard Integration ---
    private val _firestoreMembers = MutableStateFlow<List<Map<String, Any>>>(emptyList())
    val firestoreMembers = _firestoreMembers.asStateFlow()

    private val _firestorePayments = MutableStateFlow<List<Map<String, Any>>>(emptyList())
    val firestorePayments = _firestorePayments.asStateFlow()

    private val _firestoreAttendance = MutableStateFlow<List<Map<String, Any>>>(emptyList())
    val firestoreAttendance = _firestoreAttendance.asStateFlow()

    private val _firestoreError = MutableStateFlow<String?>(null)
    val firestoreError = _firestoreError.asStateFlow()

    val currentAdminUid: String?
        get() = try {
            com.google.firebase.auth.FirebaseAuth.getInstance().currentUser?.uid ?: _currentUser.value?.uid
        } catch (e: Throwable) {
            _currentUser.value?.uid
        }

    fun getAdminSubcollection(subcollection: String): com.google.firebase.firestore.CollectionReference {
        val uid = currentAdminUid ?: "owner"
        val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
        return db.collection("admins").document(uid).collection(subcollection)
    }

    fun clearAllLocalData(ctx: android.content.Context) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                com.example.data.local.AppDatabase.getDatabase(ctx).clearAllTables()
                android.util.Log.d("GymViewModel", "Local SQLite database tables cleared.")
            } catch (e: Exception) {
                android.util.Log.e("GymViewModel", "Failed to clear local SQLite database", e)
            }
        }
    }

    private val _firestoreLoading = MutableStateFlow(true)
    val firestoreLoading = _firestoreLoading.asStateFlow()

    private var membersListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var paymentsListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var attendanceListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var trainersListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var plansListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var settingsListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var workoutsListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var dietPlansListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var trainerAttendanceListener: com.google.firebase.firestore.ListenerRegistration? = null
    private var renewalsListener: com.google.firebase.firestore.ListenerRegistration? = null

    fun startFirestoreDashboardListeners() {
        val uid = currentAdminUid ?: return
        
        _firestoreLoading.value = true
        _firestoreError.value = null

        stopFirestoreDashboardListeners()

        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()

            // 1. Members
            membersListener = db.collection("admins").document(uid).collection("members").addSnapshotListener { snapshots, error ->
                if (snapshots != null) {
                    val list = snapshots.documents.mapNotNull { it.data }
                    _firestoreMembers.value = list
                    viewModelScope.launch {
                        list.forEach { map ->
                            try {
                                val m = mapMapToMember(map)
                                repository.saveMember(m)
                            } catch (e: Exception) {
                                android.util.Log.e("GymViewModel", "Error saving member from Firestore", e)
                            }
                        }
                    }
                    checkLoadingComplete()
                }
            }

            // 2. Payments
            paymentsListener = db.collection("admins").document(uid).collection("payments").addSnapshotListener { snapshots, error ->
                if (snapshots != null) {
                    val list = snapshots.documents.mapNotNull { it.data }
                    _firestorePayments.value = list
                    viewModelScope.launch {
                        list.forEach { map ->
                            try {
                                val p = mapMapToPayment(map)
                                repository.savePayment(p)
                            } catch (e: Exception) {
                                android.util.Log.e("GymViewModel", "Error saving payment from Firestore", e)
                            }
                        }
                    }
                    checkLoadingComplete()
                }
            }

            // 3. Attendance
            attendanceListener = db.collection("admins").document(uid).collection("attendance").addSnapshotListener { snapshots, error ->
                if (snapshots != null) {
                    val list = snapshots.documents.mapNotNull { it.data }
                    _firestoreAttendance.value = list
                    viewModelScope.launch {
                        list.forEach { map ->
                            try {
                                val a = mapMapToAttendance(map)
                                repository.saveAttendanceDirect(a)
                            } catch (e: Exception) {
                                android.util.Log.e("GymViewModel", "Error saving attendance from Firestore", e)
                            }
                        }
                    }
                    checkLoadingComplete()
                }
            }

            // 4. Trainers
            trainersListener = db.collection("admins").document(uid).collection("trainers").addSnapshotListener { snapshots, error ->
                if (snapshots != null) {
                    viewModelScope.launch {
                        snapshots.documents.mapNotNull { it.data }.forEach { map ->
                            try {
                                val t = mapMapToTrainer(map)
                                repository.saveTrainer(t)
                            } catch (e: Exception) {
                                android.util.Log.e("GymViewModel", "Error saving trainer from Firestore", e)
                            }
                        }
                    }
                }
            }

            // 5. Plans
            plansListener = db.collection("admins").document(uid).collection("plans").addSnapshotListener { snapshots, error ->
                if (snapshots != null) {
                    viewModelScope.launch {
                        snapshots.documents.mapNotNull { it.data }.forEach { map ->
                            try {
                                val p = mapMapToPlan(map)
                                repository.savePlan(p)
                            } catch (e: Exception) {
                                android.util.Log.e("GymViewModel", "Error saving plan from Firestore", e)
                            }
                        }
                    }
                }
            }

            // 6. Settings
            settingsListener = db.collection("admins").document(uid).collection("settings").addSnapshotListener { snapshots, error ->
                if (snapshots != null) {
                    viewModelScope.launch {
                        snapshots.documents.mapNotNull { it.data }.forEach { map ->
                            try {
                                val s = mapMapToSettings(map)
                                repository.saveSettings(s)
                            } catch (e: Exception) {
                                android.util.Log.e("GymViewModel", "Error saving settings from Firestore", e)
                            }
                        }
                    }
                }
            }

            // 7. Workouts
            workoutsListener = db.collection("admins").document(uid).collection("workouts").addSnapshotListener { snapshots, error ->
                if (snapshots != null) {
                    viewModelScope.launch {
                        snapshots.documents.mapNotNull { it.data }.forEach { map ->
                            try {
                                val w = mapMapToWorkoutPlan(map)
                                repository.saveWorkout(w)
                            } catch (e: Exception) {
                                android.util.Log.e("GymViewModel", "Error saving workout from Firestore", e)
                            }
                        }
                    }
                }
            }

            // 8. Diet Plans
            dietPlansListener = db.collection("admins").document(uid).collection("diet_plans").addSnapshotListener { snapshots, error ->
                if (snapshots != null) {
                    viewModelScope.launch {
                        snapshots.documents.mapNotNull { it.data }.forEach { map ->
                            try {
                                val d = mapMapToDietPlan(map)
                                repository.saveDiet(d)
                            } catch (e: Exception) {
                                android.util.Log.e("GymViewModel", "Error saving diet plan from Firestore", e)
                            }
                        }
                    }
                }
            }

            // 9. Trainer Attendance
            trainerAttendanceListener = db.collection("admins").document(uid).collection("trainer_attendance").addSnapshotListener { snapshots, error ->
                if (snapshots != null) {
                    viewModelScope.launch {
                        snapshots.documents.mapNotNull { it.data }.forEach { map ->
                            try {
                                val ta = mapMapToTrainerAttendance(map)
                                repository.saveTrainerAttendanceDirect(ta)
                            } catch (e: Exception) {
                                android.util.Log.e("GymViewModel", "Error saving trainer attendance from Firestore", e)
                            }
                        }
                    }
                }
            }

            // 10. Renewals
            renewalsListener = db.collection("admins").document(uid).collection("renewals").addSnapshotListener { snapshots, error ->
                if (snapshots != null) {
                    viewModelScope.launch {
                        snapshots.documents.mapNotNull { it.data }.forEach { map ->
                            try {
                                val r = mapMapToRenewalEntry(map)
                                repository.saveRenewalDirect(r)
                            } catch (e: Exception) {
                                android.util.Log.e("GymViewModel", "Error saving renewal from Firestore", e)
                            }
                        }
                    }
                }
            }

        } catch (e: Exception) {
            android.util.Log.e("GymViewModel", "Firestore initialization error", e)
            _firestoreError.value = "Unable to load dashboard data."
            _firestoreLoading.value = false
        }
    }

    private fun checkLoadingComplete() {
        _firestoreLoading.value = false
    }

    fun stopFirestoreDashboardListeners() {
        membersListener?.remove()
        membersListener = null
        paymentsListener?.remove()
        paymentsListener = null
        attendanceListener?.remove()
        attendanceListener = null
        trainersListener?.remove()
        trainersListener = null
        plansListener?.remove()
        plansListener = null
        settingsListener?.remove()
        settingsListener = null
        workoutsListener?.remove()
        workoutsListener = null
        dietPlansListener?.remove()
        dietPlansListener = null
        trainerAttendanceListener?.remove()
        trainerAttendanceListener = null
        renewalsListener?.remove()
        renewalsListener = null
    }

    fun mapMapToPayment(map: Map<String, Any>): Payment {
        return Payment(
            paymentId = (map["paymentId"] as? Number)?.toInt() ?: 0,
            memberId = map["memberId"] as? String ?: "",
            memberName = map["memberName"] as? String ?: "",
            amount = (map["amount"] as? Number)?.toDouble() ?: 0.0,
            paymentMethod = map["paymentMethod"] as? String ?: "",
            date = map["date"] as? String ?: "",
            planName = map["planName"] as? String ?: "",
            status = map["status"] as? String ?: "",
            transactionId = map["transactionId"] as? String ?: "",
            type = map["type"] as? String ?: ""
        )
    }

    fun mapMapToMember(map: Map<String, Any>): Member {
        val measurementsMap = map["measurements"] as? Map<String, Any>
        return Member(
            memberId = map["memberId"] as? String ?: "",
            name = map["name"] as? String ?: "",
            phone = map["phone"] as? String ?: "",
            email = map["email"] as? String ?: "",
            age = (map["age"] as? Number)?.toInt() ?: 0,
            gender = map["gender"] as? String ?: "Male",
            membershipPlan = map["membershipPlan"] as? String ?: "",
            joiningDate = map["joiningDate"] as? String ?: "",
            expiryDate = map["expiryDate"] as? String ?: "",
            trainerId = map["trainerId"] as? String,
            height = (map["height"] as? Number)?.toDouble() ?: 0.0,
            weight = (map["weight"] as? Number)?.toDouble() ?: 0.0,
            bloodGroup = map["bloodGroup"] as? String ?: "",
            photo = map["photo"] as? String,
            status = map["status"] as? String ?: "active",
            paymentStatus = map["paymentStatus"] as? String ?: "pending",
            notes = map["notes"] as? String ?: "",
            emergencyContact = map["emergencyContact"] as? String ?: "",
            bmi = (map["bmi"] as? Number)?.toDouble() ?: 0.0,
            bmiCategory = map["bmiCategory"] as? String ?: "",
            
            // REDESIGNED NEW FIELDS
            fitnessGoal = map["fitnessGoal"] as? String ?: "",
            experience = map["experience"] as? String ?: "",
            trainingPreference = map["trainingPreference"] as? String ?: "",
            workoutDays = map["workoutDays"] as? String ?: "",
            workoutDuration = map["workoutDuration"] as? String ?: "",
            medicalConditions = map["medicalConditions"] as? String ?: "",
            injuries = map["injuries"] as? String ?: "",
            painLevel = (map["painLevel"] as? Number)?.toInt() ?: 0,
            doctorRestrictions = map["doctorRestrictions"] as? String ?: "",
            foodAllergies = map["foodAllergies"] as? String ?: "",
            foodsToAvoid = map["foodsToAvoid"] as? String ?: "",
            dietPreference = map["dietPreference"] as? String ?: "",
            waterIntake = (map["waterIntake"] as? Number)?.toDouble() ?: 0.0,
            sleepHours = map["sleepHours"] as? String ?: "",
            occupation = map["occupation"] as? String ?: "",
            activityLevel = map["activityLevel"] as? String ?: "",
            stressLevel = map["stressLevel"] as? String ?: "",
            smoking = map["smoking"] as? String ?: "",
            alcohol = map["alcohol"] as? String ?: "",
            bodyFat = (map["bodyFat"] as? Number)?.toDouble() ?: 0.0,
            muscleMass = (map["muscleMass"] as? Number)?.toDouble() ?: 0.0,
            
            // Nested measurements mapped back to individual fields
            waist = (measurementsMap?.get("waist") as? Number)?.toDouble() ?: (map["waist"] as? Number)?.toDouble() ?: 0.0,
            chest = (measurementsMap?.get("chest") as? Number)?.toDouble() ?: (map["chest"] as? Number)?.toDouble() ?: 0.0,
            arms = (measurementsMap?.get("arms") as? Number)?.toDouble() ?: (map["arms"] as? Number)?.toDouble() ?: 0.0,
            thighs = (measurementsMap?.get("thighs") as? Number)?.toDouble() ?: (map["thighs"] as? Number)?.toDouble() ?: 0.0,
            calves = (measurementsMap?.get("calves") as? Number)?.toDouble() ?: (map["calves"] as? Number)?.toDouble() ?: 0.0,
            neck = (measurementsMap?.get("neck") as? Number)?.toDouble() ?: (map["neck"] as? Number)?.toDouble() ?: 0.0,
            restingHeartRate = (measurementsMap?.get("restingHeartRate") as? Number)?.toInt() ?: (map["restingHeartRate"] as? Number)?.toInt() ?: 0,
            bloodPressure = measurementsMap?.get("bloodPressure") as? String ?: map["bloodPressure"] as? String ?: "",
            
            specialInstructions = map["specialInstructions"] as? String ?: "",
            createdAt = map["createdAt"] as? String ?: "",
            updatedAt = map["updatedAt"] as? String ?: ""
        )
    }

    fun mapMapToAttendance(map: Map<String, Any>): Attendance {
        return Attendance(
            attendanceId = (map["attendanceId"] as? Number)?.toInt() ?: 0,
            memberId = map["memberId"] as? String ?: "",
            memberName = map["memberName"] as? String ?: "",
            date = map["date"] as? String ?: "",
            checkIn = map["checkIn"] as? String,
            checkOut = map["checkOut"] as? String
        )
    }

    fun mapMapToTrainer(map: Map<String, Any>): Trainer {
        return Trainer(
            trainerId = map["trainerId"] as? String ?: "",
            name = map["name"] as? String ?: "",
            phone = map["phone"] as? String ?: "",
            specialization = map["specialization"] as? String ?: "",
            experience = (map["experience"] as? Number)?.toInt() ?: 0,
            salary = (map["salary"] as? Number)?.toDouble() ?: 0.0,
            photo = map["photo"] as? String,
            email = map["email"] as? String ?: "",
            joiningDate = map["joiningDate"] as? String ?: ""
        )
    }

    fun mapMapToPlan(map: Map<String, Any>): MembershipPlan {
        return MembershipPlan(
            planId = map["planId"] as? String ?: "",
            name = map["name"] as? String ?: "",
            price = (map["price"] as? Number)?.toDouble() ?: 0.0,
            durationDays = (map["durationDays"] as? Number)?.toInt() ?: 30,
            benefits = map["benefits"] as? String ?: ""
        )
    }

    fun mapMapToSettings(map: Map<String, Any>): GymSettings {
        return GymSettings(
            id = (map["id"] as? Number)?.toInt() ?: 1,
            gymName = map["gymName"] as? String ?: "GymMaster Pro",
            logoUrl = map["logoUrl"] as? String ?: "",
            address = map["address"] as? String ?: "",
            phone = map["phone"] as? String ?: "",
            gstNumber = map["gstNumber"] as? String ?: "",
            currency = map["currency"] as? String ?: "₹",
            workingHours = map["workingHours"] as? String ?: "",
            themeColor = map["themeColor"] as? String ?: "#FF3D00",
            whatsappBusinessToken = map["whatsappBusinessToken"] as? String ?: "",
            whatsappBusinessPhoneId = map["whatsappBusinessPhoneId"] as? String ?: ""
        )
    }

    fun mapMapToWorkoutPlan(map: Map<String, Any>): WorkoutPlan {
        return WorkoutPlan(
            memberId = map["memberId"] as? String ?: "",
            monday = map["monday"] as? String ?: "",
            tuesday = map["tuesday"] as? String ?: "",
            wednesday = map["wednesday"] as? String ?: "",
            thursday = map["thursday"] as? String ?: "",
            friday = map["friday"] as? String ?: "",
            notes = map["notes"] as? String ?: ""
        )
    }

    fun mapMapToDietPlan(map: Map<String, Any>): DietPlan {
        return DietPlan(
            memberId = map["memberId"] as? String ?: "",
            breakfast = map["breakfast"] as? String ?: "",
            lunch = map["lunch"] as? String ?: "",
            dinner = map["dinner"] as? String ?: "",
            snacks = map["snacks"] as? String ?: "",
            calories = (map["calories"] as? Number)?.toInt() ?: 2000,
            protein = (map["protein"] as? Number)?.toInt() ?: 120,
            notes = map["notes"] as? String ?: ""
        )
    }

    fun mapMapToTrainerAttendance(map: Map<String, Any>): TrainerAttendance {
        return TrainerAttendance(
            id = (map["id"] as? Number)?.toInt() ?: 0,
            trainerId = map["trainerId"] as? String ?: "",
            trainerName = map["trainerName"] as? String ?: "",
            date = map["date"] as? String ?: "",
            checkIn = map["checkIn"] as? String,
            checkOut = map["checkOut"] as? String
        )
    }

    fun mapMapToRenewalEntry(map: Map<String, Any>): RenewalEntry {
        return RenewalEntry(
            id = (map["id"] as? Number)?.toInt() ?: 0,
            memberId = map["memberId"] as? String ?: "",
            renewedOn = map["renewedOn"] as? String ?: "",
            previousExpiryDate = map["previousExpiryDate"] as? String ?: "",
            newExpiryDate = map["newExpiryDate"] as? String ?: "",
            planName = map["planName"] as? String ?: "",
            amount = (map["amount"] as? Number)?.toDouble() ?: 0.0,
            paymentId = map["paymentId"] as? String ?: ""
        )
    }

    val firestoreMembersState = _firestoreMembers.map { list ->
        list.map { mapMapToMember(it) }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val firestorePaymentsState = _firestorePayments.map { list ->
        list.map { mapMapToPayment(it) }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val firestoreAttendanceState = _firestoreAttendance.map { list ->
        list.map { mapMapToAttendance(it) }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun syncLocalDataToFirestore() {
        val uid = currentAdminUid ?: return
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()

                // 1. Sync settings
                val settings = repository.getSettingsDirect()
                if (settings != null) {
                    val settingsMap = hashMapOf(
                        "id" to settings.id,
                        "gymName" to settings.gymName,
                        "logoUrl" to settings.logoUrl,
                        "address" to settings.address,
                        "phone" to settings.phone,
                        "gstNumber" to settings.gstNumber,
                        "currency" to settings.currency,
                        "workingHours" to settings.workingHours,
                        "themeColor" to settings.themeColor,
                        "whatsappBusinessToken" to settings.whatsappBusinessToken,
                        "whatsappBusinessPhoneId" to settings.whatsappBusinessPhoneId
                    )
                    db.collection("admins").document(uid).collection("settings").document("gym_settings").set(settingsMap)
                }

                // 2. Sync plans
                val plans = repository.allPlans.firstOrNull() ?: emptyList()
                plans.forEach { p ->
                    val planMap = hashMapOf(
                        "planId" to p.planId,
                        "name" to p.name,
                        "price" to p.price,
                        "durationDays" to p.durationDays,
                        "benefits" to p.benefits
                    )
                    db.collection("admins").document(uid).collection("plans").document(p.planId).set(planMap)
                }

                // 3. Sync members
                val members = repository.allMembers.firstOrNull() ?: emptyList()
                members.forEach { m ->
                    val memberMap = hashMapOf(
                        "memberId" to m.memberId,
                        "name" to m.name,
                        "phone" to m.phone,
                        "email" to m.email,
                        "age" to m.age,
                        "gender" to m.gender,
                        "membershipPlan" to m.membershipPlan,
                        "joiningDate" to m.joiningDate,
                        "expiryDate" to m.expiryDate,
                        "trainerId" to m.trainerId,
                        "height" to m.height,
                        "weight" to m.weight,
                        "bloodGroup" to m.bloodGroup,
                        "photo" to m.photo,
                        "status" to m.status,
                        "paymentStatus" to m.paymentStatus,
                        "notes" to m.notes,
                        "emergencyContact" to m.emergencyContact,
                        "bmi" to m.bmi,
                        "bmiCategory" to m.bmiCategory
                    )
                    db.collection("admins").document(uid).collection("members").document(m.memberId).set(memberMap)
                }

                // 4. Sync payments
                val payments = repository.allPayments.firstOrNull() ?: emptyList()
                payments.forEach { p ->
                    val paymentMap = hashMapOf(
                        "paymentId" to p.paymentId,
                        "memberId" to p.memberId,
                        "memberName" to p.memberName,
                        "amount" to p.amount,
                        "paymentMethod" to p.paymentMethod,
                        "date" to p.date,
                        "planName" to p.planName,
                        "status" to p.status,
                        "transactionId" to p.transactionId,
                        "type" to p.type
                    )
                    db.collection("admins").document(uid).collection("payments").document(p.transactionId).set(paymentMap)
                }

                // 5. Sync attendance
                val attendance = repository.allAttendance.firstOrNull() ?: emptyList()
                attendance.forEach { a ->
                    val map = hashMapOf(
                        "attendanceId" to a.attendanceId,
                        "memberId" to a.memberId,
                        "memberName" to a.memberName,
                        "date" to a.date,
                        "checkIn" to a.checkIn,
                        "checkOut" to a.checkOut
                    )
                    db.collection("admins").document(uid).collection("attendance").document(a.attendanceId.toString()).set(map)
                }

                // 6. Sync trainers
                val trainers = repository.allTrainers.firstOrNull() ?: emptyList()
                trainers.forEach { t ->
                    val trainerMap = hashMapOf(
                        "trainerId" to t.trainerId,
                        "name" to t.name,
                        "phone" to t.phone,
                        "specialization" to t.specialization,
                        "experience" to t.experience,
                        "salary" to t.salary,
                        "photo" to t.photo,
                        "email" to t.email,
                        "joiningDate" to t.joiningDate
                    )
                    db.collection("admins").document(uid).collection("trainers").document(t.trainerId).set(trainerMap)
                }

                android.util.Log.d("GymViewModel", "Finished syncing local data to isolated Firestore collections")
            } catch (e: Exception) {
                android.util.Log.e("GymViewModel", "Failed to sync local data: ${e.message}")
            }
        }
    }

    // --- Selected Item States ---
    var selectedMemberId by mutableStateOf<String?>(null)

    // --- AI Generator States ---
    var aiLoading by mutableStateOf(false)
    var aiOutput by mutableStateOf("")

    // --- Gemini AI Smart Coach States ---
    val smartCoachLoading = androidx.compose.runtime.mutableStateMapOf<String, Boolean>()
    val smartCoachError = androidx.compose.runtime.mutableStateMapOf<String, String?>()
    val smartCoachSuccess = androidx.compose.runtime.mutableStateMapOf<String, Boolean>()

    // --- Toasts/Alert Feedback ---
    var feedbackMessage by mutableStateOf<String?>(null)

    private val httpServer = GymHttpServer(repository) { message ->
        viewModelScope.launch(Dispatchers.Main) {
            showFeedback(message)
        }
    }

    init {
        com.example.util.GeminiHelper.initialize(context)
        // Configure global Firestore offline persistence/caching for high performance
        try {
            val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
            val settings = com.google.firebase.firestore.FirebaseFirestoreSettings.Builder()
                .setPersistenceEnabled(true)
                .build()
            db.firestoreSettings = settings
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Seed the database if it is empty
        viewModelScope.launch {
            repository.seedIfNeeded()
            // Sync any existing local SQLite data to Firestore
            syncLocalDataToFirestore()
        }
        // Start the reception local HTTP server
        httpServer.start()

        // Start session verification on launch
        verifySession()

        // Start listening to Firestore dashboard collections in real-time
        startFirestoreDashboardListeners()
    }

    override fun onCleared() {
        super.onCleared()
        httpServer.stop()
        stopFirestoreDashboardListeners()
    }

    fun getLocalServerUrl(): String {
        return "http://${httpServer.getLocalIpAddress()}:8080/checkin"
    }

    suspend fun prepareReminderMessage(memberId: String, type: String): String? {
        return kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            try {
                val client = okhttp3.OkHttpClient()
                val url = "http://127.0.0.1:8080/api/prepare-reminder?memberId=$memberId&type=$type"
                val request = okhttp3.Request.Builder()
                    .url(url)
                    .get()
                    .build()
                
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val body = response.body?.string() ?: ""
                        val marker = "\"message\":"
                        val index = body.indexOf(marker)
                        if (index != -1) {
                            var content = body.substring(index + marker.length).trim()
                            if (content.startsWith("\"")) {
                                content = content.substring(1)
                            }
                            val sb = java.lang.StringBuilder()
                            var escaped = false
                            for (i in 0 until content.length) {
                                val char = content[i]
                                if (escaped) {
                                    when (char) {
                                        'n' -> sb.append('\n')
                                        'r' -> sb.append('\r')
                                        't' -> sb.append('\t')
                                        '\\' -> sb.append('\\')
                                        '"' -> sb.append('"')
                                        else -> sb.append(char)
                                    }
                                    escaped = false
                                } else if (char == '\\') {
                                    escaped = true
                                } else if (char == '"') {
                                    break
                                } else {
                                    sb.append(char)
                                }
                            }
                            sb.toString()
                        } else {
                            null
                        }
                    } else {
                        null
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
    }

    fun showFeedback(message: String) {
        feedbackMessage = message
    }

    fun clearFeedback() {
        feedbackMessage = null
    }

    // --- Role Simulation Actions ---
    fun simulateLogin(email: String): Boolean {
        // Clear old listener and cached data first before logging in as a new user
        stopFirestoreDashboardListeners()
        clearAllLocalData(context)

        return when {
            email.equals("owner@gym.com", ignoreCase = true) || email.equals("shadowfall07042008@gmail.com", ignoreCase = true) -> {
                val defaultName = if (email.equals("shadowfall07042008@gmail.com", ignoreCase = true)) "Arnav Bairagi" else "Alex Mercer"
                val cachedName = sharedPrefs.getString("name", defaultName) ?: defaultName
                val cachedPhoto = sharedPrefs.getString("profilePhoto", null)
                val uid = "offline_uid_" + email.replace("@", "_").replace(".", "_")
                val user = User(uid, cachedName, email, "owner", null, cachedPhoto)
                _currentUser.value = user
                saveFallbackUserSession(user)
                
                fetchAdminProfile(email)
                showFeedback("Logged in as Administrator")
                true
            }
            email.equals("trainer@gym.com", ignoreCase = true) -> {
                val user = User("trainer_john", "John Carter", "john@gym.com", "trainer", "T01")
                _currentUser.value = user
                clearFallbackUserSession()
                showFeedback("Logged in as Trainer John")
                true
            }
            email.equals("receptionist@gym.com", ignoreCase = true) -> {
                val user = User("reception_alice", "Alice Vance", "alice@gym.com", "receptionist")
                _currentUser.value = user
                clearFallbackUserSession()
                showFeedback("Logged in as Receptionist Alice")
                true
            }
            else -> {
                showFeedback("Invalid credentials. Use: owner@gym.com, trainer@gym.com, or receptionist@gym.com")
                false
            }
        }
    }

    fun loginAsAdminOwner(email: String = "owner@gym.com") {
        // Clear old listener and cached data first
        stopFirestoreDashboardListeners()
        clearAllLocalData(context)

        val defaultName = if (email.equals("shadowfall07042008@gmail.com", ignoreCase = true)) "Arnav Bairagi" else "Alex Mercer"
        val cachedName = sharedPrefs.getString("name", defaultName) ?: defaultName
        val cachedPhoto = sharedPrefs.getString("profilePhoto", null)
        val uid = "offline_uid_" + email.replace("@", "_").replace(".", "_")
        val user = User(uid, cachedName, email, "owner", null, cachedPhoto)
        _currentUser.value = user
        saveFallbackUserSession(user)
        
        fetchAdminProfile(email)
        showFeedback("Logged in as Administrator")
    }

    fun logout() {
        try {
            com.google.firebase.auth.FirebaseAuth.getInstance().signOut()
        } catch (e: Throwable) {
            // Firebase not initialized fallback
        }
        stopFirestoreDashboardListeners()
        clearAllLocalData(context)
        clearFallbackUserSession()
        _currentUser.value = defaultOwnerUser
        showFeedback("Full Access Mode Active")
    }

    // --- Settings Actions ---
    fun updateSettings(
        gymName: String,
        address: String,
        phone: String,
        gstNumber: String,
        currency: String,
        workingHours: String,
        themeColor: String,
        whatsappBusinessToken: String = "",
        whatsappBusinessPhoneId: String = ""
    ) {
        viewModelScope.launch {
            val current = repository.getSettingsDirect() ?: GymSettings()
            repository.saveSettings(current.copy(
                gymName = gymName,
                address = address,
                phone = phone,
                gstNumber = gstNumber,
                currency = currency,
                workingHours = workingHours,
                themeColor = themeColor,
                whatsappBusinessToken = whatsappBusinessToken,
                whatsappBusinessPhoneId = whatsappBusinessPhoneId
            ))
            showFeedback("Gym settings updated successfully")
        }
    }

    // --- Plans Actions ---
    fun addOrUpdatePlan(plan: MembershipPlan) {
        viewModelScope.launch {
            repository.savePlan(plan)
            showFeedback("Membership plan saved: ${plan.name}")
        }
    }

    fun deletePlan(planId: String) {
        viewModelScope.launch {
            repository.deletePlan(planId)
            showFeedback("Membership plan deleted")
        }
    }

    // --- Trainer Actions ---
    fun addOrUpdateTrainer(trainer: Trainer) {
        viewModelScope.launch {
            repository.saveTrainer(trainer)
            
            // Also attempt to save to Firestore
            try {
                val trainerMap = hashMapOf(
                    "trainerId" to trainer.trainerId,
                    "name" to trainer.name,
                    "phone" to trainer.phone,
                    "specialization" to trainer.specialization,
                    "experience" to trainer.experience,
                    "salary" to trainer.salary,
                    "photo" to trainer.photo,
                    "email" to trainer.email,
                    "joiningDate" to trainer.joiningDate
                )
                getAdminSubcollection("trainers").document(trainer.trainerId).set(trainerMap)
                    .addOnSuccessListener {
                        android.util.Log.d("GymViewModel", "Trainer successfully saved to Firestore")
                    }
                    .addOnFailureListener { e ->
                        android.util.Log.e("GymViewModel", "Error saving trainer to Firestore", e)
                    }
            } catch (e: Exception) {
                android.util.Log.e("GymViewModel", "Firestore is not available: ${e.message}")
            }

            showFeedback("Trainer profile saved: ${trainer.name}")
        }
    }

    fun deleteTrainer(trainerId: String) {
        viewModelScope.launch {
            repository.deleteTrainer(trainerId)
            try {
                getAdminSubcollection("trainers").document(trainerId).delete()
            } catch (e: Exception) {
                android.util.Log.e("GymViewModel", "Firestore delete failed: ${e.message}")
            }
            showFeedback("Trainer profile deleted")
        }
    }

    // --- Member Actions ---
    fun addOrUpdateMember(member: Member, initialPaymentMethod: String? = null, initialAmount: Double? = null) {
        viewModelScope.launch {
            val oldMember = repository.getMemberByIdDirect(member.memberId)
            val isNew = oldMember == null
            val trainerAssignedOrChanged = !isNew && (oldMember?.trainerId != member.trainerId && member.trainerId != null)
            val planUpdated = !isNew && (oldMember?.membershipPlan != member.membershipPlan)

            // Automatically compute BMI and Category whenever height/weight change or on save
            val computedBmi = Member.calculateBmi(member.height, member.weight)
            val computedBmiCategory = Member.getBmiCategory(computedBmi)
            val updatedMember = member.copy(bmi = computedBmi, bmiCategory = computedBmiCategory)
            val bmiChanged = !isNew && (oldMember?.bmi != computedBmi)

            repository.saveMember(updatedMember)

            // Also attempt to save to Firestore
            try {
                val memberMap = hashMapOf(
                    "memberId" to updatedMember.memberId,
                    "name" to updatedMember.name,
                    "phone" to updatedMember.phone,
                    "email" to updatedMember.email,
                    "age" to updatedMember.age,
                    "gender" to updatedMember.gender,
                    "membershipPlan" to updatedMember.membershipPlan,
                    "joiningDate" to updatedMember.joiningDate,
                    "expiryDate" to updatedMember.expiryDate,
                    "trainerId" to updatedMember.trainerId,
                    "height" to updatedMember.height,
                    "weight" to updatedMember.weight,
                    "bloodGroup" to updatedMember.bloodGroup,
                    "photo" to updatedMember.photo,
                    "status" to updatedMember.status,
                    "paymentStatus" to updatedMember.paymentStatus,
                    "notes" to updatedMember.notes,
                    "emergencyContact" to updatedMember.emergencyContact,
                    "bmi" to updatedMember.bmi,
                    "bmiCategory" to updatedMember.bmiCategory,
                    
                    // REDESIGNED NEW FIELDS
                    "fitnessGoal" to updatedMember.fitnessGoal,
                    "experience" to updatedMember.experience,
                    "trainingPreference" to updatedMember.trainingPreference,
                    "workoutDays" to updatedMember.workoutDays,
                    "workoutDuration" to updatedMember.workoutDuration,
                    "medicalConditions" to updatedMember.medicalConditions,
                    "injuries" to updatedMember.injuries,
                    "painLevel" to updatedMember.painLevel,
                    "doctorRestrictions" to updatedMember.doctorRestrictions,
                    "foodAllergies" to updatedMember.foodAllergies,
                    "foodsToAvoid" to updatedMember.foodsToAvoid,
                    "dietPreference" to updatedMember.dietPreference,
                    "waterIntake" to updatedMember.waterIntake,
                    "sleepHours" to updatedMember.sleepHours,
                    "occupation" to updatedMember.occupation,
                    "activityLevel" to updatedMember.activityLevel,
                    "stressLevel" to updatedMember.stressLevel,
                    "smoking" to updatedMember.smoking,
                    "alcohol" to updatedMember.alcohol,
                    "bodyFat" to updatedMember.bodyFat,
                    "muscleMass" to updatedMember.muscleMass,
                    "measurements" to hashMapOf(
                        "waist" to updatedMember.waist,
                        "chest" to updatedMember.chest,
                        "arms" to updatedMember.arms,
                        "thighs" to updatedMember.thighs,
                        "calves" to updatedMember.calves,
                        "neck" to updatedMember.neck,
                        "restingHeartRate" to updatedMember.restingHeartRate,
                        "bloodPressure" to updatedMember.bloodPressure
                    ),
                    "specialInstructions" to updatedMember.specialInstructions,
                    "createdAt" to updatedMember.createdAt.ifBlank { repository.getTodayDate() },
                    "updatedAt" to repository.getTodayDate()
                )
                getAdminSubcollection("members").document(updatedMember.memberId).set(memberMap)
                    .addOnSuccessListener {
                        android.util.Log.d("GymViewModel", "Member successfully saved to Firestore")
                    }
                    .addOnFailureListener { e ->
                        android.util.Log.e("GymViewModel", "Error saving member to Firestore", e)
                    }
            } catch (e: Exception) {
                android.util.Log.e("GymViewModel", "Firestore is not available: ${e.message}")
            }

            if (isNew) {
                // For brand new members, auto-create a Payment entry as requested!
                val payment = Payment(
                    memberId = member.memberId,
                    memberName = member.name,
                    amount = initialAmount ?: 1999.0, // Default fallback
                    paymentMethod = initialPaymentMethod ?: "Cash",
                    date = repository.getTodayDate(),
                    planName = member.membershipPlan,
                    status = if (member.paymentStatus == "paid") "Paid" else "Pending",
                    transactionId = "TXN-NEW-" + System.currentTimeMillis().toString().takeLast(6),
                    type = "new"
                )
                repository.savePayment(payment)

                try {
                    val paymentMap = hashMapOf(
                        "paymentId" to payment.paymentId,
                        "memberId" to payment.memberId,
                        "memberName" to payment.memberName,
                        "amount" to payment.amount,
                        "paymentMethod" to payment.paymentMethod,
                        "date" to payment.date,
                        "planName" to payment.planName,
                        "status" to payment.status,
                        "transactionId" to payment.transactionId,
                        "type" to payment.type
                    )
                    getAdminSubcollection("payments").document(payment.transactionId).set(paymentMap)
                } catch (e: Exception) {
                    android.util.Log.e("GymViewModel", "Failed to sync initial payment to Firestore", e)
                }

                // Initialize default empty Workout and Diet plans first (as fallback)
                repository.saveWorkout(WorkoutPlan(
                    memberId = member.memberId,
                    monday = "Cardio Warmup 15m, Shoulder Press 3x12, Lateral Raises 3x15, Abs circuit",
                    tuesday = "Chest Dumbbell Press 4x10, Pushups 3xMax, Triceps Extensions 3x12",
                    wednesday = "Rest & Active Recovery Walk 30m",
                    thursday = "Lat Pulldown 3x12, Seated Rows 3x10, Biceps Barbell Curls 3x12",
                    friday = "Bodyweight Squats 3x20, Leg Extensions 3x15, Calf Raises 3x15"
                ))
                repository.saveDiet(DietPlan(
                    memberId = member.memberId,
                    breakfast = "Oats with Honey and Banana, 3 Boiled Eggs",
                    lunch = "Grilled Chicken/Tofu with Steamed Veggies and Brown Rice",
                    dinner = "Baked Fish or Cottage Cheese Paneer, Mixed Green Salad",
                    snacks = "Mixed nuts, Seasonal Fruit bowl",
                    calories = 2000,
                    protein = 110
                ))

                // Hook: Trigger Gemini to generate personalized plan for the new member
                triggerGeminiPlanGeneration(updatedMember)
                generateSmartCoachPlan(updatedMember)
            } else if (trainerAssignedOrChanged || planUpdated || bmiChanged) {
                // Hook: Trigger Gemini to generate plan now that a trainer has been assigned/changed, plan updated, or BMI changed
                triggerGeminiPlanGeneration(updatedMember)
                generateSmartCoachPlan(updatedMember)
            }
            showFeedback("Member profile saved: ${member.name}")
        }
    }

    fun triggerGeminiPlanGeneration(member: Member) {
        viewModelScope.launch(Dispatchers.IO) {
            val trainerName = member.trainerId?.let { repository.getTrainerByIdDirect(it)?.name }
            val jsonResult = GeminiHelper.generateWorkoutAndDietPlans(member, trainerName)
            if (jsonResult != null) {
                try {
                    val json = org.json.JSONObject(jsonResult)
                    val workoutJson = json.optJSONObject("workout")
                    val dietJson = json.optJSONObject("diet")

                    if (workoutJson != null) {
                        val workoutPlan = WorkoutPlan(
                            memberId = member.memberId,
                            monday = workoutJson.optString("monday"),
                            tuesday = workoutJson.optString("tuesday"),
                            wednesday = workoutJson.optString("wednesday"),
                            thursday = workoutJson.optString("thursday"),
                            friday = workoutJson.optString("friday"),
                            notes = workoutJson.optString("notes")
                        )
                        repository.saveWorkout(workoutPlan)
                    }

                    if (dietJson != null) {
                        val dietPlan = DietPlan(
                            memberId = member.memberId,
                            breakfast = dietJson.optString("breakfast"),
                            lunch = dietJson.optString("lunch"),
                            dinner = dietJson.optString("dinner"),
                            snacks = dietJson.optString("snacks"),
                            calories = dietJson.optInt("calories", 2000),
                            protein = dietJson.optInt("protein", 120),
                            notes = dietJson.optString("notes")
                        )
                        repository.saveDiet(dietPlan)
                    }

                    viewModelScope.launch(Dispatchers.Main) {
                        showFeedback("AI Coach: Smart plan auto-generated successfully for ${member.name}!")
                    }
                } catch (e: Exception) {
                    viewModelScope.launch(Dispatchers.Main) {
                        showFeedback("AI Coach: Error parsing auto-generated plan, fell back to default.")
                    }
                }
            } else {
                viewModelScope.launch(Dispatchers.Main) {
                    showFeedback("AI Coach: Key missing or API error. Standard plans initialized.")
                }
            }
        }
    }

    fun deleteMember(memberId: String) {
        viewModelScope.launch {
            repository.deleteMember(memberId)
            try {
                getAdminSubcollection("members").document(memberId).delete()
            } catch (e: Exception) {
                android.util.Log.e("GymViewModel", "Failed to delete member from Firestore", e)
            }
            showFeedback("Member profile deleted")
        }
    }

    // --- Attendance Actions ---
    fun extractIdFromQr(qrText: String): String {
        if (qrText.startsWith("http://") || qrText.startsWith("https://")) {
            try {
                val uri = android.net.Uri.parse(qrText)
                val id = uri.getQueryParameter("id") ?: uri.getQueryParameter("memberId") ?: uri.getQueryParameter("trainerId")
                if (id != null) return id
                
                val lastSegment = uri.lastPathSegment
                if (lastSegment != null && lastSegment.startsWith("QR", ignoreCase = true)) {
                    return lastSegment.substring(2)
                }
                if (lastSegment != null) return lastSegment
            } catch (e: Exception) {
                // fallback
            }
        }
        return qrText
    }

    fun scanQRCode(scannedId: String) {
        viewModelScope.launch {
            val cleanId = extractIdFromQr(scannedId)
            val member = repository.getMemberByIdDirect(cleanId)
            val timeStr = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.getDefault()).format(java.util.Date())
            
            if (member != null) {
                if (member.status.equals("revoked", ignoreCase = true) || member.status.equals("frozen", ignoreCase = true)) {
                    val errorMsg = "Access Denied: Member QR is ${member.status}!"
                    _latestScanResult.value = ScanResult("ERROR", errorMsg, member.name, timeStr)
                    showFeedback(errorMsg)
                    return@launch
                }
                
                val result = repository.markAttendance(cleanId)
                val isCheckOut = result.contains("Checked out", ignoreCase = true)
                val isSuccess = !result.contains("ignored", ignoreCase = true) && !result.contains("error", ignoreCase = true)
                
                val status = if (!isSuccess) "ERROR" else if (isCheckOut) "CHECK_OUT" else "CHECK_IN"
                _latestScanResult.value = ScanResult(status, result, member.name, timeStr)
                showFeedback(result)
            } else {
                val trainer = repository.getTrainerByIdDirect(cleanId)
                if (trainer != null) {
                    val result = repository.markTrainerAttendance(cleanId)
                    val isCheckOut = result.contains("Checked Out", ignoreCase = true)
                    val isSuccess = !result.contains("ignored", ignoreCase = true) && !result.contains("error", ignoreCase = true)
                    
                    val status = if (!isSuccess) "ERROR" else if (isCheckOut) "CHECK_OUT" else "CHECK_IN"
                    _latestScanResult.value = ScanResult(status, result, trainer.name, timeStr)
                    showFeedback(result)
                } else {
                    val resultMsg = "Invalid QR: ID '$cleanId' not found."
                    _latestScanResult.value = ScanResult("ERROR", resultMsg, "Unknown ID", timeStr)
                    showFeedback(resultMsg)
                }
            }
        }
    }

    fun isCheckInLate(timeStr: String?): Boolean {
        if (timeStr.isNullOrEmpty()) return false
        try {
            val upper = timeStr.uppercase().trim()
            val isPm = upper.contains("PM")
            val clean = upper.replace("AM", "").replace("PM", "").trim()
            val parts = clean.split(":")
            val hr = if (parts.isNotEmpty()) parts[0].toIntOrNull() ?: 0 else 0
            val actualHr = if (isPm && hr != 12) hr + 12 else if (!isPm && hr == 12) 0 else hr
            if (actualHr >= 10) return true
        } catch (e: Exception) {
            // fallback
        }
        return false
    }

    fun calculateDurationHours(checkIn: String?, checkOut: String?): Double {
        if (checkIn.isNullOrEmpty() || checkOut.isNullOrEmpty() || 
            listOf("Absent", "On Leave", "Holiday").contains(checkIn)) return 0.0
        try {
            val sdf = java.text.SimpleDateFormat("hh:mm a", java.util.Locale.US)
            val dateIn = sdf.parse(checkIn)
            val dateOut = sdf.parse(checkOut)
            if (dateIn != null && dateOut != null) {
                var diffMs = dateOut.time - dateIn.time
                if (diffMs < 0) {
                    diffMs += 24 * 60 * 60 * 1000L
                }
                return diffMs.toDouble() / (1000.0 * 60.0 * 60.0)
            }
        } catch (e: Exception) {
            // ignore
        }
        return 0.0
    }

    fun manualMarkTrainerAttendance(
        trainerId: String,
        dateStr: String,
        checkInTime: String?,
        checkOutTime: String?,
        status: String
    ) {
        viewModelScope.launch(Dispatchers.IO) {
            val trainer = repository.getTrainerByIdDirect(trainerId) ?: return@launch
            val existing = repository.getLatestTrainerAttendanceForDate(trainerId, dateStr)
            val logId = existing?.id ?: 0
            
            val dbCheckIn = when (status) {
                "Absent" -> "Absent"
                "On Leave" -> "On Leave"
                "Holiday" -> "Holiday"
                else -> checkInTime ?: existing?.checkIn
            }
            
            val dbCheckOut = when (status) {
                "Absent", "On Leave", "Holiday" -> null
                else -> checkOutTime ?: existing?.checkOut
            }
            
            val log = TrainerAttendance(
                id = logId,
                trainerId = trainerId,
                trainerName = trainer.name,
                date = dateStr,
                checkIn = dbCheckIn,
                checkOut = dbCheckOut
            )
            
            repository.saveTrainerAttendanceDirect(log)
            val latestLog = repository.getLatestTrainerAttendanceForDate(trainerId, dateStr)
            val finalId = latestLog?.id ?: (if (logId == 0) System.currentTimeMillis().toInt() else logId)
            
            try {
                val uid = currentAdminUid ?: "owner"
                val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                
                val isLate = if (listOf("Absent", "On Leave", "Holiday").contains(dbCheckIn)) false else isCheckInLate(dbCheckIn)
                
                val computedStatus = when {
                    status == "Absent" || dbCheckIn == "Absent" -> "Absent"
                    status == "On Leave" || dbCheckIn == "On Leave" -> "On Leave"
                    status == "Holiday" || dbCheckIn == "Holiday" -> "Holiday"
                    dbCheckOut != null -> "Checked Out"
                    isLate -> "Late"
                    else -> "Present"
                }
                
                val workingStatusStr = when {
                    status == "Absent" || dbCheckIn == "Absent" -> "Absent"
                    status == "On Leave" || dbCheckIn == "On Leave" -> "On Leave"
                    status == "Holiday" || dbCheckIn == "Holiday" -> "Holiday"
                    dbCheckOut != null -> "Shift Completed"
                    else -> "Currently Working"
                }
                
                val wHours = calculateDurationHours(dbCheckIn, dbCheckOut)
                
                val map = hashMapOf(
                    "id" to finalId,
                    "trainerId" to trainerId,
                    "trainerName" to trainer.name,
                    "position" to trainer.specialization,
                    "date" to dateStr,
                    "checkIn" to dbCheckIn,
                    "checkInTime" to (dbCheckIn ?: ""),
                    "checkOut" to dbCheckOut,
                    "checkOutTime" to (dbCheckOut ?: ""),
                    "status" to computedStatus,
                    "workingStatus" to workingStatusStr,
                    "late" to isLate,
                    "shiftStart" to "09:00 AM",
                    "shiftEnd" to "05:00 PM",
                    "workingHours" to wHours,
                    "createdAt" to com.google.firebase.Timestamp.now(),
                    "updatedAt" to com.google.firebase.Timestamp.now()
                )
                
                db.collection("admins").document(uid).collection("trainer_attendance").document(finalId.toString()).set(map)
                db.collection("trainerAttendance").document("${trainerId}_${dateStr}").set(map)
                
                viewModelScope.launch(Dispatchers.Main) {
                    showFeedback("Attendance updated successfully for ${trainer.name}")
                }
            } catch (e: Exception) {
                android.util.Log.e("GymViewModel", "Failed to sync manual trainer attendance to Firestore", e)
            }
        }
    }

    // --- Payments Actions ---
    fun addPayment(payment: Payment) {
        viewModelScope.launch {
            repository.savePayment(payment)
            try {
                val paymentMap = hashMapOf(
                    "paymentId" to payment.paymentId,
                    "memberId" to payment.memberId,
                    "memberName" to payment.memberName,
                    "amount" to payment.amount,
                    "paymentMethod" to payment.paymentMethod,
                    "date" to payment.date,
                    "planName" to payment.planName,
                    "status" to payment.status,
                    "transactionId" to payment.transactionId,
                    "type" to payment.type
                )
                getAdminSubcollection("payments").document(payment.transactionId).set(paymentMap)
                    .addOnSuccessListener {
                        android.util.Log.d("GymViewModel", "Payment successfully saved to Firestore")
                    }
            } catch (e: Exception) {
                android.util.Log.e("GymViewModel", "Failed to sync payment to Firestore", e)
            }
            showFeedback("Payment recorded successfully")
        }
    }

    fun deletePayment(paymentId: Int) {
        viewModelScope.launch {
            val paymentToDelete = allPayments.value.find { it.paymentId == paymentId }
            repository.deletePayment(paymentId)
            if (paymentToDelete != null) {
                try {
                    getAdminSubcollection("payments").document(paymentToDelete.transactionId).delete()
                        .addOnSuccessListener {
                            android.util.Log.d("GymViewModel", "Payment deleted from Firestore")
                        }
                } catch (e: Exception) {
                    android.util.Log.e("GymViewModel", "Failed to delete payment from Firestore", e)
                }
            }
            showFeedback("Payment record deleted")
        }
    }

    // --- One-Click Renewal ---
    fun renewMember(memberId: String, planId: String, amount: Double, paymentMethod: String) {
        viewModelScope.launch {
            val msg = repository.performOneClickRenewal(memberId, planId, amount, paymentMethod)
            showFeedback(msg)
            
            // Sync updated member status/expiry to Firestore
            val renewedMember = repository.getMemberByIdDirect(memberId)
            if (renewedMember != null) {
                try {
                    val memberMap = hashMapOf(
                        "memberId" to renewedMember.memberId,
                        "name" to renewedMember.name,
                        "phone" to renewedMember.phone,
                        "email" to renewedMember.email,
                        "age" to renewedMember.age,
                        "gender" to renewedMember.gender,
                        "membershipPlan" to renewedMember.membershipPlan,
                        "joiningDate" to renewedMember.joiningDate,
                        "expiryDate" to renewedMember.expiryDate,
                        "trainerId" to renewedMember.trainerId,
                        "height" to renewedMember.height,
                        "weight" to renewedMember.weight,
                        "bloodGroup" to renewedMember.bloodGroup,
                        "photo" to renewedMember.photo,
                        "status" to renewedMember.status,
                        "paymentStatus" to renewedMember.paymentStatus,
                        "notes" to renewedMember.notes,
                        "emergencyContact" to renewedMember.emergencyContact,
                        "bmi" to renewedMember.bmi,
                        "bmiCategory" to renewedMember.bmiCategory
                    )
                    getAdminSubcollection("members").document(renewedMember.memberId).set(memberMap)
                } catch (e: Exception) {
                    android.util.Log.e("GymViewModel", "Failed to sync renewed member to Firestore", e)
                }

                // Also sync the newly created renewal payment to Firestore
                try {
                    val payments = repository.getPaymentsForMemberDirect(memberId)
                    val latestRenewalPayment = payments.filter { it.type == "renewal" }.maxByOrNull { it.paymentId }
                    if (latestRenewalPayment != null) {
                        val paymentMap = hashMapOf(
                            "paymentId" to latestRenewalPayment.paymentId,
                            "memberId" to latestRenewalPayment.memberId,
                            "memberName" to latestRenewalPayment.memberName,
                            "amount" to latestRenewalPayment.amount,
                            "paymentMethod" to latestRenewalPayment.paymentMethod,
                            "date" to latestRenewalPayment.date,
                            "planName" to latestRenewalPayment.planName,
                            "status" to latestRenewalPayment.status,
                            "transactionId" to latestRenewalPayment.transactionId,
                            "type" to latestRenewalPayment.type
                        )
                        getAdminSubcollection("payments").document(latestRenewalPayment.transactionId).set(paymentMap)
                    }
                } catch (e: Exception) {
                    android.util.Log.e("GymViewModel", "Failed to sync renewal payment to Firestore", e)
                }

                generateSmartCoachPlan(renewedMember)
            }
        }
    }

    // --- Workout & Diet Plan Mutations ---
    fun saveWorkoutPlan(workout: WorkoutPlan) {
        viewModelScope.launch {
            repository.saveWorkout(workout)
            showFeedback("Workout plan updated")
        }
    }

    fun saveDietPlan(diet: DietPlan) {
        viewModelScope.launch {
            repository.saveDiet(diet)
            showFeedback("Diet plan updated")
        }
    }

    // --- AI Generator (Gemini Coach Integration) ---
    fun generateAIWorkoutPlan(memberId: String) {
        viewModelScope.launch {
            aiLoading = true
            aiOutput = ""
            val member = repository.getMemberByIdDirect(memberId)
            if (member == null) {
                aiOutput = "Member not found."
                aiLoading = false
                return@launch
            }

            val systemInstruction = "You are GymMaster Pro's advanced AI Fitness Coach. Generate a comprehensive, elite 5-day workout plan based on the member's details. Keep it highly practical, using clear exercises, sets, and reps."
            val prompt = """
                Generate a custom 5-day workout plan for our gym member:
                Name: ${member.name}
                Age: ${member.age}
                Gender: ${member.gender}
                Height: ${member.height} cm
                Weight: ${member.weight} kg
                Target Membership: ${member.membershipPlan}
                Physical / Health Notes: ${member.notes}
                
                Please structure the response clearly with:
                - Monday
                - Tuesday
                - Wednesday
                - Thursday
                - Friday
                - Coach's Core Focus / Safety Tips
            """.trimIndent()

            val result = GeminiHelper.generateContent(prompt, systemInstruction)
            aiOutput = result
            aiLoading = false
        }
    }

    fun generateAIDietPlan(memberId: String) {
        viewModelScope.launch {
            aiLoading = true
            aiOutput = ""
            val member = repository.getMemberByIdDirect(memberId)
            if (member == null) {
                aiOutput = "Member not found."
                aiLoading = false
                return@launch
            }

            val systemInstruction = "You are GymMaster Pro's advanced AI Nutrition Coach. Design a high-yield diet plan with specific meal breakdowns, calorie limits, and protein quotas based on member parameters."
            val prompt = """
                Design a custom, calorie-tracked diet plan for our gym member:
                Name: ${member.name}
                Age: ${member.age}
                Gender: ${member.gender}
                Height: ${member.height} cm
                Weight: ${member.weight} kg
                Blood Group: ${member.bloodGroup}
                Notes: ${member.notes}
                
                Please structure the response clearly with:
                - Breakfast
                - Lunch
                - Dinner
                - Snacks & Shakes
                - Suggested Daily Calorie limit (kcal)
                - Suggested Daily Protein target (g)
                - Hydration & Lifestyle Tips
            """.trimIndent()

            val result = GeminiHelper.generateContent(prompt, systemInstruction)
            aiOutput = result
            aiLoading = false
        }
    }

    fun getWorkoutForMember(memberId: String): Flow<WorkoutPlan?> {
        return repository.getWorkoutForMember(memberId)
    }

    fun getDietForMember(memberId: String): Flow<DietPlan?> {
        return repository.getDietForMember(memberId)
    }

    fun generateSmartCoachPlan(member: Member) {
        val memberId = member.memberId
        smartCoachLoading[memberId] = true
        smartCoachError[memberId] = null
        smartCoachSuccess[memberId] = false

        viewModelScope.launch(Dispatchers.IO) {
            try {
                val trainerName = member.trainerId?.let { repository.getTrainerByIdDirect(it)?.name }
                val jsonResult = GeminiHelper.generatePremiumCoachPlan(member, trainerName)
                
                if (jsonResult == null) {
                    throw Exception("Could not reach Gemini service or API key is missing. Please check your internet connection.")
                }
                if (jsonResult.startsWith("Error:") || jsonResult.startsWith("API Error:") || jsonResult.startsWith("Network Exception:")) {
                    throw Exception(jsonResult)
                }

                // Parse JSON
                val json = org.json.JSONObject(jsonResult)
                val workoutObj = json.getJSONObject("workout")
                val nutritionObj = json.getJSONObject("nutrition")
                val metaObj = json.optJSONObject("metadata")

                val warmup = workoutObj.optString("warmup")
                val strengthTraining = workoutObj.optString("strengthTraining")
                val cardio = workoutObj.optString("cardio")
                val core = workoutObj.optString("core")
                val cooldown = workoutObj.optString("cooldown")
                val stretching = workoutObj.optString("stretching")
                val recoveryTips = workoutObj.optString("recoveryTips")
                val workoutNotes = workoutObj.optString("notes")

                val breakfast = nutritionObj.optString("breakfast")
                val morningSnack = nutritionObj.optString("morningSnack")
                val lunch = nutritionObj.optString("lunch")
                val preWorkout = nutritionObj.optString("preWorkout")
                val postWorkout = nutritionObj.optString("postWorkout")
                val dinner = nutritionObj.optString("dinner")
                val hydration = nutritionObj.optString("hydration")
                val supplements = nutritionObj.optString("supplements")
                val caloriesVal = nutritionObj.optInt("calories", 2000)
                val proteinVal = nutritionObj.optInt("protein", 120)
                val carbsVal = nutritionObj.optInt("carbohydrates", 150)
                val fatVal = nutritionObj.optInt("fat", 60)
                val nutritionNotes = nutritionObj.optString("notes")

                val goalVal = metaObj?.optString("goal") ?: "High-Yield Optimization"
                val healthAdvice = metaObj?.optString("healthAdvice") ?: ""
                val sleep = metaObj?.optString("sleep") ?: ""
                val dailyMotivation = metaObj?.optString("dailyMotivation") ?: ""
                val safetyNotes = metaObj?.optString("safetyNotes") ?: ""

                // 1. Save to local SQLite (active workout & diet plans)
                val workoutPlanJson = org.json.JSONObject().apply {
                    put("warmup", warmup)
                    put("strengthTraining", strengthTraining)
                    put("cardio", cardio)
                    put("core", core)
                    put("cooldown", cooldown)
                    put("stretching", stretching)
                    put("recoveryTips", recoveryTips)
                    put("notes", workoutNotes)
                }
                val workoutPlan = WorkoutPlan(
                    memberId = memberId,
                    monday = warmup,
                    tuesday = strengthTraining,
                    wednesday = cardio,
                    thursday = core,
                    friday = cooldown,
                    notes = workoutPlanJson.toString()
                )
                repository.saveWorkout(workoutPlan)

                val dietPlanJson = org.json.JSONObject().apply {
                    put("breakfast", breakfast)
                    put("morningSnack", morningSnack)
                    put("lunch", lunch)
                    put("preWorkout", preWorkout)
                    put("postWorkout", postWorkout)
                    put("dinner", dinner)
                    put("hydration", hydration)
                    put("supplements", supplements)
                    put("calories", caloriesVal.toString())
                    put("protein", proteinVal.toString())
                    put("carbohydrates", carbsVal.toString())
                    put("fat", fatVal.toString())
                    put("notes", nutritionNotes)
                }
                val dietPlan = DietPlan(
                    memberId = memberId,
                    breakfast = breakfast,
                    lunch = lunch,
                    dinner = dinner,
                    snacks = morningSnack,
                    calories = caloriesVal,
                    protein = proteinVal,
                    notes = dietPlanJson.toString()
                )
                repository.saveDiet(dietPlan)

                // 2. Save structured format in Firestore
                try {
                    val db = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                    val planMap = hashMapOf(
                        "memberId" to memberId,
                        "trainerId" to (member.trainerId ?: ""),
                        "provider" to "Gemini",
                        "model" to "gemini-2.5-flash-lite",
                        "generatedAt" to System.currentTimeMillis(),
                        "workoutPlan" to hashMapOf(
                            "warmup" to warmup,
                            "strengthTraining" to strengthTraining,
                            "cardio" to cardio,
                            "core" to core,
                            "cooldown" to cooldown,
                            "stretching" to stretching,
                            "recoveryTips" to recoveryTips,
                            "notes" to workoutNotes
                        ),
                        "nutritionPlan" to hashMapOf(
                            "breakfast" to breakfast,
                            "morningSnack" to morningSnack,
                            "lunch" to lunch,
                            "preWorkout" to preWorkout,
                            "postWorkout" to postWorkout,
                            "dinner" to dinner,
                            "hydration" to hydration,
                            "supplements" to supplements,
                            "calories" to caloriesVal,
                            "protein" to proteinVal,
                            "carbohydrates" to carbsVal,
                            "fat" to fatVal,
                            "notes" to nutritionNotes
                        ),
                        "goal" to goalVal,
                        "bmi" to member.bmi,
                        "healthAdvice" to healthAdvice,
                        "sleep" to sleep,
                        "dailyMotivation" to dailyMotivation,
                        "safetyNotes" to safetyNotes,
                        "aiGenerated" to true,
                        "version" to 1,
                        "createdAt" to System.currentTimeMillis(),
                        "updatedAt" to System.currentTimeMillis()
                    )
                    db.collection("coach_plans").document(memberId).set(planMap)
                        .addOnSuccessListener {
                            android.util.Log.d("GymViewModel", "Smart Coach plan successfully synced to legacy coach_plans")
                        }

                    val adminUid = currentUser.value?.uid ?: "default_owner"
                    val membersRef = db.collection("admins").document(adminUid).collection("members").document(memberId)
                    
                    // 1. Save to subcollection "aiPlan" as "plan_data"
                    membersRef.collection("aiPlan").document("plan_data").set(planMap)
                        .addOnSuccessListener {
                            android.util.Log.d("GymViewModel", "Smart Coach plan successfully synced to admins/$adminUid/members/$memberId/aiPlan/plan_data")
                        }
                    
                    // 2. Save to subcollection "aiPlan" as "current"
                    membersRef.collection("aiPlan").document("current").set(planMap)

                    // 3. Update parent member document field "aiPlan"
                    membersRef.update("aiPlan", planMap)
                        .addOnFailureListener { e ->
                            android.util.Log.e("GymViewModel", "Could not set nested aiPlan map field: ${e.message}")
                        }
                } catch (e: Exception) {
                    android.util.Log.e("GymViewModel", "Firestore is offline during automatic Smart Coach generation: ${e.message}")
                }

                viewModelScope.launch(Dispatchers.Main) {
                    smartCoachSuccess[memberId] = true
                    showFeedback("AI Coach: Smart plan auto-generated successfully for ${member.name}!")
                }
            } catch (e: Exception) {
                val errorMsg = e.message ?: "Unknown error"
                val friendlyError = when {
                    errorMsg.contains("NO_INTERNET", ignoreCase = true) || errorMsg.contains("No Internet Connection", ignoreCase = true) ->
                        "No Internet Connection"
                    errorMsg.contains("API_KEY_MISSING", ignoreCase = true) || errorMsg.contains("API Key Missing", ignoreCase = true) ->
                        "Gemini API Key Missing"
                    errorMsg.contains("AUTH_FAILED", ignoreCase = true) || errorMsg.contains("Authentication Failed", ignoreCase = true) ->
                        "Gemini Authentication Failed"
                    errorMsg.contains("QUOTA_EXCEEDED", ignoreCase = true) || errorMsg.contains("Quota Exceeded", ignoreCase = true) ->
                        "Gemini Quota Exceeded"
                    errorMsg.contains("Rate Limited", ignoreCase = true) ->
                        "Gemini Rate Limited"
                    errorMsg.contains("INVALID_RESPONSE", ignoreCase = true) || errorMsg.contains("Invalid Response", ignoreCase = true) || errorMsg.contains("JSON", ignoreCase = true) || errorMsg.contains("parse", ignoreCase = true) || e is org.json.JSONException ->
                        "Gemini Returned Invalid Response"
                    errorMsg.contains("Firebase Connection", ignoreCase = true) ->
                        "Firebase Connection Failed"
                    errorMsg.contains("Cloud Function", ignoreCase = true) ->
                        "Cloud Function Failed"
                    errorMsg.contains("TIMEOUT", ignoreCase = true) || errorMsg.contains("timed out", ignoreCase = true) || errorMsg.contains("Timeout", ignoreCase = true) ->
                        "Server Timeout"
                    else -> "Unknown Error: $errorMsg"
                }
                viewModelScope.launch(Dispatchers.Main) {
                    smartCoachError[memberId] = friendlyError
                    showFeedback(friendlyError)
                }
            } finally {
                viewModelScope.launch(Dispatchers.Main) {
                    smartCoachLoading[memberId] = false
                }
            }
        }
    }
}

class GymViewModelFactory(
    private val repository: GymRepository,
    private val context: android.content.Context
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(GymViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return GymViewModel(repository, context) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

enum class AuthLoadingState {
    VERIFYING,
    COMPLETED
}
