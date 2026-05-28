-- Enhanced AI Features Schema

-- 1. Add AI transcription support to meetings
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS transcription_status TEXT CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS transcription_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_summary TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS action_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS key_moments JSONB DEFAULT '[]'::jsonb;

-- 2. Create table for AI meeting notes (real-time during meeting)
CREATE TABLE IF NOT EXISTS ai_meeting_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  speaker_id UUID REFERENCES meeting_participants(id),
  speaker_name TEXT,
  text TEXT NOT NULL,
  note_type TEXT CHECK (note_type IN ('speech', 'action_item', 'decision', 'question', 'important')) DEFAULT 'speech',
  sentiment FLOAT CHECK (sentiment >= -1 AND sentiment <= 1), -- -1 (negative) to 1 (positive)
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create table for content export history
CREATE TABLE IF NOT EXISTS content_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES generated_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_format TEXT NOT NULL CHECK (export_format IN ('pdf', 'pptx', 'epub', 'scorm', 'docx', 'mp3', 'mp4')),
  export_destination TEXT CHECK (export_destination IN ('download', 'google_drive', 'notion', 'email', 'lms')),
  file_url TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_notes_meeting ON ai_meeting_notes(meeting_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_notes_type ON ai_meeting_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_content_exports_user ON content_exports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_exports_status ON content_exports(status);

-- 5. RLS Policies
ALTER TABLE ai_meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_exports ENABLE ROW LEVEL SECURITY;

-- AI Notes policies
CREATE POLICY "Users can view notes from their meetings" ON ai_meeting_notes
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE host_id = auth.uid()
      UNION
      SELECT meeting_id FROM meeting_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert notes" ON ai_meeting_notes
  FOR INSERT WITH CHECK (true); -- API will handle auth

-- Export policies
CREATE POLICY "Users can view their exports" ON content_exports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create exports" ON content_exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Enable realtime for AI features
ALTER PUBLICATION supabase_realtime ADD TABLE ai_meeting_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE content_exports;

-- 7. Function to get meeting statistics
CREATE OR REPLACE FUNCTION get_meeting_stats(meeting_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_duration', EXTRACT(EPOCH FROM (ended_at - created_at))::INT,
    'participant_count', (SELECT COUNT(*) FROM meeting_participants WHERE meeting_id = meeting_uuid),
    'message_count', (SELECT COUNT(*) FROM meeting_chat WHERE meeting_id = meeting_uuid),
    'action_items', (SELECT COUNT(*) FROM ai_meeting_notes WHERE meeting_id = meeting_uuid AND note_type = 'action_item'),
    'decisions', (SELECT COUNT(*) FROM ai_meeting_notes WHERE meeting_id = meeting_uuid AND note_type = 'decision'),
    'average_sentiment', (SELECT AVG(sentiment) FROM ai_meeting_notes WHERE meeting_id = meeting_uuid AND sentiment IS NOT NULL)
  ) INTO result
  FROM meetings WHERE id = meeting_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;