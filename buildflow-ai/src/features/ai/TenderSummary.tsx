import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { 
  Sparkles, 
  FileText, 
  Calendar, 
  DollarSign, 
  Scale, 
  ListChecks, 
  Loader2, 
  History,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { motion } from 'motion/react';

interface TenderSummaryProps {
  tenders: any[];
}

export default function TenderSummary({ tenders }: TenderSummaryProps) {
  const { user } = { user: useAuth().user }; // clean destructuring
  const { showToast } = useToast();
  
  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<any>(null);
  
  // Historical summaries state
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load history from Firestore
  const loadHistory = async () => {
    if (!user || !user.companyId) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'aiSummaries'),
        where('companyId', '==', user.companyId)
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      list.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });
      setHistory(list);
    } catch (err) {
      console.error("Failed loading summaries history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleGenerateSummary = async () => {
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
    setSummaryResult(null);

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tender: selectedTender })
      });

      if (!response.ok) throw new Error("Analysis request failed");

      const data = await response.json();
      setSummaryResult(data);

      // Save to Firestore
      if (user && user.companyId) {
        await addDoc(collection(db, 'aiSummaries'), {
          companyId: user.companyId,
          userId: user.id,
          tenderId: selectedTenderId,
          tenderTitle: selectedTender.title,
          tenderAuthority: selectedTender.authority || selectedTender.department || 'N/A',
          result: data,
          timestamp: new Date().toISOString()
        });
        showToast("Gemini Tender Summary saved in cloud ledger!", "success");
        loadHistory();
      }
    } catch (err) {
      console.error(err);
      showToast("Could not synthesize summary. Operating with system fallback.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'aiSummaries', id));
      showToast("Summary reference deleted.", "info");
      loadHistory();
      if (summaryResult && history.find(h => h.id === id)?.tenderId === selectedTenderId) {
        setSummaryResult(null);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete record.", "error");
    }
  };

  const handleLoadFromHistory = (item: any) => {
    setSelectedTenderId(item.tenderId);
    setSummaryResult(item.result);
    showToast(`Loaded summary for: ${item.tenderTitle}`, "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
      {/* Selection Control Panel (Left Column) */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Summarization Core
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Select Bid Repository Tender
            </label>
            <select
              value={selectedTenderId}
              onChange={(e) => {
                setSelectedTenderId(e.target.value);
                setSummaryResult(null);
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
            onClick={handleGenerateSummary}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Synthesizing Summary...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze & Summarize
              </>
            )}
          </button>
        </div>

        {/* History Panel */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
            <History className="w-4.5 h-4.5 text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Saved Summaries ({history.length})
            </h3>
          </div>

          {loadingHistory ? (
            <div className="py-6 text-center text-xs text-slate-600 animate-pulse">Syncing...</div>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No previous summaries saved.</p>
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
                    <p className="text-[9px] text-slate-500 font-bold uppercase">{item.timestamp?.split('T')[0]}</p>
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

      {/* Structured Results Display (Right columns) */}
      <div className="lg:col-span-2">
        {summaryResult ? (
          <div className="space-y-6">
            {/* Header Title */}
            <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-full">
                SUMMARY FOR
              </span>
              <h2 className="text-base font-black text-white">
                {tenders.find(t => t.id === selectedTenderId)?.title || 'Tender Analysis'}
              </h2>
            </div>

            {/* Grid of details cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Executive Summary */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 md:col-span-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <FileText className="w-4 h-4" />
                  Executive Summary
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {summaryResult.executiveSummary}
                </p>
              </div>

              {/* Scope of Work */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <FolderOpen className="w-4 h-4" />
                  Scope of Work
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                  {summaryResult.scopeOfWork}
                </p>
              </div>

              {/* Cost Details */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <DollarSign className="w-4 h-4" />
                  Estimated Cost & EMD
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                  {summaryResult.estimatedCost}
                </p>
              </div>

              {/* Critical Dates */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <Calendar className="w-4 h-4" />
                  Key Milestones & Dates
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {summaryResult.keyDates}
                </p>
              </div>

              {/* Important Conditions */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <Scale className="w-4 h-4" />
                  Contract Conditions
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {summaryResult.importantConditions}
                </p>
              </div>

              {/* Required Certificates & Documents */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 md:col-span-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <ListChecks className="w-4 h-4" />
                  Required Bid Certificates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {summaryResult.requiredDocuments?.map((doc: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-2 bg-slate-950/40 border border-slate-850 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span className="text-slate-300 text-xs truncate">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[350px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl text-slate-500 py-12 px-6 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-slate-700 animate-pulse" />
            <h4 className="text-slate-300 font-bold text-sm">Select & Generate Summary</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Choose a tender from your repository and press "Analyze & Summarize" to retrieve extensive executive breakdowns.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
