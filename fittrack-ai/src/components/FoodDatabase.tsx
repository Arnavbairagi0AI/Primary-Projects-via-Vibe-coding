import React, { useState } from "react";
import { UserProfile, MealEntry } from "../types";
import { db, collection, addDoc } from "../lib/firebase";
import { searchFoods, COMMON_FOOD_DATABASE, FoodItem } from "../lib/foodDb";
import { Apple, Search, Plus, PlusCircle, Sparkles, BookOpen, Clock, ArrowLeft, Trash2 } from "lucide-react";

interface FoodDatabaseProps {
  profile: UserProfile;
  mealHistory: MealEntry[];
  onAddMealEntry: (entry: MealEntry) => void;
  onNavigateBack: () => void;
  onDeleteMealEntry?: (id: string) => void;
}

export default function FoodDatabase({
  profile,
  mealHistory,
  onAddMealEntry,
  onNavigateBack,
  onDeleteMealEntry
}: FoodDatabaseProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  
  // Custom food states
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>("");
  const [customCals, setCustomCals] = useState<number>(100);
  const [customProtein, setCustomProtein] = useState<number>(0);
  const [customCarbs, setCustomCarbs] = useState<number>(0);
  const [customFat, setCustomFat] = useState<number>(0);
  const [customFiber, setCustomFiber] = useState<number>(0);
  const [customSugar, setCustomSugar] = useState<number>(0);
  const [customServing, setCustomServing] = useState<string>("1 serving (100g)");

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const handleSearch = (queryStr: string) => {
    setSearchQuery(queryStr);
    if (queryStr.trim().length >= 1) {
      setSearchResults(searchFoods(queryStr));
    } else {
      setSearchResults([]);
    }
  };

  const handleLogFood = async (food: FoodItem) => {
    setLoading(true);
    setMessage("");

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const timeStr = today.toTimeString().split(" ")[0].substring(0, 5);

    const meal: MealEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: dateStr,
      time: timeStr,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      sugar: food.sugar,
      timestamp: Date.now()
    };

    try {
      if (profile.uid && !profile.uid.startsWith("local_")) {
        await addDoc(collection(db, `users/${profile.uid}/mealHistory`), meal);
      }
      onAddMealEntry(meal);
      setMessage(`Successfully logged ${food.name}!`);
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      console.error("Failed to log food entry:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setLoading(true);

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const timeStr = today.toTimeString().split(" ")[0].substring(0, 5);

    const meal: MealEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: dateStr,
      time: timeStr,
      name: `${customName} (${customServing})`,
      calories: customCals,
      protein: customProtein,
      carbs: customCarbs,
      fat: customFat,
      fiber: customFiber,
      sugar: customSugar,
      timestamp: Date.now()
    };

    try {
      if (profile.uid && !profile.uid.startsWith("local_")) {
        await addDoc(collection(db, `users/${profile.uid}/mealHistory`), meal);
      }
      onAddMealEntry(meal);
      setMessage(`Successfully logged custom ${customName}!`);
      
      // Reset custom form
      setCustomName("");
      setCustomCals(100);
      setCustomProtein(0);
      setCustomCarbs(0);
      setCustomFat(0);
      setCustomFiber(0);
      setCustomSugar(0);
      setCustomServing("1 serving (100g)");
      setShowCustomForm(false);
      
      setTimeout(() => setMessage(""), 2500);
    } catch (err) {
      console.error("Failed to log custom food:", err);
    } finally {
      setLoading(false);
    }
  };

  // Compute Daily totals for today
  const todayStr = new Date().toISOString().split("T")[0];
  const todayMeals = mealHistory.filter(m => m.date === todayStr);
  const totalCals = todayMeals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = todayMeals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = todayMeals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFat = todayMeals.reduce((acc, m) => acc + m.fat, 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Back button header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onNavigateBack}
          className="p-2 bg-white rounded-full border border-slate-100 text-slate-600 active-press"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold font-display text-slate-950">Meal Tracker & Food Database</h2>
          <p className="text-xs text-slate-500">Log meals, macronutrients, and analyze daily totals</p>
        </div>
      </div>

      {/* Daily totals summary card */}
      <div className="bg-slate-900 text-slate-100 p-5 rounded-3xl border border-slate-800 shadow-sm space-y-3.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Nutrition Breakdown</span>
          <span className="text-xl font-black text-amber-400 font-display">{totalCals} kcal logged</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protein</span>
            <div className="text-lg font-black text-emerald-400 font-display mt-0.5">{totalProtein.toFixed(0)}g</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Carbs</span>
            <div className="text-lg font-black text-sky-400 font-display mt-0.5">{totalCarbs.toFixed(0)}g</div>
          </div>
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fats</span>
            <div className="text-lg font-black text-orange-400 font-display mt-0.5">{totalFat.toFixed(0)}g</div>
          </div>
        </div>
      </div>

      {/* Messaging banner */}
      {message && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 text-xs px-4 py-2.5 rounded-2xl text-center animate-pulse font-medium">
          {message}
        </div>
      )}

      {/* Main search card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-display">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            Search Database
          </span>
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="text-[11px] font-bold text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1 rounded-full active-press transition-colors"
          >
            {showCustomForm ? "Cancel custom" : "Log custom item"}
          </button>
        </div>

        {showCustomForm ? (
          <form onSubmit={handleLogCustom} className="space-y-3.5 border-t border-slate-100 pt-4 animate-fade-in">
            <div className="text-xs font-bold text-slate-700">Create Custom Nutrient Log</div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Food Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Whey Shake"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Serving Size</label>
                <input
                  type="text"
                  placeholder="e.g. 1 shake (300ml)"
                  value={customServing}
                  onChange={(e) => setCustomServing(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  required
                  value={customCals}
                  onChange={(e) => setCustomCals(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Protein (g)</label>
                <input
                  type="number"
                  required
                  value={customProtein}
                  onChange={(e) => setCustomProtein(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  required
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Fat (g)</label>
                <input
                  type="number"
                  required
                  value={customFat}
                  onChange={(e) => setCustomFat(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Fiber (g)</label>
                <input
                  type="number"
                  value={customFiber}
                  onChange={(e) => setCustomFiber(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Sugar (g)</label>
                <input
                  type="number"
                  value={customSugar}
                  onChange={(e) => setCustomSugar(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active-press transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Save and Log Custom Food
            </button>
          </form>
        ) : (
          <div className="space-y-3.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search food (e.g. Oatmeal, Salmon, Eggs, Rice...)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            {searchResults.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
                {searchResults.map((food, i) => (
                  <div key={i} className="py-2.5 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{food.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {food.servingSize} • {food.calories} kcal • P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                      </div>
                    </div>
                    <button
                      onClick={() => handleLogFood(food)}
                      disabled={loading}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl active-press transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim().length > 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No standard match. You can log it as a custom food above!
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Common database shortcuts</div>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_FOOD_DATABASE.slice(0, 7).map((food, i) => (
                    <button
                      key={i}
                      onClick={() => handleLogFood(food)}
                      className="text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 active-press transition-colors hover:border-emerald-300"
                    >
                      + {food.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Today's Meals History */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider font-display">Today's Meal Journal</h3>
        {todayMeals.length === 0 ? (
          <div className="bg-slate-50 text-slate-400 text-center py-8 rounded-3xl border border-slate-100 text-xs">
            No foods logged for today. Track meals above to monitor calorie intake.
          </div>
        ) : (
          <div className="space-y-3">
            {todayMeals.map((meal) => (
              <div key={meal.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{meal.name}</h4>
                  <div className="text-[10px] text-slate-400 mt-1 flex gap-2 font-medium">
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {meal.time}</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>F: {meal.fat}g</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-black text-slate-900 font-display">{meal.calories} kcal</div>
                  {onDeleteMealEntry && (
                    <button
                      onClick={() => onDeleteMealEntry(meal.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg active-press transition-colors"
                      title="Delete meal log"
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
