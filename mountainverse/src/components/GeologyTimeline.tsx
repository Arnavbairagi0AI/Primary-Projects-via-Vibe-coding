import React, { useState } from 'react';
import { Activity, Layers, Sparkles, ChevronRight, RefreshCw } from 'lucide-react';

export const GeologyTimeline: React.FC = () => {
  const [step, setStep] = useState(0);

  const stages = [
    {
      title: '1. Pangea & The Ancient Tethys Ocean (250 Million Years Ago)',
      subtitle: 'Continental Drift & Sedimentation',
      description: 'All Earth continents were fused into supercontinent Pangea. Rivers washed mud, sand, and marine organic life into the shallow Tethys Ocean floor, depositing thousands of meters of sedimentary marine limestone.',
      visualNote: 'Ocean floor covered in ammonites & marine crinoids.',
      accentColor: 'from-blue-600 to-teal-500'
    },
    {
      title: '2. Plate Tectonic Breakup & Indian Drift (100 Million Years Ago)',
      subtitle: 'High-Speed Continental Migration',
      description: 'Supercontinent Gondwana broke apart. The Indian Tectonic Plate detached and drifted rapidly northward across the equator toward the Eurasian Plate at speeds exceeding 15 cm per year.',
      visualNote: 'Subduction zone consuming ancient Tethys seafloor oceanic crust.',
      accentColor: 'from-amber-500 to-orange-600'
    },
    {
      title: '3. Continental Collision & Orogeny Uplift (50 Million Years Ago)',
      subtitle: 'Crustal Crumpling & Mountain Building',
      description: 'The buoyant continental crusts of India and Eurasia slammed together. Neither crust could sink, causing thousands of kilometers of rock layers to buckle, fold, fault, and thrust skyward into the Himalayas and Tibetan Plateau.',
      visualNote: 'Sea floor limestone pushed upward to become mountain peak summits!',
      accentColor: 'from-sky-500 to-indigo-600'
    },
    {
      title: '4. Glacial Carving & Modern Alpine Topography (Present Day)',
      subtitle: 'Glacial Erosion & Active Uplift',
      description: 'Glaciers cut deep U-shaped valleys, hanging cirques, and pyramidal horns (like the Matterhorn). Tectonic compression continues today, forcing peaks like Everest higher by ~5 mm every year.',
      visualNote: 'Ongoing seismic activity and active glacier movement.',
      accentColor: 'from-indigo-500 to-purple-600'
    }
  ];

  return (
    <section id="geology" className="py-20 bg-[#020617] text-white relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] uppercase tracking-widest font-bold mb-3">
            <Activity className="w-3.5 h-3.5" /> Earth System Science
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Geological Timeline & <span className="font-serif italic font-light text-indigo-200">Tectonic Uplift</span>
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Step through 250 million years of continental drift, oceanic subduction, and mountain building.
          </p>
        </div>

        {/* Step Navigation Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {stages.map((stg, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                step === i
                  ? 'glass border-indigo-500 shadow-xl shadow-indigo-500/10'
                  : 'glass border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Stage {i + 1}</div>
              <div className="text-xs font-bold text-white mt-1 truncate">{stg.subtitle}</div>
            </button>
          ))}
        </div>

        {/* Stage Interactive Card */}
        <div className="p-8 rounded-3xl glass border border-white/10 shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stages[step].accentColor}`} />

          <div className="max-w-3xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] uppercase tracking-widest font-bold inline-block">
              Stage {step + 1} of 4
            </span>

            <h3 className="text-2xl sm:text-3xl font-bold text-white">{stages[step].title}</h3>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">{stages[step].description}</p>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Key Geological Observation: {stages[step].visualNote}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => setStep((step - 1 + stages.length) % stages.length)}
              className="px-4 py-2 rounded-xl glass text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              Previous Stage
            </button>

            <button
              onClick={() => setStep((step + 1) % stages.length)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold uppercase tracking-widest text-white btn-glow transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              Next Stage <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
