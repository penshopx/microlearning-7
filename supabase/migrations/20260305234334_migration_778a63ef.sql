-- Create polls table
CREATE TABLE IF NOT EXISTS meeting_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES meeting_polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Create Q&A table
CREATE TABLE IF NOT EXISTS meeting_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_answered BOOLEAN DEFAULT FALSE,
  answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create breakout rooms table
CREATE TABLE IF NOT EXISTS breakout_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create breakout room assignments
CREATE TABLE IF NOT EXISTS breakout_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES breakout_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on all new tables
ALTER TABLE meeting_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakout_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakout_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Anyone in meeting can view polls" ON meeting_polls FOR SELECT USING (true);
CREATE POLICY "Anyone in meeting can create polls" ON meeting_polls FOR INSERT WITH CHECK (true);
CREATE POLICY "Creator can update polls" ON meeting_polls FOR UPDATE USING (true);
CREATE POLICY "Creator can delete polls" ON meeting_polls FOR DELETE USING (true);

-- RLS Policies for poll votes
CREATE POLICY "Anyone can view votes" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can vote" ON poll_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own votes" ON poll_votes FOR UPDATE USING (true);

-- RLS Policies for questions
CREATE POLICY "Anyone in meeting can view questions" ON meeting_questions FOR SELECT USING (true);
CREATE POLICY "Anyone in meeting can create questions" ON meeting_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update questions" ON meeting_questions FOR UPDATE USING (true);

-- RLS Policies for breakout rooms
CREATE POLICY "Anyone in meeting can view rooms" ON breakout_rooms FOR SELECT USING (true);
CREATE POLICY "Host can manage rooms" ON breakout_rooms FOR ALL USING (true);

-- RLS Policies for breakout assignments
CREATE POLICY "Anyone can view assignments" ON breakout_assignments FOR SELECT USING (true);
CREATE POLICY "Host can manage assignments" ON breakout_assignments FOR ALL USING (true);