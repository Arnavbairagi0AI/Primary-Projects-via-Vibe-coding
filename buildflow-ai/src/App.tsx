import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/Toast';
import AuthPage from './features/auth/AuthPage';
import OnboardingWizard from './features/onboarding/OnboardingWizard';
import DashboardLayout from './features/dashboard/DashboardLayout';
import { Sparkles } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  // If Firebase Auth is checking state, display elegant loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center space-y-4 font-sans text-[#1C1B1F]">
        <div className="relative z-10 flex flex-col items-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-[#2152FF] flex items-center justify-center shadow-lg shadow-[#2152FF]/20 animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col items-center space-y-1.5 text-center">
            <span className="text-sm font-extrabold tracking-tight text-[#1C1B1F]">
              BuildFlow AI
            </span>
            <span className="text-[10px] text-[#44474E] font-bold uppercase tracking-widest">
              Connecting Tenders & Construction Teams
            </span>
          </div>
          <div className="w-24 h-1 bg-[#E1E2E6] rounded-full overflow-hidden">
            <div className="bg-[#2152FF] h-full rounded-full animate-[loading_1.5s_infinite_ease-in-out]" style={{ width: '40%' }} />
          </div>
        </div>

        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <AuthPage />;
  }

  // Authenticated but requires company details onboarding
  if (!user.onboarded) {
    return <OnboardingWizard />;
  }

  // Fully authenticated and onboarded
  return <DashboardLayout />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
