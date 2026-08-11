import React, { useState } from "react";
import { UserProfile, BmiEntry, CalorieCalculation, MealEntry, WaterEntry, WeightEntry, WorkoutPlan, ChatHistoryEntry } from "../types";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, BarChart, Bar, Legend 
} from "recharts";
import { Award, Flame, Droplet, TrendingUp, Scale, Zap, Trophy, ShieldAlert, Bot, Lock, Check, Share2 } from "lucide-react";
import ShareModal from "./ShareModal";

interface ProgressChartsProps {
  profile: UserProfile;
  bmiHistory: BmiEntry[];
  calorieHistory: CalorieCalculation[];
  mealHistory: MealEntry[];
  waterHistory: WaterEntry[];
  weightHistory: WeightEntry[];
  workoutPlans?: WorkoutPlan[];
  chatHistory?: ChatHistoryEntry[];
}

type TimePeriod = "Weekly" | "Monthly";

export default function ProgressCharts({
  profile,
  bmiHistory,
  calorieHistory,
  mealHistory,
  waterHistory,
  weightHistory,
  workoutPlans = [],
  chatHistory = []
}: ProgressChartsProps) {
  const [period, setPeriod] = useState<TimePeriod>("Weekly");

  // Format data for Recharts
  // 1. Water Intake Daily Charts
  const getWaterChartData = () => {
    const daysToLook = period === "Weekly" ? 7 : 30;
    const dataMap: { [date: string]: number } = {};
    
    // Fill with empty days
    for (let i = daysToLook - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dataMap[dateStr] = 0;
    }

    // Populate actual logs
    waterHistory.forEach(entry => {
      if (dataMap[entry.date] !== undefined) {
        dataMap[entry.date] += entry.amount;
      }
    });

    return Object.keys(dataMap).map(date => {
      const parts = date.split("-");
      return {
        name: `${parts[1]}/${parts[2]}`,
        amount: dataMap[date],
        goal: profile.dailyWaterGoal
      };
    });
  };

  // 2. Weight progress trend
  const getWeightChartData = () => {
    const daysToLook = period === "Weekly" ? 7 : 30;
    const dataMap: { [date: string]: number } = {};

    // Fill days
    for (let i = daysToLook - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dataMap[dateStr] = 0;
    }

    // Sort entries old to new
    const sorted = [...weightHistory].sort((a, b) => a.timestamp - b.timestamp);
    
    // Track previous weight to avoid empty days
    let lastWeight = profile.weight;

    Object.keys(dataMap).forEach(date => {
      const match = sorted.find(w => w.date === date);
      if (match) {
        dataMap[date] = match.weight;
        lastWeight = match.weight;
      } else {
        dataMap[date] = lastWeight; // carry forward
      }
    });

    return Object.keys(dataMap).map(date => {
      const parts = date.split("-");
      return {
        name: `${parts[1]}/${parts[2]}`,
        Weight: dataMap[date],
        Target: profile.targetWeight
      };
    });
  };

  // 3. Calories balance logs
  const getCaloriesChartData = () => {
    const daysToLook = period === "Weekly" ? 7 : 30;
    const dataMap: { [date: string]: number } = {};

    for (let i = daysToLook - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dataMap[dateStr] = 0;
    }

    mealHistory.forEach(entry => {
      if (dataMap[entry.date] !== undefined) {
        dataMap[entry.date] += entry.calories;
      }
    });

    // Simple estimated target
    const target = 2000; // base fallback

    return Object.keys(dataMap).map(date => {
      const parts = date.split("-");
      return {
        name: `${parts[1]}/${parts[2]}`,
        Consumed: dataMap[date],
        Target: target
      };
    });
  };

  const waterChartData = getWaterChartData();
  const weightChartData = getWeightChartData();
  const caloriesChartData = getCaloriesChartData();

  // Streak & Achievement Calculations
  const calculateWaterStreak = () => {
    let streak = 0;
    const sortedHistoryDates = [...new Set(waterHistory.map(w => w.date))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let checkDate = new Date();
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split("T")[0];
      const dayLogs = waterHistory.filter(w => w.date === dateStr);
      const totalAmount = dayLogs.reduce((acc, w) => acc + w.amount, 0);

      if (totalAmount >= profile.dailyWaterGoal) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Allow streak to continue if we are checking today and they haven't completed it yet but did yesterday
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  };

  const waterStreak = calculateWaterStreak();

  interface Achievement {
    id: string;
    title: string;
    desc: string;
    icon: any;
    unlocked: boolean;
    color: string;
    lockedColor: string;
  }

  const [isShareOpen, setIsShareOpen] = useState(false);

  // Achievements
  const getAchievements = (): Achievement[] => {
    // 1. First Workout Logged
    const workoutLogged = workoutPlans && workoutPlans.length > 0;
    
    // 2. 7-Day Water Streak
    const waterStreak7 = waterStreak >= 7;

    // 3. 10kg Weight Loss Milestone
    const startWeight = profile.weight;
    const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : profile.weight;
    const weightLoss = startWeight - currentWeight;
    const weightLossReached = weightLoss >= 10 || (weightHistory.length > 0 && Math.abs(currentWeight - profile.targetWeight) <= 0.5);

    // 4. AI Coach Consultation
    const coachConsulted = chatHistory && chatHistory.length > 0;

    // 5. BMI in Healthy Range for a Week
    const bmiNormal = bmiHistory.length > 0 && bmiHistory[0].category === "Normal";

    return [
      {
        id: "first_workout",
        title: "First Workout Logged",
        desc: "Successfully generated and logged your first personalized AI workout routine.",
        icon: Flame,
        unlocked: workoutLogged,
        color: "text-orange-400 bg-orange-500/10 border border-orange-500/20",
        lockedColor: "text-zinc-600 bg-zinc-950/40 border-zinc-900/60"
      },
      {
        id: "water_streak_7",
        title: "7-Day Water Streak",
        desc: "Maintained complete customized hydration goals for 7 consecutive days.",
        icon: Droplet,
        unlocked: waterStreak7,
        color: "text-sky-400 bg-sky-500/10 border border-sky-500/20",
        lockedColor: "text-zinc-600 bg-zinc-950/40 border-zinc-900/60"
      },
      {
        id: "weight_loss_10",
        title: "10kg Weight Loss Milestone",
        desc: `Achieved 10kg weight loss or met your target weight. (Current change: ${weightLoss >= 0 ? '-' : '+'}${Math.abs(weightLoss).toFixed(1)}kg)`,
        icon: Scale,
        unlocked: weightLossReached,
        color: "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20",
        lockedColor: "text-zinc-600 bg-zinc-950/40 border-zinc-900/60"
      },
      {
        id: "coach_consultation",
        title: "AI Coach Consultation",
        desc: "Consulted the AI Coach to formulate custom fitness recommendations.",
        icon: Bot,
        unlocked: coachConsulted,
        color: "text-teal-400 bg-teal-500/10 border border-teal-500/20",
        lockedColor: "text-zinc-600 bg-zinc-950/40 border-zinc-900/60"
      },
      {
        id: "bmi_healthy_week",
        title: "BMI in Healthy Range",
        desc: "Logged and maintained standard, healthy body mass index (Normal BMI category).",
        icon: Trophy,
        unlocked: bmiNormal,
        color: "text-[#c1ff72] bg-[#c1ff72]/10 border border-[#c1ff72]/20",
        lockedColor: "text-zinc-600 bg-zinc-950/40 border-zinc-900/60"
      }
    ];
  };

  const achievementsList = getAchievements();
  const unlockedCount = achievementsList.filter(a => a.unlocked).map(a => a.id).length;

  // Build options for sharing milestones
  const getShareOptions = () => {
    const startWeight = profile.weight;
    const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : profile.weight;
    const weightLoss = startWeight - currentWeight;

    return [
      {
        id: "milestones",
        label: `Unlocked Milestones (${unlockedCount}/5)`,
        content: `🏆 Fitness Milestones: Achieved ${unlockedCount}/5 Unlocked!\n${
          achievementsList.map(a => `${a.unlocked ? '✅' : '🔒'} ${a.title}`).join("\n")
        }`
      },
      {
        id: "water_streak",
        label: `Hydration Streak (${waterStreak} Days)`,
        content: `💧 Hydration Streak: Reached a ${waterStreak}-day streak meeting my customized daily water goal!`
      },
      {
        id: "weight_progress",
        label: "Weight Tracking Status",
        content: `⚖️ Weight Progress: Currently tracked at ${currentWeight} kg (Target: ${profile.targetWeight} kg, start: ${startWeight} kg)!`
      }
    ];
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Time Toggle Header */}
      <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-3xl border border-zinc-800 shadow-sm">
        <div>
          <h2 className="text-sm font-bold font-display text-white">Goal Analytics Dashboard</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Progress and streaks tracker</p>
        </div>
        <div className="bg-zinc-950 p-1 rounded-2xl flex gap-1 border border-zinc-850">
          {(["Weekly", "Monthly"] as TimePeriod[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setPeriod(tab)}
              className={`py-1 px-3 rounded-xl text-[10px] font-bold active-press transition-colors ${
                period === tab
                  ? "bg-[#c1ff72] text-[#050505]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Streaks Bento Indicator */}
      <div className="grid grid-cols-2 gap-4">
        {/* Streak card */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-3xl flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-orange-500/20 to-amber-500/10 border border-orange-500/30 text-orange-400 rounded-2xl shadow-md animate-pulse">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">Water Streak</span>
            <div className="text-xl font-black text-white font-display mt-0.5">{waterStreak} Days</div>
          </div>
        </div>

        {/* BMI Category card */}
        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-3xl flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-[#c1ff72]/20 to-emerald-500/10 border border-[#c1ff72]/30 text-[#c1ff72] rounded-2xl shadow-md">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-teal-400 font-bold uppercase tracking-wider">Logs Count</span>
            <div className="text-xl font-black text-white font-display mt-0.5">
              {bmiHistory.length + calorieHistory.length + mealHistory.length + waterHistory.length}
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Bento Modules */}
      <div className="space-y-6">
        {/* Weight graph */}
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xs space-y-3">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-1.5"><Scale className="w-4 h-4 text-indigo-400" /> Weight Progress (kg)</span>
            <span className="text-[#c1ff72] font-display text-[10px]">Target: {profile.targetWeight} kg</span>
          </div>

          <div className="h-[180px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c1ff72" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#c1ff72" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={9} domain={['dataMin - 3', 'dataMax + 3']} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, backgroundColor: '#09090b', border: "1px solid #27272a", color: '#ffffff' }} />
                <Area type="monotone" dataKey="Weight" stroke="#c1ff72" strokeWidth={2} fillOpacity={1} fill="url(#weightGrad)" />
                <Line type="monotone" dataKey="Target" stroke="#f43f5e" strokeWidth={1} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calories Balance graph */}
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xs space-y-3">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-400" /> Consumed Calories (kcal)</span>
          </div>

          <div className="h-[180px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caloriesChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, backgroundColor: '#09090b', border: "1px solid #27272a", color: '#ffffff' }} />
                <Bar dataKey="Consumed" fill="#c1ff72" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Water trend graph */}
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 shadow-2xs space-y-3">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-zinc-500">
            <span className="flex items-center gap-1.5"><Droplet className="w-4 h-4 text-sky-400" /> Hydration Intake (ml)</span>
          </div>

          <div className="h-[180px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={waterChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={9} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, backgroundColor: '#09090b', border: "1px solid #27272a", color: '#ffffff' }} />
                <Area type="monotone" dataKey="amount" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#waterGrad)" name="ml Logged" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Badges / Achievements list */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-display">Trophy & Achievements</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{unlockedCount} of 5 Milestones Unlocked</p>
          </div>
          {unlockedCount > 0 && (
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-[#c1ff72]/10 border border-[#c1ff72]/20 rounded-xl text-[10px] font-bold text-[#c1ff72] hover:bg-[#c1ff72]/20 transition-all active-press"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Goals
            </button>
          )}
        </div>

        {/* Global Achievements Progress Bar */}
        <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
          <div 
            className="h-full bg-gradient-to-r from-teal-400 to-[#c1ff72] rounded-full transition-all duration-500"
            style={{ width: `${(unlockedCount / 5) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {achievementsList.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div 
                key={idx} 
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center space-y-2 relative overflow-hidden ${
                  item.unlocked 
                    ? "bg-zinc-900 border-zinc-800 shadow-md" 
                    : "bg-zinc-950/40 border-zinc-900 opacity-60"
                }`}
              >
                {/* Unlock status badge / lock indicator */}
                <div className="absolute top-2 right-2">
                  {item.unlocked ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3px]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center">
                      <Lock className="w-2.5 h-2.5 text-zinc-600" />
                    </div>
                  )}
                </div>

                <div className={`p-3 rounded-full ${item.unlocked ? item.color : item.lockedColor} shadow-xs`}>
                  <IconComp className="w-5 h-5" />
                </div>
                
                <h4 className="text-xs font-bold text-white leading-tight">{item.title}</h4>
                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                
                {item.unlocked ? (
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#c1ff72] bg-[#c1ff72]/10 px-2 py-0.5 rounded-full mt-1">
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded-full mt-1">
                    Locked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title="Fitness Achievements & Milestones"
        options={getShareOptions()}
        defaultSelectedIds={["milestones", "water_streak"]}
      />
    </div>
  );
}
