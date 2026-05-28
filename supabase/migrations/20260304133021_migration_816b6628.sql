-- Drop foreign key constraints that prevent guest users from using the system
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_host_id_fkey;
ALTER TABLE meeting_participants DROP CONSTRAINT IF EXISTS meeting_participants_user_id_fkey;
ALTER TABLE webrtc_signals DROP CONSTRAINT IF EXISTS webrtc_signals_from_user_id_fkey;
ALTER TABLE webrtc_signals DROP CONSTRAINT IF EXISTS webrtc_signals_to_user_id_fkey;
ALTER TABLE meeting_chat DROP CONSTRAINT IF EXISTS meeting_chat_user_id_fkey;

-- Update RLS policies to work without foreign keys
-- Meetings: Anyone can update meetings (for ending them)
DROP POLICY IF EXISTS "Hosts can update their meetings" ON meetings;
CREATE POLICY "Anyone can update meetings" ON meetings
  FOR UPDATE USING (true);

-- Chat: Anyone can send and view chat messages
DROP POLICY IF EXISTS "Participants can send chat messages" ON meeting_chat;
DROP POLICY IF EXISTS "Users can view chat in their meetings" ON meeting_chat;

CREATE POLICY "Anyone can send chat messages" ON meeting_chat
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view chat messages" ON meeting_chat
  FOR SELECT USING (true);