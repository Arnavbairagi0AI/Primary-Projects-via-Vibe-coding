import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useActivityLog } from '../../hooks/useActivityLog';
import { 
  FileText, 
  Layers, 
  Users, 
  Clock, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  TrendingUp, 
  AlertTriangle, 
  Check, 
  Calendar,
  Flame,
  FileCode,
  XCircle,
  FolderOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import { Tender, Project, EmployeeProfile } from '../../types';

interface DashboardOverviewProps {
  stats: {
    totalTenders: number;
    savedTenders: number;
    activeProjects: number;
    totalEmployees: number;
  };
  setActiveTab: (tab: string) => void;
  recentTenders: Tender[];
  tenders?: Tender[];
  projects?: Project[];
  employees?: EmployeeProfile[];
}

export default function DashboardOverview({ 
  stats: legacyStats, 
  setActiveTab, 
  recentTenders,
  tenders = [],
  projects = [],
  employees = []
}: DashboardOverviewProps) {
  const { user } = useAuth();
  const { logs } = useActivityLog();

  // Calculate real Firestore statistics based on company-specific tenders stream
  const totalTendersCount = tenders.length;
  const openTendersCount = tenders.filter(t => t.status === 'Open').length;
  
  // Calculate Closing This Week count
  const getClosingThisWeekCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);
    
    return tenders.filter(t => {
      const dateStr = t.closingDate || t.deadlineDate;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= today && d <= oneWeekLater && t.status !== 'Won' && t.status !== 'Lost' && t.status !== 'Cancelled';
    }).length;
  };
  
  const closingThisWeekCount = getClosingThisWeekCount();
  const submittedTendersCount = tenders.filter(t => t.status === 'Submitted').length;
  const wonTendersCount = tenders.filter(t => t.status === 'Won').length;
  const lostTendersCount = tenders.filter(t => t.status === 'Lost').length;
  const draftsTendersCount = tenders.filter(t => t.status === 'Draft').length;
  const highPriorityCount = tenders.filter(t => t.priority === 'High' || t.priority === 'Critical').length;

  // Compute Upcoming Deadlines (sorted by closing date, filtering out Won/Lost/Cancelled)
  const upcomingDeadlines = tenders
    .filter(t => (t.closingDate || t.deadlineDate) && t.status !== 'Won' && t.status !== 'Lost' && t.status !== 'Cancelled')
    .map(t => {
      const dateStr = t.closingDate || t.deadlineDate || '';
      const daysLeft = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return { tender: t, dateStr, daysLeft };
    })
    .filter(item => item.daysLeft >= -2) // show recently passed as well
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 4);

  // Modern Enterprise cards grid
  const cards = [
    {
      title: "Total Tenders",
      value: totalTendersCount,
      desc: "All logged items",
      icon: FileText,
      color: "from-blue-600/20 to-indigo-600/10 border-blue-500/20 text-blue-400",
      tab: "Tenders"
    },
    {
      title: "Open Tenders",
      value: openTendersCount,
      desc: "Actively seeking bids",
      icon: FolderOpen,
      color: "from-sky-600/20 to-cyan-600/10 border-sky-500/20 text-sky-400",
      tab: "Tenders"
    },
    {
      title: "Closing This Week",
      value: closingThisWeekCount,
      desc: "High urgency items",
      icon: Clock,
      color: "from-rose-600/20 to-orange-600/10 border-rose-500/20 text-rose-400",
      tab: "Tenders"
    },
    {
      title: "Submitted Bids",
      value: submittedTendersCount,
      desc: "Awaiting results",
      icon: TrendingUp,
      color: "from-violet-600/20 to-purple-600/10 border-violet-500/20 text-violet-400",
      tab: "Tenders"
    },
    {
      title: "Bids Won",
      value: wonTendersCount,
      desc: "Converted to projects",
      icon: CheckCircle2,
      color: "from-emerald-600/20 to-teal-600/10 border-emerald-500/20 text-emerald-400",
      tab: "Tenders"
    },
    {
      title: "Bids Lost",
      value: lostTendersCount,
      desc: "Archived evaluations",
      icon: XCircle,
      color: "from-slate-600/20 to-slate-800/10 border-slate-700/20 text-slate-400",
      tab: "Tenders"
    },
    {
      title: "Draft Tenders",
      value: draftsTendersCount,
      desc: "In-preparation",
      icon: FileCode,
      color: "from-amber-600/20 to-yellow-600/10 border-amber-500/20 text-amber-400",
      tab: "Tenders"
    },
    {
      title: "High Priority",
      value: highPriorityCount,
      desc: "High/Critical tags",
      icon: Flame,
      color: "from-red-600/20 to-rose-600/10 border-red-500/20 text-red-400",
      tab: "Tenders"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/10 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/20 p-6 md:p-8">
        <div className="absolute right-0 top-0 w-80 h-full pointer-events-none z-0 bg-grid-white/[0.015] bg-[size:24px_24px] rounded-r-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs font-semibold text-indigo-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Tender Node Secure Sync Active
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome to, <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">{user?.displayName || 'Builder'}</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Construct with precision. Manage, track, and analyze your public and private tenders, internal notes, draft formulations, and deadline rosters in real-time.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('Tenders')}
            className="self-start md:self-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/10 active:scale-95 cursor-pointer"
          >
            Manage Tenders
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real Firestore Statistics Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-200 text-sm tracking-wide uppercase">Operational Metrics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                onClick={() => setActiveTab(card.tab)}
                className={`bg-slate-900/30 border ${card.color} hover:bg-slate-900/60 rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between h-32 group`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
                    <div className="text-2xl font-black text-white tracking-tight font-mono">
                      {card.value}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded-xl border border-slate-800 text-current group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-800/20 pt-2">
                  <span>{card.desc}</span>
                  <span className="text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                    Open
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Columns: Upcoming Deadlines + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left: Upcoming Deadlines */}
        <div className="lg:col-span-3 bg-slate-900/30 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
              <div>
                <h3 className="font-bold text-white text-base">Upcoming Submission Deadlines</h3>
                <p className="text-xs text-slate-500">Urgent tenders requiring documentation and EMD assembly</p>
              </div>
              <Calendar className="w-4.5 h-4.5 text-indigo-400" />
            </div>

            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-center">
                  <CheckCircle2 className="w-8 h-8 opacity-20 mb-2 text-emerald-400" />
                  <p className="text-xs font-semibold">All clean! No upcoming deadlines registered.</p>
                </div>
              ) : (
                upcomingDeadlines.map((item, index) => {
                  const urgent = item.daysLeft <= 3 && item.daysLeft >= 0;
                  const passed = item.daysLeft < 0;
                  return (
                    <div 
                      key={index}
                      onClick={() => setActiveTab('Tenders')}
                      className="p-3.5 bg-slate-950/40 hover:bg-slate-900/80 border border-slate-850 hover:border-slate-700/60 rounded-xl transition-all flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                          {item.tender.title}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-400 font-mono">
                            {item.tender.referenceNumber || item.tender.tenderNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-600" />
                            {item.tender.state}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          passed 
                            ? 'bg-slate-800 border border-slate-700 text-slate-400'
                            : urgent 
                              ? 'bg-rose-500/15 border border-rose-500/20 text-rose-400 animate-pulse'
                              : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                        }`}>
                          {passed 
                            ? "Passed" 
                            : `${item.daysLeft} ${item.daysLeft === 1 ? 'day' : 'days'} left`
                          }
                        </span>
                        <p className="text-[9px] text-slate-500 font-bold font-mono mt-1">{item.dateStr}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="pt-3 border-t border-slate-800/50 text-[10px] text-slate-500 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            Roster is updated in real-time on secure Firestore streams.
          </div>
        </div>

        {/* Right: Immutable Activity Audit Trail */}
        <div className="lg:col-span-2 bg-slate-900/30 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
              <div>
                <h3 className="font-bold text-white text-base">Audit Trail Logs</h3>
                <p className="text-xs text-slate-500">Live immutable corporate actions</p>
              </div>
              <Clock className="w-4.5 h-4.5 text-indigo-400" />
            </div>

            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-600 text-center">
                  <Lock className="w-6 h-6 opacity-20 mb-1" />
                  <p className="text-xs">No corporate actions logged yet.</p>
                </div>
              ) : (
                logs.slice(0, 5).map((log, index) => (
                  <div key={index} className="flex gap-3 text-xs items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5 shadow-sm shadow-indigo-500/50" />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="font-bold text-slate-300 truncate">{log.userName}</span>
                        <span className="text-[9px] text-slate-600 font-mono shrink-0">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold">{log.action}</p>
                      <p className="text-[9px] text-slate-500 italic truncate leading-snug">{log.details}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="pt-3 border-t border-slate-800/50 text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Cryptographically sealed server logs
          </div>
        </div>

      </div>
    </div>
  );
}
