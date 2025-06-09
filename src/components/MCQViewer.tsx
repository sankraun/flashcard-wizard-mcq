import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Sparkles,
  Target,
  BookOpen,
  Filter,
  Calendar
} from 'lucide-react';

interface MCQ {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: string;
  chapter: string | null;
  question_type: string;
  created_at: string;
}

interface Answer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
}

const MCQViewer = () => {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [currentMCQIndex, setCurrentMCQIndex] = useState(0);
  const [practiceMode, setPracticeMode] = useState(false);
  const [showExplanations, setShowExplanations] = useState<{ [key: string]: boolean }>({});
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadMCQs();
    }
  }, [user]);

  const loadMCQs = async () => {
    try {
      const { data, error } = await supabase
        .from('mcqs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cast the data to proper types
      const typedMCQs: MCQ[] = (data || []).map(mcq => ({
        ...mcq,
        options: mcq.options as string[]
      }));

      setMcqs(typedMCQs);
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

  const deleteMCQ = async (mcqId: string) => {
    try {
      const { error } = await supabase
        .from('mcqs')
        .delete()
        .eq('id', mcqId);

      if (error) throw error;

      setMcqs(mcqs.filter(mcq => mcq.id !== mcqId));
      toast({
        title: "Success",
        description: "MCQ deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting MCQ:', error);
      toast({
        title: "Error",
        description: "Failed to delete MCQ",
        variant: "destructive"
      });
    }
  };

  const handleAnswerSelect = (mcqId: string, answerIndex: number) => {
    const mcq = mcqs.find(m => m.id === mcqId);
    if (!mcq) return;

    const isCorrect = answerIndex === mcq.correct_answer;
    const existingAnswerIndex = answers.findIndex(answer => answer.questionId === mcqId);
    
    const newAnswer: Answer = {
      questionId: mcqId,
      selectedAnswer: answerIndex,
      isCorrect
    };

    if (existingAnswerIndex >= 0) {
      const updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = newAnswer;
      setAnswers(updatedAnswers);
    } else {
      setAnswers([...answers, newAnswer]);
    }

    if (practiceMode) {
      setShowExplanations(prev => ({ ...prev, [mcqId]: true }));
    }
  };

  const calculateResults = () => {
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    return {
      totalQuestions,
      correctAnswers,
      accuracy: Math.round(accuracy)
    };
  };

  const resetQuiz = () => {
    setAnswers([]);
    setShowAnswers(false);
    setShowExplanations({});
    setCurrentMCQIndex(0);
    setPracticeMode(false);
  };

  const startPracticeMode = () => {
    resetQuiz();
    setPracticeMode(true);
    setCurrentMCQIndex(0);
  };

  const nextQuestion = () => {
    if (currentMCQIndex < filteredMCQs.length - 1) {
      setCurrentMCQIndex(currentMCQIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentMCQIndex > 0) {
      setCurrentMCQIndex(currentMCQIndex - 1);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'factual': return 'bg-blue-100 text-blue-800';
      case 'conceptual': return 'bg-purple-100 text-purple-800';
      case 'application': return 'bg-indigo-100 text-indigo-800';
      case 'analysis': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMCQs = mcqs.filter(mcq => {
    const matchesDifficulty = difficultyFilter === 'All' || mcq.difficulty === difficultyFilter;
    const matchesType = typeFilter === 'All' || mcq.question_type === typeFilter;
    return matchesDifficulty && matchesType;
  });

  const getUniqueValues = (field: 'difficulty' | 'question_type') => {
    const values = mcqs.map(mcq => mcq[field]).filter(Boolean);
    return [...new Set(values)];
  };

  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-muted-foreground">Loading MCQs...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mcqs.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Generated MCQs
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">No MCQs generated yet</h3>
          <p className="text-muted-foreground">
            Generate your first MCQs to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  if (practiceMode) {
    const currentMCQ = filteredMCQs[currentMCQIndex];
    const currentAnswer = answers.find(answer => answer.questionId === currentMCQ.id);

    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Practice Mode - Question {currentMCQIndex + 1} of {filteredMCQs.length}
            </CardTitle>
            <div className="flex gap-2">
              <Badge className={getDifficultyColor(currentMCQ.difficulty)}>
                {currentMCQ.difficulty}
              </Badge>
              <Badge className={getTypeColor(currentMCQ.question_type)}>
                {currentMCQ.question_type}
              </Badge>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentMCQIndex + 1) / filteredMCQs.length) * 100}%` }}
            ></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg leading-relaxed">
            {currentMCQ.question}
          </div>

          <div className="space-y-3">
            {currentMCQ.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswerSelect(currentMCQ.id, index)}
                variant={currentAnswer?.selectedAnswer === index ? "default" : "outline"}
                className={`w-full justify-start text-left h-auto p-4 transition-all duration-200 ${
                  showExplanations[currentMCQ.id] && index === currentMCQ.correct_answer
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : showExplanations[currentMCQ.id] && currentAnswer?.selectedAnswer === index && index !== currentMCQ.correct_answer
                    ? 'bg-red-100 border-red-500 text-red-800'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                  {showExplanations[currentMCQ.id] && index === currentMCQ.correct_answer && (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                  )}
                  {showExplanations[currentMCQ.id] && currentAnswer?.selectedAnswer === index && index !== currentMCQ.correct_answer && (
                    <XCircle className="w-5 h-5 text-red-600 ml-auto" />
                  )}
                </div>
              </Button>
            ))}
          </div>

          {showExplanations[currentMCQ.id] && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Explanation:
              </h4>
              <p className="text-sm leading-relaxed">{currentMCQ.explanation}</p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <Button
              onClick={previousQuestion}
              disabled={currentMCQIndex === 0}
              variant="outline"
              className="hover-scale"
            >
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {answers.length} / {filteredMCQs.length} answered
            </div>
            
            {currentMCQIndex === filteredMCQs.length - 1 ? (
              <Button
                onClick={() => {
                  setPracticeMode(false);
                  setShowAnswers(true);
                }}
                className="hover-scale"
              >
                Finish Practice
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                className="hover-scale"
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showAnswers) {
    const results = calculateResults();
    
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Practice Results
            <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {results.accuracy}%
            </div>
            <div className="text-lg text-gray-600 mb-4">
              {results.correctAnswers} out of {results.totalQuestions} correct
            </div>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <div className="text-sm text-gray-500">Correct: {results.correctAnswers}</div>
              </div>
              <div className="text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                <div className="text-sm text-gray-500">Incorrect: {results.totalQuestions - results.correctAnswers}</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={resetQuiz} className="flex-1 hover-scale">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={startPracticeMode} variant="outline" className="flex-1 hover-scale">
              <Target className="w-4 h-4 mr-2" />
              New Practice
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Generated MCQs ({filteredMCQs.length})
          <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
        </CardTitle>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value)}
            >
              <option value="All">All Difficulties</option>
              {getUniqueValues('difficulty').map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-500" />
            <select
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              {getUniqueValues('question_type').map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <Button
            onClick={startPracticeMode}
            disabled={filteredMCQs.length === 0}
            className="hover-scale ml-auto"
          >
            <Target className="w-4 h-4 mr-2" />
            Start Practice
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {filteredMCQs.map((mcq, index) => {
          const userAnswer = answers.find(answer => answer.questionId === mcq.id);
          
          return (
            <div key={mcq.id} className="border rounded-lg p-6 hover:shadow-md transition-all duration-200 animate-scale-in">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div className="flex gap-2">
                    <Badge className={getDifficultyColor(mcq.difficulty)}>
                      {mcq.difficulty}
                    </Badge>
                    <Badge className={getTypeColor(mcq.question_type)}>
                      {mcq.question_type}
                    </Badge>
                    {mcq.chapter && (
                      <Badge variant="outline">
                        {mcq.chapter}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowExplanations(prev => ({ 
                      ...prev, 
                      [mcq.id]: !prev[mcq.id] 
                    }))}
                    variant="outline"
                    size="sm"
                    className="hover-scale"
                  >
                    {showExplanations[mcq.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    onClick={() => deleteMCQ(mcq.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 hover-scale"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-medium mb-4 leading-relaxed">
                {mcq.question}
              </h3>

              <div className="space-y-3 mb-4">
                {mcq.options.map((option, optionIndex) => (
                  <Button
                    key={optionIndex}
                    onClick={() => handleAnswerSelect(mcq.id, optionIndex)}
                    variant={userAnswer?.selectedAnswer === optionIndex ? "default" : "outline"}
                    className={`w-full justify-start text-left h-auto p-4 transition-all duration-200 ${
                      userAnswer && optionIndex === mcq.correct_answer
                        ? 'bg-green-100 border-green-500 text-green-800'
                        : userAnswer && userAnswer.selectedAnswer === optionIndex && optionIndex !== mcq.correct_answer
                        ? 'bg-red-100 border-red-500 text-red-800'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span>{option}</span>
                      {userAnswer && optionIndex === mcq.correct_answer && (
                        <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                      )}
                      {userAnswer && userAnswer.selectedAnswer === optionIndex && optionIndex !== mcq.correct_answer && (
                        <XCircle className="w-5 h-5 text-red-600 ml-auto" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>

              {showExplanations[mcq.id] && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Explanation:
                  </h4>
                  <p className="text-sm leading-relaxed">{mcq.explanation}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(mcq.created_at).toLocaleDateString()}
                </div>
                {userAnswer && (
                  <div className={`flex items-center gap-1 ${userAnswer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {userAnswer.isCorrect ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {userAnswer.isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {answers.length > 0 && (
          <div className="flex justify-center gap-4 pt-6 border-t">
            <Button
              onClick={() => setShowAnswers(true)}
              className="hover-scale"
            >
              <Target className="w-4 h-4 mr-2" />
              View Results
            </Button>
            <Button
              onClick={resetQuiz}
              variant="outline"
              className="hover-scale"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MCQViewer;
