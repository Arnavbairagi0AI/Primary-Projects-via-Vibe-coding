/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  increment,
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, GroupSessionRoom, GroupChatMessage } from '../types';
import { Users, MessageSquare, Clock, Plus, ChevronLeft, Send, Lock, Sparkles, BookOpen, Heart } from 'lucide-react';
import PremiumSoundscapePlayer from './PremiumSoundscapePlayer';

interface GroupSessionsViewProps {
  userProfile: UserProfile;
  onUpdatePlan: (plan: 'free' | 'pro' | 'premium') => void;
}

export default function GroupSessionsView({
  userProfile,
  onUpdatePlan
}: GroupSessionsViewProps) {
  const isPremium = userProfile.currentPlan === 'premium';
  
  // State for listed rooms
  const [rooms, setRooms] = useState<GroupSessionRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  
  // Create Room Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Selected Active Room State
  const [activeRoom, setActiveRoom] = useState<GroupSessionRoom | null>(null);
  const [chatMessages, setChatMessages] = useState<GroupChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Upgrade State
  const [upgrading, setUpgrading] = useState(false);

  // Sync Room list in Real-time from Firestore
  useEffect(() => {
    if (!isPremium) return;

    setLoadingRooms(true);
    const roomsCol = collection(db, 'group_rooms');
    const q = query(roomsCol, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRooms: GroupSessionRoom[] = [];
      snapshot.forEach((docSnap) => {
        fetchedRooms.push({ id: docSnap.id, ...docSnap.data() } as GroupSessionRoom);
      });
      setRooms(fetchedRooms);
      setLoadingRooms(false);
    }, (error) => {
      console.error("Error listening to group rooms:", error);
      setLoadingRooms(false);
    });

    return () => unsubscribe();
  }, [isPremium]);

  // Sync Room details & Chat messages in Real-time when inside a room
  useEffect(() => {
    if (!activeRoom) return;

    // Listen to room updates
    const roomRef = doc(db, 'group_rooms', activeRoom.id);
    const unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        setActiveRoom({ id: docSnap.id, ...docSnap.data() } as GroupSessionRoom);
      } else {
        // Room was closed/deleted! Kick out user
        setActiveRoom(null);
      }
    });

    // Listen to room chats subcollection
    const chatCol = collection(db, 'group_rooms', activeRoom.id, 'chats');
    const chatQuery = query(chatCol, orderBy('createdAt', 'asc'));
    const unsubscribeChats = onSnapshot(chatQuery, (snapshot) => {
      const messages: GroupChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        messages.push({ id: docSnap.id, ...docSnap.data() } as GroupChatMessage);
      });
      setChatMessages(messages);
      
      // Auto-scroll chat to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Increment member count on join
    updateDoc(roomRef, { memberCount: increment(1) }).catch(err => console.warn(err));

    return () => {
      unsubscribeRoom();
      unsubscribeChats();
      // Decrement member count on leave only if room still exists
      getDoc(roomRef).then((docSnap) => {
        if (docSnap.exists()) {
          updateDoc(roomRef, { memberCount: increment(-1) }).catch(err => console.warn(err));
        }
      }).catch(err => console.warn(err));
    };
  }, [activeRoom?.id]);

  // Handle active Pomodoro timer loop within active room
  useEffect(() => {
    if (!activeRoom || !activeRoom.timerIsActive) return;

    const interval = setInterval(async () => {
      // Only room creator or an active peer updates state sequentially (creator authoritatively decreases time)
      if (activeRoom.creatorId === userProfile.uid) {
        const roomRef = doc(db, 'group_rooms', activeRoom.id);
        let nextSec = activeRoom.timerSecondsRemaining - 1;
        let nextMin = activeRoom.timerMinutesRemaining;

        if (nextSec < 0) {
          nextSec = 59;
          nextMin = nextMin - 1;
        }

        if (nextMin < 0) {
          // Timer finished! Toggle mode
          const nextType = activeRoom.activeTimerType === 'pomodoro' ? 'short_break' : 'pomodoro';
          const nextMins = nextType === 'pomodoro' ? 25 : 5;
          await updateDoc(roomRef, {
            activeTimerType: nextType,
            timerMinutesRemaining: nextMins,
            timerSecondsRemaining: 0,
            timerIsActive: false
          });
        } else {
          await updateDoc(roomRef, {
            timerMinutesRemaining: nextMin,
            timerSecondsRemaining: nextSec
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRoom, userProfile.uid]);

  // Unlock Premium plan directly
  const handleActivatePremium = async () => {
    setUpgrading(true);
    try {
      onUpdatePlan('premium');
      const userRef = doc(db, 'users', userProfile.uid);
      await setDoc(userRef, {
        currentPlan: 'premium',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, { merge: true });
    } catch (err) {
      console.error(err);
    } finally {
      setUpgrading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSubject.trim()) return;

    setCreating(true);
    try {
      const roomData = {
        creatorId: userProfile.uid,
        creatorName: userProfile.displayName,
        title: newTitle.trim(),
        subject: newSubject.trim(),
        activeTimerType: 'pomodoro',
        timerMinutesRemaining: 25,
        timerSecondsRemaining: 0,
        timerIsActive: false,
        memberCount: 0,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'group_rooms'), roomData);
      setNewTitle('');
      setNewSubject('');
      
      // Auto join newly created room
      setActiveRoom({ id: docRef.id, ...roomData } as GroupSessionRoom);
    } catch (err) {
      console.error("Error creating group session room:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeRoom) return;

    const textToSend = typedMessage.trim();
    setTypedMessage('');

    try {
      const messageCol = collection(db, 'group_rooms', activeRoom.id, 'chats');
      await addDoc(messageCol, {
        userId: userProfile.uid,
        userName: userProfile.displayName,
        userPhoto: userProfile.photoURL,
        text: textToSend,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleToggleTimer = async () => {
    if (!activeRoom) return;
    const roomRef = doc(db, 'group_rooms', activeRoom.id);
    await updateDoc(roomRef, {
      timerIsActive: !activeRoom.timerIsActive
    });
  };

  const handleResetTimer = async (type: 'pomodoro' | 'short_break' | 'long_break') => {
    if (!activeRoom) return;
    const roomRef = doc(db, 'group_rooms', activeRoom.id);
    const mins = type === 'pomodoro' ? 25 : type === 'short_break' ? 5 : 15;
    await updateDoc(roomRef, {
      activeTimerType: type,
      timerMinutesRemaining: mins,
      timerSecondsRemaining: 0,
      timerIsActive: false
    });
  };

  const handleCloseRoom = async () => {
    if (!activeRoom) return;
    const roomRef = doc(db, 'group_rooms', activeRoom.id);
    try {
      // Optimistically exit locally
      const roomId = activeRoom.id;
      setActiveRoom(null);
      await deleteDoc(roomRef);
    } catch (err) {
      console.error("Error closing group session room:", err);
    }
  };

  // -------------------------------------------------------------
  // RENDER LOCKED STATE FOR FREE USERS
  // -------------------------------------------------------------
  if (!isPremium) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="relative bg-[#2C2C2B] rounded-[36px] overflow-hidden p-8 md:p-12 text-white shadow-2xl border border-white/10">
          
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#D4A373]/20 to-[#5A5A40]/10 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-gradient-to-tr from-orange-500/10 to-red-500/5 rounded-full blur-2xl -z-10"></div>

          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#D4A373] to-[#E29578] text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Premium Capabilities
            </div>

            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Unlock live <span className="text-[#D4A373]">Group Sessions</span> & interactive <span className="text-[#D4A373]">SaaS Analytics</span>.
            </h2>

            <p className="text-sm text-stone-300 leading-relaxed max-w-xl">
              Elevate your academic workflow instantly. Premium membership unlocks collaborative real-time study lounges with synced pomodoros, global board chats, and in-depth analytical visualizers of your exam prep.
            </p>

            {/* Premium feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3">
              <div className="flex gap-3 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-2 rounded-xl bg-[#5A5A40] text-white shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-stone-200 uppercase tracking-wider">Real-Time Study Lounges</h4>
                  <p className="text-[10px] text-stone-400 mt-1 leading-normal">Join, coordinate, and chat live with peer groups in shared synced focus rooms.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-2 rounded-xl bg-[#D4A373] text-stone-900 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-stone-200 uppercase tracking-wider">Synced Group Pomodoros</h4>
                  <p className="text-[10px] text-stone-400 mt-1 leading-normal">Keep group focus sessions flawlessly synced across multiple devices globally.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-2 rounded-xl bg-amber-500 text-stone-900 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-stone-200 uppercase tracking-wider">Focus Soundscape Synth</h4>
                  <p className="text-[10px] text-stone-400 mt-1 leading-normal">Play synthesized binaural beats, coffee cafe humming, and warm rainfall directly in browser.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-2 rounded-xl bg-teal-500 text-white shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-stone-200 uppercase tracking-wider">Golden Scholar Badge</h4>
                  <p className="text-[10px] text-stone-400 mt-1 leading-normal">Get a custom glowing crown profile aura to show off your dedication to peers.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-2 rounded-xl bg-orange-500 text-white shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-stone-200 uppercase tracking-wider">Predictive SaaS Analytics</h4>
                  <p className="text-[10px] text-stone-400 mt-1 leading-normal">Detailed focus heatmaps, quiz performance analytics, and predictive grade metrics.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="p-2 rounded-xl bg-[#E29578] text-white shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-stone-200 uppercase tracking-wider">Priority AI Orchestration</h4>
                  <p className="text-[10px] text-stone-400 mt-1 leading-normal">Bypass all free tier daily quotas with unlimited high-reasoning model outputs.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleActivatePremium}
                disabled={upgrading}
                className="w-full sm:w-auto bg-gradient-to-r from-[#D4A373] via-[#E29578] to-[#5A5A40] hover:scale-[1.03] active:scale-95 text-stone-900 font-extrabold px-8 py-4 rounded-2xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xl shadow-[#D4A373]/20 flex items-center justify-center gap-2"
              >
                {upgrading ? "⏳ Activating Suite..." : "⚡ Activate Premium Access • ₹499/mo"}
              </button>
              <div className="text-[10px] text-stone-400 flex items-center gap-1.5 font-bold">
                <Lock className="w-3 h-3 text-brand-sand" /> Cloud-encrypted • Instant upgrade
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER INSIDE ACTIVE GROUP ROOM
  // -------------------------------------------------------------
  if (activeRoom) {
    const isCreator = activeRoom.creatorId === userProfile.uid;
    const minsStr = String(activeRoom.timerMinutesRemaining).padStart(2, '0');
    const secsStr = String(activeRoom.timerSecondsRemaining).padStart(2, '0');

    return (
      <div className="space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setActiveRoom(null)}
              className="flex items-center gap-1.5 px-4 py-2 border border-stone-200 bg-white rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Leave Lounge
            </button>

            {isCreator && (
              <button 
                onClick={handleCloseRoom}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm shadow-rose-600/15"
              >
                <span>❌</span> Close & Dissolve Lounge
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {activeRoom.memberCount} active member{activeRoom.memberCount !== 1 ? 's' : ''} in lounge
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Synced shared timer workspace */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="study-card p-6 bg-white space-y-6 flex flex-col items-center justify-center text-center">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#D4A373] font-black block">Lounge Subject</span>
                <span className="px-3 py-1 bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] font-black rounded-full uppercase mt-1.5 inline-block">
                  📚 {activeRoom.subject}
                </span>
                <h3 className="text-lg font-black text-stone-800 mt-2">{activeRoom.title}</h3>
                <p className="text-[9px] text-stone-400 mt-0.5">Created by {activeRoom.creatorName}</p>
              </div>

              {/* Shared dial clock */}
              <div className="relative w-44 h-44 rounded-full border-4 border-stone-100 flex flex-col items-center justify-center bg-stone-50/50 shadow-inner">
                {/* Glowing ring */}
                <div className={`absolute inset-0.5 rounded-full border border-dashed transition-colors ${activeRoom.timerIsActive ? 'border-orange-500 animate-spin' : 'border-stone-300'}`} style={{ animationDuration: '60s' }}></div>
                
                <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest">
                  {activeRoom.activeTimerType.replace('_', ' ')}
                </span>
                <span className="text-4xl font-extrabold text-stone-800 tracking-tighter mt-1 font-mono">
                  {minsStr}:{secsStr}
                </span>
                
                <div className="flex gap-1.5 mt-2">
                  <span className={`w-2 h-2 rounded-full ${activeRoom.timerIsActive ? 'bg-orange-500 animate-pulse' : 'bg-stone-300'}`}></span>
                  <span className="text-[8px] uppercase tracking-widest font-black text-stone-400">
                    {activeRoom.timerIsActive ? 'running' : 'paused'}
                  </span>
                </div>
              </div>

              {/* Timer controls */}
              <div className="w-full space-y-3 pt-3 border-t border-stone-100">
                {isCreator ? (
                  <>
                    <div className="flex gap-2">
                      <button
                        onClick={handleToggleTimer}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer shadow-sm ${
                          activeRoom.timerIsActive 
                            ? 'bg-[#E29578] hover:bg-[#c97c5f]' 
                            : 'bg-[#5A5A40] hover:bg-[#494933]'
                        }`}
                      >
                        {activeRoom.timerIsActive ? '⏸ Pause Timer' : '▶ Start Timer'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() => handleResetTimer('pomodoro')}
                        className="py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-[9px] font-extrabold uppercase tracking-wider"
                      >
                        Pomodoro
                      </button>
                      <button
                        onClick={() => handleResetTimer('short_break')}
                        className="py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-[9px] font-extrabold uppercase tracking-wider"
                      >
                        Short Break
                      </button>
                      <button
                        onClick={() => handleResetTimer('long_break')}
                        className="py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-[9px] font-extrabold uppercase tracking-wider"
                      >
                        Long Break
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-left">
                    <p className="text-[9.5px] text-stone-500 font-bold leading-normal">
                      📢 Synced clock is controlled by host <strong className="text-stone-700">{activeRoom.creatorName}</strong>. Focus together!
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Premium Soundscapes inside active room */}
            <PremiumSoundscapePlayer 
              userProfile={userProfile}
            />

          </div>

          {/* Group Live Chat workspace */}
          <div className="lg:col-span-2">
            
            <div className="study-card bg-white flex flex-col h-[520px] overflow-hidden">
              
              {/* Chat Title bar */}
              <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#5A5A40]" />
                  <span className="text-xs font-black text-stone-700 uppercase tracking-widest">Lounge Board Chat</span>
                </div>
                <span className="text-[9px] text-stone-400 font-black uppercase tracking-wider">
                  Real-time Active Connection
                </span>
              </div>

              {/* Chat Messages Frame */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-6">
                    <span className="text-2xl">✨</span>
                    <h4 className="text-xs font-bold text-stone-600 uppercase">Board is Fresh & Sparkling</h4>
                    <p className="text-[10px] text-stone-400 max-w-xs leading-normal">
                      No study messages posted yet. Be the first to greet your co-learners and outline your goals!
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isSelf = msg.userId === userProfile.uid;
                    return (
                      <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}>
                        <img 
                          src={msg.userPhoto} 
                          alt={msg.userName} 
                          className="w-7 h-7 rounded-full bg-stone-100 shrink-0 border border-stone-200"
                        />
                        <div>
                          <div className={`flex items-center gap-1.5 mb-0.5 ${isSelf ? 'justify-end' : ''}`}>
                            <span className="text-[9.5px] font-black text-stone-600">{msg.userName}</span>
                            <span className="text-[8px] text-stone-400">
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </span>
                          </div>
                          <div className={`p-3 rounded-2xl text-[11.5px] leading-relaxed shadow-sm ${
                            isSelf 
                              ? 'bg-[#5A5A40] text-white rounded-tr-none' 
                              : 'bg-[#F5F5F0] text-stone-700 rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-100 flex gap-2">
                <input
                  type="text"
                  required
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder="Type study message, query, or check-in..."
                  className="flex-1 bg-stone-50 border border-stone-200 focus:border-[#5A5A40] rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-[#5A5A40] text-white hover:bg-[#494933] active:scale-95 rounded-xl transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>

          </div>

        </div>

      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER GENERAL STUDY LOUNGE SELECTOR
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      
      {/* Upper banner section */}
      <div className="bg-[#2C2C2B] text-white rounded-[32px] p-6 md:p-8 relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#D4A373]/15 to-transparent rounded-full blur-3xl -z-10"></div>
        <div className="max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4A373]/20 border border-[#D4A373]/30 text-brand-sand text-[9px] font-black uppercase tracking-wider">
            👥 Live Lounge Room Hub
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            Study live with peers in synchronized co-working lounges
          </h2>
          <p className="text-stone-300 text-[11px] leading-relaxed">
            Choose from active focus lobbies below or launch your own. Sync timers, clear doubts, and hit study milestones collectively.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active room lists */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-stone-400">Active Study Lounges</h3>
            <span className="text-[10px] text-stone-500 font-bold bg-[#5A5A40]/10 px-2.5 py-0.5 rounded-full uppercase">
              {rooms.length} lounge{rooms.length !== 1 ? 's' : ''} running
            </span>
          </div>

          {loadingRooms ? (
            <div className="study-card bg-white p-12 text-center text-stone-400 text-xs">
              ⏳ Fetching live lounges from cloud network...
            </div>
          ) : rooms.length === 0 ? (
            <div className="study-card bg-white p-12 text-center space-y-2 flex flex-col items-center">
              <span className="text-3xl">👥</span>
              <h4 className="text-xs font-bold text-stone-700 uppercase">Lounges are silent right now</h4>
              <p className="text-[10px] text-stone-400 max-w-sm">
                No active group study spaces found. Be the trendsetter and launch a public lounge room using the form to your right!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div 
                  key={room.id}
                  className="study-card p-5 bg-white flex flex-col justify-between hover:border-[#5A5A40]/30 hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 bg-[#5A5A40]/10 text-[#5A5A40] text-[9px] font-black rounded uppercase tracking-wider">
                        📚 {room.subject}
                      </span>
                      <div className="flex items-center gap-1 text-[9px] text-[#D4A373] font-black uppercase">
                        <span className={`w-1.5 h-1.5 rounded-full ${room.timerIsActive ? 'bg-orange-500 animate-pulse' : 'bg-stone-300'}`}></span>
                        {room.timerIsActive ? 'Live Clock' : 'Paused'}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-stone-800 text-sm group-hover:text-[#5A5A40] transition-colors">{room.title}</h4>
                      <p className="text-[9.5px] text-stone-400 mt-0.5 font-medium">Started by {room.creatorName}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100">
                    <span className="text-[9.5px] text-stone-500 font-bold flex items-center gap-1">
                      👥 {room.memberCount || 0} peer{room.memberCount !== 1 ? 's' : ''} active
                    </span>

                    <button
                      onClick={() => setActiveRoom(room)}
                      className="px-3.5 py-1.5 bg-[#2C2C2B] group-hover:bg-[#5A5A40] text-white text-[9.5px] font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                    >
                      Join Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Create room sidebar widget */}
        <div className="lg:col-span-1">
          
          <div className="study-card p-6 bg-white space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-black">Launch Study Lounge</p>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Lounge Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Midnight Physics Grind"
                  className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-black text-stone-400">Subject Topic</label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Physics / Thermodynamics"
                  className="w-full bg-[#F5F5F0] border border-black/5 focus:border-[#5A5A40] rounded-xl px-3 py-2.5 text-xs outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-[#5A5A40] hover:bg-[#494933] text-white font-black uppercase tracking-wider rounded-xl text-xs transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> {creating ? "Launching Room..." : "Launch Live Room"}
              </button>

            </form>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
              <span className="text-[8.5px] uppercase tracking-widest font-black text-[#D4A373] block">Community Standard</span>
              <p className="text-[9px] text-stone-400 leading-normal font-medium">
                Created lounges appear instantly on the shared cloud hub of studyflow.ai. Maintain clean communication and study actively!
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
