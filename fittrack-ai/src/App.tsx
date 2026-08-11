import React, { useState, useEffect } from "react";
import { 
  auth, db, onAuthStateChanged, collection, doc, onSnapshot, addDoc,
  deleteDoc, getDocs,
  runFirebaseDiagnostics
} from "./lib/firebase";
import type { FirebaseDiagnostic } from "./lib/firebase";
import type { FirebaseUser } from "./lib/firebase";
import { getDoc } from "firebase/firestore";
import { 
  UserProfile, BmiEntry, CalorieCalculation, MealEntry, WaterEntry, WeightEntry, DietPlan, WorkoutPlan, ChatHistoryEntry 
} from "./types";

// Import Components
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import BmiCalculator from "./components/BmiCalculator";
import CalorieCalculator from "./components/CalorieCalculator";
import FoodDatabase from "./components/FoodDatabase";
import WaterTracker from "./components/WaterTracker";
import WeightTracker from "./components/WeightTracker";
import DietPlanner from "./components/DietPlanner";
import WorkoutPlanner from "./components/WorkoutPlanner";
import AiCoach from "./components/AiCoach";
import HistoryCentral from "./components/HistoryCentral";
import ProgressCharts from "./components/ProgressCharts";
import ProfileSettings from "./components/ProfileSettings";
import StravaTracker from "./components/StravaTracker";

// Icons for Sticky Bottom Navigation
import { Home, Bot, BarChart2, History, User, Heart, RefreshCw, AlertTriangle, CheckCircle, X, WifiOff } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  
  // Firebase Diagnostic States
  const [diagnostics, setDiagnostics] = useState<FirebaseDiagnostic | null>(null);
  const [checkingDiagnostics, setCheckingDiagnostics] = useState<boolean>(true);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<boolean>(false);

  // Trigger Firebase Connectivity Diagnostics on App Load
  useEffect(() => {
    async function performDiagnostics() {
      try {
        const result = await runFirebaseDiagnostics();
        setDiagnostics(result);
      } catch (err) {
        console.error("Firebase diagnostics execution failed:", err);
      } finally {
        setCheckingDiagnostics(false);
      }
    }
    performDiagnostics();
  }, []);

  const handleRetryDiagnostics = async () => {
    setCheckingDiagnostics(true);
    try {
      const result = await runFirebaseDiagnostics();
      setDiagnostics(result);
    } catch (err) {
      console.error("Diagnostics retry failed:", err);
    } finally {
      setCheckingDiagnostics(false);
    }
  };
  
  // Navigation states
  const [activeTab, setActiveTab] = useState<string>("home"); // home, coach, charts, history, profile
  const [activeSubPage, setActiveSubPage] = useState<string | null>(null); // bmi, calories, food, water, weight, diet, workout

  // Core synchronized history states with local-first offline fallback
  const [bmiHistory, setBmiHistory] = useState<BmiEntry[]>(() => {
    const local = localStorage.getItem("fittrack_bmiHistory");
    return local ? JSON.parse(local) : [];
  });
  const [calorieHistory, setCalorieHistory] = useState<CalorieCalculation[]>(() => {
    const local = localStorage.getItem("fittrack_calorieHistory");
    return local ? JSON.parse(local) : [];
  });
  const [mealHistory, setMealHistory] = useState<MealEntry[]>(() => {
    const local = localStorage.getItem("fittrack_mealHistory");
    return local ? JSON.parse(local) : [];
  });
  const [waterHistory, setWaterHistory] = useState<WaterEntry[]>(() => {
    const local = localStorage.getItem("fittrack_waterHistory");
    return local ? JSON.parse(local) : [];
  });
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(() => {
    const local = localStorage.getItem("fittrack_weightHistory");
    return local ? JSON.parse(local) : [];
  });
  const [dietPlans, setDietPlans] = useState<DietPlan[]>(() => {
    const local = localStorage.getItem("fittrack_dietPlans");
    return local ? JSON.parse(local) : [];
  });
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(() => {
    const local = localStorage.getItem("fittrack_workoutPlans");
    return local ? JSON.parse(local) : [];
  });
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>(() => {
    const local = localStorage.getItem("fittrack_chatHistory");
    return local ? JSON.parse(local) : [];
  });

  // Local-first persistence synchronizer for Guest sessions
  useEffect(() => {
    if (profile && (!user || profile.uid === "local_guest_user")) {
      localStorage.setItem("fittrack_profile", JSON.stringify(profile));
      localStorage.setItem("fittrack_bmiHistory", JSON.stringify(bmiHistory));
      localStorage.setItem("fittrack_calorieHistory", JSON.stringify(calorieHistory));
      localStorage.setItem("fittrack_mealHistory", JSON.stringify(mealHistory));
      localStorage.setItem("fittrack_waterHistory", JSON.stringify(waterHistory));
      localStorage.setItem("fittrack_weightHistory", JSON.stringify(weightHistory));
      localStorage.setItem("fittrack_dietPlans", JSON.stringify(dietPlans));
      localStorage.setItem("fittrack_workoutPlans", JSON.stringify(workoutPlans));
      localStorage.setItem("fittrack_chatHistory", JSON.stringify(chatHistory));
    }
  }, [profile, bmiHistory, calorieHistory, mealHistory, waterHistory, weightHistory, dietPlans, workoutPlans, chatHistory, user]);

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch User Profile
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            const localProfile = localStorage.getItem("fittrack_profile");
            if (localProfile) {
              setProfile(JSON.parse(localProfile));
            } else {
              setProfile(null);
            }
          }
        } catch (e) {
          console.warn("Firestore profile fetch failed, fallback to local:", e);
          const localProfile = localStorage.getItem("fittrack_profile");
          if (localProfile) {
            setProfile(JSON.parse(localProfile));
          } else {
            setProfile(null);
          }
        }
      } else {
        const localProfile = localStorage.getItem("fittrack_profile");
        if (localProfile) {
          setProfile(JSON.parse(localProfile));
        } else {
          setProfile(null);
        }
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync Subcollections with real-time offline persistence listeners when user is set
  useEffect(() => {
    if (!user || !profile) return;

    const uid = user.uid;

    // 1. BMI History
    const unsubBmi = onSnapshot(collection(db, `users/${uid}/bmiHistory`), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as BmiEntry);
      setBmiHistory(items.sort((a, b) => b.timestamp - a.timestamp));
    });

    // 2. Calorie History
    const unsubCalories = onSnapshot(collection(db, `users/${uid}/calorieHistory`), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as CalorieCalculation);
      setCalorieHistory(items.sort((a, b) => b.timestamp - a.timestamp));
    });

    // 3. Meals History
    const unsubMeals = onSnapshot(collection(db, `users/${uid}/mealHistory`), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as MealEntry);
      setMealHistory(items.sort((a, b) => b.timestamp - a.timestamp));
    });

    // 4. Water History
    const unsubWater = onSnapshot(collection(db, `users/${uid}/waterHistory`), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as WaterEntry);
      setWaterHistory(items.sort((a, b) => b.timestamp - a.timestamp));
    });

    // 5. Weight History
    const unsubWeight = onSnapshot(collection(db, `users/${uid}/weightHistory`), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as WeightEntry);
      setWeightHistory(items.sort((a, b) => b.timestamp - a.timestamp));
    });

    // 6. Diet Plans
    const unsubDiets = onSnapshot(collection(db, `users/${uid}/dietPlans`), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as DietPlan);
      setDietPlans(items.sort((a, b) => b.timestamp - a.timestamp));
    });

    // 7. Workout Plans
    const unsubWorkouts = onSnapshot(collection(db, `users/${uid}/workoutPlans`), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as WorkoutPlan);
      setWorkoutPlans(items.sort((a, b) => b.timestamp - a.timestamp));
    });

    // 8. Chat History
    const unsubChat = onSnapshot(collection(db, `users/${uid}/chatHistory`), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as ChatHistoryEntry);
      setChatHistory(items.sort((a, b) => a.timestamp - b.timestamp)); // oldest first for chat flow
    });

    return () => {
      unsubBmi();
      unsubCalories();
      unsubMeals();
      unsubWater();
      unsubWeight();
      unsubDiets();
      unsubWorkouts();
      unsubChat();
    };
  }, [user, profile]);

  // Quick action: quick water log from Home screen
  const handleQuickLogWater = async (amount: number) => {
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

    if (user && profile && profile.uid !== "local_guest_user") {
      try {
        await addDoc(collection(db, `users/${user.uid}/waterHistory`), entry);
      } catch (err) {
        console.error("Failed to quick-log water to Firestore:", err);
      }
    }
    handleAddWaterEntry(entry);
  };

  // Compute Today's aggregations
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCalories = mealHistory.filter(m => m.date === todayStr).reduce((acc, m) => acc + m.calories, 0);
  const todayWater = waterHistory.filter(w => w.date === todayStr).reduce((acc, w) => acc + w.amount, 0);

  // Sign out helper
  const handleSignOut = () => {
    setUser(null);
    setProfile(null);
    setActiveTab("home");
    setActiveSubPage(null);
  };

  // State update helpers for child components
  const handleAddBmiEntry = (entry: BmiEntry) => setBmiHistory(prev => [entry, ...prev]);
  const handleAddCalorieCalculation = (entry: CalorieCalculation) => setCalorieHistory(prev => [entry, ...prev]);
  const handleAddMealEntry = (entry: MealEntry) => setMealHistory(prev => [entry, ...prev]);
  const handleAddWaterEntry = (entry: WaterEntry) => setWaterHistory(prev => [entry, ...prev]);
  const handleAddWeightEntry = (entry: WeightEntry) => setWeightHistory(prev => [entry, ...prev]);
  const handleAddDietPlan = (plan: DietPlan) => setDietPlans(prev => [plan, ...prev]);
  const handleAddWorkoutPlan = (plan: WorkoutPlan) => setWorkoutPlans(prev => [plan, ...prev]);
  const handleAddChatMessage = (msg: ChatHistoryEntry) => setChatHistory(prev => [...prev, msg]);

  // History delete callbacks
  const handleDeleteBmi = (id: string) => setBmiHistory(prev => prev.filter(x => x.id !== id));
  const handleDeleteCalorie = (id: string) => setCalorieHistory(prev => prev.filter(x => x.id !== id));
  const handleDeleteMeal = (id: string) => setMealHistory(prev => prev.filter(x => x.id !== id));
  const handleDeleteWater = (id: string) => setWaterHistory(prev => prev.filter(x => x.id !== id));
  const handleDeleteWeight = (id: string) => setWeightHistory(prev => prev.filter(x => x.id !== id));
  const handleDeleteDiet = (id: string) => setDietPlans(prev => prev.filter(x => x.id !== id));
  const handleDeleteWorkout = (id: string) => setWorkoutPlans(prev => prev.filter(x => x.id !== id));
  const handleDeleteChat = (id: string) => setChatHistory(prev => prev.filter(x => x.id !== id));
  const handleClearChat = () => setChatHistory([]);

  const handleResetNormalHistory = async (mode: 'today' | 'all') => {
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. If signed in, delete corresponding items from Firestore
    if (user && profile && profile.uid !== "local_guest_user") {
      const uid = user.uid;
      const subcollections = [
        { name: "waterHistory", data: waterHistory },
        { name: "mealHistory", data: mealHistory },
        { name: "weightHistory", data: weightHistory },
        { name: "bmiHistory", data: bmiHistory },
        { name: "calorieHistory", data: calorieHistory },
        { name: "chatHistory", data: chatHistory }
      ];

      for (const sub of subcollections) {
        const toDelete = mode === "today"
          ? sub.data.filter((item: any) => {
              if (sub.name === "chatHistory") {
                const itemDate = new Date(item.timestamp).toISOString().split("T")[0];
                return itemDate === todayStr;
              }
              return item.date === todayStr;
            })
          : sub.data;

        for (const item of toDelete) {
          try {
            await deleteDoc(doc(db, `users/${uid}/${sub.name}`, item.id));
          } catch (err) {
            console.error(`Failed to delete item from ${sub.name}:`, err);
          }
        }
      }
    }

    // 2. Reset React Local states
    if (mode === "today") {
      setWaterHistory(prev => prev.filter(item => item.date !== todayStr));
      setMealHistory(prev => prev.filter(item => item.date !== todayStr));
      setWeightHistory(prev => prev.filter(item => item.date !== todayStr));
      setBmiHistory(prev => prev.filter(item => item.date !== todayStr));
      setCalorieHistory(prev => prev.filter(item => item.date !== todayStr));
      setChatHistory(prev => prev.filter(item => {
        const itemDate = new Date(item.timestamp).toISOString().split("T")[0];
        return itemDate !== todayStr;
      }));
    } else {
      setWaterHistory([]);
      setMealHistory([]);
      setWeightHistory([]);
      setBmiHistory([]);
      setCalorieHistory([]);
      setChatHistory([]);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100">
        <RefreshCw className="w-8 h-8 text-teal-400 animate-spin mb-3" />
        <span className="text-xs uppercase tracking-widest font-bold">Synchronizing Cloud Services...</span>
      </div>
    );
  }

  // If no profile exists, prompt user with Onboarding assessments
  if (!profile) {
    return <Onboarding onComplete={(prof) => setProfile(prof)} />;
  }

  // Routing manager for subpages or standard navigation tabs
  const renderContent = () => {
    if (activeSubPage) {
      switch (activeSubPage) {
        case "bmi":
          return (
            <BmiCalculator 
              profile={profile} 
              bmiHistory={bmiHistory} 
              onAddBmiEntry={handleAddBmiEntry} 
              onNavigateBack={() => setActiveSubPage(null)} 
            />
          );
        case "calories":
          return (
            <CalorieCalculator 
              profile={profile} 
              calorieHistory={calorieHistory} 
              onAddCalorieCalculation={handleAddCalorieCalculation} 
              onNavigateBack={() => setActiveSubPage(null)} 
            />
          );
        case "food":
          return (
            <FoodDatabase 
              profile={profile} 
              mealHistory={mealHistory} 
              onAddMealEntry={handleAddMealEntry} 
              onNavigateBack={() => setActiveSubPage(null)} 
              onDeleteMealEntry={handleDeleteMeal}
            />
          );
        case "water":
          return (
            <WaterTracker 
              profile={profile} 
              waterHistory={waterHistory} 
              onAddWaterEntry={handleAddWaterEntry} 
              onNavigateBack={() => setActiveSubPage(null)} 
              onResetNormalHistory={handleResetNormalHistory}
              onDeleteWaterEntry={handleDeleteWater}
            />
          );
        case "weight":
          return (
            <WeightTracker 
              profile={profile} 
              weightHistory={weightHistory} 
              onAddWeightEntry={handleAddWeightEntry} 
              onNavigateBack={() => setActiveSubPage(null)} 
            />
          );
        case "diet":
          return (
            <DietPlanner 
              profile={profile} 
              dietHistory={dietPlans} 
              onAddDietPlan={handleAddDietPlan} 
              onNavigateBack={() => setActiveSubPage(null)} 
            />
          );
        case "workout":
          return (
            <WorkoutPlanner 
              profile={profile} 
              workoutHistory={workoutPlans} 
              onAddWorkoutPlan={handleAddWorkoutPlan} 
              onNavigateBack={() => setActiveSubPage(null)} 
            />
          );
        case "strava":
          return (
            <StravaTracker 
              profile={profile}
              onUpdateProfile={(updated) => setProfile(updated)}
              onNavigateBack={() => setActiveSubPage(null)}
            />
          );
        default:
          setActiveSubPage(null);
          return null;
      }
    }

    switch (activeTab) {
      case "home":
        return (
          <Dashboard 
            profile={profile}
            bmiHistory={bmiHistory}
            weightHistory={weightHistory}
            waterHistory={waterHistory}
            mealHistory={mealHistory}
            onNavigate={(page) => setActiveSubPage(page)}
            onQuickLogWater={handleQuickLogWater}
            todayCalories={todayCalories}
            todayWater={todayWater}
            onResetNormalHistory={handleResetNormalHistory}
          />
        );
      case "coach":
        return (
          <AiCoach 
            profile={profile}
            chatHistory={chatHistory}
            bmiHistory={bmiHistory}
            weightHistory={weightHistory}
            dietPlans={dietPlans}
            workoutPlans={workoutPlans}
            onAddChatMessage={handleAddChatMessage}
            onClearChat={handleClearChat}
          />
        );
      case "charts":
        return (
          <ProgressCharts 
            profile={profile}
            bmiHistory={bmiHistory}
            calorieHistory={calorieHistory}
            mealHistory={mealHistory}
            waterHistory={waterHistory}
            weightHistory={weightHistory}
            workoutPlans={workoutPlans}
            chatHistory={chatHistory}
          />
        );
      case "history":
        return (
          <HistoryCentral 
            profile={profile}
            bmiHistory={bmiHistory}
            calorieHistory={calorieHistory}
            mealHistory={mealHistory}
            waterHistory={waterHistory}
            weightHistory={weightHistory}
            dietPlans={dietPlans}
            workoutPlans={workoutPlans}
            chatHistory={chatHistory}
            onDeleteBmi={handleDeleteBmi}
            onDeleteCalorie={handleDeleteCalorie}
            onDeleteMeal={handleDeleteMeal}
            onDeleteWater={handleDeleteWater}
            onDeleteWeight={handleDeleteWeight}
            onDeleteDiet={handleDeleteDiet}
            onDeleteWorkout={handleDeleteWorkout}
            onDeleteChat={handleDeleteChat}
            onResetNormalHistory={handleResetNormalHistory}
          />
        );
      case "profile":
        return (
          <ProfileSettings 
            profile={profile}
            onUpdateProfile={(updated) => setProfile(updated)}
            onSignOut={handleSignOut}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div id="app_frame" className="min-h-screen bg-[#050505] text-[#E0E0E0] font-sans flex items-center justify-center p-0 md:p-6 overflow-hidden">
      <div className="flex w-full max-w-5xl h-full gap-8 items-center justify-center">
        {/* Left Sidebar for Desktop */}
        <div className="hidden lg:flex flex-col w-64 h-[760px] justify-between py-6">
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-[#c1ff72] font-display">FitTrack AI</h1>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">Premium Health Suite</p>
            </div>
            
            <nav className="space-y-4">
              {[
                { id: "home", label: "Dashboard", icon: Home },
                { id: "coach", label: "AI Coach", icon: Bot },
                { id: "charts", label: "Analytics", icon: BarChart2 },
                { id: "history", label: "History Log", icon: History },
                { id: "profile", label: "Profile Specs", icon: User }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id && !activeSubPage;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveSubPage(null);
                      setActiveTab(tab.id);
                    }}
                    className={`flex items-center gap-3 w-full text-left transition-all active-press ${
                      isActive ? "text-white font-bold" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? "bg-[#c1ff72]" : "bg-transparent"}`} />
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1 font-bold">Support Hotline</p>
            <p className="text-sm font-mono text-white">+91 8796300923</p>
          </div>
        </div>

        {/* Center Mobile Phone Frame */}
        <div className="w-full max-w-md md:w-[375px] md:h-[812px] bg-[#0c0c0c] text-[#E0E0E0] md:shadow-2xl relative flex flex-col justify-between overflow-hidden md:rounded-[48px] md:border-[8px] md:border-[#1a1a1a]">
          
          {/* Phone Top Notch Status */}
          <div className="hidden md:flex justify-between items-center bg-[#0c0c0c] px-8 pt-4 pb-2 text-[10px] font-bold text-zinc-400 select-none z-50">
            <span>9:41</span>
            <div className="w-20 h-4 bg-[#1a1a1a] rounded-full mx-auto absolute left-1/2 transform -translate-x-1/2" />
            <div className="flex gap-1.5 items-center">
              <span>5G</span>
              <div className="w-4 h-2 bg-zinc-700 rounded-xs" />
            </div>
          </div>

          {/* Firebase Diagnostic Warning Banner */}
          {diagnostics && (!diagnostics.canReachFirestore || !diagnostics.isConfigured) && (
            <div className="bg-amber-500/10 border-y border-amber-500/10 px-5 py-2 flex items-center justify-between gap-2 z-45">
              <div className="flex items-center gap-2 min-w-0">
                <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[10px] font-bold text-amber-200 truncate">
                  {diagnostics.isOfflineMode ? "Cloud Offline (Local Mode Active)" : "Cloud Sync Issue"}
                </span>
              </div>
              <button 
                onClick={() => setShowDiagnosticsModal(true)} 
                className="text-[9px] font-extrabold uppercase tracking-wider text-[#c1ff72] hover:underline cursor-pointer shrink-0"
              >
                Diagnostics
              </button>
            </div>
          )}

          {/* Diagnostics Detailed Modal Overlay */}
          {showDiagnosticsModal && diagnostics && (
            <div className="absolute inset-0 bg-[#070707]/98 backdrop-blur-lg z-50 flex flex-col p-6 overflow-y-auto select-none">
              <div className="flex justify-between items-center mb-5 mt-2">
                <div>
                  <h2 className="text-base font-black tracking-tight text-white font-display">System Diagnostics</h2>
                  <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Cloud Connectivity Report</p>
                </div>
                <button 
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Summary */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    diagnostics.canReachFirestore ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {diagnostics.canReachFirestore ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {diagnostics.canReachFirestore ? "Firebase Connected" : "Local-First Fallback Active"}
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-1 leading-normal">
                      {diagnostics.canReachFirestore 
                        ? `Cloud connection verified. Sync latency: ${diagnostics.latencyMs || 0}ms.`
                        : "Cloud server is currently unreachable. FitTrack has automatically engaged offline local storage to safeguard your sessions."
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2 mb-4">
                <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Diagnostic Checklist</p>
                
                {[
                  { 
                    label: "Configuration Integrity", 
                    checked: diagnostics.isConfigured, 
                    desc: diagnostics.isConfigured ? "Valid API parameters parsed" : "Config missing/empty" 
                  },
                  { 
                    label: "SDK Instance Engine", 
                    checked: diagnostics.isFirebaseAppInitialized, 
                    desc: diagnostics.isFirebaseAppInitialized ? "Core engine successfully booted" : "SDK initialization failed" 
                  },
                  { 
                    label: "Authentication Services", 
                    checked: diagnostics.canReachAuth, 
                    desc: diagnostics.canReachAuth ? "Auth triggers active" : "Auth unreachable" 
                  },
                  { 
                    label: "Firestore Database Gateway", 
                    checked: diagnostics.canReachFirestore, 
                    desc: diagnostics.canReachFirestore ? "Real-time sync operational" : "Offline / blocked by environment" 
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-zinc-900/20 border border-zinc-800/60">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-zinc-300">{item.label}</p>
                      <p className="text-[9px] text-zinc-500 leading-snug">{item.desc}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      item.checked ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                    }`} />
                  </div>
                ))}
              </div>

              {/* Exception Logs */}
              {diagnostics.error && (
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3 mb-4">
                  <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">System Exception Trace</span>
                  <p className="text-[10px] font-mono text-amber-500/90 break-all leading-normal max-h-24 overflow-y-auto no-scrollbar">
                    {diagnostics.error}
                  </p>
                </div>
              )}

              {/* Advice */}
              <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-xl p-3.5 mb-5">
                <h4 className="text-[10px] font-bold text-white mb-1 uppercase tracking-wider">Troubleshooting Note</h4>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Your device has been transitioned to local-first mode. All trackers are operational; stats will automatically sync to Firestore when internet connectivity or credentials become available.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex gap-2">
                <button 
                  onClick={handleRetryDiagnostics}
                  disabled={checkingDiagnostics}
                  className="flex-1 py-2.5 bg-[#c1ff72] hover:bg-[#b0f55e] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 active-press cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${checkingDiagnostics ? "animate-spin" : ""}`} />
                  {checkingDiagnostics ? "Checking..." : "Retry Sync"}
                </button>
                <button 
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors active-press cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Scrollable Viewport */}
          <main className="flex-1 overflow-y-auto px-5 pt-4 pb-20 no-scrollbar">
            {renderContent()}
          </main>

          {/* Sticky Bottom Navigation Menu */}
          <nav className="absolute bottom-0 left-0 right-0 bg-[#0c0c0c]/90 backdrop-blur-md border-t border-white/5 py-3.5 px-6 flex justify-between items-center safe-pb select-none z-40">
            {[
              { id: "home", label: "Home", icon: Home },
              { id: "coach", label: "AI Coach", icon: Bot },
              { id: "charts", label: "Progress", icon: BarChart2 },
              { id: "history", label: "History", icon: History },
              { id: "profile", label: "Profile", icon: User }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id && !activeSubPage;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveSubPage(null);
                    setActiveTab(tab.id);
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 transition-all active-press relative ${
                    isActive ? "text-[#c1ff72] scale-105" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                  <span className="text-[9px] font-bold tracking-wider">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Sidebar for Desktop */}
        <div className="hidden lg:flex flex-col w-64 h-[760px] py-6 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4 font-bold">AI Coach Activity</p>
            <div className="space-y-4">
              {chatHistory.length > 0 ? (
                chatHistory.slice(-2).map((msg, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded bg-[#c1ff72]/20 flex items-center justify-center text-[#c1ff72] font-extrabold text-[10px]">
                      {msg.role === "user" ? "U" : "AI"}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-[11px] leading-snug text-zinc-300 truncate">{msg.content}</p>
                      <p className="text-[9px] text-zinc-600">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-zinc-500 leading-snug">
                  No chat activity logged yet. Start a session with the AI Health Coach to get personalized tracking insights!
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2 font-bold">Weight Goal</p>
              <div className="flex justify-between items-end">
                <span className="text-sm text-zinc-300">Target</span>
                <span className="text-xl font-extrabold text-[#c1ff72] font-display">{profile.targetWeight} kg</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#c1ff72] transition-all duration-500" 
                  style={{ 
                    width: `${Math.max(0, Math.min(100, Math.round((profile.weight / (profile.targetWeight || 1)) * 100)))}%` 
                  }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 font-bold">Current starting weight: {profile.weight} kg</p>
            </div>
            
            <button 
              onClick={() => {
                setActiveSubPage(null);
                setActiveTab("history");
              }}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors active-press"
            >
              Sync History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
