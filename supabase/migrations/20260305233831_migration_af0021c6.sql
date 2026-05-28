-- Add is_locked to meetings table
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- Add hand_raised to meeting_participants table
ALTER TABLE meeting_participants 
ADD COLUMN IF NOT EXISTS hand_raised BOOLEAN DEFAULT FALSE;