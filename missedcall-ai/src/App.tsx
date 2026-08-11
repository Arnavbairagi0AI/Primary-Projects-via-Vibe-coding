import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Metrics } from './components/Metrics';
import { MissedCallTable } from './components/MissedCallTable';
import { ChatDrawer } from './components/ChatDrawer';
import { SchedulerConfig } from './components/SchedulerConfig';
import { PublicBooking } from './components/PublicBooking';
import { BillingPortal } from './components/BillingPortal';
import { Auth } from './components/Auth';
import { MissedCall } from './types';
import { Sparkles, MessageSquareCode } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { user, loading } = useApp();
  const [activeTab, setActiveTab] = useState<string>('logs');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [selectedCall, setSelectedCall] = useState<MissedCall | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center" id="app-loading-screen">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin"></div>
          <MessageSquareCode className="w-6 h-6 text-amber-500 absolute animate-pulse" />
        </div>
        <h2 className="text-sm font-mono text-slate-300 tracking-wider">SECURELY BOOTING MISSEDCALL AI...</h2>
        <p className="text-xs text-slate-500 mt-2">Connecting to live cloud datastores</p>
      </div>
    );
  }

  // If the user wants to simulate/preview the booking portal as a public view, hide the main sidebar & header 
  if (activeTab === 'booking-preview') {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicBooking onBackToDashboard={() => setActiveTab('scheduler')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50" id="main-dashboard-viewport">
      {/* 1. Responsive Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />

      {/* 2. Central Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <Header />

        {/* Central Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Page 1 [Missed Call Logs Hub] */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-fadeIn" id="logs-hub-page">
              <Metrics />
              <MissedCallTable onSelectCall={(call) => setSelectedCall(call)} />
            </div>
          )}

          {/* Page 2 [Smart Scheduling Engine] */}
          {activeTab === 'scheduler' && (
            <div className="animate-fadeIn" id="scheduler-engine-page">
              <SchedulerConfig onPreviewBookingPortal={() => setActiveTab('booking-preview')} />
            </div>
          )}

          {/* Page 3 [Billing & Zero-Cost Payment Portal] */}
          {activeTab === 'billing' && (
            <div className="animate-fadeIn" id="billing-payment-page">
              <BillingPortal />
            </div>
          )}

        </main>
      </div>

      {/* 3. Live Chat Simulation Drawer Overlay */}
      <ChatDrawer 
        call={selectedCall} 
        onClose={() => setSelectedCall(null)} 
      />
    </div>
  );
};

const AppWrapper: React.FC = () => {
  const { loading, showAuthModal, setShowAuthModal } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center" id="app-loading-screen-root">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin"></div>
          <MessageSquareCode className="w-6 h-6 text-amber-500 absolute animate-pulse" />
        </div>
        <h2 className="text-sm font-mono text-slate-300 tracking-wider font-sans">LOADING MISSEDCALL AI...</h2>
        <p className="text-xs text-slate-500 mt-2 font-sans font-semibold">Initializing unrestricted full lifetime access</p>
      </div>
    );
  }

  return (
    <>
      <DashboardContent />
      
      {/* Optional Auth Modal if user clicks Sign In */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-10 right-0 text-slate-400 hover:text-white font-mono text-xs bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg"
            >
              ✕ Close Modal & Continue as Guest
            </button>
            <Auth />
          </div>
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppWrapper />
    </AppProvider>
  );
}
