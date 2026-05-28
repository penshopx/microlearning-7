-- Micro-Learning Generator Database Schema

-- 1. Courses (Parent container for modules)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  total_duration_seconds INTEGER DEFAULT 0,
  total_modules INTEGER DEFAULT 0,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  enrollments_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  price_idr INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Course Modules (5-7 minute chunks)
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  video_start_time INTEGER NOT NULL, -- seconds from meeting start
  video_end_time INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  transcript TEXT,
  key_points TEXT[],
  is_preview BOOLEAN DEFAULT false, -- Free preview module
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, module_number)
);

-- 3. Module Content (Supporting materials per module)
CREATE TABLE IF NOT EXISTS module_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('slides', 'summary', 'flashcards', 'audio', 'infographic', 'worksheet')),
  title TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  file_size_bytes BIGINT,
  content_data JSONB, -- For embedded content (flashcards, quiz answers, etc)
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Module Quizzes (3-5 questions per module)
CREATE TABLE IF NOT EXISTS module_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB, -- For MCQ: ["Option A", "Option B", "Option C", "Option D"]
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id, question_number)
);

-- 5. Learner Progress (Track user learning journey)
CREATE TABLE IF NOT EXISTS learner_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  quiz_score INTEGER,
  quiz_attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id, module_id)
);

-- 6. Learner Achievements (Gamification)
CREATE TABLE IF NOT EXISTS learner_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('module_completed', 'course_completed', 'perfect_quiz', 'streak_7_days', 'fast_learner', 'early_bird')),
  achievement_title TEXT NOT NULL,
  achievement_description TEXT,
  badge_icon_url TEXT,
  points_earned INTEGER DEFAULT 0,
  metadata JSONB,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Social Media Exports (Track optimized content)
CREATE TABLE IF NOT EXISTS social_media_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES course_modules(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube_shorts', 'tiktok', 'instagram_reels', 'linkedin', 'twitter')),
  export_format TEXT NOT NULL, -- '9:16', '16:9', '1:1', etc
  video_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  hashtags TEXT[],
  duration_seconds INTEGER,
  views_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_published ON courses(is_published, published_at DESC);
CREATE INDEX idx_course_modules_course_id ON course_modules(course_id, module_number);
CREATE INDEX idx_module_content_module_id ON module_content(module_id, content_type);
CREATE INDEX idx_module_quizzes_module_id ON module_quizzes(module_id, question_number);
CREATE INDEX idx_learner_progress_user_course ON learner_progress(user_id, course_id);
CREATE INDEX idx_learner_progress_status ON learner_progress(user_id, status);
CREATE INDEX idx_learner_achievements_user ON learner_achievements(user_id, earned_at DESC);
CREATE INDEX idx_social_exports_user ON social_media_exports(user_id, platform);

-- RLS Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_exports ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Users can view published courses" ON courses FOR SELECT USING (is_published = true OR auth.uid() = user_id);
CREATE POLICY "Users can create their own courses" ON courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own courses" ON courses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own courses" ON courses FOR DELETE USING (auth.uid() = user_id);

-- Course modules policies
CREATE POLICY "Users can view modules of accessible courses" ON course_modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_modules.course_id AND (courses.is_published = true OR courses.user_id = auth.uid()))
);
CREATE POLICY "Course owners can manage modules" ON course_modules FOR ALL USING (
  EXISTS (SELECT 1 FROM courses WHERE courses.id = course_modules.course_id AND courses.user_id = auth.uid())
);

-- Module content policies
CREATE POLICY "Users can view content of accessible modules" ON module_content FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM course_modules cm
    JOIN courses c ON c.id = cm.course_id
    WHERE cm.id = module_content.module_id AND (c.is_published = true OR c.user_id = auth.uid())
  )
);
CREATE POLICY "Course owners can manage content" ON module_content FOR ALL USING (
  EXISTS (
    SELECT 1 FROM course_modules cm
    JOIN courses c ON c.id = cm.course_id
    WHERE cm.id = module_content.module_id AND c.user_id = auth.uid()
  )
);

-- Quiz policies
CREATE POLICY "Users can view quizzes of accessible modules" ON module_quizzes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM course_modules cm
    JOIN courses c ON c.id = cm.course_id
    WHERE cm.id = module_quizzes.module_id AND (c.is_published = true OR c.user_id = auth.uid())
  )
);
CREATE POLICY "Course owners can manage quizzes" ON module_quizzes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM course_modules cm
    JOIN courses c ON c.id = cm.course_id
    WHERE cm.id = module_quizzes.module_id AND c.user_id = auth.uid()
  )
);

-- Progress policies
CREATE POLICY "Users can view their own progress" ON learner_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress" ON learner_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON learner_progress FOR UPDATE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view their own achievements" ON learner_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create achievements" ON learner_achievements FOR INSERT WITH CHECK (true);

-- Social exports policies
CREATE POLICY "Users can view their own exports" ON social_media_exports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create exports" ON social_media_exports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their exports" ON social_media_exports FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for gamification
ALTER PUBLICATION supabase_realtime ADD TABLE learner_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE learner_achievements;

-- Functions for achievements
CREATE OR REPLACE FUNCTION award_achievement(
  p_user_id UUID,
  p_achievement_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_points INTEGER DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
  achievement_id UUID;
BEGIN
  -- Check if user already has this achievement
  IF NOT EXISTS (
    SELECT 1 FROM learner_achievements 
    WHERE user_id = p_user_id AND achievement_type = p_achievement_type
  ) THEN
    INSERT INTO learner_achievements (user_id, achievement_type, achievement_title, achievement_description, points_earned)
    VALUES (p_user_id, p_achievement_type, p_title, p_description, p_points)
    RETURNING id INTO achievement_id;
    
    RETURN achievement_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update course statistics
CREATE OR REPLACE FUNCTION update_course_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE courses
    SET 
      total_modules = (SELECT COUNT(*) FROM course_modules WHERE course_id = NEW.course_id),
      total_duration_seconds = (SELECT COALESCE(SUM(duration_seconds), 0) FROM course_modules WHERE course_id = NEW.course_id),
      updated_at = NOW()
    WHERE id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON course_modules
FOR EACH ROW EXECUTE FUNCTION update_course_stats();