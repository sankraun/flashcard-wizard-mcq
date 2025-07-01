
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Brain, Zap, BookOpen, Target, Sparkles } from 'lucide-react';
import { incrementGeminiUsage } from '@/lib/geminiUsage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const GEMINI_API_KEY = 'AIzaSyC2B0CGruME7Z5AVq7uU8oXzTej5ZiTFaM';

interface FlashcardData {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const FlashcardGenerator = () => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<FlashcardData[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const generateFlashcards = async () => {
    if (!inputText.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please paste some text to generate flashcards.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedCards([]);

    try {
      const prompt = `Create comprehensive flashcards from the following text. Generate questions that test understanding, not just memorization. Include different difficulty levels.

Rules:
- Create 8-15 flashcards total
- Mix of difficulty levels: easy (basic facts), medium (concepts), hard (analysis/application)
- Questions should be clear and specific
- Answers should be comprehensive but concise
- Cover the most important points from the text
- Return JSON format: [{"question": "string", "answer": "string", "difficulty": "easy|medium|hard"}]

Text: ${inputText}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 0.9,
              maxOutputTokens: 2048
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }

      const data = await response.json();
      const flashcardsText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Track API usage
      const inputTokens = inputText.length / 4;
      const outputTokens = 2048;
      incrementGeminiUsage(Math.round(inputTokens + outputTokens));

      // Parse the JSON response
      let flashcardsJson: FlashcardData[] = [];
      try {
        const jsonMatch = flashcardsText.match(/\[.*\]/s);
        if (jsonMatch) {
          let jsonString = jsonMatch[0];
          jsonString = jsonString.replace(/,\s*([\]\}])/g, '$1');
          flashcardsJson = JSON.parse(jsonString);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Failed to parse AI response. Please try again.');
      }

      if (!Array.isArray(flashcardsJson) || flashcardsJson.length === 0) {
        throw new Error('No flashcards were generated. Please try with different text.');
      }

      // Validate and clean the flashcards
      const validFlashcards = flashcardsJson.filter(card => 
        card.question && 
        card.answer && 
        ['easy', 'medium', 'hard'].includes(card.difficulty)
      );

      if (validFlashcards.length === 0) {
        throw new Error('Generated flashcards were invalid. Please try again.');
      }

      setGeneratedCards(validFlashcards);
      toast({
        title: 'Success!',
        description: `Generated ${validFlashcards.length} flashcards ready for study.`
      });

    } catch (error: any) {
      console.error('Flashcard generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate flashcards. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveFlashcards = async () => {
    if (!user || generatedCards.length === 0) return;

    setIsSaving(true);
    
    try {
      const flashcardsToInsert = generatedCards.map(card => ({
        user_id: user.id,
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        source_text: inputText.slice(0, 500), // Store first 500 chars as reference
        next_review_date: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert);

      if (error) throw error;

      toast({
        title: 'Flashcards Saved!',
        description: `${generatedCards.length} flashcards added to your study collection.`
      });

      // Clear the form
      setInputText('');
      setGeneratedCards([]);

    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save flashcards. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Generator Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 bg-white/20 rounded-lg">
              <Brain className="w-6 h-6" />
            </div>
            Smart Flashcard Generator
          </CardTitle>
          <p className="text-blue-100 mt-2">Transform any text into intelligent study flashcards with spaced repetition</p>
        </CardHeader>
        
        <CardContent className="space-y-6 p-8">
          <div className="space-y-3">
            <Label htmlFor="flashcard-input" className="flex items-center gap-2 text-lg font-semibold text-slate-700">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Study Material
            </Label>
            <Textarea
              id="flashcard-input"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Paste your study material, lecture notes, textbook content, or any educational text here..."
              className="min-h-[160px] border-2 border-slate-200 focus:border-blue-500 transition-colors resize-none text-base"
            />
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={generateFlashcards}
              disabled={isGenerating || !inputText.trim()}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span>Generating Smart Cards...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5" />
                  <span>Generate Flashcards</span>
                </div>
              )}
            </Button>

            {generatedCards.length > 0 && (
              <Button
                onClick={saveFlashcards}
                disabled={isSaving}
                className="h-12 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 shadow-lg transition-all duration-200"
              >
                {isSaving ? 'Saving...' : 'Save All Cards'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generated Flashcards Preview */}
      {generatedCards.length > 0 && (
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold text-slate-800">Generated Flashcards</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="bg-white px-3 py-1 rounded-full border">{generatedCards.length} cards</span>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map(level => {
                    const count = generatedCards.filter(card => card.difficulty === level).length;
                    return count > 0 ? (
                      <span key={level} className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(level)}`}>
                        {count} {level}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {generatedCards.map((card, index) => (
                <div key={index} className="border-2 border-slate-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-slate-50">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getDifficultyColor(card.difficulty)}`}>
                        {getDifficultyIcon(card.difficulty)}
                        {card.difficulty.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2">Question:</h4>
                      <p className="text-slate-800 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                        {card.question}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-2">Answer:</h4>
                      <p className="text-slate-800 bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                        {card.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlashcardGenerator;
