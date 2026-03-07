'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Navbar } from '@/components/navbar';
import { HomePage } from '@/components/home-page';
import { DashboardPage } from '@/components/dashboard-page';
import { CommunityFeed } from '@/components/community-feed';
import { LearnPage } from '@/components/learn-page';
import { ExpertsPage } from '@/components/experts-page';
import { ProfilePage } from '@/components/profile-page';
import { ChatbotWidget } from '@/components/chatbot-widget';
import { Footer } from '@/components/footer';
import { BackendSync } from '@/components/backend-sync';
import { AuthGate } from '@/components/auth-gate';

export default function App() {
  const { currentView, isAuthenticated } = useAppStore();
  const [authRequested, setAuthRequested] = useState(false);
  const prevAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    if (prevAuthenticated.current && !isAuthenticated) {
      setAuthRequested(false)
    }
    prevAuthenticated.current = isAuthenticated
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    if (authRequested) {
      return <AuthGate />;
    }

    return <HomePage onGetStarted={() => setAuthRequested(true)} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BackendSync />
      <Navbar />
      <div className="flex-1">
        {currentView === 'home' && <DashboardPage />}
        {currentView === 'feed' && <CommunityFeed />}
        {currentView === 'learn' && <LearnPage />}
        {currentView === 'experts' && <ExpertsPage />}
        {currentView === 'profile' && <ProfilePage />}
      </div>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
