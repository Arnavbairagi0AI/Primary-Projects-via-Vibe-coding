import React from 'react';
import { useApp } from '../context/AppContext';
import { PhoneCall, ShieldCheck, Sparkles, Clock, UserCheck, LogIn } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, firebaseUser, simulateNewIncomingCall, setShowAuthModal } = useApp();

  const handleSimulateCall = () => {
    simulateNewIncomingCall();
  };

  return (
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="app-header">
      {/* Title / Brand */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h1 className="font-sans font-bold text-xl tracking-tight text-slate-900" id="header-business-title">
            {user?.businessName || 'Business Suite'}
          </h1>
          {user?.role && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              <ShieldCheck className="w-3 h-3 text-indigo-500" />
              {user.role}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5" id="header-current-billing-status">
          <Clock className="w-3 h-3" /> Access Level: 
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" /> FULL UNLOCKED PREMIUM ACCESS
          </span>
        </p>
      </div>

      {/* Action triggers */}
      <div className="flex items-center gap-3">
        {!firebaseUser ? (
          <button
            id="header-sign-in-btn"
            onClick={() => setShowAuthModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors border border-slate-200"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sign In / Create Account</span>
          </button>
        ) : (
          <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> {firebaseUser.email}
          </span>
        )}

        {/* Live Simulator Trigger Button */}
        <button
          id="simulate-call-btn"
          onClick={handleSimulateCall}
          className="relative inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <PhoneCall className="w-4 h-4 text-amber-400 group-hover:animate-bounce" />
          <span>Simulate Missed Call</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        </button>
      </div>
    </header>
  );
};
