
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Shuffle, RotateCcw, CheckCircle, XCircle, Eye, EyeOff, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string | null;
  original_text: string | null;
  created_at: string;
  updated_at: string;
}

const FlashcardPractice = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [practiceStats, setPracticeStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  });
  const [showResults, setShowResults] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadFlashcards();
    }
  }, [user]);

  const loadFlashcards = async (showRefreshToast = false) => {
    try {
      console.log('Loading flashcards for practice, user:', user?.id);
      
      if (showRefreshToast) {
        setRefreshing(true);
      }

      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('Practice flashcards query result:', { data, error });

      if (error) throw error;

      setFlashcards(data || []);
      if (data && data.length > 0) {
        shuffleFlashcards(data);
      }
      
      if (showRefreshToast) {
        toast({
          title: "Refreshed",
          description: `Loaded ${data?.length || 0} flashcards for practice`
        });
      }
    } catch (error) {
      console.error('Error loading flashcards:', error);
      toast({
        title: "Error",
        description: "Failed to load flashcards",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const shuffleFlashcards = (cards: Flashcard[]) => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setPracticeStats({ correct: 0, incorrect: 0, total: 0 });
    setShowResults(false);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (isCorrect: boolean) => {
    const newStats = {
      ...practiceStats,
      correct: practiceStats.correct + (isCorrect ? 1 : 0),
      incorrect: practiceStats.incorrect + (isCorrect ? 0 : 1),
      total: practiceStats.total + 1
    };
    setPracticeStats(newStats);

    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setShowResults(true);
    }
  };

  const resetPractice = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setPracticeStats({ correct: 0, incorrect: 0, total: 0 });
    setShowResults(false);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const goToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading flashcards...</div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Practice Flashcards</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground">
            Please log in to practice flashcards
          </div>
        </CardContent>
      </Card>
    );
  }

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Practice Flashcards</span>
            <Button
              onClick={() => loadFlashcards(true)}
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground mb-4">
            No flashcards available for practice
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Create some flashcards from your notes first
          </p>
          <Button
            onClick={() => loadFlashcards(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Check for new flashcards
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const accuracy = practiceStats.total > 0 ? Math.round((practiceStats.correct / practiceStats.total) * 100) : 0;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Practice Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{practiceStats.correct}</div>
              <div className="text-sm text-green-600">Correct</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{practiceStats.incorrect}</div>
              <div className="text-sm text-red-600">Incorrect</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
              <div className="text-sm text-blue-600">Accuracy</div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={resetPractice} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Practice Again
            </Button>
            <Button onClick={() => shuffleFlashcards(flashcards)} className="flex items-center gap-2">
              <Shuffle className="w-4 h-4" />
              Shuffle & Restart
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress and Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Card {currentIndex + 1} of {flashcards.length}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-600">✓ {practiceStats.correct}</span>
                <span className="text-red-600">✗ {practiceStats.incorrect}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => loadFlashcards(true)}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => shuffleFlashcards(flashcards)} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Shuffle
              </Button>
              <Button onClick={resetPractice} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Flashcard */}
      <Card className="min-h-[400px] cursor-pointer" onClick={handleFlip}>
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              {currentCard.category || 'General'}
            </span>
            <Button 
              onClick={(e) => { e.stopPropagation(); handleFlip(); }}
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2"
            >
              {isFlipped ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isFlipped ? 'Show Front' : 'Show Back'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-4 uppercase tracking-wide">
              {isFlipped ? 'BACK' : 'FRONT'}
            </div>
            <div className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed">
              {isFlipped ? currentCard.back : currentCard.front}
            </div>
          </div>
          
          {!isFlipped && (
            <div className="mt-8 text-sm text-gray-500">
              Click to reveal answer
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation and Answer Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Navigation */}
        <div className="flex justify-between flex-1">
          <Button 
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <Button 
            onClick={goToNext}
            disabled={currentIndex === flashcards.length - 1}
            variant="outline"
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Answer Buttons - Only show when flipped */}
        {isFlipped && (
          <div className="flex gap-4 sm:ml-4">
            <Button 
              onClick={() => handleAnswer(false)}
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" />
              Incorrect
            </Button>
            <Button 
              onClick={() => handleAnswer(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Correct
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardPractice;
