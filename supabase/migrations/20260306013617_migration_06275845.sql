-- AI Helpdesk Chatbot Schema

-- 1. Chat conversations (user sessions)
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- For anonymous users
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  escalated_to_human BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Chat messages (conversation history)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot', 'support')),
  message_text TEXT NOT NULL,
  message_metadata JSONB DEFAULT '{}', -- For rich content (buttons, images, etc.)
  is_helpful BOOLEAN, -- User feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Helpdesk knowledge base (articles)
CREATE TABLE IF NOT EXISTS helpdesk_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_articles_category ON helpdesk_articles(category);
CREATE INDEX IF NOT EXISTS idx_helpdesk_articles_keywords ON helpdesk_articles USING GIN(keywords);

-- RLS Policies
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpdesk_articles ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING (
    auth.uid() = user_id OR 
    session_id = current_setting('app.session_id', true)
  );

-- Users can create conversations
CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (true);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations" ON chat_conversations
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    session_id = current_setting('app.session_id', true)
  );

-- Users can view messages in their conversations
CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM chat_conversations 
      WHERE auth.uid() = user_id OR session_id = current_setting('app.session_id', true)
    )
  );

-- Users can create messages
CREATE POLICY "Users can create messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

-- Everyone can view published articles
CREATE POLICY "Anyone can view published articles" ON helpdesk_articles
  FOR SELECT USING (is_published = true);

-- Grant permissions
GRANT ALL ON chat_conversations TO authenticated, anon;
GRANT ALL ON chat_messages TO authenticated, anon;
GRANT SELECT ON helpdesk_articles TO authenticated, anon;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Function to increment article views
CREATE OR REPLACE FUNCTION increment_article_views(article_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE helpdesk_articles 
  SET view_count = view_count + 1 
  WHERE id = article_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;