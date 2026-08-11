/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Character, Message, UserProfile } from '../types';
import { 
  Send, 
  ArrowLeft, 
  Users, 
  Sparkles, 
  Trash2, 
  Plus, 
  HelpCircle,
  Play
} from 'lucide-react';

interface GroupChatWindowProps {
  characters: Character[];
  messages: Message[];
  activeUserId: string;
  userProfile: UserProfile | null;
  onSendMessage: (text: string, characterId: string) => Promise<void>;
  onBack: () => void;
  onClearHistory: () => void;
}

export default function GroupChatWindow({
  characters,
  messages,
  activeUserId,
  userProfile,
  onSendMessage,
  onBack,
  onClearHistory
}: GroupChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(messages.length === 0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const activeGroupCharacters = characters.filter(c => selectedCharIds.includes(c.id));

  // Handle message sending
  const handleSend = async () => {
    if (!inputText.trim()) return;
    if (selectedCharIds.length === 0) {
      alert("Please select at least one character for your group chat first!");
      return;
    }

    const textToSend = inputText;
    setInputText('');

    // Save user message first
    await onSendMessage(textToSend, 'user');

    // Trigger sequential or selected character replies
    for (const charId of selectedCharIds) {
      const char = characters.find(c => c.id === charId);
      if (!char) continue;

      setIsTyping(char.name);
      // Wait slightly to simulate writing speed
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        await onSendMessage(`[Group Response] responding to user input: "${textToSend}"`, charId);
      } catch (e) {
        console.error("Group chat character response error:", e);
      }
    }
    
    setIsTyping(null);
  };

  // Trigger individual character speak at any time manually
  const triggerCharacterSpeak = async (charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    setIsTyping(char.name);
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      await onSendMessage(`*speaks up* I have a perspective on this. Let's think about this from another angle!`, charId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(null);
    }
  };

  const toggleSelectCharacter = (charId: string) => {
    if (selectedCharIds.includes(charId)) {
      setSelectedCharIds(prev => prev.filter(id => id !== charId));
    } else {
      setSelectedCharIds(prev => [...prev, charId]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-950/60 border border-slate-900 rounded-3xl overflow-hidden relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl shrink-0">
            <Users className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <h2 className="font-extrabold text-white text-base truncate">Omni Group Council</h2>
            <p className="text-xs text-slate-500">
              {activeGroupCharacters.length > 0 
                ? `${activeGroupCharacters.map(c => c.name).join(', ')}` 
                : 'Configure group members'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showConfig 
                ? 'bg-teal-500 text-slate-950 border-teal-500' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Manage Cast ({activeGroupCharacters.length})
          </button>
          
          {messages.length > 0 && (
            <button 
              onClick={() => {
                if (confirm("Reset group council session?")) {
                  onClearHistory();
                }
              }}
              className="p-2 hover:bg-slate-800 rounded-xl text-red-400"
              title="Reset session"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left side Chat logs */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 space-y-4">
          
          {showConfig ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 max-w-xl mx-auto">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-white">Assemble Your Council</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Select up to 5 unique AI minds. Initiate a prompt, and watch them exchange comments, brainstorm concepts, or engage in lively debates!
                </p>
              </div>

              {/* Character Selector checkboxes */}
              <div className="grid grid-cols-2 gap-3 w-full max-h-[250px] overflow-y-auto pr-2">
                {characters.map(char => {
                  const selected = selectedCharIds.includes(char.id);
                  return (
                    <div 
                      key={char.id}
                      onClick={() => toggleSelectCharacter(char.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        selected 
                          ? 'bg-teal-500/10 border-teal-500/40 text-white' 
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <img src={char.avatar} alt={char.name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate text-white">{char.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{char.category}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={() => setShowConfig(false)}
                disabled={selectedCharIds.length === 0}
                className={`w-full py-3 rounded-2xl font-semibold transition-all ${
                  selectedCharIds.length > 0 
                    ? 'bg-gradient-to-r from-teal-400 to-indigo-500 hover:opacity-90 text-slate-950' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Assemble Council & Launch Chat
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const char = characters.find(c => c.id === msg.senderId);
                const isUser = msg.senderId === 'user';
                
                return (
                  <div key={msg.id} className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    {!isUser && char && (
                      <img 
                        src={char.avatar} 
                        alt={char.name} 
                        className="w-9 h-9 rounded-full object-cover border border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    <div className="space-y-1 max-w-[75%]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">
                          {isUser ? (userProfile?.displayName || 'You') : (char?.name || 'Council Adviser')}
                        </span>
                        <span className="text-[9px] text-slate-600">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className={`p-4 rounded-2xl text-sm border leading-relaxed ${
                        isUser 
                          ? 'bg-indigo-600/20 border-indigo-500/20 text-white rounded-tr-none' 
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-100 rounded-tl-none'
                      }`}>
                        {msg.text.split('*').map((chunk, i) => {
                          if (i % 2 !== 0) return <span key={i} className="text-slate-400 italic">{chunk}</span>;
                          return chunk;
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex gap-4 justify-start animate-pulse">
                  <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center font-bold text-[10px] text-teal-400">
                    ...
                  </div>
                  <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl rounded-tl-none">
                    <span className="text-xs text-slate-400 font-semibold">{isTyping} is writing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

        </div>

        {/* Right side Advisor Deck */}
        {!showConfig && activeGroupCharacters.length > 0 && (
          <div className="w-64 bg-slate-900/40 border-l border-slate-900 p-4 flex flex-col justify-between hidden md:flex">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Advisors</h3>
              
              <div className="space-y-2.5">
                {activeGroupCharacters.map(char => (
                  <div 
                    key={char.id}
                    className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3 relative group"
                  >
                    <img src={char.avatar} alt={char.name} className="w-8 h-8 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-white truncate">{char.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wide truncate">{char.mode}</p>
                    </div>

                    <button 
                      onClick={() => triggerCharacterSpeak(char.id)}
                      className="p-1 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-slate-950 border border-teal-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Request answer from this character"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold">
                <HelpCircle className="w-4 h-4" />
                <span>Inter-Speak</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">Advisors automatically respond one after another. Use the play button to trigger specific comments!</p>
            </div>
          </div>
        )}

      </div>

      {/* Input section */}
      {!showConfig && (
        <div className="p-4 bg-slate-900/60 backdrop-blur-md border-t border-slate-800/80 z-20 flex gap-3">
          <input 
            type="text" 
            placeholder="Pose a question or describe a scene to your council..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-950/85 border border-slate-800 focus:border-indigo-500 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`p-3.5 rounded-2xl text-slate-950 font-bold transition-all shrink-0 shadow-lg ${
              inputText.trim() 
                ? 'bg-gradient-to-r from-teal-400 to-indigo-400 hover:scale-105' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

    </div>
  );
}
