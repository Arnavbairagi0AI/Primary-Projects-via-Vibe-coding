package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        MedicalProfileEntity::class,
        EmergencyContactEntity::class,
        IncidentReportEntity::class,
        ChatMessageEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class RescueDatabase : RoomDatabase() {
    abstract fun rescueDao(): RescueDao

    companion object {
        @Volatile
        private var INSTANCE: RescueDatabase? = null

        fun getDatabase(context: Context): RescueDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    RescueDatabase::class.java,
                    "rescue_ai_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
