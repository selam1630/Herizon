'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { refreshSession, verifyPayment } from '@/lib/api';
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
  const { currentView, isAuthenticated, setAuthenticatedUser, setView } = useAppStore();
  const [authRequested, setAuthRequested] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [paymentNotice, setPaymentNotice] = useState('');
  const prevAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    if (prevAuthenticated.current && !isAuthenticated) {
      setAuthRequested(false)
    }
    prevAuthenticated.current = isAuthenticated
  }, [isAuthenticated]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (!isAuthenticated) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const txRef = params.get('tx_ref');
    const paymentType = params.get('payment');

    if (!txRef || !paymentType) {
      return;
    }
    const txRefValue = txRef;

    let active = true;
    async function syncPaymentStatus() {
      try {
        const verification = await verifyPayment(txRefValue);
        const user = await refreshSession();
        if (!active) return;

        setAuthenticatedUser(user);
        if (verification.status === 'success') {
          setPaymentNotice(
            verification.kind === 'premium_subscription'
              ? 'Premium payment verified. Your premium discount is now active for expert consultations.'
              : 'Expert consultation payment verified successfully.'
          );
          setView('experts');
        } else {
          setPaymentNotice(`Payment status: ${verification.status}.`);
        }
      } catch (error) {
        if (!active) return;
        setPaymentNotice(error instanceof Error ? error.message : 'Could not verify payment status.');
      } finally {
        if (active) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }

    void syncPaymentStatus();
    return () => {
      active = false;
    };
  }, [isAuthenticated, setAuthenticatedUser, setView]);

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
      {paymentNotice && (
        <div className="mx-auto mt-3 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
            {paymentNotice}
          </div>
        </div>
      )}
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
