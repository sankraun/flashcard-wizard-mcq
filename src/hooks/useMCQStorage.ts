
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

export const useMCQStorage = () => {
  const { user } = useAuth();
  const [savedMCQs, setSavedMCQs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(false);

  const saveMCQsToDatabase = async (mcqs: MCQ[], sourceText: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const mcqsToInsert = mcqs.map(mcq => ({
        user_id: user.id,
        question: mcq.question,
        options: mcq.options,
        correct_answer: mcq.correctAnswer,
        explanation: mcq.explanation,
        difficulty: mcq.difficulty,
        question_type: mcq.type,
        chapter: mcq.chapter || 'General',
        source_text: sourceText
      }));

      const { error } = await supabase
        .from('mcqs')
        .insert(mcqsToInsert);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Saved ${mcqs.length} MCQs to your account`,
      });

      // Refresh saved MCQs
      await loadSavedMCQs();
    } catch (error) {
      console.error('Error saving MCQs:', error);
      toast({
        title: "Error",
        description: "Failed to save MCQs to your account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedMCQs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mcqs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMCQs: MCQ[] = data.map(mcq => ({
        id: mcq.id,
        question: mcq.question,
        options: mcq.options,
        correctAnswer: mcq.correct_answer,
        explanation: mcq.explanation,
        difficulty: mcq.difficulty as 'Easy' | 'Medium' | 'Hard',
        type: mcq.question_type as 'single' | 'multiple' | 'assertion' | 'match',
        chapter: mcq.chapter
      }));

      setSavedMCQs(formattedMCQs);
    } catch (error) {
      console.error('Error loading MCQs:', error);
      toast({
        title: "Error",
        description: "Failed to load your saved MCQs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMCQ = async (mcqId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('mcqs')
        .delete()
        .eq('id', mcqId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSavedMCQs(prev => prev.filter(mcq => mcq.id !== mcqId));
      
      toast({
        title: "Deleted",
        description: "MCQ deleted successfully",
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

  useEffect(() => {
    if (user) {
      loadSavedMCQs();
    } else {
      setSavedMCQs([]);
    }
  }, [user]);

  return {
    savedMCQs,
    saveMCQsToDatabase,
    loadSavedMCQs,
    deleteMCQ,
    loading
  };
};
