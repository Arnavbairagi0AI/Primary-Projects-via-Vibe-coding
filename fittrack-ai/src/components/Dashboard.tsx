import React, { useState, useEffect } from "react";
import { UserProfile, BmiEntry, WeightEntry, WaterEntry, MealEntry } from "../types";
import { 
  Heart, Flame, Droplet, Dumbbell, Apple, Activity, 
  Scale, Plus, ArrowRight, Sparkles, AlertCircle, Info, MapPin, RotateCcw
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  profile: UserProfile;
  bmiHistory: BmiEntry[];
  weightHistory: WeightEntry[];
  waterHistory: WaterEntry[];
  mealHistory: MealEntry[];
  onNavigate: (tab: string) => void;
  onQuickLogWater: (amount: number) => void;
  todayCalories: number;
  todayWater: number;
  onResetNormalHistory?: (mode: 'today' | 'all') => Promise<void>;
}

export default function Dashboard({
  profile,
  bmiHistory,
  weightHistory,
  waterHistory,
  mealHistory,
  onNavigate,
  onQuickLogWater,
  todayCalories,
  todayWater,
  onResetNormalHistory
}: DashboardProps) {
  const [aiTip, setAiTip] = useState<string>("Keep pushing! Staying hydrated is key to burning fat and maintaining physical energy levels.");
  const [loadingTip, setLoadingTip] = useState<boolean>(false);

  // Auto-calculate current BMI based on latest weight or profile weight
  const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : profile.weight;
  const heightInMeters = profile.height / 100;
  const currentBmi = (currentWeight / (heightInMeters * heightInMeters)).toFixed(1);

  // Get BMI Category
  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-amber-400" };
    if (bmi < 25) return { label: "Normal", color: "text-emerald-400" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange-400" };
    return { label: "Obese", color: "text-rose-400" };
  };

  const bmiCat = getBmiCategory(parseFloat(currentBmi));

  // Fetch AI Tip of the day on mount
  useEffect(() => {
    async function fetchTip() {
      setLoadingTip(true);
      try {
        const res = await fetch("/api/chat-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Provide a quick, punchy, 1-sentence fitness or nutrition tip of the day based on my goal." }],
            profile,
            context: `Current weight: ${currentWeight}kg, Target weight: ${profile.targetWeight}kg, Goal: ${profile.fitnessGoal}`
          })
        });
        const data = await res.json();
        if (data.content) {
          setAiTip(data.content.trim().replace(/^"|"$/g, ""));
        }
      } catch (err) {
        console.warn("Failed to fetch AI Tip of the Day, using fallback tip.", err);
      } finally {
        setLoadingTip(false);
      }
    }
    fetchTip();
  }, [profile, currentWeight]);

  // Daily calorie goal calculation (Mifflin-St Jeor base estimate)
  const getDailyCalorieGoal = () => {
    const isMale = profile.gender === "Male";
    let bmr = 10 * currentWeight + 6.25 * profile.height - 5 * profile.age + (isMale ? 5 : -161);
    
    // Multiply by activity level
    const mults = { Sedentary: 1.2, "Lightly Active": 1.375, "Moderately Active": 1.55, "Very Active": 1.725 };
    const multiplier = mults[profile.activityLevel] || 1.375;
    let tdee = bmr * multiplier;

    if (profile.fitnessGoal === "Weight Loss") tdee -= 500;
    else if (profile.fitnessGoal === "Muscle Gain") tdee += 300;
    
    return Math.round(tdee);
  };

  const calorieGoal = getDailyCalorieGoal();
  const calPercent = Math.min(Math.round((todayCalories / calorieGoal) * 100), 100);
  const waterPercent = Math.min(Math.round((todayWater / profile.dailyWaterGoal) * 100), 100);

  // Weight goal progress
  const initialWeight = profile.weight;
  const targetWeight = profile.targetWeight;
  const totalDiff = Math.abs(initialWeight - targetWeight);
  const currentDiff = Math.abs(currentWeight - targetWeight);
  const weightProgress = totalDiff === 0 ? 100 : Math.min(Math.round(((totalDiff - currentDiff) / totalDiff) * 100), 100);

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome banner */}
      <div className="flex justify-between items-center bg-zinc-900 text-white p-5 rounded-3xl shadow-lg border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight">Hello, {profile.fullName.split(" ")[0]}!</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Let's crush your {profile.fitnessGoal.toLowerCase()} goals today!</p>
        </div>
        <div className="bg-[#c1ff72]/10 border border-[#c1ff72]/30 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-[#c1ff72] font-semibold text-xs">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          Active Session
        </div>
      </div>

      {/* AI Tip of the Day card */}
      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#c1ff72] animate-bounce" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#c1ff72] font-display">AI Coach Tip of the Day</span>
        </div>
        <p className="text-sm text-zinc-200 leading-relaxed font-medium">
          {loadingTip ? "Synthesizing customized tip..." : aiTip}
        </p>
      </div>

      {/* Daily Progress Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-display">Today's Energy Balance</h3>
          {onResetNormalHistory && (
            <button
              onClick={async () => {
                if (window.confirm("Would you like to reset today's logged water & meal calories back to 0?")) {
                  await onResetNormalHistory('today');
                }
              }}
              className="text-[9px] text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 font-bold active-press cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Today's Logs
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Calorie Card */}
          <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-semibold text-zinc-400">Calories Logged</span>
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-white font-display">{todayCalories}</span>
              <span className="text-xs text-zinc-500 ml-1">/ {calorieGoal} kcal</span>
            </div>
            {/* Simple progress bar */}
            <div className="w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-orange-400 to-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${calPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-400 mt-1.5 font-medium">{calPercent}% of daily goal</span>
          </div>

          {/* Water Card */}
          <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-semibold text-zinc-400">Water Logged</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                <Droplet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-white font-display">{todayWater}</span>
              <span className="text-xs text-zinc-500 ml-1">/ {profile.dailyWaterGoal} ml</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-zinc-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-sky-400 to-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${waterPercent}%` }}
              />
            </div>
            {/* Quick hydrate buttons */}
            <div className="flex gap-1.5 mt-2.5">
              <button 
                onClick={() => onQuickLogWater(250)}
                className="flex-1 py-1 bg-zinc-800 active-press hover:bg-zinc-700 text-sky-400 font-bold text-[10px] rounded-lg transition-colors border border-zinc-700"
              >
                +250ml
              </button>
              <button 
                onClick={() => onQuickLogWater(500)}
                className="flex-1 py-1 bg-zinc-800 active-press hover:bg-zinc-700 text-sky-400 font-bold text-[10px] rounded-lg transition-colors border border-zinc-700"
              >
                +500ml
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* BMI Card */}
        <div 
          onClick={() => onNavigate("bmi")}
          className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 shadow-sm hover:border-[#c1ff72]/30 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-zinc-400">Current BMI</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white font-display">{currentBmi}</span>
            <span className={`text-[10px] font-bold ml-1.5 px-2 py-0.5 rounded-full bg-zinc-800 ${bmiCat.color}`}>
              {bmiCat.label}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-3 flex items-center gap-1 font-medium">
            Tap to open BMI calculator <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Weight Tracker Card */}
        <div 
          onClick={() => onNavigate("weight")}
          className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 shadow-sm hover:border-[#c1ff72]/30 transition-colors cursor-pointer flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-zinc-400">Current Weight</span>
            <Scale className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-white font-display">{currentWeight}</span>
            <span className="text-xs text-zinc-500 ml-1">kg</span>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-[#c1ff72] h-full rounded-full" 
                style={{ width: `${weightProgress}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1 font-medium">
            Goal progress: {weightProgress}% <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* AI Planner Quick Launchers */}
      <div>
        <h3 className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-wider font-display">AI Planners</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate("diet")}
            className="p-4 bg-zinc-900 border border-zinc-800 text-left rounded-3xl active-press hover:border-[#c1ff72]/30 transition-all"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit mb-3">
              <Apple className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white font-display">Diet Planner</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">Generate budget-friendly meals with macro details.</p>
          </button>

          <button 
            onClick={() => onNavigate("workout")}
            className="p-4 bg-zinc-900 border border-zinc-800 text-left rounded-3xl active-press hover:border-[#c1ff72]/30 transition-all"
          >
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-2xl w-fit mb-3">
              <Dumbbell className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white font-display">Workout Planner</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5 leading-relaxed">Instant cardio, yoga, gym or strength routines.</p>
          </button>
        </div>
      </div>

      {/* Quick Access Menu Cards */}
      <div>
        <h3 className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-wider font-display">Log & Assess</h3>
        
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm divide-y divide-zinc-800/60 overflow-hidden">
          <div 
            onClick={() => onNavigate("calories")} 
            className="p-4 flex justify-between items-center hover:bg-zinc-800/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Calorie Calculator</h4>
                <p className="text-[10px] text-zinc-400">Calculate maintenance, loss, gain target goals.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500" />
          </div>

          <div 
            onClick={() => onNavigate("food")} 
            className="p-4 flex justify-between items-center hover:bg-zinc-800/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Apple className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Food Logging</h4>
                <p className="text-[10px] text-zinc-400">Search 20+ base items or log custom foods.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500" />
          </div>

          <div 
            onClick={() => onNavigate("water")} 
            className="p-4 flex justify-between items-center hover:bg-zinc-800/80 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                <Droplet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Water Log History</h4>
                <p className="text-[10px] text-zinc-400">Detailed logs, reminders, goals.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-500" />
          </div>

          <div 
            onClick={() => onNavigate("strava")} 
            className="p-4 flex justify-between items-center bg-[#FC5200]/5 hover:bg-[#FC5200]/10 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FC5200]/15 text-[#FC5200] rounded-xl">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  Strava Run Tracker
                  {profile.isPro && (
                    <span className="text-[7px] font-black tracking-widest uppercase bg-[#FC5200] text-white px-1.5 rounded-sm">PRO</span>
                  )}
                </h4>
                <p className="text-[10px] text-zinc-400">Map running area with GPS path, kms & miles toggles, and feeds.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#FC5200]" />
          </div>
        </div>
      </div>
    </div>
  );
}
