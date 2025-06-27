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
import { incrementGeminiUsage } from '@/lib/geminiUsage';

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

  const generateChapterName = async (text: string): Promise<string> => {
    const prompt = `
      Analyze the following text and suggest a concise, descriptive chapter/topic name (maximum 4-5 words).
      The name should reflect the main subject or theme of the content.
      
      Text: ${text.substring(0, 1000)}...
      
      Return only the chapter/topic name, nothing else.
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              text: prompt,
            },
          ],
        }),
      });
      // --- Gemini Usage Tracking ---
      // Estimate tokens used: input + output (rough estimate)
      const inputTokens = prompt.length / 4; // 1 token ≈ 4 chars (rough)
      const outputTokens = 50; // maxOutputTokens or estimate
      incrementGeminiUsage(Math.round(inputTokens + outputTokens));

      if (!response.ok) {
        throw new Error('Failed to generate chapter name');
      }

      const data = await response.json();
      const suggestedName = data.candidates[0].content.parts[0].text.trim();
      
      // Clean up the response and ensure it's reasonable
      return suggestedName.replace(/['"]/g, '').substring(0, 50);
    } catch (error) {
      console.error('Error generating chapter name:', error);
      // Fallback to a generic name based on content analysis
      const words = text.toLowerCase().split(/\s+/);
      const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
      const significantWords = words.filter(word => word.length > 3 && !commonWords.includes(word));
      
      if (significantWords.length > 0) {
        return significantWords.slice(0, 2).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
      
      return 'Study Material';
    }
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
    // --- Gemini Usage Tracking ---
    // Estimate tokens used: input + output (rough estimate)
    const inputTokens = chunk.length / 4; // 1 token ≈ 4 chars (rough)
    const outputTokens = 2048; // maxOutputTokens or estimate
    incrementGeminiUsage(Math.round(inputTokens + outputTokens));

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
      // Generate chapter name if not provided
      let finalChapterName = chapter.trim();
      if (!finalChapterName) {
        setProcessingStep('Analyzing content to suggest topic name...');
        finalChapterName = await generateChapterName(inputText);
        toast({
          title: "Topic Auto-Generated",
          description: `Assigned topic: "${finalChapterName}"`,
        });
      }

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
        chapter: finalChapterName,
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
    <Card className="shadow-none border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="border-b pb-4 mb-2 bg-white/80 sticky top-0 z-10">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Brain className="w-5 h-5 text-blue-600" />
          Generate MCQs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mode" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Zap className="w-4 h-4 text-yellow-500" />
              Mode
            </Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic MCQs</SelectItem>
                <SelectItem value="clinical">Clinical/Applied</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Brain className="w-4 h-4 text-blue-600" />
              Difficulty
            </Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
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
          <Label htmlFor="chapter" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FileText className="w-4 h-4 text-blue-600" />
            Chapter/Topic (optional - will be auto-generated if empty)
          </Label>
          <Input
            id="chapter"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="e.g., Cardiovascular System (leave empty for auto-suggestion)"
            className="rounded-lg border border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="input-text" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FileText className="w-4 h-4 text-blue-600" />
            Study Material
          </Label>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{getWordCount()} words</span>
            <span>{inputText.length} chars</span>
            {isLongText && (
              <span className="flex items-center gap-1 text-orange-600">
                <Scissors className="w-3 h-3" />
                {getChunkCount()} parts
              </span>
            )}
          </div>
          {isLongText && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
              <div className="text-xs text-orange-800 font-medium">
                Large text detected. Your text will be split for optimal processing.
              </div>
            </div>
          )}
          <Textarea
            id="input-text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your study material here..."
            className="min-h-[160px] rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          />
        </div>
        <Button 
          onClick={generateMCQs} 
          disabled={isGenerating || !inputText.trim()}
          variant="default"
          size="lg"
          className="w-full rounded-lg text-base font-semibold flex items-center justify-center gap-2 mt-2"
        >
          {isGenerating ? (
            <>
              <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              {processingStep || 'Generating MCQs...'}
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5 text-blue-600" />
              Generate MCQs
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MCQGenerator;
