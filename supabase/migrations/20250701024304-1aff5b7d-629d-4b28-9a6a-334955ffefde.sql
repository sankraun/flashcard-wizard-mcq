
-- Create table for storing generated PowerPoint presentations
CREATE TABLE public.powerpoint_presentations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- stores slides data
  file_url TEXT, -- URL to stored PPTX file if needed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for flashcards with spaced repetition
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  next_review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  review_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  ease_factor DECIMAL NOT NULL DEFAULT 2.5, -- for spaced repetition algorithm
  interval_days INTEGER NOT NULL DEFAULT 1,
  source_text TEXT, -- original text used to generate the flashcard
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for flashcard review sessions
CREATE TABLE public.flashcard_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
  was_correct BOOLEAN NOT NULL,
  difficulty_rating TEXT NOT NULL CHECK (difficulty_rating IN ('easy', 'medium', 'hard')),
  review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.powerpoint_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for powerpoint_presentations
CREATE POLICY "Users can view their own presentations" 
  ON public.powerpoint_presentations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own presentations" 
  ON public.powerpoint_presentations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presentations" 
  ON public.powerpoint_presentations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presentations" 
  ON public.powerpoint_presentations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for flashcards
CREATE POLICY "Users can view their own flashcards" 
  ON public.flashcards 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flashcards" 
  ON public.flashcards 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" 
  ON public.flashcards 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards" 
  ON public.flashcards 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for flashcard_reviews
CREATE POLICY "Users can view their own reviews" 
  ON public.flashcard_reviews 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reviews" 
  ON public.flashcard_reviews 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to update next_review_date based on spaced repetition algorithm
CREATE OR REPLACE FUNCTION update_flashcard_review(
  p_flashcard_id UUID,
  p_was_correct BOOLEAN,
  p_difficulty_rating TEXT
) RETURNS VOID AS $$
DECLARE
  current_ease_factor DECIMAL;
  current_interval INTEGER;
  new_ease_factor DECIMAL;
  new_interval INTEGER;
BEGIN
  -- Get current values
  SELECT ease_factor, interval_days 
  INTO current_ease_factor, current_interval
  FROM flashcards 
  WHERE id = p_flashcard_id;
  
  -- Calculate new ease factor based on difficulty rating
  IF p_was_correct THEN
    CASE p_difficulty_rating
      WHEN 'easy' THEN
        new_ease_factor := current_ease_factor + 0.15;
        new_interval := GREATEST(current_interval * 2, 6);
      WHEN 'medium' THEN
        new_ease_factor := current_ease_factor;
        new_interval := GREATEST(current_interval * current_ease_factor, 2);
      WHEN 'hard' THEN
        new_ease_factor := GREATEST(current_ease_factor - 0.2, 1.3);
        new_interval := GREATEST(current_interval * current_ease_factor * 0.8, 1);
    END CASE;
  ELSE
    -- Incorrect answer - reset interval and decrease ease factor
    new_ease_factor := GREATEST(current_ease_factor - 0.2, 1.3);
    new_interval := 1;
  END IF;
  
  -- Update flashcard
  UPDATE flashcards 
  SET 
    ease_factor = new_ease_factor,
    interval_days = new_interval,
    next_review_date = now() + (new_interval * INTERVAL '1 day'),
    review_count = review_count + 1,
    correct_count = correct_count + CASE WHEN p_was_correct THEN 1 ELSE 0 END,
    updated_at = now()
  WHERE id = p_flashcard_id;
END;
$$ LANGUAGE plpgsql;
