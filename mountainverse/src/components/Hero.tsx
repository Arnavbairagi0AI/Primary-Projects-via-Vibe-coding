import React, { useState } from 'react';
import { Hero3DCanvas } from './3d/Hero3DCanvas';
import { Compass, Sparkles, ArrowRight, Mountain, Globe, ShieldCheck, Sun, Flame, Award, Users } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  on3DGlobeClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, on3DGlobeClick }) => {
  const [timeOfDay, setTimeOfDay] = useState(14);

  const stats = [
    { label: 'Featured Peaks', value: '25+', icon: Mountain, color: 'text-sky-400' },
    { label: 'Continents Covered', value: '7 / 7', icon: Globe, color: 'text-amber-400' },
    { label: 'Mountain Ranges', value: '18', icon: Compass, color: 'text-emerald-400' },
    { label: 'UNESCO Sites', value: '42', icon: ShieldCheck, color: 'text-indigo-400' },
    { label: 'Highest Summit', value: '8,848m', icon: Award, color: 'text-rose-400' },
    { label: 'Active Volcanoes', value: '1,500+', icon: Flame, color: 'text-orange-400' }
  ];

  return (
    <section id="hero" className="relative min-h-screen flex flex-col justify-between pt-24 pb-12 overflow-hidden bg-[#020617] text-white">
      {/* Atmosphere Glow */}
      <div className="atmosphere z-0" />

      {/* 3D Canvas Background */}
      <Hero3DCanvas timeOfDay={timeOfDay} className="absolute inset-0 z-0 opacity-80" />

      {/* Subtle Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent z-1 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/80 via-transparent to-[#020617]/80 z-1 pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 text-center flex-1 flex flex-col items-center justify-center">
        {/* Badge Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-sky-500/30 bg-sky-500/5 text-sky-400 text-[10px] uppercase tracking-widest font-bold mb-6 shadow-xl animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span>Active Explorer Edition • 3D Alpine Observatory</span>
        </div>

        {/* Headline with Serif Italic Flair */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-5xl leading-none">
          <span className="font-serif italic font-light text-sky-200">Discover</span> World's{' '}
          <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
            Greatest Peaks
          </span>{' '}
          in 3D
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl font-normal leading-relaxed">
          Immerse yourself in cinematic 3D mountain exploration. Experience geological formations, tectonic shifts, and the world's most dangerous expeditions in ultra-premium fidelity.
        </p>

        {/* Call To Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onExploreClick}
            className="px-8 py-4 bg-sky-500 text-white font-bold rounded-sm btn-glow text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer group hover:bg-sky-400 transition-colors"
          >
            <Compass className="w-4 h-4 text-white group-hover:rotate-45 transition-transform" />
            Start Journey
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={on3DGlobeClick}
            className="px-8 py-4 border border-white/20 text-white font-bold rounded-sm text-xs uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-sky-400" />
            View World Globe
          </button>
        </div>
      </div>

      {/* Live Stats Ticker (Bottom) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-2xl glass border border-white/10 shadow-2xl">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="p-3 rounded-xl bg-slate-950/40 border border-white/5 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-white/10">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-100">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-[1.5px] text-slate-400 font-bold truncate">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
