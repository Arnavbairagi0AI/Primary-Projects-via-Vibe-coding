import React, { useState } from "react";
import { UserProfile, BmiEntry, CalorieCalculation, MealEntry, WaterEntry, WeightEntry, DietPlan, WorkoutPlan, ChatHistoryEntry } from "../types";
import { db, doc, deleteDoc } from "../lib/firebase";
import { History, Search, Filter, Trash2, Download, RefreshCw, Scale, Droplet, Flame, Bot, BookOpen, Dumbbell, RotateCcw } from "lucide-react";

interface HistoryCentralProps {
  profile: UserProfile;
  bmiHistory: BmiEntry[];
  calorieHistory: CalorieCalculation[];
  mealHistory: MealEntry[];
  waterHistory: WaterEntry[];
  weightHistory: WeightEntry[];
  dietPlans: DietPlan[];
  workoutPlans: WorkoutPlan[];
  chatHistory: ChatHistoryEntry[];
  
  onDeleteBmi: (id: string) => void;
  onDeleteCalorie: (id: string) => void;
  onDeleteMeal: (id: string) => void;
  onDeleteWater: (id: string) => void;
  onDeleteWeight: (id: string) => void;
  onDeleteDiet: (id: string) => void;
  onDeleteWorkout: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onResetNormalHistory?: (mode: 'today' | 'all') => Promise<void>;
}

type LogType = "All" | "BMI" | "Calories" | "Meals" | "Water" | "Weight" | "Diet Plans" | "Workout Plans" | "Chat";

export default function HistoryCentral({
  profile,
  bmiHistory,
  calorieHistory,
  mealHistory,
  waterHistory,
  weightHistory,
  dietPlans,
  workoutPlans,
  chatHistory,
  
  onDeleteBmi,
  onDeleteCalorie,
  onDeleteMeal,
  onDeleteWater,
  onDeleteWeight,
  onDeleteDiet,
  onDeleteWorkout,
  onDeleteChat,
  onResetNormalHistory
}: HistoryCentralProps) {
  const [filterType, setFilterType] = useState<LogType>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loadingId, setLoadingId] = useState<string>("");

  // Handler to delete items from database and trigger prop callbacks
  const handleDeleteItem = async (type: string, id: string, docId?: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this history record?")) return;
    setLoadingId(id);

    try {
      if (profile.uid && !profile.uid.startsWith("local_")) {
        const sub = type === "BMI" ? "bmiHistory"
                  : type === "Calories" ? "calorieHistory"
                  : type === "Meals" ? "mealHistory"
                  : type === "Water" ? "waterHistory"
                  : type === "Weight" ? "weightHistory"
                  : type === "Diet Plans" ? "dietPlans"
                  : type === "Workout Plans" ? "workoutPlans"
                  : "chatHistory";

        const targetDocId = docId || id;
        await deleteDoc(doc(db, `users/${profile.uid}/${sub}`, targetDocId)).catch(err => {
          console.warn("Firestore item delete warning:", err);
        });
      }
    } catch (err) {
      console.warn("Error attempting Firestore deletion, proceeding with local deletion:", err);
    } finally {
      // ALWAYS invoke local state callbacks so item is removed from UI immediately
      if (type === "BMI") onDeleteBmi(id);
      else if (type === "Calories") onDeleteCalorie(id);
      else if (type === "Meals") onDeleteMeal(id);
      else if (type === "Water") onDeleteWater(id);
      else if (type === "Weight") onDeleteWeight(id);
      else if (type === "Diet Plans") onDeleteDiet(id);
      else if (type === "Workout Plans") onDeleteWorkout(id);
      else if (type === "Chat") onDeleteChat(id);

      setLoadingId("");
    }
  };

  // Export full history data as formatted JSON
  const handleExportData = () => {
    const fullData = {
      profile,
      bmiHistory,
      calorieHistory,
      mealHistory,
      waterHistory,
      weightHistory,
      dietPlans,
      workoutPlans,
      chatHistory,
      exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FitTrackAI_History_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Map and assemble everything to a single list
  const allLogs: Array<{
    id: string;
    type: LogType;
    title: string;
    desc: string;
    meta: string;
    date: string;
    time: string;
    timestamp: number;
    icon: any;
    color: string;
  }> = [];

  if (filterType === "All" || filterType === "BMI") {
    bmiHistory.forEach(entry => allLogs.push({
      id: entry.id,
      type: "BMI",
      title: `BMI Calculation: ${entry.bmi}`,
      desc: `Category: ${entry.category}. Recommendation: ${entry.recommendation}`,
      meta: `Height: ${entry.height}cm • Weight: ${entry.weight}kg`,
      date: entry.date,
      time: entry.time,
      timestamp: entry.timestamp,
      icon: Scale,
      color: "text-teal-400 bg-teal-500/10 border border-teal-500/10"
    }));
  }

  if (filterType === "All" || filterType === "Calories") {
    calorieHistory.forEach(entry => allLogs.push({
      id: entry.id,
      type: "Calories",
      title: `Daily Targets: ${entry.maintenance} kcal`,
      desc: `Calibrated targets calculated. Deficit: ${entry.weightLoss} kcal | Surplus: ${entry.weightGain} kcal`,
      meta: `Age: ${entry.age} • Activity: ${entry.activityLevel}`,
      date: entry.date,
      time: entry.time,
      timestamp: entry.timestamp,
      icon: Flame,
      color: "text-orange-400 bg-orange-500/10 border border-orange-500/10"
    }));
  }

  if (filterType === "All" || filterType === "Meals") {
    mealHistory.forEach(entry => allLogs.push({
      id: entry.id,
      type: "Meals",
      title: `Meal: ${entry.name}`,
      desc: `Caloric Value: ${entry.calories} kcal. Macros: Protein ${entry.protein}g | Carbs ${entry.carbs}g | Fats ${entry.fat}g`,
      meta: `Fiber: ${entry.fiber}g • Sugar: ${entry.sugar}g`,
      date: entry.date,
      time: entry.time,
      timestamp: entry.timestamp,
      icon: BookOpen,
      color: "text-amber-400 bg-amber-500/10 border border-amber-500/10"
    }));
  }

  if (filterType === "All" || filterType === "Water") {
    waterHistory.forEach(entry => allLogs.push({
      id: entry.id,
      type: "Water",
      title: `Water Consumed: ${entry.amount} ml`,
      desc: `Hydration logged successfully towards your target goal.`,
      meta: `Amount: ${entry.amount} ml`,
      date: entry.date,
      time: entry.time,
      timestamp: entry.timestamp,
      icon: Droplet,
      color: "text-sky-400 bg-sky-500/10 border border-sky-500/10"
    }));
  }

  if (filterType === "All" || filterType === "Weight") {
    weightHistory.forEach(entry => allLogs.push({
      id: entry.id,
      type: "Weight",
      title: `Logged weight: ${entry.weight} kg`,
      desc: `BMI calculation matched: ${entry.bmi}. Goal target is ${entry.goalWeight} kg.`,
      meta: `Weight: ${entry.weight} kg`,
      date: entry.date,
      time: entry.time,
      timestamp: entry.timestamp,
      icon: Scale,
      color: "text-indigo-400 bg-indigo-500/10 border border-indigo-500/10"
    }));
  }

  if (filterType === "All" || filterType === "Diet Plans") {
    dietPlans.forEach(plan => allLogs.push({
      id: plan.id,
      type: "Diet Plans",
      title: `${plan.calories} kcal Diet Program`,
      desc: `Breakfast: ${plan.meals?.breakfast?.substring(0, 50)}... | Lunch: ${plan.meals?.lunch?.substring(0, 50)}...`,
      meta: `Goal: ${plan.goal} • Sourced on preference: ${plan.preference}`,
      date: plan.date,
      time: plan.time,
      timestamp: plan.timestamp,
      icon: Bot,
      color: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/10"
    }));
  }

  if (filterType === "All" || filterType === "Workout Plans") {
    workoutPlans.forEach(plan => allLogs.push({
      id: plan.id,
      type: "Workout Plans",
      title: `AI Routine: ${plan.workoutType}`,
      desc: `Exercises: ${plan.exercises.substring(0, 80)}...`,
      meta: `Difficulty: ${plan.level} • Duration: ${plan.duration}`,
      date: plan.date,
      time: plan.time,
      timestamp: plan.timestamp,
      icon: Dumbbell,
      color: "text-purple-400 bg-purple-500/10 border border-purple-500/10"
    }));
  }

  if (filterType === "All" || filterType === "Chat") {
    chatHistory.forEach(msg => allLogs.push({
      id: msg.id,
      type: "Chat",
      title: msg.role === "user" ? "You asked AI Coach" : "AI Coach answered",
      desc: msg.content.substring(0, 100) + (msg.content.length > 100 ? "..." : ""),
      meta: `Message content logged`,
      date: new Date(msg.timestamp).toISOString().split("T")[0],
      time: new Date(msg.timestamp).toTimeString().split(" ")[0].substring(0, 5),
      timestamp: msg.timestamp,
      icon: Bot,
      color: msg.role === "user" ? "text-zinc-300 bg-zinc-800 border border-zinc-700" : "text-teal-400 bg-teal-500/10 border border-teal-500/10"
    }));
  }

  // Sort logs by newest timestamp
  const sortedLogs = allLogs.sort((a, b) => b.timestamp - a.timestamp);

  // Filter logs based on search query
  const filteredLogs = sortedLogs.filter(log => 
    log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResetClick = async () => {
    if (!onResetNormalHistory) return;
    const choice = window.prompt(
      "RESET DAILY LOGS HISTORY\n\nType 'today' to reset only today's water & meals back to 0, or 'all' to delete all recorded historical daily logs (water, meals, weight, BMI, calories, chat history). Generated workout and diet plans will remain completely safe.\n\nType your choice below ('today' or 'all'):"
    );
    
    if (choice === null) return;
    const cleanChoice = choice.trim().toLowerCase();
    
    if (cleanChoice === 'today') {
      await onResetNormalHistory('today');
      alert("Successfully reset today's logged metrics.");
    } else if (cleanChoice === 'all') {
      await onResetNormalHistory('all');
      alert("Successfully cleared all historical daily metrics.");
    } else {
      alert("Invalid option. Please type 'today' or 'all'.");
    }
  };

  const filterTabs: LogType[] = ["All", "BMI", "Calories", "Meals", "Water", "Weight", "Diet Plans", "Workout Plans", "Chat"];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-zinc-900 text-white p-5 rounded-3xl shadow-sm border border-zinc-800">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-[#c1ff72]" />
          <div>
            <h2 className="text-sm font-bold font-display tracking-tight">History Central</h2>
            <p className="text-[10px] text-zinc-400">Search, filter, and delete records</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onResetNormalHistory && (
            <button
              onClick={handleResetClick}
              className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-2xl font-bold text-[10px] text-rose-400 active-press transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Logs
            </button>
          )}
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 px-3 py-1.5 rounded-2xl font-bold text-[10px] text-[#c1ff72] active-press transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search records by keywords, content, date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#c1ff72] transition-colors shadow-2xs"
          />
        </div>

        {/* Categories Tab Pill slider */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`py-1.5 px-3.5 rounded-full text-[10px] font-bold shrink-0 transition-colors active-press ${
                filterType === tab
                  ? "bg-[#c1ff72] text-[#050505]"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Viewport */}
      <div>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">Log Entries ({filteredLogs.length})</h3>
        
        {filteredLogs.length === 0 ? (
          <div className="bg-zinc-900/60 text-zinc-500 text-center py-12 rounded-3xl border border-zinc-800 text-xs">
            No history entries match your filter or search keywords.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredLogs.map((log, idx) => {
              const IconComp = log.icon;
              return (
                <div key={idx} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xs space-y-2 relative">
                  {/* Top line with title and date */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${log.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{log.type}</span>
                        <h4 className="text-xs font-bold text-white leading-tight">{log.title}</h4>
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteItem(log.type, log.id)}
                      disabled={loadingId === log.id}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg active-press transition-colors"
                    >
                      {loadingId === log.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Main description and metadata */}
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-semibold whitespace-pre-line">{log.desc}</p>
                  
                  {/* Footer details */}
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 font-medium border-t border-zinc-850 pt-2 mt-1">
                    <span>{log.meta}</span>
                    <span>{log.date} at {log.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
