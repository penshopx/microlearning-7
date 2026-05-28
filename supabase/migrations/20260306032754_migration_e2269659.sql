-- 1. Ensure profiles has subscription cache columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- 2. Ensure meetings has duration tracking
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
  ) STORED;

-- 3. Trigger to auto-create profile on signup (Safety check)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Function to check meeting limits (Updated for user_subscriptions)
CREATE OR REPLACE FUNCTION public.check_meeting_limits(
  p_meeting_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  user_plan TEXT;
  meeting_start TIMESTAMPTZ;
  meeting_duration INTEGER;
  max_duration INTEGER;
  time_remaining INTEGER;
  result JSONB;
BEGIN
  -- Get user subscription plan from profiles (cached) or user_subscriptions
  SELECT 
    COALESCE(p.subscription_plan, sp.name, 'free') INTO user_plan
  FROM profiles p
  LEFT JOIN user_subscriptions us ON us.user_id = p.id AND us.status = 'active'
  LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE p.id = p_user_id;
  
  -- Get meeting start time
  SELECT started_at INTO meeting_start
  FROM meetings WHERE id = p_meeting_id;
  
  -- If meeting hasn't started, return standard limits
  IF meeting_start IS NULL THEN
     CASE user_plan
      WHEN 'free' THEN max_duration := 40;
      ELSE max_duration := NULL; -- Unlimited
    END CASE;
    
    RETURN jsonb_build_object(
      'should_end', false,
      'time_remaining', max_duration,
      'max_duration', max_duration,
      'is_pro', user_plan != 'free'
    );
  END IF;

  -- Calculate current duration
  meeting_duration := EXTRACT(EPOCH FROM (NOW() - meeting_start)) / 60;
  
  -- Determine max duration based on plan
  CASE user_plan
    WHEN 'free' THEN max_duration := 40;
    ELSE max_duration := NULL; -- Unlimited
  END CASE;
  
  -- Check if limit exceeded
  IF max_duration IS NOT NULL AND meeting_duration >= max_duration THEN
    result := jsonb_build_object(
      'should_end', true,
      'reason', 'duration',
      'max_duration', max_duration,
      'current_duration', meeting_duration,
      'is_pro', false
    );
  ELSE
    time_remaining := CASE WHEN max_duration IS NULL THEN NULL ELSE max_duration - meeting_duration END;
    result := jsonb_build_object(
      'should_end', false,
      'time_remaining', time_remaining,
      'max_duration', max_duration,
      'is_pro', user_plan != 'free'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;