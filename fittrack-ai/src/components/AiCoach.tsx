import React, { useState, useEffect, useRef } from "react";
import { UserProfile, ChatHistoryEntry, BmiEntry, WeightEntry, DietPlan, WorkoutPlan } from "../types";
import { db, collection, addDoc } from "../lib/firebase";
import { Send, Heart, Activity, Sparkles, RefreshCw, Bot, User, Trash2 } from "lucide-react";

interface AiCoachProps {
  profile: UserProfile;
  chatHistory: ChatHistoryEntry[];
  bmiHistory: BmiEntry[];
  weightHistory: WeightEntry[];
  dietPlans: DietPlan[];
  workoutPlans: WorkoutPlan[];
  onAddChatMessage: (msg: ChatHistoryEntry) => void;
  onClearChat: () => void;
}

export default function AiCoach({
  profile,
  chatHistory,
  bmiHistory,
  weightHistory,
  dietPlans,
  workoutPlans,
  onAddChatMessage,
  onClearChat
}: AiCoachProps) {
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  // Handle send message
  const handleSendMessage = async (textToSend: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText || loading) return;

    setInputText("");
    setLoading(true);

    // Save user message locally & write to Firestore
    const userMsg: ChatHistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      content: cleanText,
      timestamp: Date.now()
    };

    try {
      if (profile.uid && !profile.uid.startsWith("local_")) {
        await addDoc(collection(db, `users/${profile.uid}/chatHistory`), userMsg);
      }
      onAddChatMessage(userMsg);

      // Create high-context summary of user history for server-side Gemini personalization
      const latestWeight = weightHistory.length > 0 ? weightHistory[0].weight : profile.weight;
      const heightInMeters = profile.height / 100;
      const latestBmi = (latestWeight / (heightInMeters * heightInMeters)).toFixed(1);
      
      const briefContext = `
        Latest weight reading: ${latestWeight} kg.
        Current BMI: ${latestBmi}.
        Water Goal: ${profile.dailyWaterGoal} ml.
        Latest logged meal: ${profile.foodPreference} options.
        Target Weight: ${profile.targetWeight} kg.
        Recent Diet Plan: ${dietPlans.length > 0 ? dietPlans[0].calories + " kcal daily program" : "None generated yet"}.
        Recent Workout Plan: ${workoutPlans.length > 0 ? workoutPlans[0].workoutType : "None generated yet"}.
      `.trim();

      // Send to server proxy route
      const res = await fetch("/api/chat-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatHistory, userMsg].map(m => ({ role: m.role, content: m.content })),
          profile,
          context: briefContext
        })
      });

      if (!res.ok) {
        throw new Error("Unable to retrieve Coach feedback. Check connections.");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Save Coach reply locally & write to Firestore
      const assistantMsg: ChatHistoryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        role: "model",
        content: data.content,
        timestamp: Date.now()
      };

      if (profile.uid && !profile.uid.startsWith("local_")) {
        await addDoc(collection(db, `users/${profile.uid}/chatHistory`), assistantMsg);
      }
      onAddChatMessage(assistantMsg);
    } catch (err: any) {
      console.info("Info: Client fallback triggered for AI Coach chat");
      
      // Local AI fallback engine client execution
      const userMsgLower = cleanText.toLowerCase();
      let fallbackContent = "";
      
      if (userMsgLower.includes("hello") || userMsgLower.includes("hi") || userMsgLower.includes("hey")) {
        fallbackContent = `Hey ${profile.fullName || "Friend"}! I've engaged the FitTrack Local AI Engine (Offline-Resilient Mode) to protect your session. Since your goal is ${profile.fitnessGoal || "Healthy Living"}, let's build your routine!`;
      } else if (userMsgLower.includes("diet") || userMsgLower.includes("eat") || userMsgLower.includes("food") || userMsgLower.includes("meal")) {
        fallbackContent = `I have loaded your dietary metrics offline! For ${profile.fitnessGoal || "Healthy Living"} and weight of ${profile.weight || 70}kg, I recommend focusing on clean foods. Let's head over to the Diet tab to generate a fully laid-out table menu!`;
      } else if (userMsgLower.includes("workout") || userMsgLower.includes("exercise") || userMsgLower.includes("routine")) {
        fallbackContent = `Offline Routine Generator active! I highly recommend a 45-minute balanced strength or bodyweight session. Check the Workout tab to generate your complete sets and repetition table!`;
      } else if (userMsgLower.includes("run") || userMsgLower.includes("strava") || userMsgLower.includes("track") || userMsgLower.includes("km") || userMsgLower.includes("mile")) {
        fallbackContent = `Running mode is ready! Try the interactive GPS Run Mapper right on your dashboard. It maps your path, toggles between KMs & Miles, tracks average pace, and lets you post custom messages to your feed.`;
      } else {
        fallbackContent = `[Local AI Engine Mode] I am tracking your targets! Your hydration target is ${profile.dailyWaterGoal || 2000} ml and weight target is ${profile.targetWeight || 68} kg. What fitness task shall we track next?`;
      }

      const errFallbackMsg: ChatHistoryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        role: "model",
        content: fallbackContent,
        timestamp: Date.now()
      };
      onAddChatMessage(errFallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage(inputText);
    }
  };

  // Conversational shortcuts
  const QUICK_PROMPTS = [
    "What should I eat today?",
    "I skipped breakfast.",
    "I gained 2 kg.",
    "What is my BMI trend?",
    "Create tomorrow's workout."
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] justify-between relative pb-4">
      {/* Top Spec Header */}
      <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 shadow-md flex justify-between items-center z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#c1ff72]/20 rounded-2xl flex items-center justify-center text-[#c1ff72]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white flex items-center gap-1">
              AI Health Coach
              <span className="w-1.5 h-1.5 bg-[#c1ff72] rounded-full animate-ping" />
            </h2>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Calibrated context memory active</p>
          </div>
        </div>
        
        {chatHistory.length > 0 && (
          <button 
            onClick={onClearChat}
            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors active-press"
            title="Clear Chat Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main chat log viewport */}
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 no-scrollbar">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-4 my-auto h-full">
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 text-[#c1ff72] border border-zinc-800 shadow-md flex items-center justify-center animate-pulse">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">Chat with your Personal Coach</h3>
              <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                I remember your goals ({profile.fitnessGoal}), activity level, diet plans, and weight metrics. Ask me anything to receive tailored advice!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Icon wrapper */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  msg.role === "user" ? "bg-zinc-800 text-[#c1ff72]" : "bg-[#c1ff72]/20 text-[#c1ff72]"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`p-4 rounded-3xl text-xs leading-relaxed shadow-xs ${
                  msg.role === "user"
                    ? "bg-[#c1ff72] text-[#050505] rounded-tr-none font-semibold"
                    : "bg-zinc-900 text-zinc-100 rounded-tl-none border border-zinc-800 font-medium"
                }`}>
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                <div className="w-8 h-8 rounded-xl bg-[#c1ff72]/20 text-[#c1ff72] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-3.5 rounded-3xl rounded-tl-none text-xs text-zinc-400 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#c1ff72]" />
                  Sourcing Coach recommendations...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Shortcuts & inputs panel */}
      <div className="space-y-3 bg-zinc-950 p-2.5 rounded-3xl border border-zinc-850">
        {chatHistory.length === 0 && (
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">Tapping prompt shortcuts</span>
            <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto no-scrollbar">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  disabled={loading}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-[10px] font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 hover:border-[#c1ff72] active-press transition-colors shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Discuss diet, skipped meals, weight trend..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#c1ff72] transition-colors placeholder-zinc-500 shadow-sm"
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={loading || !inputText.trim()}
            className="p-3.5 bg-[#c1ff72] text-[#050505] rounded-2xl shadow-md active-press flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
