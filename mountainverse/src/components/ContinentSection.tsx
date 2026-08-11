import React, { useState } from 'react';
import { MOUNTAINS, CONTINENTS_LIST } from '../data/mountains';
import { Mountain, Continent } from '../types';
import { Globe, Compass, ArrowUpRight, Bookmark, Layers, ShieldCheck, Flame, ExternalLink, Filter } from 'lucide-react';

interface ContinentSectionProps {
  onSelectMountain: (mountain: Mountain) => void;
  savedMountainIds: string[];
  onToggleBookmark: (id: string) => void;
}

export const ContinentSection: React.FC<ContinentSectionProps> = ({
  onSelectMountain,
  savedMountainIds,
  onToggleBookmark
}) => {
  const [selectedContinent, setSelectedContinent] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredMountains = MOUNTAINS.filter((m) => {
    const matchesContinent = selectedContinent === 'All' || m.continent === selectedContinent;
    const matchesSearch =
      m.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      m.country.some((c) => c.toLowerCase().includes(searchFilter.toLowerCase())) ||
      m.mountainRange.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesContinent && matchesSearch;
  });

  return (
    <section id="continents" className="py-20 bg-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] uppercase tracking-widest font-bold mb-3">
              <Globe className="w-3.5 h-3.5" /> Continental Exploration
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Explore Peaks by <span className="font-serif italic font-light text-sky-200">Continent</span>
            </h2>
            <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl font-normal">
              From the colossal 8,000m giants of Asia to the polar wilderness of Antarctica. Click any mountain to launch the interactive 3D model.
            </p>
          </div>

          {/* Search filter within section */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by country or range..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full md:w-64 px-4 py-2.5 rounded-xl glass border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Continent Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8">
          {CONTINENTS_LIST.map((continent) => {
            const isActive = selectedContinent === continent;
            const count =
              continent === 'All'
                ? MOUNTAINS.length
                : MOUNTAINS.filter((m) => m.continent === continent).length;

            return (
              <button
                key={continent}
                onClick={() => setSelectedContinent(continent)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-white btn-glow shadow-lg'
                    : 'glass text-slate-400 hover:text-white hover:bg-white/5 border border-white/10'
                }`}
              >
                {continent}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800/80 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mountain Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMountains.map((mountain) => {
            const isSaved = savedMountainIds.includes(mountain.id);

            return (
              <div
                key={mountain.id}
                className="group relative rounded-2xl overflow-hidden glass border border-white/10 border-l-4 border-l-sky-500 hover:border-sky-500/60 shadow-2xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Hero Image / 3D Canvas Thumbnail Header */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={mountain.heroImage}
                    alt={mountain.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-sky-300">
                      {mountain.continent}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {mountain.isSevenSummit && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/90 backdrop-blur-md text-[10px] font-bold text-slate-950 uppercase tracking-widest shadow-md">
                          7 Summits
                        </span>
                      )}
                      <button
                        onClick={() => onToggleBookmark(mountain.id)}
                        className={`p-2 rounded-lg backdrop-blur-md border transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-950/80 text-white border-white/10 hover:text-amber-400'
                        }`}
                        title="Save to My Expeditions"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Elevation Pill (Bottom Right of Image) */}
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-white/10 text-xs font-bold text-white">
                    {mountain.elevationMeters.toLocaleString()} m
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
                      {mountain.name}
                    </h3>
                    <p className="text-xs text-sky-400 font-semibold mt-0.5 uppercase tracking-wider">
                      {mountain.mountainRange} • {mountain.country.join(', ')}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {mountain.summary}
                    </p>
                  </div>

                  {/* Key Stats Chips */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    <div>
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Prominence</span>
                      <span className="text-white font-semibold">{mountain.prominenceMeters.toLocaleString()}m</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Formation</span>
                      <span className="text-slate-300 font-medium">{mountain.geology.formationType}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Difficulty</span>
                      <span className={`font-bold ${mountain.routes[0]?.difficulty === 'Extreme' ? 'text-rose-400' : mountain.routes[0]?.difficulty === 'Advanced' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {mountain.routes[0]?.difficulty || 'Moderate'}
                      </span>
                    </div>
                  </div>

                  {/* Inspect 3D Model CTA Button */}
                  <button
                    onClick={() => onSelectMountain(mountain)}
                    className="mt-4 w-full py-2.5 rounded-xl glass hover:bg-sky-500 hover:text-white text-sky-400 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10 group-hover:border-sky-500"
                  >
                    <Compass className="w-4 h-4" /> Inspect in 3D
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
