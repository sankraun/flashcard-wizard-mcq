import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Trophy, 
  Target,
  Clock,
  Star,
  ArrowLeft,
  Play,
  BookOpen,
  Trash2,
  Pause,
  BarChart3,
  TrendingUp,
  Award,
  Calendar,
  Timer,
  Settings,
  CheckSquare
} from 'lucide-react';

interface MCQ {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: string;
  chapter: string | null;
  question_type: string;
}

interface SessionAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
  confidence?: number;
}

interface PracticeSession {
  id: string;
  userId: string;
  mcqIds: string[];
  currentIndex: number;
  answers: SessionAnswer[];
  startTime: Date;
  pausedTime?: Date;
  practiceMode: 'all' | 'by-difficulty' | 'by-chapter' | 'custom-chapters';
  selectedDifficulty?: string;
  selectedChapter?: string;
  selectedChapters?: string[];
  isCompleted: boolean;
}

const EnhancedMCQPractice = () => {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'all' | 'by-difficulty' | 'by-chapter' | 'custom-chapters'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [filteredMcqs, setFilteredMcqs] = useState<MCQ[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [savedSessions, setSavedSessions] = useState<PracticeSession[]>([]);
  const [deletingChapter, setDeletingChapter] = useState<string | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { updateAnalyticsFromPractice } = useAnalytics();

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession && !isPaused && !currentSession.isCompleted) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSession, isPaused]);

  useEffect(() => {
    if (user) {
      loadMCQs();
      loadSavedSessions();
    }
  }, [user]);

  useEffect(() => {
    filterMCQs();
  }, [mcqs, practiceMode, selectedDifficulty, selectedChapter, selectedChapters]);

  const loadMCQs = async () => {
    try {
      const { data, error } = await supabase
        .from('mcqs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMcqs(
        (data || []).map((mcq: any) => ({
          ...mcq,
          options: Array.isArray(mcq.options)
            ? mcq.options
            : typeof mcq.options === 'string'
              ? JSON.parse(mcq.options)
              : [],
        }))
      );
    } catch (error) {
      console.error('Error loading MCQs:', error);
      toast({
        title: "Error",
        description: "Failed to load saved MCQs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedSessions = async () => {
    try {
      const saved = localStorage.getItem(`mcq_sessions_${user?.id}`);
      if (saved) {
        const sessions = JSON.parse(saved).map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          pausedTime: s.pausedTime ? new Date(s.pausedTime) : undefined
        }));
        setSavedSessions(sessions.filter((s: PracticeSession) => !s.isCompleted));
      }
    } catch (error) {
      console.error('Error loading saved sessions:', error);
    }
  };

  const saveSession = useCallback((session: PracticeSession) => {
    try {
      const saved = localStorage.getItem(`mcq_sessions_${user?.id}`);
      const sessions = saved ? JSON.parse(saved) : [];
      const existingIndex = sessions.findIndex((s: PracticeSession) => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      localStorage.setItem(`mcq_sessions_${user?.id}`, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }, [user?.id]);

  const filterMCQs = () => {
    let filtered = [...mcqs];

    if (practiceMode === 'by-difficulty' && selectedDifficulty) {
      filtered = filtered.filter(mcq => mcq.difficulty === selectedDifficulty);
    } else if (practiceMode === 'by-chapter' && selectedChapter) {
      filtered = filtered.filter(mcq => mcq.chapter === selectedChapter);
    } else if (practiceMode === 'custom-chapters' && selectedChapters.length > 0) {
      filtered = filtered.filter(mcq => mcq.chapter && selectedChapters.includes(mcq.chapter));
    }

    setFilteredMcqs(filtered);
  };

  const getUniqueValues = (field: 'difficulty' | 'chapter') => {
    const values = mcqs.map(mcq => mcq[field]).filter(Boolean);
    return [...new Set(values)];
  };

  const handleChapterSelection = (chapter: string, checked: boolean) => {
    if (checked) {
      setSelectedChapters(prev => [...prev, chapter]);
    } else {
      setSelectedChapters(prev => prev.filter(c => c !== chapter));
    }
  };

  const startNewSession = () => {
    if (filteredMcqs.length === 0) {
      toast({
        title: "No MCQs Found",
        description: "No MCQs available for the selected criteria",
        variant: "destructive"
      });
      return;
    }

    const shuffled = [...filteredMcqs].sort(() => Math.random() - 0.5);
    const newSession: PracticeSession = {
      id: Date.now().toString(),
      userId: user!.id,
      mcqIds: shuffled.map(mcq => mcq.id),
      currentIndex: 0,
      answers: [],
      startTime: new Date(),
      practiceMode,
      selectedDifficulty,
      selectedChapter,
      selectedChapters: practiceMode === 'custom-chapters' ? selectedChapters : undefined,
      isCompleted: false
    };

    setCurrentSession(newSession);
    setFilteredMcqs(shuffled);
    setSelectedAnswer(null);
    setShowResult(false);
    setSessionTime(0);
    setIsPaused(false);
    setQuestionStartTime(new Date());
    saveSession(newSession);
  };

  const resumeSession = (session: PracticeSession) => {
    const sessionMcqs = mcqs.filter(mcq => session.mcqIds.includes(mcq.id));
    setCurrentSession(session);
    setFilteredMcqs(sessionMcqs);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsPaused(false);
    setQuestionStartTime(new Date());
    
    // Calculate elapsed time
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);
    setSessionTime(elapsed);
  };

  const pauseSession = () => {
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        pausedTime: new Date()
      };
      setCurrentSession(updatedSession);
      setIsPaused(true);
      saveSession(updatedSession);
      
      toast({
        title: "Session Paused",
        description: "Your progress has been saved. You can resume anytime."
      });
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    if (!questionStartTime) setQuestionStartTime(new Date());
    setSelectedAnswer(answerIndex);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null || !currentSession || !questionStartTime) return;

    const currentMCQ = filteredMcqs[currentSession.currentIndex];
    const isCorrect = selectedAnswer === currentMCQ.correct_answer;
    const timeSpent = new Date().getTime() - questionStartTime.getTime();
    
    const newAnswer: SessionAnswer = {
      questionId: currentMCQ.id,
      selectedAnswer,
      isCorrect,
      timeSpent,
      confidence
    };

    const updatedAnswers = [...currentSession.answers, newAnswer];
    const updatedSession = {
      ...currentSession,
      answers: updatedAnswers
    };

    setCurrentSession(updatedSession);
    setShowResult(true);
    saveSession(updatedSession);
  };

  const nextQuestion = () => {
    if (!currentSession) return;

    if (currentSession.currentIndex < filteredMcqs.length - 1) {
      const updatedSession = {
        ...currentSession,
        currentIndex: currentSession.currentIndex + 1
      };
      setCurrentSession(updatedSession);
      setSelectedAnswer(null);
      setShowResult(false);
      setConfidence(null);
      setQuestionStartTime(new Date());
      saveSession(updatedSession);
    } else {
      completeSession();
    }
  };

  const completeSession = () => {
    if (!currentSession) return;

    const completedSession = {
      ...currentSession,
      isCompleted: true
    };
    setCurrentSession(completedSession);
    saveSession(completedSession);

    // Update analytics
    const today = new Date().toISOString().slice(0, 10);
    const results = currentSession.answers.map(ans => {
      const mcq = filteredMcqs.find(m => m.id === ans.questionId);
      return {
        question: mcq?.question || '',
        chapter: mcq?.chapter || '',
        correct: ans.isCorrect,
        date: today,
        timeSpent: ans.timeSpent
      };
    });
    updateAnalyticsFromPractice(results);

    toast({
      title: "Practice Session Complete! 🎉",
      description: `You completed ${currentSession.answers.length} questions`,
    });
  };

  const calculateResults = () => {
    if (!currentSession) return { totalQuestions: 0, correctAnswers: 0, accuracy: 0, timeSpent: 0 };
    
    const totalQuestions = currentSession.answers.length;
    const correctAnswers = currentSession.answers.filter(answer => answer.isCorrect).length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    return {
      totalQuestions,
      correctAnswers,
      accuracy: Math.round(accuracy),
      timeSpent: Math.round(sessionTime / 60)
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const deleteChapter = async (chapterName: string) => {
    setDeletingChapter(chapterName);
    try {
      const { error } = await supabase
        .from('mcqs')
        .delete()
        .eq('user_id', user?.id)
        .eq('chapter', chapterName);

      if (error) throw error;

      // Update local state
      const updatedMcqs = mcqs.filter(mcq => mcq.chapter !== chapterName);
      setMcqs(updatedMcqs);

      // If the deleted chapter was selected, reset the selection
      if (selectedChapter === chapterName) {
        setSelectedChapter('');
      }
      if (selectedChapters.includes(chapterName)) {
        setSelectedChapters(prev => prev.filter(c => c !== chapterName));
      }

      toast({
        title: "Chapter Deleted",
        description: `All MCQs from "${chapterName}" have been deleted`,
      });
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({
        title: "Error",
        description: "Failed to delete chapter",
        variant: "destructive"
      });
    } finally {
      setDeletingChapter(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your MCQ practice...</p>
        </div>
      </div>
    );
  }

  const uniqueChapters = getUniqueValues('chapter');
  const uniqueDifficulties = getUniqueValues('difficulty');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-24">
      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button onClick={() => navigate('/')} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {currentSession && !currentSession.isCompleted && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                {formatTime(sessionTime)}
              </div>
              <Button
                onClick={pauseSession}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            </div>
          )}
        </div>

        {mcqs.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Saved MCQs</h3>
              <p className="text-muted-foreground mb-4">
                Generate some MCQs first to start practicing
              </p>
              <Button onClick={() => navigate('/')}>
                Go to MCQ Generator
              </Button>
            </CardContent>
          </Card>
        ) : !currentSession || currentSession.isCompleted ? (
          // Session Setup or Results
          <div className="space-y-6">
            {/* Saved Sessions */}
            {savedSessions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Resume Practice Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {savedSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <div className="font-medium">
                            {session.practiceMode === 'by-difficulty' ? `${session.selectedDifficulty} Questions` :
                             session.practiceMode === 'by-chapter' ? `${session.selectedChapter} Chapter` :
                             session.practiceMode === 'custom-chapters' ? `Custom Quiz (${session.selectedChapters?.length || 0} chapters)` :
                             'All Questions'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Progress: {session.currentIndex + 1}/{session.mcqIds.length} questions
                          </div>
                        </div>
                        <Button onClick={() => resumeSession(session)} size="sm">
                          Resume
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Dashboard */}
            {currentSession?.isCompleted && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Trophy className="w-8 h-8 text-yellow-600" />
                    Practice Session Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {(() => {
                      const results = calculateResults();
                      return (
                        <>
                          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Target className="w-5 h-5 text-blue-600" />
                              <span className="font-medium">Score</span>
                            </div>
                            <div className="text-3xl font-bold text-blue-600">{results.accuracy}%</div>
                            <div className="text-sm text-muted-foreground">{results.correctAnswers}/{results.totalQuestions}</div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Clock className="w-5 h-5 text-green-600" />
                              <span className="font-medium">Time</span>
                            </div>
                            <div className="text-3xl font-bold text-green-600">{results.timeSpent}m</div>
                            <div className="text-sm text-muted-foreground">Total time</div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <BarChart3 className="w-5 h-5 text-purple-600" />
                              <span className="font-medium">Avg Time</span>
                            </div>
                            <div className="text-3xl font-bold text-purple-600">
                              {Math.round(results.timeSpent * 60 / results.totalQuestions)}s
                            </div>
                            <div className="text-sm text-muted-foreground">Per question</div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-4 shadow-sm text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-orange-600" />
                              <span className="font-medium">Performance</span>
                            </div>
                            <div className="text-2xl font-bold text-orange-600">
                              {results.accuracy >= 80 ? 'Excellent' : results.accuracy >= 60 ? 'Good' : 'Needs Work'}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={() => setCurrentSession(null)} className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      New Session
                    </Button>
                    <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* New Session Setup */}
            {(!currentSession || currentSession.isCompleted) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-blue-600" />
                    Start New Practice Session
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      You have {mcqs.length} saved MCQs
                    </h3>
                    <p className="text-muted-foreground">
                      Choose how you want to practice
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Button
                        onClick={() => setPracticeMode('all')}
                        variant={practiceMode === 'all' ? 'default' : 'outline'}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <Target className="w-5 h-5" />
                        <span>All MCQs</span>
                        <span className="text-xs text-muted-foreground">
                          {mcqs.length} questions
                        </span>
                      </Button>

                      <Button
                        onClick={() => setPracticeMode('by-difficulty')}
                        variant={practiceMode === 'by-difficulty' ? 'default' : 'outline'}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <Star className="w-5 h-5" />
                        <span>By Difficulty</span>
                        <span className="text-xs text-muted-foreground">
                          {uniqueDifficulties.length} levels
                        </span>
                      </Button>

                      <Button
                        onClick={() => setPracticeMode('by-chapter')}
                        variant={practiceMode === 'by-chapter' ? 'default' : 'outline'}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <BookOpen className="w-5 h-5" />
                        <span>By Chapter</span>
                        <span className="text-xs text-muted-foreground">
                          {uniqueChapters.length} chapters
                        </span>
                      </Button>

                      <Button
                        onClick={() => setPracticeMode('custom-chapters')}
                        variant={practiceMode === 'custom-chapters' ? 'default' : 'outline'}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                      >
                        <Settings className="w-5 h-5" />
                        <span>Custom Quiz</span>
                        <span className="text-xs text-muted-foreground">
                          Mix chapters
                        </span>
                      </Button>
                    </div>

                    {practiceMode === 'by-difficulty' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Difficulty:</label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueDifficulties.map(difficulty => (
                            <Button
                              key={difficulty}
                              onClick={() => setSelectedDifficulty(difficulty)}
                              variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                              size="sm"
                            >
                              {difficulty}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {practiceMode === 'by-chapter' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Select Chapter:</label>
                          <div className="text-xs text-muted-foreground">
                            Click the trash icon to delete a chapter
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {uniqueChapters.map(chapter => (
                            <div key={chapter} className="flex items-center gap-1">
                              <Button
                                onClick={() => setSelectedChapter(chapter)}
                                variant={selectedChapter === chapter ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1"
                              >
                                {chapter}
                              </Button>
                              <Button
                                onClick={() => deleteChapter(chapter)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                                disabled={deletingChapter === chapter}
                                title={`Delete ${chapter} chapter`}
                              >
                                {deletingChapter === chapter ? (
                                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {practiceMode === 'custom-chapters' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Select Chapters for Custom Quiz:</label>
                          <Badge variant="outline">{selectedChapters.length} selected</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                          {uniqueChapters.map(chapter => {
                            const chapterMcqCount = mcqs.filter(mcq => mcq.chapter === chapter).length;
                            return (
                              <div key={chapter} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                <Checkbox
                                  id={`chapter-${chapter}`}
                                  checked={selectedChapters.includes(chapter)}
                                  onCheckedChange={(checked) => 
                                    handleChapterSelection(chapter, checked as boolean)
                                  }
                                />
                                <div className="flex-1">
                                  <label 
                                    htmlFor={`chapter-${chapter}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {chapter}
                                  </label>
                                  <div className="text-xs text-muted-foreground">
                                    {chapterMcqCount} questions
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {selectedChapters.length > 0 && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setSelectedChapters(uniqueChapters)}
                              variant="outline"
                              size="sm"
                            >
                              <CheckSquare className="w-4 h-4 mr-2" />
                              Select All
                            </Button>
                            <Button
                              onClick={() => setSelectedChapters([])}
                              variant="outline"
                              size="sm"
                            >
                              Clear All
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={startNewSession}
                    className="w-full"
                    size="lg"
                    disabled={
                      (practiceMode === 'by-difficulty' && !selectedDifficulty) ||
                      (practiceMode === 'by-chapter' && !selectedChapter) ||
                      (practiceMode === 'custom-chapters' && selectedChapters.length === 0)
                    }
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Practice ({filteredMcqs.length} questions)
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Active Practice Session
          <div className="space-y-6">
            {/* Enhanced Progress Tracking */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Progress</span>
                    <span className="text-muted-foreground">
                      Question {currentSession.currentIndex + 1} of {filteredMcqs.length}
                    </span>
                  </div>
                  
                  <Progress 
                    value={(currentSession.currentIndex / filteredMcqs.length) * 100} 
                    className="h-2"
                  />
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(((currentSession.currentIndex + 1) / filteredMcqs.length) * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </div>
                    
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {currentSession.answers.filter(a => a.isCorrect).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Correct</div>
                    </div>
                    
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatTime(sessionTime)}
                      </div>
                      <div className="text-xs text-muted-foreground">Time</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            <Card className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Question {currentSession.currentIndex + 1}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getDifficultyColor(filteredMcqs[currentSession.currentIndex].difficulty)}>
                      {filteredMcqs[currentSession.currentIndex].difficulty}
                    </Badge>
                    {filteredMcqs[currentSession.currentIndex].chapter && (
                      <Badge variant="outline">
                        {filteredMcqs[currentSession.currentIndex].chapter}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pb-32">
                <div className="text-lg leading-relaxed break-words whitespace-pre-wrap">
                  {filteredMcqs[currentSession.currentIndex].question}
                </div>

                <div className="space-y-3">
                  {filteredMcqs[currentSession.currentIndex].options.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      variant={selectedAnswer === index ? "default" : "outline"}
                      className={`w-full justify-start text-left h-auto p-4 transition-all duration-200 ${
                        showResult && index === filteredMcqs[currentSession.currentIndex].correct_answer
                          ? 'bg-green-100 border-green-500 text-green-800'
                          : showResult && selectedAnswer === index && index !== filteredMcqs[currentSession.currentIndex].correct_answer
                          ? 'bg-red-100 border-red-500 text-red-800'
                          : ''
                      }`}
                      disabled={showResult}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1 break-words whitespace-pre-wrap text-left">{option}</span>
                        {showResult && index === filteredMcqs[currentSession.currentIndex].correct_answer && (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        )}
                        {showResult && selectedAnswer === index && index !== filteredMcqs[currentSession.currentIndex].correct_answer && (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>

                {!showResult && selectedAnswer !== null && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium">How confident are you?</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Button
                          key={level}
                          onClick={() => setConfidence(level)}
                          variant={confidence === level ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                        >
                          {level === 1 ? 'Very Low' : level === 2 ? 'Low' : level === 3 ? 'Medium' : level === 4 ? 'High' : 'Very High'}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {showResult && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Explanation:
                    </h4>
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {filteredMcqs[currentSession.currentIndex].explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sticky Action Bar - Only show during active session */}
        {currentSession && !currentSession.isCompleted && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-4xl mx-auto flex justify-end">
              {!showResult ? (
                <Button 
                  onClick={submitAnswer} 
                  disabled={selectedAnswer === null}
                  variant="default"
                  size="lg"
                  className="min-w-[140px]"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Check Answer
                </Button>
              ) : (
                <Button 
                  onClick={nextQuestion} 
                  variant="default"
                  size="lg"
                  className="min-w-[140px]"
                >
                  {currentSession.currentIndex < filteredMcqs.length - 1 ? (
                    <>
                      Next Question
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <Award className="w-5 h-5 mr-2" />
                      Finish Session
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EnhancedMCQPractice;
