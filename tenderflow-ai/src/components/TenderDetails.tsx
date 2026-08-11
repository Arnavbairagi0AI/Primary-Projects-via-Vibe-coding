import React, { useState, useEffect } from 'react';
import { Tender, SavedTender } from '../types';
import { useApp } from '../context/AppContext';
import { db } from '../firebase';
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { 
  ArrowLeft, 
  BrainCircuit, 
  Loader2, 
  CheckSquare, 
  FileCheck, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle,
  UserPlus, 
  FileText, 
  Download, 
  Save, 
  ListChecks, 
  Star, 
  Sparkles,
  ClipboardList,
  MessageSquare,
  UploadCloud,
  Send
} from 'lucide-react';

interface TenderDetailsProps {
  tender: Tender;
  onBack: () => void;
}

export const TenderDetails: React.FC<TenderDetailsProps> = ({ tender, onBack }) => {
  const { 
    currentUser, 
    userProfile, 
    currentCompany, 
    savedTenders, 
    saveTender, 
    toggleFavorite,
    updateTenderNotes,
    updateTenderStatus,
    assignTeamToTender,
    updateChecklistItem,
    logActivity
  } = useApp();

  const savedRecord = savedTenders.find(s => s.tenderId === tender.id);
  const isSaved = savedRecord && savedRecord.status !== 'ignored';
  const isFav = savedRecord?.isFavorite || false;

  // Local states
  const [localNotes, setLocalNotes] = useState('');
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // AI Results state
  const [tenderState, setTenderState] = useState<Tender>(tender);

  // Tabbed AI Submodules state
  const [aiActiveTab, setAiActiveTab] = useState<'scan' | 'risk' | 'chat' | 'upload'>('scan');

  // AI Risk State
  const [riskData, setRiskData] = useState<{
    risks: { level: 'low' | 'medium' | 'high'; title: string; desc: string }[];
    opportunityScore: number;
    mitigationPlan: string;
  } | null>(null);
  const [isRiskLoading, setIsRiskLoading] = useState(false);

  // AI Chat State
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Document Upload State
  const [uploadFileName, setUploadFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [extractedInsights, setExtractedInsights] = useState<any | null>(null);
  const [uploadedDocumentText, setUploadedDocumentText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setTenderState(tender);
    if (savedRecord) {
      setLocalNotes(savedRecord.notes || '');
    }
  }, [tender, savedRecord]);

  const handleRunAi = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tender })
      });

      if (!response.ok) {
        throw new Error('AI Server responded with an error');
      }

      const results = await response.json();
      
      // Update local state
      const updatedTender: Tender = {
        ...tenderState,
        aiSummarized: results.aiSummarized,
        aiEligibility: results.aiEligibility,
        aiRequiredDocs: results.aiRequiredDocs,
        aiTechnicalTerms: results.aiTechnicalTerms,
        aiDifficulty: results.aiDifficulty,
        aiChecklist: results.aiChecklist,
        aiRecommendation: results.aiRecommendation
      };
      
      setTenderState(updatedTender);

      // Save analysis results directly into Firestore on the master tender record so it persists globally
      await setDoc(doc(db, 'tenders', tender.id), updatedTender, { merge: true });
      await logActivity('Run AI Analysis', `Executed Gemini AI analyzer for tender ref: ${tender.refNo}`, 'tender');
    } catch (err: any) {
      console.error(err);
      setAiError('Failed to establish connection to Gemini AI. Showing simulated evaluation fallback.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleRunRiskAnalysis = async () => {
    setIsRiskLoading(true);
    try {
      const response = await fetch('/api/ai/risk-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tender })
      });
      if (!response.ok) throw new Error('Risk analysis failed');
      const data = await response.json();
      setRiskData(data);
      await logActivity('Run AI Risk Analysis', `Executed risk and opportunity score for tender ref: ${tender.refNo}`, 'tender');
    } catch (err) {
      console.error(err);
    } finally {
      setIsRiskLoading(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const userMsg = { role: 'user' as const, text: chatQuery };
    setChatHistory(prev => [...prev, userMsg]);
    const currentQuery = chatQuery;
    setChatQuery('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender,
          message: currentQuery,
          history: chatHistory,
          documentText: uploadedDocumentText
        })
      });
      if (!response.ok) throw new Error('Chat failed');
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'model', text: 'Error establishing connection with TenderFlow AI. Please try again later.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const processFile = async (file: File) => {
    setUploadFileName(file.name);
    setIsUploading(true);
    setExtractedInsights(null);
    setUploadedDocumentText('');

    try {
      const reader = new FileReader();
      const mime = file.type;
      
      if (file.name.endsWith('.pdf')) {
        reader.onload = async () => {
          const resultString = reader.result as string;
          const base64Data = resultString.split(',')[1] || resultString;
          await handleUploadDocumentWithParams(file.name, undefined, base64Data, mime);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = async () => {
          const text = reader.result as string;
          await handleUploadDocumentWithParams(file.name, text, undefined, mime || 'text/plain');
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.error('File reading failed:', err);
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleUploadDocumentWithParams = async (
    fileName: string, 
    fileContent?: string, 
    fileBase64?: string, 
    mimeType?: string
  ) => {
    setUploadFileName(fileName);
    setIsUploading(true);
    setExtractedInsights(null);

    try {
      const response = await fetch('/api/tenders/upload-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, fileContent, fileBase64, mimeType })
      });
      if (!response.ok) throw new Error('Upload analysis failed');
      const data = await response.json();
      setExtractedInsights(data.insights);
      if (data.extractedText) {
        setUploadedDocumentText(data.extractedText);
      } else if (data.insights?.extractedText) {
        setUploadedDocumentText(data.insights.extractedText);
      }
      await logActivity('Upload Tender Doc', `Uploaded document "${fileName}" and extracted parameters.`, 'tender');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadDocumentSimulated = async (fileName: string) => {
    await handleUploadDocumentWithParams(fileName);
  };

  const handleSaveNotes = async () => {
    await updateTenderNotes(tender.id, localNotes);
    alert('Notes successfully updated!');
  };

  const handleAssignTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeEmail) return;
    
    const currentTeam = savedRecord?.assignedTeam || [];
    if (currentTeam.includes(assigneeEmail)) {
      alert('This user is already assigned.');
      return;
    }

    const updatedTeam = [...currentTeam, assigneeEmail];
    await assignTeamToTender(tender.id, updatedTeam);
    setAssigneeEmail('');
    alert(`Assigned ${assigneeEmail} to this tender bid task force.`);
  };

  const handleRemoveAssignee = async (email: string) => {
    const currentTeam = savedRecord?.assignedTeam || [];
    const updatedTeam = currentTeam.filter(e => e !== email);
    await assignTeamToTender(tender.id, updatedTeam);
  };

  const handleToggleChecklistLocal = async (taskText: string, currentCompleted: boolean) => {
    // Write checklist item updates to savedTenders in Firestore
    await updateChecklistItem(tender.id, taskText, !currentCompleted);
  };

  const handleDownloadDoc = (type: string) => {
    alert(`Downloading simulated Official Tender ${type} for ${tender.refNo}. E-Signature valid.`);
  };

  // Safe checks for arrays
  const aiEligibility = tenderState.aiEligibility || [];
  const aiRequiredDocs = tenderState.aiRequiredDocs || [];
  const aiTechnicalTerms = tenderState.aiTechnicalTerms || [];
  
  // Combine core checklist from master tender with company-completed states from SavedTender doc
  const masterChecklist = tenderState.aiChecklist || [];
  const companyChecklist = savedRecord?.checklist || [];

  const mergedChecklist = masterChecklist.map(item => {
    const matchedCompleted = companyChecklist.find((c: any) => c.task === item.task);
    return {
      task: item.task,
      completed: matchedCompleted ? matchedCompleted.completed : false
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </button>

        {currentUser && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => toggleFavorite(tender.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isFav 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              <Star className={`h-4 w-4 ${isFav ? 'fill-amber-500' : ''}`} />
              {isFav ? 'Favourited' : 'Add to Favourite'}
            </button>

            <button 
              onClick={() => saveTender(tender.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSaved 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {isSaved ? 'Saved to Bid Board' : 'Save to Bid Board'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (Tender Info + AI Intelligence) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-sm tracking-wider font-semibold">
                Reference: {tender.refNo}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Created on: {new Date(tender.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight mb-4">
              {tender.title}
            </h1>

            {/* Core Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 mb-6">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Authority</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">{tender.authority}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Department</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">{tender.department}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Estimated Value</span>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block font-mono">
                  ₹{(tender.value).toLocaleString('en-IN')} INR
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Location</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">{tender.city}, {tender.state}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Domain Category</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">{tender.category}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Bid Submission Deadline</span>
                <span className="text-xs font-semibold text-rose-500 block">
                  {new Date(tender.deadline).toLocaleDateString()} {new Date(tender.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Official Document Downloads */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Official Ingested Tender Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button 
                  onClick={() => handleDownloadDoc('Detailed Notice Inviting Tender (NIT)')}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-100 dark:hover:bg-slate-950/40 text-left text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  <span>1. Detailed Notice Inviting Tender.pdf</span>
                  <Download className="h-4 w-4 text-slate-400" />
                </button>
                <button 
                  onClick={() => handleDownloadDoc('Bill of Quantities (BoQ) Template')}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20 hover:bg-slate-100 dark:hover:bg-slate-950/40 text-left text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  <span>2. Bill of Quantities (BoQ).xls</span>
                  <Download className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

          </div>

          {/* AI Intelligence Module */}
          <div className="bg-linear-to-b from-indigo-900/10 to-transparent border border-indigo-500/20 dark:border-indigo-500/15 rounded-3xl p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-indigo-500" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">TenderFlow AI Copilot</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gemini 2.5 Multi-Modal Bidding Engine</p>
                </div>
              </div>

              {/* Submodule Tab Selectors */}
              <div className="flex bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60 gap-1">
                <button 
                  onClick={() => setAiActiveTab('scan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${aiActiveTab === 'scan' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <ListChecks className="h-3.5 w-3.5" /> Scan
                </button>
                <button 
                  onClick={() => setAiActiveTab('risk')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${aiActiveTab === 'risk' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Risk & Fit
                </button>
                <button 
                  onClick={() => setAiActiveTab('chat')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${aiActiveTab === 'chat' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Chat
                </button>
                <button 
                  onClick={() => setAiActiveTab('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${aiActiveTab === 'upload' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  <UploadCloud className="h-3.5 w-3.5" /> Ingest
                </button>
              </div>
            </div>

            {aiError && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-xl font-medium">
                {aiError}
              </div>
            )}

            {/* TAB PANEL 1: SCAN DETAILS */}
            {aiActiveTab === 'scan' && (
              <div className="space-y-6">
                {!tenderState.aiSummarized && !isAiLoading ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40 p-6">
                    <BrainCircuit className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">AI Deep Scan Pending</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                      Analyze the notice inviting tender (NIT) instantly to extract required documents, turnover eligibility, difficulty, and get a bid checklist!
                    </p>
                    <button 
                      onClick={handleRunAi}
                      className="mx-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" /> Run Gemini AI Scan
                    </button>
                  </div>
                ) : isAiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-900/40 rounded-2xl">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Analyzing Bid Documents...</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Extracting clauses, technical criteria, solvency and required checklists...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Recommendation Banner */}
                    {tenderState.aiRecommendation && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-indigo-950/20 dark:bg-indigo-950/40 border border-indigo-500/20">
                        <div className="md:col-span-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-indigo-500/20 pb-4 md:pb-0 md:pr-4">
                          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block text-center">Fit Score</span>
                          <span className="text-4xl font-extrabold text-indigo-500 dark:text-indigo-400">{tenderState.aiRecommendation.score}%</span>
                          <span className="text-[10px] text-slate-400 font-medium mt-1">SME Qualification match</span>
                        </div>

                        <div className="md:col-span-3">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Bid Recommendation:</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              tenderState.aiRecommendation.shouldApply === 'yes' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : tenderState.aiRecommendation.shouldApply === 'maybe'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {tenderState.aiRecommendation.shouldApply === 'yes' ? 'Recommended' : tenderState.aiRecommendation.shouldApply === 'maybe' ? 'Evaluate Caution' : 'Do Not Bid'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            {tenderState.aiRecommendation.reason}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Summarized Scope */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Executive Summary</h3>
                        <button onClick={handleRunAi} className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer">
                          <Sparkles className="h-3 w-3" /> Re-scan
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                        {tenderState.aiSummarized}
                      </p>
                    </div>

                    {/* Eligibility & Documents Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 p-4 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Eligibility Pre-Qualifications
                        </h4>
                        <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          {aiEligibility.map((el, i) => <li key={i} className="leading-snug">{el}</li>)}
                        </ul>
                      </div>

                      <div className="space-y-2 p-4 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <FileCheck className="h-4 w-4 text-indigo-500" /> Mandatory Checklist Documents
                        </h4>
                        <ul className="space-y-1.5 list-disc pl-4 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          {aiRequiredDocs.map((doc, i) => <li key={i} className="leading-snug">{doc}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* Technical Terms explained */}
                    {aiTechnicalTerms.length > 0 && (
                      <div className="space-y-2 p-4 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/40 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <HelpCircle className="h-4 w-4 text-amber-500" /> Technical Terms Jargon Explainer
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {aiTechnicalTerms.map((termObj, i) => (
                            <div key={i} className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{termObj.term}</span>
                              <p className="text-[11px] text-slate-400 leading-snug font-medium">{termObj.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB PANEL 2: AI RISK & OPPORTUNITY */}
            {aiActiveTab === 'risk' && (
              <div className="space-y-4 animate-fade-in">
                {!riskData && !isRiskLoading ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40 p-6">
                    <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Evaluate Risk Profile</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                      Generate a comprehensive risk audit assessing EMD cash lockup, performance delay penalty clauses, and structural project execution margins.
                    </p>
                    <button 
                      onClick={handleRunRiskAnalysis}
                      className="mx-auto bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" /> Analyze Bid Risks & Fit
                    </button>
                  </div>
                ) : isRiskLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-900/40 rounded-2xl">
                    <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">Running Risk Modeling Algorithm...</p>
                    <p className="text-xs text-slate-400">Processing liquid penalties, supplier compliance constraints and solvency ratios...</p>
                  </div>
                ) : (
                  riskData && (
                    <div className="space-y-4">
                      {/* Fit Opportunity score KPI */}
                      <div className="p-5 rounded-2xl bg-slate-900/5 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Bid Match Opportunity Score</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Calculated based on target states, categories & track record</span>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black text-indigo-500 font-mono">{riskData.opportunityScore}%</span>
                          <span className="text-[9px] text-emerald-500 font-bold block">High Probability Fit</span>
                        </div>
                      </div>

                      {/* Risks Lists */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identified Risk Clauses</h3>
                        <div className="space-y-2.5">
                          {riskData.risks.map((r, i) => (
                            <div key={i} className="p-4 bg-white dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800 rounded-xl flex items-start gap-3">
                              <span className={`px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider ${
                                r.level === 'high' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                                r.level === 'medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              }`}>
                                {r.level} Risk
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{r.title}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal font-medium">{r.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mitigation plan card */}
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-1">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Recommended Corporate Mitigation Strategy</span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">{riskData.mitigationPlan}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* TAB PANEL 3: INTERACTIVE AI CHAT ASSISTANT */}
            {aiActiveTab === 'chat' && (
              <div className="space-y-4 animate-fade-in flex flex-col min-h-[350px]">
                {/* Active doc banner */}
                {uploadedDocumentText && (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-xl flex items-center justify-between font-medium">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" />
                      Active Context: <strong>{uploadFileName}</strong> ({uploadedDocumentText.length.toLocaleString()} chars)
                    </span>
                    <button 
                      onClick={() => {
                        setUploadedDocumentText('');
                        setUploadFileName('');
                        setExtractedInsights(null);
                      }} 
                      className="text-[10px] text-rose-500 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Chat Message Box */}
                <div className="flex-1 overflow-y-auto max-h-[260px] space-y-3 p-3 bg-slate-950/20 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 scrollbar-thin">
                  {chatHistory.length === 0 ? (
                    <div className="text-center py-10">
                      <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">TenderFlow AI Copilot Chat</p>
                      <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal mt-1">
                        {uploadedDocumentText 
                          ? `Ask specific questions about eligibility, deadlines, or compliance requirements contained in the uploaded document "${uploadFileName}".`
                          : "Ask any questions about eligibility clauses, solvency parameters, submission paperwork, or EMD bank guarantees."}
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((h, i) => (
                      <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-medium leading-relaxed ${
                          h.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-br-none shadow-md' 
                            : 'bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-none shadow-xs'
                        }`}>
                          {h.text}
                        </div>
                      </div>
                    ))
                  )}

                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-slate-400 flex items-center gap-1.5 font-medium font-mono">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" /> Thinking...
                      </div>
                    </div>
                  )}
                </div>

                {/* Form to submit chat queries */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2">
                  <input 
                    type="text"
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    placeholder={uploadedDocumentText ? "Ask about the document, e.g. What is the EMD requirement?" : "e.g. Do we qualify with ₹12 Crore prior turnover?"}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 placeholder-slate-400"
                  />
                  <button 
                    type="submit"
                    disabled={isChatLoading || !chatQuery.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB PANEL 4: DOCUMENT EXTRACTOR & INGESTION */}
            {aiActiveTab === 'upload' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Upload drag drop panel */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30'
                  }`}
                >
                  <UploadCloud className={`h-10 w-10 mx-auto mb-2 transition-transform ${isDragging ? 'scale-110 text-indigo-500' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">Drag & Drop Tender Documents</span>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-normal mt-0.5 mb-4">Supports Notice Inviting Tender (NIT), BoQ Sheets, or corporate qualifications (.pdf, .docx, .txt)</p>
                  
                  {/* Real File Input selection */}
                  <div className="mb-4">
                    <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-xs">
                      <UploadCloud className="h-4 w-4" /> Browse Local File
                      <input 
                        type="file" 
                        accept=".pdf,.txt,.docx" 
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">— Or select test presets —</div>
                  {/* Quick select presets for seamless testing */}
                  <div className="flex flex-wrap justify-center gap-2">
                    <button 
                      type="button"
                      onClick={() => handleUploadDocumentSimulated('NIT_Metro_Rail_PhaseII.pdf')}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 cursor-pointer"
                    >
                      📄 Metro_NIT_Notice.pdf
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleUploadDocumentSimulated('BoQ_Solar_Contract_Final.xls')}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 cursor-pointer"
                    >
                      📊 Solar_BoQ_Pricing.xls
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleUploadDocumentSimulated('Vendor_Affidavit_Declaration.docx')}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 cursor-pointer"
                    >
                      📄 Corporate_Affidavit.docx
                    </button>
                  </div>
                </div>

                {/* Upload Extraction Progress state */}
                {isUploading && (
                  <div className="flex flex-col items-center justify-center py-6 text-center bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                    <Loader2 className="h-6 w-6 text-indigo-500 animate-spin mb-2" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ingesting "{uploadFileName}"...</span>
                    <p className="text-[10px] text-slate-400">Extracting clauses, turnover limits, ISO standards and bid-securities using Gemini OCR...</p>
                  </div>
                )}

                {/* Extracted insights rendered */}
                {extractedInsights && (
                  <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Extraction Completed</span>
                      <span className="text-emerald-500 font-bold text-xs">100% Parsed</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-medium">Extracted Value Estimate</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-100">₹{extractedInsights.extractedValue.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-medium">Earnest Money (EMD)</span>
                        <span className="font-bold font-mono text-indigo-500">₹{extractedInsights.extractedEmd.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] text-slate-400 block font-medium">Execution Timeline</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{extractedInsights.extractedTimeline}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">AI Executive Summary</span>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">"{extractedInsights.aiExecutiveSummary}"</p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Required Compliance Certifications Found</span>
                      <ul className="space-y-1 pl-4 list-disc text-[11px] text-slate-400 font-medium">
                        {extractedInsights.inferredRequirements.map((req: string, idx: number) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA to start chat */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => setAiActiveTab('chat')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex justify-center items-center gap-1.5"
                      >
                        <MessageSquare className="h-4 w-4" /> Start Chatting with this Document
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

        {/* Right Column (SaaS Workflows: Status, Checklists, Team, Notes) */}
        <div className="space-y-6">
          
          {/* Workflow status box */}
          {currentUser && isSaved && savedRecord && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="h-4 w-4" /> Bidding Workflow Status
              </h3>

              <div>
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mb-1">Current State</label>
                <select 
                  value={savedRecord.status}
                  onChange={(e) => updateTenderStatus(tender.id, e.target.value as SavedTender['status'])}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="saved">Saved & Under Evaluation</option>
                  <option value="interested">Flagged as Interested</option>
                  <option value="preparing">Bid Documentation Preparation</option>
                  <option value="submitted">Formally Submitted</option>
                  <option value="won">Tender Awarded (Won) 🏆</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              {/* Checklist completion tracker */}
              {tenderState.aiChecklist && (
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Tender Task Checklist</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {mergedChecklist.map((item, i) => (
                      <label 
                        key={i} 
                        className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/20 text-xs font-medium cursor-pointer"
                      >
                        <input 
                          type="checkbox" 
                          checked={item.completed}
                          onChange={() => handleToggleChecklistLocal(item.task, item.completed)}
                          className="mt-0.5 rounded-sm text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className={`leading-snug ${item.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {item.task}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Team Assignment box */}
          {currentUser && isSaved && savedRecord && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="h-4 w-4" /> Bidding Team Assignments
              </h3>

              {/* Form to assign team */}
              {userProfile?.role === 'company_admin' ? (
                <form onSubmit={handleAssignTeam} className="space-y-2">
                  <div className="flex gap-2">
                    <input 
                      type="email"
                      value={assigneeEmail}
                      onChange={(e) => setAssigneeEmail(e.target.value)}
                      placeholder="e.g. employee@indotech.co.in"
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Assign
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-[10px] text-slate-400 italic">Only company administrators can assign team members.</p>
              )}

              {/* Assigned users lists */}
              <div className="space-y-1.5">
                {(savedRecord.assignedTeam || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No team members assigned yet.</p>
                ) : (
                  (savedRecord.assignedTeam || []).map((email) => (
                    <div 
                      key={email} 
                      className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                    >
                      <span className="truncate">{email}</span>
                      {userProfile?.role === 'company_admin' && (
                        <button 
                          onClick={() => handleRemoveAssignee(email)}
                          className="text-rose-500 hover:text-rose-400 font-bold ml-2 cursor-pointer"
                          title="Remove assignment"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Notes module */}
          {currentUser && isSaved && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Save className="h-4 w-4" /> Internal Team Bidding Notes
              </h3>
              <textarea 
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="Write bid pricing details, team coordination notes, meeting dates, or EMD deposit confirmation numbers..."
                rows={4}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
              />
              <button 
                onClick={handleSaveNotes}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-xl transition-colors cursor-pointer flex justify-center items-center gap-1"
              >
                <Save className="h-3.5 w-3.5" /> Save Notes
              </button>
            </div>
          )}

          {/* Invitation if not saved */}
          {currentUser && !isSaved && (
            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl text-center space-y-2">
              <ClipboardList className="h-8 w-8 text-indigo-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Save to Bid Board first</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-normal">
                Bookmark and save this tender to activate status workflows, collaborate with checklists, assign team tasks, and add internal pricing notes.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
