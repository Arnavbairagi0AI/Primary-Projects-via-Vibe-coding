/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, AIChat, ChatMessage, Note, PDFSummary } from '../types';
import { useFeatureGuard } from './FeatureGuard';

interface AIChatTutorProps {
  userProfile: UserProfile;
  chats: AIChat[];
  onAddChat: (chat: AIChat) => void;
  onUpdateChatMessages: (chatId: string, messages: ChatMessage[]) => void;
  notes?: Note[];
  pdfs?: PDFSummary[];
  onNavigate?: (tab: string) => void;
  onUpdatePlan?: (plan: 'free' | 'pro' | 'premium') => void;
  onAddPDF?: (pdf: PDFSummary) => void;
  onIncrementUsage?: (key: 'aiChatsToday' | 'notesGeneratedThisMonth' | 'pdfSummariesGeneratedThisMonth' | 'quizGeneratedThisMonth' | 'flashcardsGeneratedThisMonth') => void;
}

const PRESET_PROMPTS = [
  { text: "Explain Quantum Entanglement simply using an analogy.", icon: "🌌" },
  { text: "प्रकाश संश्लेषण क्या है? इसे सरल शब्दों में समझाएं।", icon: "🌱" },
  { text: "Generate three practice questions on quadratic equations.", icon: "📐" },
  { text: "Summarize the major causes of World War I in bullet points.", icon: "⚖️" }
];

export default function AIChatTutor({
  userProfile,
  chats,
  onAddChat,
  onUpdateChatMessages,
  notes = [],
  pdfs = [],
  onNavigate,
  onUpdatePlan,
  onAddPDF,
  onIncrementUsage
}: AIChatTutorProps) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize UseFeatureGuard hook
  const { checkAccessAndRun, UpgradeDialog } = useFeatureGuard(userProfile, 'aiChat', onUpdatePlan || (() => {}));

  // Model Selection & Upgrade States
  const [selectedModel, setSelectedModel] = useState<'gemini-3.5-flash' | 'gemini-2.5-pro'>('gemini-3.5-flash');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // NotebookLM grounding state
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [selectedPdfs, setSelectedPdfs] = useState<string[]>([]);

  // AI Audio Overview (Podcast) state
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastData, setPodcastData] = useState<{ title: string; turns: any[]; audioUrl: string | null } | null>(null);
  const [podcastError, setPodcastError] = useState<string | null>(null);

  // Active chat calculation
  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, loading]);

  // Handle active chat initialization on mount or chat updates
  useEffect(() => {
    if (chats.length > 0 && !activeChatId) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  const handleCreateNewChat = async (title = 'New Concept Chat') => {
    const newChatId = 'chat_' + Date.now();
    const newChat: AIChat = {
      id: newChatId,
      userId: userProfile.uid,
      title: title,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_welcome_' + Date.now(),
          role: 'model',
          text: `👋 Namaste & Hello! I am your intelligent AI Study Tutor. 

${notes.length > 0 || pdfs.length > 0 ? "👉 Choose sources on the left side to anchor my answers to your notes or documents!" : "📝 Save some notes or upload a PDF to anchor/ground my responses to specific texts."} 

How can I help you understand your topics today?`,
          createdAt: new Date().toISOString()
        }
      ]
    };

    onAddChat(newChat);
    setActiveChatId(newChatId);

    // Save to Firestore if possible
    try {
      await setDoc(doc(db, 'ai_chats', newChatId), newChat);
    } catch (err) {
      console.warn("Firestore offline - created chat locally: ", err);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    checkAccessAndRun(async () => {
      // Create chat if none active
      if (!activeChatId) {
        const tempId = 'chat_' + Date.now();
        const firstChat: AIChat = {
          id: tempId,
          userId: userProfile.uid,
          title: textToSend.substring(0, 24) + '...',
          createdAt: new Date().toISOString(),
          messages: []
        };
        onAddChat(firstChat);
        setActiveChatId(tempId);
        
        const userMsg: ChatMessage = {
          id: 'msg_user_' + Date.now(),
          role: 'user',
          text: textToSend,
          createdAt: new Date().toISOString()
        };
        
        const welcomeMsg: ChatMessage = {
          id: 'msg_welcome_' + Date.now(),
          role: 'model',
          text: "Connecting to the intelligent tutor stream...",
          createdAt: new Date().toISOString()
        };

        const initialMsgs = [userMsg, welcomeMsg];
        onUpdateChatMessages(tempId, initialMsgs);
        setInputMessage('');
        setLoading(true);

        await executeSendMessage(tempId, textToSend, [userMsg]);
      } else {
        const userMsg: ChatMessage = {
          id: 'msg_user_' + Date.now(),
          role: 'user',
          text: textToSend,
          createdAt: new Date().toISOString()
        };

        const updatedMessages = [...(activeChat?.messages || []), userMsg];
        onUpdateChatMessages(activeChatId, updatedMessages);
        setInputMessage('');
        setLoading(true);

        await executeSendMessage(activeChatId, textToSend, updatedMessages);
      }
    });
  };

  const executeSendMessage = async (chatId: string, textToSend: string, messageHistory: ChatMessage[]) => {
    try {
      // Find grounded context
      const selectedNotesData = notes.filter(n => selectedNotes.includes(n.id));
      const selectedPdfsData = pdfs.filter(p => selectedPdfs.includes(p.id));

      let sourcesPromptPart = '';
      if (selectedNotesData.length > 0 || selectedPdfsData.length > 0) {
        sourcesPromptPart = `\n\n[Notebook Grounding Sources Context]
You MUST answer the user's question primarily using the following custom study sources. Add in-text citations like [Source: "Note title"] or [Source: "PDF fileName"] when citing information:
`;
        selectedNotesData.forEach(n => {
          sourcesPromptPart += `- Note Title: "${n.title}"\nContent: "${n.content}"\nSummary: "${n.summary}"\n\n`;
        });
        selectedPdfsData.forEach(p => {
          sourcesPromptPart += `- PDF Document: "${p.fileName}"\nRevision Notes: "${p.revisionNotes}"\nSummary: "${p.summary}"\n\n`;
        });
        sourcesPromptPart += `\nDirective: If the answer can't be found or deduced from the sources, mention that clearly, but still use your broad academic expertise to give a supportive and clear conceptual response.`;
      }

      const systemPrompt = `You are a professional friendly AI Study Tutor. Explain concepts simply, answer questions, provide concrete examples, and solve academic doubts. Support both English and Hindi language. Use formatting, bold headers, and key formulas where applicable. Current plan: ${userProfile.currentPlan}.${sourcesPromptPart} IMPORTANT: Keep your answers extremely direct, clear, and highly concise for high-speed delivery. Avoid verbose opening statements or boilerplate filler.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': userProfile.uid
        },
        body: JSON.stringify({
          messages: messageHistory.filter(m => !m.text.includes("Connecting to")),
          userMessage: textToSend,
          systemPrompt,
          model: selectedModel
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch AI tutor response.');
      }

      const data = await response.json();
      if (onIncrementUsage) onIncrementUsage('aiChatsToday');
      
      const assistantMsg: ChatMessage = {
        id: 'msg_model_' + Date.now(),
        role: 'model',
        text: data.text || "I was unable to formulate an answer. Let's try rephrasing the question.",
        createdAt: new Date().toISOString()
      };

      const finalMessages = [...messageHistory, assistantMsg].filter(m => !m.text.includes("Connecting to"));
      onUpdateChatMessages(chatId, finalMessages);

      // Persist to Firestore
      try {
        const activeObj = chats.find(c => c.id === chatId) || {
          id: chatId,
          userId: userProfile.uid,
          title: textToSend.substring(0, 24) + '...',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'ai_chats', chatId), {
          ...activeObj,
          messages: finalMessages
        });
      } catch (fErr) {
        console.warn("Firestore save update chat skipped:", fErr);
      }

    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: 'msg_error_' + Date.now(),
        role: 'model',
        text: `⚠️ Error contacting the AI Tutor: ${err.message || 'Check your Gemini API key configuration.'}`,
        createdAt: new Date().toISOString()
      };
      onUpdateChatMessages(chatId, [...messageHistory.filter(m => !m.text.includes("Connecting to")), errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Generate Audio Overview Liam & Olivia Podcast
  const handleGeneratePodcast = async () => {
    if (userProfile.currentPlan !== 'premium') {
      setPodcastError("📻 Duo Audio Podcast generation is a Premium exclusive feature. Upgrade to Premium now to listen to Olivia & Liam break down your custom notes and study files!");
      return;
    }

    const selectedNotesData = notes.filter(n => selectedNotes.includes(n.id));
    const selectedPdfsData = pdfs.filter(p => selectedPdfs.includes(p.id));

    if (selectedNotesData.length === 0 && selectedPdfsData.length === 0) {
      setPodcastError("Please select at least one checkmark source on the left to generate an Audio Brief overview.");
      return;
    }

    setPodcastLoading(true);
    setPodcastError(null);
    setPodcastData(null);

    try {
      const notesContent = selectedNotesData.map(n => `Title: ${n.title}\nContent: ${n.content}`).join('\n\n');
      const pdfsContent = selectedPdfsData.map(p => `File: ${p.fileName}\nRevision Notes: ${p.revisionNotes}`).join('\n\n');
      const sourceContents = [notesContent, pdfsContent].filter(Boolean).join('\n\n');

      const res = await fetch('/api/generate-podcast', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': userProfile.uid
        },
        body: JSON.stringify({ sourceContents })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate AI podcast audio overview.");
      }

      const data = await res.json();
      
      // Decode base64 audio to Blob URL
      let audioUrl = null;
      if (data.audio) {
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(blob);
      }

      setPodcastData({
        title: data.title || "StudyFlow Audio Overview",
        turns: data.turns || [],
        audioUrl
      });

    } catch (err: any) {
      console.error(err);
      setPodcastError(err.message || "An error occurred while calling the Gemini Audio Generation service.");
    } finally {
      setPodcastLoading(false);
    }
  };

  const totalSelectedSources = selectedNotes.length + selectedPdfs.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-140px)]">
      
      {/* LEFT COLUMN: GROUNDED NOTEBOOK SOURCES & PODCAST GENERATOR */}
      <div className="lg:col-span-1 space-y-6 flex flex-col justify-between h-full">
        
        {/* Grounding list */}
        <div className="study-card p-5 bg-[#F7F3EE] border border-black/5 flex-1 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="text-[10px] uppercase tracking-wider font-black text-stone-500">
                📚 Grounding Sources
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${totalSelectedSources > 0 ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' : 'bg-stone-200 text-stone-500'}`}>
                {totalSelectedSources} Selected
              </span>
            </div>

            <p className="text-[11px] text-stone-500 leading-normal">
              Select custom notes or PDFs to ground your AI Tutor questions. The tutor will cite selected documents dynamically!
            </p>

            <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
              {/* Notes checklist */}
              {notes.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">My Saved Notes</span>
                  {notes.map(n => (
                    <label key={n.id} className="flex items-start gap-2.5 p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-black/5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedNotes.includes(n.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedNotes([...selectedNotes, n.id]);
                          else setSelectedNotes(selectedNotes.filter(id => id !== n.id));
                        }}
                        className="mt-0.5 w-3.5 h-3.5 rounded border-stone-300 text-brand-sage focus:ring-brand-sage accent-[#5A5A40]"
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-stone-700 line-clamp-1">{n.title}</p>
                        <p className="text-[9px] text-stone-400">Note • {n.content.length} chars</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* PDFs checklist */}
              {pdfs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">My PDFs</span>
                  {pdfs.map(p => (
                    <label key={p.id} className="flex items-start gap-2.5 p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-black/5 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedPdfs.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPdfs([...selectedPdfs, p.id]);
                          else setSelectedPdfs(selectedPdfs.filter(id => id !== p.id));
                        }}
                        className="mt-0.5 w-3.5 h-3.5 rounded border-stone-300 text-brand-sage focus:ring-brand-sage accent-[#5A5A40]"
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-stone-700 line-clamp-1">{p.fileName}</p>
                        <p className="text-[9px] text-stone-400">PDF Document • {p.fileSize}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {notes.length === 0 && pdfs.length === 0 && (
                <div className="text-center py-6 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                  <span className="text-xl">📥</span>
                  <p className="text-[11px] text-stone-400 mt-1 font-medium">No source documents found</p>
                  <p className="text-[9px] text-stone-400 px-4 mt-0.5">Please generate a note or upload a PDF to anchor AI Tutor responses.</p>
                </div>
              )}
            </div>

            {/* Fast upload file / PDF grounded source */}
            {onAddPDF && (
              <div className="pt-3 border-t border-stone-200">
                <label className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-800 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border border-stone-200/50 shadow-sm transition-all duration-200 active:scale-95">
                  <span>📥 Fast Upload PDF/TXT</span>
                  <input 
                    type="file" 
                    accept=".pdf,.txt,.md,.json"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      setLoading(true);
                      
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        try {
                          const text = event.target?.result as string;
                          let contentText = '';
                          if (file.name.endsWith('.pdf')) {
                            const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
                            const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
                            contentText = lines.length > 5 ? lines.slice(0, 150).join('\n') : `[Content from PDF: ${file.name}]`;
                          } else {
                            contentText = text;
                          }
                          
                          // Call PDF Summarizer API to make it real and fully featured!
                          const response = await fetch('/api/generate-summary', {
                            method: 'POST',
                            headers: { 
                              'Content-Type': 'application/json',
                              'x-user-uid': userProfile.uid
                            },
                            body: JSON.stringify({
                              fileName: file.name,
                              fileContent: contentText
                            })
                          });
                          
                          if (!response.ok) {
                            const errData = await response.json().catch(() => ({}));
                            throw new Error(errData.error || 'API limit or error during summary generation.');
                          }
                          
                          const data = await response.json();
                          
                          const newPDF: PDFSummary = {
                            id: 'pdf_' + Date.now(),
                            userId: userProfile.uid,
                            fileName: file.name,
                            fileSize: `${Math.round(file.size / 1024)} KB`,
                            summary: data.summary || 'Summary generated by AI',
                            keyPoints: data.keyPoints || [],
                            formulas: data.formulas || [],
                            definitions: (data.definitions || []).map((d: any) => `${d.term}: ${d.definition}`),
                            revisionNotes: data.revisionNotes || '',
                            createdAt: new Date().toISOString()
                          };
                          
                          // Save to Firestore
                          try {
                            await setDoc(doc(db, 'pdfs', newPDF.id), newPDF);
                          } catch (fErr) {
                            console.warn("Firestore save skip:", fErr);
                          }
                          
                          if (onAddPDF) onAddPDF(newPDF);
                          setSelectedPdfs(prev => [...prev, newPDF.id]);
                        } catch (err: any) {
                          console.error(err);
                          alert("Error processing file: " + err.message);
                        } finally {
                          setLoading(false);
                        }
                      };
                      reader.readAsText(file);
                    }}
                    className="hidden" 
                  />
                </label>
              </div>
            )}
          </div>

          {/* AI Audio Overview (NotebookLM Podcast feature) */}
          <div className="border-t border-stone-200 pt-4 space-y-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-black text-amber-800 flex items-center gap-1.5">
                📻 AI Audio Overview (Podcast)
              </span>
              <p className="text-[10px] text-stone-400 mt-0.5">
                Generate Olivia & Liam's professional dynamic audio summary.
              </p>
            </div>

            {podcastError && (
              <div className="space-y-2">
                <p className={`text-[10px] font-bold p-2.5 rounded-xl border ${podcastError.includes("Premium") ? 'text-amber-800 bg-amber-50/50 border-amber-200' : 'text-red-600 bg-red-50 border-red-100'}`}>
                  ⚠️ {podcastError}
                </p>
                {podcastError.includes("Premium") && onNavigate && (
                  <button
                    onClick={() => onNavigate('settings')}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-[1.02] active:scale-95 text-stone-950 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    👑 Upgrade to Premium Now
                  </button>
                )}
              </div>
            )}

            {!podcastData && !podcastLoading && (
              <button
                onClick={handleGeneratePodcast}
                className="w-full bg-[#5A5A40] text-white font-bold text-xs py-3 rounded-xl uppercase tracking-wider hover:bg-[#494933] transition-colors shadow-sm cursor-pointer"
              >
                🎙️ Generate Duo Podcast Briefing
              </button>
            )}

            {podcastLoading && (
              <div className="space-y-2 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-600 rounded-full animate-ping"></span>
                  <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
                    Generating Olivia & Liam Podcast...
                  </p>
                </div>
                <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full animate-pulse w-3/4"></div>
                </div>
                <p className="text-[9px] text-stone-400 leading-normal italic">
                  Liam & Olivia are synthesizing dialogue script and calling Multi-Speaker TTS preview...
                </p>
              </div>
            )}

            {/* Podcast Player and Transcript */}
            {podcastData && (
              <div className="bg-white p-3 rounded-xl border border-amber-200/50 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-amber-900 truncate max-w-[120px]">
                    📻 {podcastData.title}
                  </p>
                  <button 
                    onClick={() => setPodcastData(null)}
                    className="text-[9px] text-stone-400 hover:text-stone-600 uppercase font-bold"
                  >
                    Clear
                  </button>
                </div>

                {podcastData.audioUrl ? (
                  <audio 
                    src={podcastData.audioUrl} 
                    controls 
                    className="w-full h-8 outline-none text-xs"
                  />
                ) : (
                  <p className="text-[9px] text-stone-400 italic">Audio generation is offline. See transcript below.</p>
                )}

                {/* Micro Turns Transcript viewer */}
                <div className="max-h-[140px] overflow-y-auto space-y-2 border-t border-stone-100 pt-2.5">
                  {podcastData.turns.map((t, idx) => (
                    <div key={idx} className="text-[10px] text-stone-700 leading-normal">
                      <strong className={`font-black uppercase tracking-wider ${t.speaker === 'Liam' ? 'text-blue-700' : 'text-pink-700'}`}>
                        {t.speaker}:
                      </strong>{' '}
                      {t.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MIDDLE 2 COLUMNS: ACTIVE CHAT SCREEN */}
      <div className="lg:col-span-2 bg-[#2C2C2B] rounded-[32px] p-6 text-white flex flex-col justify-between shadow-2xl h-full min-h-[550px]">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-3 mb-4 gap-3">
          <div>
            <h3 className="font-bold text-sm tracking-tight truncate max-w-[280px]">
              {activeChat?.title || "Active Tutor Session"}
            </h3>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mt-0.5">
              {totalSelectedSources > 0 ? `🟢 Grounded in ${totalSelectedSources} Selected Sources` : "📚 General Knowledge Mode"}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Model Toggle Selector */}
            <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl text-[10px] font-black tracking-wider">
              <button 
                onClick={() => {
                  setSelectedModel('gemini-3.5-flash');
                  setShowUpgradePrompt(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${selectedModel === 'gemini-3.5-flash' ? 'bg-[#5A5A40] text-white shadow-sm' : 'text-stone-400 hover:text-stone-200'}`}
              >
                ⚡ Flash Speed
              </button>
              <button 
                onClick={() => {
                  if (userProfile.currentPlan === 'premium') {
                    setSelectedModel('gemini-2.5-pro');
                    setShowUpgradePrompt(false);
                  } else {
                    setShowUpgradePrompt(true);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  selectedModel === 'gemini-2.5-pro' 
                    ? 'bg-amber-500 text-stone-950 shadow-sm' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>🧠 Pro Socratic</span>
                {userProfile.currentPlan !== 'premium' && <span className="text-[9px]">👑</span>}
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-[9px] text-green-400 font-bold uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>

        {/* Upgrade Prompt Notification */}
        {showUpgradePrompt && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-3.5 rounded-2xl mb-4 text-xs space-y-2.5 text-stone-100 flex flex-col justify-between sm:flex-row sm:items-center sm:space-y-0 sm:gap-4 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-amber-400 block tracking-wider">👑 Scholar Premium Feature</span>
              <p className="text-[10.5px] leading-relaxed text-stone-200">
                Socratic Deep-Reasoning Mode (<strong>Gemini 2.5 Pro</strong>) is exclusive to <strong>Premium Scholar</strong> members. Unlock deep conceptual derivations!
              </p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('settings')}
                className="self-start sm:self-center bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-[9.5px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                Upgrade now
              </button>
            )}
          </div>
        )}

        {/* Messages Screen */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 flex flex-col scroll-smooth max-h-[54vh]">
          {activeChat?.messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div 
                className={`p-4 rounded-[20px] text-[13px] leading-relaxed border ${msg.role === 'user' ? 'bg-white/5 text-stone-100 border-white/5 rounded-tr-none' : 'bg-[#5A5A40]/40 text-stone-100 border-white/10 rounded-tl-none'}`}
              >
                <div className="whitespace-pre-line prose prose-invert max-w-none">
                  {msg.text}
                </div>
              </div>
              <span className="text-[8px] text-stone-400 font-bold uppercase tracking-wider mt-1 px-1">
                {msg.role === 'user' ? 'You' : 'AI Tutor'} • {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          ))}

          {loading && (
            <div className="self-start flex flex-col max-w-[85%]">
              <div className="p-4 bg-[#5A5A40]/20 border border-white/5 rounded-[20px] rounded-tl-none text-[13px] text-stone-300">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest font-black text-stone-400">AI Tutor is formulating answers...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Prompt presets */}
        {(!activeChat || activeChat.messages.length <= 1) && !loading && (
          <div className="mb-4">
            <p className="text-[10px] text-stone-400 uppercase tracking-wider font-bold mb-2">Try asking or analyzing:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.text)}
                  className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-left text-xs transition-all flex items-center gap-2 cursor-pointer text-stone-200"
                >
                  <span className="text-sm">{p.icon}</span>
                  <span className="truncate">{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input Box */}
        <div className="flex gap-2">
          <input 
            type="text" 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(inputMessage);
            }}
            placeholder="Ask your query or concept doubt (Support English and Hindi)..." 
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs flex-1 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all text-white"
          />
          <button 
            onClick={() => handleSendMessage(inputMessage)}
            disabled={loading || !inputMessage.trim()}
            className="w-12 h-12 bg-[#5A5A40] text-white rounded-xl flex items-center justify-center font-bold text-lg cursor-pointer hover:bg-[#494933] active:scale-95 transition-all disabled:opacity-50"
          >
            ↑
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: CHAT SESSION HISTORY */}
      <div className="lg:col-span-1 study-card p-5 bg-[#F7F3EE] border border-black/5 flex flex-col justify-between h-full">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[10px] uppercase tracking-wider text-stone-500 font-black">History Logs</p>
            <button 
              onClick={() => handleCreateNewChat()}
              className="text-[10px] bg-[#5A5A40] text-white px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wider cursor-pointer hover:bg-[#494933] transition-colors"
            >
              + New Chat
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[58vh] pr-1">
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${chat.id === activeChatId ? 'bg-white text-[#5A5A40] border border-[#5A5A40]/15 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <div className="flex items-center gap-2 line-clamp-1">
                  <span>💬</span>
                  <span className="truncate">{chat.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#5A5A40] p-4 rounded-2xl text-white space-y-1 mt-4">
          <p className="text-[9px] uppercase tracking-wider opacity-80 font-bold">Premium Tutor</p>
          <p className="text-xs font-serif italic">Hindi & English Dual Support Activated 🟢</p>
        </div>
      </div>

      {UpgradeDialog}
    </div>
  );
}
