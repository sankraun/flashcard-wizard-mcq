
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Trash2, Calendar, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

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
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMcqs(data || []);
      setUserAnswers(new Array(data?.length || 0).fill(null));
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
        .eq('id', mcqId);

      if (error) throw error;

      setMcqs(mcqs.filter(mcq => mcq.id !== mcqId));
      
      // Adjust current index if needed
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
    setSelectedAnswer(answerIndex);
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const checkAnswer = () => {
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(userAnswers[currentIndex + 1]);
      setShowAnswer(false);
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(userAnswers[currentIndex - 1]);
      setShowAnswer(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading MCQs...
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
            <BookOpen className="w-5 h-5" />
            Saved MCQs
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No MCQs yet</h3>
          <p className="text-muted-foreground">
            Generate your first MCQs to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentMCQ = mcqs[currentIndex];
  const progress = ((currentIndex + 1) / mcqs.length) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress and Stats */}
      <Card className="animate-scale-in">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold">Question {currentIndex + 1} of {mcqs.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {new Date(currentMCQ.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Progress value={progress} className="mb-2" />
          <div className="text-sm text-muted-foreground text-center">
            {Math.round(progress)}% Complete
          </div>
        </CardContent>
      </Card>

      {/* Current MCQ */}
      <Card className="animate-fade-in transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getDifficultyColor(currentMCQ.difficulty)}>
                  {currentMCQ.difficulty}
                </Badge>
                {currentMCQ.chapter && (
                  <Badge variant="outline">{currentMCQ.chapter}</Badge>
                )}
              </div>
              <CardTitle className="text-lg leading-relaxed">
                {currentMCQ.question}
              </CardTitle>
            </div>
            <Button
              onClick={() => deleteMCQ(currentMCQ.id)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover-scale"
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
        <CardContent className="space-y-4">
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
                    justify-start text-left h-auto py-3 px-4 transition-all duration-200 hover-scale
                    ${showCorrectness ? (
                      isCorrect ? 'bg-green-100 border-green-500 text-green-800' :
                      isSelected ? 'bg-red-100 border-red-500 text-red-800' : ''
                    ) : ''}
                  `}
                  disabled={showAnswer}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                    <span className="flex-1">{option}</span>
                    {showCorrectness && isCorrect && (
                      <CheckCircle className="w-4 h-4 text-green-600 animate-scale-in" />
                    )}
                    {showCorrectness && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-red-600 animate-scale-in" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          {showAnswer && (
            <div className="bg-blue-50 rounded-lg p-4 animate-fade-in">
              <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
              <p className="text-blue-800 leading-relaxed">{currentMCQ.explanation}</p>
            </div>
          )}

          <div className="flex gap-2">
            {!showAnswer ? (
              <Button 
                onClick={checkAnswer} 
                disabled={selectedAnswer === null}
                className="hover-scale"
              >
                Check Answer
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Button 
                  onClick={previousQuestion} 
                  disabled={currentIndex === 0}
                  variant="outline"
                  className="hover-scale"
                >
                  Previous
                </Button>
                <Button 
                  onClick={nextQuestion} 
                  disabled={currentIndex === mcqs.length - 1}
                  className="flex-1 hover-scale"
                >
                  {currentIndex === mcqs.length - 1 ? 'Finish' : 'Next Question'}
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
