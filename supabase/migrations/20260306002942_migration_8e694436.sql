-- Update Pricing Strategy to be Competitive (IDR)
-- Free Plan: Generous enough to taste
UPDATE subscription_plans 
SET 
  price_monthly = 0,
  price_yearly = 0,
  max_duration_minutes = 45, -- Naikkan dikit dari Zoom (40) biar menang
  features = '["Up to 100 participants", "45 mins group meetings", "Unlimited 1-on-1", "Smart CTA (Basic)", "Screen sharing"]'
WHERE name = 'Free';

-- Pro Plan: Super Affordable (Rp 69rb)
UPDATE subscription_plans 
SET 
  price_monthly = 69000,
  price_yearly = 690000, -- 2 bulan gratis
  features = '["Unlimited duration", "Up to 100 participants", "AI Meeting Summary", "Push Sales CTA", "Cloud Recording (5GB)", "Live Streaming (RTMP)"]'
WHERE name = 'Pro';

-- Business: Still cheap (Rp 149rb)
UPDATE subscription_plans 
SET 
  price_monthly = 149000,
  price_yearly = 1490000,
  features = '["Up to 300 participants", "20GB Cloud Storage", "White-label Branding", "Advanced AI Analytics", "Priority Support", "API Access"]'
WHERE name = 'Business';

-- Create table for CTA (Call to Action) feature
CREATE TABLE IF NOT EXISTS meeting_ctas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  button_text TEXT NOT NULL,
  link_url TEXT NOT NULL,
  price DECIMAL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for CTA
ALTER TABLE meeting_ctas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone in meeting can view active CTA" ON meeting_ctas FOR SELECT USING (true);
CREATE POLICY "Host can manage CTA" ON meeting_ctas FOR ALL USING (auth.uid() = creator_id);