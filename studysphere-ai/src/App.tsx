import { useState } from 'react';
import { TabType } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { WelcomeCarousel } from './components/WelcomeCarousel';
import { HomeTab } from './components/HomeTab';
import { AITutorTab } from './components/AITutorTab';
import { NotesTab } from './components/NotesTab';
import { PlannerTab } from './components/PlannerTab';
import { ProfileTab } from './components/ProfileTab';
import { QuickActionModal } from './components/QuickActionModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [quickAction, setQuickAction] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col relative font-['Inter',sans-serif]">
      {/* Show Welcome Onboarding Carousel if toggled */}
      {showWelcome ? (
        <WelcomeCarousel
          onComplete={() => setShowWelcome(false)}
          onLogin={() => {
            setShowWelcome(false);
            setActiveTab('home');
          }}
        />
      ) : (
        <>
          {/* Main Top Header */}
          <Header
            onOpenNotifications={() => setQuickAction('notifications')}
            onOpenOnboarding={() => setShowWelcome(true)}
          />

          {/* Active View Container */}
          <main className="flex-1">
            {activeTab === 'home' && (
              <HomeTab
                onNavigateTab={(tab) => setActiveTab(tab)}
                onQuickAction={(action) => setQuickAction(action)}
              />
            )}

            {activeTab === 'ai-tutor' && <AITutorTab />}

            {activeTab === 'notes' && <NotesTab />}

            {activeTab === 'planner' && <PlannerTab />}

            {activeTab === 'profile' && <ProfileTab />}
          </main>

          {/* Bottom Navigation Bar */}
          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
          />

          {/* Quick Action Modal */}
          <QuickActionModal
            actionType={quickAction}
            onClose={() => setQuickAction(null)}
          />
        </>
      )}
    </div>
  );
}
