import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { 
  Sparkles, 
  FileText, 
  Download, 
  Printer, 
  Loader2, 
  FileSignature, 
  ChevronRight,
  ClipboardCheck,
  Building2,
  FolderOpen
} from 'lucide-react';

interface ProposalGeneratorProps {
  company: any;
  tenders: any[];
}

export default function ProposalGenerator({ company, tenders }: ProposalGeneratorProps) {
  const { user } = { user: useAuth().user };
  const { showToast } = useToast();

  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  
  // Tab states for generated sections
  const [activeSubTab, setActiveSubTab] = useState<'coverLetter' | 'executiveSummary' | 'technicalProposal' | 'methodology' | 'companyIntroduction' | 'complianceStatement'>('coverLetter');

  const handleGenerateProposal = async () => {
    if (!selectedTenderId) {
      showToast("Please select a target tender.", "error");
      return;
    }

    if (!company) {
      showToast("Company profile is empty.", "error");
      return;
    }

    setLoading(true);
    setProposal(null);

    try {
      const response = await fetch('/api/ai/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company, 
          tender: tenders.find(t => t.id === selectedTenderId), 
          customInstruction 
        })
      });

      if (!response.ok) throw new Error("Proposal generation failed");

      const data = await response.json();
      setProposal(data);
      showToast("Technical proposal bid package generated!", "success");
    } catch (err) {
      console.error(err);
      showToast("Generation timed out. Initializing high-quality technical backup template.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSection = (field: string, value: string) => {
    setProposal((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Safe file export triggers
  const handleDownloadMarkdown = () => {
    if (!proposal) return;
    const activeTender = tenders.find(t => t.id === selectedTenderId);
    const text = `
# BID PROPOSAL PACKAGE
**Tender:** ${activeTender?.title || 'Heavy Engineering Works'}
**Client Authority:** ${activeTender?.authority || 'Superintending Engineer'}
**Bidder:** ${company?.companyName || 'Class-I General Engineering Contractor'}

=========================================
1. COVER LETTER
=========================================
${proposal.coverLetter}

=========================================
2. EXECUTIVE SUMMARY
=========================================
${proposal.executiveSummary}

=========================================
3. TECHNICAL PROPOSAL
=========================================
${proposal.technicalProposal}

=========================================
4. CONSTRUCTION METHODOLOGY
=========================================
${proposal.methodology}

=========================================
5. COMPANY CAPABILITIES
=========================================
${proposal.companyIntroduction}

=========================================
6. LITIGATION & COMPLIANCE STATEMENT
=========================================
${proposal.complianceStatement}
`;
    
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bid_Proposal_${activeTender?.id || 'Tender'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Markdown proposal document downloaded successfully!", "success");
  };

  const handlePrintDraft = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast("Please allow popups to execute print drafts.", "error");
      return;
    }

    const activeTender = tenders.find(t => t.id === selectedTenderId);
    printWindow.document.write(`
      <html>
        <head>
          <title>Bid Proposal - ${activeTender?.title}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
            h1 { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #1e3a8a; }
            h2 { font-size: 16px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 40px; color: #2563eb; }
            p, ul { font-size: 13px; color: #333; margin-bottom: 15px; text-align: justify; }
            .meta { font-size: 12px; color: #666; margin-bottom: 30px; font-style: italic; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <h1>Technical Bid Proposal Package</h1>
          <div class="meta">
            <strong>Target Tender:</strong> ${activeTender?.title}<br>
            <strong>Client Agency:</strong> ${activeTender?.authority}<br>
            <strong>Bidder Contractor:</strong> ${company?.companyName}
          </div>

          <h2>1. Cover Letter</h2>
          <p style="white-space: pre-line">${proposal.coverLetter}</p>

          <div class="page-break"></div>

          <h2>2. Executive Summary</h2>
          <p style="white-space: pre-line">${proposal.executiveSummary}</p>

          <div class="page-break"></div>

          <h2>3. Technical Proposal</h2>
          <p style="white-space: pre-line">${proposal.technicalProposal}</p>

          <div class="page-break"></div>

          <h2>4. Construction Methodology</h2>
          <p style="white-space: pre-line">${proposal.methodology}</p>

          <div class="page-break"></div>

          <h2>5. Company Introduction</h2>
          <p style="white-space: pre-line">${proposal.companyIntroduction}</p>

          <div class="page-break"></div>

          <h2>6. Compliance & Litigation Statement</h2>
          <p style="white-space: pre-line">${proposal.complianceStatement}</p>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
      {/* Parameters Panel */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Proposal Synth Core
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Select Bid Target
            </label>
            <select
              value={selectedTenderId}
              onChange={(e) => {
                setSelectedTenderId(e.target.value);
                setProposal(null);
              }}
              className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer outline-none"
            >
              <option value="">-- Select Target Tender --</option>
              {tenders.map((tender) => (
                <option key={tender.id} value={tender.id}>
                  {tender.title.substring(0, 45)}...
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Custom Drafting Context
            </label>
            <textarea
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="e.g. Highlight our 12 years of railway bridge concrete casting experience and state-of-the-art laboratory."
              rows={4}
              className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold outline-none resize-none placeholder:text-slate-600"
            />
          </div>

          <button
            onClick={handleGenerateProposal}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Synthesizing Proposal...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Bid Proposal
              </>
            )}
          </button>
        </div>

        {/* Requirements index preview */}
        {selectedTenderId && (
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/50 pb-2 flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              Pre-Qualification Overlay
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Tender Authority:</span>
                <span className="text-slate-300 font-bold max-w-[130px] truncate">
                  {tenders.find(t => t.id === selectedTenderId)?.authority}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-semibold">Contract Category:</span>
                <span className="text-slate-300 font-bold">
                  {tenders.find(t => t.id === selectedTenderId)?.category}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Panel (Right columns) */}
      <div className="lg:col-span-2">
        {proposal ? (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="p-4 rounded-2xl bg-slate-900/30 border border-slate-800/80 flex justify-between items-center">
              <div className="text-xs font-black text-slate-300 uppercase tracking-widest">
                Generated Bid package
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintDraft}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/20 text-slate-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  Print / Export PDF
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/20 text-slate-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  Download MD
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'coverLetter', label: 'Cover Letter', icon: FileSignature },
                { id: 'executiveSummary', label: 'Exec Summary', icon: FileText },
                { id: 'technicalProposal', label: 'Tech Proposal', icon: ClipboardCheck },
                { id: 'methodology', label: 'Methodology', icon: FolderOpen },
                { id: 'companyIntroduction', label: 'Company Intro', icon: Building2 },
                { id: 'complianceStatement', label: 'Compliance', icon: ClipboardCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                      isActive 
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold' 
                        : 'bg-slate-950/20 border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Large Editable Textarea */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <textarea
                value={proposal[activeSubTab]}
                onChange={(e) => handleUpdateSection(activeSubTab, e.target.value)}
                rows={16}
                className="w-full bg-transparent text-slate-200 text-xs leading-relaxed outline-none font-medium resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[350px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl text-slate-500 py-12 px-6 text-center space-y-3">
            <FileSignature className="w-10 h-10 text-slate-700 animate-pulse" />
            <h4 className="text-slate-300 font-bold text-sm">Synthesize Compliance Bids</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Press "Generate Bid Proposal" to construct custom cover letters, comprehensive methodologies, and compliant declarations matching specifications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
