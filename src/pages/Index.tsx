
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/AuthPage';
import NotesGenerator from '@/components/NotesGenerator';
import SavedNotes from '@/components/SavedNotes';
import MCQGenerator from '@/components/MCQGenerator';
import MCQViewer from '@/components/MCQViewer';
import { BookOpen, Brain, FileText, LogOut, User } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [refreshMCQs, setRefreshMCQs] = useState(0);

  const handleMCQsGenerated = () => {
    setRefreshMCQs(prev => prev + 1);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  NeutronAI
                </h1>
                <p className="text-sm text-muted-foreground">AI-Powered Study Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {user.email}
                </span>
              </div>
              <Button 
                onClick={signOut} 
                variant="outline" 
                size="sm"
                className="hover-scale"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="mcqs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm border border-blue-100 animate-scale-in">
            <TabsTrigger 
              value="mcqs" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 transition-all duration-200"
            >
              <Brain className="w-4 h-4" />
              MCQ Practice
            </TabsTrigger>
            <TabsTrigger 
              value="notes-generator" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 transition-all duration-200"
            >
              <FileText className="w-4 h-4" />
              Notes Generator
            </TabsTrigger>
            <TabsTrigger 
              value="saved-notes" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-50 transition-all duration-200"
            >
              <BookOpen className="w-4 h-4" />
              Saved Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mcqs" className="space-y-6 animate-fade-in">
            <div className="grid lg:grid-cols-2 gap-6">
              <MCQGenerator onMCQsGenerated={handleMCQsGenerated} />
              <MCQViewer key={refreshMCQs} />
            </div>
          </TabsContent>

          <TabsContent value="notes-generator" className="animate-fade-in">
            <NotesGenerator />
          </TabsContent>

          <TabsContent value="saved-notes" className="animate-fade-in">
            <SavedNotes />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
