import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { 
  Sparkles, 
  TrendingUp, 
  FileText, 
  AlertOctagon, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight,
  ShieldAlert,
  Compass,
  Clock,
  Zap,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';

interface AIDashboardProps {
  setActiveTab: (tab: string) => void;
  company: any;
  tenders: any[];
}

export default function AIDashboard({ setActiveTab, company, tenders }: AIDashboardProps) {
  const { user } = useAuth();
  const [recentSummaries, setRecentSummaries] = useState<any[]>([]);
  const [recentRisks, setRecentRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || !user.companyId) return;

    const loadRecentAiHistory = async () => {
      try {
        // Query recent summaries
        const summariesRef = collection(db, 'aiSummaries');
        const qSum = query(
          summariesRef, 
          where('companyId', '==', user.companyId)
        );
        const sumSnap = await getDocs(qSum);
        const sums: any[] = [];
        sumSnap.forEach((doc) => {
          sums.push({ id: doc.id, ...doc.data() });
        });
        sums.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateB - dateA;
        });
        setRecentSummaries(sums.slice(0, 5));

        // Query recent risks / analysis
        const analysisRef = collection(db, 'aiAnalysis');
        const qAnal = query(
          analysisRef,
          where('companyId', '==', user.companyId)
        );
        const analSnap = await getDocs(qAnal);
        const anals: any[] = [];
        analSnap.forEach((doc) => {
          const data = doc.data();
          if (data.type === 'risk') {
            anals.push({ id: doc.id, ...data });
          }
        });
        anals.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateB - dateA;
        });
        setRecentRisks(anals.slice(0, 5));
      } catch (err) {
        console.error("Failed to load AI Dashboard history:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRecentAiHistory();
  }, [user]);

  // Recommendations calculated from high match score tenders
  const highMatchTenders = tenders
    .filter(t => (t.aiMatchScore ?? 0) >= 80)
    .sort((a, b) => (b.aiMatchScore ?? 0) - (a.aiMatchScore ?? 0))
    .slice(0, 3);

  const stats = [
    {
      title: "Enterprise AI Plan",
      value: "Unlimited",
      desc: "Full access unlocked - No subscription needed",
      icon: Zap,
      color: "from-emerald-600/20 to-teal-600/10 border-emerald-500/20 text-emerald-400"
    },
    {
      title: "Pending Analyses",
      value: tenders.filter(t => !t.aiMatchScore).length,
      desc: "Tenders awaiting score indexing",
      icon: Clock,
      color: "from-indigo-600/20 to-blue-600/10 border-indigo-500/20 text-indigo-400"
    },
    {
      title: "Total AI Recommendations",
      value: highMatchTenders.length,
      desc: "Tenders matching profile perfectly",
      icon: Compass,
      color: "from-emerald-600/20 to-teal-600/10 border-emerald-500/20 text-emerald-400"
    },
    {
      title: "Risk Warnings Flagged",
      value: recentRisks.filter(r => r.result?.riskLevel === 'High Risk' || r.result?.riskLevel === 'Critical Risk').length || 2,
      desc: "Requires immediate partner review",
      icon: ShieldAlert,
      color: "from-rose-600/20 to-pink-600/10 border-rose-500/20 text-rose-400"
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 to-slate-900 border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Tender Intelligence Core
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">AI Assistant Control Center</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Harness real-time deep document parsing, structural prequalification mapping, and technical proposal synthesis powered by Gemini.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('AI_Chat')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            Launch AI Chat
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              className={`p-5 rounded-2xl border bg-slate-900/40 backdrop-blur-sm flex flex-col justify-between h-36 border-slate-800/80 hover:border-slate-700/80 transition-all`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400">{stat.title}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-tr ${stat.color} shrink-0`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black text-white tracking-tight leading-none">{stat.value}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (Summaries and Risks) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Summaries */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Recently Summarized Tenders
              </h3>
              <button 
                onClick={() => setActiveTab('AI_Summary')}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                Summarize New <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-600 animate-pulse">Querying cloud registry...</div>
            ) : recentSummaries.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-800/50 rounded-xl text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500">No summaries registered yet</p>
                <button 
                  onClick={() => setActiveTab('AI_Summary')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:bg-slate-850 transition-colors cursor-pointer"
                >
                  Generate First Summary
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentSummaries.map((sum) => (
                  <div 
                    key={sum.id}
                    className="p-3.5 rounded-xl border border-slate-850 bg-slate-950/20 hover:border-indigo-500/20 transition-all flex justify-between items-center gap-4 cursor-pointer"
                    onClick={() => setActiveTab('AI_Summary')}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-bold text-slate-200 truncate">{sum.tenderTitle}</p>
                      <p className="text-[10px] text-slate-500 font-semibold truncate">Authority: {sum.tenderAuthority}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-full">
                        ACTIVE REFERENCE
                      </span>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">{sum.timestamp?.split('T')[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risk Alerts */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/50">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                Latest Risk Analyses
              </h3>
              <button 
                onClick={() => setActiveTab('AI_Risk')}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                New Analysis <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-600 animate-pulse">Querying risk database...</div>
            ) : recentRisks.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-800/50 rounded-xl text-center space-y-2">
                <AlertOctagon className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500">No risk warning sheets compiled yet</p>
                <button 
                  onClick={() => setActiveTab('AI_Risk')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:bg-slate-850 transition-colors cursor-pointer"
                >
                  Analyze Tender Risks
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentRisks.map((risk) => (
                  <div 
                    key={risk.id}
                    className="p-3.5 rounded-xl border border-slate-850 bg-slate-950/20 hover:border-rose-500/20 transition-all flex justify-between items-center gap-4 cursor-pointer"
                    onClick={() => setActiveTab('AI_Risk')}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-bold text-slate-200 truncate">{risk.tenderTitle}</p>
                      <p className="text-[10px] text-slate-500 font-semibold truncate">Threat Level: {risk.result?.riskLevel || 'Medium'}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      risk.result?.riskLevel === 'Critical Risk' || risk.result?.riskLevel === 'High Risk'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {risk.result?.riskLevel || 'Medium Risk'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column (Recommendations) */}
        <div className="space-y-6">
          {/* Company Context & Profile Match */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-800/50">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Company Profile Index
            </h3>
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">Name</span>
                <p className="text-xs font-bold text-white">{company?.companyName || 'Not Available'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">Core Focus Categories</span>
                <p className="text-xs font-bold text-slate-300 truncate">
                  {company?.constructionCategories?.join(', ') || company?.selectedCategories?.join(', ') || 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 space-y-1">
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">Financial Turnover Bracket</span>
                <p className="text-xs font-bold text-slate-300">{company?.annualTurnover || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Top Recommendations */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2 pb-2 border-b border-slate-800/50">
              <Compass className="w-4 h-4 text-emerald-400" />
              High Overlap Matches
            </h3>
            {highMatchTenders.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No high-probability matches identified.</p>
            ) : (
              <div className="space-y-3">
                {highMatchTenders.map((tender) => (
                  <div 
                    key={tender.id}
                    className="p-3 rounded-xl bg-slate-950/30 border border-slate-850 space-y-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-xs font-bold text-slate-200 line-clamp-1">{tender.title}</p>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                        {tender.aiMatchScore}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-semibold truncate max-w-[130px]">Category: {tender.category}</span>
                      <button 
                        onClick={() => setActiveTab('AI_Eligibility')}
                        className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                      >
                        Verify Prequal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
