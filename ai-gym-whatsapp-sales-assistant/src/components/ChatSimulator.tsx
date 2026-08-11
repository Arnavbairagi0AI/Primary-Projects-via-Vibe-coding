import React, { useState, useEffect, useRef } from "react";
import { 
  Send, User, Bot, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2, 
  Clock, Award, MapPin, Briefcase, Calendar, Info, RefreshCw, Star 
} from "lucide-react";
import { Lead, Message } from "../types";
import { collection, query, orderBy, onSnapshot, getDocs, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface ChatSimulatorProps {
  leads: Lead[];
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
  onRefreshLeads: () => void;
}

export default function ChatSimulator({ 
  leads, 
  selectedLeadId, 
  onSelectLead,
  onRefreshLeads 
}: ChatSimulatorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get active selected lead
  const activeLead = leads.find(l => l.id === selectedLeadId) || null;

  // Listen to messages for active lead
  useEffect(() => {
    if (!selectedLeadId) return;

    const messagesRef = collection(db, "leads", selectedLeadId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgsList: Message[] = [];
        snapshot.forEach((doc) => {
          msgsList.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(msgsList);
      },
      (error) => {
        console.error("Firestore onSnapshot error (messages):", error);
      }
    );

    return () => unsubscribe();
  }, [selectedLeadId]);

  // Fetch log events when changes occur to show on simulation screen
  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.slice(0, 4)); // Show recent 4 logs
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!selectedLeadId || !textToSend.trim() || isTyping) return;

    setInputText("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId,
          message: textToSend
        })
      });

      if (res.ok) {
        onRefreshLeads();
        fetchLogs();
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleTriggerAutomation = async (triggerType: string) => {
    if (!selectedLeadId) return;
    setIsTyping(true);
    try {
      const res = await fetch("/api/simulate-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLeadId,
          triggerType
        })
      });
      if (res.ok) {
        onRefreshLeads();
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  // Pre-configured simulation quick replies
  const quickReplies = [
    "Hi, I'm interested in joining the gym. Do you have a trainer?",
    "What are your membership prices?",
    "Do you have secure parking and what are the timings?",
    "Yes, I would love to book a free trial session!",
    "Can we book for tomorrow evening at 7:00 PM?",
    "Do you have a personal training packages?",
    "I have an old knee injury, is that okay?"
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "inactive": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "human_takeover": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "converted": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-zinc-800 text-zinc-400";
    }
  };

  const getTrialStatusBadge = (trial: string) => {
    switch (trial) {
      case "none": return "bg-zinc-800 text-zinc-400 border-zinc-700";
      case "offered": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "accepted": return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "booked": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold";
      case "visited": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "no-show": return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
      
      {/* 1. Chats list */}
      <div className="lg:col-span-1 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-white tracking-wider uppercase">Active Conversations</h2>
          <span className="text-xs px-2 py-0.5 bg-white/10 text-white/60 rounded-full font-mono">{leads.length}</span>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
          {leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => onSelectLead(lead.id)}
              className={`w-full text-left p-3.5 rounded-xl transition duration-200 flex flex-col gap-2 border cursor-pointer ${
                selectedLeadId === lead.id
                  ? "bg-[#CCFF00] text-black border-transparent shadow-[0_0_15px_rgba(204,255,0,0.25)] font-semibold"
                  : "bg-transparent border-transparent text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className={`font-semibold truncate text-sm max-w-[130px] ${selectedLeadId === lead.id ? "text-black" : "text-white"}`}>
                  {lead.name || lead.phone}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  selectedLeadId === lead.id
                    ? "bg-black/10 border-black/20 text-black font-semibold"
                    : getStatusColor(lead.status)
                }`}>
                  {lead.status === "human_takeover" ? "TAKEOVER" : lead.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className={`truncate max-w-[120px] font-mono ${selectedLeadId === lead.id ? "text-black/70 font-medium" : "text-white/50"}`}>
                  {lead.goal || "No goal logged"}
                </span>
                <span className={`font-mono text-[10px] ${selectedLeadId === lead.id ? "text-black/60" : "text-white/40"}`}>
                  Score: {lead.leadScore}%
                </span>
              </div>
            </button>
          ))}
          {leads.length === 0 && (
            <div className="text-center py-10 text-white/40 text-xs">
              No active enquiries yet.
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Simulator Chat Panel */}
      <div className="lg:col-span-2 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
        {activeLead ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/25 flex items-center justify-center text-[#CCFF00] font-bold">
                  {(activeLead.name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    {activeLead.name || activeLead.phone}
                    {activeLead.status === "human_takeover" && (
                      <span className="bg-rose-500/15 text-rose-400 border border-rose-500/20 text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Gym Owner Notified
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-white/50 font-mono">WhatsApp: {activeLead.phone}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {activeLead.status === "human_takeover" && (
                  <button
                    onClick={() => handleTriggerAutomation("inactivity_24h")}
                    className="bg-[#CCFF00] hover:bg-[#b5e600] text-black text-xs px-3 py-1.5 rounded-lg transition font-bold shadow-[0_0_15px_rgba(204,255,0,0.3)] flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-black" /> Resume AI
                  </button>
                )}
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/10">
              <div className="text-center my-2">
                <span className="text-[10px] bg-white/5 text-white/50 font-mono px-3 py-1 rounded-full border border-white/10">
                  SECURE CHAT SIMULATION VIA WHATSAPP API
                </span>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${msg.sender === "customer" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 border ${
                      msg.sender === "customer" 
                        ? "bg-white/10 text-white/90 border-white/10" 
                        : "bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/25"
                    }`}>
                      {msg.sender === "customer" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "customer"
                          ? "bg-white/10 text-white rounded-tr-none border border-white/5 shadow-md"
                          : "bg-[#CCFF00]/10 text-white border border-[#CCFF00]/20 rounded-tl-none shadow-md"
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-white/40 font-mono mt-1 block px-1 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/25 flex items-center justify-center text-xs shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none text-xs text-white/60 font-mono flex items-center gap-2 shadow-sm">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </span>
                      FitBot thinking...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies for testing */}
            <div className="p-3 bg-white/5 border-t border-white/10">
              <p className="text-[10px] text-white/50 mb-2 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#CCFF00]" /> Quick Simulation Prompts:
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {quickReplies.map((qr, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(qr)}
                    className="text-xs bg-white/5 hover:bg-white/15 text-white/80 px-3 py-1.5 rounded-full border border-white/10 shrink-0 whitespace-nowrap transition-all active:scale-95 cursor-pointer"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-white/10 bg-[#0F0F0F]/80 backdrop-blur-md flex gap-2">
              <input
                type="text"
                placeholder="Type customer's reply..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
                className="flex-1 bg-white/5 text-white placeholder-white/30 text-sm px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-[#CCFF00]/50 transition-all"
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isTyping}
                className="bg-[#CCFF00] text-black p-2.5 rounded-xl font-bold transition-all hover:bg-[#b5e600] disabled:opacity-40 disabled:hover:bg-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.3)] cursor-pointer"
              >
                <Send className="w-4 h-4 text-black" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/30">
            <Bot className="w-16 h-16 text-white/10 mb-4 animate-pulse" />
            <p className="text-sm font-mono mb-2 text-[#CCFF00]">WHATSAPP CHAT PREVIEW</p>
            <p className="text-xs text-white/50 max-w-sm">Select any customer conversation from the left to start interacting with FitBot, review lead metrics, or test API triggers.</p>
          </div>
        )}
      </div>

      {/* 3. CRM Lead Metadata & Quick triggers */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        
        {/* Lead profile */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
          <h2 className="text-xs font-semibold text-white tracking-wider uppercase border-b border-white/10 pb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#CCFF00]" /> FitBot Client Database
          </h2>

          {activeLead ? (
            <div className="space-y-4 text-xs">
              
              {/* Score card */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-white/40 text-[10px] font-mono block">LEAD TEMPERATURE</span>
                  <span className="text-lg font-bold text-white font-mono">{activeLead.leadScore}% Profile Completeness</span>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/25">
                  <Star className="w-6 h-6 text-[#CCFF00] fill-[#CCFF00]" />
                </div>
              </div>

              {/* Detail rows */}
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-white/50">Name</span>
                  <span className="text-white font-medium">{activeLead.name || "Unknown"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-white/50">Age</span>
                  <span className="text-white font-medium font-mono">{activeLead.age || "Pending"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-white/50">Gender</span>
                  <span className="text-white font-medium">{activeLead.gender || "Pending"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-white/50">Occupation</span>
                  <span className="text-white font-medium truncate max-w-[120px]">{activeLead.occupation || "Pending"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-white/50">City</span>
                  <span className="text-white font-medium">{activeLead.city || "Pending"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-white/50">Goals</span>
                  <span className="text-[#CCFF00] font-bold truncate max-w-[120px]">{activeLead.goal || "Pending"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-white/50">Experience</span>
                  <span className="text-white font-medium">{activeLead.experienceLevel || "Pending"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-white/50">Workout Time</span>
                  <span className="text-white font-medium">{activeLead.preferredTime || "Pending"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-white/50">Injuries/Medical</span>
                  <span className="text-white font-medium truncate max-w-[120px]">{activeLead.medicalConditions || "None declared"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-white/50">Membership Interest</span>
                  <span className="text-blue-400 font-medium">{activeLead.membershipInterest || "Pending"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-white/50">Trial Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${getTrialStatusBadge(activeLead.trialStatus)}`}>
                    {activeLead.trialStatus.toUpperCase()}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-6 text-white/30 text-xs font-mono">
              Select client profile
            </div>
          )}
        </div>

        {/* Inactivity & Automation Command center */}
        {activeLead && (
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-white tracking-wider uppercase border-b border-white/10 pb-2">
              Background Workflows
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => handleTriggerAutomation("inactivity_24h")}
                disabled={isTyping}
                className="w-full bg-white/5 hover:bg-white/15 text-white/85 text-left px-3 py-2.5 rounded-xl border border-white/10 text-xs transition-all active:scale-[0.98] flex justify-between items-center cursor-pointer"
              >
                <span>⏱️ Simulate 24h Inactivity</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">Dispatch</span>
              </button>

              <button
                onClick={() => handleTriggerAutomation("no_show_reminder")}
                disabled={isTyping}
                className="w-full bg-white/5 hover:bg-white/15 text-white/85 text-left px-3 py-2.5 rounded-xl border border-white/10 text-xs transition-all active:scale-[0.98] flex justify-between items-center cursor-pointer"
              >
                <span>🚨 Trigger No-Show Follow-up</span>
                <span className="text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20 font-bold">Dispatch</span>
              </button>

              <button
                onClick={() => handleTriggerAutomation("visited_followup")}
                disabled={isTyping}
                className="w-full bg-white/5 hover:bg-white/15 text-white/85 text-left px-3 py-2.5 rounded-xl border border-white/10 text-xs transition-all active:scale-[0.98] flex justify-between items-center cursor-pointer"
              >
                <span>💪 Trigger Visited Feedback</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">Dispatch</span>
              </button>

              <button
                onClick={() => handleTriggerAutomation("membership_purchased")}
                disabled={isTyping}
                className="w-full bg-[#CCFF00] hover:bg-[#b5e600] text-black font-bold text-left px-3 py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(204,255,0,0.25)] flex justify-between items-center cursor-pointer"
              >
                <span>💳 Confirm Membership Sale</span>
                <span className="text-[10px] bg-black/20 text-black px-1.5 py-0.5 rounded font-bold">Process</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
