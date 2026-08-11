import React, { useState } from "react";
import { UserProfile, CalorieCalculation } from "../types";
import { db, collection, addDoc } from "../lib/firebase";
import { Flame, Calculator, Sparkles, ArrowLeft } from "lucide-react";

interface CalorieCalculatorProps {
  profile: UserProfile;
  calorieHistory: CalorieCalculation[];
  onAddCalorieCalculation: (entry: CalorieCalculation) => void;
  onNavigateBack: () => void;
}

export default function CalorieCalculator({
  profile,
  calorieHistory,
  onAddCalorieCalculation,
  onNavigateBack
}: CalorieCalculatorProps) {
  const [age, setAge] = useState<number>(profile.age);
  const [gender, setGender] = useState<string>(profile.gender);
  const [height, setHeight] = useState<number>(profile.height);
  const [weight, setWeight] = useState<number>(profile.weight);
  const [activityLevel, setActivityLevel] = useState<string>(profile.activityLevel);
  const [goal, setGoal] = useState<string>(profile.fitnessGoal);
  
  const [calculated, setCalculated] = useState<CalorieCalculation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const calculateCalories = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isMale = gender === "Male";
    // Base BMR estimate
    const bmr = 10 * weight + 6.25 * height - 5 * age + (isMale ? 5 : -161);

    // Activity level multipliers
    const mults: { [key: string]: number } = {
      Sedentary: 1.2,
      "Lightly Active": 1.375,
      "Moderately Active": 1.55,
      "Very Active": 1.725
    };
    const multiplier = mults[activityLevel] || 1.375;
    const maintenance = Math.round(bmr * multiplier);

    const weightLoss = Math.round(maintenance - 500);
    const weightGain = Math.round(maintenance + 350);

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const timeStr = today.toTimeString().split(" ")[0].substring(0, 5);

    const result: CalorieCalculation = {
      id: Math.random().toString(36).substr(2, 9),
      date: dateStr,
      time: timeStr,
      maintenance,
      weightLoss,
      weightGain,
      age,
      gender,
      weight,
      height,
      activityLevel,
      goal,
      timestamp: Date.now()
    };

    setCalculated(result);

    try {
      if (profile.uid && !profile.uid.startsWith("local_")) {
        await addDoc(collection(db, `users/${profile.uid}/calorieHistory`), result);
      }
      onAddCalorieCalculation(result);
    } catch (err) {
      console.error("Failed to save calorie targets:", err);
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
          <h2 className="text-xl font-bold font-display text-white">Calorie Calculator</h2>
          <p className="text-xs text-zinc-400">Determine maintenance and target calorie deficits or surpluses</p>
        </div>
      </div>

      <form onSubmit={calculateCalories} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-[#c1ff72] font-bold text-xs uppercase tracking-widest font-display">
          <Flame className="w-4 h-4 animate-pulse" />
          Calorie Estimator Inputs
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Age (Years)</label>
            <input
              type="number"
              required
              min="1"
              max="120"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white text-sm focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white text-sm focus:outline-none focus:border-[#c1ff72]"
            >
              <option value="Male" className="bg-zinc-900">Male</option>
              <option value="Female" className="bg-zinc-900">Female</option>
              <option value="Other" className="bg-zinc-900">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Height (cm)</label>
            <input
              type="number"
              required
              min="50"
              max="250"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white text-sm focus:outline-none focus:border-[#c1ff72]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Current Weight (kg)</label>
            <input
              type="number"
              required
              min="10"
              max="300"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white text-sm focus:outline-none focus:border-[#c1ff72]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-1">Activity Level</label>
          <select
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white text-sm focus:outline-none focus:border-[#c1ff72]"
          >
            <option value="Sedentary" className="bg-zinc-900">Sedentary (Little/no exercise)</option>
            <option value="Lightly Active" className="bg-zinc-900">Lightly Active (1-3 days/week)</option>
            <option value="Moderately Active" className="bg-zinc-900">Moderately Active (3-5 days/week)</option>
            <option value="Very Active" className="bg-zinc-900">Very Active (6-7 days/week)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#c1ff72] text-[#050505] font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 active-press transition-all"
        >
          {loading ? "Saving calculation..." : "Estimate Daily Calorie Targets"}
        </button>
      </form>

      {/* Target outputs */}
      {calculated && (
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm space-y-4 animate-fade-in">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Calculated Targets (TDEE)</span>
            <div className="text-4xl font-extrabold text-[#c1ff72] mt-1 font-display">{calculated.maintenance} kcal</div>
            <div className="text-xs text-zinc-400 font-semibold mt-1">Daily Maintenance Energy Requirement</div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Weight Loss Deficit</span>
              <div className="text-2xl font-black text-emerald-300 mt-1 font-display">{calculated.weightLoss} kcal</div>
              <p className="text-[9px] text-emerald-500/80 mt-1">Recommended for healthy reduction of -0.5kg/week</p>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl text-center">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Weight Gain Surplus</span>
              <div className="text-2xl font-black text-indigo-300 mt-1 font-display">{calculated.weightGain} kcal</div>
              <p className="text-[9px] text-indigo-500/80 mt-1">Recommended for lean bulking and muscle gains</p>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 flex gap-3 items-start text-xs text-zinc-400">
            <Sparkles className="w-5 h-5 text-[#c1ff72] shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-white">Coach Calibration:</span> Based on your goal, you should aim for {" "}
              <span className="font-bold text-[#c1ff72]">
                {goal === "Weight Loss" ? calculated.weightLoss : goal === "Muscle Gain" ? calculated.weightGain : calculated.maintenance} kcal
              </span> per day to sustain your target fitness trajectory.
            </div>
          </div>
        </div>
      )}

      {/* History log */}
      <div>
        <h3 className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wider font-display">Calculated Calorie Target History</h3>
        {calorieHistory.length === 0 ? (
          <div className="bg-zinc-900/60 text-zinc-500 text-center py-8 rounded-3xl border border-zinc-800 text-xs">
            No history recorded. Calibrate your first daily target above.
          </div>
        ) : (
          <div className="space-y-3">
            {calorieHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 shadow-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-white">
                    Maintenance: <span className="text-[#c1ff72] font-display font-black">{entry.maintenance} kcal</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">{entry.date}</span>
                </div>
                <div className="flex gap-4 text-[10px] text-zinc-400 mt-1">
                  <span>Deficit: <strong className="text-zinc-200 font-display">{entry.weightLoss} kcal</strong></span>
                  <span>Surplus: <strong className="text-zinc-200 font-display">{entry.weightGain} kcal</strong></span>
                  <span>Weight: <strong className="text-zinc-200">{entry.weight} kg</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
