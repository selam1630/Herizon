'use client';

import { useAppStore } from '@/lib/store';
import { Navbar } from '@/components/navbar';
import { HomePage } from '@/components/home-page';
import { CommunityFeed } from '@/components/community-feed';
import { LearnPage } from '@/components/learn-page';
import { ExpertsPage } from '@/components/experts-page';
import { ProfilePage } from '@/components/profile-page';
import { ChatbotWidget } from '@/components/chatbot-widget';
import { Footer } from '@/components/footer';

export default function App() {
  const { currentView } = useAppStore();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-1">
        {currentView === 'home' && <HomePage />}
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
