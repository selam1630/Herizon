'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { HomePage } from '@/components/home-page';
import { DashboardPage } from '@/components/dashboard-page';
import { CommunityFeed } from '@/components/community-feed';
import { LearnPage } from '@/components/learn-page';
import { ExpertsPage } from '@/components/experts-page';
import { AdminPage } from '@/components/admin-page';
import { ProfilePage } from '@/components/profile-page';
import { ChatbotWidget } from '@/components/chatbot-widget';
import { Footer } from '@/components/footer';
import { BackendSync } from '@/components/backend-sync';
import { AuthGate } from '@/components/auth-gate';
import { Heart } from 'lucide-react';

export default function App() {
  const { currentView, isAuthenticated } = useAppStore();
  const [authRequested, setAuthRequested] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const prevAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    if (prevAuthenticated.current && !isAuthenticated) {
      setAuthRequested(false)
    }
    prevAuthenticated.current = isAuthenticated
  }, [isAuthenticated]);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthRequested(true);
  };

  if (!isAuthenticated) {
    if (authRequested) {
      return <AuthGate initialMode={authMode} />;
    }

    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Heart className="h-4 w-4 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="text-base font-semibold tracking-tight text-foreground">Herizon</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => openAuth('signin')}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => openAuth('signup')}>
                Sign up
              </Button>
            </div>
          </div>
        </header>
        <HomePage onGetStarted={() => openAuth('signup')} />
      </div>
    );
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
        {currentView === 'admin' && <AdminPage />}
        {currentView === 'profile' && <ProfilePage />}
      </div>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
