import React, { useState } from "react";
import { UserProfile, DietPlan } from "../types";
import { db, collection, addDoc } from "../lib/firebase";
import { Sparkles, ShoppingBag, DollarSign, Calendar, RefreshCw, RefreshCcw, Check, ArrowLeft, Share2 } from "lucide-react";
import ShareModal from "./ShareModal";

interface DietPlannerProps {
  profile: UserProfile;
  dietHistory: DietPlan[];
  onAddDietPlan: (plan: DietPlan) => void;
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

export default function DietPlanner({
  profile,
  dietHistory,
  onAddDietPlan,
  onNavigateBack
}: DietPlannerProps) {
  const [budgetFriendly, setBudgetFriendly] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentPlan, setCurrentPlan] = useState<DietPlan | null>(
    dietHistory.length > 0 ? dietHistory[0] : null
  );
  const [isShareOpen, setIsShareOpen] = useState(false);

  const getShareOptions = () => {
    if (!currentPlan) return [];
    return [
      {
        id: "macros",
        label: "Calories & Macros",
        content: `🥗 Calibrated Diet Program: ${currentPlan.calories} kcal/day\n• Protein: ${currentPlan.protein}g\n• Carbs: ${currentPlan.carbs}g\n• Fat: ${currentPlan.fat}g`
      },
      {
        id: "meals",
        label: "Meals Breakdown",
        content: `🍳 Daily Meal Plan:\n• Breakfast: ${currentPlan.meals?.breakfast}\n• Lunch: ${currentPlan.meals?.lunch}\n• Snacks: ${currentPlan.meals?.snacks}\n• Dinner: ${currentPlan.meals?.dinner}`
      },
      {
        id: "shoppingList",
        label: "Grocery Shopping List",
        content: `🛒 AI Grocery Shopping List:\n${currentPlan.shoppingList}`
      }
    ];
  };

  const generateDietPlan = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          budgetFriendly
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

      const newPlan: DietPlan = {
        id: Math.random().toString(36).substr(2, 9),
        date: dateStr,
        time: timeStr,
        goal: profile.fitnessGoal,
        preference: profile.foodPreference,
        calories: rawData.calories || 2000,
        protein: rawData.protein || 130,
        carbs: rawData.carbs || 220,
        fat: rawData.fat || 65,
        meals: {
          breakfast: rawData.meals?.breakfast || "Healthy oatmeal with berries",
          lunch: rawData.meals?.lunch || "Grilled chicken with broccoli and rice",
          dinner: rawData.meals?.dinner || "Baked salmon with sweet potato",
          snacks: rawData.meals?.snacks || "Greek yogurt with almonds"
        },
        shoppingList: rawData.shoppingList || "Oatmeal, chicken breast, salmon, broccoli, sweet potato, Greek yogurt",
        budgetFriendly,
        optionsText: rawData.budgetFriendlyOptions || "Buy oats in bulk, choose seasonal vegetables.",
        timestamp: Date.now()
      };

      // Save to Firebase if not local guest
      if (profile.uid && !profile.uid.startsWith("local_")) {
        await addDoc(collection(db, `users/${profile.uid}/dietPlans`), newPlan);
      }
      onAddDietPlan(newPlan);
      setCurrentPlan(newPlan);
    } catch (err: any) {
      console.error("Error generating diet plan:", err);
      setError(err.message || "An unexpected error occurred while generating diet.");
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
          <h2 className="text-xl font-bold font-display text-white">AI Diet Planner</h2>
          <p className="text-xs text-zinc-400">Instant meal programs calibrated by Gemini AI</p>
        </div>
      </div>

      {/* Inputs Configuration Card */}
      <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#c1ff72] font-bold text-xs uppercase tracking-widest font-display">
            <Sparkles className="w-4 h-4" />
            AI Calibration
          </div>
          <span className="text-[10px] bg-zinc-850 border border-zinc-800 px-2.5 py-0.5 rounded-full font-bold text-zinc-300">
            {profile.foodPreference} Prefs
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed font-medium">
          Calibrating breakfast, lunch, dinner, and shopping lists tailored directly to your fitness goal: <strong className="text-white">{profile.fitnessGoal}</strong>.
        </p>

        {/* Budget Friendly Option Toggle */}
        <div className="flex justify-between items-center bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850">
          <div>
            <span className="text-xs font-bold text-white flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-[#c1ff72]" />
              Budget Friendly Ingredients
            </span>
            <p className="text-[10px] text-zinc-500 mt-0.5">Focus on easily accessible, affordable wholesome options</p>
          </div>
          <button
            onClick={() => setBudgetFriendly(!budgetFriendly)}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${budgetFriendly ? "bg-[#c1ff72]" : "bg-zinc-800"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform ${budgetFriendly ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-xl text-center">
            {error}
          </div>
        )}

        <button
          onClick={generateDietPlan}
          disabled={loading}
          className="w-full bg-[#c1ff72] text-[#050505] font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 active-press transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Calibrating Ingredients...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {currentPlan ? "Regenerate Diet Plan" : "Generate Custom Diet Plan"}
            </>
          )}
        </button>
      </div>

      {/* Generated Diet Output */}
      {currentPlan && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Specs Card */}
          <div className="bg-zinc-950 text-zinc-100 p-5 rounded-3xl border border-zinc-850 space-y-3 shadow-md">
            <div className="flex justify-between items-center text-xs font-bold text-[#c1ff72] uppercase tracking-widest">
              <span>Macro Target Estimation</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsShareOpen(true)}
                  className="flex items-center gap-1.5 py-1 px-2.5 bg-[#c1ff72]/10 hover:bg-[#c1ff72]/20 border border-[#c1ff72]/20 rounded-xl text-[10px] font-bold text-[#c1ff72] transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share Plan
                </button>
                <span className="text-zinc-500 text-[10px]">{currentPlan.date}</span>
              </div>
            </div>

            <div className="text-3xl font-black text-[#c1ff72] font-display">{currentPlan.calories} kcal/day</div>

            <div className="grid grid-cols-3 gap-3 text-center pt-1">
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[9px] text-zinc-500 font-bold uppercase">Protein</span>
                <div className="text-sm font-black text-emerald-400 font-display">{currentPlan.protein}g</div>
              </div>
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[9px] text-zinc-500 font-bold uppercase">Carbs</span>
                <div className="text-sm font-black text-sky-400 font-display">{currentPlan.carbs}g</div>
              </div>
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[9px] text-zinc-500 font-bold uppercase">Fat</span>
                <div className="text-sm font-black text-orange-400 font-display">{currentPlan.fat}g</div>
              </div>
            </div>
          </div>

          {/* Meals List - Headlines first, then bullet points */}
          <div className="space-y-4">
            {[
              { title: "Breakfast", content: currentPlan.meals?.breakfast, time: "08:00 AM", emoji: "🍳", bg: "bg-zinc-900 border border-zinc-800", textAccent: "text-[#c1ff72]" },
              { title: "Lunch", content: currentPlan.meals?.lunch, time: "01:30 PM", emoji: "🥗", bg: "bg-zinc-900 border border-zinc-800", textAccent: "text-emerald-400" },
              { title: "Snacks", content: currentPlan.meals?.snacks, time: "05:00 PM", emoji: "🍎", bg: "bg-zinc-900 border border-zinc-800", textAccent: "text-amber-400" },
              { title: "Dinner", content: currentPlan.meals?.dinner, time: "08:30 PM", emoji: "🥩", bg: "bg-zinc-900 border border-zinc-800", textAccent: "text-[#c1ff72]" }
            ].map((meal, idx) => {
              const bullets = parseToBullets(meal.content || "");
              return (
                <div key={idx} className={`p-5 rounded-3xl shadow-sm space-y-3 transition-all ${meal.bg}`}>
                  <div className="flex justify-between items-center border-b border-zinc-800/60 pb-2.5">
                    <h4 className="text-xs font-black font-display flex items-center gap-2">
                      <span className="text-sm">{meal.emoji}</span>
                      <span className={meal.textAccent}>{meal.title}</span>
                    </h4>
                    <span className="px-2.5 py-0.5 bg-zinc-950 border border-zinc-850 rounded-full text-[9px] font-mono font-bold text-zinc-400">
                      {meal.time}
                    </span>
                  </div>

                  {bullets.length > 0 ? (
                    <ul className="space-y-2 text-[11px] text-zinc-300 font-medium">
                      {bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2">
                          <span className="text-[#c1ff72] font-black shrink-0">•</span>
                          <span className="leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[11px] text-zinc-400 italic">No recommendations provided.</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Shopping List Card */}
          <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider font-display">
              <ShoppingBag className="w-4 h-4 text-[#c1ff72]" />
              AI Grocery Shopping List
            </h4>
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 text-xs text-zinc-300 leading-relaxed font-medium whitespace-pre-line">
              {currentPlan.shoppingList}
            </div>
          </div>

          {/* Budget tips */}
          {currentPlan.optionsText && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                <DollarSign className="w-4 h-4" />
                Budget & Sourcing Guidelines
              </h4>
              <p className="text-xs text-emerald-300 leading-relaxed font-medium">{currentPlan.optionsText}</p>
            </div>
          )}
        </div>
      )}

      {/* History selection */}
      {dietHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wider font-display">Previous Diet Program Logs</h3>
          <div className="space-y-3">
            {dietHistory.slice(0, 5).map((plan) => (
              <div 
                key={plan.id} 
                onClick={() => setCurrentPlan(plan)}
                className={`p-4 rounded-2xl border cursor-pointer flex justify-between items-center transition-all ${
                  currentPlan?.id === plan.id
                    ? "bg-[#c1ff72]/10 border-[#c1ff72]/30 shadow-sm text-white"
                    : "bg-zinc-900 border-zinc-850 hover:border-zinc-700 text-zinc-300"
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-white">{plan.calories} kcal Diet Program</div>
                  <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" /> Generated {plan.date} at {plan.time}
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
          title={`My Diet Plan (${currentPlan.calories} kcal)`}
          options={getShareOptions()}
          defaultSelectedIds={["macros", "meals"]}
        />
      )}
    </div>
  );
}
