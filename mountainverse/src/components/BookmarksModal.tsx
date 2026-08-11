import React, { useState } from 'react';
import { MOUNTAINS } from '../data/mountains';
import { Mountain } from '../types';
import { Bookmark, X, Compass, Trash2, Share2, Copy, Check, Send } from 'lucide-react';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMountainIds: string[];
  onSelectMountain: (mountain: Mountain) => void;
  onRemoveBookmark: (id: string) => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  savedMountainIds,
  onSelectMountain,
  onRemoveBookmark
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const savedMountains = MOUNTAINS.filter((m) => savedMountainIds.includes(m.id));

  // Generate share URL with query param
  const shareUrl = `${window.location.origin}${window.location.pathname}?expedition=${savedMountainIds.join(',')}`;

  // Generate share summary text
  const shareSummaryText = `🏔️ My Curated MountainVerse Expeditions (${savedMountains.length} Peaks):\n` +
    savedMountains.map((m, i) => `${i + 1}. ${m.name} (${m.continent} • ${m.elevationMeters.toLocaleString()}m)`).join('\n') +
    `\n\nExplore my expedition collection on MountainVerse:\n${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopySummaryText = () => {
    navigator.clipboard.writeText(shareSummaryText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my alpine mountain collection on MountainVerse 🏔️\n${shareUrl}`)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareSummaryText)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 text-white space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
            <Bookmark className="w-5 h-5 fill-current" /> My Saved Expeditions ({savedMountains.length})
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedMountains.length > 0 ? (
          <>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {savedMountains.map((m) => (
                <div key={m.id} className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={m.heroImage} alt={m.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-white truncate">{m.name}</h4>
                      <p className="text-xs text-slate-400 truncate">{m.continent} • {m.elevationMeters.toLocaleString()}m</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onSelectMountain(m);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-md"
                    >
                      <Compass className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => onRemoveBookmark(m.id)}
                      className="p-1.5 rounded-lg glass hover:bg-rose-500 hover:text-white text-slate-400 cursor-pointer transition-colors"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Sharing Section */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-sky-400">
                <span className="flex items-center gap-1.5"><Share2 className="w-4 h-4" /> Share Collection Link</span>
                {(copiedLink || copiedText) && (
                  <span className="text-emerald-400 flex items-center gap-1 text-[11px] animate-fade-in">
                    <Check className="w-3.5 h-3.5" /> Copied to Clipboard!
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-slate-300 focus:outline-none"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </button>
                  <button
                    onClick={handleCopySummaryText}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl glass hover:bg-white/10 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border border-white/10 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Copy Text
                  </button>
                </div>
              </div>

              {/* Quick Social Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/10 text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 font-semibold"
                >
                  <Send className="w-3 h-3 text-sky-400" /> Share on X
                </a>
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-white/10 text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 font-semibold"
                >
                  <Send className="w-3 h-3 text-emerald-400" /> WhatsApp
                </a>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center py-8 text-xs text-slate-400">You haven't saved any mountains yet. Bookmark peaks while browsing to build your personal expedition list!</p>
        )}
      </div>
    </div>
  );
};

