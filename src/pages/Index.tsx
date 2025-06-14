import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/AuthPage';
import NotesGenerator from '@/components/NotesGenerator';
import SavedNotes from '@/components/SavedNotes';
import MCQGenerator from '@/components/MCQGenerator';
import MCQViewer from '@/components/MCQViewer';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { Brain, FileText, BookOpen, Target, Menu, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AvatarDropdown from '../components/AvatarDropdown';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { EnhancedTooltip } from '@/components/ui/enhanced-tooltip';
import { AnimatedButton } from '@/components/ui/animated-button';
import { FadeIn, SlideIn, HoverCard } from '@/components/ui/micro-interactions';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [refreshMCQs, setRefreshMCQs] = useState(0);
  const [activeTab, setActiveTab] = useState<'mcqs' | 'notes-generator' | 'saved-notes' | 'analytics'>('mcqs');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const navigate = useNavigate();

  const {
    streak,
    dailyGoal,
    todayProgress,
    accuracyHistory,
    weakTopics,
    studyTime,
    badges,
    setDailyGoal
  } = useAnalytics();

  // Keyboard navigation
  useKeyboardNavigation({
    onEscape: () => setMobileMenuOpen(false),
    onArrowLeft: () => {
      const tabs = ['mcqs', 'notes-generator', 'saved-notes', 'analytics'] as const;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    },
    onArrowRight: () => {
      const tabs = ['mcqs', 'notes-generator', 'saved-notes', 'analytics'] as const;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      }
    },
    enabled: !mobileMenuOpen,
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
      label: 'Practice MCQ',
      icon: Target,
      action: () => navigate('/mcq-practice'),
      description: 'Take practice quizzes to test your knowledge',
      shortcut: 'P'
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: Zap,
      action: () => navigate('/flashcards'),
      description: 'Practice with your saved flashcards',
      shortcut: 'F'
    },
    {
      id: 'mcqs',
      label: 'MCQ Generator',
      icon: Brain,
      action: () => handleTabChange('mcqs'),
      description: 'Generate custom multiple choice questions',
      shortcut: 'G'
    },
    {
      id: 'notes-generator',
      label: 'Notes Generator',
      icon: FileText,
      action: () => handleTabChange('notes-generator'),
      description: 'Create comprehensive study notes',
      shortcut: 'N'
    },
    {
      id: 'saved-notes',
      label: 'Saved Notes',
      icon: BookOpen,
      action: () => handleTabChange('saved-notes'),
      description: 'Access your previously saved notes',
      shortcut: 'S'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: Target,
      action: () => handleTabChange('analytics'),
      description: 'View your learning progress and statistics',
      shortcut: 'A'
    }
  ];

  const handleNavItemClick = (item: typeof navigationItems[0]) => {
    item.action();
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <FadeIn>
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your workspace...</p>
          </div>
        </FadeIn>
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
        case 'analytics':
          return <LoadingSkeleton variant="analytics" />;
        default:
          return <LoadingSkeleton variant="card" />;
      }
    }

    switch (activeTab) {
      case 'mcqs':
        return (
          <FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SlideIn direction="left" delay={100}>
                <MCQGenerator onMCQsGenerated={handleMCQsGenerated} />
              </SlideIn>
              <SlideIn direction="right" delay={200}>
                <MCQViewer key={refreshMCQs} />
              </SlideIn>
            </div>
          </FadeIn>
        );
      case 'notes-generator':
        return (
          <SlideIn direction="up" delay={100}>
            <NotesGenerator />
          </SlideIn>
        );
      case 'saved-notes':
        return (
          <SlideIn direction="up" delay={100}>
            <SavedNotes />
          </SlideIn>
        );
      case 'analytics':
        return (
          <SlideIn direction="up" delay={100}>
            <AnalyticsDashboard
              userId={user.id}
              streak={streak}
              dailyGoal={dailyGoal}
              todayProgress={todayProgress}
              accuracyHistory={accuracyHistory}
              weakTopics={weakTopics}
              studyTime={studyTime}
              badges={badges}
              onSetDailyGoal={setDailyGoal}
            />
          </SlideIn>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #eff6ff 0%, #fff 50%, #ede9fe 100%)' }}>
      {/* Professional Minimalist Header */}
      <FadeIn>
        <header className="bg-white/70 backdrop-blur border-b border-blue-100 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              {/* Logo & Brand */}
              <HoverCard>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364-7.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636" />
                    </svg>
                  </div>
                  <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight select-none">
                    NeutronAI
                  </span>
                </div>
              </HoverCard>

              {/* Desktop Navigation - Hidden on mobile */}
              <div className="hidden lg:flex flex-1 justify-center min-w-0">
                <div className="flex flex-row flex-nowrap items-center justify-center gap-x-4 w-full max-w-5xl">
                  {navigationItems.map((item, index) => (
                    <EnhancedTooltip
                      key={item.id}
                      content={
                        <div>
                          <div className="font-medium">{item.description}</div>
                          <div className="text-xs opacity-75 mt-1">
                            Shortcut: {item.shortcut}
                          </div>
                        </div>
                      }
                      variant="rich"
                      title={item.label}
                    >
                      <SlideIn delay={index * 50}>
                        <AnimatedButton
                          onClick={item.action}
                          variant={
                            (item.id === 'practice' && false) || 
                            (item.id !== 'practice' && activeTab === item.id) 
                              ? 'secondary' 
                              : 'ghost'
                          }
                          className="flex items-center gap-2 whitespace-nowrap px-4"
                          animationType="scale"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </AnimatedButton>
                      </SlideIn>
                    </EnhancedTooltip>
                  ))}
                </div>
              </div>

              {/* Mobile Menu Button - Visible on mobile only */}
              <div className="lg:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <AnimatedButton variant="ghost" size="icon" className="h-10 w-10" animationType="scale">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open menu</span>
                    </AnimatedButton>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <div className="flex flex-col gap-4 mt-8">
                      <FadeIn delay={100}>
                        <div className="text-center pb-4 border-b">
                          <span className="text-sm text-blue-900/80 font-medium">
                            Welcome, {getNickname()}
                          </span>
                        </div>
                      </FadeIn>
                      <div className="flex flex-col gap-2">
                        {navigationItems.map((item, index) => (
                          <SlideIn key={item.id} direction="right" delay={index * 50}>
                            <EnhancedTooltip
                              content={item.description}
                              side="left"
                              variant="info"
                            >
                              <AnimatedButton
                                onClick={() => handleNavItemClick(item)}
                                variant={
                                  (item.id === 'practice' && false) || 
                                  (item.id !== 'practice' && activeTab === item.id) 
                                    ? 'secondary' 
                                    : 'ghost'
                                }
                                className="flex items-center gap-3 w-full justify-start px-4 py-3 h-auto"
                                animationType="slide"
                              >
                                <item.icon className="w-5 h-5" />
                                <span className="text-base">{item.label}</span>
                              </AnimatedButton>
                            </EnhancedTooltip>
                          </SlideIn>
                        ))}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Right side: Welcome and Avatar - Desktop only */}
              <div className="hidden lg:flex items-center gap-2">
                <SlideIn direction="right" delay={100}>
                  <EnhancedTooltip
                    content={`Streak: ${streak} days | Today: ${todayProgress}/${dailyGoal} questions`}
                    variant="info"
                    title="Your Progress"
                  >
                    <span className="text-sm text-blue-900/80 font-medium px-2 whitespace-nowrap text-center">
                      Welcome, {getNickname()}
                    </span>
                  </EnhancedTooltip>
                </SlideIn>
                <SlideIn direction="right" delay={150}>
                  <AvatarDropdown onSignOut={signOut} user={user} />
                </SlideIn>
              </div>

              {/* Avatar only - Mobile */}
              <div className="lg:hidden">
                <AvatarDropdown onSignOut={signOut} user={user} />
              </div>
            </div>
          </div>
        </header>
      </FadeIn>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
