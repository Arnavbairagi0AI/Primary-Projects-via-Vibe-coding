/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AISettings, FAQItem } from '../types';
import { 
  Bot, 
  BookOpen, 
  HelpCircle, 
  Smile, 
  Languages, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Check, 
  Send, 
  User,
  Sparkles
} from 'lucide-react';

interface AIProps {
  businessId: string;
}

export default function AISettingsEditor({ businessId }: AIProps) {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [systemPrompt, setSystemPrompt] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [greetingMessage, setGreetingMessage] = useState('');
  const [tone, setTone] = useState<'professional' | 'friendly' | 'helpful' | 'casual'>('friendly');
  const [languages, setLanguages] = useState<'en' | 'hi' | 'both'>('both');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);

  // FAQ input fields
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // Chat Playground states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: 'customer' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'businesses', businessId, 'settings', 'ai');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as AISettings;
          setSettings(data);
          setSystemPrompt(data.systemPrompt || '');
          setKnowledgeBase(data.knowledgeBase || '');
          setFaqs(data.faqs || []);
          setGreetingMessage(data.greetingMessage || '');
          setTone(data.tone || 'friendly');
          setLanguages(data.languages || 'both');
          setAutoReplyEnabled(data.autoReplyEnabled !== false);

          // Seed playground chat with greeting
          setChatMessages([
            { id: 'g1', sender: 'ai', text: data.greetingMessage || 'Hello! Welcome to our store. How can I assist you?' }
          ]);
        }
      } catch (err) {
        setError('Failed to fetch AI configuration settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [businessId]);

  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      const docRef = doc(db, 'businesses', businessId, 'settings', 'ai');
      const updated: AISettings = {
        systemPrompt,
        knowledgeBase,
        faqs,
        greetingMessage,
        tone,
        languages,
        autoReplyEnabled,
      };

      await updateDoc(docRef, updated as any);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError('Error saving configuration: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFAQ = () => {
    if (!newQuestion || !newAnswer) return;
    const item: FAQItem = {
      id: `faq_${Date.now()}`,
      question: newQuestion,
      answer: newAnswer,
    };
    setFaqs([...faqs, item]);
    setNewQuestion('');
    setNewAnswer('');
  };

  const handleDeleteFAQ = (id: string) => {
    setFaqs(faqs.filter(f => f.id !== id));
  };

  // Chat Playgrounds Simulation trigger
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { id: `u_${Date.now()}`, sender: 'customer', text: userMsg }]);
    setChatLoading(true);

    try {
      // API request to server-side Gemini route
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          knowledgeBase,
          faqs,
          greetingMessage,
          tone,
          languages,
          userInput: userMsg,
          messageHistory: chatMessages.slice(-6), // pass recent messages for context
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setChatMessages(prev => [...prev, { id: `ai_${Date.now()}`, sender: 'ai', text: data.reply }]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev, 
        { id: `err_${Date.now()}`, sender: 'ai', text: `⚠️ (Simulated response error: ${err.message || 'Make sure your GEMINI_API_KEY is configured in Secrets.'})` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ai-settings-editor-panel">
      {/* Settings Form Column */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight font-display flex items-center gap-2">
                <Bot className="w-6 h-6 text-emerald-400" />
                Leo AI Agent Settings
              </h2>
              <p className="text-xs text-gray-400 mt-1">Configure your assistant's rules, system prompt, and FAQs</p>
            </div>
            
            {/* Auto-reply master switch */}
            <div className="flex items-center gap-2 bg-white/5 px-3.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Auto-Reply</span>
              <button
                type="button"
                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                className={`
                  w-8 h-4 rounded-full p-0.5 transition duration-200 focus:outline-none cursor-pointer
                  ${autoReplyEnabled ? 'bg-emerald-500' : 'bg-gray-700'}
                `}
              >
                <div className={`w-3 h-3 rounded-full bg-white transform transition duration-200 ${autoReplyEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm mb-6">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>AI parameters updated. Your WhatsApp bot has adapted the new knowledge base!</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Tone & Languages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Persona Tone of Voice</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-xs outline-none focus:border-emerald-500"
                >
                  <option value="friendly" className="bg-[#0a0a0a]">Friendly & Warm 😊</option>
                  <option value="professional" className="bg-[#0a0a0a]">Professional & Direct 💼</option>
                  <option value="helpful" className="bg-[#0a0a0a]">Helpful & Patient 🤝</option>
                  <option value="casual" className="bg-[#0a0a0a]">Casual & Relaxed 💬</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">WhatsApp Language</label>
                <select
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-xs outline-none focus:border-emerald-500"
                >
                  <option value="both" className="bg-[#0a0a0a]">Hinglish / Mix (Hindi + English) 🇮🇳</option>
                  <option value="en" className="bg-[#0a0a0a]">English Only 🇬🇧</option>
                  <option value="hi" className="bg-[#0a0a0a]">Hindi Only (हिंदी) 🌸</option>
                </select>
              </div>
            </div>

            {/* Default Greeting Message */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Default WhatsApp Greeting Message</label>
              <input
                type="text"
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                placeholder="Namaste! Welcome to our shop..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Custom System Instruction Prompt */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Smile className="w-4 h-4 text-emerald-400" />
                Custom AI System Prompt (Core Instructions)
              </label>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Act as a friendly manager. Guide customers to ordering, offer discounts on order values over ₹500, etc."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            {/* Business Knowledge Base */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                Knowledge Base (Locations, Delivery, Prices, Policies)
              </label>
              <textarea
                rows={5}
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
                placeholder="Write business specifics here, such as locations, delivery rates, accepted UPI IDs, refund rules, size charts, or facilities."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:border-emerald-500 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* FAQs Management Block */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
          <h3 className="text-md font-bold text-white tracking-tight font-display flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            Frequently Asked Questions (FAQs)
          </h3>

          {/* New FAQ Input form */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-4 space-y-3">
            <input
              type="text"
              placeholder="Question: e.g. Do you have parking space?"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 text-white text-xs outline-none focus:border-emerald-500"
            />
            <textarea
              rows={2}
              placeholder="Answer: e.g. Yes, we offer free parking for cars and bikes outside our clinic."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 text-white text-xs outline-none resize-none focus:border-emerald-500"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddFAQ}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                Add to FAQs List
              </button>
            </div>
          </div>

          {/* Current FAQ List */}
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {faqs.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-6">No custom FAQ items configured yet.</p>
            ) : (
              faqs.map((faq) => (
                <div key={faq.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-start gap-4">
                  <div>
                    <p className="text-xs font-bold text-white">Q: {faq.question}</p>
                    <p className="text-xs text-gray-400 mt-1">A: {faq.answer}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteFAQ(faq.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Save Bar */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-sm rounded-xl cursor-pointer transition disabled:opacity-55"
            id="save-ai-settings-btn"
          >
            {saving ? 'Synchronizing parameters...' : 'Save AI Configuration'}
          </button>
        </div>
      </div>

      {/* Interactive WhatsApp Chat Playground Simulator */}
      <div className="lg:col-span-5">
        <div className="sticky top-6 bg-[#0c1317] border border-[#222d32] rounded-2xl overflow-hidden shadow-2xl h-[650px] flex flex-col">
          {/* WhatsApp Simulator Header */}
          <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-[#2a3942]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-black text-xs shadow-md shadow-emerald-500/15">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white font-display">Leo AI Playground</span>
                  <span className="inline-block px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-extrabold uppercase">Demo</span>
                </div>
                <span className="text-[10px] text-[#8696a0] font-medium flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Agent Simulation
                </span>
              </div>
            </div>
            <button
              onClick={() => setChatMessages([{ id: 'g1', sender: 'ai', text: greetingMessage || 'Hello! How can I assist you today?' }])}
              className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
            >
              Reset Chat
            </button>
          </div>

          {/* Conversation Bubbles Window */}
          <div 
            className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col"
            style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: "overlay", backgroundColor: "#0b141a" }}
          >
            {chatMessages.map((msg) => {
              const isAI = msg.sender === 'ai';
              return (
                <div 
                  key={msg.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed relative ${
                    isAI 
                      ? 'bg-[#202c33] text-white self-start border border-[#2a3942]' 
                      : 'bg-[#005c4b] text-white self-end'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className="block text-[8px] text-gray-400 text-right mt-1">21:30</span>
                </div>
              );
            })}

            {chatLoading && (
              <div className="bg-[#202c33] border border-[#2a3942] text-white self-start max-w-[85%] rounded-xl px-4 py-2.5 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
          </div>

          {/* Send Input Bar */}
          <form onSubmit={handleSendTestMessage} className="bg-[#202c33] px-3 py-3 border-t border-[#2a3942] flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Leo AI a test question..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-[#2a3942] border border-transparent rounded-xl py-2 px-4 text-white text-xs outline-none focus:border-emerald-500 transition placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="p-2.5 bg-[#00a884] hover:bg-[#00c298] text-white rounded-full transition disabled:opacity-55 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
