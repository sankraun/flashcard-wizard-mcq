
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Brain, RotateCcw, Check, X, Zap, Target, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  next_review_date: string;
  review_count: number;
  correct_count: number;
  ease_factor: number;
  interval_days: number;
}

const FlashcardPractice = () => {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (user) {
      loadFlashcards();
    }
  }, [user]);

  const loadFlashcards = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review_date', new Date().toISOString())
        .order('next_review_date', { ascending: true })
        .limit(20);

      if (error) throw error;

      setFlashcards(data || []);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setReviewStats({ correct: 0, total: 0 });
    } catch (error) {
      console.error('Error loading flashcards:', error);
      toast({
        title: 'Loading Error',
        description: 'Failed to load flashcards for review.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const recordReview = async (wasCorrect: boolean, difficultyRating: 'easy' | 'medium' | 'hard') => {
    const currentCard = flashcards[currentCardIndex];
    if (!currentCard || !user) return;

    try {
      // Record the review
      const { error: reviewError } = await supabase
        .from('flashcard_reviews')
        .insert({
          user_id: user.id,
          flashcard_id: currentCard.id,
          was_correct: wasCorrect,
          difficulty_rating: difficultyRating
        });

      if (reviewError) throw reviewError;

      // Update the flashcard using the spaced repetition function
      const { error: updateError } = await supabase
        .rpc('update_flashcard_review', {
          p_flashcard_id: currentCard.id,
          p_was_correct: wasCorrect,
          p_difficulty_rating: difficultyRating
        });

      if (updateError) throw updateError;

      // Update local stats
      setReviewStats(prev => ({
        correct: prev.correct + (wasCorrect ? 1 : 0),
        total: prev.total + 1
      }));

      // Move to next card or finish session
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        // Session complete
        toast({
          title: 'Session Complete!',
          description: `You reviewed ${flashcards.length} cards. Accuracy: ${Math.round((reviewStats.correct + (wasCorrect ? 1 : 0)) / (reviewStats.total + 1) * 100)}%`
        });
        loadFlashcards(); // Load new cards for review
      }

    } catch (error) {
      console.error('Error recording review:', error);
      toast({
        title: 'Review Error',
        description: 'Failed to record your review.',
        variant: 'destructive'
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Zap className="w-4 h-4" />;
      case 'medium': return <Target className="w-4 h-4" />;
      case 'hard': return <Brain className="w-4 h-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your flashcards...</p>
        </CardContent>
      </Card>
    );
  }

  if (flashcards.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Brain className="w-6 h-6 text-blue-600" />
            No Cards Due for Review
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-slate-600">
            Great job! You're all caught up with your flashcard reviews.
          </p>
          <p className="text-sm text-slate-500">
            Come back later for more spaced repetition practice, or generate new flashcards to study.
          </p>
          <Button onClick={loadFlashcards} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Check Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentCard = flashcards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / flashcards.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Flashcard Practice</h2>
                <p className="text-blue-100">Spaced Repetition Learning</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{currentCardIndex + 1}/{flashcards.length}</div>
              <div className="text-blue-100 text-sm">Cards Remaining</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {reviewStats.total > 0 && (
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl font-bold">{reviewStats.correct}</div>
                <div className="text-blue-100 text-sm">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round((reviewStats.correct / reviewStats.total) * 100)}%</div>
                <div className="text-blue-100 text-sm">Accuracy</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flashcard */}
      <Card className="shadow-xl border-0 bg-white min-h-[400px]">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getDifficultyColor(currentCard.difficulty)}`}>
                {getDifficultyIcon(currentCard.difficulty)}
                {currentCard.difficulty.toUpperCase()}
              </span>
              <div className="text-sm text-slate-500">
                <Timer className="w-4 h-4 inline mr-1" />
                Review #{currentCard.review_count + 1}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 flex flex-col justify-center min-h-[300px]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-4">Question:</h3>
              <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-400">
                <p className="text-xl text-slate-800 leading-relaxed">{currentCard.question}</p>
              </div>
            </div>
            
            {showAnswer && (
              <div className="animate-fade-in">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Answer:</h3>
                <div className="bg-green-50 p-6 rounded-xl border-l-4 border-green-400">
                  <p className="text-xl text-slate-800 leading-relaxed">{currentCard.answer}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-center">
            {!showAnswer ? (
              <Button
                onClick={() => setShowAnswer(true)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold shadow-lg"
              >
                Show Answer
              </Button>
            ) : (
              <div className="space-y-4 w-full">
                <p className="text-center text-slate-600 font-medium">How did you do?</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Button
                      onClick={() => recordReview(false, 'hard')}
                      variant="outline"
                      className="w-full h-12 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Incorrect
                    </Button>
                    <p className="text-xs text-center text-slate-500">Review again soon</p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => recordReview(true, 'medium')}
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Correct
                    </Button>
                    <p className="text-xs text-center text-slate-500">Schedule for later</p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-center text-sm text-slate-600 mb-2">How difficult was this?</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => recordReview(true, 'easy')}
                      variant="outline"
                      size="sm"
                      className="border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Easy
                    </Button>
                    <Button
                      onClick={() => recordReview(true, 'medium')}
                      variant="outline"
                      size="sm"
                      className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                    >
                      <Target className="w-4 h-4 mr-1" />
                      Medium
                    </Button>
                    <Button
                      onClick={() => recordReview(true, 'hard')}
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <Brain className="w-4 h-4 mr-1" />
                      Hard
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlashcardPractice;
