import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useMCQStorage } from '@/hooks/useMCQStorage';
import UserProfile from '@/components/UserProfile';
import { 
  BookOpen, 
  Brain, 
  Target, 
  RefreshCw, 
  Timer, 
  BarChart3,
  FileText,
  Lightbulb,
  CheckCircle,
  XCircle,
  Trophy,
  TrendingUp,
  Save,
  Database,
  LogIn
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'single' | 'multiple' | 'assertion' | 'match';
  chapter?: string;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { savedMCQs, saveMCQsToDatabase, loading: storageLoading } = useMCQStorage();
  const navigate = useNavigate();
  
  const [inputText, setInputText] = useState('');
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [currentMCQIndex, setCurrentMCQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'basic' | 'clinical'>('basic');
  const [questionType, setQuestionType] = useState<'single' | 'multiple' | 'assertion' | 'match'>('single');
  const [difficulty, setDifficulty] = useState<'auto' | 'easy' | 'medium' | 'hard'>('auto');
  const [chapter, setChapter] = useState('');
  const [apiKey] = useState('AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y');

  // Show auth page if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Don't render anything while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return null;
  }

  const generateMCQs = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to generate MCQs",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const prompt = `
        Generate 5 high-quality multiple choice questions from the following text. 
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
      
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const generatedMCQs = JSON.parse(jsonMatch[0]);
      
      const formattedMCQs: MCQ[] = generatedMCQs.map((mcq: any, index: number) => ({
        id: `mcq_${Date.now()}_${index}`,
        question: mcq.question,
        options: mcq.options,
        correctAnswer: mcq.correctAnswer,
        explanation: mcq.explanation,
        difficulty: mcq.difficulty as 'Easy' | 'Medium' | 'Hard',
        type: questionType,
        chapter: chapter || 'General'
      }));

      setMcqs(formattedMCQs);
      setCurrentMCQIndex(0);
      setSelectedAnswer(null);
      setShowAnswer(false);
      
      toast({
        title: "Success!",
        description: `Generated ${formattedMCQs.length} MCQs successfully`,
      });

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

  const handleSaveMCQs = async () => {
    if (mcqs.length === 0) {
      toast({
        title: "No MCQs to save",
        description: "Please generate some MCQs first",
        variant: "destructive"
      });
      return;
    }

    await saveMCQsToDatabase(mcqs, inputText);
  };

  const loadSavedMCQSet = (startIndex: number) => {
    const mcqsToLoad = savedMCQs.slice(startIndex, startIndex + 5);
    setMcqs(mcqsToLoad);
    setCurrentMCQIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    
    toast({
      title: "MCQs Loaded",
      description: `Loaded ${mcqsToLoad.length} saved MCQs`,
    });
  };

  const regenerateCurrentMCQ = async () => {
    if (!inputText.trim() || mcqs.length === 0) return;

    setIsGenerating(true);
    
    try {
      const prompt = `
        Generate 1 NEW multiple choice question from the following text (different from previous questions).
        Mode: ${mode === 'basic' ? 'Direct MCQ based on content' : 'Clinical/Applied case-based MCQ'}
        Question Type: ${questionType}
        
        Text: ${inputText}
        
        Return a JSON object with this exact structure:
        {
          "question": "Question text here",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Detailed explanation of why this is correct",
          "difficulty": "Easy|Medium|Hard"
        }
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
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates[0].content.parts[0].text;
      
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const newMCQ = JSON.parse(jsonMatch[0]);
      
      const formattedMCQ: MCQ = {
        id: `mcq_${Date.now()}_regenerated`,
        question: newMCQ.question,
        options: newMCQ.options,
        correctAnswer: newMCQ.correctAnswer,
        explanation: newMCQ.explanation,
        difficulty: newMCQ.difficulty as 'Easy' | 'Medium' | 'Hard',
        type: questionType,
        chapter: chapter || 'General'
      };

      const updatedMCQs = [...mcqs];
      updatedMCQs[currentMCQIndex] = formattedMCQ;
      setMcqs(updatedMCQs);
      setSelectedAnswer(null);
      setShowAnswer(false);
      
      toast({
        title: "MCQ Regenerated!",
        description: "A new question has been generated from the same content",
      });

    } catch (error) {
      console.error('Error regenerating MCQ:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate MCQ. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const checkAnswer = () => {
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (currentMCQIndex < mcqs.length - 1) {
      setCurrentMCQIndex(currentMCQIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    }
  };

  const previousQuestion = () => {
    if (currentMCQIndex > 0) {
      setCurrentMCQIndex(currentMCQIndex - 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentMCQ = mcqs[currentMCQIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Flashcard Wizard MCQ
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Transform any text into interactive MCQs with AI-powered insights
          </p>
        </div>

        {/* User Profile */}
        <UserProfile />

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Saved MCQs
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Practice
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6">
            {/* Configuration Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  MCQ Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mode">Mode</Label>
                    <Select value={mode} onValueChange={(value) => setMode(value as 'basic' | 'clinical')}>
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
                    <Label htmlFor="questionType">Question Type</Label>
                    <Select value={questionType} onValueChange={(value) => setQuestionType(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Best Answer</SelectItem>
                        <SelectItem value="multiple">Multiple True/False</SelectItem>
                        <SelectItem value="assertion">Assertion-Reason</SelectItem>
                        <SelectItem value="match">Match the Following</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={difficulty} onValueChange={(value) => setDifficulty(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (Mixed)</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="chapter">Chapter/Topic</Label>
                    <Input
                      id="chapter"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="e.g., Cardiology"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Input Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your study material here (from PDFs, notes, textbooks, etc.)..."
                  className="min-h-[200px] text-base leading-relaxed"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={generateMCQs} 
                    disabled={isGenerating || !inputText.trim()}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating MCQs...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Generate MCQs
                      </>
                    )}
                  </Button>
                  {mcqs.length > 0 && (
                    <Button 
                      onClick={handleSaveMCQs} 
                      disabled={storageLoading}
                      variant="outline"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save MCQs
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* MCQ Display */}
            {mcqs.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Question {currentMCQIndex + 1} of {mcqs.length}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(currentMCQ?.difficulty || 'Medium')}>
                        {currentMCQ?.difficulty}
                      </Badge>
                      <Button 
                        onClick={regenerateCurrentMCQ} 
                        disabled={isGenerating}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={((currentMCQIndex + 1) / mcqs.length) * 100} className="h-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentMCQ && (
                    <>
                      <div className="text-lg font-medium leading-relaxed">
                        {currentMCQ.question}
                      </div>
                      
                      <div className="space-y-3">
                        {currentMCQ.options.map((option, index) => (
                          <div
                            key={index}
                            onClick={() => !showAnswer && handleAnswerSelect(index)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                              selectedAnswer === index
                                ? showAnswer
                                  ? index === currentMCQ.correctAnswer
                                    ? 'bg-green-100 border-green-500 text-green-800'
                                    : 'bg-red-100 border-red-500 text-red-800'
                                  : 'bg-blue-100 border-blue-500 text-blue-800'
                                : showAnswer && index === currentMCQ.correctAnswer
                                ? 'bg-green-50 border-green-300 text-green-700'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                                selectedAnswer === index
                                  ? showAnswer
                                    ? index === currentMCQ.correctAnswer
                                      ? 'border-green-500 bg-green-500 text-white'
                                      : 'border-red-500 bg-red-500 text-white'
                                    : 'border-blue-500 bg-blue-500 text-white'
                                  : showAnswer && index === currentMCQ.correctAnswer
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : 'border-gray-300'
                              }`}>
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="flex-1">{option}</span>
                              {showAnswer && (
                                <>
                                  {index === currentMCQ.correctAnswer && (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  )}
                                  {selectedAnswer === index && index !== currentMCQ.correctAnswer && (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {showAnswer && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Explanation
                          </h4>
                          <p className="text-blue-800 leading-relaxed">{currentMCQ.explanation}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <Button 
                          onClick={previousQuestion} 
                          disabled={currentMCQIndex === 0}
                          variant="outline"
                        >
                          Previous
                        </Button>
                        
                        {!showAnswer ? (
                          <Button 
                            onClick={checkAnswer} 
                            disabled={selectedAnswer === null}
                          >
                            Check Answer
                          </Button>
                        ) : (
                          <Button 
                            onClick={nextQuestion} 
                            disabled={currentMCQIndex === mcqs.length - 1}
                          >
                            Next Question
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Your Saved MCQs ({savedMCQs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {savedMCQs.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Saved MCQs</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate and save some MCQs to see them here
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {Array.from({ length: Math.ceil(savedMCQs.length / 5) }, (_, i) => {
                      const startIndex = i * 5;
                      const endIndex = Math.min(startIndex + 5, savedMCQs.length);
                      const setMCQs = savedMCQs.slice(startIndex, endIndex);
                      
                      return (
                        <div key={i} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">MCQ Set {i + 1}</h4>
                              <p className="text-sm text-muted-foreground">
                                {setMCQs.length} questions • {setMCQs[0]?.chapter || 'General'}
                              </p>
                            </div>
                            <Button 
                              onClick={() => loadSavedMCQSet(startIndex)}
                              size="sm"
                            >
                              Load Set
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {setMCQs.map((mcq, index) => (
                              <div key={mcq.id} className="text-sm">
                                <span className="font-medium">Q{startIndex + index + 1}:</span>
                                <span className="ml-2">{mcq.question.substring(0, 100)}...</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {mcq.difficulty}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Practice Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mcqs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No MCQs available for practice</p>
                    <Button onClick={() => {
                      const generatorTab = document.querySelector('[value="generator"]') as HTMLElement;
                      generatorTab?.click();
                    }}>
                      Generate MCQs First
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Ready to Practice!</h3>
                    <p className="text-muted-foreground mb-6">
                      Test your knowledge with {mcqs.length} questions
                    </p>
                    <Button size="lg">
                      <Timer className="w-4 h-4 mr-2" />
                      Start Practice Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Analytics Dashboard</h3>
                  <p className="text-muted-foreground mb-6">
                    Track your progress and identify weak areas
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{savedMCQs.length}</div>
                      <div className="text-sm text-blue-800">Total MCQs Saved</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">0%</div>
                      <div className="text-sm text-green-800">Accuracy Rate</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-sm text-purple-800">Study Sessions</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
