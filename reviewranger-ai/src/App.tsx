import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { TabType, UserProfile } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardTab from './components/DashboardTab';
import ReviewGeneratorTab from './components/ReviewGeneratorTab';
import HistoryTab from './components/HistoryTab';
import BillingTab from './components/BillingTab';
import { X, LayoutDashboard, Sparkles, History, CreditCard, LogOut, RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Real-time synced Firestore states
  const [isActiveSubscription, setIsActiveSubscription] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [trialCount, setTrialCount] = useState(0);
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isOwner = user?.email?.toLowerCase() === 'neoedits2009@gmail.com';

  // 🌓 Theme State Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Apply theme class to document element on mount and when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Auth State Listener - automatically provides instant access without requiring email sign in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          // Attempt seamless anonymous authentication
          await signInAnonymously(auth);
        } catch (err) {
          console.warn("Anonymous sign-in fallback:", err);
          // Instant guest user fallback if anonymous auth disabled or offline
          setUser({
            uid: 'guest_user_session',
            email: 'guest@reviewranger.ai',
            displayName: 'Guest Operator',
            photoURL: null,
            emailVerified: true,
            isAnonymous: true,
          } as User);
          setAuthLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync User Profile in Real-time from Firestore doc
  useEffect(() => {
    if (!user) {
      setIsActiveSubscription(false);
      setBusinessName('');
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const isBypassEmail = user.email?.toLowerCase() === 'neoedits2009@gmail.com';
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(userDocRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setIsActiveSubscription(true);
        setBusinessName(data.businessName || '');
        setTrialCount(data.trialCount || 0);
        setAuthLoading(false);

        // Auto update database to ensure isActiveSubscription is true
        if (!data.isActiveSubscription) {
          try {
            await setDoc(userDocRef, { isActiveSubscription: true }, { merge: true });
          } catch (err) {
            console.error("Error auto-updating user subscription status:", err);
          }
        }
      } else {
        // Document doesn't exist, create initial default user document in Firestore
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          isActiveSubscription: true,
          businessName: user.displayName ? `${user.displayName.split(' ')[0]}'s Outlet` : 'My Local Business',
          trialCount: 0,
          createdAt: new Date().toISOString()
        };
        try {
          await setDoc(userDocRef, newProfile);
          setIsActiveSubscription(true);
          setBusinessName(newProfile.businessName || '');
          setTrialCount(0);
        } catch (err) {
          console.error("Error creating initial user document:", err);
        } finally {
          setAuthLoading(false);
        }
      }
    }, (error) => {
      console.error("User document onSnapshot subscription error:", error);
      setIsActiveSubscription(true);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Collapses the mobile drawer after navigating tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  if (authLoading) {
    return (
      <div id="loading-spinner-container" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center space-y-4 transition-colors duration-200">
        <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none">
          <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 font-medium">
          <RefreshCw className="animate-spin h-4 w-4 text-indigo-600" />
          <span className="text-sm">Securing server connection...</span>
        </div>
      </div>
    );
  }

  const activeUser = user || ({
    uid: 'guest_user_session',
    email: 'guest@reviewranger.ai',
    displayName: 'Guest Operator',
    photoURL: null,
  } as User);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Sidebar Navigation - Desktop */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        isActiveSubscription={isActiveSubscription}
        businessName={businessName}
      />

      {/* Mobile Sidebar Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div id="mobile-menu-overlay" className="fixed inset-0 z-50 flex md:hidden bg-slate-950/60 backdrop-blur-xs transition-opacity">
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 text-slate-300">
            {/* Close Button */}
            <div className="absolute top-0 right-0 -mr-12 pt-4">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-white bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Logo */}
            <div className="flex items-center h-16 px-6 bg-slate-950 border-b border-slate-800/80">
              <div className="relative flex items-center justify-center mr-3 shrink-0">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg blur-xs opacity-50"></div>
                <div className="relative bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-1.5 rounded-lg border border-indigo-500/20 flex items-center justify-center">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-400 fill-indigo-400/10" />
                </div>
              </div>
              <span className="text-sm font-black text-white tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-indigo-100 bg-clip-text text-transparent flex items-center gap-1">
                Review<span className="text-indigo-400 font-black">Ranger</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-500/25 text-indigo-300 rounded border border-indigo-500/30">AI</span>
              </span>
            </div>

            {/* Menu Links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {[
                { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
                { id: 'generator' as TabType, label: 'Review Generator', icon: Sparkles, badge: isOwner ? 'Owner' : isActiveSubscription ? 'Pro' : 'Free' },
                { id: 'history' as TabType, label: 'History Logs', icon: History },
                { id: 'billing' as TabType, label: 'Billing & Plan', icon: CreditCard },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded ${
                        item.badge === 'Owner'
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-indigo-500/10 text-indigo-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60">
              <button
                onClick={() => auth.signOut()}
                className="w-full flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/40 rounded-xl border border-slate-800"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-h-screen">
        
        {/* Dynamic header */}
        <Header 
          user={activeUser} 
          isActiveSubscription={isActiveSubscription} 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Tab views switcher wrapper */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto" id="main-content-tab-viewport">
          {activeTab === 'dashboard' && (
            <DashboardTab 
              user={activeUser} 
              onNavigateToTab={handleTabChange} 
              isActiveSubscription={isActiveSubscription}
              businessName={businessName}
              setBusinessName={setBusinessName}
            />
          )}

          {activeTab === 'generator' && (
            <ReviewGeneratorTab 
              user={activeUser} 
              isActiveSubscription={isActiveSubscription} 
              trialCount={trialCount} 
              onNavigateToTab={handleTabChange}
              businessName={businessName}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab user={activeUser} />
          )}

          {activeTab === 'billing' && (
            <BillingTab 
              user={activeUser} 
              isActiveSubscription={isActiveSubscription} 
              setIsActiveSubscription={setIsActiveSubscription} 
            />
          )}
        </main>

      </div>
    </div>
  );
}
