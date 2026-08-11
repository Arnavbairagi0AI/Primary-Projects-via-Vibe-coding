import React, { useState } from "react";
import { UserProfile, WaterEntry } from "../types";
import { db, collection, addDoc } from "../lib/firebase";
import { Droplet, Bell, BellOff, Calendar, Coffee, Plus, ArrowLeft, RotateCcw, Trash2 } from "lucide-react";

interface WaterTrackerProps {
  profile: UserProfile;
  waterHistory: WaterEntry[];
  onAddWaterEntry: (entry: WaterEntry) => void;
  onNavigateBack: () => void;
  onResetNormalHistory?: (mode: 'today' | 'all') => Promise<void>;
  onDeleteWaterEntry?: (id: string) => void;
}

export default function WaterTracker({
  profile,
  waterHistory,
  onAddWaterEntry,
  onNavigateBack,
  onResetNormalHistory,
  onDeleteWaterEntry
}: WaterTrackerProps) {
  const [customAmount, setCustomAmount] = useState<number>(250);
  const [reminders, setReminders] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [loggedAnim, setLoggedAnim] = useState<boolean>(false);

  // Filter today's logged water entries
  const todayStr = new Date().toISOString().split("T")[0];
  const todayWaterEntries = waterHistory.filter(w => w.date === todayStr);
  const totalWater = todayWaterEntries.reduce((acc, w) => acc + w.amount, 0);

  const handleLogWater = async (amount: number) => {
    if (amount <= 0) return;
    setLoading(true);

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const timeStr = today.toTimeString().split(" ")[0].substring(0, 5);

    const entry: WaterEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: dateStr,
      time: timeStr,
      amount,
      timestamp: Date.now()
    };

    try {
      if (profile.uid && !profile.uid.startsWith("local_")) {
        await addDoc(collection(db, `users/${profile.uid}/waterHistory`), entry);
      }
      onAddWaterEntry(entry);
      
      // Trigger simple pop animation
      setLoggedAnim(true);
      setTimeout(() => setLoggedAnim(false), 800);
    } catch (err) {
      console.error("Failed to log water intake:", err);
    } finally {
      setLoading(false);
    }
  };

  // SVG circular progress constants
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min((totalWater / profile.dailyWaterGoal) * 100, 100);
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="space-y-6 pb-20">
      {/* Back button header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onNavigateBack}
            className="p-2 bg-zinc-900 rounded-full border border-zinc-800 text-zinc-300 active-press"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold font-display text-white">Water Intake Tracker</h2>
            <p className="text-xs text-zinc-400">Track and meet your customized daily hydration goal</p>
          </div>
        </div>
        
        {onResetNormalHistory && (
          <button
            onClick={async () => {
              if (window.confirm("Are you sure you want to reset today's logged water intake back to 0?")) {
                await onResetNormalHistory('today');
              }
            }}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/20 active-press transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Today
          </button>
        )}
      </div>

      {/* Main progress ring card */}
      <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          {/* Progress Circle SVG */}
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-zinc-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Colored progress line */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={`stroke-sky-400 transition-all duration-700 ease-out`}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Centered label */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <Droplet className={`w-8 h-8 text-sky-400 mb-1 transition-transform duration-300 ${loggedAnim ? "scale-150 animate-bounce" : ""}`} />
            <span className="text-3xl font-black text-white font-display">{totalWater}</span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">/ {profile.dailyWaterGoal} ml</span>
            <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full mt-2 border border-sky-500/20">
              {percent.toFixed(0)}% met
            </span>
          </div>
        </div>

        {/* Reminders Toggle */}
        <div className="flex justify-between items-center w-full px-2 border-t border-zinc-800 pt-3">
          <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            {reminders ? <Bell className="w-3.5 h-3.5 text-[#c1ff72]" /> : <BellOff className="w-3.5 h-3.5 text-zinc-500" />}
            Hourly Water Reminders
          </span>
          <button
            onClick={() => setReminders(!reminders)}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${reminders ? "bg-[#c1ff72]" : "bg-zinc-800"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform ${reminders ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Logging choices */}
      <div>
        <h3 className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wider font-display">Log Water Volume</h3>
        <div className="grid grid-cols-4 gap-2.5">
          {[250, 500, 750, 1000].map((amount) => (
            <button
              key={amount}
              disabled={loading}
              onClick={() => handleLogWater(amount)}
              className="py-3 px-1.5 bg-zinc-900 border border-zinc-850 hover:border-sky-500/30 rounded-2xl shadow-xs flex flex-col items-center justify-center gap-1 active-press transition-colors"
            >
              <span className="text-xs font-black text-white font-display">
                {amount >= 1000 ? `${amount / 1000} L` : `${amount} ml`}
              </span>
              <div className="p-1.5 bg-zinc-950 text-sky-400 rounded-lg">
                <Coffee className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Logger */}
      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-sm flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">Custom Hydration Amount</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="50"
              min="50"
              max="5000"
              value={customAmount}
              onChange={(e) => setCustomAmount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-sky-400"
            />
            <span className="text-xs font-bold text-zinc-500 self-center">ml</span>
          </div>
        </div>
        <button
          onClick={() => handleLogWater(customAmount)}
          disabled={loading}
          className="bg-sky-500 text-zinc-950 font-bold p-3.5 rounded-2xl shadow-md active-press flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Water History for today */}
      <div>
        <h3 className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wider font-display">Today's Hydration Logs</h3>
        {todayWaterEntries.length === 0 ? (
          <div className="bg-zinc-900/60 text-zinc-500 text-center py-8 rounded-3xl border border-zinc-800 text-xs">
            No water logged yet today. Hydrate and track your progress above!
          </div>
        ) : (
          <div className="space-y-3">
            {todayWaterEntries.map((entry) => (
              <div key={entry.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 shadow-xs flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-950 text-sky-400 rounded-xl">
                    <Droplet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Water Intake</h4>
                    <span className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-0.5"><Calendar className="w-3 h-3" /> logged at {entry.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-black text-white font-display">{entry.amount} ml</div>
                  {onDeleteWaterEntry && (
                    <button
                      onClick={() => onDeleteWaterEntry(entry.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg active-press transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
