import React from 'react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string; icon: string; fillIcon?: boolean }[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'ai-tutor', label: 'AI Tutor', icon: 'smart_toy' },
    { id: 'notes', label: 'Notes', icon: 'description' },
    { id: 'planner', label: 'Planner', icon: 'calendar_month' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 rounded-t-2xl glass-header border-t border-white/30 shadow-[0_-4px_20px_rgba(53,37,205,0.06)] flex justify-around items-center h-20 px-2 pb-safe">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-[#4f46e5]/15 text-[#3525cd] rounded-full px-4 py-1.5 font-bold shadow-xs'
                : 'text-[#464555] opacity-75 hover:opacity-100 hover:text-[#3525cd]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-2xl ${isActive ? 'fill' : ''}`}
            >
              {tab.icon}
            </span>
            <span className="text-[11px] font-medium tracking-wide mt-0.5">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
