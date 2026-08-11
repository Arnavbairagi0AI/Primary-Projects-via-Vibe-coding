import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { TenderCard } from './components/TenderCard';
import { TenderDetails } from './components/TenderDetails';
import { AnalyticsView } from './components/AnalyticsView';
import { CompanyProfileView } from './components/CompanyProfileView';
import { AdminPanel } from './components/AdminPanel';
import { CalendarView } from './components/CalendarView';
import { CrmView } from './components/CrmView';
import { AuthModal } from './components/AuthModal';
import { Tender, SavedTender } from './types';
import { 
  Building2, 
  Search, 
  MapPin, 
  Layers, 
  HelpCircle, 
  MessageSquare, 
  ArrowUpRight, 
  Sparkles, 
  BrainCircuit, 
  Clock, 
  CheckCircle2, 
  Bookmark, 
  ChevronRight,
  Filter,
  Trash2,
  ListFilter,
  Plus,
  Loader2
} from 'lucide-react';

function TenderFlowMain() {
  const { 
    currentUser, 
    userProfile, 
    currentCompany, 
    tenders, 
    savedTenders, 
    notifications, 
    submitFeedback,
    selectedStateFilter,
    setSelectedStateFilter
  } = useApp();

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [valueFilter, setValueFilter] = useState('All Values'); // All, Under 50L, 50L-2Cr, Over 2Cr

  // Feedback Form State
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Google Search Grounding States
  const [groundedTenders, setGroundedTenders] = useState<Tender[]>([]);
  const [groundedSources, setGroundedSources] = useState<{ title: string; url: string }[]>([]);
  const [isGroundingLoading, setIsGroundingLoading] = useState(false);
  const [showGroundedResults, setShowGroundedResults] = useState(false);

  const handleLiveSearchGrounding = async () => {
    setIsGroundingLoading(true);
    setShowGroundedResults(true);
    try {
      const response = await fetch('/api/tenders/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      if (!response.ok) throw new Error('Search grounding failed');
      const data = await response.json();
      setGroundedTenders(data.tenders || []);
      setGroundedSources(data.sources || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGroundingLoading(false);
    }
  };

  // Filter Tenders for List View
  const filteredTenders = tenders.filter(tender => {
    // 1. State Filter
    if (selectedStateFilter !== 'All States' && tender.state !== selectedStateFilter) {
      return false;
    }
    // 2. Category Filter
    if (categoryFilter !== 'All Categories' && tender.category !== categoryFilter) {
      return false;
    }
    // 3. Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = tender.title.toLowerCase().includes(query);
      const matchRef = tender.refNo.toLowerCase().includes(query);
      const matchAuth = tender.authority.toLowerCase().includes(query);
      if (!matchTitle && !matchRef && !matchAuth) return false;
    }
    // 4. Value Filter
    if (valueFilter !== 'All Values') {
      if (valueFilter === 'Under 50 Lakhs' && tender.value >= 5000000) return false;
      if (valueFilter === '50 Lakhs - 2 Crores' && (tender.value < 5000000 || tender.value > 20000000)) return false;
      if (valueFilter === 'Over 2 Crores' && tender.value <= 20000000) return false;
    }
    return true;
  });

  // Calculate dashboard stats
  const activeTendersCount = tenders.filter(t => t.status === 'active').length;
  const companySaved = savedTenders.filter(s => s.status !== 'ignored');
  const expiringSoonCount = tenders.filter(t => {
    const diff = new Date(t.deadline).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 7;
  }).length;

  // AI recommendations based on company profile (categories, states, keywords)
  const aiRecommendedTenders = tenders.filter(tender => {
    if (!currentUser || !currentCompany) return false;
    
    // Check if category matches company preferences
    const categoryMatches = (currentCompany.categories || []).includes(tender.category);
    
    // Check if state matches company preferences
    const stateMatches = (currentCompany.states || []).includes(tender.state);

    // Check if title or keywords contains any company keywords
    const keywordMatches = (currentCompany.keywords || []).some(k => 
      tender.title.toLowerCase().includes(k.toLowerCase()) || 
      tender.authority.toLowerCase().includes(k.toLowerCase())
    );

    return categoryMatches || stateMatches || keywordMatches;
  }).slice(0, 3); // top 3 matches

  // Handle viewing tender details
  const handleViewTender = (tender: Tender) => {
    setSelectedTender(tender);
    setActiveView('tender-details');
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackSubject || !feedbackMsg) return;
    await submitFeedback(feedbackSubject, feedbackMsg, feedbackRating);
    setFeedbackSubject('');
    setFeedbackMsg('');
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors pb-12 flex flex-col justify-between">
      
      <div>
        {/* Sticky Header Navigation */}
        <Navbar onSetActiveView={(view) => {
          setActiveView(view);
          setSelectedTender(null);
        }} activeView={activeView} onOpenAuth={() => setIsAuthOpen(true)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          
          {/* Active View Router */}
          {activeView === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* SaaS Dashboard KPIs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Active Tenders</span>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{activeTendersCount} Live</span>
                    <button onClick={() => setActiveView('tenders')} className="text-[10px] text-indigo-500 hover:underline font-semibold flex items-center">
                      Browse <ArrowUpRight className="h-3 w-3 ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saved (My Bid Board)</span>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{currentUser ? companySaved.length : 0} Saved</span>
                    {currentUser && (
                      <button onClick={() => setActiveView('workflow')} className="text-[10px] text-indigo-500 hover:underline font-semibold flex items-center">
                        Pipelines <ArrowUpRight className="h-3 w-3 ml-0.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Expiring within 7 Days</span>
                  <div className="flex justify-between items-end mt-1">
                    <span className={`text-xl sm:text-2xl font-black ${expiringSoonCount > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-800 dark:text-slate-100'}`}>
                      {expiringSoonCount} Expiring
                    </span>
                    <button onClick={() => { setSelectedStateFilter('All States'); setCategoryFilter('All Categories'); setValueFilter('All Values'); setActiveView('tenders'); }} className="text-[10px] text-indigo-500 hover:underline font-semibold">
                      Filter
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI Custom Matches</span>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
                      {currentUser && currentCompany ? aiRecommendedTenders.length : 0} Targets
                    </span>
                    <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Matched</span>
                  </div>
                </div>
              </div>

              {/* Main Content Layout (AI matching + Recent Activity Feed) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* AI Recommendations List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-5 w-5 text-indigo-500" />
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">AI Recommended Bidding Opportunities</h2>
                    </div>
                    {currentUser && currentCompany && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        Matching {currentCompany.name}
                      </span>
                    )}
                  </div>

                  {(aiRecommendedTenders.length > 0 ? aiRecommendedTenders : tenders.slice(0, 4)).length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 text-center space-y-3">
                      <Building2 className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Configure Preferences</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-2">
                        Configure your target categories, states, and business keywords under "Company Profile" to enable auto-recommended matches instantly.
                      </p>
                      <button onClick={() => setActiveView('company')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer">
                        Setup Company Preferences
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(aiRecommendedTenders.length > 0 ? aiRecommendedTenders : tenders.slice(0, 4)).map((tender) => (
                        <TenderCard key={tender.id} tender={tender} onViewDetails={handleViewTender} />
                      ))}
                    </div>
                  )}

                  {/* General Ingested Recent Tenders */}
                  <div className="pt-4 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recently Ingested Indian Government Tenders</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {tenders.slice(0, 4).map((tender) => (
                        <TenderCard key={tender.id} tender={tender} onViewDetails={handleViewTender} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right sidebar accessories (Notification drawer, feedback, stats) */}
                <div className="space-y-6">
                  
                  {/* SaaS performance analytics mini view */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="h-4 w-4" /> SaaS Core Analytics
                    </h3>
                    <p className="text-[11px] text-slate-400">View real-time ARR, MRR, state-wide bidding hubs, and customer churn metrics.</p>
                    <button 
                      onClick={() => setActiveView('analytics')}
                      className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex justify-center items-center gap-1"
                    >
                      Open Analytics Console <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Support Ticket Submission feedback */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" /> Support & Feedback Ticket
                    </h3>

                    {feedbackSubmitted && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-xl font-medium">
                        Ticket successfully generated in Firestore! Super admin has been alerted.
                      </div>
                    )}

                    <form onSubmit={handleFeedbackSubmit} className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Subject</label>
                        <input 
                          type="text" 
                          value={feedbackSubject}
                          onChange={(e) => setFeedbackSubject(e.target.value)}
                          placeholder="e.g. State-level filters accuracy"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Message Details</label>
                        <textarea 
                          value={feedbackMsg}
                          onChange={(e) => setFeedbackMsg(e.target.value)}
                          placeholder="Write bug descriptions, feature recommendations or support inquiries..."
                          rows={3}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-500"
                        />
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Rating</label>
                          <select 
                            value={feedbackRating}
                            onChange={(e) => setFeedbackRating(Number(e.target.value))}
                            className="bg-transparent text-xs text-indigo-400 font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="5">5 / 5 (Excellent)</option>
                            <option value="4">4 / 5 (Good)</option>
                            <option value="3">3 / 5 (Average)</option>
                            <option value="2">2 / 5 (Poor)</option>
                          </select>
                        </div>

                        <button 
                          type="submit" 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Submit Ticket
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              </div>

            </div>
          )}

          {activeView === 'tenders' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Filter controls and search bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tenders by titles, authority names, departments or reference numbers..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  {/* Google Search Grounding Trigger */}
                  <button 
                    onClick={handleLiveSearchGrounding}
                    disabled={isGroundingLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isGroundingLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Grounding...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 animate-pulse" /> Fetch Live Tenders (Google Grounded)
                      </>
                    )}
                  </button>

                  {/* Manual add shortcut if super admin */}
                  {userProfile?.role === 'super_admin' && (
                    <button 
                      onClick={() => setActiveView('admin')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Publish Active Tender
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <ListFilter className="h-3.5 w-3.5" /> Filters
                  </span>

                  {/* State Select dropdown */}
                  <select 
                    value={selectedStateFilter}
                    onChange={(e) => setSelectedStateFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {['All States', 'Delhi', 'Maharashtra', 'Karnataka', 'Andhra Pradesh', 'Tamil Nadu', 'Kerala', 'Punjab'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>

                  {/* Category dropdown */}
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {['All Categories', 'Civil Works & Construction', 'Information Technology', 'Energy & Power', 'Medical & Healthcare', 'Manufacturing & Heavy Industry', 'Chemicals & Materials'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Value Range dropdown */}
                  <select 
                    value={valueFilter}
                    onChange={(e) => setValueFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {['All Values', 'Under 50 Lakhs', '50 Lakhs - 2 Crores', 'Over 2 Crores'].map(range => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>

                  {/* Clean Filters */}
                  {(searchQuery || selectedStateFilter !== 'All States' || categoryFilter !== 'All Categories' || valueFilter !== 'All Values') && (
                    <button 
                      onClick={() => { setSearchQuery(''); setSelectedStateFilter('All States'); setCategoryFilter('All Categories'); setValueFilter('All Values'); }}
                      className="text-xs text-rose-500 font-semibold hover:underline cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Google Grounded Live Results */}
              {showGroundedResults && (
                <div className="bg-white dark:bg-slate-900 border border-indigo-500/20 dark:border-indigo-500/10 rounded-3xl p-6 space-y-4 shadow-xs animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-wider">
                        <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" /> Real-time Google Grounded Portal Tenders
                      </h2>
                      <p className="text-[11px] text-slate-400">Fetched directly from live Indian e-procurement news feeds and government portals</p>
                    </div>
                    <button 
                      onClick={() => {
                        setShowGroundedResults(false);
                        setGroundedTenders([]);
                        setGroundedSources([]);
                      }} 
                      className="text-xs text-rose-500 font-bold hover:underline self-start sm:self-center cursor-pointer"
                    >
                      Clear Live Feed
                    </button>
                  </div>

                  {isGroundingLoading ? (
                    <div className="py-12 text-center space-y-3">
                      <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Querying live e-tender search APIs and synthesizing live results...</p>
                    </div>
                  ) : groundedTenders.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No live grounded tenders found for your query. Try a broader search keyword (e.g. "solar tender", "smart city", "metro construction").
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Grid of live tenders */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groundedTenders.map((tender) => (
                          <div key={tender.id} className="relative">
                            <TenderCard tender={tender} onViewDetails={handleViewTender} />
                            {tender.sourceUrl && (
                              <a 
                                href={tender.sourceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="absolute top-3 right-12 bg-indigo-600/15 hover:bg-indigo-600/35 text-indigo-500 border border-indigo-500/20 rounded-md px-1.5 py-0.5 text-[8px] font-bold flex items-center gap-0.5 z-10 uppercase transition-all"
                              >
                                Live Portal <ArrowUpRight className="h-2 w-2" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Cited Sources list */}
                      {groundedSources.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800/60 space-y-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cited Real-Time Grounding Sources:</span>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                            {groundedSources.map((src, i) => (
                              <a 
                                key={i} 
                                href={src.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-indigo-500 hover:underline font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                {src.title || "Tender Portal"} <ArrowUpRight className="h-2.5 w-2.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tenders Grid */}
              {filteredTenders.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                  <Layers className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No tenders match your selection</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Try resetting or modifying the search queries, state jurisdictions, categories or value ranges.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTenders.map((tender) => (
                    <TenderCard key={tender.id} tender={tender} onViewDetails={handleViewTender} />
                  ))}
                </div>
              )}

            </div>
          )}

          {activeView === 'workflow' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Corporate Bid Pipeline Board</h1>
                  <p className="text-xs text-slate-400">Track and coordinate the progression of active team bid submissions</p>
                </div>
              </div>

              {companySaved.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
                  <Bookmark className="h-10 w-10 text-indigo-400 mx-auto" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Your Bid Board is Empty</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">Browse active tenders under the search portal and bookmark them to begin your structured bidding workflows.</p>
                  <button onClick={() => setActiveView('tenders')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer">
                    Browse Active Tenders
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
                  
                  {/* SAVED & EVALUATION COLUMN */}
                  <div className="bg-slate-100 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saved & Evaluating</span>
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/25 px-2 py-0.5 rounded-full font-bold">
                        {companySaved.filter(s => s.status === 'saved').length}
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[70vh] overflow-y-auto">
                      {companySaved.filter(s => s.status === 'saved').map((saved) => {
                        const original = tenders.find(t => t.id === saved.tenderId);
                        if (!original) return null;
                        return (
                          <div 
                            key={saved.id}
                            onClick={() => handleViewTender(original)}
                            className="bg-white dark:bg-slate-955 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500/50 transition-all cursor-pointer space-y-2"
                          >
                            <span className="text-[9px] font-mono text-slate-400 block truncate">{original.refNo}</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">{original.title}</span>
                            <span className="text-[10px] text-slate-500 block truncate font-medium">{original.authority}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* INTERESTED & PREPARING DOCUMENTS */}
                  <div className="bg-slate-100 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Interested & Documenting</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-full font-bold">
                        {companySaved.filter(s => s.status === 'interested' || s.status === 'preparing').length}
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[70vh] overflow-y-auto">
                      {companySaved.filter(s => s.status === 'interested' || s.status === 'preparing').map((saved) => {
                        const original = tenders.find(t => t.id === saved.tenderId);
                        if (!original) return null;
                        return (
                          <div 
                            key={saved.id}
                            onClick={() => handleViewTender(original)}
                            className="bg-white dark:bg-slate-955 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500/50 transition-all cursor-pointer space-y-2"
                          >
                            <span className="text-[9px] font-mono text-slate-400 block truncate">{original.refNo}</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">{original.title}</span>
                            <span className="text-[10px] text-indigo-500 block font-bold">Status: {saved.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SUBMITTED BIDS */}
                  <div className="bg-slate-100 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Formally Submitted</span>
                      <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/25 px-2 py-0.5 rounded-full font-bold">
                        {companySaved.filter(s => s.status === 'submitted').length}
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[70vh] overflow-y-auto">
                      {companySaved.filter(s => s.status === 'submitted').map((saved) => {
                        const original = tenders.find(t => t.id === saved.tenderId);
                        if (!original) return null;
                        return (
                          <div 
                            key={saved.id}
                            onClick={() => handleViewTender(original)}
                            className="bg-white dark:bg-slate-955 p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500/50 transition-all cursor-pointer space-y-2"
                          >
                            <span className="text-[9px] font-mono text-slate-400 block truncate">{original.refNo}</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">{original.title}</span>
                            <span className="text-[9px] text-slate-400 block font-medium">Value: ₹{(original.value / 10000000).toFixed(2)} Cr</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* WON & AWARDED TENDERS */}
                  <div className="bg-slate-100 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">🏆 Awarded / Won</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 px-2 py-0.5 rounded-full font-bold">
                        {companySaved.filter(s => s.status === 'won').length}
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[70vh] overflow-y-auto">
                      {companySaved.filter(s => s.status === 'won').map((saved) => {
                        const original = tenders.find(t => t.id === saved.tenderId);
                        if (!original) return null;
                        return (
                          <div 
                            key={saved.id}
                            onClick={() => handleViewTender(original)}
                            className="bg-white dark:bg-slate-955 p-3.5 border border-emerald-500/25 rounded-xl hover:border-emerald-500 transition-all cursor-pointer space-y-2"
                          >
                            <span className="text-[9px] font-mono text-emerald-400 block truncate">{original.refNo}</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">{original.title}</span>
                            <span className="text-[10px] text-emerald-500 font-extrabold">Awarded 🏆</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {activeView === 'company' && <CompanyProfileView />}

          {activeView === 'calendar' && <CalendarView />}

          {activeView === 'crm' && <CrmView />}

          {activeView === 'analytics' && <AnalyticsView />}

          {activeView === 'admin' && <AdminPanel />}

          {activeView === 'tender-details' && selectedTender && (
            <TenderDetails tender={selectedTender} onBack={() => {
              setActiveView('tenders');
              setSelectedTender(null);
            }} />
          )}

        </main>
      </div>

      {/* Corporate humble footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-200 dark:border-slate-800/80 text-center flex justify-between items-center text-[10px] text-slate-400">
        <span>© 2026 TenderFlow AI B2B India Inc. All rights reserved.</span>
        <div className="flex gap-4">
          <button onClick={() => alert("Simulating corporate compliance logs. Securely connected via Firebase.")} className="hover:underline cursor-pointer">Security Protocol</button>
          <button onClick={() => alert("B2B SLA details: 99.9% uptime guaranteed on Google Cloud Run.")} className="hover:underline cursor-pointer">SaaS Terms</button>
        </div>
      </footer>

      {/* Auth Modal popup */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <TenderFlowMain />
    </AppProvider>
  );
}
