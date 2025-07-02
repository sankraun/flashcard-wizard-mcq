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
  const {
    user,
    loading,
    signOut
  } = useAuth();
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
  const navigationItems = [{
    id: 'practice',
    label: 'Practice',
    icon: Target,
    action: () => navigate('/mcq-practice'),
    description: 'Take practice quizzes to test your knowledge',
    color: 'text-green-600'
  }, {
    id: 'mcqs',
    label: 'MCQ Generator',
    icon: Brain,
    action: () => handleTabChange('mcqs'),
    description: 'Generate custom multiple choice questions',
    color: 'text-blue-600'
  }, {
    id: 'notes-generator',
    label: 'Smart Notes',
    icon: FileText,
    action: () => handleTabChange('notes-generator'),
    description: 'Create comprehensive study notes',
    color: 'text-purple-600'
  }, {
    id: 'saved-notes',
    label: 'Notes Library',
    icon: BookOpen,
    action: () => handleTabChange('saved-notes'),
    description: 'Access your previously saved notes',
    color: 'text-indigo-600'
  }, {
    id: 'powerpoint',
    label: 'PowerPoint',
    icon: Sparkles,
    action: () => handleTabChange('powerpoint'),
    description: 'Generate professional PowerPoint slides',
    color: 'text-gradient-to-r from-indigo-600 to-purple-600'
  }, {
    id: 'presentations',
    label: 'Presentations',
    icon: History,
    action: () => handleTabChange('presentations'),
    description: 'View and download your saved presentations',
    color: 'text-slate-600'
  }, {
    id: 'flashcards',
    label: 'Flashcards',
    icon: Zap,
    action: () => handleTabChange('flashcards'),
    description: 'Generate smart flashcards for spaced repetition',
    color: 'text-yellow-600'
  }, {
    id: 'practice-flashcards',
    label: 'Study Session',
    icon: Timer,
    action: () => handleTabChange('practice'),
    description: 'Practice with spaced repetition flashcards',
    color: 'text-red-600'
  }];
  const handleNavItemClick = (item: typeof navigationItems[0]) => {
    item.action();
    setMobileMenuOpen(false);
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Loading Neutron AI</h2>
          <p className="text-slate-500">Preparing your intelligent workspace...</p>
        </div>
      </div>;
  }
  if (!user) {
    return <AuthPage />;
  }
  const renderContent = () => {
    if (contentLoading) {
      switch (activeTab) {
        case 'mcqs':
          return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoadingSkeleton variant="mcq" />
              <LoadingSkeleton variant="mcq" />
            </div>;
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
        return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <MCQGenerator onMCQsGenerated={handleMCQsGenerated} />
            </div>
            <div>
              <MCQViewer key={refreshMCQs} />
            </div>
          </div>;
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
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50 shadow-lg my-[4px] mx-[27px] px-0 py-[3px]">
        <div className="max-w-7xl px-4 sm:px-6 lg:px-[44px] mx-[18px] my-[22px] py-0">
          <div className="flex items-center justify-between h-16">
            {/* Professional Logo & Brand */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Neutron AI
                </span>
                
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <nav className="flex items-center space-x-1">
                {navigationItems.map(item => <button key={item.id} onClick={item.action} className={`
                       flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:shadow-md
                       ${item.id === 'practice' && false || item.id !== 'practice' && activeTab === item.id ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-2 border-primary/20 shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-accent border-2 border-transparent hover:border-border'}
                    `}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span>{item.label}</span>
                  </button>)}
              </nav>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* User info - Desktop only */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">
                    Welcome back, {getNickname()}
                  </p>
                  
                </div>
              </div>
              
              {/* Avatar */}
              <div>
                <AvatarDropdown onSignOut={signOut} user={user} />
              </div>
              
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all duration-200">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open menu</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 bg-gradient-to-br from-white to-slate-50">
                    <div className="flex flex-col gap-6 mt-8">
                      {/* Mobile user info */}
                      <div className="text-center pb-6 border-b border-slate-200">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Brain className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">
                          {getNickname()}
                        </h2>
                        <p className="text-sm text-slate-500">Neutron AI Learning</p>
                      </div>
                      
                      {/* Mobile navigation */}
                      <nav className="flex flex-col gap-2">
                        {navigationItems.map(item => <button key={item.id} onClick={() => handleNavItemClick(item)} className={`
                             flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all duration-300 w-full hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md
                               ${item.id === 'practice' && false || item.id !== 'practice' && activeTab === item.id ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-2 border-primary/20 shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-accent border-2 border-transparent hover:border-border'}
                            `}>
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                              <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div>
                              <span className="font-semibold">{item.label}</span>
                              <p className="text-xs opacity-75 mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </button>)}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-[29px] py-0">
        <div className="animate-fade-in space-y-8">
          {/* Welcome Section */}
          <div className="text-center mb-8 animate-scale-in">
            
            
          </div>
          
          {/* Content */}
          <div className="animate-slide-up">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>;
};
export default Index;