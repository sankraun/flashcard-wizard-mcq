import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Trophy, 
  Target,
  Clock,
  Star,
  ArrowLeft,
  Play,
  BookOpen,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MCQ {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: string;
  chapter: string | null;
  question_type: string;
}

interface Answer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
}

const MCQPractice = () => {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'all' | 'by-difficulty' | 'by-chapter'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [filteredMcqs, setFilteredMcqs] = useState<MCQ[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [deleteChapter, setDeleteChapter] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadMCQs();
    }
  }, [user]);

  useEffect(() => {
    filterMCQs();
  }, [mcqs, practiceMode, selectedDifficulty, selectedChapter]);

  const loadMCQs = async () => {
    try {
      const { data, error } = await supabase
        .from('mcqs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMcqs(
        (data || []).map((mcq: any) => ({
          ...mcq,
          options: Array.isArray(mcq.options)
            ? mcq.options
            : typeof mcq.options === 'string'
              ? JSON.parse(mcq.options)
              : [],
        }))
      );
    } catch (error) {
      console.error('Error loading MCQs:', error);
      toast({
        title: "Error",
        description: "Failed to load saved MCQs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMCQs = () => {
    let filtered = [...mcqs];

    if (practiceMode === 'by-difficulty' && selectedDifficulty) {
      filtered = filtered.filter(mcq => mcq.difficulty === selectedDifficulty);
    } else if (practiceMode === 'by-chapter' && selectedChapter) {
      filtered = filtered.filter(mcq => mcq.chapter === selectedChapter);
    }

    setFilteredMcqs(filtered);
  };

  const getUniqueValues = (field: 'difficulty' | 'chapter') => {
    const values = mcqs.map(mcq => mcq[field]).filter(Boolean);
    return [...new Set(values)];
  };

  const startPracticeSession = () => {
    if (filteredMcqs.length === 0) {
      toast({
        title: "No MCQs Found",
        description: "No MCQs available for the selected criteria",
        variant: "destructive"
      });
      return;
    }

    // Shuffle the MCQs for random practice
    const shuffled = [...filteredMcqs].sort(() => Math.random() - 0.5);
    setFilteredMcqs(shuffled);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowResult(false);
    setSessionCompleted(false);
    setStartTime(new Date());
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (sessionCompleted) return;
    setSelectedAnswer(answerIndex);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) {
      toast({
        title: "Please select an answer",
        description: "Choose an option before submitting",
        variant: "destructive"
      });
      return;
    }

    const currentMCQ = filteredMcqs[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentMCQ.correct_answer;
    
    const newAnswer: Answer = {
      questionId: currentMCQ.id,
      selectedAnswer,
      isCorrect
    };

    setAnswers(prev => [...prev, newAnswer]);
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < filteredMcqs.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Session completed
      setSessionCompleted(true);
    }
  };

  const resetSession = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowResult(false);
    setSessionCompleted(false);
    setStartTime(null);
  };

  const calculateResults = () => {
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    const timeSpent = startTime ? 
      Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60) : 0;

    return {
      totalQuestions,
      correctAnswers,
      accuracy: Math.round(accuracy),
      timeSpent
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const deleteMCQsByChapter = async () => {
    if (!deleteChapter) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('mcqs')
        .delete()
        .eq('user_id', user?.id)
        .eq('chapter', deleteChapter);
      if (error) throw error;
      toast({ title: 'Success', description: `All MCQs for chapter "${deleteChapter}" deleted.` });
      setDeleteChapter("");
      loadMCQs();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete MCQs for this chapter', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your saved MCQs...</p>
        </div>
      </div>
    );
  }

  const uniqueChapters = getUniqueValues('chapter');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-16">
      <main className="max-w-3xl mx-auto py-8 px-2">
        {/* Back Button */}
        <div className="mb-4 flex items-center">
          <Button onClick={() => navigate(-1)} variant="outline" size="sm" className="hover-scale">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Delete MCQs by Chapter Section */}
        <div className="mb-6 flex flex-row gap-2 items-center justify-center">
          <select
            className="border rounded px-2 py-1 text-sm w-full max-w-xs"
            value={deleteChapter}
            onChange={e => setDeleteChapter(e.target.value)}
          >
            <option value="">Select chapter...</option>
            {uniqueChapters.map(ch => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
          <Button
            onClick={deleteMCQsByChapter}
            disabled={!deleteChapter || deleteLoading}
            variant="ghost"
            size="icon"
            title="Delete all MCQs for this chapter"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {mcqs.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Saved MCQs</h3>
              <p className="text-muted-foreground mb-4">
                Generate some MCQs first to start practicing
              </p>
              <Button onClick={() => navigate('/')}>
                Go to MCQ Generator
              </Button>
            </CardContent>
          </Card>
        ) : !startTime ? (
          // Practice Setup
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-600" />
                  Start Practice Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <Brain className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    You have {mcqs.length} saved MCQs
                  </h3>
                  <p className="text-muted-foreground">
                    Choose how you want to practice
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => setPracticeMode('all')}
                      variant={practiceMode === 'all' ? 'default' : 'outline'}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <Target className="w-5 h-5" />
                      <span>All MCQs</span>
                      <span className="text-xs text-muted-foreground">
                        {mcqs.length} questions
                      </span>
                    </Button>

                    <Button
                      onClick={() => setPracticeMode('by-difficulty')}
                      variant={practiceMode === 'by-difficulty' ? 'default' : 'outline'}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <Star className="w-5 h-5" />
                      <span>By Difficulty</span>
                      <span className="text-xs text-muted-foreground">
                        {getUniqueValues('difficulty').length} levels
                      </span>
                    </Button>

                    <Button
                      onClick={() => setPracticeMode('by-chapter')}
                      variant={practiceMode === 'by-chapter' ? 'default' : 'outline'}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>By Chapter</span>
                      <span className="text-xs text-muted-foreground">
                        {getUniqueValues('chapter').length} chapters
                      </span>
                    </Button>
                  </div>

                  {practiceMode === 'by-difficulty' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Difficulty:</label>
                      <div className="flex flex-wrap gap-2">
                        {getUniqueValues('difficulty').map(difficulty => (
                          <Button
                            key={difficulty}
                            onClick={() => setSelectedDifficulty(difficulty)}
                            variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                            size="sm"
                          >
                            {difficulty}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {practiceMode === 'by-chapter' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Chapter:</label>
                      <div className="flex flex-wrap gap-2">
                        {getUniqueValues('chapter').map(chapter => (
                          <Button
                            key={chapter}
                            onClick={() => setSelectedChapter(chapter)}
                            variant={selectedChapter === chapter ? 'default' : 'outline'}
                            size="sm"
                          >
                            {chapter}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={startPracticeSession}
                  className="w-full hover-scale"
                  size="lg"
                  disabled={
                    (practiceMode === 'by-difficulty' && !selectedDifficulty) ||
                    (practiceMode === 'by-chapter' && !selectedChapter)
                  }
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Practice ({filteredMcqs.length} questions)
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : sessionCompleted ? (
          // Results Summary
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Practice Session Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {(() => {
                  const results = calculateResults();
                  return (
                    <>
                      <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
                        <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">
                          {results.accuracy}% Accuracy
                        </h3>
                        <p className="text-muted-foreground">
                          {results.correctAnswers} out of {results.totalQuestions} correct
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                          <div className="text-lg font-semibold">{results.totalQuestions}</div>
                          <div className="text-sm text-muted-foreground">Questions</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                          <div className="text-lg font-semibold">{results.correctAnswers}</div>
                          <div className="text-sm text-muted-foreground">Correct</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                          <div className="text-lg font-semibold">{results.totalQuestions - results.correctAnswers}</div>
                          <div className="text-sm text-muted-foreground">Incorrect</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                          <div className="text-lg font-semibold">{results.timeSpent}m</div>
                          <div className="text-sm text-muted-foreground">Time Spent</div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button onClick={resetSession} className="flex-1 hover-scale">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Practice Again
                        </Button>
                        <Button onClick={() => navigate('/')} variant="outline" className="flex-1 hover-scale">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Dashboard
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Active Practice Session
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <Progress 
                value={(currentQuestionIndex / filteredMcqs.length) * 100} 
                className="flex-1 mr-4"
              />
              <span className="text-sm text-muted-foreground">
                {currentQuestionIndex + 1} / {filteredMcqs.length}
              </span>
            </div>

            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    Question {currentQuestionIndex + 1}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getDifficultyColor(filteredMcqs[currentQuestionIndex].difficulty)}>
                      {filteredMcqs[currentQuestionIndex].difficulty}
                    </Badge>
                    {filteredMcqs[currentQuestionIndex].chapter && (
                      <Badge variant="outline">
                        {filteredMcqs[currentQuestionIndex].chapter}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-lg leading-relaxed">
                  {filteredMcqs[currentQuestionIndex].question}
                </div>

                <div className="space-y-3">
                  {filteredMcqs[currentQuestionIndex].options.map((option, index) => (
                    <Button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      variant={selectedAnswer === index ? "default" : "outline"}
                      className={`w-full justify-start text-left h-auto p-4 transition-all duration-200 ${
                        showResult && index === filteredMcqs[currentQuestionIndex].correct_answer
                          ? 'bg-green-100 border-green-500 text-green-800'
                          : showResult && selectedAnswer === index && index !== filteredMcqs[currentQuestionIndex].correct_answer
                          ? 'bg-red-100 border-red-500 text-red-800'
                          : ''
                      }`}
                      disabled={showResult}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{option}</span>
                        {showResult && index === filteredMcqs[currentQuestionIndex].correct_answer && (
                          <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                        )}
                        {showResult && selectedAnswer === index && index !== filteredMcqs[currentQuestionIndex].correct_answer && (
                          <XCircle className="w-5 h-5 text-red-600 ml-auto" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>

                {showResult && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Explanation:
                    </h4>
                    <p className="text-sm leading-relaxed">
                      {filteredMcqs[currentQuestionIndex].explanation}
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  {!showResult ? (
                    <Button 
                      onClick={submitAnswer} 
                      className="w-full hover-scale"
                      disabled={selectedAnswer === null}
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button 
                      onClick={nextQuestion} 
                      className="w-full hover-scale"
                    >
                      {currentQuestionIndex < filteredMcqs.length - 1 ? 'Next Question' : 'Finish Session'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default MCQPractice;
