
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/AuthPage';
import UnifiedGenerator from '@/components/UnifiedGenerator';
import SavedNotes from '@/components/SavedNotes';
import MCQViewer from '@/components/MCQViewer';
import SavedPresentations from '@/components/SavedPresentations';
import FlashcardPractice from '@/components/FlashcardPractice';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import AppSidebar from '@/components/AppSidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

const Index = () => {
  const { user, loading } = useAuth();
  const [refreshMCQs, setRefreshMCQs] = useState(0);
  const [activeTab, setActiveTab] = useState<'generator' | 'saved-notes' | 'mcq-practice' | 'presentations' | 'practice'>('generator');
  const [contentLoading, setContentLoading] = useState(false);

  // Keyboard navigation
  useKeyboardNavigation({
    onArrowLeft: () => {
      const tabs = ['generator', 'saved-notes', 'mcq-practice', 'presentations', 'practice'] as const;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    },
    onArrowRight: () => {
      const tabs = ['generator', 'saved-notes', 'mcq-practice', 'presentations', 'practice'] as const;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    },
    enabled: true
  });

  const handleContentGenerated = () => {
    setRefreshMCQs(prev => prev + 1);
  };

  const handleTabChange = (newTab: typeof activeTab) => {
    setContentLoading(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setContentLoading(false);
    }, 150);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Loading Neutron AI</h2>
              <p className="text-sm text-muted-foreground">Preparing your workspace...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderContent = () => {
    if (contentLoading) {
      switch (activeTab) {
        case 'generator':
          return <LoadingSkeleton variant="card" />;
        case 'saved-notes':
          return <LoadingSkeleton variant="list" count={3} />;
        case 'mcq-practice':
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoadingSkeleton variant="mcq" />
              <LoadingSkeleton variant="mcq" />
            </div>
          );
        case 'presentations':
        case 'practice':
          return <LoadingSkeleton variant="card" />;
        default:
          return <LoadingSkeleton variant="card" />;
      }
    }

    switch (activeTab) {
      case 'generator':
        return <UnifiedGenerator onContentGenerated={handleContentGenerated} />;
      case 'saved-notes':
        return <SavedNotes />;
      case 'mcq-practice':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-[10px] mx-[2px]">
            <div>
              <MCQViewer key={refreshMCQs} />
            </div>
          </div>
        );
      case 'presentations':
        return <SavedPresentations />;
      case 'practice':
        return <FlashcardPractice />;
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'generator':
        return 'AI Generator';
      case 'saved-notes':
        return 'Notes Library';
      case 'mcq-practice':
        return 'MCQ Practice';
      case 'presentations':
        return 'Presentations';
      case 'practice':
        return 'Study Session';
      default:
        return 'Neutron AI';
    }
  };

  return (
    <div className="flex h-screen w-full">
      <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <SidebarInset className="flex-1">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-0">
          <div className="animate-fade-in h-full">
            {renderContent()}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
};

export default Index;
