import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, dbService } from './lib/firebase';
import { UserProfile, BusinessSettings, Product, Order, Customer, Conversation, AppNotification } from './types';

// Component Imports
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AIChat from './components/AIChat';
import Customers from './components/Customers';
import Orders from './components/Orders';
import Products from './components/Products';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';

import { Bell, X, Info, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

// Default free partner user providing instant 1-click access to all features
const DEFAULT_FREE_USER: UserProfile = {
  uid: 'free_partner_default',
  email: 'guest@bizchat.ai',
  displayName: 'Free Merchant Partner',
  role: 'admin',
  plan: 'pro',
  shopName: 'Beans & Brews'
};

export default function App() {
  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_FREE_USER);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  // Core Data models
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Initial Data Loading
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [prodList, custList, ordList, convList, config, notifList] = await Promise.all([
          dbService.getProducts(),
          dbService.getCustomers(),
          dbService.getOrders(),
          dbService.getConversations(),
          dbService.getSettings(),
          dbService.getNotifications()
        ]);

        setProducts(prodList);
        setCustomers(custList);
        setOrders(ordList);
        setConversations(convList);
        setSettings(config);
        setNotifications(notifList);
      } catch (err) {
        console.error('Error loading initial databases:', err);
      }
    };

    loadAllData();
  }, [user]);

  // Firebase Authentication State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Authenticated
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Business Partner',
          photoURL: firebaseUser.photoURL || undefined,
          role: 'business', // Default role
          plan: 'free',
          shopName: 'Beans & Brews'
        });
        setShowAuth(false);
      } else {
        // Unauthenticated - only clear if they were logged in via standard Firebase
        // (Do not override demo-bypass user objects)
        if (user && !user.uid.includes('_test_')) {
          setUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync Dark mode state with document class list
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Helper to add dynamic slide-in toaster notifications
  const handleAddNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false
    };

    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    dbService.saveNotifications(updated);
    
    // Set as active toast alert
    setActiveToast(newNotif);
    setTimeout(() => {
      setActiveToast(null);
    }, 5000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase logout failed/offline:', e);
    }
    setUser(null);
    setCurrentTab('dashboard');
    setShowAuth(false);
    handleAddNotification('Logged Out', 'Successfully logged out of your shop session.', 'info');
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
    setShowAuth(false);
    handleAddNotification(
      'Auth Succeeded', 
      `Welcome back, ${profile.displayName}! Signed in as ${profile.role.toUpperCase()}.`, 
      'success'
    );
  };

  const handleSaveSettings = (updatedConfig: BusinessSettings) => {
    setSettings(updatedConfig);
    dbService.saveSettings(updatedConfig);
  };

  const handleUpdateProducts = (updatedProds: Product[]) => {
    setProducts(updatedProds);
    // Persist each in local/firestore fallback
    updatedProds.forEach(p => dbService.saveProduct(p));
  };

  const handleUpdateCustomers = (updatedCusts: Customer[]) => {
    setCustomers(updatedCusts);
    updatedCusts.forEach(c => dbService.saveCustomer(c));
  };

  const handleUpdateOrders = (updatedOrds: Order[]) => {
    setOrders(updatedOrds);
    updatedOrds.forEach(o => dbService.saveOrder(o));
  };

  const handleUpdateConversations = (updatedConvs: Conversation[]) => {
    setConversations(updatedConvs);
    updatedConvs.forEach(c => dbService.saveConversation(c));
  };

  const handleAddOrderFromAI = (newOrder: Order) => {
    const updated = [newOrder, ...orders];
    setOrders(updated);
    dbService.saveOrder(newOrder);

    // Also register customer to CRM list if brand new name
    const customerExists = customers.some(c => c.name.toLowerCase() === newOrder.customerName.toLowerCase());
    if (!customerExists) {
      const newCust: Customer = {
        id: `c_${Math.floor(100 + Math.random() * 900)}`,
        name: newOrder.customerName,
        phone: newOrder.customerPhone,
        email: `${newOrder.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        lastConversation: `Ordered items worth $${newOrder.totalAmount.toFixed(2)}`,
        notes: 'Lead captured automatically by AI chat order proposal approval.',
        tags: ['Lead', 'AI Order']
      };
      const updatedCusts = [...customers, newCust];
      setCustomers(updatedCusts);
      dbService.saveCustomer(newCust);
    }
  };

  // Render proper Tab Contents
  const renderTabContent = () => {
    if (!settings) return <div className="p-12 text-center text-slate-400">Loading configurations...</div>;

    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard 
            customers={customers} 
            orders={orders} 
            conversations={conversations} 
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        );
      case 'chat':
        return (
          <AIChat 
            conversations={conversations} 
            customers={customers}
            products={products}
            settings={settings}
            onUpdateConversations={handleUpdateConversations}
            onAddOrder={handleAddOrderFromAI}
            onAddNotification={handleAddNotification}
          />
        );
      case 'customers':
        return (
          <Customers 
            customers={customers} 
            onUpdateCustomers={handleUpdateCustomers}
            onAddNotification={handleAddNotification}
          />
        );
      case 'orders':
        return (
          <Orders 
            orders={orders} 
            products={products}
            onUpdateOrders={handleUpdateOrders}
            onAddNotification={handleAddNotification}
          />
        );
      case 'products':
        return (
          <Products 
            products={products} 
            onUpdateProducts={handleUpdateProducts}
            onAddNotification={handleAddNotification}
          />
        );
      case 'settings':
        return (
          <Settings 
            settings={settings} 
            onSaveSettings={handleSaveSettings}
            onAddNotification={handleAddNotification}
          />
        );
      case 'admin':
        return (
          <AdminPanel 
            onAddNotification={handleAddNotification}
          />
        );
      default:
        return <div className="p-8 text-center text-slate-400">Tab coming soon...</div>;
    }
  };

  // If user is not logged in, render SaaS Landing Page
  if (!user) {
    if (showAuth) {
      return (
        <div className={darkMode ? 'dark bg-slate-950 min-h-screen' : 'bg-slate-50 min-h-screen'}>
          <Auth 
            onSuccess={handleAuthSuccess} 
            onBackToLanding={() => setShowAuth(false)} 
          />
        </div>
      );
    }
    return (
      <LandingPage 
        onGetStarted={() => {
          handleAuthSuccess(DEFAULT_FREE_USER);
        }} 
        onLogin={() => {
          handleAuthSuccess(DEFAULT_FREE_USER);
        }} 
      />
    );
  }

  // Active Merchant Dashboard View Layout
  return (
    <div id="saas-container" className={`min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${darkMode ? 'dark' : ''}`}>
      {/* Toast Notification Alert */}
      {activeToast && (
        <div 
          id="toast-notification"
          className="fixed top-6 right-6 z-50 flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl max-w-sm animate-bounce-short"
        >
          <div className="shrink-0 mt-0.5">
            {activeToast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            {activeToast.type === 'info' && <Info className="w-5 h-5 text-indigo-500" />}
            {activeToast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {activeToast.type === 'error' && <AlertOctagon className="w-5 h-5 text-rose-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{activeToast.title}</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">{activeToast.message}</p>
          </div>
          <button 
            onClick={() => setActiveToast(null)}
            className="shrink-0 p-0.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sidebar */}
      <Sidebar 
        user={user} 
        currentTab={currentTab} 
        onChangeTab={setCurrentTab} 
        onLogout={handleLogout}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen(!mobileOpen)}
      />

      {/* Main View Area Container */}
      <main id="main-content-stage" className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        {renderTabContent()}
      </main>
    </div>
  );
}
