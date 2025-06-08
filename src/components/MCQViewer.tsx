
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Trash2, Calendar, CheckCircle, XCircle, RefreshCw, Target, Award, BarChart } from 'lucide-react';

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
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const { user } = useAuth();

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

      // Type assertion to handle the Json type from Supabase
      const typedData = (data || []).map(mcq => ({
        ...mcq,
        options: Array.isArray(mcq.options) ? mcq.options as string[] : []
      }));

      setMcqs(typedData);
      setUserAnswers(new Array(typedData.length || 0).fill(null));
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

      setMcqs(mcqs.filter(mcq => mcq.id !== mcqId));
      
      if (currentIndex >= mcqs.length - 1 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
      
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
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(userAnswers[currentIndex - 1]);
      setShowAnswer(userAnswers[currentIndex - 1] !== null);
    }
  };

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

  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="relative">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 rounded-full animate-pulse"></div>
            </div>
            <p className="text-lg font-medium">Loading your MCQs...</p>
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
            <Target className="w-5 h-5 text-blue-600" />
            Practice MCQs
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
              <h3 className="text-xl font-semibold">No MCQs yet</h3>
              <p className="text-muted-foreground max-w-md">
                Generate your first MCQs from study material to start practicing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentMCQ = mcqs[currentIndex];
  const progress = ((currentIndex + 1) / mcqs.length) * 100;
  const scorePercentage = getScorePercentage();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-scale-in">
        <Card className="hover-scale transition-all duration-300 hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{currentIndex + 1}/{mcqs.length}</p>
              </div>
              <BarChart className="w-8 h-8 text-blue-600" />
            </div>
            <Progress value={progress} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="hover-scale transition-all duration-300 hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score</p>
                <p className="text-2xl font-bold">{scorePercentage}%</p>
              </div>
              <Award className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {correctCount} correct answers
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale transition-all duration-300 hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm font-semibold">
                  {new Date(currentMCQ.created_at).toLocaleDateString()}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current MCQ */}
      <Card className="animate-fade-in transition-all duration-300 hover:shadow-xl border-2 hover:border-blue-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge className={`${getDifficultyColor(currentMCQ.difficulty)} animate-scale-in border`}>
                  {currentMCQ.difficulty}
                </Badge>
                {currentMCQ.chapter && (
                  <Badge variant="outline" className="animate-scale-in">
                    {currentMCQ.chapter}
                  </Badge>
                )}
                <Badge variant="secondary" className="animate-scale-in">
                  Question {currentIndex + 1}
                </Badge>
              </div>
              <CardTitle className="text-lg leading-relaxed">
                {currentMCQ.question}
              </CardTitle>
            </div>
            <Button
              onClick={() => deleteMCQ(currentMCQ.id)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover-scale border-red-200 hover:border-red-300"
              disabled={deleting === currentMCQ.id}
            >
              {deleting === currentMCQ.id ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
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
                  className={`
                    justify-start text-left h-auto py-4 px-5 transition-all duration-300 hover-scale
                    ${showCorrectness ? (
                      isCorrect ? 'bg-green-50 border-green-500 text-green-800 hover:bg-green-100' :
                      isSelected ? 'bg-red-50 border-red-500 text-red-800 hover:bg-red-100' : ''
                    ) : isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}
                    ${showAnswer ? 'pointer-events-none' : 'cursor-pointer'}
                  `}
                  disabled={showAnswer}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${isSelected && !showAnswer ? 'bg-blue-600 text-white' : 
                        showCorrectness && isCorrect ? 'bg-green-600 text-white' :
                        showCorrectness && isSelected && !isCorrect ? 'bg-red-600 text-white' :
                        'bg-gray-200 text-gray-600'}
                      transition-all duration-200
                    `}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1 text-base">{option}</span>
                    {showCorrectness && isCorrect && (
                      <CheckCircle className="w-5 h-5 text-green-600 animate-scale-in" />
                    )}
                    {showCorrectness && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-600 animate-scale-in" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          {showAnswer && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 animate-fade-in border border-blue-100">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                  <p className="text-blue-800 leading-relaxed">{currentMCQ.explanation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {!showAnswer ? (
              <Button 
                onClick={checkAnswer} 
                disabled={selectedAnswer === null}
                className="flex-1 hover-scale bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Check Answer
              </Button>
            ) : (
              <div className="flex gap-3 w-full">
                <Button 
                  onClick={previousQuestion} 
                  disabled={currentIndex === 0}
                  variant="outline"
                  className="hover-scale"
                  size="lg"
                >
                  Previous
                </Button>
                <Button 
                  onClick={nextQuestion} 
                  disabled={currentIndex === mcqs.length - 1}
                  className="flex-1 hover-scale"
                  size="lg"
                >
                  {currentIndex === mcqs.length - 1 ? 'Finish Practice' : 'Next Question'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MCQViewer;
