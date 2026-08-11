import React from 'react';
import { TabType } from '../types';

interface HomeTabProps {
  onNavigateTab: (tab: TabType) => void;
  onQuickAction: (actionType: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onNavigateTab, onQuickAction }) => {
  return (
    <div className="pt-20 pb-28 px-4 md:px-12 max-w-[1280px] mx-auto animate-fadeIn">
      {/* Welcome Greeting */}
      <section className="mb-6 mt-2">
        <h2 className="text-2xl md:text-3xl font-bold text-[#0b1c30] mb-1">
          Good Morning, Arnav 👋
        </h2>
        <p className="text-sm md:text-base text-[#464555]">
          Your AI tutor is ready for another focused session.
        </p>
      </section>

      {/* Bento Grid Stats & Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 mb-8">
        {/* 7-day Study Streak */}
        <div className="md:col-span-4 m3-card p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-amber-500 text-4xl fill">
              local_fire_department
            </span>
            <span className="text-xs font-bold tracking-wider text-[#464555] bg-[#e5eeff] rounded-full px-3 py-1">
              STREAK
            </span>
          </div>
          <div className="mt-4">
            <div className="text-5xl font-extrabold text-[#0b1c30]">7</div>
            <div className="text-sm font-medium text-[#464555] mt-1">
              Days consistent! Keep it up.
            </div>
          </div>
        </div>

        {/* Today's Progress Circular Chart */}
        <div className="md:col-span-4 m3-card p-6 flex flex-col items-center justify-center relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              className="text-[#d3e4fe]"
              cx="64"
              cy="64"
              fill="transparent"
              r="54"
              stroke="currentColor"
              strokeWidth="12"
            />
            <circle
              className="text-[#3525cd] transition-all duration-1000 ease-out"
              cx="64"
              cy="64"
              fill="transparent"
              r="54"
              stroke="currentColor"
              strokeDasharray="339.29"
              strokeDashoffset="101.78"
              strokeLinecap="round"
              strokeWidth="12"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <span className="text-2xl font-bold text-[#0b1c30]">70%</span>
            <span className="text-[11px] font-medium text-[#464555]">Today's Goal</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-[#464555] text-center">
            3.5 / 5 Hours Study Time
          </p>
        </div>

        {/* Weekly Analytics Mini Bar Chart */}
        <div className="md:col-span-4 m3-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-[#0b1c30]">Weekly Overview</span>
            <span className="material-symbols-outlined text-[#3525cd] text-lg">
              insights
            </span>
          </div>

          <div className="flex items-end justify-between h-24 gap-2 px-1">
            <div className="w-full bg-[#4f46e5]/25 rounded-t-lg h-[40%]" title="Mon: 2h"></div>
            <div className="w-full bg-[#4f46e5]/25 rounded-t-lg h-[60%]" title="Tue: 3h"></div>
            <div className="w-full bg-[#4f46e5]/25 rounded-t-lg h-[85%]" title="Wed: 4.2h"></div>
            <div className="w-full bg-[#4f46e5]/25 rounded-t-lg h-[50%]" title="Thu: 2.5h"></div>
            <div className="w-full bg-[#4f46e5]/25 rounded-t-lg h-[75%]" title="Fri: 3.8h"></div>
            <div className="w-full bg-[#3525cd] rounded-t-lg h-[100%] shadow-xs" title="Sat: 5h"></div>
            <div className="w-full bg-[#d3e4fe] rounded-t-lg h-[15%]" title="Sun: 0.5h"></div>
          </div>

          <div className="flex justify-between mt-3 text-xs font-semibold text-[#464555]">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span className="text-[#3525cd] font-bold">S</span>
            <span>S</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-[#464555] uppercase mb-4 tracking-wider">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => onQuickAction('scan')}
            className="m3-card p-5 flex flex-col items-center justify-center gap-3 hover:bg-[#4f46e5]/5 active:scale-95 transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#eaddff] flex items-center justify-center text-[#25005a] group-hover:bg-[#8a4cfc] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">document_scanner</span>
            </div>
            <span className="text-sm font-semibold text-[#0b1c30]">Scan Notes</span>
          </button>

          <button
            onClick={() => onQuickAction('pdf')}
            className="m3-card p-5 flex flex-col items-center justify-center gap-3 hover:bg-[#4f46e5]/5 active:scale-95 transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#ffd8e7] flex items-center justify-center text-[#3d0026] group-hover:bg-[#a63274] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">upload_file</span>
            </div>
            <span className="text-sm font-semibold text-[#0b1c30]">Upload PDF</span>
          </button>

          <button
            onClick={() => onNavigateTab('ai-tutor')}
            className="m3-card p-5 flex flex-col items-center justify-center gap-3 hover:bg-[#4f46e5]/5 active:scale-95 transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#4f46e5]/20 flex items-center justify-center text-[#3525cd] group-hover:bg-[#3525cd] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <span className="text-sm font-semibold text-[#0b1c30]">Ask AI</span>
          </button>

          <button
            onClick={() => onQuickAction('quiz')}
            className="m3-card p-5 flex flex-col items-center justify-center gap-3 hover:bg-[#4f46e5]/5 active:scale-95 transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#c7c4d8]/40 flex items-center justify-center text-[#0b1c30] group-hover:bg-[#464555] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">quiz</span>
            </div>
            <span className="text-sm font-semibold text-[#0b1c30]">Create Quiz</span>
          </button>
        </div>
      </section>

      {/* Recommended Section */}
      <section className="mb-8">
        <h3 className="text-xs font-bold text-[#464555] uppercase mb-4 tracking-wider">
          Recommended
        </h3>
        <div 
          onClick={() => onNavigateTab('ai-tutor')}
          className="m3-card overflow-hidden group cursor-pointer border border-slate-200 hover:border-[#3525cd]/40 transition-all"
        >
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-2/5 h-48 md:h-auto overflow-hidden relative bg-slate-900">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVt6wDjNOnOWp5wULU1U_vCUAMXqCyyTreSrNS4k4QfXBcrXqi32WKPdgt6KaAtNe2_Pm4gcavWAhK8KfJ-QHbst4f2PD3KNCbhBgBANpQ8-3XWo12zwk5tM65IGaaog2S_SEIZr0u7T73Uleb_MHF4-C9KMUG_3Ej8pLuWRWmi-Qdo8VZpACOes8sM7Cp7p3QKWl2dIvBQA0JUFYYtewNHi42CXOyvVOUqCu_NxWALmFFcGjE_4ug"
                alt="Quantum Physics Simulation"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between bg-white">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-[#3525cd]/10 text-[#3525cd] font-bold text-xs px-3 py-1 rounded-full tracking-wide">
                    CONTINUE LEARNING
                  </span>
                  <span className="text-[#464555] text-xs font-medium">45 mins left</span>
                </div>
                <h4 className="text-xl font-bold text-[#0b1c30] mb-2 group-hover:text-[#3525cd] transition-colors">
                  Physics - Quantum Mechanics
                </h4>
                <p className="text-sm text-[#464555] mb-4 leading-relaxed">
                  Deep dive into Heisenberg's Uncertainty Principle and wave functions with AI-generated simulations.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-[#464555]">
                  <span>Progress</span>
                  <span>65%</span>
                </div>
                <div className="w-full h-2 bg-[#d3e4fe] rounded-full overflow-hidden">
                  <div className="bg-[#3525cd] h-full w-[65%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Suggestion Banner */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-[#4f46e5]/10 via-[#8a4cfc]/10 to-[#3525cd]/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 border border-[#3525cd]/20 shadow-sm">
          <div className="w-14 h-14 shrink-0 rounded-full bg-white flex items-center justify-center ai-pulse shadow-md">
            <span className="material-symbols-outlined text-[#712ae2] text-3xl fill">
              auto_awesome
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h5 className="text-xs font-bold text-[#712ae2] uppercase tracking-wider mb-1">
              AI SMART TIP
            </h5>
            <p className="text-base text-[#0b1c30] font-medium">
              Time for a 5-min revision of <span className="font-bold text-[#3525cd]">Calculus</span>. You're most focused right now!
            </p>
          </div>

          <button 
            onClick={() => onNavigateTab('ai-tutor')}
            className="w-full sm:w-auto bg-[#3525cd] text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-[#3525cd]/90 active:scale-95 transition-all shadow-md shrink-0"
          >
            Start Now
          </button>
        </div>
      </section>

      {/* Floating Action Button */}
      <button
        onClick={() => onNavigateTab('ai-tutor')}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#3525cd] to-[#712ae2] text-white flex items-center justify-center shadow-xl z-30 active:scale-90 transition-transform ai-pulse hover:scale-105"
        title="Open AI Tutor Chat"
      >
        <span className="material-symbols-outlined text-2xl fill">auto_awesome</span>
      </button>
    </div>
  );
};
