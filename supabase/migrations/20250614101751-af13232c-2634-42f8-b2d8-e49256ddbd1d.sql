
-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('accuracy_streak', 'speed_challenge', 'topic_mastery', 'practice_milestone', 'consistency')),
  criteria JSONB NOT NULL, -- stores the conditions needed to unlock
  icon TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress JSONB, -- for tracking progress toward achievement
  UNIQUE(user_id, achievement_id)
);

-- Create practice challenges table
CREATE TABLE public.practice_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'special')),
  goals JSONB NOT NULL, -- stores challenge objectives
  rewards JSONB NOT NULL, -- points, badges, etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user challenge progress table
CREATE TABLE public.user_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.practice_challenges(id),
  progress JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Create learning paths table
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  topics TEXT[] NOT NULL, -- array of topics/chapters
  estimated_duration_hours INTEGER,
  prerequisites TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user learning path progress table
CREATE TABLE public.user_learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  learning_path_id UUID NOT NULL REFERENCES public.learning_paths(id),
  current_topic_index INTEGER NOT NULL DEFAULT 0,
  topics_completed TEXT[] DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, learning_path_id)
);

-- Create leaderboard table for social features
CREATE TABLE public.leaderboard_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL, -- anonymized name like "User123"
  total_points INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  achievements_count INTEGER NOT NULL DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Achievements are public (everyone can see available achievements)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- Users can only see their own achievement progress
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own achievements" ON public.user_achievements FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Challenges are public
CREATE POLICY "Anyone can view active challenges" ON public.practice_challenges FOR SELECT USING (is_active = true);

-- Users can only see their own challenge progress
CREATE POLICY "Users can view their own challenge progress" ON public.user_challenge_progress FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own challenge progress" ON public.user_challenge_progress FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own challenge progress" ON public.user_challenge_progress FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Learning paths are public
CREATE POLICY "Anyone can view learning paths" ON public.learning_paths FOR SELECT USING (is_active = true);

-- Users can only see their own learning path progress
CREATE POLICY "Users can view their own learning path progress" ON public.user_learning_paths FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their own learning path progress" ON public.user_learning_paths FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own learning path progress" ON public.user_learning_paths FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Leaderboard is public but users can only update their own entry
CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_entries FOR SELECT USING (true);
CREATE POLICY "Users can insert their own leaderboard entry" ON public.leaderboard_entries FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update their own leaderboard entry" ON public.leaderboard_entries FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Insert some sample achievements
INSERT INTO public.achievements (name, description, type, criteria, icon, points, rarity) VALUES
('First Steps', 'Complete your first practice session', 'practice_milestone', '{"sessions_completed": 1}', '🎯', 10, 'common'),
('Perfect Score', 'Get 100% accuracy in a practice session', 'accuracy_streak', '{"accuracy": 100, "min_questions": 5}', '🎯', 50, 'rare'),
('Speed Demon', 'Answer 10 questions correctly in under 5 minutes', 'speed_challenge', '{"questions": 10, "time_limit": 300, "accuracy": 100}', '⚡', 75, 'epic'),
('Topic Master', 'Get 90% accuracy on 20+ questions in a single topic', 'topic_mastery', '{"accuracy": 90, "min_questions": 20}', '🏆', 100, 'epic'),
('Consistency King', 'Practice for 7 days in a row', 'consistency', '{"consecutive_days": 7}', '🔥', 150, 'legendary'),
('Question Machine', 'Answer 100 questions correctly', 'practice_milestone', '{"correct_answers": 100}', '🤖', 25, 'common'),
('Accuracy Expert', 'Maintain 85%+ accuracy over 50 questions', 'accuracy_streak', '{"accuracy": 85, "min_questions": 50}', '🎯', 80, 'rare'),
('Marathon Runner', 'Complete a 2-hour practice session', 'practice_milestone', '{"session_duration": 7200}', '🏃', 120, 'epic'),
('Triple Threat', 'Master 3 different topics', 'topic_mastery', '{"topics_mastered": 3}', '⭐', 200, 'legendary'),
('Perfectionist', 'Get 100% accuracy on 3 consecutive sessions', 'accuracy_streak', '{"consecutive_perfect_sessions": 3}', '💎', 300, 'legendary');

-- Insert some sample challenges (fixing the date syntax)
INSERT INTO public.practice_challenges (name, description, type, goals, rewards, start_date, end_date) VALUES
('Daily Practice', 'Complete 10 questions today', 'daily', '{"questions_target": 10}', '{"points": 20, "badge": "Daily Achiever"}', CURRENT_DATE, CURRENT_DATE),
('Weekly Warrior', 'Answer 100 questions this week with 80%+ accuracy', 'weekly', '{"questions_target": 100, "accuracy_target": 80}', '{"points": 150, "badge": "Weekly Warrior"}', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 days'),
('Speed Challenge', 'Complete 20 questions in under 10 minutes', 'daily', '{"questions_target": 20, "time_limit": 600}', '{"points": 100, "badge": "Speed Master"}', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days');

-- Insert some sample learning paths
INSERT INTO public.learning_paths (name, description, difficulty, topics, estimated_duration_hours, prerequisites) VALUES
('Mathematics Fundamentals', 'Master the basics of mathematics', 'beginner', ARRAY['Algebra', 'Geometry', 'Arithmetic'], 20, ARRAY[]::TEXT[]),
('Advanced Calculus', 'Deep dive into calculus concepts', 'advanced', ARRAY['Differential Calculus', 'Integral Calculus', 'Multivariable Calculus'], 40, ARRAY['Mathematics Fundamentals']),
('Physics Mastery', 'Complete physics understanding', 'intermediate', ARRAY['Mechanics', 'Thermodynamics', 'Electromagnetism'], 35, ARRAY['Mathematics Fundamentals']),
('Computer Science Basics', 'Introduction to computer science', 'beginner', ARRAY['Programming', 'Data Structures', 'Algorithms'], 30, ARRAY[]::TEXT[]);
