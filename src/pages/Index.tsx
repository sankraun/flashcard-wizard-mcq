import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/AuthPage';
import NotesGenerator from '@/components/NotesGenerator';
import SavedNotes from '@/components/SavedNotes';
import MCQGenerator from '@/components/MCQGenerator';
import MCQViewer from '@/components/MCQViewer';
import { Brain, FileText, BookOpen, Target, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AvatarDropdown from '../components/AvatarDropdown';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import PowerpointGenerator from '@/components/PowerpointGenerator';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [refreshMCQs, setRefreshMCQs] = useState(0);
  const [activeTab, setActiveTab] = useState<'mcqs' | 'notes-generator' | 'saved-notes' | 'powerpoint'>('mcqs');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const navigate = useNavigate();

  // Keyboard navigation
  useKeyboardNavigation({
    onEscape: () => setMobileMenuOpen(false),
    onArrowLeft: () => {
      const tabs = ['mcqs', 'notes-generator', 'saved-notes', 'powerpoint'] as const;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    },
    onArrowRight: () => {
      const tabs = ['mcqs', 'notes-generator', 'saved-notes', 'powerpoint'] as const;
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
      label: 'Practice',
      icon: Target,
      action: () => navigate('/mcq-practice'),
      description: 'Take practice quizzes to test your knowledge'
    },
    {
      id: 'mcqs',
      label: 'Generator',
      icon: Brain,
      action: () => handleTabChange('mcqs'),
      description: 'Generate custom multiple choice questions'
    },
    {
      id: 'notes-generator',
      label: 'Notes',
      icon: FileText,
      action: () => handleTabChange('notes-generator'),
      description: 'Create comprehensive study notes'
    },
    {
      id: 'saved-notes',
      label: 'Library',
      icon: BookOpen,
      action: () => handleTabChange('saved-notes'),
      description: 'Access your previously saved notes'
    },
    {
      id: 'powerpoint',
      label: 'PowerPoint',
      icon: FileText,
      action: () => handleTabChange('powerpoint'),
      description: 'Generate and download professional PowerPoint slides'
    }
  ];

  const handleNavItemClick = (item: typeof navigationItems[0]) => {
    item.action();
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900 tracking-tight">
                Neutron AI
              </span>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <nav className="flex items-center space-x-1">
                {navigationItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${(item.id === 'practice' && false) || 
                        (item.id !== 'practice' && activeTab === item.id)
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* User info - Desktop only */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {getNickname()}
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
                    <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open menu</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <div className="flex flex-col gap-6 mt-8">
                      {/* Mobile user info */}
                      <div className="text-center pb-6 border-b border-gray-200">
                        <p className="text-lg font-semibold text-gray-900">
                          {getNickname()}
                        </p>
                      </div>
                      {/* Mobile navigation */}
                      <nav className="flex flex-col gap-2">
                        {navigationItems.map((item, index) => (
                          <button
                            key={item.id}
                            onClick={() => handleNavItemClick(item)}
                            className={`
                              flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 w-full
                              ${(item.id === 'practice' && false) || 
                                (item.id !== 'practice' && activeTab === item.id)
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }
                            `}
                          >
                            <item.icon className="w-5 h-5" />
                            <div>
                              <span className="font-medium">{item.label}</span>
                              <p className="text-xs opacity-75 mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </button>
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
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
