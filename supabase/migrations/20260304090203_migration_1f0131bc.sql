-- Create meetings table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_code TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create meeting_participants table
CREATE TABLE meeting_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_camera_on BOOLEAN DEFAULT true,
  is_mic_on BOOLEAN DEFAULT true,
  is_screen_sharing BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(meeting_id, user_id)
);

-- Create webrtc_signals table for peer-to-peer signaling
CREATE TABLE webrtc_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL, -- 'offer', 'answer', 'ice-candidate'
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meeting_chat table
CREATE TABLE meeting_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE webrtc_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
CREATE POLICY "Anyone can view active meetings" ON meetings FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can create meetings" ON meetings FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their meetings" ON meetings FOR UPDATE USING (auth.uid() = host_id);

-- RLS Policies for meeting_participants
CREATE POLICY "Anyone can view participants in active meetings" ON meeting_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM meetings WHERE id = meeting_id AND is_active = true)
);
CREATE POLICY "Authenticated users can join meetings" ON meeting_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own participant status" ON meeting_participants FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for webrtc_signals
CREATE POLICY "Users can view signals for their meetings" ON webrtc_signals FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_user_id
);
CREATE POLICY "Users can send signals" ON webrtc_signals FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can delete old signals" ON webrtc_signals FOR DELETE USING (auth.uid() = from_user_id);

-- RLS Policies for meeting_chat
CREATE POLICY "Users can view chat in their meetings" ON meeting_chat FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM meeting_participants 
    WHERE meeting_id = meeting_chat.meeting_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY "Participants can send chat messages" ON meeting_chat FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM meeting_participants 
    WHERE meeting_id = meeting_chat.meeting_id 
    AND user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_meetings_code ON meetings(meeting_code);
CREATE INDEX idx_meetings_active ON meetings(is_active);
CREATE INDEX idx_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX idx_signals_meeting ON webrtc_signals(meeting_id);
CREATE INDEX idx_signals_to_user ON webrtc_signals(to_user_id);
CREATE INDEX idx_chat_meeting ON meeting_chat(meeting_id);