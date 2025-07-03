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
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const DASHBOARD_MCQ_LIMIT = 5;
  useEffect(() => {
    if (user) {
      loadMCQs();
    }
  }, [user]);
  const loadMCQs = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('mcqs').select('*').eq('user_id', user?.id).order('created_at', {
        ascending: false
      });
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
      const {
        error
      } = await supabase.from('mcqs').delete().eq('id', mcqId).eq('user_id', user?.id);
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
        description: `You scored ${getScorePercentage()}% with ${correctCount} correct answers`
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
  const getBgClass = (light: string, dark: string) => `bg-${light} dark:bg-${dark}`;
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
    return answeredQuestions > 0 ? Math.round(correctCount / answeredQuestions * 100) : 0;
  };
  const getAccuracyByDifficulty = () => {
    const difficulties = ['Easy', 'Medium', 'Hard'];
    return difficulties.map(diff => {
      const questionsOfDifficulty = mcqs.filter((mcq, index) => mcq.difficulty === diff && userAnswers[index] !== null);
      const correctAnswers = questionsOfDifficulty.filter((mcq, mcqIndex) => {
        const originalIndex = mcqs.findIndex(m => m.id === mcq.id);
        return userAnswers[originalIndex] === mcq.correct_answer;
      }).length;
      return {
        difficulty: diff,
        accuracy: questionsOfDifficulty.length > 0 ? Math.round(correctAnswers / questionsOfDifficulty.length * 100) : 0,
        count: questionsOfDifficulty.length
      };
    });
  };
  if (loading) {
    return <Card className="animate-fade-in">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="relative">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 rounded-full animate-pulse"></div>
            </div>
            <p className="text-lg font-medium">Loading your saved MCQs...</p>
          </div>
        </CardContent>
      </Card>;
  }
  if (mcqs.length === 0) {
    return <Card className="animate-fade-in">
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
      </Card>;
  }

  // Session Complete View - Modified for dashboard
  if (sessionComplete) {
    const accuracyData = getAccuracyByDifficulty();
    return <div className="space-y-6 animate-fade-in">
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

            {allMcqs.length > DASHBOARD_MCQ_LIMIT && <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Target className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Ready for More Practice?</h3>
                </div>
                <p className="text-blue-800 mb-4">
                  You have {allMcqs.length - DASHBOARD_MCQ_LIMIT} more MCQs waiting! Head to the Practice section for unlimited practice sessions.
                </p>
                <Button onClick={() => navigate('/mcq-practice')} className="bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                  <Target className="w-4 h-4 mr-2" />
                  Continue Practicing
                </Button>
              </div>}

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
      </div>;
  }
  const currentMCQ = mcqs[currentIndex];
  const progress = (currentIndex + 1) / mcqs.length * 100;
  return;
};
export default MCQViewer;