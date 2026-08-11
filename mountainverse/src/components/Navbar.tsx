import React, { useState, useEffect } from 'react';
import { MOUNTAINS } from '../data/mountains';
import { Mountain } from '../types';
import { cacheMountainDataLocally, getStoredCacheStatus, setSimulatedOfflineMode } from '../utils/offlineCache';
import { Mountain as MountainIcon, Search, Bookmark, Sun, Moon, Compass, Globe, Award, BookOpen, Layers, Menu, X, Sparkles, HelpCircle, Wifi, WifiOff, HardDrive } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onSelectMountain: (mountain: Mountain) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  savedMountainIds: string[];
  onToggleBookmark: (id: string) => void;
  onOpenBookmarksModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  onSelectMountain,
  darkMode,
  setDarkMode,
  savedMountainIds,
  onOpenBookmarksModal
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Offline cache state
  const [cacheStatus, setCacheStatus] = useState(getStoredCacheStatus());
  const [showOfflineMenu, setShowOfflineMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pre-cache mountain data automatically on mount
  useEffect(() => {
    cacheMountainDataLocally(MOUNTAINS).then((updated) => {
      setCacheStatus(updated);
    });
  }, []);

  const handleToggleSimulatedOffline = () => {
    const nextVal = !cacheStatus.isSimulatedOffline;
    setSimulatedOfflineMode(nextVal);
    setCacheStatus((prev) => ({ ...prev, isSimulatedOffline: nextVal }));
  };

  const searchResults = searchQuery.trim()
    ? MOUNTAINS.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.continent.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.mountainRange.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.country.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const navLinks = [
    { id: 'hero', label: 'Home', icon: MountainIcon },
    { id: 'continents', label: 'Continents', icon: Globe },
    { id: '3d-explorer', label: '3D Globe', icon: Compass },
    { id: 'seven-summits', label: 'Seven Summits', icon: Award },
    { id: 'elevation-chart', label: 'Stats & Charts', icon: Layers },
    { id: 'comparison', label: 'Compare', icon: Layers },
    { id: 'quiz', label: 'Quiz', icon: HelpCircle },
    { id: 'education', label: 'Articles', icon: BookOpen },
    { id: 'gallery', label: 'Gallery', icon: Sparkles }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass border-b border-white/10 shadow-2xl py-3'
          : 'glass border-b border-white/5 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('hero')}
          className="flex items-center gap-2.5 group cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
            <MountainIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tighter uppercase text-white">
              Mountain<span className="text-sky-400">Verse</span>
            </span>
            <span className="block text-[9px] uppercase font-bold tracking-[2px] text-slate-400">
              Active Explorer
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-950/40 p-1 rounded-full border border-white/10 backdrop-blur-md">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Search, Bookmarks, Theme, Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search mountain, range..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                className="w-36 sm:w-52 pl-9 pr-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all"
              />
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute right-0 top-11 w-72 max-h-80 overflow-y-auto rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                  Mountains ({searchResults.length})
                </div>
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectMountain(m);
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-center gap-2.5 transition-colors group cursor-pointer"
                  >
                    <img
                      src={m.heroImage}
                      alt={m.name}
                      className="w-8 h-8 rounded-md object-cover border border-slate-700"
                    />
                    <div className="overflow-hidden">
                      <div className="text-xs font-medium text-white group-hover:text-sky-400 truncate">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {m.continent} • {m.elevationMeters.toLocaleString()}m
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Offline Cache Status Badge */}
          <div className="relative">
            <button
              onClick={() => setShowOfflineMenu(!showOfflineMenu)}
              className={`p-2 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                cacheStatus.isSimulatedOffline
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : cacheStatus.isCached
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-900/80 text-slate-400 border-slate-700/80'
              }`}
              title="Offline Data Caching Strategy"
            >
              {cacheStatus.isSimulatedOffline ? (
                <WifiOff className="w-4 h-4 text-amber-400" />
              ) : (
                <HardDrive className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Offline Cache Control Menu */}
            {showOfflineMenu && (
              <div className="absolute right-0 top-11 w-72 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-4 z-50 text-white space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4" /> Offline Cache System
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cacheStatus.isCached ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {cacheStatus.isCached ? '100% Pre-cached' : 'Caching...'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  All 10 global peak 3D meshes, elevation maps, and geological datasets are stored locally for field access without internet connection.
                </p>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">Simulate Offline Mode:</span>
                  <button
                    onClick={handleToggleSimulatedOffline}
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      cacheStatus.isSimulatedOffline
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {cacheStatus.isSimulatedOffline ? 'ON (Offline)' : 'OFF (Online)'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bookmarks Button */}
          <button
            onClick={onOpenBookmarksModal}
            className="relative p-2 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-amber-400 hover:border-amber-400/50 transition-all cursor-pointer"
            title="Saved Mountain Expeditions"
          >
            <Bookmark className="w-4 h-4" />
            {savedMountainIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {savedMountainIds.length}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-sky-400 transition-all cursor-pointer"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-400" />}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/95 border-b border-slate-800 p-4 space-y-2 backdrop-blur-2xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                  activeSection === link.id
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
