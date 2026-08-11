import React, { useState, useEffect } from "react";
import { UserProfile, VisitorLead } from "../types";
import { db, auth, setDoc, addDoc, doc, collection, signInAnonymously, googleProvider, signInWithPopup } from "../lib/firebase";
import { Heart, Activity, User, Phone, Mail, Award, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<number>(1);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Form states
  const [fullName, setFullName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [fitnessGoal, setFitnessGoal] = useState<string>("Weight Loss");
  
  // Step 2 Onboarding details
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>("Male");
  const [height, setHeight] = useState<number>(170); // cm
  const [weight, setWeight] = useState<number>(70); // kg
  const [targetWeight, setTargetWeight] = useState<number>(65); // kg
  const [activityLevel, setActivityLevel] = useState<'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active'>("Moderately Active");
  const [foodPreference, setFoodPreference] = useState<'Any' | 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Diabetic' | 'High Protein' | 'Low Carb'>("Any");
  const [medicalConditions, setMedicalConditions] = useState<string>("");
  const [dailySleep, setDailySleep] = useState<number>(8);
  const [dailyWaterGoal, setDailyWaterGoal] = useState<number>(2000);

  // Pre-emptively start Firebase anonymous sign-in in the background on mount
  useEffect(() => {
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        // Anonymous sign-in may be disabled in console; gracefully fallback to local guest mode
        console.warn("Background pre-emptive anonymous sign-in unavailable, local guest mode enabled.", err?.message || err);
      });
    }
  }, []);

  // Direct instant access without signing in or email
  const handleDirectInstantAccess = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser ? auth.currentUser.uid : "local_guest_user";
      const instantProfile: UserProfile = {
        uid,
        fullName: fullName.trim() || "Guest Fitness User",
        age: 25,
        gender: "Male",
        height: 172,
        weight: 70,
        phoneNumber: phoneNumber.trim() || "+91 0000000000",
        email: email.trim() || "guest@local.com",
        fitnessGoal: fitnessGoal || "Weight Loss",
        activityLevel: "Moderately Active",
        foodPreference: "Any",
        medicalConditions: "None",
        dailySleep: 8,
        dailyWaterGoal: 2500,
        targetWeight: 65,
        createdAt: new Date().toISOString()
      };

      if (auth.currentUser) {
        setDoc(doc(db, "users", uid), instantProfile).catch(err => console.warn(err));
      }
      localStorage.setItem("fittrack_profile", JSON.stringify(instantProfile));
      onComplete(instantProfile);
    } catch (err) {
      console.warn("Instant access setup fallback:", err);
      const instantProfile: UserProfile = {
        uid: "local_guest_user",
        fullName: "Guest Fitness User",
        age: 25,
        gender: "Male",
        height: 172,
        weight: 70,
        phoneNumber: "+91 0000000000",
        email: "guest@local.com",
        fitnessGoal: "Weight Loss",
        activityLevel: "Moderately Active",
        foodPreference: "Any",
        medicalConditions: "None",
        dailySleep: 8,
        dailyWaterGoal: 2500,
        targetWeight: 65,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("fittrack_profile", JSON.stringify(instantProfile));
      onComplete(instantProfile);
    } finally {
      setLoading(false);
    }
  };

  // Capture Lead and Register Guest/User
  const handleNextStep = async () => {
    if (step === 1) {
      const finalName = fullName.trim() || "Guest Fitness User";
      const finalPhone = phoneNumber.trim() || "+91 0000000000";
      setFullName(finalName);
      setPhoneNumber(finalPhone);

      setError("");
      setLoading(true);

      try {
        // Collect Visitor Lead Information
        const today = new Date();
        const dateStr = today.toISOString().split("T")[0];
        const timeStr = today.toTimeString().split(" ")[0].substring(0, 5);
        const deviceType = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop";

        const lead: VisitorLead = {
          fullName: finalName,
          phoneNumber: finalPhone,
          email: email || undefined,
          fitnessGoal,
          date: dateStr,
          time: timeStr,
          deviceType,
          timestamp: Date.now()
        };

        // Write lead in background
        addDoc(collection(db, "visitorLeads"), lead).catch(err => {
          console.error("Error logging visitor lead in background:", err);
        });

        if (!auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (authErr) {
            console.warn("Pre-emptive anonymous auth failed. Continuing in local-only Guest mode:", authErr);
          }
        }

        setStep(2);
      } catch (err: any) {
        console.error("Error creating visitor session:", err);
        setStep(2);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!height || !weight || !age || !targetWeight) {
      setError("Please fill in your age, height, current weight and target weight.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const uid = auth.currentUser ? auth.currentUser.uid : "local_guest_user";
      const profile: UserProfile = {
        uid,
        fullName,
        age,
        gender,
        height,
        weight,
        phoneNumber,
        email: email || (auth.currentUser ? auth.currentUser.email : "") || "guest@local.com",
        fitnessGoal,
        activityLevel,
        foodPreference,
        medicalConditions: medicalConditions || "None declared",
        dailySleep,
        dailyWaterGoal,
        targetWeight,
        createdAt: new Date().toISOString()
      };

      if (auth.currentUser) {
        // Save user profile to Firestore
        await setDoc(doc(db, "users", uid), profile);
      } else {
        localStorage.setItem("fittrack_profile", JSON.stringify(profile));
      }
      onComplete(profile);
    } catch (err: any) {
      console.warn("Error saving user profile to Cloud, falling back to local storage:", err);
      // Fallback
      const profile: UserProfile = {
        uid: "local_guest_user",
        fullName,
        age,
        gender,
        height,
        weight,
        phoneNumber,
        email: email || "guest@local.com",
        fitnessGoal,
        activityLevel,
        foodPreference,
        medicalConditions: medicalConditions || "None declared",
        dailySleep,
        dailyWaterGoal,
        targetWeight,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("fittrack_profile", JSON.stringify(profile));
      onComplete(profile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="onboarding_container" className="flex flex-col min-h-screen bg-slate-900 text-slate-100 justify-between p-6">
      {/* Header */}
      <div className="flex flex-col items-center mt-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#c1ff72] flex items-center justify-center shadow-lg shadow-[#c1ff72]/20 mb-3 animate-pulse">
          <Heart className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-3xl font-bold font-display tracking-tight text-white">FitTrack AI</h1>
        <p className="text-xs text-[#c1ff72] mt-1 uppercase tracking-widest font-semibold">Personal AI Health Coach</p>
      </div>

      {/* Main Card */}
      <div className="my-auto w-full max-w-md mx-auto bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/50 p-6 shadow-xl">
        {step === 1 ? (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white font-display">Welcome to FitTrack AI</h2>
              <p className="text-sm text-slate-400 mt-1">Let's collect a few visitor details to start your custom fitness journey.</p>
            </div>

            {error && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#c1ff72] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 87963 00923"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#c1ff72] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="e.g. user@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#c1ff72] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Main Fitness Goal</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Weight Loss", "Muscle Gain", "Maintain Health", "Stamina"].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setFitnessGoal(goal)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                        fitnessGoal === goal
                          ? "bg-[#c1ff72] text-black border-[#c1ff72] font-semibold"
                          : "bg-slate-900/30 border-slate-700 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleDirectInstantAccess}
                disabled={loading}
                className="w-full bg-[#c1ff72] text-[#050505] font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 shadow-lg shadow-[#c1ff72]/20 cursor-pointer text-sm"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? "Loading Full Access..." : "Direct Instant Access (No Email / Sign-Up Required)"}
              </button>

              <div className="flex items-center my-2 text-zinc-600 text-[10px] uppercase font-bold tracking-widest justify-center gap-2">
                <span className="h-[1px] bg-zinc-800 flex-1"></span>
                <span>or customize details</span>
                <span className="h-[1px] bg-zinc-800 flex-1"></span>
              </div>

              <button
                onClick={handleNextStep}
                disabled={loading}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 border border-zinc-700 text-xs"
              >
                Start Health Assessment
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCompleteOnboarding} className="space-y-4">
            <div className="text-center">
              <div className="flex justify-between items-center mb-1">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-xs bg-[#c1ff72]/10 text-[#c1ff72] font-semibold px-2 py-0.5 rounded-full border border-[#c1ff72]/20">Step 2 of 2</span>
              </div>
              <h2 className="text-lg font-bold text-white font-display">Personalize Your AI Coach</h2>
              <p className="text-xs text-slate-400">Provide these parameters to auto-calculate BMI and calibrate calorie goals.</p>
            </div>

            {error && (
              <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="overflow-y-auto max-h-[360px] pr-1 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                  >
                    <option value="Male" className="bg-slate-800">Male</option>
                    <option value="Female" className="bg-slate-800">Female</option>
                    <option value="Other" className="bg-slate-800">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min="50"
                    max="250"
                    required
                    value={height}
                    onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Current Weight (kg)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    required
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Weight (kg)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    required
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Daily Sleep (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={dailySleep}
                    onChange={(e) => setDailySleep(parseFloat(e.target.value) || 8)}
                    className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#c1ff72]"
                >
                  <option value="Sedentary" className="bg-slate-800">Sedentary (Little to no exercise)</option>
                  <option value="Lightly Active" className="bg-slate-800">Lightly Active (Light exercise 1-3 days/week)</option>
                  <option value="Moderately Active" className="bg-slate-800">Moderately Active (Moderate exercise 3-5 days/week)</option>
                  <option value="Very Active" className="bg-slate-800">Very Active (Hard exercise 6-7 days/week)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Food Preference</label>
                  <select
                    value={foodPreference}
                    onChange={(e) => setFoodPreference(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
                  >
                    <option value="Any" className="bg-slate-800">Any Foods</option>
                    <option value="Vegetarian" className="bg-slate-800">Vegetarian</option>
                    <option value="Non-Vegetarian" className="bg-slate-800">Non-Vegetarian</option>
                    <option value="Vegan" className="bg-slate-800">Vegan</option>
                    <option value="Diabetic" className="bg-slate-800">Diabetic Friendly</option>
                    <option value="High Protein" className="bg-slate-800">High Protein</option>
                    <option value="Low Carb" className="bg-slate-800">Low Carb</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Daily Water Goal (ml)</label>
                  <input
                    type="number"
                    step="250"
                    min="500"
                    max="10000"
                    required
                    value={dailyWaterGoal}
                    onChange={(e) => setDailyWaterGoal(parseInt(e.target.value) || 2000)}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Medical Conditions / Injuries (Optional)</label>
                <textarea
                  placeholder="e.g. Hypertension, Back injury, Asthma, None"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-[#c1ff72] placeholder-slate-500 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c1ff72] text-[#050505] font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? "Saving Profile..." : "Launch FitTrack AI"}
              <Award className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>

      {/* Footer support details */}
      <div className="text-center text-slate-500 text-[11px] mt-4">
        By continuing, you agree to onboarding. Need help? Call Support:{" "}
        <a href="tel:+918796300923" className="text-[#c1ff72] font-semibold underline hover:text-lime-300">+91 8796300923</a>
      </div>
    </div>
  );
}
