
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: string;
  criteria: any;
  icon: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  goals: any;
  rewards: any;
  start_date: string;
  end_date: string;
  progress?: any;
  completed_at?: string;
  points_earned?: number;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  estimated_duration_hours: number;
  prerequisites: string[];
  current_topic_index?: number;
  topics_completed?: string[];
  started_at?: string;
  completed_at?: string;
}

export interface LeaderboardEntry {
  id: string;
  display_name: string;
  total_points: number;
  questions_answered: number;
  accuracy_percentage: number;
  current_streak: number;
  achievements_count: number;
  last_activity: string;
}

export const useGamification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    questionsAnswered: 0,
    accuracyPercentage: 0,
    currentStreak: 0,
    achievementsCount: 0
  });

  // Fetch achievements
  const fetchAchievements = async () => {
    if (!user) return;

    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*')
      .order('points');

    const { data: userAchievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id);

    if (allAchievements) {
      const achievementsWithStatus = allAchievements.map(achievement => ({
        ...achievement,
        unlocked: userAchievements?.some(ua => ua.achievement_id === achievement.id),
        unlocked_at: userAchievements?.find(ua => ua.achievement_id === achievement.id)?.unlocked_at
      }));
      setAchievements(achievementsWithStatus);
    }
  };

  // Fetch challenges
  const fetchChallenges = async () => {
    if (!user) return;

    const { data: activeChallenges } = await supabase
      .from('practice_challenges')
      .select('*')
      .eq('is_active', true)
      .order('end_date');

    const { data: userProgress } = await supabase
      .from('user_challenge_progress')
      .select('*')
      .eq('user_id', user.id);

    if (activeChallenges) {
      const challengesWithProgress = activeChallenges.map(challenge => ({
        ...challenge,
        progress: userProgress?.find(up => up.challenge_id === challenge.id)?.progress || {},
        completed_at: userProgress?.find(up => up.challenge_id === challenge.id)?.completed_at,
        points_earned: userProgress?.find(up => up.challenge_id === challenge.id)?.points_earned || 0
      }));
      setChallenges(challengesWithProgress);
    }
  };

  // Fetch learning paths
  const fetchLearningPaths = async () => {
    if (!user) return;

    const { data: allPaths } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('is_active', true)
      .order('difficulty', { ascending: true });

    const { data: userProgress } = await supabase
      .from('user_learning_paths')
      .select('*')
      .eq('user_id', user.id);

    if (allPaths) {
      const pathsWithProgress = allPaths.map(path => ({
        ...path,
        current_topic_index: userProgress?.find(up => up.learning_path_id === path.id)?.current_topic_index || 0,
        topics_completed: userProgress?.find(up => up.learning_path_id === path.id)?.topics_completed || [],
        started_at: userProgress?.find(up => up.learning_path_id === path.id)?.started_at,
        completed_at: userProgress?.find(up => up.learning_path_id === path.id)?.completed_at
      }));
      setLearningPaths(pathsWithProgress);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(20);

    if (data) {
      setLeaderboard(data);
    }
  };

  // Update user stats
  const updateUserStats = async (stats: {
    questionsAnswered?: number;
    correctAnswers?: number;
    sessionDuration?: number;
    topicsStudied?: string[];
  }) => {
    if (!user) return;

    console.log('Updating user stats:', stats);

    // Update leaderboard entry
    const accuracy = stats.questionsAnswered && stats.correctAnswers 
      ? (stats.correctAnswers / stats.questionsAnswered) * 100 
      : userStats.accuracyPercentage;

    const { data: existingEntry } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const updateData = {
      user_id: user.id,
      display_name: existingEntry?.display_name || `User${user.id.slice(0, 8)}`,
      total_points: (existingEntry?.total_points || 0) + (stats.correctAnswers || 0) * 10,
      questions_answered: (existingEntry?.questions_answered || 0) + (stats.questionsAnswered || 0),
      accuracy_percentage: accuracy,
      current_streak: existingEntry?.current_streak || 0,
      achievements_count: achievements.filter(a => a.unlocked).length,
      last_activity: new Date().toISOString()
    };

    if (existingEntry) {
      await supabase
        .from('leaderboard_entries')
        .update(updateData)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('leaderboard_entries')
        .insert(updateData);
    }

    // Check for achievements
    await checkAchievements(stats);
    
    // Update challenge progress
    await updateChallengeProgress(stats);

    // Refresh data
    fetchAchievements();
    fetchChallenges();
    fetchLeaderboard();
  };

  // Check and unlock achievements
  const checkAchievements = async (stats: any) => {
    if (!user) return;

    for (const achievement of achievements) {
      if (achievement.unlocked) continue;

      let shouldUnlock = false;
      const criteria = achievement.criteria;

      switch (achievement.type) {
        case 'practice_milestone':
          if (criteria.sessions_completed && stats.questionsAnswered >= 1) {
            shouldUnlock = true;
          }
          if (criteria.correct_answers && (userStats.questionsAnswered + (stats.questionsAnswered || 0)) >= criteria.correct_answers) {
            shouldUnlock = true;
          }
          if (criteria.session_duration && stats.sessionDuration >= criteria.session_duration) {
            shouldUnlock = true;
          }
          break;

        case 'accuracy_streak':
          const accuracy = stats.questionsAnswered && stats.correctAnswers 
            ? (stats.correctAnswers / stats.questionsAnswered) * 100 
            : 0;
          if (criteria.accuracy && accuracy >= criteria.accuracy && stats.questionsAnswered >= (criteria.min_questions || 1)) {
            shouldUnlock = true;
          }
          break;

        case 'speed_challenge':
          if (criteria.questions && criteria.time_limit && stats.questionsAnswered >= criteria.questions && stats.sessionDuration <= criteria.time_limit) {
            shouldUnlock = true;
          }
          break;
      }

      if (shouldUnlock) {
        await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id
          });

        toast({
          title: "🎉 Achievement Unlocked!",
          description: `${achievement.icon} ${achievement.name} - ${achievement.description}`,
          duration: 5000,
        });
      }
    }
  };

  // Update challenge progress
  const updateChallengeProgress = async (stats: any) => {
    if (!user) return;

    for (const challenge of challenges) {
      if (challenge.completed_at) continue;

      const currentProgress = challenge.progress || {};
      let newProgress = { ...currentProgress };
      let isCompleted = false;

      const goals = challenge.goals;

      if (goals.questions_target) {
        newProgress.questions_completed = (currentProgress.questions_completed || 0) + (stats.questionsAnswered || 0);
        if (newProgress.questions_completed >= goals.questions_target) {
          if (!goals.accuracy_target || (stats.correctAnswers / stats.questionsAnswered * 100) >= goals.accuracy_target) {
            isCompleted = true;
          }
        }
      }

      if (goals.time_limit && stats.sessionDuration <= goals.time_limit && stats.questionsAnswered >= (goals.questions_target || 1)) {
        isCompleted = true;
      }

      const { data: existingProgress } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_id', challenge.id)
        .single();

      const updateData = {
        user_id: user.id,
        challenge_id: challenge.id,
        progress: newProgress,
        completed_at: isCompleted ? new Date().toISOString() : null,
        points_earned: isCompleted ? (challenge.rewards?.points || 0) : 0
      };

      if (existingProgress) {
        await supabase
          .from('user_challenge_progress')
          .update(updateData)
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('user_challenge_progress')
          .insert(updateData);
      }

      if (isCompleted) {
        toast({
          title: "🏆 Challenge Completed!",
          description: `${challenge.name} - Earned ${challenge.rewards?.points || 0} points!`,
          duration: 5000,
        });
      }
    }
  };

  // Start learning path
  const startLearningPath = async (pathId: string) => {
    if (!user) return;

    await supabase
      .from('user_learning_paths')
      .insert({
        user_id: user.id,
        learning_path_id: pathId,
        current_topic_index: 0,
        topics_completed: []
      });

    fetchLearningPaths();
    toast({
      title: "🚀 Learning Path Started!",
      description: "Your learning journey begins now!",
    });
  };

  useEffect(() => {
    if (user) {
      fetchAchievements();
      fetchChallenges();
      fetchLearningPaths();
      fetchLeaderboard();
    }
  }, [user]);

  return {
    achievements,
    challenges,
    learningPaths,
    leaderboard,
    userStats,
    updateUserStats,
    startLearningPath,
    fetchAchievements,
    fetchChallenges,
    fetchLearningPaths,
    fetchLeaderboard
  };
};
