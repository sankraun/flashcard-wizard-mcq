
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, RefreshCw, Wand2 } from 'lucide-react';

interface MCQGeneratorProps {
  onMCQsGenerated: () => void;
}

const MCQGenerator = ({ onMCQsGenerated }: MCQGeneratorProps) => {
  const [inputText, setInputText] = useState('');
  const [chapter, setChapter] = useState('');
  const [difficulty, setDifficulty] = useState('auto');
  const [questionType, setQuestionType] = useState('single');
  const [mode, setMode] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const apiKey = 'AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y';

  const generateMCQs = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to generate MCQs",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to generate MCQs",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const prompt = `
        Generate as many high-quality multiple choice questions as reasonably possible from the following text, based on its length and content. 
        Mode: ${mode === 'basic' ? 'Direct MCQs based on content' : 'Clinical/Applied case-based MCQs'}
        Question Type: ${questionType}
        Difficulty: ${difficulty === 'auto' ? 'Mixed difficulty levels' : difficulty}
        
        Text: ${inputText}
        
        Return a JSON array with this exact structure:
        [
          {
            "question": "Question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Detailed explanation of why this is correct",
            "difficulty": "Easy|Medium|Hard"
          }
        ]
        
        Make sure questions are:
        - Clear and unambiguous
        - Based directly on the provided text
        - Have plausible distractors
        - Include comprehensive explanations
        ${mode === 'clinical' ? '- Focus on practical application and case scenarios' : ''}
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const generatedMCQs = JSON.parse(jsonMatch[0]);
      
      // Save MCQs to Supabase
      const mcqsForDB = generatedMCQs.map((mcq: any) => ({
        user_id: user.id,
        question: mcq.question,
        options: mcq.options,
        correct_answer: mcq.correctAnswer,
        explanation: mcq.explanation,
        difficulty: mcq.difficulty,
        question_type: questionType,
        chapter: chapter || null,
        original_text: inputText
      }));

      const { error } = await supabase
        .from('mcqs')
        .insert(mcqsForDB);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Generated ${generatedMCQs.length} MCQs successfully`,
      });

      // Clear form
      setInputText('');
      setChapter('');
      
      // Notify parent component
      onMCQsGenerated();

    } catch (error) {
      console.error('Error generating MCQs:', error);
      toast({
        title: "Error",
        description: "Failed to generate MCQs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Generate MCQs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic MCQs</SelectItem>
                <SelectItem value="clinical">Clinical/Applied</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Mixed</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chapter">Chapter/Topic (optional)</Label>
          <Input
            id="chapter"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="e.g., Cardiovascular System"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="input-text">Study Material</Label>
          <Textarea
            id="input-text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your study material here (lectures, textbook content, notes, etc.)..."
            className="min-h-[200px] text-base leading-relaxed"
          />
        </div>
        
        <Button 
          onClick={generateMCQs} 
          disabled={isGenerating || !inputText.trim()}
          className="w-full hover-scale"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating MCQs...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate MCQs
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MCQGenerator;
