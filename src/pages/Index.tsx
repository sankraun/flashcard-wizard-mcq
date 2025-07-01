
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
import { Brain, FileText, BookOpen, Target, Menu, Sparkles, Zap, History, Timer, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const { user, loading } = useAuth();
  const [refreshMCQs, setRefreshMCQs] = useState(0);
  const [activeTab, setActiveTab] = useState<'mcqs' | 'notes-generator' | 'saved-notes' | 'powerpoint' | 'presentations' | 'flashcards' | 'practice'>('mcqs');
  const [contentLoading, setContentLoading] = useState(false);
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Neutron AI</h2>
          <p className="text-gray-500">Preparing your intelligent workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const courseCards = [
    {
      title: "CCNA 2020 200-125 Video Boot Camp",
      students: "9,530 students",
      rating: "4.8",
      category: "IT & Software",
      bgColor: "from-pink-200 to-pink-300",
      categoryColor: "text-pink-700",
      categoryBg: "bg-pink-100"
    },
    {
      title: "Powerful Business Writing: How to Write Concisely",
      students: "1,483 students", 
      rating: "4.9",
      category: "Business",
      bgColor: "from-yellow-200 to-orange-200",
      categoryColor: "text-orange-700",
      categoryBg: "bg-orange-100"
    },
    {
      title: "Certified Six Sigma Yellow Belt Training",
      students: "6,726 students",
      rating: "4.9", 
      category: "Media Training",
      bgColor: "from-purple-200 to-purple-300",
      categoryColor: "text-purple-700",
      categoryBg: "bg-purple-100"
    },
    {
      title: "How to Design a Room in 10 Easy Steps",
      students: "8,735 students",
      rating: "5.0",
      category: "Interior",
      bgColor: "from-green-200 to-teal-200",
      categoryColor: "text-teal-700",
      categoryBg: "bg-teal-100"
    }
  ];

  const categories = [
    { name: "All", active: true },
    { name: "IT & Software", icon: Brain },
    { name: "Media Training", icon: FileText },
    { name: "Business", icon: Target },
    { name: "Interior", icon: BookOpen }
  ];

  const renderContent = () => {
    if (contentLoading) {
      return <LoadingSkeleton variant="card" />;
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
        return (
          <div className="space-y-8">
            {/* Category Tabs */}
            <div className="flex gap-3 flex-wrap">
              {categories.map((category, index) => (
                <Button
                  key={index}
                  variant={category.active ? "default" : "outline"}
                  className={`rounded-full ${
                    category.active 
                      ? 'bg-gray-900 text-white hover:bg-gray-800' 
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                  size="sm"
                >
                  {category.icon && <category.icon className="w-4 h-4 mr-2" />}
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Most Popular Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Most popular</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courseCards.map((course, index) => (
                  <div
                    key={index}
                    className={`bg-gradient-to-br ${course.bgColor} rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02]`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={`${course.categoryBg} ${course.categoryColor} border-none`}>
                        <Brain className="w-3 h-3 mr-1" />
                        {course.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-semibold text-gray-800">{course.rating}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{course.students}</span>
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white"></div>
                        <div className="w-6 h-6 bg-gray-500 rounded-full border-2 border-white"></div>
                        <div className="w-6 h-6 bg-gray-600 rounded-full border-2 border-white"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Tools Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">AI-Powered Learning Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => handleTabChange('mcqs')}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center bg-white/80 hover:bg-white border-gray-200"
                >
                  <Brain className="w-6 h-6 mb-2 text-blue-600" />
                  <span className="text-sm font-medium">MCQ Generator</span>
                </Button>
                
                <Button
                  onClick={() => handleTabChange('notes-generator')}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center bg-white/80 hover:bg-white border-gray-200"
                >
                  <FileText className="w-6 h-6 mb-2 text-purple-600" />
                  <span className="text-sm font-medium">Smart Notes</span>
                </Button>
                
                <Button
                  onClick={() => handleTabChange('powerpoint')}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center bg-white/80 hover:bg-white border-gray-200"
                >
                  <Sparkles className="w-6 h-6 mb-2 text-indigo-600" />
                  <span className="text-sm font-medium">PowerPoint</span>
                </Button>
                
                <Button
                  onClick={() => handleTabChange('flashcards')}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center bg-white/80 hover:bg-white border-gray-200"
                >
                  <Zap className="w-6 h-6 mb-2 text-yellow-600" />
                  <span className="text-sm font-medium">Flashcards</span>
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animate-fade-in">
      {renderContent()}
    </div>
  );
};

export default Index;
