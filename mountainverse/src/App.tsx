import React, { useState, useEffect } from 'react';
import { MOUNTAINS } from './data/mountains';
import { Mountain } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ContinentSection } from './components/ContinentSection';
import { Globe3DViewer } from './components/3d/Globe3DViewer';
import { SevenSummits } from './components/SevenSummits';
import { ElevationChart } from './components/ElevationChart';
import { MountainComparison } from './components/MountainComparison';
import { GeologyTimeline } from './components/GeologyTimeline';
import { QuizGame } from './components/QuizGame';
import { EducationSection } from './components/EducationSection';
import { GallerySection } from './components/GallerySection';
import { ExpeditionsTimeline } from './components/ExpeditionsTimeline';
import { Footer } from './components/Footer';
import { MountainDetailModal } from './components/MountainDetailModal';
import { BookmarksModal } from './components/BookmarksModal';
import { Compass, Globe, Share2, Check, X } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [selectedMountain, setSelectedMountain] = useState<Mountain | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [savedMountainIds, setSavedMountainIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('mountainverse_saved');
      return stored ? JSON.parse(stored) : ['everest', 'matterhorn'];
    } catch {
      return ['everest', 'matterhorn'];
    }
  });
  const [bookmarksModalOpen, setBookmarksModalOpen] = useState(false);
  const [importedToastMessage, setImportedToastMessage] = useState<string | null>(null);

  // Parse URL query parameter ?expedition=everest,matterhorn,k2
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedIds = params.get('expedition');
      if (sharedIds) {
        const parsedList = sharedIds.split(',').filter((id) => MOUNTAINS.some((m) => m.id === id));
        if (parsedList.length > 0) {
          setSavedMountainIds((prev) => Array.from(new Set([...prev, ...parsedList])));
          setBookmarksModalOpen(true);
          setImportedToastMessage(`Imported ${parsedList.length} shared expedition peaks into your saved collection!`);
        }
      }
    } catch (e) {
      console.warn('URL parameter parsing failed:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mountainverse_saved', JSON.stringify(savedMountainIds));
    } catch (err) {
      console.error(err);
    }
  }, [savedMountainIds]);

  const handleToggleBookmark = (id: string) => {
    setSavedMountainIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'} font-sans selection:bg-sky-500 selection:text-white transition-colors duration-300`}>
      {/* Navbar */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onSelectMountain={(m) => setSelectedMountain(m)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        savedMountainIds={savedMountainIds}
        onToggleBookmark={handleToggleBookmark}
        onOpenBookmarksModal={() => setBookmarksModalOpen(true)}
      />

      {/* Hero Section */}
      <Hero
        onExploreClick={() => handleNavigate('continents')}
        on3DGlobeClick={() => handleNavigate('3d-explorer')}
      />

      {/* Continents & Mountain Cards Grid */}
      <ContinentSection
        onSelectMountain={(m) => setSelectedMountain(m)}
        savedMountainIds={savedMountainIds}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* 3D Interactive World Globe Section */}
      <section id="3d-explorer" className="py-20 bg-slate-950 text-white relative border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
              <Compass className="w-3.5 h-3.5" /> Planetary Geolocation
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              3D Interactive <span className="text-sky-400">Earth Globe</span>
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Rotate the globe to pinpoint alpine peaks, volcano clusters, and high-altitude mountain chains across continents.
            </p>
          </div>

          <Globe3DViewer
            onSelectMountain={(m) => setSelectedMountain(m)}
            className="h-[520px] w-full"
          />
        </div>
      </section>

      {/* Seven Summits Feature Section */}
      <SevenSummits onSelectMountain={(m) => setSelectedMountain(m)} />

      {/* Topographic Elevation Ranking Chart */}
      <ElevationChart />

      {/* Side-by-Side Head-to-Head Comparison */}
      <MountainComparison />

      {/* Geological Timeline & Plate Tectonics */}
      <GeologyTimeline />

      {/* Mountain Quiz Game */}
      <QuizGame />

      {/* Educational Articles & Guides */}
      <EducationSection />

      {/* Cinematic Photo Gallery */}
      <GallerySection />

      {/* Historical Mountaineering Expeditions Timeline */}
      <ExpeditionsTimeline />

      {/* Footer & Resources */}
      <Footer />

      {/* Individual Mountain Detail Modal (with 3D Viewer & Hotspots) */}
      <MountainDetailModal
        mountain={selectedMountain}
        onClose={() => setSelectedMountain(null)}
        isSaved={selectedMountain ? savedMountainIds.includes(selectedMountain.id) : false}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* Saved Expeditions Modal */}
      <BookmarksModal
        isOpen={bookmarksModalOpen}
        onClose={() => setBookmarksModalOpen(false)}
        savedMountainIds={savedMountainIds}
        onSelectMountain={(m) => setSelectedMountain(m)}
        onRemoveBookmark={handleToggleBookmark}
      />

      {/* Floating Notification Toast for Shared Expedition Collection Import */}
      {importedToastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-3 animate-fade-in border border-emerald-300">
          <Share2 className="w-4 h-4 shrink-0" />
          <span>{importedToastMessage}</span>
          <button
            onClick={() => setImportedToastMessage(null)}
            className="p-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-slate-950 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
