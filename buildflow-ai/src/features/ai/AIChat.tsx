import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  Loader2, 
  History, 
  Trash2, 
  MessageSquare,
  Search,
  BookOpen
} from 'lucide-react';

interface AIChatProps {
  tenders: any[];
}

export default function AIChat({ tenders }: AIChatProps) {
  const { user } = { user: useAuth().user };
  const { showToast } = useToast();

  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: "Hello! I am BuildFlow AI, your dedicated Tender Intelligence specialist. I can analyze and answer highly technical or legal questions regarding any tender in your active repository. Select a tender below to ground my intelligence!" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [loading, setLoading] = useState(false);

  // Threads history
  const [threads, setThreads] = useState<any[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadThreads = async () => {
    if (!user || !user.companyId) return;
    setLoadingThreads(true);
    try {
      const q = query(
        collection(db, 'aiChats'),
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
      setThreads(list.slice(0, 20));
    } catch (err) {
      console.error("Failed to load chat threads:", err);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    // Fetch grounding context if any tender is selected
    let contextText = '';
    if (selectedTenderId) {
      const activeTender = tenders.find(t => t.id === selectedTenderId);
      if (activeTender) {
        contextText = `Tender Title: ${activeTender.title}\nAuthority: ${activeTender.authority}\nValue: ${activeTender.value} ${activeTender.valueUnit}\nDescription: ${activeTender.description}`;
      }
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-10), // send last 10 messages for context
          currentMessage: userMessage.content,
          contextText
        })
      });

      if (!response.ok) throw new Error("Chat request failed");

      const data = await response.json();
      const botResponse = { role: 'assistant', content: data.text };
      
      setMessages((prev) => [...prev, botResponse]);

      // Save complete conversation checkpoint in Firestore
      if (user && user.companyId) {
        await addDoc(collection(db, 'aiChats'), {
          companyId: user.companyId,
          userId: user.id,
          title: userMessage.content.substring(0, 35) + '...',
          tenderId: selectedTenderId || null,
          messages: [...messages, userMessage, botResponse],
          timestamp: new Date().toISOString()
        });
        loadThreads();
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: 'assistant', content: "An error occurred while calling the AI. Please verify your connection or retry." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'aiChats', id));
      showToast("Chat thread deleted.", "info");
      loadThreads();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadThread = (thread: any) => {
    setMessages(thread.messages);
    setSelectedTenderId(thread.tenderId || '');
    showToast(`Loaded chat thread: "${thread.title}"`, "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] pb-6 overflow-hidden">
      {/* Sidebar - Threads History & Grounding (Left column) */}
      <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto">
        {/* Grounding Context Selector */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 shrink-0">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800/50">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Grounding Context
            </h3>
          </div>
          <select
            value={selectedTenderId}
            onChange={(e) => setSelectedTenderId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-[11px] focus:ring-1 focus:ring-indigo-500 font-bold cursor-pointer outline-none"
          >
            <option value="">General AI Knowledge</option>
            {tenders.map((tender) => (
              <option key={tender.id} value={tender.id}>
                Ground: {tender.title.substring(0, 30)}...
              </option>
            ))}
          </select>
        </div>

        {/* Previous threads list */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800/50 shrink-0">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Recent Chats
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2 min-h-0">
            {loadingThreads ? (
              <p className="text-[11px] text-slate-600 text-center py-4">Syncing...</p>
            ) : threads.length === 0 ? (
              <p className="text-[11px] text-slate-600 text-center py-6">No previous conversations.</p>
            ) : (
              threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => handleLoadThread(thread)}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 hover:border-indigo-500/20 transition-all cursor-pointer flex justify-between items-start gap-2 group"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-semibold text-slate-300 truncate leading-snug">{thread.title}</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase">{thread.timestamp?.split('T')[0]}</p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteThread(thread.id, e)}
                    className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Interface (Right columns) */}
      <div className="lg:col-span-3 flex flex-col bg-slate-900/20 border border-slate-800/80 rounded-3xl overflow-hidden relative">
        {/* Chat window Header */}
        <div className="h-14 bg-slate-900/60 border-b border-slate-800/60 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-black text-slate-200 uppercase tracking-widest">
              {selectedTenderId ? 'GROUNDED ESTIMATING CHAT' : 'GENERAL INTELLIGENCE'}
            </span>
          </div>
          {selectedTenderId && (
            <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-full truncate max-w-[200px]">
              Tender: {tenders.find(t => t.id === selectedTenderId)?.title}
            </span>
          )}
        </div>

        {/* Conversation flow */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Icon wrapper */}
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border text-xs font-bold ${
                  isUser 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10' 
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                </div>

                {/* Message bubble */}
                <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line border ${
                  isUser 
                    ? 'bg-indigo-600/5 border-indigo-500/15 text-slate-200' 
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-300'
                }`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center text-slate-500 text-xs font-bold pl-12 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              Gemini-3.5-Flash estimating variables...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form 
          onSubmit={handleSendMessage}
          className="p-4 bg-slate-900/40 border-t border-slate-800/60 flex gap-3 shrink-0"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={selectedTenderId ? "Ask anything about this grounded tender..." : "Ask standard civil prequal, CPWD guidelines, safety limits..."}
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/10 shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
