package com.example.ui.screens

import androidx.compose.runtime.mutableStateOf

object PerformanceMonitor {
    // True if performance issue (e.g., frame drops) is detected.
    val isLowPerformance = mutableStateOf(false)

    // Store the last 60 frame durations to compute moving average FPS
    private val frameIntervals = mutableListOf<Long>()
    private var lastFrameTimeNs = 0L

    fun recordFrame() {
        val nowNs = System.nanoTime()
        if (lastFrameTimeNs != 0L) {
            val intervalMs = (nowNs - lastFrameTimeNs) / 1_000_000L
            frameIntervals.add(intervalMs)
            
            // Analyze performance over a window of 60 frames (~1 second)
            if (frameIntervals.size >= 60) {
                val totalTimeMs = frameIntervals.sum()
                val avgFps = if (totalTimeMs > 0) (frameIntervals.size * 1000.0) / totalTimeMs else 60.0
                
                // If average FPS drops below 52, automatically flag low performance to disable particle effects
                if (avgFps < 52.0) {
                    isLowPerformance.value = true
                } else if (avgFps >= 57.0) {
                    // Recover if performance stabilizes above 57 FPS
                    isLowPerformance.value = false
                }
                frameIntervals.clear()
            }
        }
        lastFrameTimeNs = nowNs
    }

    fun reset() {
        frameIntervals.clear()
        lastFrameTimeNs = 0L
        isLowPerformance.value = false
    }
}
