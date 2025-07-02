
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/AuthPage';
import NotesGenerator from '@/components/NotesGenerator';
import SavedNotes from '@/components/SavedNotes';
import MCQGenerator from '@/components/MCQGenerator';
import MCQViewer from '@/components/MCQViewer';
import PowerpointGenerator from '@/components/PowerpointGenerator';
import FlashcardGenerator from '@/components/FlashcardGenerator';
import FlashcardPractice from '@/components/FlashcardPractice';
import SavedPresentations from '@/components/SavedPresentations';
import { Brain, FileText, BookOpen, Target, Menu, Sparkles, Zap, History, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AvatarDropdown from '../components/AvatarDropdown';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [refreshMCQs, setRefreshMCQs] = useState(0);
  const [activeTab, setActiveTab] = useState<'mcqs' | 'notes-generator' | 'saved-notes' | 'powerpoint' | 'presentations' | 'flashcards' | 'practice'>('mcqs');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const navigate = useNavigate();

  // Keyboard navigation
  useKeyboardNavigation({
    onEscape: () => setMobileMenuOpen(false),
    onArrowLeft: () => {
      const tabs = ['mcqs', 'notes-generator', 'saved-notes', 'powerpoint', 'presentations', 'flashcards', 'practice'] as const;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    },
    onArrowRight: () => {
      const tabs = ['mcqs', 'notes-generator', 'saved-notes', 'powerpoint', 'presentations', 'flashcards', 'practice'] as const;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    },
    enabled: !mobileMenuOpen
  });

  const handleMCQsGenerated = () => {
    setRefreshMCQs(prev => prev + 1);
  };

  const handleTabChange = (newTab: typeof activeTab) => {
    setContentLoading(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setContentLoading(false);
    }, 150);
  };

  const getNickname = () => {
    if (!user) return '';
    if (user.user_metadata && user.user_metadata.nickname) {
      return user.user_metadata.nickname;
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const navigationItems = [
    {
      id: 'practice',
      label: 'Practice',
      icon: Target,
      action: () => navigate('/mcq-practice'),
      description: 'Test your knowledge'
    },
    {
      id: 'mcqs',
      label: 'MCQ Generator',
      icon: Brain,
      action: () => handleTabChange('mcqs'),
      description: 'Generate questions'
    },
    {
      id: 'notes-generator',
      label: 'Smart Notes',
      icon: FileText,
      action: () => handleTabChange('notes-generator'),
      description: 'Create study notes'
    },
    {
      id: 'saved-notes',
      label: 'Notes Library',
      icon: BookOpen,
      action: () => handleTabChange('saved-notes'),
      description: 'View saved notes'
    },
    {
      id: 'powerpoint',
      label: 'PowerPoint',
      icon: Sparkles,
      action: () => handleTabChange('powerpoint'),
      description: 'Create slides'
    },
    {
      id: 'presentations',
      label: 'Presentations',
      icon: History,
      action: () => handleTabChange('presentations'),
      description: 'View presentations'
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: Zap,
      action: () => handleTabChange('flashcards'),
      description: 'Generate flashcards'
    },
    {
      id: 'practice-flashcards',
      label: 'Study Session',
      icon: Timer,
      action: () => handleTabChange('practice'),
      description: 'Practice flashcards'
    }
  ];

  const handleNavItemClick = (item: typeof navigationItems[0]) => {
    item.action();
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Loading Neutron AI</h2>
            <p className="text-sm text-muted-foreground">Preparing your workspace...</p>
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
        case 'mcqs':
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoadingSkeleton variant="mcq" />
              <LoadingSkeleton variant="mcq" />
            </div>
          );
        case 'notes-generator':
          return <LoadingSkeleton variant="notes" />;
        case 'saved-notes':
          return <LoadingSkeleton variant="list" count={3} />;
        case 'powerpoint':
        case 'presentations':
        case 'flashcards':
        case 'practice':
          return <LoadingSkeleton variant="card" />;
        default:
          return <LoadingSkeleton variant="card" />;
      }
    }

    switch (activeTab) {
      case 'mcqs':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <MCQGenerator onMCQsGenerated={handleMCQsGenerated} />
            </div>
            <div>
              <MCQViewer key={refreshMCQs} />
            </div>
          </div>
        );
      case 'notes-generator':
        return <NotesGenerator />;
      case 'saved-notes':
        return <SavedNotes />;
      case 'powerpoint':
        return <PowerpointGenerator />;
      case 'presentations':
        return <SavedPresentations />;
      case 'flashcards':
        return <FlashcardGenerator />;
      case 'practice':
        return <FlashcardPractice />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Clean, professional header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Neutron AI</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.slice(0, 6).map((item) => (
                <Button
                  key={item.id}
                  variant={
                    (item.id === 'practice' && false) || 
                    (item.id !== 'practice' && activeTab === item.id) 
                      ? "default" 
                      : "ghost"
                  }
                  size="sm"
                  onClick={item.action}
                  className="text-sm font-medium hover-lift"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </nav>

            {/* User Profile & Mobile Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  Welcome, {getNickname()}
                </span>
              </div>
              
              <AvatarDropdown onSignOut={signOut} user={user} />
              
              {/* Mobile Menu */}
              <div className="md:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <div className="mt-6 space-y-4">
                      {/* Mobile user info */}
                      <div className="pb-4 border-b">
                        <h3 className="font-medium text-foreground">{getNickname()}</h3>
                        <p className="text-sm text-muted-foreground">Neutron AI</p>
                      </div>
                      
                      {/* Mobile navigation */}
                      <nav className="space-y-1">
                        {navigationItems.map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            onClick={() => handleNavItemClick(item)}
                            className="w-full justify-start text-left"
                          >
                            <item.icon className="w-4 h-4 mr-3" />
                            <div>
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
