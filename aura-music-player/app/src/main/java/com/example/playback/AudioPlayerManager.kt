package com.example.playback

import android.content.Context
import android.media.MediaPlayer
import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
import android.media.audiofx.Virtualizer
import android.media.audiofx.LoudnessEnhancer
import android.media.audiofx.PresetReverb
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.example.data.model.Song
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class RepeatMode {
    OFF, ONE, ALL
}

object AudioPlayerManager {
    private const val TAG = "AudioPlayerManager"

    private var mediaPlayer: MediaPlayer? = null
    private val coroutineScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var positionJob: Job? = null

    // Audio Effects
    private var equalizer: Equalizer? = null
    private var bassBoost: BassBoost? = null
    private var virtualizer: Virtualizer? = null
    private var loudnessEnhancer: LoudnessEnhancer? = null
    private var presetReverb: PresetReverb? = null

    // State flows
    private val _currentSong = MutableStateFlow<Song?>(null)
    val currentSong: StateFlow<Song?> = _currentSong.asStateFlow()

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _currentPosition = MutableStateFlow(0L)
    val currentPosition: StateFlow<Long> = _currentPosition.asStateFlow()

    private val _duration = MutableStateFlow(0L)
    val duration: StateFlow<Long> = _duration.asStateFlow()

    private val _bufferedPosition = MutableStateFlow(0L)
    val bufferedPosition: StateFlow<Long> = _bufferedPosition.asStateFlow()

    private val _queue = MutableStateFlow<List<Song>>(emptyList())
    val queue: StateFlow<List<Song>> = _queue.asStateFlow()

    private var currentIndex = -1

    // Settings State flows
    private val _playbackSpeed = MutableStateFlow(1.0f)
    val playbackSpeed: StateFlow<Float> = _playbackSpeed.asStateFlow()

    private val _shuffleMode = MutableStateFlow(false)
    val shuffleMode: StateFlow<Boolean> = _shuffleMode.asStateFlow()

    private val _repeatMode = MutableStateFlow(RepeatMode.OFF)
    val repeatMode: StateFlow<RepeatMode> = _repeatMode.asStateFlow()

    private val _sleepTimerRemaining = MutableStateFlow(0) // seconds
    val sleepTimerRemaining: StateFlow<Int> = _sleepTimerRemaining.asStateFlow()
    private var sleepTimerJob: Job? = null

    // Equalizer State flows
    private val _equalizerEnabled = MutableStateFlow(false)
    val equalizerEnabled: StateFlow<Boolean> = _equalizerEnabled.asStateFlow()

    private val _equalizerBands = MutableStateFlow<Map<Int, Int>>(emptyMap()) // active bandId -> milliBel level
    val equalizerBands: StateFlow<Map<Int, Int>> = _equalizerBands.asStateFlow()

    private val _bassBoostStrength = MutableStateFlow(0) // 0 to 1000
    val bassBoostStrength: StateFlow<Int> = _bassBoostStrength.asStateFlow()

    private val _virtualizerStrength = MutableStateFlow(0) // 0 to 1000
    val virtualizerStrength: StateFlow<Int> = _virtualizerStrength.asStateFlow()

    private val _equalizerBandMode = MutableStateFlow(5) // 5, 10, 15
    val equalizerBandMode: StateFlow<Int> = _equalizerBandMode.asStateFlow()

    private val _preampLevel = MutableStateFlow(0) // -1500 to 1500 mB
    val preampLevel: StateFlow<Int> = _preampLevel.asStateFlow()

    private val _trebleBoostStrength = MutableStateFlow(0) // 0 to 1000
    val trebleBoostStrength: StateFlow<Int> = _trebleBoostStrength.asStateFlow()

    private val _loudnessStrength = MutableStateFlow(0) // 0 to 1000
    val loudnessStrength: StateFlow<Int> = _loudnessStrength.asStateFlow()

    private val _stereoBalance = MutableStateFlow(0f) // -1.0f to 1.0f
    val stereoBalance: StateFlow<Float> = _stereoBalance.asStateFlow()

    private val _leftChannelGain = MutableStateFlow(1.0f) // 0.0f to 1.0f
    val leftChannelGain: StateFlow<Float> = _leftChannelGain.asStateFlow()

    private val _rightChannelGain = MutableStateFlow(1.0f) // 0.0f to 1.0f
    val rightChannelGain: StateFlow<Float> = _rightChannelGain.asStateFlow()

    private val _compressorEnabled = MutableStateFlow(false)
    val compressorEnabled: StateFlow<Boolean> = _compressorEnabled.asStateFlow()

    private val _compressorRatio = MutableStateFlow(2.0f) // 1.0f to 10.0f
    val compressorRatio: StateFlow<Float> = _compressorRatio.asStateFlow()

    private val _limiterEnabled = MutableStateFlow(false)
    val limiterEnabled: StateFlow<Boolean> = _limiterEnabled.asStateFlow()

    private val _limiterThreshold = MutableStateFlow(-1.0f) // dB
    val limiterThreshold: StateFlow<Float> = _limiterThreshold.asStateFlow()

    private val _surroundEnabled = MutableStateFlow(false)
    val surroundEnabled: StateFlow<Boolean> = _surroundEnabled.asStateFlow()

    private val _surroundStrength = MutableStateFlow(0) // 0 to 1000
    val surroundStrength: StateFlow<Int> = _surroundStrength.asStateFlow()

    private val _reverbPreset = MutableStateFlow("None") // "None", "Small Room", "Medium Room", "Large Room", "Plate", "Hall"
    val reverbPreset: StateFlow<String> = _reverbPreset.asStateFlow()

    private val _echoEnabled = MutableStateFlow(false)
    val echoEnabled: StateFlow<Boolean> = _echoEnabled.asStateFlow()

    private val _echoDelay = MutableStateFlow(250) // ms
    val echoDelay: StateFlow<Int> = _echoDelay.asStateFlow()

    private val _echoDecay = MutableStateFlow(0.5f) // 0.0f to 1.0f
    val echoDecay: StateFlow<Float> = _echoDecay.asStateFlow()

    private val _crossfeedStrength = MutableStateFlow(0) // 0 to 1000
    val crossfeedStrength: StateFlow<Int> = _crossfeedStrength.asStateFlow()

    private val _highPassCutoff = MutableStateFlow(20) // Hz
    val highPassCutoff: StateFlow<Int> = _highPassCutoff.asStateFlow()

    private val _lowPassCutoff = MutableStateFlow(20000) // Hz
    val lowPassCutoff: StateFlow<Int> = _lowPassCutoff.asStateFlow()

    private val _selectedPreset = MutableStateFlow("Flat")
    val selectedPreset: StateFlow<String> = _selectedPreset.asStateFlow()

    private val _customPresets = MutableStateFlow<Map<String, List<Int>>>(emptyMap())
    val customPresets: StateFlow<Map<String, List<Int>>> = _customPresets.asStateFlow()

    private val _bands5 = MutableStateFlow<Map<Int, Int>>(emptyMap())
    val bands5: StateFlow<Map<Int, Int>> = _bands5.asStateFlow()

    private val _bands10 = MutableStateFlow<Map<Int, Int>>(emptyMap())
    val bands10: StateFlow<Map<Int, Int>> = _bands10.asStateFlow()

    private val _bands15 = MutableStateFlow<Map<Int, Int>>(emptyMap())
    val bands15: StateFlow<Map<Int, Int>> = _bands15.asStateFlow()

    private val _isLowPowerMode = MutableStateFlow(false)
    val isLowPowerMode: StateFlow<Boolean> = _isLowPowerMode.asStateFlow()

    fun setLowPowerMode(enabled: Boolean) {
        _isLowPowerMode.value = enabled
        Log.d(TAG, "Low Power Mode set to $enabled. Adjusting progress track interval.")
        if (_isPlaying.value) {
            startPositionTracker()
        }
    }

    private var onStateChangeListener: (() -> Unit)? = null

    fun setOnStateChangeListener(listener: () -> Unit) {
        onStateChangeListener = listener
    }

    private fun notifyStateChanged() {
        onStateChangeListener?.invoke()
    }

    fun initPlayer(context: Context) {
        initPrefs(context)
        if (mediaPlayer == null) {
            mediaPlayer = MediaPlayer().apply {
                setOnCompletionListener {
                    handleCompletion(context)
                }
                setOnErrorListener { _, what, extra ->
                    Log.e(TAG, "MediaPlayer error: what=$what, extra=$extra")
                    true
                }
                setOnBufferingUpdateListener { _, percent ->
                    val totalDuration = _duration.value
                    _bufferedPosition.value = (totalDuration * percent / 100)
                }
            }
        }
    }

    fun playSong(context: Context, song: Song, newQueue: List<Song> = emptyList()) {
        initPlayer(context)
        
        if (newQueue.isNotEmpty()) {
            _queue.value = newQueue
            currentIndex = newQueue.indexOfFirst { it.id == song.id }
        } else if (!_queue.value.contains(song)) {
            val updatedQueue = _queue.value.toMutableList().apply { add(song) }
            _queue.value = updatedQueue
            currentIndex = updatedQueue.size - 1
        } else {
            currentIndex = _queue.value.indexOfFirst { it.id == song.id }
        }

        _currentSong.value = song
        _duration.value = song.duration
        if (song.uri.startsWith("http")) {
            _bufferedPosition.value = 0L
        } else {
            _bufferedPosition.value = song.duration
        }

        try {
            mediaPlayer?.reset()
            if (song.uri.startsWith("http")) {
                mediaPlayer?.setDataSource(context, Uri.parse(song.uri))
            } else {
                mediaPlayer?.setDataSource(song.path)
            }
            mediaPlayer?.prepareAsync()
            mediaPlayer?.setOnPreparedListener { mp ->
                _duration.value = mp.duration.toLong()
                
                // Set speed params
                setSpeedParams()
                
                // Reinitialize audio effects on new session
                initAudioEffects(mp.audioSessionId)
                
                mp.start()
                _isPlaying.value = true
                startPositionTracker()
                AudioService.startService(context, song.title, song.artist, true)
                notifyStateChanged()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error playing song: ${song.title}", e)
        }
    }

    private fun setSpeedParams() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            try {
                mediaPlayer?.let { mp ->
                    val params = mp.playbackParams
                    params.speed = _playbackSpeed.value
                    mp.playbackParams = params
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error setting playback speed params", e)
            }
        }
    }

    fun togglePlayPause(context: Context) {
        val mp = mediaPlayer ?: return
        if (mp.isPlaying) {
            mp.pause()
            _isPlaying.value = false
            stopPositionTracker()
            AudioService.startService(context, _currentSong.value?.title ?: "No Song", _currentSong.value?.artist ?: "Unknown", false)
        } else {
            mp.start()
            _isPlaying.value = true
            startPositionTracker()
            AudioService.startService(context, _currentSong.value?.title ?: "No Song", _currentSong.value?.artist ?: "Unknown", true)
        }
        notifyStateChanged()
    }

    fun playNext(context: Context) {
        val q = _queue.value
        if (q.isEmpty()) return

        if (_repeatMode.value == RepeatMode.ONE) {
            _currentSong.value?.let { playSong(context, it) }
            return
        }

        if (_shuffleMode.value) {
            currentIndex = (0 until q.size).random()
        } else {
            currentIndex = (currentIndex + 1) % q.size
        }

        if (currentIndex in q.indices) {
            playSong(context, q[currentIndex])
        }
    }

    fun playPrevious(context: Context) {
        val q = _queue.value
        if (q.isEmpty()) return

        if (currentIndex > 0) {
            currentIndex--
        } else {
            currentIndex = q.size - 1
        }

        if (currentIndex in q.indices) {
            playSong(context, q[currentIndex])
        }
    }

    fun seekTo(position: Long) {
        mediaPlayer?.seekTo(position.toInt())
        _currentPosition.value = position
    }

    fun setQueue(newQueue: List<Song>) {
        val current = _currentSong.value
        _queue.value = newQueue
        if (current != null) {
            currentIndex = newQueue.indexOfFirst { it.id == current.id }
        }
        notifyStateChanged()
    }

    fun setPlaybackSpeed(speed: Float) {
        _playbackSpeed.value = speed
        setSpeedParams()
    }

    fun toggleShuffle() {
        _shuffleMode.value = !_shuffleMode.value
    }

    fun toggleRepeat() {
        _repeatMode.value = when (_repeatMode.value) {
            RepeatMode.OFF -> RepeatMode.ONE
            RepeatMode.ONE -> RepeatMode.ALL
            RepeatMode.ALL -> RepeatMode.OFF
        }
    }

    fun setSleepTimer(minutes: Int) {
        sleepTimerJob?.cancel()
        if (minutes <= 0) {
            _sleepTimerRemaining.value = 0
            return
        }

        _sleepTimerRemaining.value = minutes * 60
        sleepTimerJob = coroutineScope.launch {
            while (_sleepTimerRemaining.value > 0) {
                delay(1000)
                _sleepTimerRemaining.value--
            }
            // Sleep timer triggered! Pause player.
            mediaPlayer?.let { mp ->
                if (mp.isPlaying) {
                    mp.pause()
                    _isPlaying.value = false
                    stopPositionTracker()
                }
            }
        }
    }

    private fun handleCompletion(context: Context) {
        when (_repeatMode.value) {
            RepeatMode.ONE -> {
                _currentSong.value?.let { playSong(context, it) }
            }
            RepeatMode.ALL -> {
                playNext(context)
            }
            RepeatMode.OFF -> {
                if (currentIndex < _queue.value.size - 1) {
                    playNext(context)
                } else {
                    _isPlaying.value = false
                    stopPositionTracker()
                    AudioService.stopService(context)
                }
            }
        }
        notifyStateChanged()
    }

    private fun startPositionTracker() {
        positionJob?.cancel()
        positionJob = coroutineScope.launch {
            while (_isPlaying.value) {
                mediaPlayer?.let {
                    _currentPosition.value = it.currentPosition.toLong()
                }
                val interval = if (_isLowPowerMode.value) 1000L else 200L
                delay(interval)
            }
        }
    }

    private fun stopPositionTracker() {
        positionJob?.cancel()
    }

    // Audio effects setup
    private fun initAudioEffects(audioSessionId: Int) {
        try {
            equalizer?.release()
            equalizer = Equalizer(0, audioSessionId)

            bassBoost?.release()
            bassBoost = BassBoost(0, audioSessionId)

            virtualizer?.release()
            virtualizer = Virtualizer(0, audioSessionId)

            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
                loudnessEnhancer?.release()
                loudnessEnhancer = LoudnessEnhancer(audioSessionId)
            }

            presetReverb?.release()
            presetReverb = PresetReverb(0, audioSessionId)

            applyAudioEffects()
        } catch (e: Exception) {
            Log.e(TAG, "Audio Effects not supported on this device/session", e)
        }
    }

    private var prefsInitialized = false
    fun initPrefs(context: Context) {
        if (prefsInitialized) return
        val prefs = context.applicationContext.getSharedPreferences("equalizer_prefs", Context.MODE_PRIVATE)
        
        _equalizerEnabled.value = prefs.getBoolean("eq_enabled", false)
        _equalizerBandMode.value = prefs.getInt("eq_band_mode", 5)
        _selectedPreset.value = prefs.getString("selected_preset", "Flat") ?: "Flat"
        _preampLevel.value = prefs.getInt("preamp_level", 0)
        _bassBoostStrength.value = prefs.getInt("bass_boost", 0)
        _trebleBoostStrength.value = prefs.getInt("treble_boost", 0)
        _virtualizerStrength.value = prefs.getInt("virtualizer", 0)
        _loudnessStrength.value = prefs.getInt("loudness", 0)
        _stereoBalance.value = prefs.getFloat("stereo_balance", 0f)
        _leftChannelGain.value = prefs.getFloat("left_gain", 1.0f)
        _rightChannelGain.value = prefs.getFloat("right_gain", 1.0f)
        _compressorEnabled.value = prefs.getBoolean("compressor_enabled", false)
        _compressorRatio.value = prefs.getFloat("compressor_ratio", 2.0f)
        _limiterEnabled.value = prefs.getBoolean("limiter_enabled", false)
        _limiterThreshold.value = prefs.getFloat("limiter_threshold", -1.0f)
        _surroundEnabled.value = prefs.getBoolean("surround_enabled", false)
        _surroundStrength.value = prefs.getInt("surround_strength", 0)
        _reverbPreset.value = prefs.getString("reverb_preset", "None") ?: "None"
        _echoEnabled.value = prefs.getBoolean("echo_enabled", false)
        _echoDelay.value = prefs.getInt("echo_delay", 250)
        _echoDecay.value = prefs.getFloat("echo_decay", 0.5f)
        _crossfeedStrength.value = prefs.getInt("crossfeed", 0)
        _highPassCutoff.value = prefs.getInt("high_pass", 20)
        _lowPassCutoff.value = prefs.getInt("low_pass", 20000)

        // Load 5, 10, 15 bands
        val bands5Map = mutableMapOf<Int, Int>()
        val saved5Str = prefs.getString("saved_bands_5", "") ?: ""
        if (saved5Str.isNotEmpty()) {
            try {
                val arr = org.json.JSONArray(saved5Str)
                for (i in 0 until arr.length()) {
                    bands5Map[i] = arr.getInt(i)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading 5-band values", e)
            }
        }
        if (bands5Map.isEmpty()) {
            for (i in 0 until 5) bands5Map[i] = 0
        }
        _bands5.value = bands5Map

        val bands10Map = mutableMapOf<Int, Int>()
        val saved10Str = prefs.getString("saved_bands_10", "") ?: ""
        if (saved10Str.isNotEmpty()) {
            try {
                val arr = org.json.JSONArray(saved10Str)
                for (i in 0 until arr.length()) {
                    bands10Map[i] = arr.getInt(i)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading 10-band values", e)
            }
        }
        if (bands10Map.isEmpty()) {
            for (i in 0 until 10) bands10Map[i] = 0
        }
        _bands10.value = bands10Map

        val bands15Map = mutableMapOf<Int, Int>()
        val saved15Str = prefs.getString("saved_bands_15", "") ?: ""
        if (saved15Str.isNotEmpty()) {
            try {
                val arr = org.json.JSONArray(saved15Str)
                for (i in 0 until arr.length()) {
                    bands15Map[i] = arr.getInt(i)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading 15-band values", e)
            }
        }
        if (bands15Map.isEmpty()) {
            for (i in 0 until 15) bands15Map[i] = 0
        }
        _bands15.value = bands15Map

        // Load Custom Presets
        val customPresetsJson = prefs.getString("custom_presets_v2", "{}") ?: "{}"
        try {
            val json = org.json.JSONObject(customPresetsJson)
            val map = mutableMapOf<String, List<Int>>()
            val keys = json.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val arr = json.getJSONArray(key)
                val list = mutableListOf<Int>()
                for (i in 0 until arr.length()) {
                    list.add(arr.getInt(i))
                }
                map[key] = list
            }
            _customPresets.value = map
        } catch (e: Exception) {
            Log.e(TAG, "Error loading custom presets", e)
        }

        updateActiveBands()
        prefsInitialized = true
    }

    fun savePrefs(context: Context) {
        val prefs = context.applicationContext.getSharedPreferences("equalizer_prefs", Context.MODE_PRIVATE)
        val editor = prefs.edit()
        
        editor.putBoolean("eq_enabled", _equalizerEnabled.value)
        editor.putInt("eq_band_mode", _equalizerBandMode.value)
        editor.putString("selected_preset", _selectedPreset.value)
        editor.putInt("preamp_level", _preampLevel.value)
        editor.putInt("bass_boost", _bassBoostStrength.value)
        editor.putInt("treble_boost", _trebleBoostStrength.value)
        editor.putInt("virtualizer", _virtualizerStrength.value)
        editor.putInt("loudness", _loudnessStrength.value)
        editor.putFloat("stereo_balance", _stereoBalance.value)
        editor.putFloat("left_gain", _leftChannelGain.value)
        editor.putFloat("right_gain", _rightChannelGain.value)
        editor.putBoolean("compressor_enabled", _compressorEnabled.value)
        editor.putFloat("compressor_ratio", _compressorRatio.value)
        editor.putBoolean("limiter_enabled", _limiterEnabled.value)
        editor.putFloat("limiter_threshold", _limiterThreshold.value)
        editor.putBoolean("surround_enabled", _surroundEnabled.value)
        editor.putInt("surround_strength", _surroundStrength.value)
        editor.putString("reverb_preset", _reverbPreset.value)
        editor.putBoolean("echo_enabled", _echoEnabled.value)
        editor.putInt("echo_delay", _echoDelay.value)
        editor.putFloat("echo_decay", _echoDecay.value)
        editor.putInt("crossfeed", _crossfeedStrength.value)
        editor.putInt("high_pass", _highPassCutoff.value)
        editor.putInt("low_pass", _lowPassCutoff.value)

        // Save 5, 10, 15 bands
        try {
            val arr5 = org.json.JSONArray()
            val m5 = _bands5.value
            for (i in 0 until 5) arr5.put(m5[i] ?: 0)
            editor.putString("saved_bands_5", arr5.toString())

            val arr10 = org.json.JSONArray()
            val m10 = _bands10.value
            for (i in 0 until 10) arr10.put(m10[i] ?: 0)
            editor.putString("saved_bands_10", arr10.toString())

            val arr15 = org.json.JSONArray()
            val m15 = _bands15.value
            for (i in 0 until 15) arr15.put(m15[i] ?: 0)
            editor.putString("saved_bands_15", arr15.toString())
        } catch (e: Exception) {
            Log.e(TAG, "Error saving band values", e)
        }

        // Save Custom Presets
        try {
            val json = org.json.JSONObject()
            _customPresets.value.forEach { (key, list) ->
                val arr = org.json.JSONArray()
                list.forEach { arr.put(it) }
                json.put(key, arr)
            }
            editor.putString("custom_presets_v2", json.toString())
        } catch (e: Exception) {
            Log.e(TAG, "Error saving custom presets", e)
        }

        editor.apply()
    }

    val freq5 = listOf(60, 230, 910, 4000, 14000)
    val freq10 = listOf(31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000)
    val freq15 = listOf(25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 16000)

    fun updateActiveBands() {
        val mode = _equalizerBandMode.value
        _equalizerBands.value = when (mode) {
            5 -> _bands5.value
            10 -> _bands10.value
            else -> _bands15.value
        }
    }

    private fun getInterpolatedGainForFreq(freqHz: Int, mode: Int): Int {
        val (freqs, gains) = when (mode) {
            5 -> {
                val list = freq5
                val map = _bands5.value
                list to List(5) { map[it] ?: 0 }
            }
            10 -> {
                val list = freq10
                val map = _bands10.value
                list to List(10) { map[it] ?: 0 }
            }
            else -> {
                val list = freq15
                val map = _bands15.value
                list to List(15) { map[it] ?: 0 }
            }
        }

        if (gains.isEmpty()) return 0
        if (freqHz <= freqs.first()) return gains.first()
        if (freqHz >= freqs.last()) return gains.last()

        // Find the interval
        for (i in 0 until freqs.size - 1) {
            if (freqHz >= freqs[i] && freqHz <= freqs[i+1]) {
                val f0 = freqs[i].toFloat()
                val f1 = freqs[i+1].toFloat()
                val g0 = gains[i].toFloat()
                val g1 = gains[i+1].toFloat()
                
                val logF0 = Math.log10(f0.toDouble())
                val logF1 = Math.log10(f1.toDouble())
                val logF = Math.log10(freqHz.toDouble())
                
                if (logF1 == logF0) return g0.toInt()
                val t = (logF - logF0) / (logF1 - logF0)
                val interpolated = g0 + t * (g1 - g0)
                return interpolated.toInt()
            }
        }
        return 0
    }

    fun applyAudioEffects() {
        val enabled = _equalizerEnabled.value
        
        // Equalizer
        try {
            equalizer?.let { eq ->
                eq.enabled = enabled
                if (enabled) {
                    val mode = _equalizerBandMode.value
                    val numBands = eq.numberOfBands.toInt()
                    for (j in 0 until numBands) {
                        val centerFreqHz = eq.getCenterFreq(j.toShort()) / 1000
                        var gain = getInterpolatedGainForFreq(centerFreqHz, mode)
                        
                        // Apply treble boost if high frequency
                        if (centerFreqHz > 2000) {
                            val factor = ((centerFreqHz - 2000).toFloat() / 14000f).coerceIn(0f, 1f)
                            val trebleAdd = (factor * (_trebleBoostStrength.value.toFloat() / 1000f) * 1200f).toInt()
                            gain += trebleAdd
                        }
                        
                        val finalGain = (gain + _preampLevel.value).coerceIn(-1500, 1500)
                        eq.setBandLevel(j.toShort(), finalGain.toShort())
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error applying hardware equalizer", e)
        }

        // Bass Boost
        try {
            bassBoost?.let { bb ->
                bb.enabled = enabled
                if (enabled) {
                    bb.setStrength(_bassBoostStrength.value.toShort())
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error applying bass boost", e)
        }

        // Virtualizer (including Surround)
        try {
            virtualizer?.let { vz ->
                vz.enabled = enabled || _surroundEnabled.value
                if (enabled || _surroundEnabled.value) {
                    val maxStrength = Math.max(_virtualizerStrength.value, if (_surroundEnabled.value) _surroundStrength.value else 0)
                    vz.setStrength(maxStrength.toShort())
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error applying virtualizer", e)
        }

        // Loudness Enhancer
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            try {
                loudnessEnhancer?.let { le ->
                    le.enabled = enabled
                    if (enabled) {
                        val mB = _loudnessStrength.value * 2 // map 0-1000 to 0-2000
                        le.setTargetGain(mB)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error applying loudness enhancer", e)
            }
        }

        // Preset Reverb
        try {
            presetReverb?.let { pr ->
                pr.enabled = enabled && _reverbPreset.value != "None"
                if (enabled && _reverbPreset.value != "None") {
                    val presetShort = when (_reverbPreset.value) {
                        "Small Room" -> PresetReverb.PRESET_SMALLROOM
                        "Medium Room" -> PresetReverb.PRESET_MEDIUMROOM
                        "Large Room" -> PresetReverb.PRESET_LARGEROOM
                        "Plate" -> PresetReverb.PRESET_PLATE
                        "Hall" -> PresetReverb.PRESET_LARGEROOM
                        else -> PresetReverb.PRESET_NONE
                    }
                    pr.preset = presetShort
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error applying preset reverb", e)
        }

        // Volume / Balance
        try {
            mediaPlayer?.let { mp ->
                val balance = _stereoBalance.value // -1.0f to 1.0f
                val leftChannel = _leftChannelGain.value
                val rightChannel = _rightChannelGain.value
                
                val leftBase = if (balance > 0f) 1.0f - balance else 1.0f
                val rightBase = if (balance < 0f) 1.0f + balance else 1.0f
                
                val finalLeft = (leftBase * leftChannel).coerceIn(0f, 1f)
                val finalRight = (rightBase * rightChannel).coerceIn(0f, 1f)
                
                mp.setVolume(finalLeft, finalRight)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error applying volume balance", e)
        }
    }

    fun setEqualizerEnabled(enabled: Boolean) {
        _equalizerEnabled.value = enabled
        applyAudioEffects()
    }

    fun setEqualizerEnabled(context: Context, enabled: Boolean) {
        _equalizerEnabled.value = enabled
        savePrefs(context)
        applyAudioEffects()
    }

    fun setEqualizerBandMode(context: Context, mode: Int) {
        _equalizerBandMode.value = mode
        updateActiveBands()
        savePrefs(context)
        applyAudioEffects()
    }

    fun setEqualizerBandLevel(bandId: Int, levelMilliBel: Int) {
        val mode = _equalizerBandMode.value
        when (mode) {
            5 -> {
                val updated = _bands5.value.toMutableMap()
                updated[bandId] = levelMilliBel
                _bands5.value = updated
            }
            10 -> {
                val updated = _bands10.value.toMutableMap()
                updated[bandId] = levelMilliBel
                _bands10.value = updated
            }
            else -> {
                val updated = _bands15.value.toMutableMap()
                updated[bandId] = levelMilliBel
                _bands15.value = updated
            }
        }
        updateActiveBands()
        applyAudioEffects()
    }

    fun setEqualizerBandLevel(context: Context, bandId: Int, levelMilliBel: Int) {
        val mode = _equalizerBandMode.value
        when (mode) {
            5 -> {
                val updated = _bands5.value.toMutableMap()
                updated[bandId] = levelMilliBel
                _bands5.value = updated
            }
            10 -> {
                val updated = _bands10.value.toMutableMap()
                updated[bandId] = levelMilliBel
                _bands10.value = updated
            }
            else -> {
                val updated = _bands15.value.toMutableMap()
                updated[bandId] = levelMilliBel
                _bands15.value = updated
            }
        }
        updateActiveBands()
        savePrefs(context)
        applyAudioEffects()
    }

    fun setPreampLevel(context: Context, preamp: Int) {
        _preampLevel.value = preamp
        savePrefs(context)
        applyAudioEffects()
    }

    fun setBassBoostStrength(strength: Int) {
        _bassBoostStrength.value = strength
        applyAudioEffects()
    }

    fun setBassBoostStrength(context: Context, strength: Int) {
        _bassBoostStrength.value = strength
        savePrefs(context)
        applyAudioEffects()
    }

    fun setTrebleBoostStrength(context: Context, strength: Int) {
        _trebleBoostStrength.value = strength
        savePrefs(context)
        applyAudioEffects()
    }

    fun setVirtualizerStrength(strength: Int) {
        _virtualizerStrength.value = strength
        applyAudioEffects()
    }

    fun setVirtualizerStrength(context: Context, strength: Int) {
        _virtualizerStrength.value = strength
        savePrefs(context)
        applyAudioEffects()
    }

    fun setLoudnessStrength(context: Context, strength: Int) {
        _loudnessStrength.value = strength
        savePrefs(context)
        applyAudioEffects()
    }

    fun setStereoBalance(context: Context, balance: Float) {
        _stereoBalance.value = balance
        savePrefs(context)
        applyAudioEffects()
    }

    fun setLeftRightGains(context: Context, left: Float, right: Float) {
        _leftChannelGain.value = left
        _rightChannelGain.value = right
        savePrefs(context)
        applyAudioEffects()
    }

    fun setCompressorEnabled(context: Context, enabled: Boolean) {
        _compressorEnabled.value = enabled
        savePrefs(context)
        applyAudioEffects()
    }

    fun setCompressorRatio(context: Context, ratio: Float) {
        _compressorRatio.value = ratio
        savePrefs(context)
        applyAudioEffects()
    }

    fun setLimiterEnabled(context: Context, enabled: Boolean) {
        _limiterEnabled.value = enabled
        savePrefs(context)
        applyAudioEffects()
    }

    fun setLimiterThreshold(context: Context, threshold: Float) {
        _limiterThreshold.value = threshold
        savePrefs(context)
        applyAudioEffects()
    }

    fun setSurroundEnabled(context: Context, enabled: Boolean) {
        _surroundEnabled.value = enabled
        savePrefs(context)
        applyAudioEffects()
    }

    fun setSurroundStrength(context: Context, strength: Int) {
        _surroundStrength.value = strength
        savePrefs(context)
        applyAudioEffects()
    }

    fun setReverbPreset(context: Context, preset: String) {
        _reverbPreset.value = preset
        savePrefs(context)
        applyAudioEffects()
    }

    fun setEchoEnabled(context: Context, enabled: Boolean) {
        _echoEnabled.value = enabled
        savePrefs(context)
        applyAudioEffects()
    }

    fun setEchoDelay(context: Context, delay: Int) {
        _echoDelay.value = delay
        savePrefs(context)
        applyAudioEffects()
    }

    fun setEchoDecay(context: Context, decay: Float) {
        _echoDecay.value = decay
        savePrefs(context)
        applyAudioEffects()
    }

    fun setCrossfeedStrength(context: Context, strength: Int) {
        _crossfeedStrength.value = strength
        savePrefs(context)
        applyAudioEffects()
    }

    fun setHighPassCutoff(context: Context, cutoff: Int) {
        _highPassCutoff.value = cutoff
        savePrefs(context)
        applyAudioEffects()
    }

    fun setLowPassCutoff(context: Context, cutoff: Int) {
        _lowPassCutoff.value = cutoff
        savePrefs(context)
        applyAudioEffects()
    }

    fun applyPreset(presetName: String) {
        _selectedPreset.value = presetName
        val targetGains = getPresetGains(presetName)
        val mode = _equalizerBandMode.value
        when (mode) {
            5 -> {
                val map = mutableMapOf<Int, Int>()
                val indices = listOf(2, 5, 8, 11, 14)
                for (i in 0 until 5) {
                    val gainIndex = indices[i]
                    map[i] = if (gainIndex < targetGains.size) targetGains[gainIndex] else 0
                }
                _bands5.value = map
            }
            10 -> {
                val map = mutableMapOf<Int, Int>()
                val indices = listOf(1, 2, 3, 5, 7, 8, 10, 11, 13, 14)
                for (i in 0 until 10) {
                    val gainIndex = indices[i]
                    map[i] = if (gainIndex < targetGains.size) targetGains[gainIndex] else 0
                }
                _bands10.value = map
            }
            else -> {
                val map = mutableMapOf<Int, Int>()
                for (i in 0 until 15) {
                    map[i] = if (i < targetGains.size) targetGains[i] else 0
                }
                _bands15.value = map
            }
        }
        updateActiveBands()
        applyAudioEffects()
    }

    fun applyPreset(context: Context, presetName: String) {
        _selectedPreset.value = presetName
        
        val targetGains = if (presetName.lowercase() == "custom") {
            return
        } else if (_customPresets.value.containsKey(presetName)) {
            _customPresets.value[presetName] ?: List(15) { 0 }
        } else {
            getPresetGains(presetName)
        }

        val mode = _equalizerBandMode.value
        when (mode) {
            5 -> {
                val map = mutableMapOf<Int, Int>()
                val indices = listOf(2, 5, 8, 11, 14)
                for (i in 0 until 5) {
                    val gainIndex = indices[i]
                    map[i] = if (gainIndex < targetGains.size) targetGains[gainIndex] else 0
                }
                _bands5.value = map
            }
            10 -> {
                val map = mutableMapOf<Int, Int>()
                val indices = listOf(1, 2, 3, 5, 7, 8, 10, 11, 13, 14)
                for (i in 0 until 10) {
                    val gainIndex = indices[i]
                    map[i] = if (gainIndex < targetGains.size) targetGains[gainIndex] else 0
                }
                _bands10.value = map
            }
            else -> {
                val map = mutableMapOf<Int, Int>()
                for (i in 0 until 15) {
                    map[i] = if (i < targetGains.size) targetGains[i] else 0
                }
                _bands15.value = map
            }
        }

        if (presetName.lowercase().contains("bass")) {
            _bassBoostStrength.value = 800
            _virtualizerStrength.value = 300
        } else if (presetName.lowercase() == "surround") {
            _surroundEnabled.value = true
            _surroundStrength.value = 800
            _virtualizerStrength.value = 600
        } else if (presetName.lowercase() == "flat") {
            _bassBoostStrength.value = 0
            _virtualizerStrength.value = 0
            _trebleBoostStrength.value = 0
        }

        updateActiveBands()
        savePrefs(context)
        applyAudioEffects()
    }

    fun createCustomPreset(context: Context, name: String) {
        val list15 = List(15) { i ->
            getInterpolatedGainForFreq(freq15[i], _equalizerBandMode.value)
        }
        val updated = _customPresets.value.toMutableMap()
        updated[name] = list15
        _customPresets.value = updated
        _selectedPreset.value = name
        savePrefs(context)
    }

    fun renameCustomPreset(context: Context, oldName: String, newName: String) {
        val updated = _customPresets.value.toMutableMap()
        if (updated.containsKey(oldName)) {
            val list = updated.remove(oldName)!!
            updated[newName] = list
            _customPresets.value = updated
            if (_selectedPreset.value == oldName) {
                _selectedPreset.value = newName
            }
            savePrefs(context)
        }
    }

    fun duplicateCustomPreset(context: Context, name: String, dupName: String) {
        val updated = _customPresets.value.toMutableMap()
        if (updated.containsKey(name)) {
            updated[dupName] = updated[name]!!
            _customPresets.value = updated
            _selectedPreset.value = dupName
            savePrefs(context)
        }
    }

    fun deleteCustomPreset(context: Context, name: String) {
        val updated = _customPresets.value.toMutableMap()
        if (updated.containsKey(name)) {
            updated.remove(name)
            _customPresets.value = updated
            if (_selectedPreset.value == name) {
                _selectedPreset.value = "Flat"
                applyPreset(context, "Flat")
            } else {
                savePrefs(context)
            }
        }
    }

    fun importCustomPreset(context: Context, name: String, jsonStr: String): Boolean {
        return try {
            val arr = org.json.JSONArray(jsonStr)
            val list = mutableListOf<Int>()
            for (i in 0 until arr.length()) {
                list.add(arr.getInt(i))
            }
            val updated = _customPresets.value.toMutableMap()
            updated[name] = list
            _customPresets.value = updated
            _selectedPreset.value = name
            savePrefs(context)
            applyPreset(context, name)
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to import custom preset", e)
            false
        }
    }

    fun exportCustomPreset(name: String): String {
        val list = _customPresets.value[name] ?: return "[]"
        val arr = org.json.JSONArray()
        list.forEach { arr.put(it) }
        return arr.toString()
    }

    fun resetCurrentPreset(context: Context) {
        val mode = _equalizerBandMode.value
        when (mode) {
            5 -> {
                val map = mutableMapOf<Int, Int>()
                for (i in 0 until 5) map[i] = 0
                _bands5.value = map
            }
            10 -> {
                val map = mutableMapOf<Int, Int>()
                for (i in 0 until 10) map[i] = 0
                _bands10.value = map
            }
            else -> {
                val map = mutableMapOf<Int, Int>()
                for (i in 0 until 15) map[i] = 0
                _bands15.value = map
            }
        }
        updateActiveBands()
        savePrefs(context)
        applyAudioEffects()
    }

    fun getPresetGains(presetName: String): List<Int> {
        return when (presetName.lowercase()) {
            "flat" -> listOf(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
            "normal" -> listOf(100, 100, 100, 50, 0, 0, 0, 0, 50, 100, 100, 100, 100, 100, 100)
            "bass booster" -> listOf(1200, 1100, 1000, 800, 600, 400, 200, 0, 0, 0, 0, 0, 0, 0, 0)
            "extra bass" -> listOf(1500, 1400, 1300, 1100, 900, 600, 300, 0, 0, 0, 0, 0, 0, 0, 0)
            "deep bass" -> listOf(1400, 1500, 1400, 1000, 700, 300, 0, 0, 0, 0, 0, 0, 0, 0, 0)
            "heavy bass" -> listOf(1300, 1300, 1200, 1000, 800, 500, 200, 0, -100, -200, -200, -200, -100, 0, 0)
            "vocal" -> listOf(-600, -500, -400, -200, 200, 500, 800, 1000, 1200, 1100, 900, 600, 300, 100, 0)
            "podcast" -> listOf(-800, -600, -400, -100, 300, 700, 900, 1100, 1200, 1000, 800, 500, 200, 0, -200)
            "speech" -> listOf(-900, -700, -500, -200, 400, 800, 1000, 1200, 1300, 1100, 900, 600, 300, 0, -300)
            "acoustic" -> listOf(600, 500, 400, 200, 100, 200, 400, 500, 600, 700, 800, 900, 900, 800, 700)
            "classical" -> listOf(800, 700, 600, 400, 200, 0, 0, 0, 0, 200, 400, 600, 700, 800, 800)
            "jazz" -> listOf(600, 500, 300, 200, -100, -300, -200, 0, 200, 400, 600, 800, 900, 800, 600)
            "blues" -> listOf(400, 500, 600, 400, 200, 0, -100, 100, 300, 500, 700, 600, 500, 400, 300)
            "rock" -> listOf(1000, 900, 800, 600, 300, -200, -400, -200, 200, 500, 800, 1000, 1100, 1200, 1200)
            "soft rock" -> listOf(600, 500, 400, 300, 100, -100, -200, -100, 100, 300, 500, 700, 800, 900, 900)
            "hard rock" -> listOf(1100, 1000, 900, 700, 400, -100, -300, -100, 300, 600, 900, 1100, 1200, 1300, 1300)
            "metal" -> listOf(800, 900, 1000, 700, 300, -400, -600, -300, 200, 600, 900, 1100, 1100, 1000, 900)
            "pop" -> listOf(-200, -100, 100, 300, 600, 800, 1000, 900, 700, 400, 200, -100, -200, -200, -200)
            "dance" -> listOf(1100, 1200, 1000, 600, 200, 0, 200, 400, 600, 800, 1000, 1000, 800, 600, 400)
            "edm" -> listOf(1200, 1300, 1100, 700, 300, -100, 100, 300, 500, 800, 1100, 1100, 900, 800, 600)
            "house" -> listOf(1000, 1100, 900, 500, 200, -100, 0, 200, 400, 600, 800, 900, 800, 700, 500)
            "techno" -> listOf(1100, 1200, 1000, 600, 200, -200, -100, 100, 300, 600, 900, 1000, 900, 800, 600)
            "trance" -> listOf(900, 1000, 1100, 800, 400, 0, 100, 300, 500, 700, 900, 1100, 1000, 900, 800)
            "dubstep" -> listOf(1300, 1400, 1200, 800, 300, -300, -100, 200, 500, 800, 1100, 1200, 1000, 900, 800)
            "hip-hop" -> listOf(900, 1000, 1000, 700, 500, 200, 100, 0, 100, 300, 500, 700, 800, 900, 900)
            "rap" -> listOf(800, 900, 900, 600, 400, 100, 0, -100, 200, 400, 600, 800, 800, 900, 900)
            "trap" -> listOf(1100, 1200, 1100, 800, 500, 100, -100, 0, 200, 500, 800, 1000, 1100, 1200, 1200)
            "phonk" -> listOf(1300, 1300, 1200, 900, 600, 200, 0, 100, 300, 600, 900, 1100, 1200, 1200, 1100)
            "lo-fi" -> listOf(400, 500, 400, 200, 0, -200, -300, -200, 0, 200, 400, 300, 100, -200, -500)
            "chill" -> listOf(600, 600, 500, 300, 100, 0, 100, 200, 300, 400, 500, 600, 600, 500, 400)
            "ambient" -> listOf(800, 700, 600, 400, 200, 100, 200, 300, 400, 500, 500, 400, 300, 200, 100)
            "piano" -> listOf(400, 500, 600, 400, 200, 100, 200, 400, 600, 700, 800, 700, 600, 500, 400)
            "orchestra" -> listOf(800, 800, 700, 500, 300, 100, 0, 100, 300, 500, 700, 800, 900, 900, 800)
            "bollywood" -> listOf(600, 700, 600, 400, 200, 100, 200, 400, 600, 800, 900, 800, 700, 600, 500)
            "punjabi" -> listOf(1100, 1100, 900, 600, 300, 100, 200, 400, 600, 800, 900, 1000, 900, 800, 700)
            "devotional" -> listOf(400, 500, 500, 400, 200, 100, 200, 300, 500, 700, 800, 800, 700, 600, 500)
            "gaming" -> listOf(900, 800, 600, 400, 200, 0, 100, 300, 500, 700, 900, 1000, 1100, 1100, 1000)
            "movie" -> listOf(800, 700, 500, 300, 100, 0, 100, 200, 400, 600, 800, 900, 1000, 900, 800)
            "cinema" -> listOf(900, 800, 600, 400, 200, 100, 200, 300, 500, 700, 900, 1000, 1000, 900, 800)
            "surround" -> listOf(500, 400, 300, 200, 100, 200, 300, 400, 500, 600, 700, 800, 800, 700, 600)
            "studio monitor" -> listOf(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
            "party" -> listOf(900, 1000, 900, 500, 100, -100, -100, 0, 200, 500, 800, 900, 900, 800, 700)
            "car audio" -> listOf(1000, 900, 800, 500, 200, 0, 100, 200, 400, 600, 800, 900, 800, 700, 600)
            "headphones" -> listOf(400, 500, 600, 400, 100, -100, -100, 0, 200, 500, 700, 800, 800, 700, 600)
            "earbuds" -> listOf(600, 700, 600, 300, 0, -200, -100, 100, 300, 600, 800, 900, 1000, 900, 800)
            "outdoor" -> listOf(1100, 1000, 800, 500, 200, 100, 200, 300, 500, 700, 900, 1000, 1000, 900, 800)
            "night listening" -> listOf(-400, -300, -200, -100, 0, 100, 200, 300, 300, 200, 100, 0, -100, -200, -300)
            else -> listOf(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        }
    }

    fun release() {
        mediaPlayer?.release()
        mediaPlayer = null
        equalizer?.release()
        equalizer = null
        bassBoost?.release()
        bassBoost = null
        virtualizer?.release()
        virtualizer = null
        loudnessEnhancer?.release()
        loudnessEnhancer = null
        presetReverb?.release()
        presetReverb = null
        positionJob?.cancel()
        sleepTimerJob?.cancel()
    }
}
