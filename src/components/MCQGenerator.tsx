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
import { Brain, RefreshCw, Wand2, FileText, Scissors, Zap, AlertTriangle } from 'lucide-react';

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
  const [processingStep, setProcessingStep] = useState('');
  const { user } = useAuth();
  const apiKey = 'AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y';

  // Constants for text chunking
  const MAX_CHUNK_SIZE = 3000; // characters
  const OVERLAP_SIZE = 200; // characters for context overlap

  const splitTextIntoChunks = (text: string): string[] => {
    if (text.length <= MAX_CHUNK_SIZE) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + MAX_CHUNK_SIZE;
      
      // If this isn't the last chunk, try to break at a sentence boundary
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + 1000) { // Ensure chunk is not too small
          end = breakPoint + 1;
        }
      }

      chunks.push(text.slice(start, end));
      start = end - OVERLAP_SIZE; // Add overlap for context
    }

    return chunks;
  };

  const generateMCQsForChunk = async (chunk: string, chunkIndex: number, totalChunks: number) => {
    const prompt = `
      Generate 3-5 high-quality multiple choice questions from the following text chunk (${chunkIndex + 1}/${totalChunks}).
      Mode: ${mode === 'basic' ? 'Direct MCQs based on content' : 'Clinical/Applied case-based MCQs'}
      Question Type: ${questionType}
      Difficulty: ${difficulty === 'auto' ? 'Mixed difficulty levels' : difficulty}
      
      Text: ${chunk}
      
      Return a JSON array with this exact structure:
      [
        {
          "question": "Question text here (do NOT include phrases like 'according to the text', 'based on the passage', or similar)",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Detailed explanation of why this is correct",
          "difficulty": "Easy|Medium|Hard"
        }
      ]
      
      Make sure questions are:
      - Clear and unambiguous
      - Based directly on the provided text
      - Do NOT include phrases like 'according to the text', 'based on the passage', 'as per the above', or similar in the question stem
      - Have plausible distractors
      - Include comprehensive explanations (do NOT include phrases like 'according to the text', 'based on the passage', 'as per the above', or similar in the explanation)
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
    
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);
  };

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
      const textChunks = splitTextIntoChunks(inputText.trim());
      let allGeneratedMCQs: any[] = [];

      if (textChunks.length > 1) {
        setProcessingStep(`Processing ${textChunks.length} parts of your text...`);
        
        toast({
          title: "Large Text Detected",
          description: `Your text has been divided into ${textChunks.length} parts for optimal processing`,
        });
      }

      // Process each chunk
      for (let i = 0; i < textChunks.length; i++) {
        setProcessingStep(`Generating MCQs for part ${i + 1} of ${textChunks.length}...`);
        
        try {
          const chunkMCQs = await generateMCQsForChunk(textChunks[i], i, textChunks.length);
          allGeneratedMCQs = [...allGeneratedMCQs, ...chunkMCQs];
          
          // Small delay between requests to avoid rate limiting
          if (i < textChunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error processing chunk ${i + 1}:`, error);
          toast({
            title: "Warning",
            description: `Failed to process part ${i + 1}, continuing with other parts...`,
            variant: "destructive"
          });
        }
      }

      if (allGeneratedMCQs.length === 0) {
        throw new Error('No MCQs could be generated from the provided text');
      }

      setProcessingStep('Saving MCQs to your account...');
      
      // Save MCQs to Supabase
      const mcqsForDB = allGeneratedMCQs.map((mcq: any) => ({
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
        description: `Generated ${allGeneratedMCQs.length} MCQs successfully from ${textChunks.length > 1 ? `${textChunks.length} text parts` : 'your text'}`,
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
      setProcessingStep('');
    }
  };

  const getWordCount = () => {
    return inputText.trim().split(/\s+/).length;
  };

  const getChunkCount = () => {
    if (!inputText.trim()) return 0;
    return splitTextIntoChunks(inputText.trim()).length;
  };

  const isLongText = inputText.length > MAX_CHUNK_SIZE;

  return (
    <Card className="animate-fade-in transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          Generate MCQs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mode" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Mode
            </Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="hover-scale transition-all duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic MCQs</SelectItem>
                <SelectItem value="clinical">Clinical/Applied</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="difficulty" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Difficulty
            </Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="hover-scale transition-all duration-200">
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
          <Label htmlFor="chapter" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Chapter/Topic (optional)
          </Label>
          <Input
            id="chapter"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="e.g., Cardiovascular System"
            className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="input-text" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Study Material
          </Label>
          
          {/* Text stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{getWordCount()} words</span>
            <span>{inputText.length} characters</span>
            {isLongText && (
              <div className="flex items-center gap-1 text-orange-600">
                <Scissors className="w-3 h-3" />
                <span>Will be split into {getChunkCount()} parts</span>
              </div>
            )}
          </div>

          {isLongText && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-orange-800 font-medium">Large text detected</p>
                <p className="text-orange-700">
                  Your text will be automatically divided into {getChunkCount()} parts for optimal processing.
                </p>
              </div>
            </div>
          )}
          
          <Textarea
            id="input-text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your study material here (lectures, textbook content, notes, etc.)..."
            className="min-h-[200px] text-base leading-relaxed transition-all duration-200 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <Button 
          onClick={generateMCQs} 
          disabled={isGenerating || !inputText.trim()}
          variant="default"
          size="lg"
          className="w-full hover-scale mt-2"
        >
          {isGenerating ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{processingStep || 'Generating MCQs...'}</span>
              </div>
            </div>
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
