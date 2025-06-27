import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Trash2, Calendar, CheckCircle, XCircle, RefreshCw, Target, Award, BarChart, Brain, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MCQ {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: string;
  question_type: string;
  chapter: string | null;
  created_at: string;
}

const MCQViewer = () => {
  const [allMcqs, setAllMcqs] = useState<MCQ[]>([]);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const DASHBOARD_MCQ_LIMIT = 5;

  useEffect(() => {
    if (user) {
      loadMCQs();
    }
  }, [user]);

  const loadMCQs = async () => {
    try {
      const { data, error } = await supabase
        .from('mcqs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []).map(mcq => ({
        ...mcq,
        options: Array.isArray(mcq.options) ? mcq.options as string[] : []
      }));

      setAllMcqs(typedData);
      // Limit to 5 MCQs for dashboard view
      const limitedMcqs = typedData.slice(0, DASHBOARD_MCQ_LIMIT);
      setMcqs(limitedMcqs);
      setUserAnswers(new Array(limitedMcqs.length || 0).fill(null));
      setCorrectCount(0);
      setSessionComplete(false);
    } catch (error) {
      console.error('Error loading MCQs:', error);
      toast({
        title: "Error",
        description: "Failed to load MCQs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMCQ = async (mcqId: string) => {
    setDeleting(mcqId);
    try {
      const { error } = await supabase
        .from('mcqs')
        .delete()
        .eq('id', mcqId)
        .eq('user_id', user?.id);

      if (error) throw error;

      const newAllMcqs = allMcqs.filter(mcq => mcq.id !== mcqId);
      setAllMcqs(newAllMcqs);
      
      // Update limited MCQs for dashboard
      const newLimitedMcqs = newAllMcqs.slice(0, DASHBOARD_MCQ_LIMIT);
      setMcqs(newLimitedMcqs);
      
      if (currentIndex >= newLimitedMcqs.length && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
      
      const newAnswers = [...userAnswers];
      newAnswers.splice(currentIndex, 1);
      setUserAnswers(newAnswers);
      
      toast({
        title: "Success",
        description: "MCQ deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting MCQ:', error);
      toast({
        title: "Error",
        description: "Failed to delete MCQ",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;
    
    setSelectedAnswer(answerIndex);
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const checkAnswer = () => {
    setShowAnswer(true);
    if (selectedAnswer === mcqs[currentIndex].correct_answer) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(userAnswers[currentIndex + 1]);
      setShowAnswer(userAnswers[currentIndex + 1] !== null);
    } else {
      // Complete the session
      setSessionComplete(true);
      toast({
        title: "Dashboard Practice Complete! 🎉",
        description: `You scored ${getScorePercentage()}% with ${correctCount} correct answers`,
      });
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(userAnswers[currentIndex - 1]);
      setShowAnswer(userAnswers[currentIndex - 1] !== null);
    }
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setUserAnswers(new Array(mcqs.length).fill(null));
    setCorrectCount(0);
    setSessionComplete(false);
  };

  const getBgClass = (light: string, dark: string) =>
    `bg-${light} dark:bg-${dark}`;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Hard':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScorePercentage = () => {
    const answeredQuestions = userAnswers.filter(answer => answer !== null).length;
    return answeredQuestions > 0 ? Math.round((correctCount / answeredQuestions) * 100) : 0;
  };

  const getAccuracyByDifficulty = () => {
    const difficulties = ['Easy', 'Medium', 'Hard'];
    return difficulties.map(diff => {
      const questionsOfDifficulty = mcqs.filter((mcq, index) => 
        mcq.difficulty === diff && userAnswers[index] !== null
      );
      const correctAnswers = questionsOfDifficulty.filter((mcq, mcqIndex) => {
        const originalIndex = mcqs.findIndex(m => m.id === mcq.id);
        return userAnswers[originalIndex] === mcq.correct_answer;
      }).length;
      
      return {
        difficulty: diff,
        accuracy: questionsOfDifficulty.length > 0 ? Math.round((correctAnswers / questionsOfDifficulty.length) * 100) : 0,
        count: questionsOfDifficulty.length
      };
    });
  };

  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="relative">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 rounded-full animate-pulse"></div>
            </div>
            <p className="text-lg font-medium">Loading your saved MCQs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mcqs.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Quick Practice (5 MCQs)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <BookOpen className="w-20 h-20 text-muted-foreground animate-pulse" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-3 h-3 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No Saved MCQs Found</h3>
              <p className="text-muted-foreground max-w-md">
                Generate MCQs from study material first to start practicing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Session Complete View - Modified for dashboard
  if (sessionComplete) {
    const accuracyData = getAccuracyByDifficulty();
    
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Award className="w-8 h-8 text-yellow-600" />
              Quick Practice Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Score</span>
                </div>
                <div className="text-3xl font-bold text-blue-600">{getScorePercentage()}%</div>
                <div className="text-sm text-muted-foreground">{correctCount}/{userAnswers.filter(a => a !== null).length} correct</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Questions</span>
                </div>
                <div className="text-3xl font-bold text-green-600">{mcqs.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>

            {allMcqs.length > DASHBOARD_MCQ_LIMIT && (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Target className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Ready for More Practice?</h3>
                </div>
                <p className="text-blue-800 mb-4">
                  You have {allMcqs.length - DASHBOARD_MCQ_LIMIT} more MCQs waiting! Head to the Practice section for unlimited practice sessions.
                </p>
                <Button 
                  onClick={() => navigate('/mcq-practice')} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Continue Practicing
                </Button>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={restartSession} variant="outline" className="hover-scale">
                <RefreshCw className="w-4 h-4 mr-2" />
                Practice Again
              </Button>
              <Button onClick={() => navigate('/mcq-practice')} className="hover-scale">
                <Target className="w-4 h-4 mr-2" />
                Full Practice Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentMCQ = mcqs[currentIndex];
  const progress = ((currentIndex + 1) / mcqs.length) * 100;

  return (
    <div className="space-y-8">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Quick Practice
          </h2>
          <p className="text-muted-foreground">Complete 5 MCQs from your saved questions</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{currentIndex + 1}/{mcqs.length}</div>
          <div className="text-sm text-muted-foreground">Questions</div>
        </div>
      </div>

      {/* Current MCQ */}
      <Card className="shadow-none border-0 bg-white/90 rounded-xl transition-all duration-300 hover:shadow-xl border hover:border-blue-200 relative pb-24">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge className={`${getDifficultyColor(currentMCQ.difficulty)} border`}>{currentMCQ.difficulty}</Badge>
                {currentMCQ.chapter && (
                  <Badge variant="outline">{currentMCQ.chapter}</Badge>
                )}
                <Badge variant="secondary">Question {currentIndex + 1}</Badge>
              </div>
              <CardTitle className="text-lg leading-relaxed text-gray-900">
                {currentMCQ.question}
              </CardTitle>
            </div>
            <Button
              onClick={() => deleteMCQ(currentMCQ.id)}
              variant="ghost"
              size="icon"
              className="hover:bg-red-50"
              disabled={deleting === currentMCQ.id}
              title="Delete MCQ"
            >
              {deleting === currentMCQ.id ? (
                <svg className="w-5 h-5 animate-spin text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              ) : (
                <Trash2 className="w-5 h-5 text-red-500" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3">
            {currentMCQ.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentMCQ.correct_answer;
              const showCorrectness = showAnswer && (isSelected || isCorrect);
              return (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  variant={isSelected ? "default" : "outline"}
                  className={`justify-start text-left h-auto py-4 px-5 transition-all duration-300 rounded-lg border text-base font-medium hover:bg-gray-50 ${showCorrectness ? (isCorrect ? 'bg-green-50 border-green-500 text-green-800' : isSelected ? 'bg-red-50 border-red-500 text-red-800' : '') : isSelected ? 'bg-blue-50 border-blue-500' : ''} ${showAnswer ? 'pointer-events-none' : 'cursor-pointer'}`}
                  disabled={showAnswer}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSelected && !showAnswer ? 'bg-blue-600 text-white' : showCorrectness && isCorrect ? 'bg-green-600 text-white' : showCorrectness && isSelected && !isCorrect ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'} transition-all duration-200`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1 text-base text-gray-900 break-words whitespace-pre-line max-w-full">{option}</span>
                  {showCorrectness && isCorrect && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {showCorrectness && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </Button>
              );
            })}
          </div>
          {showAnswer && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                  <p className="text-blue-800 leading-relaxed">{currentMCQ.explanation || <span className="text-gray-700">No explanation provided.</span>}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        {/* Action bar */}
        <div className="absolute left-0 right-0 -bottom-6 z-40 flex justify-end bg-white/90 border-t border-blue-100 py-4 px-4 shadow-lg rounded-b-xl">
          <div className="w-full max-w-2xl flex gap-3 justify-end mx-auto">
            {!showAnswer ? (
              <Button 
                onClick={checkAnswer} 
                disabled={selectedAnswer === null}
                variant="default"
                size="lg"
                className="rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Check Answer
              </Button>
            ) : (
              <>
                <Button 
                  onClick={previousQuestion} 
                  disabled={currentIndex === 0}
                  variant="outline"
                  size="lg"
                  className="rounded-lg flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  Previous
                </Button>
                <Button 
                  onClick={nextQuestion} 
                  variant="default"
                  size="lg"
                  className="rounded-lg flex items-center gap-2"
                >
                  {currentIndex === mcqs.length - 1 ? (
                    <>
                      <Award className="w-5 h-5" /> Complete
                    </>
                  ) : (
                    <>
                      Next Question <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MCQViewer;
