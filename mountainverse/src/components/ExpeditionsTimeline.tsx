import React from 'react';
import { HISTORICAL_TIMELINE } from '../data/education';
import { Award, ShieldCheck, Flag, Clock, UserCheck } from 'lucide-react';

export const ExpeditionsTimeline: React.FC = () => {
  return (
    <section id="expeditions" className="py-20 bg-[#020617] text-white relative border-t border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] uppercase tracking-widest font-bold mb-3">
            <Award className="w-3.5 h-3.5" /> Human Exploration History
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Timeline of Great <span className="font-serif italic font-light text-sky-200">Expeditions</span>
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            From the 1786 birth of alpine climbing on Mont Blanc to modern speed records on 8,000-meter peaks.
          </p>
        </div>

        <div className="relative border-l-2 border-white/10 ml-4 sm:ml-32 space-y-8">
          {HISTORICAL_TIMELINE.map((event, i) => (
            <div key={i} className="relative pl-6 sm:pl-8 group">
              {/* Year Badge on Left for Desktop */}
              <div className="hidden sm:block absolute -left-32 top-0 text-right w-24">
                <span className="text-lg font-bold text-sky-400 font-mono">{event.year}</span>
              </div>

              {/* Dot Marker */}
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-sky-400 group-hover:bg-sky-400 transition-colors" />

              <div className="p-5 rounded-2xl glass border border-white/10 shadow-2xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="sm:hidden font-bold text-sky-400 text-sm font-mono">{event.year}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[9px] uppercase tracking-widest font-bold">
                    {event.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{event.location}</span>
                </div>

                <h3 className="text-lg font-bold text-white">{event.title}</h3>

                <p className="text-xs text-slate-300 leading-relaxed font-light">{event.description}</p>

                {event.heroClimber && (
                  <div className="pt-2 text-[11px] text-amber-300 font-medium flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> Explorer / Climbers: {event.heroClimber}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
