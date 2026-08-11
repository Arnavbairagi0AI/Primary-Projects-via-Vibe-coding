import React, { useState } from 'react';
import { MOUNTAINS } from '../data/mountains';
import { Layers, ArrowUp, Compass, Award, Info, Sparkles } from 'lucide-react';

export const ElevationChart: React.FC = () => {
  const sortedMountains = [...MOUNTAINS].sort((a, b) => b.elevationMeters - a.elevationMeters);
  const maxElevation = 9000; // Everest reference

  return (
    <section id="elevation-chart" className="py-20 bg-[#020617] text-white relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] uppercase tracking-widest font-bold mb-3">
            <Layers className="w-3.5 h-3.5" /> High-Precision Topographic Comparison
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Summit <span className="font-serif italic font-light text-sky-200">Elevation Ranking</span>
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Visualizing the elevation profiles of the world's most iconic mountains against sea level and atmospheric layers.
          </p>
        </div>

        {/* Interactive Elevation Bar Chart */}
        <div className="p-6 sm:p-8 rounded-3xl glass border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-3">
            <span className="font-bold uppercase tracking-widest text-[10px] text-sky-400">Mountain Name & Continent</span>
            <span className="font-mono text-[10px] uppercase tracking-widest">Summit Meters (Above Sea Level)</span>
          </div>

          <div className="space-y-4">
            {sortedMountains.map((m, index) => {
              const widthPercent = (m.elevationMeters / maxElevation) * 100;

              return (
                <div key={m.id} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 text-[11px] w-5">#{index + 1}</span>
                      <span className="font-bold text-white group-hover:text-sky-400 transition-colors">{m.name}</span>
                      <span className="text-[10px] text-slate-500">({m.continent})</span>
                    </div>
                    <span className="font-mono font-bold text-sky-300">{m.elevationMeters.toLocaleString()} m</span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        m.elevationMeters > 8000
                          ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-rose-500'
                          : m.elevationMeters > 5000
                          ? 'bg-gradient-to-r from-sky-500 to-amber-400'
                          : 'bg-gradient-to-r from-sky-600 to-emerald-400'
                      }`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mauna Kea Special Highlight Box */}
          <div className="mt-8 p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sky-300 block">Did You Know? (Tallest vs Highest)</span>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  While Mount Everest is the highest peak above sea level (8,848m), <strong>Mauna Kea in Hawaii</strong> is the tallest mountain on Earth from base to peak, rising 10,210m from its submerged floor on the Pacific Ocean bed!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
