import React, { useState } from "react";
import { UserProfile } from "../types";
import { db, doc, setDoc, signOut, auth } from "../lib/firebase";
import { User, Phone, Mail, Scale, Dumbbell, ShieldAlert, Heart, LogOut, Moon, Sun, Save } from "lucide-react";

interface ProfileSettingsProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onSignOut: () => void;
}

export default function ProfileSettings({
  profile,
  onUpdateProfile,
  onSignOut
}: ProfileSettingsProps) {
  const [fullName, setFullName] = useState<string>(profile.fullName);
  const [age, setAge] = useState<number>(profile.age);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(profile.gender);
  const [height, setHeight] = useState<number>(profile.height);
  const [weight, setWeight] = useState<number>(profile.weight);
  const [targetWeight, setTargetWeight] = useState<number>(profile.targetWeight);
  const [phoneNumber, setPhoneNumber] = useState<string>(profile.phoneNumber);
  const [email, setEmail] = useState<string>(profile.email || "");
  const [fitnessGoal, setFitnessGoal] = useState<string>(profile.fitnessGoal);
  const [activityLevel, setActivityLevel] = useState<any>(profile.activityLevel);
  const [foodPreference, setFoodPreference] = useState<any>(profile.foodPreference);
  const [medicalConditions, setMedicalConditions] = useState<string>(profile.medicalConditions);
  const [dailySleep, setDailySleep] = useState<number>(profile.dailySleep);
  const [dailyWaterGoal, setDailyWaterGoal] = useState<number>(profile.dailyWaterGoal);

  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const updated: UserProfile = {
      ...profile,
      fullName,
      age,
      gender,
      height,
      weight,
      targetWeight,
      phoneNumber,
      email,
      fitnessGoal,
      activityLevel,
      foodPreference,
      medicalConditions,
      dailySleep,
      dailyWaterGoal
    };

    try {
      if (profile.uid && !profile.uid.startsWith("local_")) {
        await setDoc(doc(db, "users", profile.uid), updated);
      } else {
        localStorage.setItem("fittrack_profile", JSON.stringify(updated));
      }
      onUpdateProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.warn("Failed to save profile changes to Cloud, saved locally:", err);
      localStorage.setItem("fittrack_profile", JSON.stringify(updated));
      onUpdateProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutFlow = async () => {
    if (window.confirm("Are you sure you want to log out of your session? This will reset local data.")) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("SignOut failed, proceeding:", e);
      }
      localStorage.clear();
      onSignOut();
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    // Standard visual class trigger
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Profile Info */}
      <div className="bg-zinc-900 text-slate-100 p-5 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#c1ff72] to-lime-400 rounded-3xl flex items-center justify-center text-[#050505] font-extrabold text-xl shadow-lg">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-base font-black font-display text-white leading-tight">{fullName}</h2>
            <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">UID: {profile.uid.substring(0, 10)}... (Guest Auth)</p>
          </div>
        </div>

        {/* Support section clickable link */}
        <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-850 space-y-1 text-xs">
          <div className="font-bold text-[#c1ff72] flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 animate-pulse" /> Support & Assistance Contact
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed">Need custom advice or encountering database errors?</p>
          <div className="pt-1">
            Call support:{" "}
            <a 
              href="tel:+918796300923" 
              className="text-white font-bold underline hover:text-[#c1ff72]"
            >
              +91 8796300923
            </a>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleUpdate} className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
            <User className="w-4 h-4 text-[#c1ff72]" /> Settings & Health Specs
          </span>
          {success && (
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              Profile updated!
            </span>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Age (Years)</label>
            <input
              type="number"
              required
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            >
              <option value="Male" className="bg-zinc-900">Male</option>
              <option value="Female" className="bg-zinc-900">Female</option>
              <option value="Other" className="bg-zinc-900">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Height (cm)</label>
            <input
              type="number"
              required
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Weight (kg)</label>
            <input
              type="number"
              required
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Target Weight (kg)</label>
            <input
              type="number"
              required
              value={targetWeight}
              onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Water Goal (ml)</label>
            <input
              type="number"
              required
              value={dailyWaterGoal}
              onChange={(e) => setDailyWaterGoal(parseInt(e.target.value) || 2000)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Fitness Goal</label>
            <select
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            >
              <option value="Weight Loss" className="bg-zinc-900">Weight Loss</option>
              <option value="Muscle Gain" className="bg-zinc-900">Muscle Gain</option>
              <option value="Maintain Health" className="bg-zinc-900">Maintain Health</option>
              <option value="Stamina" className="bg-zinc-900">Stamina</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Preference</label>
            <select
              value={foodPreference}
              onChange={(e) => setFoodPreference(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            >
              <option value="Any" className="bg-zinc-900">Any Foods</option>
              <option value="Vegetarian" className="bg-zinc-900">Vegetarian</option>
              <option value="Non-Vegetarian" className="bg-zinc-900">Non-Vegetarian</option>
              <option value="Vegan" className="bg-zinc-900">Vegan</option>
              <option value="Diabetic" className="bg-zinc-900">Diabetic</option>
              <option value="High Protein" className="bg-zinc-900">High Protein</option>
              <option value="Low Carb" className="bg-zinc-900">Low Carb</option>
            </select>
          </div>
        </div>

        {/* Contact details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Phone Contact</label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Email Contact</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-xs focus:outline-none focus:border-[#c1ff72]"
            />
          </div>
        </div>

        {/* Theme customization */}
        <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-2xl border border-zinc-850 text-xs text-zinc-400">
          <span className="font-bold flex items-center gap-1.5">
            {darkMode ? <Moon className="w-4 h-4 text-[#c1ff72]" /> : <Sun className="w-4 h-4 text-amber-500" />}
            Visual Dark Mode
          </span>
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none ${darkMode ? "bg-[#c1ff72]" : "bg-zinc-800"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-zinc-950 transition-transform ${darkMode ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#c1ff72] text-[#050505] font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active-press transition-all"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving Changes..." : "Save Profile Settings"}
        </button>
      </form>

      {/* Logout button */}
      <button
        onClick={handleLogoutFlow}
        className="w-full p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-3xl flex items-center justify-center gap-2 active-press transition-colors hover:bg-rose-500/20"
      >
        <LogOut className="w-4 h-4" />
        Log out Session
      </button>
    </div>
  );
}
