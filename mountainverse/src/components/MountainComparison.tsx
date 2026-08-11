import React, { useState } from 'react';
import { MOUNTAINS } from '../data/mountains';
import { Mountain } from '../types';
import { Mountain3DViewer } from './3d/Mountain3DViewer';
import { Layers, ArrowRightLeft, Thermometer, Wind, ShieldCheck, Compass, AlertTriangle, Activity } from 'lucide-react';

export const MountainComparison: React.FC = () => {
  const [mountain1, setMountain1] = useState<Mountain>(MOUNTAINS[0]); // Everest
  const [mountain2, setMountain2] = useState<Mountain>(MOUNTAINS[2]); // Matterhorn

  return (
    <section id="comparison" className="py-20 bg-[#020617] text-white relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] uppercase tracking-widest font-bold mb-3">
            <ArrowRightLeft className="w-3.5 h-3.5" /> Interactive Head-to-Head Analysis
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Side-by-Side <span className="font-serif italic font-light text-indigo-200">Mountain Comparison</span>
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base">
            Select any two mountains to benchmark their geometry, elevation, climate extremes, tectonic origins, and climbing difficulties.
          </p>
        </div>

        {/* Mountain Selectors Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-4 rounded-2xl glass border border-white/10">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Mountain #1</label>
            <select
              value={mountain1.id}
              onChange={(e) => {
                const found = MOUNTAINS.find((m) => m.id === e.target.value);
                if (found) setMountain1(found);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm font-bold text-sky-400 focus:outline-none focus:border-sky-400"
            >
              {MOUNTAINS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.continent} - {m.elevationMeters.toLocaleString()}m)
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-2xl glass border border-white/10">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Mountain #2</label>
            <select
              value={mountain2.id}
              onChange={(e) => {
                const found = MOUNTAINS.find((m) => m.id === e.target.value);
                if (found) setMountain2(found);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-400"
            >
              {MOUNTAINS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.continent} - {m.elevationMeters.toLocaleString()}m)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3D Render Side-by-Side Canvas Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-xs font-bold text-sky-400 mb-2 flex items-center gap-1.5">
              <Compass className="w-4 h-4" /> 3D Model: {mountain1.name}
            </div>
            <Mountain3DViewer mountain={mountain1} className="h-[360px] w-full" />
          </div>

          <div>
            <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
              <Compass className="w-4 h-4" /> 3D Model: {mountain2.name}
            </div>
            <Mountain3DViewer mountain={mountain2} className="h-[360px] w-full" />
          </div>
        </div>

        {/* Comparison Specs Table */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Metric</th>
                <th className="py-3 px-4 text-sky-400">{mountain1.name}</th>
                <th className="py-3 px-4 text-amber-400">{mountain2.name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Elevation</td>
                <td className="py-3 px-4 font-bold text-white">{mountain1.elevationMeters.toLocaleString()} m</td>
                <td className="py-3 px-4 font-bold text-white">{mountain2.elevationMeters.toLocaleString()} m</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Prominence</td>
                <td className="py-3 px-4 font-bold text-white">{mountain1.prominenceMeters.toLocaleString()} m</td>
                <td className="py-3 px-4 font-bold text-white">{mountain2.prominenceMeters.toLocaleString()} m</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Continent</td>
                <td className="py-3 px-4 text-slate-300">{mountain1.continent}</td>
                <td className="py-3 px-4 text-slate-300">{mountain2.continent}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Formation Type</td>
                <td className="py-3 px-4 text-slate-300">{mountain1.geology.formationType}</td>
                <td className="py-3 px-4 text-slate-300">{mountain2.geology.formationType}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Rock Type</td>
                <td className="py-3 px-4 text-slate-300">{mountain1.geology.rockType}</td>
                <td className="py-3 px-4 text-slate-300">{mountain2.geology.rockType}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Winter Temp Avg</td>
                <td className="py-3 px-4 font-bold text-rose-400">{mountain1.climate.winterAvgTempC}°C</td>
                <td className="py-3 px-4 font-bold text-rose-400">{mountain2.climate.winterAvgTempC}°C</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Climbing Difficulty</td>
                <td className="py-3 px-4 font-bold text-amber-300">{mountain1.routes[0]?.difficulty || 'N/A'}</td>
                <td className="py-3 px-4 font-bold text-amber-300">{mountain2.routes[0]?.difficulty || 'N/A'}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-400 font-medium">Glaciers Count</td>
                <td className="py-3 px-4 font-bold text-sky-300">{mountain1.climate.glaciersCount}</td>
                <td className="py-3 px-4 font-bold text-sky-300">{mountain2.climate.glaciersCount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
