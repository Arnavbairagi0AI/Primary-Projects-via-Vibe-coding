import React, { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { motion } from "motion/react";
import { QrCode, Printer, Check, Copy, Sparkles, Layout, HelpCircle, AlertCircle } from "lucide-react";

export const QrEngine: React.FC = () => {
  const { user, updateBusinessDetails } = useApp();
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<"minimal" | "indigo" | "gold">("indigo");
  const [googleUrl, setGoogleUrl] = useState(user?.googleBusinessUrl || "");
  const [savingUrl, setSavingUrl] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const businessUrl = googleUrl || "https://g.page/r/your-id/review";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=1e293b&margin=10&data=${encodeURIComponent(businessUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(businessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingUrl(true);
    setSaveSuccess(false);
    try {
      await updateBusinessDetails(user.businessName, googleUrl);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUrl(false);
    }
  };

  const handlePrint = () => {
    // Elegant printing mechanism using an iframe or opening a new styled print window
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the placard.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Review Placard - ReviewMagnet AI</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body class="bg-white flex items-center justify-center min-h-screen p-8">
          <div class="w-full max-w-lg">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Review Collector QR Engine</h1>
        <p className="text-sm text-slate-400">Generate, customize, and print high-quality scannable placard templates for your store.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Settings and customizations */}
        <div className="lg:col-span-5 space-y-6">
          {/* Configuration Form */}
          <div className="bg-[#0e131f] p-5 rounded-2xl border border-slate-800/80 shadow-lg space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Layout className="h-4 w-4 text-indigo-400" />
              Placard Configuration
            </h3>

            <form onSubmit={handleSaveUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Business Name on Placard
                </label>
                <div className="px-3 py-2 border border-slate-800 bg-[#131a26] rounded-lg text-slate-300 text-sm font-semibold">
                  {user?.businessName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Google Business Review URL
                </label>
                <input
                  id="google-business-review-url-input"
                  type="url"
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                  placeholder="https://g.page/r/your-id/review"
                  className="block w-full px-3 py-2 bg-[#131a26] border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                {!googleUrl && (
                  <p className="text-[11px] text-amber-400 mt-1 flex items-start gap-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    Enter your actual Google Review URL to link the QR code.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  id="save-business-url"
                  type="submit"
                  disabled={savingUrl}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 rounded-lg shadow-md shadow-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {savingUrl ? "Saving..." : "Save & Update QR"}
                </button>

                <button
                  id="copy-link-btn"
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 text-xs font-bold text-slate-300 bg-[#131a26] hover:bg-[#1a2333] rounded-lg border border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy Link
                    </>
                  )}
                </button>
              </div>

              {saveSuccess && (
                <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                  <Check className="h-3.5 w-3.5" /> Google URL successfully updated!
                </p>
              )}
            </form>
          </div>

          {/* Design Themes Selection */}
          <div className="bg-[#0e131f] p-5 rounded-2xl border border-slate-800/80 shadow-lg space-y-4">
            <h3 className="font-bold text-white text-sm">Placard Aesthetic Style</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="theme-btn-indigo"
                onClick={() => setTheme("indigo")}
                className={`py-2.5 px-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  theme === "indigo"
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 border-transparent text-white shadow-md shadow-indigo-500/10"
                    : "bg-[#131a26] border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                Indigo Classic
              </button>
              <button
                id="theme-btn-minimal"
                onClick={() => setTheme("minimal")}
                className={`py-2.5 px-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  theme === "minimal"
                    ? "bg-slate-800 border-slate-700 text-white shadow-md"
                    : "bg-[#131a26] border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                Slate Minimal
              </button>
              <button
                id="theme-btn-gold"
                onClick={() => setTheme("gold")}
                className={`py-2.5 px-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  theme === "gold"
                    ? "bg-gradient-to-r from-amber-600 to-amber-700 border-transparent text-white shadow-md shadow-amber-500/10"
                    : "bg-[#131a26] border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                Golden Deluxe
              </button>
            </div>
          </div>

          {/* Printing Guidance */}
          <div className="bg-[#131a26]/40 p-4 rounded-xl border border-slate-800/60 flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-200">Placement Best Practices</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Print the placard and insert it into a standard acrylic double-sided desktop display holder. Place it on your billing checkout counter, lobby desk, or dining table to prompt guests to share feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Countertop Placard Live Preview & Actions */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Action Header */}
          <div className="w-full max-w-sm flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Placard Preview</span>
            <button
              id="print-placard-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 rounded-lg shadow-md shadow-indigo-500/15 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Countertop Placard
            </button>
          </div>

          {/* Container designed for standard acrylic placard print layout (4x6 or 5x7 aspect ratio) */}
          <div 
            ref={printAreaRef}
            className={`w-full max-w-sm aspect-[4/6] rounded-3xl shadow-xl border overflow-hidden p-8 flex flex-col justify-between items-center text-center transition-all ${
              theme === "indigo"
                ? "bg-gradient-to-b from-indigo-950 to-slate-900 border-indigo-800 text-white"
                : theme === "gold"
                ? "bg-gradient-to-b from-amber-950 to-stone-900 border-amber-800 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Upper Badge */}
            <div className="space-y-1.5 mt-2">
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                theme === "minimal" 
                  ? "bg-slate-100 text-slate-800" 
                  : theme === "gold"
                  ? "bg-amber-900/40 text-amber-300 border border-amber-800/60"
                  : "bg-indigo-950/40 text-indigo-300 border border-indigo-800/60"
              }`}>
                <Sparkles className="h-3 w-3" />
                Review & Grow
              </div>
              <h2 className={`text-xl font-extrabold tracking-tight ${theme === "minimal" ? "text-slate-950" : "text-white"}`}>
                {user?.businessName || "Our Store"}
              </h2>
            </div>

            {/* Main call to action */}
            <div className="space-y-4 my-4 flex-1 flex flex-col justify-center items-center">
              <div className={`text-base font-extrabold px-4 leading-tight uppercase tracking-wide ${
                theme === "minimal" ? "text-slate-800" : "text-slate-100"
              }`}>
                "Scan to leave a review and help us grow!"
              </div>

              {/* QR Code Graphic Frame */}
              <div className={`p-4 rounded-2xl bg-white shadow-lg border flex items-center justify-center ${
                theme === "minimal" ? "border-slate-100" : "border-white/10"
              }`}>
                <img 
                  id="preview-qr-img"
                  src={qrCodeUrl} 
                  alt="Scannable Google Business review QR" 
                  className="w-48 h-48 block animate-[pulse_3s_infinite]"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold tracking-widest uppercase">
                <QrCode className="h-3.5 w-3.5" />
                Instant Scan
              </div>
            </div>

            {/* Bottom Brand */}
            <div className={`text-[10px] font-semibold tracking-wider uppercase opacity-40 mt-auto ${
              theme === "minimal" ? "text-slate-600" : "text-slate-300"
            }`}>
              Powered by ReviewMagnet AI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
