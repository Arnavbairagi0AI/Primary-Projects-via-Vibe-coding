import React, { useState } from 'react';

export const ProfileTab: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');

  return (
    <div className="pt-20 pb-28 px-4 md:px-12 max-w-[1280px] mx-auto animate-fadeIn">
      {/* XP Progress Section */}
      <section className="mb-6 mt-2">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0b1c30]">Level 12</h2>
            <p className="text-xs font-bold text-[#3525cd] uppercase tracking-wider">
              SCHOLAR STATUS
            </p>
          </div>
          <p className="text-sm font-semibold text-[#464555]">2,450 / 3,000 XP</p>
        </div>

        <div className="h-3 w-full bg-[#e5eeff] rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-[#3525cd] to-[#712ae2] w-[82%] rounded-full shadow-[0_0_12px_rgba(77,68,227,0.4)] transition-all duration-1000"></div>
        </div>
      </section>

      {/* Toggle Filter */}
      <div className="flex justify-center mb-6">
        <div className="bg-[#eff4ff] p-1 rounded-xl flex gap-1 border border-slate-200">
          <button
            onClick={() => setTimeframe('weekly')}
            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
              timeframe === 'weekly'
                ? 'bg-white text-[#3525cd] shadow-xs'
                : 'text-[#464555] hover:text-[#0b1c30]'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
              timeframe === 'monthly'
                ? 'bg-white text-[#3525cd] shadow-xs'
                : 'text-[#464555] hover:text-[#0b1c30]'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* Focus Score (Large Card) */}
        <div className="md:col-span-8 bg-[#eff4ff] rounded-[24px] p-6 border border-[#c7c4d8] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3525cd]/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-[#3525cd]/10 transition-colors"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-[#0b1c30]">Focus Score</h3>
                <p className="text-sm text-[#464555]">Based on deep work sessions</p>
              </div>
              <span className="material-symbols-outlined text-[#3525cd] text-4xl">bolt</span>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-6xl font-extrabold leading-none text-[#3525cd]">88</span>
              <span className="text-xl font-bold text-[#464555]">/100</span>
              <span className="ml-4 flex items-center text-[#712ae2] font-bold text-sm bg-[#eaddff]/60 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-base mr-0.5">trending_up</span> +12%
              </span>
            </div>

            <p className="mt-4 text-sm text-[#464555] max-w-md leading-relaxed">
              Your cognitive endurance has increased by 45 minutes on average this week compared to last.
            </p>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="md:col-span-4 bg-[#4f46e5] text-white rounded-[24px] p-6 border border-[#3525cd]/20 shadow-lg relative overflow-hidden ai-shimmer flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined fill text-amber-300">
                auto_awesome
              </span>
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">
                AI INSIGHTS
              </h3>
            </div>

            <div className="space-y-3">
              <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-xs">
                <p className="text-xs font-semibold text-white/70 mb-0.5">Peak Performance</p>
                <p className="text-sm text-white">
                  You focus best at <span className="font-bold text-amber-300">7:00 PM</span>.
                </p>
              </div>

              <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-xs border-t-2 border-[#8a4cfc]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                  RECOMMENDED ACTION
                </p>
                <p className="text-sm text-white font-medium mt-1 leading-snug">
                  Revise Chemistry tonight to solidify your weak areas in organic compounds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hours Studied Per Subject */}
        <div className="md:col-span-6 bg-[#eff4ff] rounded-[24px] p-6 border border-[#c7c4d8] shadow-xs">
          <h3 className="text-xs font-bold text-[#464555] uppercase tracking-wider mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3525cd]">schedule</span>
            HOURS PER SUBJECT
          </h3>

          <div className="space-y-5">
            <div className="group">
              <div className="flex justify-between text-sm font-semibold mb-2 text-[#0b1c30]">
                <span>Mathematics</span>
                <span className="font-bold text-[#3525cd]">12.5h</span>
              </div>
              <div className="h-2.5 bg-[#e5eeff] rounded-full overflow-hidden">
                <div className="h-full bg-[#3525cd] w-[75%] rounded-full group-hover:bg-[#712ae2] transition-colors"></div>
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between text-sm font-semibold mb-2 text-[#0b1c30]">
                <span>Physics</span>
                <span className="font-bold text-[#3525cd]">8.2h</span>
              </div>
              <div className="h-2.5 bg-[#e5eeff] rounded-full overflow-hidden">
                <div className="h-full bg-[#3525cd] w-[50%] rounded-full group-hover:bg-[#712ae2] transition-colors"></div>
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between text-sm font-semibold mb-2 text-[#0b1c30]">
                <span>Chemistry</span>
                <span className="font-bold text-[#3525cd]">4.1h</span>
              </div>
              <div className="h-2.5 bg-[#e5eeff] rounded-full overflow-hidden">
                <div className="h-full bg-[#3525cd] w-[25%] rounded-full group-hover:bg-[#712ae2] transition-colors"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy Trend Bar Chart */}
        <div className="md:col-span-6 bg-[#eff4ff] rounded-[24px] p-6 border border-[#c7c4d8] shadow-xs">
          <h3 className="text-xs font-bold text-[#464555] uppercase tracking-wider mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#3525cd]">analytics</span>
            ACCURACY TREND
          </h3>

          <div className="h-40 flex items-end justify-between gap-2 px-2">
            <div className="w-full bg-[#3525cd]/20 rounded-t-lg transition-all" style={{ height: '40%' }} title="Mon: 40%"></div>
            <div className="w-full bg-[#3525cd]/30 rounded-t-lg transition-all" style={{ height: '55%' }} title="Tue: 55%"></div>
            <div className="w-full bg-[#3525cd]/40 rounded-t-lg transition-all" style={{ height: '45%' }} title="Wed: 45%"></div>
            <div className="w-full bg-[#3525cd]/60 rounded-t-lg transition-all" style={{ height: '70%' }} title="Thu: 70%"></div>
            <div className="w-full bg-[#3525cd]/80 rounded-t-lg transition-all" style={{ height: '85%' }} title="Fri: 85%"></div>
            <div className="w-full bg-[#3525cd] rounded-t-lg transition-all" style={{ height: '92%' }} title="Sat: 92%"></div>
            <div className="w-full bg-[#712ae2] rounded-t-lg shadow-[0_0_15px_rgba(113,42,226,0.3)] transition-all" style={{ height: '95%' }} title="Sun: 95%"></div>
          </div>

          <div className="flex justify-between mt-4 text-[11px] font-bold text-[#464555] uppercase tracking-wider">
            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
          </div>
        </div>

        {/* Cognitive Heatmap */}
        <div className="md:col-span-12 lg:col-span-7 bg-[#eff4ff] rounded-[24px] p-6 border border-[#c7c4d8] shadow-xs">
          <h3 className="text-xs font-bold text-[#464555] uppercase tracking-wider mb-4">
            Cognitive Heatmap
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="material-symbols-outlined text-emerald-600 mb-1">verified</span>
              <p className="text-[10px] font-bold text-emerald-800 tracking-wider">STRONG</p>
              <p className="text-base font-bold text-[#0b1c30]">Calculus</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="material-symbols-outlined text-emerald-600 mb-1">verified</span>
              <p className="text-[10px] font-bold text-emerald-800 tracking-wider">STRONG</p>
              <p className="text-base font-bold text-[#0b1c30]">Dynamics</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <span className="material-symbols-outlined text-rose-600 mb-1">warning</span>
              <p className="text-[10px] font-bold text-rose-800 tracking-wider">WEAK</p>
              <p className="text-base font-bold text-[#0b1c30]">Organic</p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <span className="material-symbols-outlined text-rose-600 mb-1">warning</span>
              <p className="text-[10px] font-bold text-rose-800 tracking-wider">WEAK</p>
              <p className="text-base font-bold text-[#0b1c30]">History</p>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="md:col-span-12 lg:col-span-5 bg-[#eff4ff] rounded-[24px] p-6 border border-[#c7c4d8] shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-[#464555] uppercase tracking-wider">
              Achievements
            </h3>
            <button className="text-xs font-bold text-[#3525cd] hover:underline">
              View All
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            <div className="flex-shrink-0 text-center group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 to-amber-500 p-1 mb-2 shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 fill">
                    military_tech
                  </span>
                </div>
              </div>
              <p className="text-xs font-medium text-[#464555]">Night Owl</p>
            </div>

            <div className="flex-shrink-0 text-center group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-300 to-indigo-600 p-1 mb-2 shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-indigo-600 fill">
                    auto_stories
                  </span>
                </div>
              </div>
              <p className="text-xs font-medium text-[#464555]">Polymath</p>
            </div>

            <div className="flex-shrink-0 text-center group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-300 to-rose-500 p-1 mb-2 shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-rose-600 fill">
                    timer
                  </span>
                </div>
              </div>
              <p className="text-xs font-medium text-[#464555]">Sprint Master</p>
            </div>

            <div className="flex-shrink-0 text-center opacity-50">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-dashed border-[#c7c4d8] p-1 mb-2 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#464555]">lock</span>
              </div>
              <p className="text-xs font-medium text-[#464555]">Locked</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
