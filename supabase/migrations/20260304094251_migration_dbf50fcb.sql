-- Drop existing policy and create new ones that allow guest users
DROP POLICY IF EXISTS "Authenticated users can create meetings" ON meetings;

-- Allow anyone (including guest) to create meetings
CREATE POLICY "Anyone can create meetings" ON meetings
  FOR INSERT WITH CHECK (true);

-- Update RLS for participants to allow guest users
DROP POLICY IF EXISTS "Authenticated users can join meetings" ON meeting_participants;

CREATE POLICY "Anyone can join meetings" ON meeting_participants
  FOR INSERT WITH CHECK (true);

-- Update RLS for participants update to allow guests
DROP POLICY IF EXISTS "Users can update their own participant status" ON meeting_participants;

CREATE POLICY "Users can update their participant status" ON meeting_participants
  FOR UPDATE USING (true);

-- Allow anyone to send signals (for guest users)
DROP POLICY IF EXISTS "Users can send signals" ON webrtc_signals;

CREATE POLICY "Anyone can send signals" ON webrtc_signals
  FOR INSERT WITH CHECK (true);

-- Allow anyone to view signals
DROP POLICY IF EXISTS "Users can view signals for their meetings" ON webrtc_signals;

CREATE POLICY "Anyone can view signals" ON webrtc_signals
  FOR SELECT USING (true);

-- Make host_id and user_id nullable for guest support
ALTER TABLE meetings ALTER COLUMN host_id DROP NOT NULL;
ALTER TABLE meeting_participants ALTER COLUMN user_id DROP NOT NULL;

-- Create a guest_users table to track guest sessions
CREATE TABLE IF NOT EXISTS guest_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on guest_users
ALTER TABLE guest_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create and read guest users
CREATE POLICY "Anyone can create guest users" ON guest_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view guest users" ON guest_users
  FOR SELECT USING (true);