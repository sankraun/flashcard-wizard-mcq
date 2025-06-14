
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <FadeIn>
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your workspace...</p>
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
    <div className="min-h-screen bg-white">
      {/* Professional Header */}
      <FadeIn>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo & Brand */}
              <HoverCard>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-slate-900 rounded-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-semibold text-slate-900 tracking-tight">
                    NeutronAI
                  </span>
                </div>
              </HoverCard>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
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
                            ? 'default' 
                            : 'ghost'
                        }
                        size="sm"
                        className="h-9 px-3 text-sm font-medium"
                        animationType="scale"
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                      </AnimatedButton>
                    </SlideIn>
                  </EnhancedTooltip>
                ))}
              </div>

              {/* Right Side */}
              <div className="flex items-center space-x-4">
                {/* User Info - Desktop */}
                <div className="hidden lg:flex items-center space-x-3">
                  <SlideIn direction="right" delay={100}>
                    <EnhancedTooltip
                      content={`Streak: ${streak} days | Today: ${todayProgress}/${dailyGoal} questions`}
                      variant="info"
                      title="Your Progress"
                    >
                      <span className="text-sm text-slate-600 font-medium">
                        Welcome, {getNickname()}
                      </span>
                    </EnhancedTooltip>
                  </SlideIn>
                  <SlideIn direction="right" delay={150}>
                    <AvatarDropdown onSignOut={signOut} user={user} />
                  </SlideIn>
                </div>

                {/* Mobile Menu */}
                <div className="lg:hidden flex items-center space-x-3">
                  <AvatarDropdown onSignOut={signOut} user={user} />
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <AnimatedButton variant="ghost" size="sm" className="h-9 w-9 p-0" animationType="scale">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open menu</span>
                      </AnimatedButton>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-72">
                      <div className="flex flex-col space-y-6 mt-8">
                        <FadeIn delay={100}>
                          <div className="text-center pb-6 border-b border-gray-200">
                            <span className="text-sm text-slate-600 font-medium">
                              Welcome, {getNickname()}
                            </span>
                          </div>
                        </FadeIn>
                        <div className="flex flex-col space-y-2">
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
                                      ? 'default' 
                                      : 'ghost'
                                  }
                                  className="w-full justify-start h-11 px-4"
                                  animationType="slide"
                                >
                                  <item.icon className="w-5 h-5 mr-3" />
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
              </div>
            </div>
          </div>
        </header>
      </FadeIn>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
