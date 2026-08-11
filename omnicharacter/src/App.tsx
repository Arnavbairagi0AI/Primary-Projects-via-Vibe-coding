/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Character, Conversation, Message, MemoryItem, UserProfile } from './types';
import { 
  getCharacters, 
  getUserProfile, 
  saveUserProfile, 
  getConversations, 
  saveConversation, 
  getMessages, 
  saveMessage, 
  saveCharacter, 
  deleteConversation,
  getMemories,
  saveMemory
} from './dbService';
import { auth } from './firebase';
import { 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

import Dashboard from './components/Dashboard';
import ChatWindow from './components/ChatWindow';
import GroupChatWindow from './components/GroupChatWindow';
import CharacterCreator from './components/CharacterCreator';
import ProfileView from './components/ProfileView';
import AdminPanel from './components/AdminPanel';
import ApiManager from './components/ApiManager';

import { 
  Compass, 
  MessageSquare, 
  PlusCircle, 
  User, 
  Terminal, 
  Sliders, 
  Sparkles, 
  Flame, 
  Lock, 
  Mail, 
  ChevronRight,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  // Navigation
  const [currentView, setCurrentView] = useState<'explore' | 'chat' | 'group_chat' | 'create' | 'profile' | 'admin' | 'api'>('explore');
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [activeUserId, setActiveUserId] = useState<string>('guest_user');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');

  // Core App states
  const [characters, setCharacters] = useState<Character[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  // Group chat states
  const [groupMessages, setGroupMessages] = useState<Message[]>([]);

  // Role check: Creator / Admin permissions verification
  const isCreatorOrAdmin = Boolean(
    userProfile?.isCreator || 
    userProfile?.isAdmin || 
    userProfile?.email === 'shadowfall07042008@gmail.com' ||
    user?.email === 'shadowfall07042008@gmail.com'
  );

  // Load initial app data
  useEffect(() => {
    const loadAppData = async () => {
      const chars = await getCharacters();
      setCharacters(chars);

      const userId = user ? user.uid : 'guest_user';
      setActiveUserId(userId);

      const profile = await getUserProfile(userId);
      setUserProfile(profile);

      const convs = await getConversations(userId);
      setConversations(convs);
    };

    loadAppData();
  }, [user]);

  // Handle Firebase Auth
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setShowAuthScreen(false);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!auth) return;

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    }
  };

  const handleAnonymousSignIn = async () => {
    if (!auth) {
      // Local Guest Bypass
      setUser({ uid: 'guest_user', displayName: 'Guest Companion', isAnonymous: true });
      setShowAuthScreen(false);
      return;
    }
    try {
      await signInAnonymously(auth);
      setShowAuthScreen(false);
    } catch (err: any) {
      setAuthError(err.message || 'Guest sign-in failed');
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    setActiveUserId('guest_user');
    setCurrentView('explore');
  };

  // Select a character and open single chat
  const handleSelectCharacter = async (char: Character) => {
    setActiveCharacter(char);
    
    // Check if conversation already exists
    let conv = conversations.find(c => c.characterId === char.id);
    if (!conv) {
      // Create fresh conversation
      conv = {
        id: 'conv_' + Date.now().toString(),
        title: char.name,
        characterId: char.id,
        lastMessageText: char.greeting,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0
      };
      await saveConversation(activeUserId, conv);
      setConversations(prev => [conv!, ...prev]);
    }

    setActiveConversation(conv);
    
    // Load messages
    const msgs = await getMessages(conv.id);
    setMessages(msgs);

    // Load character memories
    const mems = await getMemories(activeUserId, char.id);
    setMemories(mems);

    setCurrentView('chat');
  };

  // Select an existing conversation from dashboard
  const handleSelectConversation = async (conv: Conversation) => {
    const char = characters.find(c => c.id === conv.characterId);
    if (!char) return;

    setActiveCharacter(char);
    setActiveConversation(conv);

    const msgs = await getMessages(conv.id);
    setMessages(msgs);

    const mems = await getMemories(activeUserId, char.id);
    setMemories(mems);

    setCurrentView('chat');
  };

  // Send message handler with active streaming response!
  const handleSendMessage = async (text: string, type: 'text' | 'image' | 'voice' | 'file' = 'text', attachmentUrl?: string) => {
    if (!activeConversation || !activeCharacter) return;

    const userMsg: Message = {
      id: 'msg_' + Date.now().toString(),
      conversationId: activeConversation.id,
      senderId: 'user',
      senderName: userProfile?.displayName || 'You',
      text,
      createdAt: new Date().toISOString(),
      type,
      attachmentUrl
    };

    // Save user message
    await saveMessage(activeConversation.id, userMsg);
    setMessages(prev => [...prev, userMsg]);

    // Update conversation block
    const updatedConv = {
      ...activeConversation,
      lastMessageText: text,
      lastMessageAt: new Date().toISOString()
    };
    await saveConversation(activeUserId, updatedConv);

    // Create an empty temporary message for streaming AI response
    const aiMsgId = 'msg_ai_' + Date.now().toString();
    const aiTempMsg: Message = {
      id: aiMsgId,
      conversationId: activeConversation.id,
      senderId: activeCharacter.id,
      senderName: activeCharacter.name,
      text: '',
      createdAt: new Date().toISOString(),
      isStreaming: true
    };

    setMessages(prev => [...prev, aiTempMsg]);

    // Stream from server side API
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
          character: activeCharacter,
          userProfile
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let finalAiText = '';

      while (!done) {
        const { value, done: doneReading } = await reader!.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        const lines = chunkValue.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                finalAiText += parsed.text;
                // Update streaming state in messages array
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: finalAiText } : m));
              }
            } catch (e) {
              // chunk error
            }
          }
        }
      }

      // Finalize and save message in database
      const finalAiMsg: Message = {
        ...aiTempMsg,
        text: finalAiText || '*nodding softly* Let me ponder this.',
        isStreaming: false
      };
      await saveMessage(activeConversation.id, finalAiMsg);

      // Trigger automatic background memory summarization after 5 messages
      if (messages.length > 0 && messages.length % 5 === 0) {
        triggerMemorySynthesis(messages.slice(-5));
      }

    } catch (err) {
      console.error(err);
      const errorMsg: Message = {
        ...aiTempMsg,
        text: '*Communication stream interrupted* Please verify your local node context or api endpoints.',
        isStreaming: false
      };
      setMessages(prev => prev.map(m => m.id === aiMsgId ? errorMsg : m));
    }
  };

  // Automatic background memory synthesis
  const triggerMemorySynthesis = async (recentHistory: Message[]) => {
    if (!activeCharacter || !userProfile) return;
    try {
      const res = await fetch('/api/summarize-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: recentHistory,
          characterName: activeCharacter.name,
          userProfile
        })
      });
      const data = await res.json();
      if (data.fact) {
        const newMemory: MemoryItem = {
          id: 'mem_' + Date.now().toString(),
          characterId: activeCharacter.id,
          userId: activeUserId,
          fact: data.fact,
          relationshipScore: data.relationshipScore || 65,
          category: data.category || 'fact',
          lastUpdated: new Date().toISOString()
        };
        await saveMemory(newMemory);
        setMemories(prev => [newMemory, ...prev]);

        // Unlock deep relationship achievement
        if (userProfile && !userProfile.achievements.find(a => a.id === 'memory_unlocked')?.unlockedAt) {
          const updatedAchievements = userProfile.achievements.map(a => 
            a.id === 'memory_unlocked' ? { ...a, unlockedAt: new Date().toISOString() } : a
          );
          const updatedProfile = {
            ...userProfile,
            achievements: updatedAchievements,
            badges: [...userProfile.badges, 'Mind Melder']
          };
          await saveUserProfile(updatedProfile);
          setUserProfile(updatedProfile);
        }
      }
    } catch (e) {
      console.warn("Memory auto-summarize failed", e);
    }
  };

  // Group chat message routing
  const handleSendGroupMessage = async (text: string, senderId: string) => {
    const isUser = senderId === 'user';
    const msg: Message = {
      id: 'gmsg_' + Date.now().toString(),
      conversationId: 'group_session',
      senderId,
      senderName: isUser ? (userProfile?.displayName || 'You') : (characters.find(c => c.id === senderId)?.name || 'Advisor'),
      text,
      createdAt: new Date().toISOString()
    };

    setGroupMessages(prev => [...prev, msg]);

    // Sync metrics on user profile
    if (isUser && userProfile) {
      const updatedProfile = {
        ...userProfile,
        stats: {
          ...userProfile.stats,
          totalMessages: userProfile.stats.totalMessages + 1,
          totalChats: userProfile.stats.totalChats + 1
        }
      };
      await saveUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
    }
  };

  // Save/Create Character
  const handleSaveCharacter = async (char: Character) => {
    await saveCharacter(char);
    setCharacters(prev => [char, ...prev]);

    // Update creator stats
    if (userProfile) {
      const updatedProfile = {
        ...userProfile,
        stats: {
          ...userProfile.stats,
          creationsCount: userProfile.stats.creationsCount + 1
        }
      };
      
      // Unlock "The Creator" achievement
      const updatedAchievements = updatedProfile.achievements.map(a => 
        a.id === 'character_creator' ? { ...a, unlockedAt: new Date().toISOString() } : a
      );
      updatedProfile.achievements = updatedAchievements;

      await saveUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
    }

    setCurrentView('explore');
  };

  // Toggle liking a character
  const handleLikeCharacter = async (charId: string) => {
    setCharacters(prev => prev.map(c => {
      if (c.id === charId) {
        const liked = userProfile?.likes.includes(charId);
        return {
          ...c,
          likesCount: liked ? c.likesCount - 1 : c.likesCount + 1
        };
      }
      return c;
    }));

    if (userProfile) {
      const alreadyLiked = userProfile.likes.includes(charId);
      const updatedLikes = alreadyLiked 
        ? userProfile.likes.filter(id => id !== charId) 
        : [...userProfile.likes, charId];
        
      const updatedProfile = {
        ...userProfile,
        likes: updatedLikes
      };
      await saveUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800/80 p-5 shrink-0 justify-between">
        <div className="space-y-8">
          {/* Branded Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-teal-500/10">
              Ω
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block">OmniCharacter</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">AI companion</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button 
              onClick={() => setCurrentView('explore')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                currentView === 'explore' 
                  ? 'bg-teal-500/10 border-l-2 border-teal-500 text-white' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              Explore Minds
            </button>
            <button 
              onClick={() => setCurrentView('group_chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                currentView === 'group_chat' 
                  ? 'bg-teal-500/10 border-l-2 border-teal-500 text-white' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Group Council
            </button>
            <button 
              onClick={() => setCurrentView('create')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                currentView === 'create' 
                  ? 'bg-teal-500/10 border-l-2 border-teal-500 text-white' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Design Persona
            </button>
            <button 
              onClick={() => setCurrentView('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                currentView === 'profile' 
                  ? 'bg-teal-500/10 border-l-2 border-teal-500 text-white' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              My Profile
            </button>
          </nav>
        </div>

        {/* Bottom Utility Drawer */}
        <div className="space-y-4">
          {isCreatorOrAdmin && (
            <div className="flex flex-col gap-1 border-t border-slate-800/60 pt-3">
              <button 
                onClick={() => setCurrentView('api')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'api' 
                    ? 'bg-teal-500/10 text-teal-400 font-bold border-l-2 border-teal-500' 
                    : 'text-slate-500 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                API Settings
              </button>
              <button 
                onClick={() => setCurrentView('admin')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'admin' 
                    ? 'bg-teal-500/10 text-teal-400 font-bold border-l-2 border-teal-500' 
                    : 'text-slate-500 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                System Console
              </button>
            </div>
          )}

          {/* Active Guest / Free Access Profile Status */}
          <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xs">
                ∞
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-white block truncate">{userProfile?.displayName || 'Unlimited Access User'}</span>
                <span className="text-[10px] text-teal-400 block truncate font-medium">Full Access Active</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header / Bottom Navigation */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-400 flex items-center justify-center text-slate-950 font-black text-xs">
            Ω
          </div>
          <span className="font-extrabold text-white text-sm tracking-tight">OmniAI</span>
        </div>
        
        <span className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg text-[10px] font-bold">
          Full Unlocked Access
        </span>
      </header>

      {/* Main View Container */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {currentView === 'explore' && (
          <Dashboard 
            characters={characters}
            conversations={conversations}
            activeUserId={activeUserId}
            onSelectCharacter={handleSelectCharacter}
            onSelectConversation={handleSelectConversation}
            onNavigateToCreate={() => setCurrentView('create')}
            onLikeCharacter={handleLikeCharacter}
          />
        )}

        {currentView === 'chat' && activeCharacter && (
          <ChatWindow 
            character={activeCharacter}
            messages={messages}
            activeUserId={activeUserId}
            userProfile={userProfile}
            onSendMessage={handleSendMessage}
            onBack={() => setCurrentView('explore')}
            onClearHistory={async () => {
              if (activeConversation) {
                await deleteConversation(activeUserId, activeConversation.id);
                setConversations(prev => prev.filter(c => c.id !== activeConversation.id));
                setMessages([]);
                setCurrentView('explore');
              }
            }}
            onDeleteMessage={async (msgId) => {
              if (activeConversation) {
                setMessages(prev => prev.filter(m => m.id !== msgId));
              }
            }}
            onUpdateMessage={async (msgId, newText) => {
              if (activeConversation) {
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: newText } : m));
              }
            }}
            onRetryResponse={() => {}}
            onSaveMemory={async (item) => {
              await saveMemory(item);
              setMemories(prev => [item, ...prev]);
            }}
            memories={memories}
          />
        )}

        {currentView === 'group_chat' && (
          <GroupChatWindow 
            characters={characters}
            messages={groupMessages}
            activeUserId={activeUserId}
            userProfile={userProfile}
            onSendMessage={handleSendGroupMessage}
            onBack={() => setCurrentView('explore')}
            onClearHistory={() => setGroupMessages([])}
          />
        )}

        {currentView === 'create' && (
          <CharacterCreator 
            onBack={() => setCurrentView('explore')}
            onSave={handleSaveCharacter}
            activeUserId={activeUserId}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView 
            profile={userProfile}
            onUpdateBio={async (bio) => {
              if (userProfile) {
                const next = { ...userProfile, bio };
                await saveUserProfile(next);
                setUserProfile(next);
              }
            }}
            onUpdateName={async (displayName) => {
              if (userProfile) {
                const next = { ...userProfile, displayName };
                await saveUserProfile(next);
                setUserProfile(next);
              }
            }}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'admin' && (
          isCreatorOrAdmin ? (
            <AdminPanel 
              characters={characters}
              conversations={conversations}
              onBack={() => setCurrentView('explore')}
            />
          ) : (
            <div className="p-8 text-center space-y-4 bg-slate-900/60 border border-slate-800 rounded-3xl max-w-md mx-auto my-12 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">System Console Restricted</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The System Console is available exclusively to the application creator and verified administrators.
              </p>
              <button 
                onClick={() => setCurrentView('explore')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Return to Explore
              </button>
            </div>
          )
        )}

        {currentView === 'api' && (
          isCreatorOrAdmin ? (
            <ApiManager 
              onBack={() => setCurrentView('explore')}
            />
          ) : (
            <div className="p-8 text-center space-y-4 bg-slate-900/60 border border-slate-800 rounded-3xl max-w-md mx-auto my-12 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">API Settings Restricted</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The API Settings manager is available exclusively to the application creator and verified administrators.
              </p>
              <button 
                onClick={() => setCurrentView('explore')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Return to Explore
              </button>
            </div>
          )
        )}
      </main>

      {/* Bottom Navigation Bar - Mobile view */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800/80 p-3.5 flex justify-around z-40">
        <button 
          onClick={() => setCurrentView('explore')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentView === 'explore' ? 'text-teal-400' : 'text-slate-500'}`}
        >
          <Compass className="w-4 h-4" />
          Explore
        </button>
        <button 
          onClick={() => setCurrentView('group_chat')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentView === 'group_chat' ? 'text-teal-400' : 'text-slate-500'}`}
        >
          <Sparkles className="w-4 h-4" />
          Council
        </button>
        <button 
          onClick={() => setCurrentView('create')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentView === 'create' ? 'text-teal-400' : 'text-slate-500'}`}
        >
          <PlusCircle className="w-4 h-4" />
          Create
        </button>
        <button 
          onClick={() => setCurrentView('profile')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${currentView === 'profile' ? 'text-teal-400' : 'text-slate-500'}`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
      </nav>
    </div>
  );
}
