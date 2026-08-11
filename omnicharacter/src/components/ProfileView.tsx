/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  Trophy, 
  Award, 
  ShieldCheck, 
  Settings, 
  Users, 
  Flame, 
  Calendar, 
  Edit3, 
  CheckCircle2, 
  LogOut 
} from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile | null;
  onUpdateBio: (bio: string) => void;
  onUpdateName: (name: string) => void;
  onLogout: () => void;
}

export default function ProfileView({
  profile,
  onUpdateBio,
  onUpdateName,
  onLogout
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [bioText, setBioText] = useState(profile?.bio || '');
  const [nameText, setNameText] = useState(profile?.displayName || '');

  if (!profile) return null;

  const handleSave = () => {
    onUpdateBio(bioText);
    onUpdateName(nameText);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Profile Card Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-teal-400 shrink-0 shadow-lg relative">
          <img 
            src={profile.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150`} 
            alt={profile.displayName} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-3 min-w-0">
          {isEditing ? (
            <div className="space-y-2 max-w-sm">
              <input 
                type="text" 
                value={nameText}
                onChange={(e) => setNameText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
              />
              <textarea 
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-lg"
                >
                  Save Profile
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate">{profile.displayName}</h2>
                {profile.badges.includes('Verified') && (
                  <CheckCircle2 className="w-5 h-5 text-teal-400 fill-teal-400/10 shrink-0" />
                )}
              </div>
              <p className="text-slate-400 text-sm max-w-lg leading-relaxed">{profile.bio}</p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {profile.badges.map(badge => (
                  <span 
                    key={badge} 
                    className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto pt-4 sm:pt-0">
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-white rounded-xl text-xs font-semibold transition-all"
          >
            <Edit3 className="w-4 h-4" />
            Edit Biography
          </button>
          
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-xl text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Account
          </button>
        </div>
      </div>

      {/* Numerical Stats Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl">
            💬
          </div>
          <div>
            <p className="text-xs text-slate-500">Total Chats</p>
            <h4 className="font-extrabold text-white text-lg font-mono">{profile.stats.totalChats}</h4>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            🔥
          </div>
          <div>
            <p className="text-xs text-slate-500">Streak Days</p>
            <h4 className="font-extrabold text-white text-lg font-mono">{profile.stats.streakDays} days</h4>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
            ✨
          </div>
          <div>
            <p className="text-xs text-slate-500">AI Creations</p>
            <h4 className="font-extrabold text-white text-lg font-mono">{profile.stats.creationsCount}</h4>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            👑
          </div>
          <div>
            <p className="text-xs text-slate-500">Badges Unlocked</p>
            <h4 className="font-extrabold text-white text-lg font-mono">{profile.badges.length}</h4>
          </div>
        </div>

      </div>

      {/* Achievements grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-white text-lg tracking-tight">Milestones & Achievements</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {profile.achievements.map(ach => {
            const isUnlocked = ach.unlockedAt !== '';
            return (
              <div 
                key={ach.id}
                className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${
                  isUnlocked 
                    ? 'bg-slate-900/40 border-slate-800 text-slate-200' 
                    : 'bg-slate-950/40 border-slate-900/60 text-slate-600'
                }`}
              >
                <div className="text-3xl shrink-0 p-1.5 bg-slate-950 rounded-xl border border-slate-800/80">
                  {ach.icon}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`font-bold text-sm truncate ${isUnlocked ? 'text-white' : 'text-slate-600'}`}>{ach.name}</h4>
                    {isUnlocked && <span className="text-[10px] text-teal-400 font-semibold font-mono">OK</span>}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ach.id === 'first_chat' ? 'Started your first conversation.' : 'Design and forge custom character.'}</p>
                  {isUnlocked && (
                    <span className="text-[9px] text-slate-600 font-mono">Unlocked: {new Date(ach.unlockedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
