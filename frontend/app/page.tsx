'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { refreshSession, verifyPayment } from '@/lib/api';
import { Navbar } from '@/components/navbar';
import { HomePage } from '@/components/home-page';
import { DashboardPage } from '@/components/dashboard-page';
import { CommunityFeed } from '@/components/community-feed';
import { LearnPage } from '@/components/learn-page';
import { ExpertsPage } from '@/components/experts-page';
import { ConsultationPage } from '@/components/consultation-page';
import { AdminPage } from '@/components/admin-page';
import { ProfilePage } from '@/components/profile-page';
import { ChatbotWidget } from '@/components/chatbot-widget';
import { Footer } from '@/components/footer';
import { BackendSync } from '@/components/backend-sync';
import { AuthGate } from '@/components/auth-gate';
import type { Locale } from '@/lib/i18n';
import { useLocale } from '@/components/locale-provider';
import { Heart } from 'lucide-react';

function normalizeConsultationMode(mode: unknown): 'chat' | 'voice' | 'video' | null {
  const raw = String(mode || '').trim().toLowerCase();
  const value = raw.replace(/[_\s-]+/g, '');
  if (value === 'audio' || value === 'voice' || value === 'voicecall') return 'voice';
  if (value === 'chat' || value === 'text' || value === 'chatroom') return 'chat';
  if (value === 'video' || value === 'videocall') return 'video';
  return null;
}

export default function App() {
  const { locale, setLocale, t } = useLocale();
  const { currentView, isAuthenticated, setAuthenticatedUser, setView, setActiveConsultation } = useAppStore();
  const [authRequested, setAuthRequested] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [paymentNotice, setPaymentNotice] = useState('');
  const [authBootstrapping, setAuthBootstrapping] = useState(true);
  const prevAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    let active = true;
    async function bootstrapSession() {
      try {
        const user = await refreshSession();
        if (!active) return;
        setAuthenticatedUser(user);
      } catch (_error) {
        // no active session; keep unauthenticated state
      } finally {
        if (active) setAuthBootstrapping(false);
      }
    }
    void bootstrapSession();
    return () => {
      active = false;
    };
  }, [setAuthenticatedUser]);

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
    if (authBootstrapping) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const txRef = params.get('tx_ref');
    const txRefValue = txRef || window.localStorage.getItem('pendingConsultationTxRef') || '';
    if (!txRefValue) return;

    let active = true;
    async function syncPaymentStatus() {
      try {
        let verification = await verifyPayment(txRefValue);
        if (verification.status !== 'success') {
          for (let attempt = 0; attempt < 8; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            verification = await verifyPayment(txRefValue);
            if (verification.status === 'success') break;
          }
        }
        const user = await refreshSession();
        if (!active) return;

        setAuthenticatedUser(user);
        if (verification.status === 'success') {
          if (
            verification.kind === 'expert_consultation' &&
            verification.serviceType &&
            verification.serviceType !== 'premium'
          ) {
            let context: {
              txRef: string;
              expertId: string;
              expertName: string;
              mode: 'chat' | 'voice' | 'video';
            } | null = null;
            const raw = window.localStorage.getItem(`consultation:${txRefValue}`);
            if (raw) {
              window.localStorage.removeItem(`consultation:${txRefValue}`);
              const pendingTxRef = window.localStorage.getItem('pendingConsultationTxRef');
              if (pendingTxRef === txRefValue) {
                window.localStorage.removeItem('pendingConsultationTxRef');
              }
              try {
                const parsed = JSON.parse(raw) as {
                  txRef?: string;
                  expertId?: string;
                  expertName?: string;
                  mode?: string;
                };
                const normalizedMode = normalizeConsultationMode(parsed.mode);
                if (parsed.txRef && parsed.expertId && parsed.expertName && normalizedMode) {
                  context = {
                    txRef: parsed.txRef,
                    expertId: parsed.expertId,
                    expertName: parsed.expertName,
                    mode: normalizedMode,
                  };
                } else {
                  context = null;
                }
              } catch (_error) {
                context = null;
              }
            }

            const normalizedMode = normalizeConsultationMode(verification.serviceType);
            if (!context && normalizedMode) {
              context = {
                txRef: txRefValue,
                expertId: verification.expertUserId || 'expert',
                expertName: verification.expertName || 'Verified Expert',
                mode: normalizedMode,
              };
            }

            if (context) {
              setActiveConsultation({
                ...context,
                startedAt: new Date(),
              });
              setPaymentNotice(
                context.mode === 'video'
                  ? 'Consultation payment verified. Set your video appointment time now.'
                  : 'Consultation payment verified. Redirected to your session room.'
              );
              setView('consultation');
            } else {
              setPaymentNotice('Expert consultation payment verified successfully.');
              setView('experts');
            }
          } else {
            setPaymentNotice(
              verification.kind === 'premium_subscription'
                ? 'Premium payment verified. Your premium discount is now active for expert consultations.'
                : 'Expert consultation payment verified successfully.'
            );
            setView('experts');
          }
        } else {
          setPaymentNotice(`Payment status: ${verification.status}.`);
        }
      } catch (error) {
        if (!active) return;
        setPaymentNotice(error instanceof Error ? error.message : 'Could not verify payment status.');
      } finally {
        if (active && txRef) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }

    void syncPaymentStatus();
    return () => {
      active = false;
    };
  }, [authBootstrapping, isAuthenticated, setActiveConsultation, setAuthenticatedUser, setView]);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthRequested(true);
  };

  if (authBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{t('authHeader.restoring')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authRequested) {
      return <AuthGate initialMode={authMode} />;
    }

    return (
      <div className="min-h-screen bg-background">
        <header
          className="sticky top-0 z-50 w-full border-b backdrop-blur-xl"
          style={{
            borderColor: '#ecddd9',
            background: 'linear-gradient(180deg, rgba(253, 246, 244, 0.98) 0%, rgba(253, 246, 244, 0.94) 100%)',
          }}
        >
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl shadow-sm"
                style={{ background: 'linear-gradient(135deg, #D4B9B2, #CB978E)' }}
              >
                <Heart className="h-4 w-4 text-white" fill="currentColor" />
              </div>
              <span className="text-base font-bold tracking-tight" style={{ color: '#3d2b27' }}>
                Heri<span style={{ color: '#CB978E' }}>zone</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1 rounded-full border border-[#ecddd9] bg-white p-1 sm:flex">
                {(['en', 'am'] as Locale[]).map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => setLocale(lng)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                      locale === lng ? 'bg-[#cb978e] text-white' : 'text-[#7a6360]'
                    }`}
                  >
                    {lng === 'en' ? 'EN' : 'አማ'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => openAuth('signin')}
                className="hidden sm:inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-white"
                style={{ color: '#CB978E', border: '1px solid #D4B9B2' }}
              >
                {t('authHeader.signIn')}
              </button>
              <button
                type="button"
                onClick={() => openAuth('signup')}
                className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105"
                style={{ background: '#CB978E' }}
              >
                {t('authHeader.joinFree')}
              </button>
            </div>
          </div>
        </header>
        <HomePage onGetStarted={() => openAuth('signup')} />
        <Footer />
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
        {currentView === 'consultation' && <ConsultationPage />}
        {currentView === 'admin' && <AdminPage />}
        {currentView === 'profile' && <ProfilePage />}
      </div>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}
