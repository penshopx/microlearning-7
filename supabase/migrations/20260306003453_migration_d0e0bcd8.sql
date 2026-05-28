-- Create table for "Live Sales CTA" feature (Competitive Advantage)
CREATE TABLE IF NOT EXISTS meeting_ctas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  price NUMERIC,
  discounted_price NUMERIC,
  image_url TEXT,
  button_text TEXT DEFAULT 'Buy Now',
  link_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meeting_ctas ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view active CTAs" ON meeting_ctas;
CREATE POLICY "Anyone can view active CTAs" ON meeting_ctas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Hosts can manage their CTAs" ON meeting_ctas;
CREATE POLICY "Hosts can manage their CTAs" ON meeting_ctas
  FOR ALL USING (auth.uid() = creator_id);

-- Add realtime support specifically for CTAs so participants see them instantly
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_ctas;