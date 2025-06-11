import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/AuthPage';
import NotesGenerator from '@/components/NotesGenerator';
import SavedNotes from '@/components/SavedNotes';
import MCQGenerator from '@/components/MCQGenerator';
import MCQViewer from '@/components/MCQViewer';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { Brain, FileText, BookOpen, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AvatarDropdown from '../components/AvatarDropdown';
import { useAnalytics } from '@/contexts/AnalyticsContext';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [refreshMCQs, setRefreshMCQs] = useState(0);
  const [activeTab, setActiveTab] = useState<'mcqs' | 'notes-generator' | 'saved-notes' | 'analytics'>('mcqs');
  const navigate = useNavigate();

  // Removed local analytics state, use context
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

  const handleMCQsGenerated = () => {
    setRefreshMCQs(prev => prev + 1);
  };

  // Helper to get nickname from user object
  const getNickname = () => {
    if (!user) return '';
    // If user_metadata.nickname exists, use it (future-proof)
    // @ts-ignore
    if (user.user_metadata && user.user_metadata.nickname) {
      // @ts-ignore
      return user.user_metadata.nickname;
    }
    // Otherwise, use the part before '@' in the email
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  useEffect(() => {
    // Removed dark mode effect
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #eff6ff 0%, #fff 50%, #ede9fe 100%)' }}>
      {/* Professional Minimalist Header */}
      <header className="bg-white/70 backdrop-blur border-b border-blue-100 sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
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
            {/* Centered Navigation Actions */}
            <div className="flex-1 flex justify-center min-w-0">
              <div className="flex flex-row flex-nowrap items-center justify-center gap-x-4 w-full max-w-5xl overflow-x-auto py-1">
                <Button
                  onClick={() => navigate('/mcq-practice')}
                  variant="ghost"
                  className="flex items-center gap-2 whitespace-nowrap px-2 md:px-4"
                  title="Practice MCQ"
                >
                  <Target className="w-4 h-4" />
                  <span className="hidden md:inline-block">Practice MCQ</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('mcqs')}
                  variant={activeTab === 'mcqs' ? 'secondary' : 'ghost'}
                  className="flex items-center gap-2 whitespace-nowrap px-2 md:px-4"
                  title="MCQ Generator"
                >
                  <Brain className="w-4 h-4" />
                  <span className="hidden md:inline-block">MCQ Generator</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('notes-generator')}
                  variant={activeTab === 'notes-generator' ? 'secondary' : 'ghost'}
                  className="flex items-center gap-2 whitespace-nowrap px-2 md:px-4"
                  title="Notes Generator"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden md:inline-block">Notes Generator</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('saved-notes')}
                  variant={activeTab === 'saved-notes' ? 'secondary' : 'ghost'}
                  className="flex items-center gap-2 whitespace-nowrap px-2 md:px-4"
                  title="Saved Notes"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden md:inline-block">Saved Notes</span>
                </Button>
                <Button
                  onClick={() => setActiveTab('analytics')}
                  variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
                  className="flex items-center gap-2 whitespace-nowrap px-2 md:px-4"
                  title="Analytics"
                >
                  <Target className="w-4 h-4" />
                  <span className="hidden md:inline-block">Analytics</span>
                </Button>
              </div>
            </div>
            {/* Right side: Welcome and Avatar */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-900/80 font-medium px-2 whitespace-nowrap text-center">
                Welcome, {getNickname()}
              </span>
              <AvatarDropdown onSignOut={signOut} user={user} />
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-8 animate-fade-in">
        {activeTab === 'mcqs' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MCQGenerator onMCQsGenerated={handleMCQsGenerated} />
            <MCQViewer key={refreshMCQs} />
          </div>
        )}
        {activeTab === 'notes-generator' && <NotesGenerator />}
        {activeTab === 'saved-notes' && <SavedNotes />}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            userId={user.id}
            streak={streak}
            dailyGoal={dailyGoal}
            todayProgress={todayProgress}
            accuracyHistory={accuracyHistory}
            weakTopics={weakTopics}
            studyTime={studyTime}
            badges={badges}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
