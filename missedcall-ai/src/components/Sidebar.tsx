import React from 'react';
import { PhoneMissed, Calendar, CreditCard, LogOut, ChevronLeft, ChevronRight, MessageSquareCode, Globe, LogIn, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isCollapsed, 
  setIsCollapsed 
}) => {
  const { signOutUser, user, firebaseUser, setShowAuthModal } = useApp();

  const menuItems = [
    { id: 'logs', name: 'Missed Call Logs', icon: PhoneMissed },
    { id: 'scheduler', name: 'Smart Scheduler', icon: Calendar },
    { id: 'billing', name: 'Billing & Access', icon: CreditCard },
  ];

  return (
    <div 
      className={`bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col transition-all duration-300 relative ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      id="app-sidebar"
    >
      {/* Brand / Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
          <MessageSquareCode className="w-5 h-5 text-slate-950 font-bold" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col animate-fadeIn">
            <span className="font-sans font-bold text-lg tracking-tight text-white leading-none">MissedCall AI</span>
            <span className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-1 font-semibold">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" /> FULL ACCESS
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              id={`sidebar-tab-${item.id}`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/10' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-800/60">
          {/* Booking Preview Portal Tab */}
          <button
            id="sidebar-tab-booking-preview"
            onClick={() => setActiveTab('booking-preview')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
              activeTab === 'booking-preview'
                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/10'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Globe className={`w-5 h-5 shrink-0 ${activeTab === 'booking-preview' ? 'text-indigo-300' : 'text-slate-400'}`} />
            {!isCollapsed && (
              <div className="flex flex-col items-start truncate">
                <span className="leading-tight">Booking Portal</span>
                <span className="text-[9px] text-slate-400 leading-tight">Public Customer View</span>
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* User Information Summary */}
      {!isCollapsed && user && (
        <div className="p-4 mx-3 mb-4 bg-slate-800/50 border border-slate-800 rounded-xl">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider leading-none mb-1">Active Business</span>
            <span className="text-sm font-semibold text-white truncate leading-snug">{user.businessName}</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">
                FULL LIFETIME ACCESS
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle & Auth buttons */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        {/* Collapse Button */}
        <button
          id="sidebar-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full hidden md:flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <ChevronLeft className="w-5 h-5 shrink-0" />
          )}
          {!isCollapsed && <span>Collapse Menu</span>}
        </button>

        {/* Auth Button */}
        {firebaseUser ? (
          <button
            id="sidebar-logout-btn"
            onClick={signOutUser}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        ) : (
          <button
            id="sidebar-login-btn"
            onClick={() => setShowAuthModal(true)}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-all"
          >
            <LogIn className="w-5 h-5 shrink-0 text-amber-400" />
            {!isCollapsed && <span>Sign In / Connect Email</span>}
          </button>
        )}
      </div>
    </div>
  );
};
