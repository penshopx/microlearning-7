-- Add metadata column to meetings if it doesn't exist
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;