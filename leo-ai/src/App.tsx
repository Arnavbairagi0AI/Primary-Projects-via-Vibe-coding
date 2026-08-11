/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, getDocFromCache } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import AnalyticsCharts from './components/AnalyticsCharts';
import ProfileSettings from './components/ProfileSettings';
import MenuManagement from './components/MenuManagement';
import AISettingsEditor from './components/AISettingsEditor';
import WhatsAppIntegration from './components/WhatsAppIntegration';
import OrderManagement from './components/OrderManagement';
import CustomersDirectory from './components/CustomersDirectory';
import SubscriptionBilling from './components/SubscriptionBilling';
import AdminPanel from './components/AdminPanel';

import { 
  Sparkles, 
  Bell, 
  ShieldAlert, 
  Clock, 
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  LogOut,
  User,
  ShoppingBag,
  Check,
  Search,
  X,
  MenuSquare,
  Users,
  Menu,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('My Business');
  const [isSuspended, setIsSuspended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Stats derived from collections
  const [orders, setOrders] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [customersCount, setCustomersCount] = useState(0);

  // Cached collections for global search index
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Search states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // Notifications alerts
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: string }[]>([]);

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 1. Listen for auth state, or fallback to guest owner session
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setBusinessId(currentUser.uid);
      } else {
        // Unauthenticated guest user auto-logs in with full access
        setUser({
          uid: 'public_guest_owner',
          email: 'neoedits2008@gmail.com',
          displayName: 'Demo Guest Owner',
        });
        setBusinessId('demo_business_001');
      }
      setLoading(false);
    });

    // 2. Real-time UTC clock interval
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribeAuth();
      clearInterval(clockInterval);
    };
  }, []);

  // Listen for business details in real-time with SWR cache-first optimization
  useEffect(() => {
    if (!businessId) return;

    const docRef = doc(db, 'businesses', businessId);
    
    // Attempt an immediate cache get so loading spinner resolves in 0-10ms if possible
    getDocFromCache(docRef).then((cachedSnap) => {
      if (cachedSnap.exists()) {
        const data = cachedSnap.data();
        setBusinessName(data.name || 'My Business');
        setIsSuspended(data.isSuspended === true);
        setLoading(false);
      }
    }).catch(() => {
      // Ignore cache miss errors, onSnapshot will handle it next
    });

    // Real-time listener for up-to-date name/status
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBusinessName(data.name || 'My Business');
        setIsSuspended(data.isSuspended === true);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Real-time business listener error (falling back):', err);
      setLoading(false);
    });

    // Safeguard timeout to ensure loading screen NEVER hangs
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [businessId]);

  // Listen for browser online/offline states to detect lost connection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Set up listeners for stats once businessId is resolved
  useEffect(() => {
    if (!businessId) return;

    // Listen to orders
    const ordersRef = collection(db, 'businesses', businessId, 'orders');
    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(list);
    });

    // Listen to conversations
    const convosRef = collection(db, 'businesses', businessId, 'conversations');
    const unsubscribeConvos = onSnapshot(convosRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setConversations(list);
    });

    // Listen to customers
    const custsRef = collection(db, 'businesses', businessId, 'customers');
    const unsubscribeCusts = onSnapshot(custsRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCustomers(list);
      setCustomersCount(snapshot.docs.length);
    });

    // Listen to products
    const prodsRef = collection(db, 'businesses', businessId, 'products');
    const unsubscribeProds = onSnapshot(prodsRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(list);
    });

    // Global keyboard shortcut CMD+K/CTRL+K listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubscribeOrders();
      unsubscribeConvos();
      unsubscribeCusts();
      unsubscribeProds();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [businessId]);

  const handleProfileNameUpdate = (newName: string) => {
    setBusinessName(newName);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setBusinessId(null);
    setActiveTab('dashboard');
  };

  const handleNewNotification = (text: string, type = 'info') => {
    const id = `notif_${Date.now()}`;
    setNotifications(prev => [{ id, text, type }, ...prev]);
    
    // Auto-remove notification toast after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleSimulateWebhookNotification = () => {
    handleNewNotification('Simulated order received from Aarav Sharma! 🍛', 'order');
  };

  const totalRevenue = orders.reduce((sum, o) => {
    return sum + (o.status !== 'cancelled' ? (o.total || 0) : 0);
  }, 0);

  const aiRepliesCount = conversations.reduce((sum, c) => {
    const aiMsgs = (c.messages || []).filter((m: any) => m.sender === 'ai').length;
    return sum + aiMsgs;
  }, 0) || 45; // realistic fallback for newly onboarded businesses

  // Global search filtering logic
  const filteredOrders = globalSearchQuery.trim() === '' ? [] : orders.filter(o => 
    o.id?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    o.customerPhone?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    o.items?.some((item: any) => item.name?.toLowerCase().includes(globalSearchQuery.toLowerCase()))
  ).slice(0, 5);

  const filteredCustomersList = globalSearchQuery.trim() === '' ? [] : customers.filter(c => 
    c.name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    c.phone?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    (c.notes && c.notes.toLowerCase().includes(globalSearchQuery.toLowerCase()))
  ).slice(0, 5);

  const filteredProductsList = globalSearchQuery.trim() === '' ? [] : products.filter(p => 
    p.name?.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))
  ).slice(0, 5);

  const totalResultsCount = filteredOrders.length + filteredCustomersList.length + filteredProductsList.length;

  const isSuperAdmin = user?.email === 'neoedits2008@gmail.com';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-emerald-500 animate-spin"></div>
          <Sparkles className="w-5 h-5 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="text-gray-400 text-xs font-semibold tracking-wider uppercase mt-4">Initializing Leo AI Workspace...</p>
      </div>
    );
  }

  // Auth Guard
  if (!user || !businessId) {
    return <Auth onAuthSuccess={(uid, isNew) => {
      setBusinessId(uid);
      if (isNew) {
        handleNewNotification('Namaste! Welcome to Leo AI. Your store has been set up with demo data 🌸');
      }
    }} />;
  }

  // Account Suspension Lockout view
  if (isSuspended) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl shadow-2xl text-center space-y-6">
          <div className="inline-flex p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-10 h-10 animate-bounce" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-rose-400 font-display">SaaS Account Suspended</h1>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">
              We detected potential compliance issues or overdue subscription bills associated with this tenant. 
              Your active WhatsApp Assistant agent has been paused.
            </p>
          </div>
          <div className="p-4 bg-rose-950/20 border border-rose-500/10 rounded-xl">
            <p className="text-xs text-rose-300">Contact SaaS Administrator for assistance:</p>
            <p className="text-xs font-bold text-white mt-1">neoedits2008@gmail.com</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full bg-[#1f2937] hover:bg-[#374151] border border-[#374151] text-red-400 font-semibold text-xs py-2.5 rounded-xl cursor-pointer transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050505] text-[#e0e0e0] overflow-hidden" id="dashboard-app-frame">
      
      {/* Left Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        businessName={businessName}
        isSuperAdmin={isSuperAdmin}
        onSignOut={handleSignOut}
        isOpen={mobileSidebarOpen}
        setIsOpen={setMobileSidebarOpen}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Row */}
        <header className="h-16 border-b border-white/5 bg-[#0a0a0a] px-4 sm:px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Hamburger menu for phones/tablets */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5 text-emerald-400" />
            </button>

            <span className="hidden sm:inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {activeTab} Workspace
            </span>

            {isSuperAdmin && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-md shadow-amber-500/5 animate-pulse shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Tester & Owner Mode</span>
              </span>
            )}

            {isOffline && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider animate-pulse shrink-0">
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="sm:hidden">Offline (Paused)</span>
                <span className="hidden sm:inline">Offline - Live updates paused</span>
              </span>
            )}

            {/* Global Search trigger input field */}
            <div className="hidden md:block w-72 lg:w-96">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-xl transition text-xs font-semibold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span>Search orders, customers, menu...</span>
                </div>
                <kbd className="px-1.5 py-0.5 bg-white/10 text-[10px] rounded border border-white/10 text-gray-400 font-mono">⌘K</kbd>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Mobile search button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
              title="Global Search"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Real-time elegant Clock widget */}
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{currentTime.toLocaleTimeString('en-US', { hour12: true })}</span>
              <span className="text-gray-600">|</span>
              <span>UTC-7</span>
            </div>

            {/* Simulated Alerts notification Bell */}
            <div className="relative">
              <button 
                onClick={() => handleNewNotification('New simulated payment of ₹1,999 received successfully! 💳', 'payment')}
                className="p-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white rounded-xl transition cursor-pointer relative"
                title="Trigger simulated notification trigger"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>
            </div>

            {/* Profile Avatar summary */}
            <div className="flex items-center gap-3 border-l border-white/5 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white">{user.email}</p>
                <p className="text-[9px] text-gray-500 uppercase font-semibold">Business Tenant</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-black text-xs">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic content viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats row */}
                <DashboardStats 
                  totalConversations={conversations.length}
                  totalOrders={orders.length}
                  totalRevenue={totalRevenue}
                  totalCustomers={customersCount}
                  aiUsageCount={aiRepliesCount}
                />

                {/* Charts panel */}
                <AnalyticsCharts orders={orders} />
              </div>
            )}

            {activeTab === 'profile' && (
              <ProfileSettings businessId={businessId} onProfileUpdate={handleProfileNameUpdate} />
            )}

            {activeTab === 'menu' && (
              <MenuManagement 
                businessId={businessId} 
                initialSearchQuery={menuSearchQuery}
                onClearInitialSearchQuery={() => setMenuSearchQuery('')}
              />
            )}

            {activeTab === 'ai-settings' && (
              <AISettingsEditor businessId={businessId} />
            )}

            {activeTab === 'whatsapp' && (
              <WhatsAppIntegration 
                businessId={businessId} 
                businessName={businessName}
                onNewMessageSimulated={handleSimulateWebhookNotification}
              />
            )}

            {activeTab === 'orders' && (
              <OrderManagement 
                businessId={businessId} 
                selectedOrderId={selectedOrderId}
                onClearSelectedOrderId={() => setSelectedOrderId(null)}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersDirectory 
                businessId={businessId} 
                initialSearchQuery={customerSearchQuery}
                onClearInitialSearchQuery={() => setCustomerSearchQuery('')}
              />
            )}

            {activeTab === 'billing' && (
              <SubscriptionBilling businessId={businessId} businessName={businessName} />
            )}

            {activeTab === 'admin' && isSuperAdmin && (
              <AdminPanel businessId={businessId} />
            )}

          </motion.div>
        </main>
      </div>

      {/* Floating dynamic notification toasts container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none max-w-sm w-full">
        {notifications.map((n) => (
          <div 
            key={n.id}
            className="p-4 bg-[#0a0a0a] border border-white/5 text-white rounded-xl shadow-2xl flex items-start gap-3 pointer-events-auto animate-slide-up"
          >
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${
              n.type === 'order' 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : n.type === 'payment'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <Check className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs font-semibold leading-normal">
              {n.text}
            </div>
          </div>
        ))}
      </div>

      {/* Immersive Global Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="global-search-modal-container">
            {/* Backdrop with a smooth blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            />

            {/* Modal Dialog Container */}
            <div className="flex min-h-screen items-start justify-center p-4 pt-[10vh] sm:p-6 sm:pt-[15vh]">
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh] z-10"
              >
                {/* Search Bar Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#0d0d0d]">
                  <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="Search order IDs, customer names, menu items..."
                    className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm font-medium border-0 ring-0 focus:ring-0 p-0"
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline-block text-[10px] text-gray-500 font-semibold px-1.5 py-0.5 bg-white/5 border border-white/10 rounded font-mono">ESC</span>
                    <button
                      onClick={() => setIsSearchOpen(false)}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Results Section */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar min-h-[250px]">
                  {globalSearchQuery.trim() === '' ? (
                    /* Initial Helper State */
                    <div className="space-y-4 py-4 text-center sm:text-left">
                      <div className="px-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Leo Search Assistant</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Type a search query to search across your workspace records in real-time. We search orders, registered customer directories, and active menu items.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 bg-white/2 border border-white/5 rounded-xl space-y-1 hover:border-emerald-500/20 transition group">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-white mt-2 group-hover:text-emerald-400 transition">Orders Database</p>
                          <p className="text-[10px] text-gray-500 leading-normal">Search by unique customer name, phone, or meal items</p>
                        </div>

                        <div className="p-3.5 bg-white/2 border border-white/5 rounded-xl space-y-1 hover:border-emerald-500/20 transition group">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                            <Users className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-white mt-2 group-hover:text-emerald-400 transition">Customers Directory</p>
                          <p className="text-[10px] text-gray-500 leading-normal">Search contacts, telephone numbers, and notes</p>
                        </div>

                        <div className="p-3.5 bg-white/2 border border-white/5 rounded-xl space-y-1 hover:border-emerald-500/20 transition group">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                            <MenuSquare className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-white mt-2 group-hover:text-emerald-400 transition">Menu & Products</p>
                          <p className="text-[10px] text-gray-500 leading-normal">Search active menu titles or descriptions</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Search results lists */
                    <div className="space-y-5">
                      {/* 1. Orders Results */}
                      {filteredOrders.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 px-2">
                            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Matching Orders ({filteredOrders.length})</h4>
                          </div>
                          <div className="space-y-1">
                            {filteredOrders.map((order: any) => (
                              <button
                                key={order.id}
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setActiveTab('orders');
                                  setIsSearchOpen(false);
                                  setGlobalSearchQuery('');
                                }}
                                className="w-full flex items-center justify-between p-3 bg-white/2 hover:bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-xl transition text-left cursor-pointer group"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition">{order.customerName}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 bg-white/5 text-gray-400 rounded-md font-mono border border-white/10 uppercase">{order.id?.slice(0, 6)}</span>
                                  </div>
                                  <div className="text-[10px] text-gray-500 truncate max-w-sm sm:max-w-md">
                                    {(order.items || []).map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                                  </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                  <span className="text-xs font-bold text-emerald-400">₹{order.total || 0}</span>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                    order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                                    order.status === 'preparing' ? 'bg-indigo-500/10 text-indigo-400' :
                                    order.status === 'new' ? 'bg-blue-500/10 text-blue-400' :
                                    'bg-gray-500/10 text-gray-400'
                                  }`}>{order.status}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Customers Results */}
                      {filteredCustomersList.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 px-2">
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Matching Customers ({filteredCustomersList.length})</h4>
                          </div>
                          <div className="space-y-1">
                            {filteredCustomersList.map((cust: any) => (
                              <button
                                key={cust.id}
                                onClick={() => {
                                  setCustomerSearchQuery(cust.name);
                                  setActiveTab('customers');
                                  setIsSearchOpen(false);
                                  setGlobalSearchQuery('');
                                }}
                                className="w-full flex items-center justify-between p-3 bg-white/2 hover:bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-xl transition text-left cursor-pointer group"
                              >
                                <div className="space-y-0.5">
                                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition">{cust.name}</p>
                                  <p className="text-[10px] text-gray-500 font-mono">{cust.phone}</p>
                                </div>
                                <div className="text-right space-y-0.5">
                                  <p className="text-xs font-bold text-emerald-400">{cust.orderCount || 0} Orders</p>
                                  <p className="text-[9px] text-gray-500">₹{(cust.totalSpent || 0).toLocaleString('en-IN')} Spent</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Products Results */}
                      {filteredProductsList.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 px-2">
                            <MenuSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Matching Menu Items ({filteredProductsList.length})</h4>
                          </div>
                          <div className="space-y-1">
                            {filteredProductsList.map((prod: any) => (
                              <button
                                key={prod.id}
                                onClick={() => {
                                  setMenuSearchQuery(prod.name);
                                  setActiveTab('menu');
                                  setIsSearchOpen(false);
                                  setGlobalSearchQuery('');
                                }}
                                className="w-full flex items-center justify-between p-3 bg-white/2 hover:bg-white/5 border border-white/5 hover:border-emerald-500/20 rounded-xl transition text-left cursor-pointer group"
                              >
                                <div className="space-y-0.5 min-w-0 flex-1 pr-4">
                                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition truncate">{prod.name}</p>
                                  <p className="text-[10px] text-gray-500 truncate">{prod.description || 'No description available'}</p>
                                </div>
                                <div className="text-right flex items-center gap-2.5 flex-shrink-0">
                                  <span className="text-xs font-bold text-emerald-400">₹{prod.price}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                                    prod.isAvailable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                  }`}>{prod.isAvailable ? 'Active' : 'Inactive'}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No results empty state */}
                      {totalResultsCount === 0 && (
                        <div className="text-center py-10 space-y-2">
                          <p className="text-sm font-semibold text-gray-400">No results found for "{globalSearchQuery}"</p>
                          <p className="text-xs text-gray-500">Check for spelling mistakes, order IDs, or telephone digits and try again.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer instructions */}
                <div className="px-4 py-2 bg-[#0d0d0d] border-t border-white/5 text-gray-500 text-[10px] flex justify-between items-center shrink-0">
                  <span>Press <kbd className="px-1 py-0.2 bg-white/5 border border-white/10 rounded font-mono text-gray-400">ESC</kbd> to close</span>
                  <span>Select result to navigate tab workspace</span>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
