import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { 
  Sparkles, 
  FileText, 
  Search, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2, 
  HelpCircle,
  FolderOpen,
  DollarSign
} from 'lucide-react';

export default function DocIntel() {
  const { user } = { user: useAuth().user };
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [loading, setLoading] = useState(false);
  const [docResult, setDocResult] = useState<any>(null);

  // Sync documents from repository
  useEffect(() => {
    if (!user || !user.companyId) return;

    const q = query(collection(db, 'documents'), where('companyId', '==', user.companyId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setDocuments(list);
    }, (err) => {
      console.error("Failed to load documents:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRunOcr = async () => {
    if (!selectedDocId) {
      showToast("Please select a document first.", "error");
      return;
    }

    const docObj = documents.find(d => d.id === selectedDocId);
    if (!docObj) {
      showToast("Document reference missing.", "error");
      return;
    }

    setLoading(true);
    setDocResult(null);

    try {
      const response = await fetch('/api/ai/doc-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileName: docObj.name, 
          fileCategory: docObj.category,
          fileContent: docObj.summary || null
        })
      });

      if (!response.ok) throw new Error("Document analysis failed");

      const data = await response.json();
      setDocResult(data);

      // Save scanned metadata to the document document
      await updateDoc(doc(db, 'documents', selectedDocId), {
        aiStatus: 'scanned',
        intelResult: data,
        updatedAt: new Date().toISOString()
      });

      showToast(`Scanned and analyzed parameters of ${docObj.name}!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Scan failed. Serving OCR template.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoc = (id: string) => {
    setSelectedDocId(id);
    const docObj = documents.find(d => d.id === id);
    if (docObj?.intelResult) {
      setDocResult(docObj.intelResult);
    } else {
      setDocResult(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
      {/* File Registry (Left column) */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/50">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Document Selector
            </h3>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Select Repository File
            </label>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {documents.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-6">No documents uploaded. Please upload a file in the Documents section first.</p>
              ) : (
                documents.map((docItem) => {
                  const isSelected = selectedDocId === docItem.id;
                  return (
                    <div
                      key={docItem.id}
                      onClick={() => handleSelectDoc(docItem.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center gap-3 ${
                        isSelected 
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold' 
                          : 'bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-semibold truncate leading-snug">{docItem.name}</p>
                        <p className="text-[9px] text-slate-500 font-semibold">{docItem.category} • {docItem.size}</p>
                      </div>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        docItem.aiStatus === 'scanned' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {docItem.aiStatus === 'scanned' ? 'SCANNED' : 'PENDING'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedDocId && (
            <button
              onClick={handleRunOcr}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting OCR Values...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze with Document AI
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Results panel (Right columns) */}
      <div className="lg:col-span-2">
        {docResult ? (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-full">
                DOCUMENT AI RESULTS
              </span>
              <h2 className="text-base font-black text-white">
                {documents.find(d => d.id === selectedDocId)?.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Summary */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 md:col-span-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <FileText className="w-4 h-4" />
                  Extracted Summary
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {docResult.summary}
                </p>
              </div>

              {/* Milestones & Key Dates */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <Calendar className="w-4 h-4" />
                  Key Submission Milestones
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                  {docResult.keyDates}
                </p>
              </div>

              {/* EMD specifications */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <DollarSign className="w-4 h-4" />
                  Earnest Money Deposit (EMD)
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {docResult.emd}
                </p>
              </div>

              {/* Tender Value */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <DollarSign className="w-4 h-4" />
                  Estimated Contract Value
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed font-bold font-mono">
                  {docResult.tenderValue}
                </p>
              </div>

              {/* Required Certificates */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Prequal Contractor Licenses
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {docResult.requiredCertificates}
                </p>
              </div>

              {/* Critical Clauses */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 md:col-span-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <ShieldAlert className="w-4 h-4" />
                  Critical Liability & Penalty Clauses
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {docResult.keyClauses}
                </p>
              </div>

              {/* Follow-up Questions */}
              <div className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 space-y-2 md:col-span-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                  <HelpCircle className="w-4 h-4" />
                  Anomalies & Team Questions Flagged
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed italic">
                  {docResult.questions}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[350px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl text-slate-500 py-12 px-6 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-700 animate-pulse" />
            <h4 className="text-slate-300 font-bold text-sm">Deep Scan Bid Documents</h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Select any document in your shared enterprise repository and click "Analyze with Document AI" to trigger OCR parsing on EMDs, required certificates, and key dates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
