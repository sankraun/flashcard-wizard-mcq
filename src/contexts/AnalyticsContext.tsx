import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

interface PracticeResult {
  question: string;
  chapter: string;
  correct: boolean;
  date: string;
  timeSpent: number;
}

interface AnalyticsState {
  streak: number;
  dailyGoal: number;
  todayProgress: number;
  accuracyHistory: Array<{ date: string; accuracy: number }>;
  weakTopics: string[];
  studyTime: Array<{ topic: string; minutes: number }>;
  badges: string[];
  isLoading: boolean;
}

interface AnalyticsContextType extends AnalyticsState {
  updateAnalyticsFromPractice: (results: PracticeResult[]) => Promise<void>;
  setDailyGoal: (goal: number) => Promise<void>;
  refreshAnalytics: () => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return ctx;
};

const AnalyticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AnalyticsState>({
    streak: 0,
    dailyGoal: 10,
    todayProgress: 0,
    accuracyHistory: [],
    weakTopics: [],
    studyTime: [],
    badges: [],
    isLoading: true
  });

  // Helper function to format date to YYYY-MM-DD
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Calculate streak based on daily goal completion
  const calculateStreak = async (userId: string, dailyGoal: number) => {
    const today = new Date();
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    // Go backwards day by day until we find a day where the goal wasn't met
    while (true) {
      const dateStr = formatDate(checkDate);
      
      const { data: dayActivity } = await supabase
        .from('daily_activity_logs')
        .select('questions_completed')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .single();
      
      // If no activity for this day or didn't meet daily goal, break the streak
      if (!dayActivity || dayActivity.questions_completed < dailyGoal) {
        // If this is today and we haven't met the goal yet, don't break the streak
        if (dateStr === formatDate(today) && dayActivity && dayActivity.questions_completed > 0) {
          // Today has some progress but hasn't met goal yet - keep existing streak
          break;
        }
        // If this is any other day or today with no progress, break streak
        break;
      }
      
      // This day met the goal, increment streak
      currentStreak++;
      
      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
      
      // Don't go back more than 365 days to prevent infinite loops
      if (currentStreak >= 365) break;
    }
    
    return currentStreak;
  };

  // Initialize or fetch user analytics settings
  useEffect(() => {
    if (user) {
      refreshAnalytics();
    }
  }, [user]);

  const refreshAnalytics = async () => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Fetch user settings
      let { data: settings } = await supabase
        .from('user_analytics_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!settings) {
        // Initialize user settings if they don't exist
        const { data } = await supabase
          .from('user_analytics_settings')
          .insert([{
            user_id: user.id,
            daily_goal: 10,
            current_streak: 0,
            last_activity_date: formatDate(new Date())
          }])
          .select()
          .single();
        settings = data;
      }

      // Calculate actual streak based on daily goal completion
      const actualStreak = await calculateStreak(user.id, settings.daily_goal);
      
      // Update streak in database if it's different
      if (actualStreak !== settings.current_streak) {
        await supabase
          .from('user_analytics_settings')
          .update({ current_streak: actualStreak })
          .eq('user_id', user.id);
      }

      // Fetch today's activity
      const today = formatDate(new Date());
      const { data: todayActivity } = await supabase
        .from('daily_activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      // Fetch last 7 days accuracy
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Get 7 days including today
      const startDate = formatDate(sevenDaysAgo);
      const endDate = formatDate(new Date());

      const { data: accuracyData } = await supabase
        .from('daily_activity_logs')
        .select('date, questions_completed, correct_answers')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      // Fill in missing days with zero accuracy
      const accuracyHistory: Array<{ date: string; accuracy: number }> = [];
      const currentDate = new Date(startDate);
      const end = new Date(endDate);
      
      while (currentDate <= end) {
        const currentDateStr = formatDate(currentDate);
        const dayData = accuracyData?.find(d => d.date === currentDateStr);
        
        accuracyHistory.push({
          date: currentDateStr,
          accuracy: dayData && dayData.questions_completed > 0
            ? Math.round((dayData.correct_answers / dayData.questions_completed) * 100)
            : 0
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Fetch weak topics
      const { data: topicData } = await supabase
        .from('topic_performance')
        .select('*')
        .eq('user_id', user.id)
        .order('correct_answers', { ascending: true })
        .limit(3);

      // Fetch study time
      const { data: studyTimeData } = await supabase
        .from('topic_performance')
        .select('topic, study_minutes')
        .eq('user_id', user.id)
        .order('study_minutes', { ascending: false });

      // Fetch badges
      const { data: badgeData } = await supabase
        .from('user_badges')
        .select('badge_name')
        .eq('user_id', user.id)
        .order('awarded_at', { ascending: false });

      setState({
        streak: actualStreak, // Use calculated streak instead of database value
        dailyGoal: settings?.daily_goal || 10,
        todayProgress: todayActivity?.questions_completed || 0,
        accuracyHistory: accuracyHistory,
        weakTopics: topicData?.map(t => t.topic) || [],
        studyTime: studyTimeData?.map(t => ({
          topic: t.topic,
          minutes: t.study_minutes
        })) || [],
        badges: badgeData?.map(b => b.badge_name) || [],
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error fetching analytics',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  // Gemini API for weak topic analysis
  async function analyzeWeakTopics(mcqResults: Array<{ question: string; chapter: string; correct: boolean }>) {
    const apiKey = 'AIzaSyCElPVe4sj1H1phq_5wgbApQWkjllvfz3Y';
    const prompt = `Given the following MCQ results, identify the top 3 weak topics (chapter names) that the user should focus on. Only return a JSON array of chapter names.\n\n${JSON.stringify(mcqResults)}`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 256 }
      })
    });

    if (!response.ok) return [];

    const data = await response.json();
    try {
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (e) {
      console.error('Error parsing weak topics:', e);
      return [];
    }
  }

  const setDailyGoal = async (goal: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_analytics_settings')
        .update({ daily_goal: goal })
        .eq('user_id', user.id);

      if (error) throw error;

      setState(prev => ({ ...prev, dailyGoal: goal }));
      
      // Recalculate streak with new daily goal
      const newStreak = await calculateStreak(user.id, goal);
      
      // Update streak in database and state
      await supabase
        .from('user_analytics_settings')
        .update({ current_streak: newStreak })
        .eq('user_id', user.id);
        
      setState(prev => ({ ...prev, streak: newStreak }));
      
      toast({
        title: 'Daily goal updated',
        description: `Your new daily goal is ${goal} questions.`,
      });
    } catch (error) {
      console.error('Error updating daily goal:', error);
      toast({
        title: 'Error updating daily goal',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const updateAnalyticsFromPractice = async (results: PracticeResult[]) => {
    if (!user) return;

    try {
      const date = formatDate(new Date());
      const correct = results.filter(r => r.correct).length;
      const totalTimeInMinutes = Math.ceil(results.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / 60000); // Convert ms to minutes

      // Update daily activity log
      const { data: existingLog } = await supabase
        .from('daily_activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();

      let newQuestionsCompleted = results.length;
      if (existingLog) {
        newQuestionsCompleted = existingLog.questions_completed + results.length;
        await supabase
          .from('daily_activity_logs')
          .update({
            questions_completed: newQuestionsCompleted,
            correct_answers: existingLog.correct_answers + correct,
            study_minutes: existingLog.study_minutes + totalTimeInMinutes
          })
          .eq('id', existingLog.id);
      } else {
        await supabase
          .from('daily_activity_logs')
          .insert({
            user_id: user.id,
            date,
            questions_completed: newQuestionsCompleted,
            correct_answers: correct,
            study_minutes: totalTimeInMinutes
          });
      }

      // Update topic performance with per-chapter times
      const chapterTimeMap = new Map<string, { time: number; correct: number; total: number }>();
      
      // Aggregate times and scores by chapter
      results.forEach(result => {
        if (!result.chapter) return;
        
        const current = chapterTimeMap.get(result.chapter) || { time: 0, correct: 0, total: 0 };
        chapterTimeMap.set(result.chapter, {
          time: current.time + (result.timeSpent || 0),
          correct: current.correct + (result.correct ? 1 : 0),
          total: current.total + 1
        });
      });

      // Update each chapter's performance
      for (const [chapter, stats] of chapterTimeMap.entries()) {
        const { data: existingTopic } = await supabase
          .from('topic_performance')
          .select('*')
          .eq('user_id', user.id)
          .eq('topic', chapter)
          .single();

        if (existingTopic) {
          await supabase
            .from('topic_performance')
            .update({
              correct_answers: existingTopic.correct_answers + stats.correct,
              total_questions: existingTopic.total_questions + stats.total,
              study_minutes: existingTopic.study_minutes + Math.ceil(stats.time / 60000),
              last_practiced: new Date().toISOString()
            })
            .eq('id', existingTopic.id);
        } else {
          await supabase
            .from('topic_performance')
            .insert({
              user_id: user.id,
              topic: chapter,
              correct_answers: stats.correct,
              total_questions: stats.total,
              study_minutes: Math.ceil(stats.time / 60000),
              last_practiced: new Date().toISOString()
            });
        }
      }

      // Get current settings to check daily goal
      const { data: settings } = await supabase
        .from('user_analytics_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settings) {
        // Calculate new streak based on goal completion
        const newStreak = await calculateStreak(user.id, settings.daily_goal);
        
        // Update streak in database
        await supabase
          .from('user_analytics_settings')
          .update({
            current_streak: newStreak,
            last_activity_date: date
          })
          .eq('user_id', user.id);

        setState(prev => ({
          ...prev,
          streak: newStreak,
          todayProgress: newQuestionsCompleted
        }));

        // Check and award streak badges
        if (newStreak === 7) {
          await supabase
            .from('user_badges')
            .insert({ user_id: user.id, badge_name: 'Week Warrior' })
            .select()
            .single();
        } else if (newStreak === 30) {
          await supabase
            .from('user_badges')
            .insert({ user_id: user.id, badge_name: 'Monthly Master' })
            .select()
            .single();
        }
      }

      // Analyze weak topics
      const weakTopics = await analyzeWeakTopics(results);
      setState(prev => ({ ...prev, weakTopics }));

      // Final refresh to ensure all data is up to date
      await refreshAnalytics();

      toast({
        title: 'Progress updated',
        description: `You completed ${results.length} questions with ${correct} correct answers!`,
      });
    } catch (error) {
      console.error('Error updating analytics:', error);
      toast({
        title: 'Error updating progress',
        description: 'Your progress was saved but there was an error updating the analytics.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AnalyticsContext.Provider
      value={{
        ...state,
        updateAnalyticsFromPractice,
        setDailyGoal,
        refreshAnalytics,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export default AnalyticsProvider;
