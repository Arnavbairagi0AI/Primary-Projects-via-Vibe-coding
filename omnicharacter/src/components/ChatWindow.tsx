/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Character, Message, MemoryItem, UserProfile } from '../types';
import { 
  Send, 
  ArrowLeft, 
  Settings, 
  MoreVertical, 
  Trash2, 
  Bookmark, 
  Pin, 
  Edit3, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Image as ImageIcon, 
  Paperclip, 
  Mic, 
  MicOff, 
  Share2, 
  Download, 
  Upload, 
  ShieldAlert,
  BrainCircuit,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

interface ChatWindowProps {
  character: Character;
  messages: Message[];
  activeUserId: string;
  userProfile: UserProfile | null;
  onSendMessage: (text: string, type?: 'text' | 'image' | 'voice' | 'file', attachmentUrl?: string) => Promise<void>;
  onBack: () => void;
  onClearHistory: () => void;
  onDeleteMessage: (msgId: string) => void;
  onUpdateMessage: (msgId: string, newText: string) => void;
  onRetryResponse: () => void;
  onSaveMemory: (item: MemoryItem) => void;
  memories: MemoryItem[];
}

export default function ChatWindow({
  character,
  messages,
  activeUserId,
  userProfile,
  onSendMessage,
  onBack,
  onClearHistory,
  onDeleteMessage,
  onUpdateMessage,
  onRetryResponse,
  onSaveMemory,
  memories
}: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentExpression, setCurrentExpression] = useState(character.avatar);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showMemoryTimeline, setShowMemoryTimeline] = useState(false);
  const [relationshipScore, setRelationshipScore] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Update relationship rating from memories
  useEffect(() => {
    if (memories && memories.length > 0) {
      const highestScore = Math.max(...memories.map(m => m.relationshipScore));
      if (highestScore > 0) {
        setRelationshipScore(highestScore);
      }
    }
  }, [memories]);

  // Detect expression changes based on text keywords (such as smiles, cries, frowned)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== 'user') {
        const text = lastMessage.text.toLowerCase();
        if (character.expressions) {
          if (text.includes('smile') || text.includes('happy') || text.includes('laugh')) {
            setCurrentExpression(character.expressions.happy || character.avatar);
          } else if (text.includes('cry') || text.includes('sad') || text.includes('tears') || text.includes('frown')) {
            setCurrentExpression(character.expressions.sad || character.avatar);
          } else if (text.includes('think') || text.includes('ponder') || text.includes('curious') || text.includes('hmm')) {
            setCurrentExpression(character.expressions.thoughtful || character.avatar);
          } else {
            setCurrentExpression(character.expressions.default || character.avatar);
          }
        }
      }
    }
  }, [messages, character]);

  // Handle Speech-To-Text (STT)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(prev => prev + ' ' + transcript);
        setIsRecording(false);
      };

      rec.onerror = () => {
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Text-To-Speech (TTS)
  const speakText = (text: string) => {
    if (!isSpeechEnabled) return;
    // Remove asterisks/actions before speaking for cleaner audio
    const speechClean = text.replace(/\*[^*]*\*/g, '').trim();
    if (speechClean) {
      const utterance = new SpeechSynthesisUtterance(speechClean);
      utterance.pitch = character.voicePitch || 1.0;
      utterance.rate = character.voiceSpeed || 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  // Send message
  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;
    
    const textToSend = inputText;
    setInputText('');
    
    setIsTyping(true);
    try {
      if (selectedImage) {
        await onSendMessage(textToSend || `*Sent an image attachment*`, 'image', selectedImage);
        setSelectedImage(null);
      } else {
        await onSendMessage(textToSend, 'text');
      }

      // Check if text synthesis is activated
      if (isSpeechEnabled && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.senderId !== 'user') {
          speakText(lastMsg.text);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  // Document upload mockup helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (file.type.startsWith('image/')) {
        setSelectedImage(result);
      } else {
        // Mock PDF/TXT parser - inject document text to dialogue input
        const docSummary = `[Document: ${file.name} - ${file.size} bytes]\n*I have uploaded and read this document. Please analyze the contents:*\n${result.slice(0, 1500)}`;
        setInputText(docSummary);
      }
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Filter messages for search
  const filteredMessages = messages.filter(m => 
    m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportChat = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `OmniAI_Chat_${character.name}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Get relationship stage
  const getRelationshipStage = (score: number) => {
    if (score < 40) return { label: 'Strangers', color: 'text-slate-400', bg: 'bg-slate-500/20' };
    if (score < 60) return { label: 'Acquaintances', color: 'text-teal-400', bg: 'bg-teal-500/20' };
    if (score < 80) return { label: 'Good Friends', color: 'text-indigo-400', bg: 'bg-indigo-500/20' };
    if (score < 92) return { label: 'Deep Companions', color: 'text-pink-400', bg: 'bg-pink-500/20' };
    return { label: 'Soulmates', color: 'text-amber-400 font-extrabold', bg: 'bg-amber-500/20' };
  };

  const relationshipStage = getRelationshipStage(relationshipScore);

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] relative bg-slate-950/60 border border-slate-900 rounded-3xl overflow-hidden">
      {/* Upper Glass Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <img 
            src={currentExpression} 
            alt={character.name} 
            className="w-11 h-11 rounded-full object-cover border border-teal-500/30 transition-all duration-300 transform hover:scale-105"
            referrerPolicy="no-referrer"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-white text-base truncate">{character.name}</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                {character.mode}
              </span>
            </div>
            {/* Relationship Meter */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-teal-400 to-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${relationshipScore}%` }}
                />
              </div>
              <span className={`text-[10px] ${relationshipStage.color}`}>
                {relationshipStage.label} ({relationshipScore})
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
            className={`p-2 rounded-xl transition-all ${isSpeechEnabled ? 'text-teal-400 bg-teal-400/10' : 'text-slate-500 hover:text-slate-300'}`}
            title="Toggle Text-To-Speech (Auto-Speak)"
          >
            {isSpeechEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-xl text-slate-500 hover:text-slate-300 ${showSearch ? 'bg-slate-800' : ''}`}
            title="Search conversation"
          >
            🔍
          </button>
          <button 
            onClick={() => setShowMemoryTimeline(!showMemoryTimeline)}
            className={`p-2 rounded-xl text-slate-500 hover:text-slate-300 ${showMemoryTimeline ? 'bg-slate-800' : ''}`}
            title="Character long-term memory"
          >
            <BrainCircuit className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Slide-out Search Panel */}
      {showSearch && (
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex gap-4 items-center z-10 animate-fade-in">
          <input 
            type="text" 
            placeholder="Search words, notes, messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-teal-500"
          />
          {searchQuery && (
            <span className="text-xs text-slate-500">{filteredMessages.length} results</span>
          )}
        </div>
      )}

      {/* Main chat layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Messages Stream */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <img 
                src={character.avatar} 
                alt={character.name} 
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-800/80"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-lg">{character.name}</h3>
                <p className="text-xs text-slate-500 max-w-xs">{character.subtitle}</p>
              </div>
              <div className="max-w-md p-5 bg-slate-900/40 border border-slate-800/60 rounded-2xl text-sm text-slate-300 leading-relaxed italic">
                "{character.greeting}"
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(searchQuery ? filteredMessages : messages).map((msg) => {
                const isUser = msg.senderId === 'user';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    {!isUser && (
                      <img 
                        src={msg.expressionUrl || currentExpression} 
                        alt={character.name} 
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    
                    <div className="space-y-1 max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">
                          {isUser ? (userProfile?.displayName || 'You') : character.name}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Message Bubble Card */}
                      <div className={`p-4 rounded-2xl text-sm border leading-relaxed relative group ${
                        isUser 
                          ? 'bg-indigo-600/25 border-indigo-500/20 text-white rounded-tr-none' 
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-100 rounded-tl-none'
                      }`}>
                        
                        {/* Display message text with action markers italics */}
                        <div className="space-y-2 whitespace-pre-wrap">
                          {msg.text.split('*').map((chunk, i) => {
                            if (i % 2 !== 0) {
                              return <span key={i} className="text-slate-400 italic font-medium">{chunk}</span>;
                            }
                            return chunk;
                          })}
                        </div>

                        {/* Image attachment rendering */}
                        {msg.type === 'image' && msg.attachmentUrl && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-slate-800 max-w-sm">
                            <img src={msg.attachmentUrl} alt="attachment" className="w-full h-auto object-cover" />
                          </div>
                        )}

                        {/* Speech Synthesis trigger button for character */}
                        {!isUser && (
                          <button 
                            onClick={() => speakText(msg.text)}
                            className="absolute right-2 bottom-2 p-1 bg-slate-950/80 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Controls for messages */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isUser && (
                            <button 
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditText(msg.text);
                              }}
                              className="p-1 bg-slate-950 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white"
                              title="Edit message"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                          <button 
                            onClick={() => onDeleteMessage(msg.id)}
                            className="p-1 bg-slate-950 hover:bg-slate-800 rounded-md text-red-400 hover:text-red-500"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Dynamic streaming response block */}
              {isTyping && (
                <div className="flex gap-4 justify-start">
                  <img 
                    src={currentExpression} 
                    alt={character.name} 
                    className="w-9 h-9 rounded-full object-cover border border-slate-800 animate-pulse"
                    referrerPolicy="no-referrer"
                  />
                  <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Slide-out Character Memory Overview */}
        {showMemoryTimeline && (
          <div className="w-80 bg-slate-900 border-l border-slate-800/80 p-6 flex flex-col justify-between z-10 animate-slide-in">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-teal-400" />
                  <h3 className="font-bold text-white text-sm">Long-term Memory</h3>
                </div>
                <button 
                  onClick={() => setShowMemoryTimeline(false)}
                  className="text-xs text-slate-500 hover:text-white"
                >
                  Close
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                As you chat, {character.name} automatically synthesizes key milestones, preferences, and details about your background to build deep memory connections.
              </p>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Extracted Memories</h4>
                {memories.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-600 italic">
                    No memories forged yet. Chat more to trigger summarization!
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {memories.map(m => (
                      <div 
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 relative group"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] uppercase font-bold">
                          {m.category}
                        </span>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed italic">
                          "{m.fact}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold">
                <span>⚡ Relationship Booster</span>
              </div>
              <p className="text-[11px] text-slate-500">Every 5 turns, AI updates character's relationship stage based on sentiment analysis.</p>
            </div>
          </div>
        )}

        {/* Settings modal drawer */}
        {showSettings && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md p-6 z-30 flex flex-col justify-between animate-fade-in">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-400" />
                  Conversation Tuning
                </h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs"
                >
                  Done
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Advanced Slider */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white">Generation Control</h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Creativity (Temp)</span>
                      <span className="text-teal-400 font-mono">{character.temperature}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1.5" 
                      step="0.05" 
                      value={character.temperature} 
                      disabled
                      className="w-full accent-teal-400 bg-slate-800 h-1.5 rounded-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Response Length (Max Tokens)</span>
                      <span className="text-teal-400 font-mono">{character.maxTokens}</span>
                    </div>
                    <input 
                      type="range" 
                      min="100" 
                      max="1000" 
                      step="50" 
                      value={character.maxTokens} 
                      disabled
                      className="w-full accent-teal-400 bg-slate-800 h-1.5 rounded-full"
                    />
                  </div>
                </div>

                {/* Operations */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white">Diagnostics & Backup</h4>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={exportChat}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold text-left"
                    >
                      <Download className="w-4 h-4 text-indigo-400" />
                      Export Conversation Log (.json)
                    </button>
                    <button 
                      onClick={onRetryResponse}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold text-left"
                    >
                      <RefreshCw className="w-4 h-4 text-teal-400" />
                      Re-generate Last Response
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm("Are you sure you want to wipe all chat messages for this character? This cannot be undone.")) {
                          onClearHistory();
                          setShowSettings(false);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 rounded-xl text-xs font-semibold text-left"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      Delete Chat Permanently
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-950/30 border border-indigo-900/40 p-4 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h5 className="text-xs font-bold text-white">Full Privacy Encrypted</h5>
                <p className="text-[10px] text-slate-500 leading-relaxed">This chat runs server-side on secured Sandbox nodes. We do not sell or store chats for visual models training.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editing Message Overlay */}
      {editingMessageId && (
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex gap-4 items-center z-10 animate-fade-in">
          <input 
            type="text" 
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white"
          />
          <button 
            onClick={() => {
              onUpdateMessage(editingMessageId, editText);
              setEditingMessageId(null);
            }}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold"
          >
            Save Edit
          </button>
          <button 
            onClick={() => setEditingMessageId(null)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Input controls bottom */}
      <div className="p-4 bg-slate-900/60 backdrop-blur-md border-t border-slate-800/80 z-20">
        
        {/* Upload previews */}
        {selectedImage && (
          <div className="pb-3 flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-800">
              <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-0.5 right-0.5 bg-slate-950/80 text-white text-[10px] p-0.5 rounded-full"
              >
                ✕
              </button>
            </div>
            <span className="text-xs text-slate-500 font-medium">Image queued for message...</span>
          </div>
        )}

        <div className="flex gap-2.5 items-center">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shrink-0"
            title="Attach Image or document"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,text/plain"
            className="hidden"
          />

          <input 
            type="text" 
            placeholder={`Message ${character.name}... (Actions in *asterisks*, e.g., *grabs tea*)`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-950/85 hover:border-slate-800 focus:border-indigo-500 border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
          />

          <button 
            onClick={toggleRecording}
            className={`p-3 border rounded-2xl transition-all shrink-0 ${isRecording ? 'bg-red-500/20 border-red-500/30 text-red-500 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'}`}
            title="Use microphone (Voice-To-Text)"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button 
            onClick={handleSend}
            disabled={!inputText.trim() && !selectedImage}
            className={`p-3.5 rounded-2xl text-slate-950 font-bold transition-all shrink-0 shadow-lg ${
              (inputText.trim() || selectedImage) 
                ? 'bg-gradient-to-r from-teal-400 to-indigo-400 hover:scale-105 hover:from-teal-300' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
