import React from 'react';
import { Tender, SavedTender } from '../types';
import { useApp } from '../context/AppContext';
import { Bookmark, Star, Calendar, IndianRupee, MapPin, Building2, BrainCircuit, Share2 } from 'lucide-react';

interface TenderCardProps {
  tender: Tender;
  onViewDetails: (tender: Tender) => void;
}

export const TenderCard: React.FC<TenderCardProps> = ({ tender, onViewDetails }) => {
  const { savedTenders, saveTender, toggleFavorite, currentUser } = useApp();

  const savedRecord = savedTenders.find(s => s.tenderId === tender.id);
  const isSaved = savedRecord && savedRecord.status !== 'ignored';
  const isFav = savedRecord?.isFavorite || false;

  const formattedValue = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(val / 100000).toFixed(0)} Lakhs`;
  };

  const getDeadlineStatus = (dateStr: string) => {
    const deadline = new Date(dateStr);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Closed', style: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
    if (diffDays <= 7) return { text: `Expiring Soon (${diffDays}d)`, style: 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' };
    return { text: `${diffDays} days left`, style: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
  };

  const deadlineStatus = getDeadlineStatus(tender.deadline);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}?tender=${tender.id}`);
    alert(`Link copied: Tender ${tender.refNo} copied to clipboard!`);
  };

  return (
    <div 
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 hover:border-indigo-500/50 dark:hover:border-indigo-500/40 transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between group"
      onClick={() => onViewDetails(tender)}
    >
      <div>
        {/* Header (RefNo & Tags) */}
        <div className="flex justify-between items-start gap-4 mb-3">
          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-sm tracking-wider font-semibold">
            {tender.refNo}
          </span>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${deadlineStatus.style}`}>
              {deadlineStatus.text}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug mb-3">
          {tender.title}
        </h3>

        {/* Authority / Department */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate font-medium">{tender.authority} • <span className="text-[11px] opacity-80">{tender.department}</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span>{tender.city}, {tender.state}</span>
          </div>
        </div>
      </div>

      <div>
        {/* Divider */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 my-3.5" />

        {/* Value and Actions */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Estimated Value</span>
            <div className="flex items-center text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
              <IndianRupee className="h-3.5 w-3.5 text-indigo-500" />
              <span>{formattedValue(tender.value)}</span>
            </div>
          </div>

          {/* Quick Action Tools */}
          {currentUser && (
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFavorite(tender.id); }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isFav 
                    ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/25' 
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600'
                }`}
                title={isFav ? "Remove Favorite" : "Favorite"}
              >
                <Star className={`h-4 w-4 ${isFav ? 'fill-amber-500' : ''}`} />
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); saveTender(tender.id); }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isSaved 
                    ? 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/25' 
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-500'
                }`}
                title={isSaved ? "Saved to Bid Board" : "Save to Board"}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-indigo-500' : ''}`} />
              </button>

              <button 
                onClick={handleShare}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 rounded-xl transition-colors cursor-pointer"
                title="Copy Link Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* AI Readiness Banner if analyzed */}
        {tender.aiDifficulty && (
          <div className="mt-3 flex items-center gap-1.5 bg-indigo-500/5 border border-indigo-500/15 rounded-lg py-1 px-2.5 text-[9px] text-indigo-500 dark:text-indigo-400 font-medium">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>AI Analyzed • Fit score: {tender.aiRecommendation?.score}% • Difficulty: {tender.aiDifficulty}</span>
          </div>
        )}
      </div>
    </div>
  );
};
