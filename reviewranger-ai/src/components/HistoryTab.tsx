import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { 
  History, Search, Trash2, Copy, Check, Calendar, Globe, Sparkles, 
  ChevronDown, ChevronUp, AlertCircle, MessageSquareWarning, RefreshCw,
  Download, Smile, Meh, Frown
} from 'lucide-react';
import { HistoryItem } from '../types';
import { analyzeSentiment } from '../utils/sentiment';

interface HistoryTabProps {
  user: User;
}

export default function HistoryTab({ user }: HistoryTabProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const historyRef = collection(db, 'history');
      const q = query(
        historyRef, 
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const items: HistoryItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() as HistoryItem });
      });
      // Sort client-side by date descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(items);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user.uid]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (deleteConfirmId === id) {
      handleDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => {
        setDeleteConfirmId(prev => prev === id ? null : prev);
      }, 4000);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      await deleteDoc(doc(db, 'history', id));
      setHistory(history.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete log:", err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const exportToCSV = () => {
    if (filteredHistory.length === 0) {
      return;
    }

    // Define CSV Headers
    const headers = [
      'Date & Time',
      'Outlet Name',
      'Language',
      'Reply Tone',
      'Customer Review',
      'Saved AI Reply',
      'Sentiment'
    ];

    // Map logs to CSV rows
    const rows = filteredHistory.map(item => {
      const sentiment = item.sentiment || analyzeSentiment(item.customerReview);
      const activeReplyText = item.selectedReplyText || item.generatedReplies?.[0]?.text || '';
      const dateStr = new Date(item.createdAt).toLocaleString('en-IN');
      
      return [
        dateStr,
        item.businessName || 'My Local Business',
        item.language,
        item.replyTone,
        item.customerReview,
        activeReplyText,
        sentiment
      ];
    });

    // Construct CSV Content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          // Escape quotes and wrap in double quotes
          const str = String(val ?? '').replace(/"/g, '""');
          return `"${str}"`;
        }).join(',')
      )
    ].join('\n');

    // Create a Blob and trigger a browser download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ReviewRanger_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = history.filter(item => {
    const search = searchQuery.toLowerCase();
    const sentiment = item.sentiment || analyzeSentiment(item.customerReview);
    return (
      item.customerReview.toLowerCase().includes(search) ||
      (item.selectedReplyText && item.selectedReplyText.toLowerCase().includes(search)) ||
      item.language.toLowerCase().includes(search) ||
      item.replyTone.toLowerCase().includes(search) ||
      sentiment.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-5">
      
      {/* Page description */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Google Business Reply Historical Audit Logs</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track, analyze, and copy past review reply conversions</p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="export-csv-btn"
            onClick={exportToCSV}
            disabled={filteredHistory.length === 0}
            className="px-4 py-2 bg-emerald-600 border border-emerald-700 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          
          <button
            id="refresh-history-btn"
            onClick={loadHistory}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="relative rounded-2xl shadow-xs">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="h-4.5 w-4.5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter history logs by review text, language, tone, sentiment, or reply..."
          className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
        />
      </div>

      {/* Sentiment Overview Cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3 animate-pulse" id="sentiment-overview-skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 flex flex-col items-center justify-center text-center space-y-2 shadow-xs">
              <div className="h-3 w-16 sm:w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-5 w-8 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          ))}
        </div>
      ) : history.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 animate-fade-in" id="sentiment-overview-cards">
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
              <Smile className="h-3 w-3 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/30" />
              Positive Reviews
            </span>
            <span className="text-lg font-extrabold text-emerald-800 dark:text-emerald-200 mt-0.5">
              {history.filter(item => (item.sentiment || analyzeSentiment(item.customerReview)) === 'Positive').length}
            </span>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Meh className="h-3 w-3 text-slate-400 fill-slate-50 dark:fill-slate-800/40" />
              Neutral Reviews
            </span>
            <span className="text-lg font-extrabold text-slate-700 dark:text-slate-200 mt-0.5">
              {history.filter(item => (item.sentiment || analyzeSentiment(item.customerReview)) === 'Neutral').length}
            </span>
          </div>
          
          <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1">
              <Frown className="h-3 w-3 text-rose-500 fill-rose-100 dark:fill-rose-950/30" />
              Negative Reviews
            </span>
            <span className="text-lg font-extrabold text-rose-800 dark:text-rose-200 mt-0.5">
              {history.filter(item => (item.sentiment || analyzeSentiment(item.customerReview)) === 'Negative').length}
            </span>
          </div>
        </div>
      ) : null}

      {/* Main logs display list */}
      {loading ? (
        <div className="space-y-4" id="history-loading-skeletons">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-4 animate-pulse transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-3.5 flex-1 min-w-0">
                  {/* Metadata bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                  
                  {/* Customer Review snippet */}
                  <div className="space-y-1.5 pt-1">
                    <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-3.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>

                  {/* Saved Reply box */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800/60 rounded-md" />
                    <div className="h-3.5 w-5/6 bg-slate-200 dark:bg-slate-800/60 rounded-md" />
                  </div>

                  {/* Keywords row */}
                  <div className="flex gap-1.5 pt-1">
                    <div className="h-3.5 w-12 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-3.5 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-3.5 w-14 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                </div>

                {/* Actions button skeleton */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-3 sm:pt-0 border-t sm:border-0 border-slate-50 dark:border-slate-800 shrink-0">
                  <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="flex items-center space-x-1.5">
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-100 dark:border-slate-800 text-center space-y-3">
          <MessageSquareWarning className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            {searchQuery ? "No history matches your filter." : "Your history logs list is completely empty."}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery 
              ? "Try altering your keyword query." 
              : "Whenever you select and save an option in our SEO Review Generator, the complete log stores safely here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4" id="history-items-list">
          {filteredHistory.map((item) => {
            const itemId = item.id || '';
            const isCopied = copiedId === itemId;
            const isExpanded = expandedId === itemId;
            const isDeleting = deleteLoading === itemId;
            const activeReplyText = item.selectedReplyText || item.generatedReplies?.[0]?.text || '';
            const activeKeywords = item.generatedReplies?.[0]?.seoKeywords || [];
            const sentiment = item.sentiment || analyzeSentiment(item.customerReview);

            return (
              <div 
                key={itemId} 
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-slate-200 dark:hover:border-slate-700 transition overflow-hidden"
              >
                
                {/* Collapsed view header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1 min-w-0">
                    
                    {/* Badges metadata bar */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 font-mono font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold uppercase rounded-md">
                        {item.language}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase rounded-md">
                        Tone: {item.replyTone.split(' ')[0]}
                      </span>

                      {item.businessName && (
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold rounded-md">
                          Outlet: {item.businessName}
                        </span>
                      )}

                      {/* Automated Sentiment Indicator Badge */}
                      {sentiment === 'Positive' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 font-extrabold rounded-md shadow-2xs">
                          <Smile className="h-3 w-3 text-emerald-500 fill-emerald-50 mt-[-1px]" />
                          <span>Positive</span>
                        </span>
                      ) : sentiment === 'Negative' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/30 font-extrabold rounded-md shadow-2xs">
                          <Frown className="h-3 w-3 text-rose-500 fill-rose-50 mt-[-1px]" />
                          <span>Negative</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold rounded-md shadow-2xs">
                          <Meh className="h-3 w-3 text-slate-400 fill-slate-50 mt-[-1px]" />
                          <span>Neutral</span>
                        </span>
                      )}
                    </div>

                    {/* Original review snippet */}
                    <div className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed italic">
                      Customer review: <span className="font-normal text-slate-700 dark:text-slate-300">"{item.customerReview}"</span>
                    </div>

                    {/* Chosen Response highlight */}
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800">
                      Saved Reply: <span className="font-normal text-slate-800 dark:text-slate-200 block mt-1 italic">"{activeReplyText}"</span>
                    </div>

                    {/* Keywords badges */}
                    {activeKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeKeywords.map((kw, kwIdx) => (
                          <span key={kwIdx} className="text-[9px] px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 rounded-md">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* Actions buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-3 sm:pt-0 border-t sm:border-0 border-slate-50 dark:border-slate-800 shrink-0">
                    
                    {/* Copy Button */}
                    <button
                      id={`history-copy-btn-${itemId}`}
                      onClick={() => handleCopy(activeReplyText, itemId)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 font-semibold text-xs rounded-lg flex items-center space-x-1 transition"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Reply</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center space-x-1.5">
                      {/* Trash Delete button */}
                      {deleteConfirmId === itemId ? (
                        <button
                          id={`history-delete-btn-confirm-${itemId}`}
                          onClick={() => handleDeleteClick(itemId)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 bg-red-600 border border-red-700 text-white text-[11px] font-bold rounded-lg hover:bg-red-700 transition"
                          title="Click again to confirm deletion"
                        >
                          Confirm?
                        </button>
                      ) : (
                        <button
                          id={`history-delete-btn-${itemId}`}
                          onClick={() => handleDeleteClick(itemId)}
                          disabled={isDeleting}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition disabled:opacity-50"
                          title="Delete record"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}

                      {/* Expand / Collapse Details Toggle */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : itemId)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        {isExpanded ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
                      </button>
                    </div>

                  </div>
                </div>

                {/* Expanded details container */}
                {isExpanded && (
                  <div className="bg-slate-50/50 dark:bg-slate-950/20 px-5 py-4 border-t border-slate-50 dark:border-slate-800 text-xs space-y-3">
                    <h5 className="font-bold text-slate-900 dark:text-white uppercase tracking-wide">All 3 Alternatives generated originally:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {item.generatedReplies?.map((rep, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">
                          <p className="font-bold text-indigo-600 dark:text-indigo-400">Option {idx + 1}</p>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">"{rep.text}"</p>
                          {rep.explanation && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans mt-1">SEO strategy: {rep.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
