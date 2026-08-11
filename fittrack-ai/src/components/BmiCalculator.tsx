import React, { useState } from "react";
import { UserProfile, BmiEntry } from "../types";
import { db, collection, addDoc } from "../lib/firebase";
import { Scale, Activity, Calculator, History, AlertTriangle, ArrowLeft } from "lucide-react";

interface BmiCalculatorProps {
  profile: UserProfile;
  bmiHistory: BmiEntry[];
  onAddBmiEntry: (entry: BmiEntry) => void;
  onNavigateBack: () => void;
}

export default function BmiCalculator({
  profile,
  bmiHistory,
  onAddBmiEntry,
  onNavigateBack
}: BmiCalculatorProps) {
  const [weight, setWeight] = useState<number>(profile.weight);
  const [height, setHeight] = useState<number>(profile.height);
  const [calculatedBmi, setCalculatedBmi] = useState<number | null>(null);
  const [category, setCategory] = useState<'Underweight' | 'Normal' | 'Overweight' | 'Obese' | null>(null);
  const [recommendation, setRecommendation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const calculateBmi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !height) return;

    setLoading(true);
    const heightInMeters = height / 100;
    const bmiVal = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));

    let cat: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' = "Normal";
    let rec = "";

    if (bmiVal < 18.5) {
      cat = "Underweight";
      rec = "Focus on nutrient-dense foods, healthy fats, and strength training to build lean muscle mass safely.";
    } else if (bmiVal < 25) {
      cat = "Normal";
      rec = "Great job! Maintain your balanced meals, active physical routines, and adequate daily hydration.";
    } else if (bmiVal < 30) {
      cat = "Overweight";
      rec = "Aim for a moderate calorie deficit, regular cardio workouts, and portion control to align back to normal range.";
    } else {
      cat = "Obese";
      rec = "Consult with a health professional. Focus on progressive strength/cardio training and strict whole food dieting.";
    }

    setCalculatedBmi(bmiVal);
    setCategory(cat);
    setRecommendation(rec);

    try {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const timeStr = today.toTimeString().split(" ")[0].substring(0, 5);

      const entry: BmiEntry = {
        id: Math.random().toString(36).substr(2, 9),
        date: dateStr,
        time: timeStr,
        bmi: bmiVal,
        height,
        weight,
        category: cat,
        recommendation: rec,
        timestamp: Date.now()
      };

      // Save to Firebase under user's subcollection if not local guest
      if (profile.uid && !profile.uid.startsWith("local_")) {
        await addDoc(collection(db, `users/${profile.uid}/bmiHistory`), entry);
      }
      onAddBmiEntry(entry);
    } catch (err) {
      console.error("Failed to save BMI calculation history:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Underweight": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Normal": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Overweight": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Obese": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
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
          <h2 className="text-xl font-bold font-display text-white">BMI Calculator</h2>
          <p className="text-xs text-zinc-400">Calculate & log your Body Mass Index (BMI)</p>
        </div>
      </div>

      {/* Main card */}
      <form onSubmit={calculateBmi} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-[#c1ff72] font-bold text-xs uppercase tracking-widest font-display">
          <Calculator className="w-4 h-4" />
          Body Composition Inputs
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
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white text-sm focus:outline-none focus:border-[#c1ff72] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Weight (kg)</label>
            <input
              type="number"
              required
              min="10"
              max="300"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-white text-sm focus:outline-none focus:border-[#c1ff72] transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#c1ff72] text-[#050505] font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 active-press transition-all"
        >
          {loading ? "Saving calculation..." : "Calculate and Save BMI"}
        </button>
      </form>

      {/* Result Card */}
      {calculatedBmi && category && (
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm space-y-4 animate-fade-in">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Your Calculated BMI</span>
            <div className="text-5xl font-extrabold text-white mt-1 font-display">{calculatedBmi}</div>
            <div className={`mt-2 mx-auto px-4 py-1.5 rounded-full border text-sm font-bold w-fit ${getCategoryColor(category)}`}>
              {category}
            </div>
          </div>

          {/* Gauge representation */}
          <div className="relative pt-2">
            <div className="h-3 w-full bg-zinc-800 rounded-full flex overflow-hidden">
              <div className="h-full bg-amber-400" style={{ width: "18.5%" }} />
              <div className="h-full bg-emerald-400" style={{ width: "25%" }} />
              <div className="h-full bg-orange-400" style={{ width: "25%" }} />
              <div className="h-full bg-rose-400" style={{ width: "31.5%" }} />
            </div>
            {/* Indicator pin */}
            <div 
              className="absolute top-0 h-5 w-1 bg-white transition-all duration-500"
              style={{ left: `${Math.min(Math.max((calculatedBmi / 40) * 100, 2), 98)}%` }}
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-medium">
              <span>18.5 (Under)</span>
              <span>25.0 (Normal)</span>
              <span>30.0 (Over)</span>
              <span>Obese</span>
            </div>
          </div>

          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 space-y-1.5">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#c1ff72]" />
              Recommendation
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed font-medium">{recommendation}</p>
          </div>

          {/* Healthy Weight Estimate */}
          <div className="text-center text-[11px] text-zinc-500">
            For a height of {height} cm, a healthy weight range is {" "}
            <span className="font-bold text-zinc-300">
              {Math.round(18.5 * (height/100)*(height/100))} kg - {Math.round(24.9 * (height/100)*(height/100))} kg
            </span>.
          </div>
        </div>
      )}

      {/* History table */}
      <div>
        <h3 className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wider font-display">Calculated BMI History</h3>
        {bmiHistory.length === 0 ? (
          <div className="bg-zinc-900/60 text-zinc-500 text-center py-8 rounded-3xl border border-zinc-800 text-xs">
            No calculations logged yet. Work on your first assessment!
          </div>
        ) : (
          <div className="space-y-3">
            {bmiHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 shadow-xs flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white font-display">{entry.bmi}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getCategoryColor(entry.category)}`}>
                      {entry.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 font-medium">
                    {entry.date} at {entry.time} • {entry.weight} kg • {entry.height} cm
                  </div>
                </div>
                <Scale className="w-5 h-5 text-zinc-600" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
