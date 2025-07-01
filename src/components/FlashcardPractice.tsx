
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, RotateCcw, Check, X, Clock, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  source_text: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const FlashcardPractice = () => {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDueFlashcards();
    }
  }, [user]);

  const fetchDueFlashcards = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user?.id)
        .lte('next_review_date', new Date().toISOString())
        .order('next_review_date', { ascending: true })
        .limit(20);

      if (error) throw error;

      setFlashcards(data?.map(card => ({
        ...card,
        difficulty: card.difficulty as 'easy' | 'medium' | 'hard'
      })) || []);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load flashcards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (wasCorrect: boolean, difficulty: 'easy' | 'medium' | 'hard') => {
    const currentCard = flashcards[currentIndex];
    
    try {
      // Record the review
      await supabase
        .from('flashcard_reviews')
        .insert({
          user_id: user?.id,
          flashcard_id: currentCard.id,
          was_correct: wasCorrect,
          difficulty_rating: difficulty,
        });

      // Update flashcard using the spaced repetition function
      await supabase.rpc('update_flashcard_review', {
        p_flashcard_id: currentCard.id,
        p_was_correct: wasCorrect,
        p_difficulty_rating: difficulty,
      });

      // Move to next card or end session
      if (currentIndex + 1 >= flashcards.length) {
        setSessionComplete(true);
      } else {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      }
    } catch (error) {
      console.error('Error updating flashcard:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flashcard progress',
        variant: 'destructive',
      });
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setSessionComplete(false);
    fetchDueFlashcards();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <Card className="h-96">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
                <p className="text-slate-500">Loading flashcards...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-center py-12">
          <CardContent>
            <Target className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-semibold mb-2">No flashcards due for review</h3>
            <p className="text-slate-500 mb-6">
              Great job! All your flashcards are up to date. Come back later for your next review session.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Check Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Session Complete!</h3>
            <p className="text-slate-500 mb-6">
              You've reviewed {flashcards.length} flashcards. Great work on your learning journey!
            </p>
            <Button onClick={resetSession} className="bg-blue-600 hover:bg-blue-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              Start New Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progressPercentage = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-slate-900">Flashcard Practice</h2>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-500">
              {currentIndex + 1} of {flashcards.length}
            </span>
          </div>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <Card className="mb-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Question</CardTitle>
            <Badge variant="secondary" className="capitalize">
              {currentCard.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg font-medium text-slate-900 leading-relaxed">
            {currentCard.question}
          </div>

          {showAnswer && (
            <div className="border-t pt-6 animate-slide-up">
              <h4 className="font-semibold text-slate-700 mb-2">Answer:</h4>
              <div className="text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-lg">
                {currentCard.answer}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!showAnswer ? (
              <Button 
                onClick={() => setShowAnswer(true)}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                Show Answer
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => handleAnswer(false, 'hard')}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Hard
                </Button>
                <Button
                  onClick={() => handleAnswer(true, 'medium')}
                  variant="outline"
                  className="flex-1 border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                >
                  Medium
                </Button>
                <Button
                  onClick={() => handleAnswer(true, 'easy')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Easy
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{currentCard.review_count}</div>
            <div className="text-sm text-slate-500">Reviews</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {currentCard.review_count > 0 
                ? Math.round((currentCard.correct_count / currentCard.review_count) * 100)
                : 0}%
            </div>
            <div className="text-sm text-slate-500">Accuracy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{currentCard.interval_days}</div>
            <div className="text-sm text-slate-500">Days Interval</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FlashcardPractice;
