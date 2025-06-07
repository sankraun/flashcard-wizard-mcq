
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthPage from '@/components/AuthPage';
import NotesGenerator from '@/components/NotesGenerator';
import SavedNotes from '@/components/SavedNotes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BookOpen, 
  Brain, 
  Target, 
  BarChart3,
  FileText,
  LogOut,
  User,
  Lightbulb,
  RefreshCw,
  Timer,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

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

interface PracticeSession {
  id: string;
  mcqs: MCQ[];
  userAnswers: (number | null)[];
  startTime: Date;
  endTime?: Date;
  score?: number;
}

// Change practiceMCQs to be an array of named sets
interface MCQSet {
  name: string;
  mcqs: MCQ[];
  created: number;
}

const Index = () => {
  const { user, loading, signOut } = useAuth();

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
  const [practiceMode, setPracticeMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [practiceSession, setPracticeSession] = useState<PracticeSession | null>(null);
  const [apiKey, setApiKey] = useState('AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y');
  // Add state for user answers and study sessions
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [studySessions, setStudySessions] = useState<PracticeSession[]>(() => {
    const saved = localStorage.getItem('neutronai_study_sessions');
    return saved ? JSON.parse(saved) : [];
  });
  // Store generated MCQs in localStorage and load them for practice
  const [practiceMCQSets, setPracticeMCQSets] = useState<MCQSet[]>([]);

  // Modal states
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [modalMCQs, setModalMCQs] = useState<MCQ[]>([]);
  const [modalCurrentIndex, setModalCurrentIndex] = useState(0);
  const [modalUserAnswers, setModalUserAnswers] = useState<(number|null)[]>([]);
  const [modalShowAnswer, setModalShowAnswer] = useState(false);
  const [modalSelectedAnswer, setModalSelectedAnswer] = useState<number|null>(null);
  // Add state for modal submission and wrong answers
  const [modalSubmitted, setModalSubmitted] = useState(false);
  const [modalWrongIndexes, setModalWrongIndexes] = useState<number[]>([]);

  // Load practice MCQ sets from localStorage on mount
  useEffect(() => {
    const savedPracticeSets = localStorage.getItem('neutronai_practice_mcqs_list');
    if (savedPracticeSets) {
      setPracticeMCQSets(JSON.parse(savedPracticeSets));
    }
  }, []);

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

      console.log('Generating MCQs with prompt:', prompt);

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
      console.log('API Response:', data);
      
      const generatedText = data.candidates[0].content.parts[0].text;
      console.log('Generated text:', generatedText);
      
      // Extract JSON from the response
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
      // Save generated MCQs to localStorage
      localStorage.setItem('neutronai_mcqs', JSON.stringify(formattedMCQs));
      // Save generated MCQs to localStorage for practice
      // Removed savePracticeMCQs call

      // After MCQs are generated, get a short name for the set
      const namePrompt = `Generate a very short, 1 or 2 word descriptive title for a set of MCQs based on the following text. Only return the title, no punctuation or extra words:\n${inputText}`;
      const nameResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: namePrompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 8 }
        })
      });
      let setName = 'Untitled';
      if (nameResponse.ok) {
        const nameData = await nameResponse.json();
        setName = nameData.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/[^\w\s]/g, '').trim().split(/\s+/).slice(0,2).join(' ') || setName;
      }
      // Save MCQs to practice list with name
      const newPracticeList = [
        { name: setName, mcqs: formattedMCQs, created: Date.now() },
        ...practiceMCQSets
      ];
      setPracticeMCQSets(newPracticeList);
      localStorage.setItem('neutronai_practice_mcqs_list', JSON.stringify(newPracticeList));
      
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

  // Add a submit handler for the last question
  const handleSubmitMCQs = () => {
    // Calculate score
    const correct = mcqs.filter((mcq, idx) => userAnswers[idx] === mcq.correctAnswer).length;
    const accuracy = mcqs.length > 0 ? Math.round((correct / mcqs.length) * 100) : 0;
    const session: PracticeSession = {
      id: `session_${Date.now()}`,
      mcqs,
      userAnswers,
      startTime: new Date(),
      endTime: new Date(),
      score: accuracy
    };
    // Save session to localStorage
    const updatedSessions = [session, ...studySessions];
    setStudySessions(updatedSessions);
    localStorage.setItem('neutronai_study_sessions', JSON.stringify(updatedSessions));
    // Clear dashboard MCQs
    setMcqs([]);
    setUserAnswers([]);
    setCurrentMCQIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    toast({
      title: 'Submitted!',
      description: `Your answers have been submitted. Accuracy: ${accuracy}%`,
    });
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setUserAnswers(prev => {
      const updated = [...prev];
      updated[currentMCQIndex] = answerIndex;
      return updated;
    });
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

  const startPracticeMode = () => {
    if (mcqs.length === 0) {
      toast({
        title: "No MCQs Available",
        description: "Please generate some MCQs first",
        variant: "destructive"
      });
      return;
    }

    setPracticeMode(true);
    setTimeRemaining(mcqs.length * 60); // 1 minute per question
    setPracticeSession({
      id: `session_${Date.now()}`,
      mcqs,
      userAnswers: new Array(mcqs.length).fill(null),
      startTime: new Date()
    });
    setCurrentMCQIndex(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
  };

  const currentMCQ = mcqs[currentMCQIndex];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Neutron AI
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">
            Transform any text into interactive MCQs and structured notes with AI
          </p>
        </div>

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              MCQ Generator
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes Generator
            </TabsTrigger>
            <TabsTrigger value="saved-notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Saved Notes
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Practice
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
                    <Button onClick={startPracticeMode} variant="outline">
                      <Timer className="w-4 h-4 mr-2" />
                      Practice Mode
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Only show MCQ dashboard if there are MCQs and no study session has just been submitted */}
            {mcqs.length > 0 && !practiceMode && (
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
                        
                        {showAnswer && currentMCQIndex === mcqs.length - 1 ? (
                          <Button onClick={handleSubmitMCQs} color="primary">
                            Submit
                          </Button>
                        ) : showAnswer ? (
                          <Button 
                            onClick={nextQuestion} 
                            disabled={currentMCQIndex === mcqs.length - 1}
                          >
                            Next Question
                          </Button>
                        ) : (
                          <Button 
                            onClick={checkAnswer} 
                            disabled={selectedAnswer === null}
                          >
                            Check Answer
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <NotesGenerator />
          </TabsContent>

          <TabsContent value="saved-notes" className="space-y-6">
            <SavedNotes />
          </TabsContent>

          <TabsContent value="practice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Practice Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                {practiceMCQSets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No MCQ sets available for practice</p>
                    <Button onClick={() => {
                      const generatorTab = document.querySelector('[value="generator"]') as HTMLElement;
                      generatorTab?.click();
                    }}>
                      Generate MCQs First
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {practiceMCQSets.map((set, idx) => (
                      <div key={set.created} className="flex justify-between items-center border rounded p-3">
                        <div>
                          <div className="font-semibold">{set.name}</div>
                          <div className="text-xs text-muted-foreground">{set.mcqs.length} questions</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => {
                            setModalMCQs(set.mcqs);
                            setModalCurrentIndex(0);
                            setModalUserAnswers(new Array(set.mcqs.length).fill(null));
                            setModalShowAnswer(false);
                            setModalSelectedAnswer(null);
                            setPracticeModalOpen(true);
                          }}>Practice</Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                            const updated = practiceMCQSets.filter((_, i) => i !== idx);
                            setPracticeMCQSets(updated);
                            localStorage.setItem('neutronai_practice_mcqs_list', JSON.stringify(updated));
                          }}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Practice Modal */}
        <Dialog open={practiceModalOpen} onOpenChange={setPracticeModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Practice: {practiceMCQSets.find(s => s.mcqs === modalMCQs)?.name || 'MCQ Set'}</DialogTitle>
            </DialogHeader>
            {modalMCQs.length > 0 && (
              <div className="space-y-4">
                <div className="font-semibold mb-2">Question {modalCurrentIndex + 1} of {modalMCQs.length}</div>
                <div className="text-lg font-medium leading-relaxed mb-2">{modalMCQs[modalCurrentIndex].question}</div>
                <div className="space-y-2">
                  {modalMCQs[modalCurrentIndex].options.map((option, idx) => (
                    <div
                      key={idx}
                      onClick={() => !modalShowAnswer && (setModalSelectedAnswer(idx), setModalUserAnswers(prev => { const arr = [...prev]; arr[modalCurrentIndex] = idx; return arr; }))}
                      className={`p-3 rounded border cursor-pointer transition-all ${modalSelectedAnswer === idx ? (modalShowAnswer ? (idx === modalMCQs[modalCurrentIndex].correctAnswer ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500') : 'bg-blue-100 border-blue-500') : (modalShowAnswer && idx === modalMCQs[modalCurrentIndex].correctAnswer ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')}`}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span> {option}
                    </div>
                  ))}
                </div>
                {modalShowAnswer && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <div className="font-semibold mb-1">Explanation</div>
                    <div>{modalMCQs[modalCurrentIndex].explanation}</div>
                  </div>
                )}
                {!modalSubmitted ? (
                  <div className="flex justify-between items-center mt-4">
                    <Button onClick={() => setModalCurrentIndex(i => Math.max(0, i - 1))} disabled={modalCurrentIndex === 0} variant="outline">Previous</Button>
                    {!modalShowAnswer ? (
                      <Button onClick={() => setModalShowAnswer(true)} disabled={modalSelectedAnswer === null}>Check Answer</Button>
                    ) : modalCurrentIndex < modalMCQs.length - 1 ? (
                      <Button onClick={() => { setModalCurrentIndex(i => i + 1); setModalShowAnswer(false); setModalSelectedAnswer(modalUserAnswers[modalCurrentIndex + 1] ?? null); }}>Next</Button>
                    ) : (
                      <Button color="primary" onClick={() => {
                        // On submit, calculate accuracy and wrong answers
                        const wrong: number[] = [];
                        let correct = 0;
                        modalMCQs.forEach((mcq, idx) => {
                          if (modalUserAnswers[idx] === mcq.correctAnswer) correct++;
                          else wrong.push(idx);
                        });
                        setModalWrongIndexes(wrong);
                        setModalSubmitted(true);
                      }}>Submit</Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">Accuracy: {modalMCQs.length > 0 ? Math.round(((modalMCQs.length - modalWrongIndexes.length) / modalMCQs.length) * 100) : 0}%</div>
                      <div className="text-lg mt-2">{modalWrongIndexes.length === 0 ? 'All answers correct!' : `${modalWrongIndexes.length} wrong answer(s)`}</div>
                    </div>
                    {modalWrongIndexes.length > 0 && (
                      <div className="text-center">
                        <Button color="primary" onClick={() => {
                          // Practice only wrong answers
                          setModalMCQs(modalWrongIndexes.map(i => modalMCQs[i]));
                          setModalUserAnswers(new Array(modalWrongIndexes.length).fill(null));
                          setModalCurrentIndex(0);
                          setModalShowAnswer(false);
                          setModalSelectedAnswer(null);
                          setModalSubmitted(false);
                          setModalWrongIndexes([]);
                        }}>Practice Wrong Answers</Button>
                      </div>
                    )}
                    <div className="text-center">
                      <Button variant="outline" onClick={() => setPracticeModalOpen(false)}>Close</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;
