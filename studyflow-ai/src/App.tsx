/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Menu, X } from 'lucide-react';

import { 
  UserProfile, 
  Note, 
  FlashcardSet, 
  Quiz, 
  PDFSummary, 
  Exam, 
  StudySession,
  AIChat,
  ChatMessage
} from './types';

// Components
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AIChatTutor from './components/AIChatTutor';
import NotesGenerator from './components/NotesGenerator';
import PDFSummarizer from './components/PDFSummarizer';
import FlashcardsView from './components/FlashcardsView';
import QuizGeneratorView from './components/QuizGeneratorView';
import ExamPlannerView from './components/ExamPlannerView';
import StudyTimerView from './components/StudyTimerView';
import SettingsView from './components/SettingsView';
import AdminPanel from './components/AdminPanel';
import GroupSessionsView from './components/GroupSessionsView';
import PremiumAnalyticsView from './components/PremiumAnalyticsView';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // App global collections
  const [notes, setNotes] = useState<Note[]>([]);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [pdfs, setPdfs] = useState<PDFSummary[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [chats, setChats] = useState<AIChat[]>([]);

  // Local helper to instantly increment usage count on successful AI operations
  const handleIncrementUsage = (key: 'aiChatsToday' | 'notesGeneratedThisMonth' | 'pdfSummariesGeneratedThisMonth' | 'quizGeneratedThisMonth' | 'flashcardsGeneratedThisMonth') => {
    setUserProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: (prev[key] || 0) + 1
      };
    });
  };

  const DEFAULT_GUEST_PROFILE: UserProfile = {
    uid: 'guest_user',
    email: 'guest@studyflow.ai',
    displayName: 'Learner',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Learner',
    createdAt: new Date().toISOString(),
    role: 'student',
    studyStreak: 5,
    lastStudyDate: new Date().toISOString().split('T')[0],
    dailyStudyGoal: 45,
    currentPlan: 'premium',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: null,
    subscriptionPlan: 'premium',
    subscriptionStart: new Date().toISOString(),
    subscriptionEnd: null,
    aiChatsToday: 0,
    aiStudyPlansThisMonth: 0,
    notesGeneratedThisMonth: 0,
    flashcardsGeneratedThisMonth: 0,
    quizGeneratedThisMonth: 0,
    uploadedFiles: 0,
    pdfSummariesGeneratedThisMonth: 0
  };

  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(false);

  // Track Auth Changes & Initializations
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setShowAuthScreen(false);
        // Load initial state or sync/create profile in Firestore
        await loadUserData(user.uid, user);
      } else {
        setFirebaseUser(null);
        // Default to instant unlocked access as Guest
        setUserProfile(DEFAULT_GUEST_PROFILE);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync / Load data from Firestore if connected
  const loadUserData = async (uid: string, user: FirebaseUser) => {
    setLoading(true);
    try {
      // Parallelize queries for instant workspace loading & fetch user profile
      const [
        userDocSnap,
        notesSnap,
        cardsSnap,
        quizzesSnap,
        pdfsSnap,
        examsSnap,
        sessionsSnap,
        chatsSnap
      ] = await Promise.all([
        getDoc(doc(db, 'users', uid)),
        getDocs(query(collection(db, 'notes'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'flashcards'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'quizzes'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'pdfs'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'exams'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'study_sessions'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'ai_chats'), where('userId', '==', uid)))
      ]);

      let profile: UserProfile;

      const isAdminEmail = user.email === 'neoedits2008@gmail.com';

      if (userDocSnap.exists()) {
        profile = userDocSnap.data() as UserProfile;
        let needsUpdate = false;
        
        if (isAdminEmail && profile.role !== 'admin') {
          profile.role = 'admin';
          needsUpdate = true;
        }

        // Everyone gets Premium access
        if (profile.currentPlan !== 'premium' || profile.subscriptionStatus !== 'active' || profile.subscriptionPlan !== 'premium') {
          profile.currentPlan = 'premium';
          profile.subscriptionPlan = 'premium';
          profile.subscriptionStatus = 'active';
          needsUpdate = true;
        }

        if (profile.aiChatsToday === undefined) {
          profile.aiChatsToday = 0;
          profile.aiStudyPlansThisMonth = 0;
          profile.notesGeneratedThisMonth = 0;
          profile.flashcardsGeneratedThisMonth = 0;
          profile.quizGeneratedThisMonth = 0;
          profile.uploadedFiles = 0;
          profile.pdfSummariesGeneratedThisMonth = 0;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await setDoc(doc(db, 'users', uid), { 
            role: profile.role,
            currentPlan: 'premium',
            subscriptionStatus: 'active',
            subscriptionPlan: 'premium',
            subscriptionStart: profile.subscriptionStart || new Date().toISOString(),
            subscriptionEnd: null,
            aiChatsToday: profile.aiChatsToday ?? 0,
            aiStudyPlansThisMonth: profile.aiStudyPlansThisMonth ?? 0,
            notesGeneratedThisMonth: profile.notesGeneratedThisMonth ?? 0,
            flashcardsGeneratedThisMonth: profile.flashcardsGeneratedThisMonth ?? 0,
            quizGeneratedThisMonth: profile.quizGeneratedThisMonth ?? 0,
            uploadedFiles: profile.uploadedFiles ?? 0,
            pdfSummariesGeneratedThisMonth: profile.pdfSummariesGeneratedThisMonth ?? 0
          }, { merge: true });
        }
      } else {
        // Retrieve pending display name if signed up via custom Email Sign Up
        const pendingName = localStorage.getItem('pending_signup_display_name');
        if (pendingName) {
          localStorage.removeItem('pending_signup_display_name');
        }

        // Create fresh new user profile with FULL UNLOCKED PREMIUM ACCESS
        profile = {
          uid: uid,
          email: user.email || '',
          displayName: user.displayName || pendingName || user.email?.split('@')[0] || 'Learner',
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'learner')}`,
          createdAt: new Date().toISOString(),
          role: isAdminEmail ? 'admin' : 'student',
          studyStreak: 3,
          lastStudyDate: new Date().toISOString().split('T')[0],
          dailyStudyGoal: 45,
          currentPlan: 'premium',
          subscriptionStatus: 'active',
          subscriptionExpiresAt: null,
          subscriptionPlan: 'premium',
          subscriptionStart: new Date().toISOString(),
          subscriptionEnd: null,
          aiChatsToday: 0,
          aiStudyPlansThisMonth: 0,
          notesGeneratedThisMonth: 0,
          flashcardsGeneratedThisMonth: 0,
          quizGeneratedThisMonth: 0,
          uploadedFiles: 0,
          pdfSummariesGeneratedThisMonth: 0
        };
        await setDoc(doc(db, 'users', uid), profile);
      }

      setUserProfile(profile);

      // Populate list states
      const notesList: Note[] = [];
      notesSnap.forEach(d => notesList.push(d.data() as Note));
      setNotes(notesList);

      const cardsList: FlashcardSet[] = [];
      cardsSnap.forEach(d => cardsList.push(d.data() as FlashcardSet));
      setFlashcardSets(cardsList);

      const quizzesList: Quiz[] = [];
      quizzesSnap.forEach(d => quizzesList.push(d.data() as Quiz));
      setQuizzes(quizzesList);

      const pdfsList: PDFSummary[] = [];
      pdfsSnap.forEach(d => pdfsList.push(d.data() as PDFSummary));
      setPdfs(pdfsList);

      const examsList: Exam[] = [];
      examsSnap.forEach(d => examsList.push(d.data() as Exam));
      setExams(examsList);

      const sessionsList: StudySession[] = [];
      sessionsSnap.forEach(d => sessionsList.push(d.data() as StudySession));
      setSessions(sessionsList);

      const chatsList: AIChat[] = [];
      chatsSnap.forEach(d => chatsList.push(d.data() as AIChat));
      setChats(chatsList);

    } catch (err) {
      console.warn("Firestore user sync skip or unauthorized. Using local offline storage: ", err);
      // Fallback in case firestore block or loading latency
      const fallbackProfile: UserProfile = {
        uid: uid,
        email: user.email || '',
        displayName: user.displayName || 'Learner',
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=learner`,
        createdAt: new Date().toISOString(),
        role: user.email === 'neoedits2008@gmail.com' ? 'admin' : 'student',
        studyStreak: 3,
        lastStudyDate: null,
        dailyStudyGoal: 45,
        currentPlan: 'premium',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: null
      };
      setUserProfile(fallbackProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn(e);
    }
    setFirebaseUser(null);
    setUserProfile(DEFAULT_GUEST_PROFILE);
    setShowAuthScreen(false);
    setActiveTab('dashboard');
  };

  // State handlers to bubble up modifications from subcomponents
  const handleAddNote = (note: Note) => setNotes([note, ...notes]);
  const handleAddPDF = (pdf: PDFSummary) => setPdfs([pdf, ...pdfs]);
  const handleAddFlashcardSet = (set: FlashcardSet) => setFlashcardSets([set, ...flashcardSets]);
  const handleUpdateFlashcardSet = (set: FlashcardSet) => {
    setFlashcardSets(flashcardSets.map(item => item.id === set.id ? set : item));
  };
  const handleAddQuiz = (quiz: Quiz) => setQuizzes([quiz, ...quizzes]);
  const handleUpdateQuiz = (quiz: Quiz) => {
    setQuizzes(quizzes.map(item => item.id === quiz.id ? quiz : item));
  };
  const handleAddExam = (exam: Exam) => setExams([exam, ...exams]);
  const handleUpdateExam = (exam: Exam) => {
    setExams(exams.map(item => item.id === exam.id ? exam : item));
  };
  const handleAddSession = (session: StudySession) => setSessions([session, ...sessions]);
  
  const handleAddChat = (chat: AIChat) => setChats([chat, ...chats]);
  const handleUpdateChatMessages = (chatId: string, messages: ChatMessage[]) => {
    setChats(chats.map(c => c.id === chatId ? { ...c, messages } : c));
  };

  const handleUpdatePlan = (plan: 'free' | 'pro' | 'premium') => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        currentPlan: plan
      });
    }
  };

  const handleUpdateProfile = (displayName: string, dailyGoal: number) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        displayName,
        dailyStudyGoal: dailyGoal
      });
    }
  };

  const handleUpdateUserProfileState = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="text-center space-y-5">
          {/* Gen Z custom loading logo badge */}
          <div className="relative w-16 h-16 mx-auto mb-2 animate-bounce">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#D4A373] via-[#E29578] to-[#5A5A40] rounded-2xl blur opacity-75 animate-pulse"></div>
            <div className="relative w-16 h-16 bg-[#2C2C2B] rounded-2xl flex items-center justify-center text-white shadow-2xl border border-white/10 transform rotate-6">
              <span className="text-3xl select-none">⚡</span>
              <span className="absolute -top-2 -right-2 text-sm text-[#D4A373] animate-ping">✦</span>
            </div>
          </div>
          <p className="text-xs uppercase font-black tracking-widest text-[#5A5A40] animate-pulse">
            Configuring studyflow.ai workspace...
          </p>
        </div>
      </div>
    );
  }

  // Optional sign-in toggle or login screen view if user explicitly opens it
  if (showAuthScreen && !firebaseUser) {
    return <Auth onLogout={handleLogout} />;
  }

  const isAdmin = userProfile.role === 'admin' || userProfile.email === 'neoedits2008@gmail.com';

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F0] text-[#2C2C2B]">
      
      {/* Top Header Navigation */}
      <header className="h-16 border-b border-black/5 flex items-center justify-between px-6 md:px-8 bg-white/50 backdrop-blur-sm z-40 sticky top-0">
        
        {/* Brand Logo (Sleek GenZ redesign) */}
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4A373] to-[#5A5A40] rounded-xl blur-sm opacity-50 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-9 h-9 bg-[#2C2C2B] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md border border-white/5 transform group-hover:rotate-6 transition-transform">
              <span className="text-base">⚡</span>
            </div>
          </div>
          <span className="text-xl font-black tracking-tight text-[#2C2C2B] font-sans flex items-center gap-1">
            studyflow<span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#5A5A40] text-[#F5F5F0] uppercase tracking-wider font-extrabold scale-90 border border-[#D4A373]/25">ai</span>
          </span>
        </div>

        {/* Right side user card */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <div className="flex items-center justify-end gap-1">
              {userProfile.currentPlan === 'premium' && <span className="text-xs animate-[bounce_1s_infinite]">👑</span>}
              <p className="text-xs font-black text-[#3E3E3B]">{userProfile.displayName || 'Learner'}</p>
            </div>
            <p className={`text-[9px] font-black uppercase tracking-widest ${
              userProfile.currentPlan === 'premium' ? 'text-amber-500 animate-pulse' : 'text-[#D4A373]'
            }`}>
              {userProfile.currentPlan.toUpperCase()} MEMBER
            </p>
          </div>

          <div 
            onClick={() => {
              setActiveTab('settings');
              setMobileMenuOpen(false);
            }}
            className={`h-10 w-10 rounded-full border-2 overflow-hidden bg-stone-200 cursor-pointer hover:opacity-80 transition-all shrink-0 ${
              userProfile.currentPlan === 'premium' ? 'border-amber-400 shadow-[0_0_10px_rgba(212,163,115,0.4)] animate-[pulse_3s_infinite]' : 'border-white shadow-sm'
            }`}
          >
            <img src={userProfile.photoURL} alt="User Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </div>

          <button 
            onClick={handleLogout}
            className="hidden sm:inline-block text-[10px] bg-stone-200/50 hover:bg-stone-200 text-stone-600 font-bold px-3 py-2 rounded-xl uppercase tracking-wider transition-all"
          >
            Logout
          </button>

          {/* Hamburger menu button for mobile/tablets */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-600 hover:bg-[#5A5A40]/10 rounded-xl transition-all cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop blur overlay */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#2C2C2B]/40 backdrop-blur-sm transition-opacity duration-300"
          ></div>
          
          {/* Drawer content panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#F7F3EE] p-6 shadow-2xl border-r border-black/5 overflow-y-auto animate-[slideIn_0.2s_ease-out]">
            {/* Header inside drawer */}
            <div className="flex items-center justify-between mb-8 border-b border-black/5 pb-4">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 bg-[#2C2C2B] rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md">
                  <span>⚡</span>
                </div>
                <span className="text-lg font-black tracking-tight text-[#2C2C2B]">studyflow.ai</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-stone-600 hover:bg-stone-200/50 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Info on top of drawer */}
            <div className={`p-4 rounded-[24px] border mb-6 flex items-center gap-3 transition-all ${
              userProfile.currentPlan === 'premium' ? 'bg-[#D4A373]/10 border-amber-400 shadow-[0_0_15px_rgba(212,163,115,0.15)]' : 'bg-white border-black/5'
            }`}>
              <div className={`h-11 w-11 rounded-full border overflow-hidden bg-stone-100 shrink-0 ${
                userProfile.currentPlan === 'premium' ? 'border-amber-400 shadow-sm' : 'border-[#D4A373]/20'
              }`}>
                <img src={userProfile.photoURL} alt="User Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {userProfile.currentPlan === 'premium' && <span className="text-xs">👑</span>}
                  <p className="text-xs font-black text-[#2C2C2B]">{userProfile.displayName || 'Learner'}</p>
                </div>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                  userProfile.currentPlan === 'premium' ? 'text-amber-500' : 'text-[#D4A373]'
                }`}>
                  ✨ {userProfile.currentPlan.toUpperCase()} MEMBER
                </p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-grow space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#5A5A40]/60 font-black">Core Toolkit</p>
                <ul className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
                    { id: 'tutor', label: 'AI Tutor', icon: '🤖' },
                    { id: 'notes', label: 'AI Notes', icon: '📝' },
                    { id: 'summarizer', label: 'PDF Summarizer', icon: '📄' },
                    { id: 'flashcards', label: 'Flashcards', icon: '⚡' },
                    { id: 'quiz', label: 'AI Quiz Arena', icon: '🏆' },
                    { id: 'planner', label: 'Exam Planner', icon: '📅' },
                    { id: 'timer', label: 'Study Timer', icon: '⏱️' },
                    { id: 'groupsessions', label: 'Group Sessions', icon: '👥', premiumBadge: true },
                    { id: 'analytics', label: 'Premium Analytics', icon: '📊', premiumBadge: true },
                    { id: 'settings', label: 'Settings', icon: '⚙️' },
                  ].map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <li 
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center justify-between cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-white text-[#5A5A40] border border-black/5 shadow-sm' 
                            : 'text-stone-500 hover:bg-white/50'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span>{item.icon}</span> {item.label}
                        </span>
                        {item.premiumBadge && userProfile?.currentPlan !== 'premium' && (
                          <span className="text-[8px] bg-[#D4A373]/20 text-[#8b5e3c] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider scale-90 border border-[#D4A373]/30">Premium</span>
                        )}
                      </li>
                    );
                  })}

                  {isAdmin && (
                    <li 
                      onClick={() => {
                        setActiveTab('admin');
                        setMobileMenuOpen(false);
                      }}
                      className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-3 cursor-pointer transition-all ${
                        activeTab === 'admin' 
                          ? 'bg-red-50 text-red-700 border border-red-200/50' 
                          : 'text-red-600 hover:bg-red-50/50'
                      }`}
                    >
                      <span>🛡️</span> Admin Panel
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Logout at bottom of drawer */}
            <div className="pt-4 border-t border-black/5 mt-auto">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-3 bg-stone-200/50 hover:bg-stone-200 text-stone-600 font-extrabold rounded-2xl text-xs uppercase tracking-widest transition-all"
              >
                Logout Account
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main Body Shell */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Hand Sidebar Navigation */}
        <aside className="hidden md:flex md:w-64 bg-[#F7F3EE] p-5 flex-col gap-8 border-r border-black/5 md:sticky md:top-16 md:h-[calc(100vh-64px)] overflow-y-auto shrink-0">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#5A5A40]/60 font-black">Core Toolkit</p>
            <ul className="space-y-1">
              
              <li 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'dashboard' ? 'bg-white text-brand-sage border border-black/5 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <span>🏠</span> Dashboard
              </li>

              <li 
                onClick={() => setActiveTab('tutor')}
                className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'tutor' ? 'bg-white text-brand-sage border border-black/5 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <span>🤖</span> AI Tutor
              </li>

              <li 
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'notes' ? 'bg-white text-brand-sage border border-black/5 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <span>📝</span> AI Notes
              </li>

              <li 
                onClick={() => setActiveTab('summarizer')}
                className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'summarizer' ? 'bg-white text-brand-sage border border-black/5 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <span>📄</span> PDF Summarizer
              </li>

              <li 
                onClick={() => setActiveTab('flashcards')}
                className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'flashcards' ? 'bg-white text-brand-sage border border-black/5 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <span>⚡</span> Flashcards
              </li>

              <li 
                onClick={() => setActiveTab('quiz')}
                className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'quiz' ? 'bg-white text-brand-sage border border-black/5 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <span>🏆</span> AI Quiz Arena
              </li>

              <li 
                onClick={() => setActiveTab('planner')}
                className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'planner' ? 'bg-white text-brand-sage border border-black/5 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <span>📅</span> Exam Planner
              </li>

              <li 
                onClick={() => setActiveTab('timer')}
                className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'timer' ? 'bg-white text-brand-sage border border-black/5 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <span>⏱️</span> Study Timer
              </li>

              <li 
                onClick={() => setActiveTab('groupsessions')}
                className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center justify-between cursor-pointer transition-all ${activeTab === 'groupsessions' ? 'bg-white text-brand-sage border border-black/5 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <span className="flex items-center gap-3"><span>👥</span> Group Sessions</span>
                {userProfile?.currentPlan !== 'premium' && (
                  <span className="text-[8px] bg-[#D4A373]/20 text-[#8b5e3c] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider scale-90 border border-[#D4A373]/30">Premium</span>
                )}
              </li>

              <li 
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center justify-between cursor-pointer transition-all ${activeTab === 'analytics' ? 'bg-white text-brand-sage border border-black/5 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <span className="flex items-center gap-3"><span>📊</span> Premium Analytics</span>
                {userProfile?.currentPlan !== 'premium' && (
                  <span className="text-[8px] bg-[#D4A373]/20 text-[#8b5e3c] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider scale-90 border border-[#D4A373]/30">Premium</span>
                )}
              </li>

              <li 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'settings' ? 'bg-white text-brand-sage border border-black/5 shadow-sm' : 'text-stone-500 hover:bg-white/50'}`}
              >
                <span>⚙️</span> Settings
              </li>

              {/* Admin Panel button - solely for neoedits owner / rinkibairagi tester */}
              {isAdmin && (
                <li 
                  onClick={() => setActiveTab('admin')}
                  className={`px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-3 cursor-pointer transition-all ${activeTab === 'admin' ? 'bg-[#D4A373]/10 text-[#8B5E3C] border border-[#D4A373]/20 shadow-sm' : 'text-amber-700 hover:bg-amber-50'}`}
                >
                  <span>👑</span> Admin Control
                </li>
              )}

            </ul>
          </div>

          <div className="mt-auto hidden md:block">
            <div className="bg-[#5A5A40] p-5 rounded-2xl text-white relative overflow-hidden shadow-md">
              <span className="text-[9px] opacity-70 mb-1 font-bold tracking-widest uppercase block">Pro Companion</span>
              <p className="text-xs font-bold leading-tight mb-2">StudyFlow AI active and synced.</p>
              <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-full rounded-full"></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Section */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              userProfile={userProfile}
              notes={notes}
              flashcardSets={flashcardSets}
              quizzes={quizzes}
              pdfs={pdfs}
              exams={exams}
              sessions={sessions}
              onNavigate={setActiveTab}
              onUpdateDailyGoal={(mins) => handleUpdateProfile(userProfile?.displayName || '', mins)}
              onStartStudySession={() => setActiveTab('timer')}
              onUpdatePlan={handleUpdatePlan}
            />
          )}

          {activeTab === 'tutor' && (
            <AIChatTutor 
              userProfile={userProfile}
              chats={chats}
              onAddChat={handleAddChat}
              onUpdateChatMessages={handleUpdateChatMessages}
              notes={notes}
              pdfs={pdfs}
              onNavigate={setActiveTab}
              onUpdatePlan={handleUpdatePlan}
              onAddPDF={handleAddPDF}
              onIncrementUsage={handleIncrementUsage}
            />
          )}

          {activeTab === 'notes' && (
            <NotesGenerator 
              userProfile={userProfile}
              notes={notes}
              onAddNote={handleAddNote}
              onUpdatePlan={handleUpdatePlan}
              onIncrementUsage={handleIncrementUsage}
            />
          )}

          {activeTab === 'summarizer' && (
            <PDFSummarizer 
              userProfile={userProfile}
              pdfs={pdfs}
              onAddPDF={handleAddPDF}
              onUpdatePlan={handleUpdatePlan}
              onIncrementUsage={handleIncrementUsage}
            />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardsView 
              userProfile={userProfile}
              flashcardSets={flashcardSets}
              onAddFlashcardSet={handleAddFlashcardSet}
              onUpdateFlashcardSet={handleUpdateFlashcardSet}
              onUpdatePlan={handleUpdatePlan}
              onIncrementUsage={handleIncrementUsage}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizGeneratorView 
              userProfile={userProfile}
              quizzes={quizzes}
              onAddQuiz={handleAddQuiz}
              onUpdateQuiz={handleUpdateQuiz}
              onUpdatePlan={handleUpdatePlan}
              onIncrementUsage={handleIncrementUsage}
            />
          )}

          {activeTab === 'planner' && (
            <ExamPlannerView 
              userProfile={userProfile}
              exams={exams}
              onAddExam={handleAddExam}
              onUpdateExam={handleUpdateExam}
            />
          )}

          {activeTab === 'timer' && (
            <StudyTimerView 
              userProfile={userProfile}
              onAddSession={handleAddSession}
              onUpdateUserProfile={handleUpdateUserProfileState}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'groupsessions' && (
            <GroupSessionsView 
              userProfile={userProfile}
              onUpdatePlan={handleUpdatePlan}
            />
          )}

          {activeTab === 'analytics' && (
            <PremiumAnalyticsView 
              userProfile={userProfile}
              notes={notes}
              pdfs={pdfs}
              quizzes={quizzes}
              sessions={sessions}
              onUpdatePlan={handleUpdatePlan}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              userProfile={userProfile}
              onUpdatePlan={handleUpdatePlan}
              onUpdateProfile={handleUpdateProfile}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanel 
              userProfile={userProfile}
            />
          )}
        </main>
      </div>

      {/* Footer bar */}
      <footer className="h-10 bg-white border-t border-black/5 flex flex-col sm:flex-row items-center justify-between px-6 text-[9px] font-black text-stone-400 uppercase tracking-widest py-2">
        <div>Registered Owner & Tester: neoedits2008@gmail.com 🟢</div>
        <div className="flex gap-4">
          <span className="text-brand-sage">Gemini 3.5 Flash Connected</span>
          <span>StudyFlow v1.2.0</span>
        </div>
      </footer>

    </div>
  );
}
