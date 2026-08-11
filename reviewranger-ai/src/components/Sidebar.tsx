import React from 'react';
import { TabType } from '../types';
import { LayoutDashboard, Sparkles, History, CreditCard, LogOut, Briefcase } from 'lucide-react';
import { auth } from '../firebase/config';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isActiveSubscription: boolean;
  businessName: string;
}

export default function Sidebar({ activeTab, onTabChange, isActiveSubscription, businessName }: SidebarProps) {
  const isOwner = auth.currentUser?.email?.toLowerCase() === 'neoedits2009@gmail.com';
  const menuItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generator' as TabType, label: 'Review Generator', icon: Sparkles, badge: isOwner ? 'Owner' : isActiveSubscription ? 'Pro' : 'Free' },
    { id: 'history' as TabType, label: 'History Logs', icon: History },
    { id: 'billing' as TabType, label: 'Billing & Plan', icon: CreditCard },
  ];

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <aside id="sidebar-container" className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 text-slate-400 border-r border-slate-800">
      <div className="flex flex-col flex-1 min-h-0">
        
        {/* Brand Header */}
        <div className="flex items-center h-16 px-6 bg-slate-950 border-b border-slate-800/80">
          <div className="relative flex items-center justify-center mr-3 shrink-0">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur-xs opacity-50"></div>
            <div className="relative bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-1.5 rounded-lg border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400 fill-indigo-400/10" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-white tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent flex items-center gap-1">
              Review<span className="text-indigo-400 font-black">Ranger</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-500/25 text-indigo-300 rounded border border-indigo-500/30">AI</span>
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">B2B India Local SEO</span>
          </div>
        </div>

        {/* Business Info Banner */}
        <div className="px-4 py-3 mx-3 my-4 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
            <Briefcase className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">{businessName || 'My Local Business'}</p>
            <p className="text-[10px] text-slate-400 truncate">{isOwner ? 'Founder Owner Workspace' : 'Active workspace'}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 py-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center px-3.5 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className={`ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider ${
                    item.badge === 'Owner'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : item.badge === 'Pro' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Area with User Profile and Logout */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col space-y-3">
          <button
            id="sidebar-signout-btn"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/20 hover:bg-slate-800/50 rounded-xl border border-slate-800/60 transition"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out Account
          </button>
          
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>v1.2 (LTS)</span>
            <span>Region: asia-south1</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
