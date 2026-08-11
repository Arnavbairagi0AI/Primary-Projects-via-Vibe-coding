import React, { useState } from "react";
import { UserProfile, WeightEntry } from "../types";
import { db, collection, addDoc } from "../lib/firebase";
import { Scale, Target, TrendingUp, Sparkles, ArrowLeft, Plus } from "lucide-react";

interface WeightTrackerProps {
  profile: UserProfile;
  weightHistory: WeightEntry[];
  onAddWeightEntry: (entry: WeightEntry) => void;
  onNavigateBack: () => void;
}

export default function WeightTracker({
  profile,
  weightHistory,
  onAddWeightEntry,
  onNavigateBack
}: WeightTrackerProps) {
  const [weight, setWeight] = useState<number>(profile.weight);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Auto-get current weight
  const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : profile.weight;
  
  // Calculate weight progress percentage
  const initialWeight = profile.weight;
  const targetWeight = profile.targetWeight;
  const totalDiff = Math.abs(initialWeight - targetWeight);
  const currentDiff = Math.abs(currentWeight - targetWeight);
  const weightProgress = totalDiff === 0 ? 100 : Math.min(Math.round(((totalDiff - currentDiff) / totalDiff) * 100), 100);

  // BMI calculations
  const heightInMeters = profile.height / 100;
  const currentBmi = (currentWeight / (heightInMeters * heightInMeters)).toFixed(1);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    setLoading(true);
    setSuccess(false);

    const bmiVal = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const timeStr = today.toTimeString().split(" ")[0].substring(0, 5);

    const entry: WeightEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: dateStr,
      time: timeStr,
      weight,
      goalWeight: targetWeight,
      bmi: bmiVal,
      timestamp: Date.now()
    };

    try {
      if (profile.uid && !profile.uid.startsWith("local_")) {
        await addDoc(collection(db, `users/${profile.uid}/weightHistory`), entry);
      }
      onAddWeightEntry(entry);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to log weight progress:", err);
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
          <h2 className="text-xl font-bold font-display text-white">Weight Tracker</h2>
          <p className="text-xs text-zinc-400">Track current weight changes and meet target fitness goals</p>
        </div>
      </div>

      {/* Target Progress Card */}
      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-500">
          <span>Weight Goal Tracker</span>
          <span className="text-[#c1ff72] bg-[#c1ff72]/10 px-2.5 py-0.5 rounded-full border border-[#c1ff72]/20">
            {weightProgress}% completed
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 text-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Current Weight</span>
            <div className="text-2xl font-black text-white font-display mt-0.5">{currentWeight} kg</div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 text-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
              <Target className="w-3 h-3 text-rose-400" /> Target Goal
            </span>
            <div className="text-2xl font-black text-white font-display mt-0.5">{targetWeight} kg</div>
          </div>
        </div>

        {/* Dynamic progress slide bar */}
        <div className="relative pt-2">
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#c1ff72] h-full rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${weightProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 mt-1.5 font-medium">
            <span>Start: {profile.weight} kg</span>
            <span>Target: {profile.targetWeight} kg</span>
          </div>
        </div>
      </div>

      {/* Log weight Form */}
      <form onSubmit={handleLogWeight} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-sm space-y-3.5">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
          <Scale className="w-4 h-4 text-[#c1ff72]" />
          Log Weight Reading
        </div>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-xl text-center">
            Weight reading successfully tracked!
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              step="0.1"
              required
              min="10"
              max="300"
              placeholder="e.g. 68.5"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white text-sm focus:outline-none focus:border-[#c1ff72] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 bg-[#c1ff72] text-[#050505] font-bold rounded-2xl shadow-md flex items-center justify-center gap-1.5 hover:opacity-90 active-press transition-all"
          >
            <Plus className="w-4 h-4" />
            Track
          </button>
        </div>
      </form>

      {/* Trend Insights */}
      <div className="bg-zinc-950 p-5 rounded-3xl border border-zinc-850 text-white space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#c1ff72] uppercase tracking-widest font-display">
          <TrendingUp className="w-4 h-4 animate-bounce" />
          Weight & BMI Trend
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed font-medium">
          With a weight of {currentWeight} kg, your current BMI is <strong className="text-[#c1ff72]">{currentBmi}</strong>.
          {parseFloat(currentBmi) >= 25 ? " Consistent water logging and strength training will help burn excess weight sustainably." : " You are maintaining a healthy BMI range. Keep prioritizing rich proteins and regular meals."}
        </p>
      </div>

      {/* History Log List */}
      <div>
        <h3 className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wider font-display">Weight Entry Log</h3>
        {weightHistory.length === 0 ? (
          <div className="bg-zinc-900/60 text-zinc-500 text-center py-8 rounded-3xl border border-zinc-800 text-xs">
            No weight entries logged yet. Capture your first reading above!
          </div>
        ) : (
          <div className="space-y-3">
            {weightHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-850 shadow-xs flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-black text-white font-display">{entry.weight} kg</h4>
                  <span className="text-[10px] text-zinc-500 mt-1">Logged on {entry.date} at {entry.time}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-zinc-400">BMI: {entry.bmi}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
