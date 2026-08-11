import React from 'react';
import { MOUNTAINS } from '../data/mountains';
import { Mountain } from '../types';
import { Award, Globe, Compass, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';

interface SevenSummitsProps {
  onSelectMountain: (mountain: Mountain) => void;
}

export const SevenSummits: React.FC<SevenSummitsProps> = ({ onSelectMountain }) => {
  const sevenSummits = MOUNTAINS.filter((m) => m.isSevenSummit);

  return (
    <section id="seven-summits" className="py-20 bg-[#020617] text-white relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase tracking-widest font-bold mb-3">
            <Award className="w-3.5 h-3.5" /> Ultimate Mountaineering Challenge
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            The Legendary <span className="font-serif italic font-light text-amber-300">Seven Summits</span>
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
            The highest mountain peak on each of the seven continents. Standing atop all seven is one of the world's most coveted mountaineering achievements.
          </p>
        </div>

        {/* 7 Summits Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sevenSummits.map((mountain) => (
            <div
              key={mountain.id}
              className="group relative rounded-2xl overflow-hidden glass border border-amber-500/30 border-l-4 border-l-amber-500 hover:border-amber-400/80 shadow-2xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={mountain.heroImage}
                  alt={mountain.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/30 to-transparent" />

                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-[9px] tracking-widest uppercase shadow-lg">
                  {mountain.continent}
                </div>

                <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-amber-500/30 text-xs font-bold text-amber-300">
                  {mountain.elevationMeters.toLocaleString()} m
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    {mountain.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">
                    {mountain.country.join(', ')} • {mountain.mountainRange}
                  </p>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-2 font-normal">
                    {mountain.tagline}
                  </p>
                </div>

                <button
                  onClick={() => onSelectMountain(mountain)}
                  className="mt-4 w-full py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-500/30"
                >
                  <Compass className="w-4 h-4" /> Inspect 3D Peak
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
