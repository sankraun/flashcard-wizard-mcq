
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Clock, Target, Trophy, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GamificationTabs from '@/components/GamificationTabs';
import { useGamification } from '@/hooks/useGamification';

interface MCQ {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: string;
  chapter?: string;
}

const EnhancedMCQPractice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateUserStats } = useGamification();
  
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionStats, setSessionStats] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    sessionDuration: 0
  });
  const [practiceMode, setPracticeMode] = useState<'normal' | 'timed' | 'infinite'>('normal');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showGamification, setShowGamification] = useState(false);

  useEffect(() => {
    fetchMCQs();
    setStartTime(new Date());
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (practiceMode === 'timed' && timeRemaining !== null && timeRemaining > 0 && !showExplanation) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [practiceMode, timeRemaining, showExplanation]);

  useEffect(() => {
    if (practiceMode === 'timed' && timeRemaining === 0 && !showExplanation) {
      handleTimeUp();
    }
  }, [timeRemaining, showExplanation]);

  const fetchMCQs = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mcqs')
      .select('*')
      .eq('user_id', user.id)
      .limit(20);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch MCQs. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (data && data.length > 0) {
      // Convert the data to match our interface
      const convertedMcqs = data.map(mcq => ({
        ...mcq,
        options: Array.isArray(mcq.options) ? mcq.options : JSON.parse(mcq.options as string),
        chapter: mcq.chapter || undefined
      }));
      setMcqs(convertedMcqs);
      setAnswers(new Array(convertedMcqs.length).fill(null));
      if (practiceMode === 'timed') {
        setTimeRemaining(30); // 30 seconds per question
      }
    } else {
      toast({
        title: "No MCQs Found",
        description: "Please generate some MCQs first from the main page.",
        variant: "destructive",
      });
      navigate('/');
    }
  };

  const handleTimeUp = () => {
    setSelectedAnswer(null);
    setShowExplanation(true);
    
    const newAnswers = [...answers];
    newAnswers[currentIndex] = null;
    setAnswers(newAnswers);
    
    setSessionStats(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1
    }));
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);
    
    const isCorrect = answerIndex === mcqs[currentIndex].correct_answer;
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setSessionStats(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
    }));
  };

  const handleNext = () => {
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      
      if (practiceMode === 'timed') {
        setTimeRemaining(30);
      }
    } else {
      handleSessionComplete();
    }
  };

  const handleSessionComplete = async () => {
    if (!startTime) return;
    
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    const finalStats = {
      questionsAnswered: sessionStats.questionsAnswered,
      correctAnswers: sessionStats.correctAnswers,
      sessionDuration: duration
    };
    
    await updateUserStats(finalStats);
    
    toast({
      title: "🎉 Practice Session Complete!",
      description: `Score: ${sessionStats.correctAnswers}/${sessionStats.questionsAnswered} (${Math.round((sessionStats.correctAnswers / sessionStats.questionsAnswered) * 100)}%)`,
      duration: 5000,
    });
    
    setShowGamification(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPracticeModeIcon = (mode: string) => {
    switch (mode) {
      case 'timed': return <Clock className="w-4 h-4" />;
      case 'infinite': return <Zap className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (showGamification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Great Job!</h1>
              <p className="text-gray-600">
                You completed {sessionStats.questionsAnswered} questions with {Math.round((sessionStats.correctAnswers / sessionStats.questionsAnswered) * 100)}% accuracy
              </p>
            </div>
          </div>
          
          <GamificationTabs />
          
          <div className="mt-6 text-center">
            <Button
              onClick={() => window.location.reload()}
              className="mr-4"
            >
              Practice Again
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mcqs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading practice questions...</p>
        </div>
      </div>
    );
  }

  const currentMCQ = mcqs[currentIndex];
  const progress = ((currentIndex + 1) / mcqs.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          {/* Practice Mode Selector */}
          <div className="flex gap-2 mb-4">
            {[
              { mode: 'normal', label: 'Normal Practice', icon: <Target className="w-4 h-4" /> },
              { mode: 'timed', label: 'Timed Practice', icon: <Clock className="w-4 h-4" /> },
              { mode: 'infinite', label: 'Infinite Mode', icon: <Zap className="w-4 h-4" /> }
            ].map(({ mode, label, icon }) => (
              <Button
                key={mode}
                onClick={() => setPracticeMode(mode as any)}
                variant={practiceMode === mode ? 'default' : 'outline'}
                size="sm"
                className="flex items-center gap-2"
              >
                {icon}
                {label}
              </Button>
            ))}
          </div>

          {/* Progress and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Score</p>
                    <p className="text-xl font-bold">{score}/{mcqs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <p className="text-xl font-bold">{currentIndex + 1}/{mcqs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Badge className={`text-white ${getDifficultyColor(currentMCQ.difficulty)}`}>
                    {currentMCQ.difficulty}
                  </Badge>
                  <div>
                    <p className="text-sm text-gray-600">Difficulty</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {practiceMode === 'timed' && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600">Time Left</p>
                      <p className={`text-xl font-bold ${timeRemaining && timeRemaining <= 10 ? 'text-red-500' : ''}`}>
                        {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <Progress value={progress} className="h-3" />
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">
                Question {currentIndex + 1}
              </CardTitle>
              {currentMCQ.chapter && (
                <Badge variant="outline">{currentMCQ.chapter}</Badge>
              )}
            </div>
            <CardDescription className="text-base text-gray-800 leading-relaxed">
              {currentMCQ.question}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentMCQ.options.map((option, index) => {
                let buttonClass = "w-full text-left p-4 rounded-lg border transition-all ";
                
                if (showExplanation) {
                  if (index === currentMCQ.correct_answer) {
                    buttonClass += "bg-green-100 border-green-300 text-green-800";
                  } else if (index === selectedAnswer && index !== currentMCQ.correct_answer) {
                    buttonClass += "bg-red-100 border-red-300 text-red-800";
                  } else {
                    buttonClass += "bg-gray-50 border-gray-200 text-gray-600";
                  }
                } else {
                  if (selectedAnswer === index) {
                    buttonClass += "bg-blue-100 border-blue-300 text-blue-800";
                  } else {
                    buttonClass += "bg-white border-gray-200 hover:bg-gray-50 text-gray-800";
                  }
                }

                return (
                  <Button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={buttonClass}
                    disabled={showExplanation}
                    variant="ghost"
                  >
                    <span className="font-medium mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </Button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
                <p className="text-blue-800">{currentMCQ.explanation}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            variant="outline"
          >
            Previous
          </Button>

          {showExplanation && (
            <Button onClick={handleNext}>
              {currentIndex === mcqs.length - 1 ? 'Finish Practice' : 'Next Question'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedMCQPractice;
