
-- Create a table for flashcards
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  category TEXT,
  original_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own flashcards
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own flashcards
CREATE POLICY "Users can view their own flashcards" 
  ON public.flashcards 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own flashcards
CREATE POLICY "Users can create their own flashcards" 
  ON public.flashcards 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own flashcards
CREATE POLICY "Users can update their own flashcards" 
  ON public.flashcards 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own flashcards
CREATE POLICY "Users can delete their own flashcards" 
  ON public.flashcards 
  FOR DELETE 
  USING (auth.uid() = user_id);
