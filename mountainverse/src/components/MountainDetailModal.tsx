import React, { useState } from 'react';
import { Mountain, RouteHotspot } from '../types';
import { Mountain3DViewer } from './3d/Mountain3DViewer';
import { ARViewModal } from './ARViewModal';
import { X, Compass, Globe, Bookmark, MapPin, Thermometer, Wind, ShieldCheck, Award, Clock, ArrowUpRight, Flame, Layers, Sparkles, AlertTriangle, Activity, Camera } from 'lucide-react';

interface MountainDetailModalProps {
  mountain: Mountain | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleBookmark: (id: string) => void;
}

export const MountainDetailModal: React.FC<MountainDetailModalProps> = ({
  mountain,
  onClose,
  isSaved,
  onToggleBookmark
}) => {
  if (!mountain) return null;

  const [activeTab, setActiveTab] = useState<'3d' | 'specs' | 'geology' | 'climate' | 'routes' | 'history' | 'gallery'>('3d');
  const [selectedHotspot, setSelectedHotspot] = useState<RouteHotspot | null>(mountain.hotspots[0] || null);
  const [arModalOpen, setArModalOpen] = useState<boolean>(false);

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
        <div className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white flex flex-col">
          {/* Modal Top Sticky Navigation Header */}
          <div className="sticky top-0 z-20 px-6 py-4 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black">{mountain.name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{mountain.continent}</span>
                  <span>•</span>
                  <span>{mountain.mountainRange}</span>
                  <span>•</span>
                  <span className="text-sky-400 font-bold">{mountain.elevationMeters.toLocaleString()}m</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setArModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                title="Launch Simulated AR Topography View"
              >
                <Camera className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Simulate AR View</span>
              </button>

              <button
                onClick={() => onToggleBookmark(mountain.id)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSaved
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <Bookmark className="w-4 h-4 fill-current" />
                <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

        {/* Modal Main Body Tabs Navbar */}
        <div className="px-6 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: '3d', label: '3D Interactive Model', icon: Compass },
            { id: 'specs', label: 'Overview & Specs', icon: Layers },
            { id: 'geology', label: 'Geology & Uplift', icon: Activity },
            { id: 'climate', label: 'Climate & Ecosystem', icon: Thermometer },
            { id: 'routes', label: 'Routes & Difficulty', icon: MapPin },
            { id: 'history', label: 'History & Culture', icon: Award },
            { id: 'gallery', label: 'Photos & Drone Views', icon: Sparkles }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Tab Content Area */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* TAB 1: 3D MODEL & HOTSPOT INTERACTION */}
          {activeTab === '3d' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Mountain3DViewer
                    mountain={mountain}
                    onHotspotClick={(spot) => setSelectedHotspot(spot)}
                    className="h-[480px] w-full"
                  />
                </div>

                {/* Hotspots Info Panel */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Compass className="w-4 h-4" /> 3D Route Waypoint Inspector
                    </div>

                    {selectedHotspot ? (
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedHotspot.type === 'summit' ? 'bg-amber-500/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
                          }`}>
                            {selectedHotspot.type.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{selectedHotspot.altitudeMeters.toLocaleString()}m</span>
                        </div>
                        <h4 className="text-lg font-bold text-white">{selectedHotspot.name}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{selectedHotspot.description}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Click any pin on the 3D model to inspect high-altitude camp specs and key geological features.</p>
                    )}

                    <div className="mt-4 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">All Hotspots ({mountain.hotspots.length})</div>
                      <div className="space-y-1.5">
                        {mountain.hotspots.map((spot) => (
                          <button
                            key={spot.id}
                            onClick={() => setSelectedHotspot(spot)}
                            className={`w-full p-2 rounded-lg text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
                              selectedHotspot?.id === spot.id ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-slate-900/60 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span>{spot.name}</span>
                            <span className="font-mono">{spot.altitudeMeters}m</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Rotate 360° to view all cliff faces & glaciers
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OVERVIEW & SPECS */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Topographic Metrics</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Summit Elevation</span>
                    <span className="font-bold text-white">{mountain.elevationMeters.toLocaleString()} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Topographic Prominence</span>
                    <span className="font-bold text-white">{mountain.prominenceMeters.toLocaleString()} m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Topographic Isolation</span>
                    <span className="font-bold text-white">{mountain.isolationKm.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Coordinates</span>
                    <span className="font-mono text-sky-300">{mountain.latitude.toFixed(4)}° N, {mountain.longitude.toFixed(4)}° E</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Geographic Status</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Continent</span>
                    <span className="font-bold text-white">{mountain.continent}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Countries</span>
                    <span className="font-bold text-white">{mountain.country.join(', ')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Mountain Range</span>
                    <span className="font-bold text-white">{mountain.mountainRange}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Seven Summit</span>
                    <span className={`font-bold ${mountain.isSevenSummit ? 'text-amber-400' : 'text-slate-400'}`}>{mountain.isSevenSummit ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 md:col-span-2 lg:col-span-1">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Conservation & Tagline</div>
                <p className="text-xs italic text-amber-300 font-serif">"{mountain.tagline}"</p>
                <p className="text-xs text-slate-300 leading-relaxed">{mountain.conservationStatus}</p>
              </div>
            </div>
          )}

          {/* TAB 3: GEOLOGY & UPLIFT */}
          {activeTab === 'geology' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-sky-400 mb-2">Tectonic Formation</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{mountain.geology.tectonicOrigin}</p>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Formation Type</span>
                      <span className="font-bold text-white">{mountain.geology.formationType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Primary Rock Composition</span>
                      <span className="font-bold text-white">{mountain.geology.rockType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Estimated Orogeny Age</span>
                      <span className="font-bold text-white">{mountain.geology.ageMillionsYears} Million Years</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Geological Marvel
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">{mountain.geology.funFact}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLIMATE & ECOSYSTEM */}
          {activeTab === 'climate' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <Thermometer className="w-4 h-4" /> Alpine Weather Conditions
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="block text-slate-400 text-[10px]">Summer Avg</span>
                    <span className="text-lg font-bold text-white">{mountain.climate.summerAvgTempC}°C</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="block text-slate-400 text-[10px]">Winter Avg</span>
                    <span className="text-lg font-bold text-rose-400">{mountain.climate.winterAvgTempC}°C</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="block text-slate-400 text-[10px]">Glaciers Count</span>
                    <span className="text-lg font-bold text-sky-300">{mountain.climate.glaciersCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="block text-slate-400 text-[10px]">Peak Wind</span>
                    <span className="text-lg font-bold text-amber-400">{mountain.climate.predominantWindKmH} km/h</span>
                  </div>
                </div>

                {mountain.climate.deathZoneAltitudeMeters && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Death Zone Threshold: Above {mountain.climate.deathZoneAltitudeMeters}m (Bottled oxygen required)</span>
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Biodiversity & Ecosystem</div>
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-2">Native Wildlife</div>
                  <div className="flex flex-wrap gap-1.5">
                    {mountain.climate.wildlife.map((w, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                        🐾 {w}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-2">Alpine Flora</div>
                  <div className="flex flex-wrap gap-1.5">
                    {mountain.climate.flora.map((f, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                        🌿 {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TREKKING ROUTES */}
          {activeTab === 'routes' && (
            <div className="space-y-4">
              {mountain.routes.map((route, i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-sky-400">{route.name}</h4>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      route.difficulty === 'Extreme' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {route.difficulty} Difficulty
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{route.description}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800">
                    <div><span className="text-slate-400">Duration:</span> <span className="font-bold text-white">{route.durationDays} Days</span></div>
                    <div><span className="text-slate-400">Distance:</span> <span className="font-bold text-white">{route.distanceKm} km</span></div>
                    <div><span className="text-slate-400">Success Rate:</span> <span className="font-bold text-emerald-400">{route.successRatePercent}%</span></div>
                    <div><span className="text-slate-400">Best Season:</span> <span className="font-bold text-amber-300">{route.bestMonths.join(', ')}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 6: HISTORY & CULTURAL HERITAGE */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Cultural Significance</div>
                <p className="text-xs text-slate-300 leading-relaxed">{mountain.culturalSignificance}</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Famous Expeditions</div>
                <div className="space-y-3">
                  {mountain.expeditions.map((exp, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-white">{exp.year}</span> — <span className="text-sky-300 font-semibold">{exp.climberName}</span> ({exp.nationalities.join(', ')})
                        <p className="text-slate-400 mt-0.5">{exp.notes}</p>
                      </div>
                      {exp.isFirstAscent && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold self-start sm:self-center">
                          First Ascent
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: GALLERY */}
          {activeTab === 'gallery' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mountain.galleryImages.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-slate-800 h-48 group">
                  <img src={img} alt={`${mountain.name} ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* AR Camera Overlay Modal */}
    <ARViewModal
      mountain={mountain}
      isOpen={arModalOpen}
      onClose={() => setArModalOpen(false)}
    />
  </>
  );
};
