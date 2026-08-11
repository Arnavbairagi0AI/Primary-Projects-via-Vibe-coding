import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { 
  Sparkles, 
  ShieldAlert, 
  AlertOctagon, 
  Gavel, 
  CalendarClock, 
  CircleDollarSign, 
  History, 
  Trash2, 
  Loader2,
  FileWarning,
  EyeOff
} from 'lucide-react';

interface RiskAnalyzerProps {
  tenders: any[];
}

export default function RiskAnalyzer({ tenders }: RiskAnalyzerProps) {
  const { user } = { user: useAuth().user };
  const { showToast } = useToast();

  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [riskResult, setRiskResult] = useState<any>(null);

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
        if (data.type === 'risk') {
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
      console.error("Failed loading risk history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleAnalyzeRisks = async () => {
    if (!selectedTenderId) {
      showToast("Please select a tender first.", "error");
      return;
    }

    const selectedTender = tenders.find(t => t.id === selectedTenderId);
    if (!selectedTender) {
      showToast("Tender not found.", "error");
      return;
    }

    setLoading(true);
    setRiskResult(null);

    try {
      const response = await fetch('/api/ai/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tender: selectedTender })
      });

      if (!response.ok) throw new Error("Risk analysis request failed");

      const data = await response.json();
      setRiskResult(data);

      // Save to Firestore
      if (user && user.companyId) {
        await addDoc(collection(db, 'aiAnalysis'), {
          companyId: user.companyId,
          userId: user.id,
          type: 'risk',
          tenderId: selectedTenderId,
          tenderTitle: selectedTender.title,
          result: data,
          timestamp: new Date().toISOString()
        });
        showToast("Gemini dynamic Risk Assessment generated and saved!", "success");
        loadHistory();
      }
    } catch (err) {
      console.error(err);
      showToast("Could not generate risk assessment. Displaying fallback threat scorecard.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'aiAnalysis', id));
      showToast("Risk assessment deleted from cloud ledger.", "info");
      loadHistory();
      if (riskResult && history.find(h => h.id === id)?.tenderId === selectedTenderId) {
        setRiskResult(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadFromHistory = (item: any) => {
    setSelectedTenderId(item.tenderId);
    setRiskResult(item.result);
    showToast(`Loaded risk scorecard for: ${item.tenderTitle}`, "success");
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'Critical Risk':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider animate-pulse">
            <AlertOctagon className="w-4 h-4" />
            Critical Risk Threat
          </div>
        );
      case 'High Risk':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-black uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            High Exposure Risk
          </div>
        );
      case 'Medium Risk':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            Medium Risk Level
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Low Risk Profile
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
      {/* Selection Control Panel (Left Column) */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Risk Audit Engine
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Select Tender to Assess
            </label>
            <select
              value={selectedTenderId}
              onChange={(e) => {
                setSelectedTenderId(e.target.value);
                setRiskResult(null);
              }}
              className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer outline-none"
            >
              <option value="">-- Select Active Tender --</option>
              {tenders.map((tender) => (
                <option key={tender.id} value={tender.id}>
                  {tender.title.substring(0, 45)}...
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAnalyzeRisks}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning Clauses...
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                Analyze Contract Risks
              </>
            )}
          </button>
        </div>

        {/* History of Risks */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
            <History className="w-4.5 h-4.5 text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Saved Audit History ({history.length})
            </h3>
          </div>

          {loadingHistory ? (
            <div className="py-6 text-center text-xs text-slate-600 animate-pulse">Syncing...</div>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No previous risk sheets.</p>
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
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      item.result?.riskLevel === 'Critical Risk' || item.result?.riskLevel === 'High Risk'
                        ? 'bg-rose-500/10 text-rose-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.result?.riskLevel}
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

      {/* Details Display (Right Column) */}
      <div className="lg:col-span-2">
        {riskResult ? (
          <div className="space-y-6">
            {/* Risk Title Panel */}
            <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block">CONTRACTUAL LIABILITIES AUDIT</span>
                <h3 className="text-sm font-black text-white">{tenders.find(t => t.id === selectedTenderId)?.title}</h3>
              </div>
              <div className="shrink-0">
                {getRiskBadge(riskResult.riskLevel)}
              </div>
            </div>

            {/* Grid of risk cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Penalty Clauses */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <FileWarning className="w-4 h-4" />
                  Delay & Penalty Clauses
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {riskResult.penaltyClauses}
                </p>
              </div>

              {/* Hidden Conditions */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <EyeOff className="w-4 h-4" />
                  Hidden Conditions / Encumbrances
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {riskResult.hiddenConditions}
                </p>
              </div>

              {/* Strict Timelines */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <CalendarClock className="w-4 h-4" />
                  Milestones & Feasibility
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {riskResult.strictTimelines}
                </p>
              </div>

              {/* Financial risks */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <CircleDollarSign className="w-4 h-4" />
                  Cash Flow & BG Exposures
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {riskResult.financialRisks}
                </p>
              </div>

              {/* Legal Risks */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <Gavel className="w-4 h-4" />
                  Arbitration & Governing Law
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {riskResult.legalRisks}
                </p>
              </div>

              {/* Credentials / Experience constraints */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <ShieldAlert className="w-4 h-4" />
                  Credential Thresholds
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {riskResult.experienceRequirements}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[350px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl text-slate-500 py-12 px-6 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-700 animate-pulse" />
            <h4 className="text-slate-300 font-bold text-sm">Initiate Liability Scan</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Verify legal arbitration constraints, latent encumbrances, and penalty thresholds in your contract specifications with Gemini auditing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
