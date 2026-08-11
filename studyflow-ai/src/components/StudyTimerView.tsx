/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, StudySession } from '../types';

interface StudyTimerViewProps {
  userProfile: UserProfile;
  onAddSession: (session: StudySession) => void;
  onUpdateUserProfile: (updatedProfile: UserProfile) => void;
  onNavigate?: (tab: string) => void;
}

const ALARM_SOUNDS = [
  { id: 'digital_beep', name: '🔔 Standard Digital Beep', url: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav', isPremium: false },
  { id: 'zen_bowl', name: '🥣 Zen Tibetan Bowl', url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-200.wav', isPremium: true },
  { id: 'temple_gong', name: '🎚️ Ancient Temple Gong', url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-200.wav', isPremium: true },
  { id: 'gentle_harp', name: '🎵 Celestial Gentle Harp', url: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-200.wav', isPremium: true },
];

export default function StudyTimerView({
  userProfile,
  onAddSession,
  onUpdateUserProfile,
  onNavigate
}: StudyTimerViewProps) {
  const [timerType, setTimerType] = useState<'pomodoro' | 'short_break' | 'long_break'>('pomodoro');
  
  // Custom configurable durations (initialized from user profile preferences if saved)
  const [pomodoroMins, setPomodoroMins] = useState(userProfile.customPomodoroDuration || 25);
  const [shortBreakMins, setShortBreakMins] = useState(userProfile.customBreakDuration || 5);
  const [longBreakMins, setLongBreakMins] = useState(15);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);

  const [minutes, setMinutes] = useState(userProfile.customPomodoroDuration || 25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const [totalFocusedMinutes, setTotalFocusedMinutes] = useState<number>(0);

  // Selected alarm sound preferences
  const [selectedAlarm, setSelectedAlarm] = useState<string>('digital_beep');

  // Keep state synced with profile preferences when component is active or loading
  useEffect(() => {
    if (userProfile.customPomodoroDuration) {
      setPomodoroMins(userProfile.customPomodoroDuration);
    }
    if (userProfile.customBreakDuration) {
      setShortBreakMins(userProfile.customBreakDuration);
    }
  }, [userProfile.customPomodoroDuration, userProfile.customBreakDuration]);

  // Sync current minutes state when timerType or configurations change, but only when not running or paused
  useEffect(() => {
    if (!isActive && seconds === 0) {
      if (timerType === 'pomodoro') setMinutes(pomodoroMins);
      else if (timerType === 'short_break') setMinutes(shortBreakMins);
      else if (timerType === 'long_break') setMinutes(longBreakMins);
    }
  }, [timerType, pomodoroMins, shortBreakMins, longBreakMins, isActive, seconds]);

  // Main countdown timer logic
  useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            handleTimerComplete();
            clearInterval(interval);
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    
    // Play sound notification if possible
    try {
      const activeSound = ALARM_SOUNDS.find(s => s.id === selectedAlarm) || ALARM_SOUNDS[0];
      const audio = new Audio(activeSound.url);
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.log("Audio notify skipped due to browser autoplay protections.");
    }

    // Capture focus duration minutes actually configured
    const sessionDuration = timerType === 'pomodoro' ? pomodoroMins : timerType === 'short_break' ? shortBreakMins : longBreakMins;

    // Create session entity
    const newSession: StudySession = {
      id: 'session_' + Date.now(),
      userId: userProfile.uid,
      durationMinutes: sessionDuration,
      type: timerType,
      createdAt: new Date().toISOString()
    };

    // Save study sessions to Firestore
    try {
      await setDoc(doc(db, 'study_sessions', newSession.id), newSession);
    } catch (fErr) {
      console.warn("Firestore save session skipped:", fErr);
    }

    onAddSession(newSession);
    setCompletedSessions((prev) => prev + 1);
    
    if (timerType === 'pomodoro') {
      setTotalFocusedMinutes((prev) => prev + sessionDuration);
    }
    
    alert(`🎉 Great job! You completed your ${sessionDuration}-minute ${timerType === 'pomodoro' ? 'study block' : 'break block'}! Keep up the incredible momentum.`);
    
    // Automatically switch states
    if (timerType === 'pomodoro') {
      setTimerType('short_break');
    } else {
      setTimerType('pomodoro');
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      const updatedData = {
        customPomodoroDuration: pomodoroMins,
        customBreakDuration: shortBreakMins
      };
      await setDoc(userRef, updatedData, { merge: true });
      
      // Update local profile parent state
      onUpdateUserProfile({
        ...userProfile,
        ...updatedData
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving timer preferences to Firestore:", err);
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setSeconds(0);
    if (timerType === 'pomodoro') setMinutes(pomodoroMins);
    else if (timerType === 'short_break') setMinutes(shortBreakMins);
    else if (timerType === 'long_break') setMinutes(longBreakMins);
  };

  // Duration modifier helpers
  const adjustDuration = (amount: number) => {
    if (isActive) return; // Prevent modifying running timer directly

    if (timerType === 'pomodoro') {
      setPomodoroMins((prev) => Math.max(1, Math.min(120, prev + amount)));
    } else if (timerType === 'short_break') {
      setShortBreakMins((prev) => Math.max(1, Math.min(60, prev + amount)));
    } else if (timerType === 'long_break') {
      setLongBreakMins((prev) => Math.max(1, Math.min(120, prev + amount)));
    }
  };

  const getCurrentConfigVal = () => {
    if (timerType === 'pomodoro') return pomodoroMins;
    if (timerType === 'short_break') return shortBreakMins;
    return longBreakMins;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isActive) return;
    const val = parseInt(e.target.value) || 1;
    if (timerType === 'pomodoro') setPomodoroMins(val);
    else if (timerType === 'short_break') setShortBreakMins(val);
    else if (timerType === 'long_break') setLongBreakMins(val);
  };

  return (
    <div className="max-w-xl mx-auto study-card p-10 bg-white text-center space-y-8">
      
      {/* Tab select mode */}
      <div className="flex bg-stone-100 p-1.5 rounded-2xl max-w-sm mx-auto">
        <button 
          onClick={() => setTimerType('pomodoro')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${timerType === 'pomodoro' ? 'bg-[#5A5A40] text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
        >
          ⏱️ Study Block
        </button>
        <button 
          onClick={() => setTimerType('short_break')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${timerType === 'short_break' ? 'bg-[#D4A373] text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
        >
          ☕ Break
        </button>
      </div>

      {/* Adjust Duration Slider Controls (Aesthetic & Natural styling) */}
      <div className="bg-stone-50 p-4 rounded-2xl max-w-md mx-auto space-y-3.5 border border-black/5">
        <div className="flex items-center justify-between text-xs font-bold text-stone-600">
          <span className="uppercase tracking-wider">⏱️ Adjust Duration:</span>
          <span className="bg-[#5A5A40]/10 text-[#5A5A40] px-3 py-1 rounded-full text-xs font-black">
            {getCurrentConfigVal()} Minutes
          </span>
        </div>

        {isActive ? (
          <p className="text-[10px] text-stone-400 italic font-medium py-1.5">
            🔒 Pause or Reset the timer to adjust your custom duration settings.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Slider */}
            <input 
              type="range" 
              min="1" 
              max={timerType === 'pomodoro' ? "120" : "60"} 
              value={getCurrentConfigVal()}
              onChange={handleSliderChange}
              className="w-full accent-[#5A5A40] cursor-pointer"
            />
            
            {/* Direct adjustment buttons */}
            <div className="flex justify-center items-center gap-2">
              <button 
                onClick={() => adjustDuration(-5)}
                className="bg-white hover:bg-stone-100 text-stone-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-stone-200 transition-colors uppercase tracking-wider cursor-pointer"
              >
                -5 Min
              </button>
              <button 
                onClick={() => adjustDuration(-1)}
                className="bg-white hover:bg-stone-100 text-stone-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-stone-200 transition-colors uppercase tracking-wider cursor-pointer"
              >
                -1 Min
              </button>
              <span className="text-[11px] text-stone-400 font-bold px-2">Adjust</span>
              <button 
                onClick={() => adjustDuration(1)}
                className="bg-white hover:bg-stone-100 text-stone-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-stone-200 transition-colors uppercase tracking-wider cursor-pointer"
              >
                +1 Min
              </button>
              <button 
                onClick={() => adjustDuration(5)}
                className="bg-white hover:bg-stone-100 text-stone-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-stone-200 transition-colors uppercase tracking-wider cursor-pointer"
              >
                +5 Min
              </button>
            </div>
          </div>
        )}

        {/* Save Custom Preferences to Profile (Clean aesthetic call-to-action) */}
        {!isActive && (
          <div className="pt-3 border-t border-stone-200/60 flex flex-col items-center">
            <button
              onClick={handleSavePreferences}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                saveSuccess === true
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm animate-pulse'
                  : saveSuccess === false
                  ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
                  : 'bg-[#5A5A40]/10 hover:bg-[#5A5A40]/20 text-[#5A5A40] border-[#5A5A40]/20'
              }`}
            >
              {isSaving ? (
                <>⏳ Saving to profile...</>
              ) : saveSuccess === true ? (
                <>✨ Saved as default!</>
              ) : saveSuccess === false ? (
                <>❌ Error Saving</>
              ) : (
                <>💾 Save as default durations</>
              )}
            </button>
            <p className="text-[9px] text-stone-400 mt-1.5 text-center leading-normal">
              Saves current Pomodoro and break times directly to your cloud profile.
            </p>
          </div>
        )}

        {/* Alarm Sound Selector (Premium Touch) */}
        <div className="border-t border-stone-200/60 pt-3.5 space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest text-stone-500">🔔 Session Alarm Tone:</span>
            {userProfile.currentPlan !== 'premium' && (
              <span className="text-[8px] bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider border border-amber-500/20">👑 Premium Option</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedAlarm}
              onChange={(e) => {
                const targetSound = ALARM_SOUNDS.find(s => s.id === e.target.value);
                if (targetSound?.isPremium && userProfile.currentPlan !== 'premium') {
                  alert("👑 Tibetan Bowl, Temple Gong, and Celestial Harp alarms are premium study enhancements. Upgrade your account to enjoy these relaxing finished chimes!");
                  if (onNavigate) onNavigate('settings');
                } else {
                  setSelectedAlarm(e.target.value);
                  // Play premium chime preview
                  try {
                    const previewAudio = new Audio(targetSound?.url);
                    previewAudio.volume = 0.35;
                    previewAudio.play();
                  } catch (err) {
                    console.warn("Audio feedback blocked:", err);
                  }
                }
              }}
              className="flex-1 bg-white text-stone-700 text-xs font-semibold px-3 py-2.5 rounded-xl border border-stone-200 focus:border-[#5A5A40] outline-none cursor-pointer"
            >
              {ALARM_SOUNDS.map((sound) => (
                <option key={sound.id} value={sound.id}>
                  {sound.name} {sound.isPremium && userProfile.currentPlan !== 'premium' ? ' (👑 Premium)' : ''}
                </option>
              ))}
            </select>
            
            <button
              type="button"
              onClick={() => {
                const activeSound = ALARM_SOUNDS.find(s => s.id === selectedAlarm) || ALARM_SOUNDS[0];
                try {
                  const audio = new Audio(activeSound.url);
                  audio.volume = 0.4;
                  audio.play();
                } catch (err) {
                  console.warn("Audio test blocked:", err);
                }
              }}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-stone-200 transition-colors"
            >
              🔊 Test
            </button>
          </div>
        </div>
      </div>

      {/* Circle Timer dial layout with Natural Tones details */}
      <div className="relative w-64 h-64 mx-auto rounded-full border-4 border-[#5A5A40]/10 flex flex-col items-center justify-center bg-[#FDFBF7] shadow-inner shadow-black/5">
        <span className="text-[10px] uppercase font-black tracking-widest text-[#5A5A40]/70">
          {timerType === 'pomodoro' ? 'Focus Session' : 'Resting Break'}
        </span>
        <span className="text-6xl font-black font-mono text-stone-800 tracking-tighter mt-1">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <span className="text-[9px] uppercase tracking-wider font-black text-stone-400 mt-2">
          {isActive ? '● Count Down Active' : '⌛ Interrupted'}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleToggle}
          className={`px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer ${isActive ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-brand-sage hover:bg-[#494933] text-white'}`}
        >
          {isActive ? 'Pause Timer' : 'Start Focus'}
        </button>
        <button
          onClick={handleReset}
          className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div className="border-t border-stone-100 pt-6 flex justify-around text-xs font-bold text-stone-500">
        <div>
          <span className="text-lg font-black text-brand-sage block">{completedSessions}</span>
          <span className="text-[10px] uppercase text-stone-400 font-black tracking-wider">Sessions Finished Today</span>
        </div>
        <div>
          <span className="text-lg font-black text-[#8B5E3C] block">{totalFocusedMinutes} Mins</span>
          <span className="text-[10px] uppercase text-stone-400 font-black tracking-wider">Total Focused Minutes</span>
        </div>
      </div>

    </div>
  );
}
