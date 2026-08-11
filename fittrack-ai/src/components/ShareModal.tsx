import React, { useState, useEffect } from "react";
import { X, Copy, Check, Share2, MessageCircle, Send, Twitter } from "lucide-react";

interface ShareOption {
  id: string;
  label: string;
  content: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: ShareOption[];
  defaultSelectedIds?: string[];
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  options,
  defaultSelectedIds = []
}: ShareModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Initialize selected options
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(defaultSelectedIds.length > 0 ? defaultSelectedIds : options.map(o => o.id));
      setCopied(false);
    }
  }, [isOpen, options, defaultSelectedIds]);

  if (!isOpen) return null;

  const toggleOption = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Compile the shareable text based on user's selections
  const getCompiledText = () => {
    const header = `🌟 My FitTrack AI Update: ${title} 🌟\n\n`;
    const selectedContent = options
      .filter(opt => selectedIds.includes(opt.id))
      .map(opt => `${opt.content}`)
      .join("\n\n");
    
    const footer = `\n\nJoin me on my fitness journey! Calibrated with FitTrack AI ⚡`;
    return `${header}${selectedContent}${footer}`;
  };

  const shareText = getCompiledText();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const getShareUrl = (platform: "twitter" | "whatsapp" | "telegram") => {
    const textEncoded = encodeURIComponent(shareText);
    switch (platform) {
      case "twitter":
        return `https://twitter.com/intent/tweet?text=${textEncoded}`;
      case "whatsapp":
        return `https://api.whatsapp.com/send?text=${textEncoded}`;
      case "telegram":
        return `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${textEncoded}`;
      default:
        return "";
    }
  };

  const handleExternalShare = (platform: "twitter" | "whatsapp" | "telegram") => {
    const url = getShareUrl(platform);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        id="share_modal_container"
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-[#c1ff72]">
            <Share2 className="w-5 h-5" />
            <h3 className="font-bold text-sm tracking-tight text-white font-display">Configure & Share</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-full bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
          {/* Options Selection */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
              Select what to include:
            </label>
            <div className="space-y-2">
              {options.map((opt) => {
                const isSelected = selectedIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? "bg-[#c1ff72]/5 border-[#c1ff72]/20 text-white" 
                        : "bg-zinc-950/40 border-zinc-850 text-zinc-400"
                    }`}
                  >
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                      isSelected 
                        ? "bg-[#c1ff72] border-[#c1ff72] text-[#050505]" 
                        : "border-zinc-700"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3px]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Preview */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
              Live Preview
            </label>
            <div className="w-full h-32 bg-zinc-950 rounded-xl p-3 border border-zinc-850 text-[11px] font-medium font-mono text-zinc-300 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed">
              {shareText}
            </div>
          </div>
        </div>

        {/* Sharing Options */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <label className="block text-[10px] font-black uppercase tracking-wider text-zinc-500">
            Share to platform:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {/* Copy to clipboard */}
            <button
              onClick={handleCopy}
              className={`p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors border text-center ${
                copied 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-zinc-800/40 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white"
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="text-[9px] font-bold uppercase tracking-wider">{copied ? "Copied" : "Copy"}</span>
            </button>

            {/* X / Twitter */}
            <button
              onClick={() => handleExternalShare("twitter")}
              disabled={selectedIds.length === 0}
              className="p-3 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Twitter className="w-4 h-4 text-sky-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Twitter</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => handleExternalShare("whatsapp")}
              disabled={selectedIds.length === 0}
              className="p-3 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-[9px] font-bold uppercase tracking-wider">WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={() => handleExternalShare("telegram")}
              disabled={selectedIds.length === 0}
              className="p-3 bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4 text-sky-500" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Telegram</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
