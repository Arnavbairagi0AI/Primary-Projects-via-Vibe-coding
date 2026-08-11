import React, { useState, useEffect } from "react";
import { UserProfile, WorkoutPlan } from "../types";
import { db, collection, addDoc } from "../lib/firebase";
import { Sparkles, Dumbbell, Clock, Calendar, RefreshCw, Check, ArrowLeft, Share2, Play, Pause, X, Trophy, Flame, Award, RotateCcw } from "lucide-react";
import ShareModal from "./ShareModal";

interface WorkoutPlannerProps {
  profile: UserProfile;
  workoutHistory: WorkoutPlan[];
  onAddWorkoutPlan: (plan: WorkoutPlan) => void;
  onNavigateBack: () => void;
}

function parseToBullets(text: string): string[] {
  if (!text) return [];
  
  let rawItems: string[] = [];
  if (text.includes('\n')) {
    rawItems = text.split('\n');
  } else {
    // Split by period, semicolon, or comma
    if (text.split(/[.;,]/).length > 1) {
      rawItems = text.split(/[.;,]/);
    } else {
      rawItems = [text];
    }
  }

  return rawItems
    .map(item => {
      let cleaned = item.trim();
      // Remove leading dash, bullet, asterisk, numbers with dots e.g. "1. ", "- "
      cleaned = cleaned.replace(/^[-*•\d+\.\s]+/, "");
      // Remove leading "and " or "or "
      cleaned = cleaned.replace(/^(and|or)\s+/i, "");
      // Trim trailing spaces and periods/commas
      cleaned = cleaned.replace(/[.,;]+$/, "").trim();
      
      if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
      return cleaned;
    })
    .filter(item => item.length > 1);
}

export default function WorkoutPlanner({
  profile,
  workoutHistory,
  onAddWorkoutPlan,
  onNavigateBack
}: WorkoutPlannerProps) {
  const [workoutType, setWorkoutType] = useState<string>("Home Workout");
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>("Beginner");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(
    workoutHistory.length > 0 ? workoutHistory[0] : null
  );
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Daily Achievement Tracker states
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  
  // Timer States
  const [activeTimerKey, setActiveTimerKey] = useState<string | null>(null);
  const [activeTimerLabel, setActiveTimerLabel] = useState<string>("");
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerTotal, setTimerTotal] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Audio feedback on completion
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.log("Audio not allowed in iframe environment");
    }
  };

  // Timer Countdown Effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Reset tracking states when active plan shifts
  useEffect(() => {
    setCompletedTasks({});
    setCompletedSets({});
    setTimerRunning(false);
    setTimerSeconds(0);
    setActiveTimerKey(null);
    setActiveTimerLabel("");
  }, [currentPlan?.id]);

  const startTimer = (key: string, label: string, secs: number) => {
    setActiveTimerKey(key);
    setActiveTimerLabel(label);
    setTimerSeconds(secs);
    setTimerTotal(secs);
    setTimerRunning(true);
  };

  const getShareOptions = () => {
    if (!currentPlan) return [];
    return [
      {
        id: "summary",
        label: "Workout Summary",
        content: `💪 AI Workout Routine: ${currentPlan.workoutType}\n• Level: ${currentPlan.level}\n• Estimated Duration: ${currentPlan.duration}`
      },
      {
        id: "routine",
        label: "Core Exercise Sets",
        content: `🏋️ Core Exercises:\n${currentPlan.exercises}`
      },
      {
        id: "warmup_cooldown",
        label: "Warm-up & Recovery Details",
        content: `🔥 Warm-up Routine:\n${currentPlan.warmup}\n\n❄️ Cooldown & Stretching:\n${currentPlan.cooldown}\n${currentPlan.stretching}`
      }
    ];
  };

  const generateWorkoutPlan = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          workoutType,
          level
        })
      });

      if (!res.ok) {
        throw new Error("Failed to contact Gemini API. Please retry.");
      }

      const rawData = await res.json();
      if (rawData.error) {
        throw new Error(rawData.error);
      }

      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const timeStr = today.toTimeString().split(" ")[0].substring(0, 5);

      const newPlan: WorkoutPlan = {
        id: Math.random().toString(36).substr(2, 9),
        date: dateStr,
        time: timeStr,
        goal: profile.fitnessGoal,
        level,
        workoutType,
        exercises: rawData.exercises || "1. Squats: 3 sets of 15 reps\n2. Pushups: 3 sets of 10 reps",
        warmup: rawData.warmup || "5-minute dynamic stretches, light jogging",
        cooldown: rawData.cooldown || "5-minute slow walking, slow movements",
        stretching: rawData.stretching || "Quadriceps stretch, hamstring stretch, child's pose",
        duration: rawData.duration || "30 mins",
        timestamp: Date.now()
      };

      // Save to Firebase
      // Save to Firebase if not local guest
      if (profile.uid && !profile.uid.startsWith("local_")) {
        await addDoc(collection(db, `users/${profile.uid}/workoutPlans`), newPlan);
      }
      onAddWorkoutPlan(newPlan);
      setCurrentPlan(newPlan);
    } catch (err: any) {
      console.error("Error generating workout plan:", err);
      setError(err.message || "An unexpected error occurred while generating workout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Back button header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onNavigateBack}
          className="p-2 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-300 active-press"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-display text-white">AI Workout Planner</h2>
          <p className="text-xs text-zinc-400">Personalized sets, reps, and routines generated by Gemini</p>
        </div>
      </div>

      {/* Configuration Inputs Card */}
      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#c1ff72] font-bold text-xs uppercase tracking-widest font-display">
            <Sparkles className="w-4 h-4 animate-bounce" />
            Routining Setup
          </div>
          <span className="text-[10px] bg-[#c1ff72]/10 border border-[#c1ff72]/20 px-2.5 py-0.5 rounded-full font-bold text-[#c1ff72]">
            Goal: {profile.fitnessGoal}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Workout Type</label>
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            >
              <option value="Home Workout">Home Workout</option>
              <option value="Gym Workout">Gym Workout</option>
              <option value="Yoga Routine">Yoga Routine</option>
              <option value="Cardio Focus">Cardio Focus</option>
              <option value="Strength Focus">Strength Focus</option>
              <option value="Fat Loss Plan">Fat Loss Plan</option>
              <option value="Muscle Gain Plan">Muscle Gain Plan</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 mb-1">Difficulty Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-xl text-center">
            {error}
          </div>
        )}

        <button
          onClick={generateWorkoutPlan}
          disabled={loading}
          className="w-full bg-[#c1ff72] text-[#050505] font-black py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 active-press transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Sourcing routine sets...
            </>
          ) : (
            <>
              <Dumbbell className="w-5 h-5" />
              {currentPlan ? "Regenerate Workout Routine" : "Generate Custom Routine"}
            </>
          )}
        </button>
      </div>

      {/* Generated Routine Cards */}
      {currentPlan && (() => {
        // Parse workout segments
        const warmupBullets = parseToBullets(currentPlan.warmup);
        const exerciseBullets = parseToBullets(currentPlan.exercises);
        const cooldownBullets = parseToBullets(currentPlan.cooldown);
        const stretchingBullets = parseToBullets(currentPlan.stretching);

        // Core Sets Parsing to obtain target sets
        const exercisesParsed = exerciseBullets.map((bullet, index) => {
          let sets = 3; // Default sets
          const setsMatch = bullet.match(/\b(\d+)\s*(sets|x)\b/i) || bullet.match(/\b(sets|x)\s*(\d+)\b/i);
          if (setsMatch) {
            sets = parseInt(setsMatch[1] || setsMatch[2]);
          }
          return { id: `ex_${index}`, text: bullet, sets };
        });

        // Calculate metrics
        let totalCount = warmupBullets.length + cooldownBullets.length + stretchingBullets.length;
        exercisesParsed.forEach(ex => {
          totalCount += ex.sets; // 1 task per set
        });

        let completedCount = 0;
        
        warmupBullets.forEach((_, idx) => {
          if (completedTasks[`warmup_${idx}`]) completedCount++;
        });
        
        exercisesParsed.forEach((ex) => {
          for (let s = 1; s <= ex.sets; s++) {
            if (completedSets[`${ex.id}_set_${s}`]) completedCount++;
          }
        });

        cooldownBullets.forEach((_, idx) => {
          if (completedTasks[`cooldown_${idx}`]) completedCount++;
        });

        stretchingBullets.forEach((_, idx) => {
          if (completedTasks[`stretching_${idx}`]) completedCount++;
        });

        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        const toggleAllSets = (exId: string, sets: number, allDone: boolean) => {
          const updatedSets = { ...completedSets };
          for (let s = 1; s <= sets; s++) {
            updatedSets[`${exId}_set_${s}`] = allDone;
          }
          setCompletedSets(updatedSets);
        };

        const toggleSet = (exId: string, setNum: number) => {
          const key = `${exId}_set_${setNum}`;
          setCompletedSets(prev => ({
            ...prev,
            [key]: !prev[key]
          }));
        };

        return (
          <div className="space-y-4 animate-fade-in relative">
            
            {/* Sticky Floating Countdown Active Timer Widget */}
            {activeTimerKey && timerSeconds > 0 && (
              <div className="sticky top-4 z-50 bg-zinc-950/95 backdrop-blur-md p-4 rounded-3xl border-2 border-[#c1ff72] shadow-xl flex items-center justify-between gap-4 animate-slide-in">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex items-center justify-center w-11 h-11 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="22" cy="22" r="18" className="stroke-zinc-800" strokeWidth="3.5" fill="transparent" />
                      <circle 
                        cx="22" 
                        cy="22" 
                        r="18" 
                        className="stroke-[#c1ff72] transition-all duration-300" 
                        strokeWidth="3.5" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 * (1 - timerSeconds / timerTotal)}
                      />
                    </svg>
                    <span className="absolute text-[10px] font-black text-[#c1ff72] font-mono">
                      {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-black text-[#c1ff72] uppercase tracking-widest flex items-center gap-1">
                      <Flame className="w-3 h-3 animate-pulse" /> Ticking Timer
                    </div>
                    <div className="text-[11px] text-zinc-100 font-bold truncate">
                      {activeTimerLabel}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={() => setTimerSeconds(prev => prev + 15)}
                    className="px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[9px] font-black text-zinc-300 hover:text-white"
                  >
                    +15s
                  </button>
                  <button 
                    onClick={() => setTimerRunning(!timerRunning)}
                    className={`p-2 rounded-xl text-zinc-950 font-bold transition-all ${timerRunning ? "bg-amber-400" : "bg-[#c1ff72]"}`}
                  >
                    {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                  <button 
                    onClick={() => {
                      setTimerSeconds(0);
                      setTimerRunning(false);
                      setActiveTimerKey(null);
                    }}
                    className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Output header specs */}
            <div className="bg-zinc-950 text-white p-5 rounded-3xl border border-zinc-850 space-y-3.5 shadow-md">
              <div className="flex justify-between items-center text-xs font-bold text-[#c1ff72] uppercase tracking-widest">
                <span>{currentPlan.workoutType} ({currentPlan.level})</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsShareOpen(true)}
                    className="flex items-center gap-1.5 py-1 px-2.5 bg-[#c1ff72]/10 hover:bg-[#c1ff72]/20 border border-[#c1ff72]/20 rounded-xl text-[10px] font-bold text-[#c1ff72] transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share Workout
                  </button>
                  <span className="text-zinc-500 text-[10px]">{currentPlan.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-3xl font-black text-[#c1ff72] font-display">Workout Plan</div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold">
                <Clock className="w-4 h-4 text-[#c1ff72]" />
                Estimated Duration: {currentPlan.duration}
              </div>
            </div>

            {/* Master Daily Achievement & Progress Board */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 rounded-3xl border border-zinc-800 shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-xs font-black font-display text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" /> Daily Achievement Tracker
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium">Tick off your workout steps & sets to achieve today's workout goals!</p>
                </div>
                {progressPercent === 100 && (
                  <span className="text-[8px] font-black tracking-widest uppercase bg-[#c1ff72] text-[#050505] px-2.5 py-1 rounded-sm animate-bounce flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> 100% DONE!
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-black font-mono">
                  <span className="text-zinc-400 uppercase tracking-widest">Workout Progress Score</span>
                  <span className="text-[#c1ff72]">{completedCount} / {totalCount} Steps ({progressPercent}%)</span>
                </div>
                <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-[#c1ff72] rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Workout Routine Checklist Phases */}
            <div className="space-y-4">
              
              {/* Phase 1: Warm-up */}
              <div className="p-5 rounded-3xl shadow-sm bg-zinc-900 border border-zinc-850 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/10">
                    🔥 Warm-up
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 font-display">Prep & Mobilize</span>
                </div>

                {warmupBullets.length > 0 ? (
                  <div className="space-y-3">
                    {warmupBullets.map((bullet, bIdx) => {
                      const taskKey = `warmup_${bIdx}`;
                      const isDone = completedTasks[taskKey];
                      const isTimerActive = activeTimerKey === taskKey;
                      return (
                        <div 
                          key={bIdx} 
                          className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isTimerActive 
                              ? "bg-amber-500/5 border-amber-500/30" 
                              : isDone 
                                ? "bg-zinc-950/30 border-zinc-900 opacity-65" 
                                : "bg-zinc-950/40 border-zinc-850/50 hover:border-zinc-800"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <button
                              onClick={() => setCompletedTasks(prev => ({ ...prev, [taskKey]: !prev[taskKey] }))}
                              className={`w-4 h-4 rounded-md border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                                isDone 
                                  ? "bg-amber-500 border-amber-500 text-zinc-950" 
                                  : "border-zinc-700 hover:border-zinc-500"
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <span className={`text-[11px] font-medium leading-relaxed ${isDone ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                              {bullet}
                            </span>
                          </div>

                          {/* Quick timer options */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            <span className="text-[9px] font-bold text-zinc-500 mr-1">⏱️ Timer:</span>
                            <button
                              onClick={() => startTimer(taskKey, `Warmup: ${bullet}`, 30)}
                              className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors ${
                                isTimerActive && timerTotal === 30
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                  : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              30s
                            </button>
                            <button
                              onClick={() => startTimer(taskKey, `Warmup: ${bullet}`, 60)}
                              className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors ${
                                isTimerActive && timerTotal === 60
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                  : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              1m
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400 italic">No dynamic warmup provided.</p>
                )}
              </div>

              {/* Phase 2: Core Sets (Highly interactive sets tracker requested) */}
              <div className="p-5 rounded-3xl shadow-sm bg-zinc-900 border border-zinc-850 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#c1ff72]/10 text-[#c1ff72] border border-[#c1ff72]/20">
                    🏋️ Core Sets
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 font-display">Work Sets & Reps</span>
                </div>

                {exercisesParsed.length > 0 ? (
                  <div className="space-y-4">
                    {exercisesParsed.map((ex, exIdx) => {
                      // Check if all sets for this exercise are completed
                      let allSetsCompleted = true;
                      for (let s = 1; s <= ex.sets; s++) {
                        if (!completedSets[`${ex.id}_set_${s}`]) {
                          allSetsCompleted = false;
                        }
                      }

                      return (
                        <div 
                          key={exIdx} 
                          className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                            allSetsCompleted 
                              ? "bg-zinc-950/30 border-zinc-900 opacity-70" 
                              : "bg-zinc-950/40 border-zinc-850/50 hover:border-zinc-800"
                          }`}
                        >
                          {/* Exercise Title and overall toggle */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <button
                                onClick={() => toggleAllSets(ex.id, ex.sets, !allSetsCompleted)}
                                className={`w-4.5 h-4.5 rounded-md border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                                  allSetsCompleted 
                                    ? "bg-[#c1ff72] border-[#c1ff72] text-[#050505]" 
                                    : "border-zinc-700 hover:border-zinc-500"
                                }`}
                              >
                                {allSetsCompleted && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                              </button>
                              <div className="space-y-0.5">
                                <h4 className={`text-xs font-black tracking-wide ${allSetsCompleted ? "line-through text-zinc-500 font-bold" : "text-white"}`}>
                                  {ex.text.split(":")[0]}
                                </h4>
                                <p className="text-[10px] text-zinc-400 font-medium">
                                  {ex.text.split(":").slice(1).join(":") || "Calibrated core target"}
                                </p>
                              </div>
                            </div>
                            
                            <span className="text-[9px] font-black font-mono px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400">
                              {ex.sets} Sets Target
                            </span>
                          </div>

                          {/* Sets checkboxy daily achievement bullets */}
                          <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850/50 space-y-2">
                            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                              Track Sets Completion:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {Array.from({ length: ex.sets }).map((_, sIdx) => {
                                const sNum = sIdx + 1;
                                const setKey = `${ex.id}_set_${sNum}`;
                                const isSetDone = completedSets[setKey];
                                return (
                                  <button
                                    key={sIdx}
                                    onClick={() => toggleSet(ex.id, sNum)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1.5 active-press ${
                                      isSetDone
                                        ? "bg-[#c1ff72]/10 text-[#c1ff72] border border-[#c1ff72]/30"
                                        : "bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-zinc-200"
                                    }`}
                                  >
                                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                                      isSetDone ? "bg-[#c1ff72] border-[#c1ff72]" : "border-zinc-700"
                                    }`}>
                                      {isSetDone && <Check className="w-2.5 h-2.5 text-[#050505] stroke-[4]" />}
                                    </span>
                                    Set {sNum}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Post-set rest timer options */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider mr-1">⏱️ Post-Set Rest Timer:</span>
                            <button
                              onClick={() => startTimer(`${ex.id}_rest_45`, `Resting after ${ex.text.split(":")[0]}`, 45)}
                              className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#c1ff72] rounded-lg text-[9px] font-bold flex items-center gap-1 transition-colors"
                            >
                              ⏱️ 45s Rest
                            </button>
                            <button
                              onClick={() => startTimer(`${ex.id}_rest_90`, `Resting after ${ex.text.split(":")[0]}`, 90)}
                              className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#c1ff72] rounded-lg text-[9px] font-bold flex items-center gap-1 transition-colors"
                            >
                              ⏱️ 90s Rest
                            </button>
                            <button
                              onClick={() => startTimer(`${ex.id}_rest_120`, `Resting after ${ex.text.split(":")[0]}`, 120)}
                              className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-[#c1ff72] rounded-lg text-[9px] font-bold flex items-center gap-1 transition-colors"
                            >
                              ⏱️ 2m Rest
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400 italic">No structured core exercises parsed.</p>
                )}
              </div>

              {/* Phase 3: Cooldown */}
              <div className="p-5 rounded-3xl shadow-sm bg-zinc-900 border border-zinc-850 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/10">
                    ❄️ Cooldown
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 font-display">Heart Rate Recovery</span>
                </div>

                {cooldownBullets.length > 0 ? (
                  <div className="space-y-3">
                    {cooldownBullets.map((bullet, bIdx) => {
                      const taskKey = `cooldown_${bIdx}`;
                      const isDone = completedTasks[taskKey];
                      const isTimerActive = activeTimerKey === taskKey;
                      return (
                        <div 
                          key={bIdx} 
                          className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isTimerActive 
                              ? "bg-teal-500/5 border-teal-500/30" 
                              : isDone 
                                ? "bg-zinc-950/30 border-zinc-900 opacity-65" 
                                : "bg-zinc-950/40 border-zinc-850/50 hover:border-zinc-800"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <button
                              onClick={() => setCompletedTasks(prev => ({ ...prev, [taskKey]: !prev[taskKey] }))}
                              className={`w-4 h-4 rounded-md border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                                isDone 
                                  ? "bg-teal-500 border-teal-500 text-zinc-950" 
                                  : "border-zinc-700 hover:border-zinc-500"
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <span className={`text-[11px] font-medium leading-relaxed ${isDone ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                              {bullet}
                            </span>
                          </div>

                          {/* Quick timer options */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            <span className="text-[9px] font-bold text-zinc-500 mr-1">⏱️ Timer:</span>
                            <button
                              onClick={() => startTimer(taskKey, `Cooldown: ${bullet}`, 60)}
                              className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors ${
                                isTimerActive && timerTotal === 60
                                  ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                                  : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              1m
                            </button>
                            <button
                              onClick={() => startTimer(taskKey, `Cooldown: ${bullet}`, 120)}
                              className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors ${
                                isTimerActive && timerTotal === 120
                                  ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                                  : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              2m
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400 italic">No cooldown recommendations provided.</p>
                )}
              </div>

              {/* Phase 4: Stretching */}
              <div className="p-5 rounded-3xl shadow-sm bg-zinc-900 border border-zinc-850 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/10">
                    🧘 Stretching
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 font-display">Flexibility & Joint Ease</span>
                </div>

                {stretchingBullets.length > 0 ? (
                  <div className="space-y-3">
                    {stretchingBullets.map((bullet, bIdx) => {
                      const taskKey = `stretching_${bIdx}`;
                      const isDone = completedTasks[taskKey];
                      const isTimerActive = activeTimerKey === taskKey;
                      return (
                        <div 
                          key={bIdx} 
                          className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isTimerActive 
                              ? "bg-purple-500/5 border-purple-500/30" 
                              : isDone 
                                ? "bg-zinc-950/30 border-zinc-900 opacity-65" 
                                : "bg-zinc-950/40 border-zinc-850/50 hover:border-zinc-800"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <button
                              onClick={() => setCompletedTasks(prev => ({ ...prev, [taskKey]: !prev[taskKey] }))}
                              className={`w-4 h-4 rounded-md border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                                isDone 
                                  ? "bg-purple-500 border-purple-500 text-zinc-950" 
                                  : "border-zinc-700 hover:border-zinc-500"
                              }`}
                            >
                              {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <span className={`text-[11px] font-medium leading-relaxed ${isDone ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                              {bullet}
                            </span>
                          </div>

                          {/* Quick timer options */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                            <span className="text-[9px] font-bold text-zinc-500 mr-1">⏱️ Timer:</span>
                            <button
                              onClick={() => startTimer(taskKey, `Stretching: ${bullet}`, 30)}
                              className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors ${
                                isTimerActive && timerTotal === 30
                                  ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                                  : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              30s
                            </button>
                            <button
                              onClick={() => startTimer(taskKey, `Stretching: ${bullet}`, 60)}
                              className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors ${
                                isTimerActive && timerTotal === 60
                                  ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                                  : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              1m
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400 italic">No stretches recommended.</p>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* History */}
      {workoutHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wider font-display">Previous Workout Routine Logs</h3>
          <div className="space-y-3">
            {workoutHistory.slice(0, 5).map((plan) => (
              <div 
                key={plan.id} 
                onClick={() => setCurrentPlan(plan)}
                className={`p-4 rounded-2xl border cursor-pointer flex justify-between items-center transition-all ${
                  currentPlan?.id === plan.id
                    ? "bg-zinc-900 border-[#c1ff72]/50 shadow-xs"
                    : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">{plan.workoutType} ({plan.level})</div>
                  <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Generated on {plan.date} at {plan.time}
                  </div>
                </div>
                {currentPlan?.id === plan.id && <Check className="w-4 h-4 text-[#c1ff72] font-bold" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {currentPlan && (
        <ShareModal 
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          title={`My Workout Plan (${currentPlan.workoutType})`}
          options={getShareOptions()}
          defaultSelectedIds={["summary", "routine"]}
        />
      )}
    </div>
  );
}
