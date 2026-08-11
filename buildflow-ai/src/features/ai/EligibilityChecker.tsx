import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  History, 
  Trash2, 
  ArrowRight,
  Scale,
  ListMinus,
  Sparkle
} from 'lucide-react';

interface EligibilityCheckerProps {
  company: any;
  tenders: any[];
}

export default function EligibilityChecker({ company, tenders }: EligibilityCheckerProps) {
  const { user } = { user: useAuth().user };
  const { showToast } = useToast();

  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [eligibilityResult, setEligibilityResult] = useState<any>(null);

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    if (!user || !user.companyId) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'aiAnalysis'),
        where('companyId', '==', user.companyId)
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.type === 'eligibility') {
          list.push({ id: d.id, ...data });
        }
      });
      list.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });
      setHistory(list);
    } catch (err) {
      console.error("Failed to load eligibility history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleCheckEligibility = async () => {
    if (!selectedTenderId) {
      showToast("Please select a tender first.", "error");
      return;
    }

    if (!company) {
      showToast("Company profile is empty. Please complete onboarding or update settings.", "error");
      return;
    }

    const selectedTender = tenders.find(t => t.id === selectedTenderId);
    if (!selectedTender) {
      showToast("Tender not found.", "error");
      return;
    }

    setLoading(true);
    setEligibilityResult(null);

    try {
      const response = await fetch('/api/ai/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, tender: selectedTender })
      });

      if (!response.ok) throw new Error("Eligibility request failed");

      const data = await response.json();
      setEligibilityResult(data);

      // Save to Firestore
      if (user && user.companyId) {
        await addDoc(collection(db, 'aiAnalysis'), {
          companyId: user.companyId,
          userId: user.id,
          type: 'eligibility',
          tenderId: selectedTenderId,
          tenderTitle: selectedTender.title,
          result: data,
          timestamp: new Date().toISOString()
        });
        showToast("Gemini eligibility scorecard saved!", "success");
        loadHistory();
      }
    } catch (err) {
      console.error(err);
      showToast("Could not compute eligibility. Displaying pre-qualification fallback.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'aiAnalysis', id));
      showToast("Scorecard deleted from cloud ledger.", "info");
      loadHistory();
      if (eligibilityResult && history.find(h => h.id === id)?.tenderId === selectedTenderId) {
        setEligibilityResult(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadFromHistory = (item: any) => {
    setSelectedTenderId(item.tenderId);
    setEligibilityResult(item.result);
    showToast(`Loaded scorecard for: ${item.tenderTitle}`, "success");
  };

  // Helper for rendering badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Eligible':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% Eligible
          </div>
        );
      case 'Partially Eligible':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            Partially Eligible
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" />
            Not Eligible
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
      {/* Selector & Actions */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Eligibility Engine
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Choose Target Tender
            </label>
            <select
              value={selectedTenderId}
              onChange={(e) => {
                setSelectedTenderId(e.target.value);
                setEligibilityResult(null);
              }}
              className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer outline-none"
            >
              <option value="">-- Choose Target Tender --</option>
              {tenders.map((tender) => (
                <option key={tender.id} value={tender.id}>
                  {tender.title.substring(0, 45)}...
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCheckEligibility}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Auditing Corporate Profile...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Check Prequalification
              </>
            )}
          </button>
        </div>

        {/* History of checks */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
            <History className="w-4.5 h-4.5 text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Saved Audits ({history.length})
            </h3>
          </div>

          {loadingHistory ? (
            <div className="py-6 text-center text-xs text-slate-600 animate-pulse">Syncing...</div>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No previous scorecards.</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleLoadFromHistory(item)}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-indigo-500/25 transition-all cursor-pointer flex justify-between items-start gap-3 group"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-bold text-slate-200 truncate leading-snug">{item.tenderTitle}</p>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                      item.result?.status === 'Eligible' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.result?.status}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                    className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results panel */}
      <div className="lg:col-span-2">
        {eligibilityResult ? (
          <div className="space-y-6">
            {/* Status card */}
            <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">PREQUALIFICATION SCORECARD</span>
                <h3 className="text-sm font-black text-white">{tenders.find(t => t.id === selectedTenderId)?.title}</h3>
              </div>
              <div className="shrink-0">
                {getStatusBadge(eligibilityResult.status)}
              </div>
            </div>

            {/* Compliance Analysis */}
            <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                <Scale className="w-4 h-4" />
                Compliance Auditor Reasoning
              </h4>
              <p className="text-slate-300 text-xs leading-relaxed">
                {eligibilityResult.reasoning}
              </p>
            </div>

            {/* Missing Gaps and Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Gaps */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <ListMinus className="w-4 h-4" />
                  Detected Compliance Gaps
                </h4>
                {eligibilityResult.missingRequirements?.length === 0 ? (
                  <p className="text-xs text-emerald-400">No missing requirements or prequal gaps found.</p>
                ) : (
                  <div className="space-y-2">
                    {eligibilityResult.missingRequirements?.map((gap: string, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span className="text-slate-300 text-[11px] leading-relaxed">{gap}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <Sparkle className="w-4 h-4" />
                  Improvement Strategies
                </h4>
                <div className="space-y-2">
                  {eligibilityResult.improvementSuggestions?.map((sug: string, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-[11px] leading-relaxed">{sug}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[350px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl text-slate-500 py-12 px-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-slate-700 animate-pulse" />
            <h4 className="text-slate-300 font-bold text-sm">Verify Prequal Qualifications</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Press "Check Prequalification" to compare your turn-overs, state reaches, and categories with the target bid document parameters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
