
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Brain, 
  Zap, 
  FileText, 
  Presentation, 
  Send,
  Sparkles,
  BookOpen,
  Target,
  Scissors,
  AlertTriangle
} from 'lucide-react';
import { incrementGeminiUsage } from '@/lib/geminiUsage';

interface UnifiedGeneratorProps {
  onContentGenerated: () => void;
}

const UnifiedGenerator = ({ onContentGenerated }: UnifiedGeneratorProps) => {
  const [inputText, setInputText] = useState('');
  const [outputType, setOutputType] = useState<'mcq' | 'notes' | 'flashcards' | 'powerpoint'>('mcq');
  const [chapter, setChapter] = useState('');
  const [difficulty, setDifficulty] = useState('auto');
  const [questionType, setQuestionType] = useState('single');
  const [mode, setMode] = useState('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const { user } = useAuth();

  const MAX_CHUNK_SIZE = 3000;
  const OVERLAP_SIZE = 200;

  const splitTextIntoChunks = (text: string): string[] => {
    if (text.length <= MAX_CHUNK_SIZE) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + MAX_CHUNK_SIZE;
      
      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);
        
        if (breakPoint > start + 1000) {
          end = breakPoint + 1;
        }
      }

      chunks.push(text.slice(start, end));
      start = end - OVERLAP_SIZE;
    }

    return chunks;
  };

  const generateContent = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to generate content",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to generate content",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setProcessingStep(`Generating ${outputType}...`);

    try {
      switch (outputType) {
        case 'mcq':
          await generateMCQs();
          break;
        case 'notes':
          await generateNotes();
          break;
        case 'flashcards':
          await generateFlashcards();
          break;
        case 'powerpoint':
          await generatePowerpoint();
          break;
        default:
          throw new Error('Invalid output type selected');
      }

      toast({
        title: "Success!",
        description: `${outputType.toUpperCase()} generated successfully`,
      });

      setInputText('');
      setChapter('');
      onContentGenerated();

    } catch (error: any) {
      console.error(`Error generating ${outputType}:`, error);
      toast({
        title: "Generation Failed",
        description: error.message || `Failed to generate ${outputType}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setProcessingStep('');
    }
  };

  const generateMCQs = async () => {
    const apiKey = 'AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y';
    
    // Generate chapter name if not provided
    let finalChapterName = chapter.trim();
    if (!finalChapterName) {
      setProcessingStep('Analyzing content to suggest topic name...');
      finalChapterName = await generateChapterName(inputText);
    }

    const textChunks = splitTextIntoChunks(inputText.trim());
    let allGeneratedMCQs: any[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      setProcessingStep(`Generating MCQs for part ${i + 1} of ${textChunks.length}...`);
      
      const prompt = `
        Generate 3-5 high-quality multiple choice questions from the following text.
        Mode: ${mode === 'basic' ? 'Direct MCQs based on content' : 'Clinical/Applied case-based MCQs'}
        Question Type: ${questionType}
        Difficulty: ${difficulty === 'auto' ? 'Mixed difficulty levels' : difficulty}
        
        Text: ${textChunks[i]}
        
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
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      const inputTokens = textChunks[i].length / 4;
      const outputTokens = 2048;
      incrementGeminiUsage(Math.round(inputTokens + outputTokens));

      if (!response.ok) throw new Error(`API request failed: ${response.status}`);

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No valid JSON found in response');

      const chunkMCQs = JSON.parse(jsonMatch[0]);
      allGeneratedMCQs = [...allGeneratedMCQs, ...chunkMCQs];

      if (i < textChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Save MCQs to database
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

    const { error } = await supabase.from('mcqs').insert(mcqsForDB);
    if (error) throw error;
  };

  const generateChapterName = async (text: string): Promise<string> => {
    const apiKey = 'AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y';
    const prompt = `
      Analyze the following text and suggest a concise, descriptive chapter/topic name (maximum 4-5 words).
      The name should reflect the main subject or theme of the content.
      
      Text: ${text.substring(0, 1000)}...
      
      Return only the chapter/topic name, nothing else.
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      const inputTokens = prompt.length / 4;
      const outputTokens = 50;
      incrementGeminiUsage(Math.round(inputTokens + outputTokens));

      if (!response.ok) throw new Error('Failed to generate chapter name');

      const data = await response.json();
      const suggestedName = data.candidates[0].content.parts[0].text.trim();
      
      return suggestedName.replace(/['"]/g, '').substring(0, 50);
    } catch (error) {
      console.error('Error generating chapter name:', error);
      return 'Study Material';
    }
  };

  const generateNotes = async () => {
    const apiKey = 'AIzaSyC2B0CGruME7Z5AVq7uU8oXzTej5ZiTFaM';
    
    const prompt = `
      Create comprehensive, well-structured study notes from the following text. 
      
      Guidelines:
      - Use clear headings and subheadings
      - Include bullet points for key concepts
      - Highlight important terms and definitions
      - Organize information logically
      - Make it suitable for studying and review
      
      Text: ${inputText}
      
      Format the response as structured notes with proper formatting.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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
    });

    const inputTokens = inputText.length / 4;
    const outputTokens = 2048;
    incrementGeminiUsage(Math.round(inputTokens + outputTokens));

    if (!response.ok) throw new Error('Failed to generate notes');

    const data = await response.json();
    const notesContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const title = chapter || 'Generated Notes';
    
    const { error } = await supabase.from('notes').insert({
      user_id: user.id,
      title,
      content: notesContent,
      original_text: inputText
    });

    if (error) throw error;
  };

  const generateFlashcards = async () => {
    const apiKey = 'AIzaSyC2B0CGruME7Z5AVq7uU8oXzTej5ZiTFaM';
    
    const prompt = `Create comprehensive flashcards from the following text. Generate questions that test understanding, not just memorization. Include different difficulty levels.

Rules:
- Create 8-15 flashcards total
- Mix of difficulty levels: easy (basic facts), medium (concepts), hard (analysis/application)
- Questions should be clear and specific
- Answers should be comprehensive but concise
- Cover the most important points from the text
- Return JSON format: [{"question": "string", "answer": "string", "difficulty": "easy|medium|hard"}]

Text: ${inputText}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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
    });

    const inputTokens = inputText.length / 4;
    const outputTokens = 2048;
    incrementGeminiUsage(Math.round(inputTokens + outputTokens));

    if (!response.ok) throw new Error('Failed to generate flashcards');

    const data = await response.json();
    const flashcardsText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let flashcardsJson: any[] = [];
    try {
      const jsonMatch = flashcardsText.match(/\[.*\]/s);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];
        jsonString = jsonString.replace(/,\s*([\]\}])/g, '$1');
        flashcardsJson = JSON.parse(jsonString);
      }
    } catch (parseError) {
      throw new Error('Failed to parse AI response. Please try again.');
    }

    if (!Array.isArray(flashcardsJson) || flashcardsJson.length === 0) {
      throw new Error('No flashcards were generated. Please try with different text.');
    }

    const validFlashcards = flashcardsJson.filter(card => 
      card.question && 
      card.answer && 
      ['easy', 'medium', 'hard'].includes(card.difficulty)
    );

    if (validFlashcards.length === 0) {
      throw new Error('Generated flashcards were invalid. Please try again.');
    }

    const flashcardsToInsert = validFlashcards.map(card => ({
      user_id: user.id,
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty,
      source_text: inputText.slice(0, 500),
      next_review_date: new Date().toISOString(),
    }));

    const { error } = await supabase.from('flashcards').insert(flashcardsToInsert);
    if (error) throw error;
  };

  const generatePowerpoint = async () => {
    const apiKey = 'AIzaSyC2B0CGruME7Z5AVq7uU8oXzTej5ZiTFaM';
    
    const prompt = `Create a comprehensive PowerPoint presentation from the following text. Structure it with clear slides and content.

Format as JSON with this structure:
{
  "title": "Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "content": ["Bullet point 1", "Bullet point 2", "..."]
    }
  ]
}

Guidelines:
- Create 5-10 slides
- Each slide should have 3-5 bullet points
- Include an introduction and conclusion slide
- Make content clear and concise
- Focus on key concepts and important information

Text: ${inputText}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
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
    });

    const inputTokens = inputText.length / 4;
    const outputTokens = 2048;
    incrementGeminiUsage(Math.round(inputTokens + outputTokens));

    if (!response.ok) throw new Error('Failed to generate presentation');

    const data = await response.json();
    const presentationText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let presentationJson: any;
    try {
      const jsonMatch = presentationText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        presentationJson = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      throw new Error('Failed to parse presentation data. Please try again.');
    }

    if (!presentationJson || !presentationJson.slides) {
      throw new Error('No valid presentation data generated. Please try again.');
    }

    const { error } = await supabase.from('powerpoint_presentations').insert({
      user_id: user.id,
      title: presentationJson.title || chapter || 'Generated Presentation',
      content: presentationJson
    });

    if (error) throw error;
  };

  const getWordCount = () => {
    return inputText.trim().split(/\s+/).length;
  };

  const getChunkCount = () => {
    if (!inputText.trim()) return 0;
    return splitTextIntoChunks(inputText.trim()).length;
  };

  const isLongText = inputText.length > MAX_CHUNK_SIZE;

  const getOutputTypeIcon = () => {
    switch (outputType) {
      case 'mcq': return <Brain className="w-5 h-5 text-blue-600" />;
      case 'notes': return <FileText className="w-5 h-5 text-green-600" />;
      case 'flashcards': return <Target className="w-5 h-5 text-purple-600" />;
      case 'powerpoint': return <Presentation className="w-5 h-5 text-orange-600" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getOutputTypeColor = () => {
    switch (outputType) {
      case 'mcq': return 'from-blue-600 to-indigo-600';
      case 'notes': return 'from-green-600 to-emerald-600';
      case 'flashcards': return 'from-purple-600 to-violet-600';
      case 'powerpoint': return 'from-orange-600 to-red-600';
      default: return 'from-blue-600 to-indigo-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Study Assistant</h1>
        <p className="text-gray-600">Transform your study material into interactive learning content</p>
      </div>

      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-8 space-y-6">
          {/* Output Type Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-lg font-semibold text-gray-700">
              <Sparkles className="w-5 h-5 text-blue-600" />
              What would you like to generate?
            </Label>
            <Select value={outputType} onValueChange={(value: any) => setOutputType(value)}>
              <SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-600" />
                    <span>Multiple Choice Questions</span>
                  </div>
                </SelectItem>
                <SelectItem value="notes">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span>Study Notes</span>
                  </div>
                </SelectItem>
                <SelectItem value="flashcards">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span>Flashcards</span>
                  </div>
                </SelectItem>
                <SelectItem value="powerpoint">
                  <div className="flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-orange-600" />
                    <span>PowerPoint Presentation</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Options for MCQs */}
          {outputType === 'mcq' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Mode</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic MCQs</SelectItem>
                    <SelectItem value="clinical">Clinical/Applied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="bg-white">
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
          )}

          {/* Chapter/Topic Input */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium text-gray-700">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Chapter/Topic (optional - will be auto-generated if empty)
            </Label>
            <Input
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="e.g., Cardiovascular System, Machine Learning Basics"
              className="h-12 text-base border-2 border-gray-200 focus:border-blue-500"
            />
          </div>

          {/* Main Input Area */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium text-gray-700">
              <FileText className="w-4 h-4 text-blue-600" />
              Study Material
            </Label>
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
              <span>{getWordCount()} words</span>
              <span>{inputText.length} characters</span>
              {isLongText && (
                <span className="flex items-center gap-1 text-orange-600">
                  <Scissors className="w-3 h-3" />
                  {getChunkCount()} parts
                </span>
              )}
            </div>
            {isLongText && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg mb-3">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                <div className="text-xs text-orange-800 font-medium">
                  Large text detected. Your text will be split for optimal processing.
                </div>
              </div>
            )}
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your study material here..."
              className="min-h-[200px] text-base border-2 border-gray-200 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateContent}
            disabled={isGenerating || !inputText.trim()}
            className={`w-full h-14 text-lg font-semibold bg-gradient-to-r ${getOutputTypeColor()} hover:opacity-90 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02]`}
          >
            {isGenerating ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-start">
                  <span>{processingStep || `Generating ${outputType}...`}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {getOutputTypeIcon()}
                <span>Generate {outputType === 'mcq' ? 'MCQs' : outputType === 'powerpoint' ? 'Presentation' : outputType.charAt(0).toUpperCase() + outputType.slice(1)}</span>
                <Send className="w-5 h-5" />
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedGenerator;
