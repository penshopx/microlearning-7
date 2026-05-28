-- 1. Update meeting_ctas table to support rich content
ALTER TABLE meeting_ctas 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS button_color TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 30;

-- Rename link_url to button_url for consistency if needed, or just map it in code. 
-- Let's stick to adding columns first.

-- 2. Add 'studio_settings' to meetings table for Creators
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS allow_high_quality_audio BOOLEAN DEFAULT true;

-- 3. Create table for "AI Course Generation" queue
CREATE TABLE IF NOT EXISTS meeting_recordings_processing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  generated_title TEXT,
  generated_summary TEXT,
  chapters JSONB, -- Array of timestamps and titles
  quiz_questions JSONB, -- AI generated quiz
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meeting_recordings_processing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own processings" ON meeting_recordings_processing FOR ALL USING (auth.uid() = user_id);