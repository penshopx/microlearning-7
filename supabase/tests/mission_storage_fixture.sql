-- Surrounding application schema for a disposable Supabase HTTP test only.
-- Auth and Storage schemas/roles/tables come from the real local services.
-- Historical application migrations assume pre-existing hosted tables; do not
-- replay that unrelated history into an empty local database.
CREATE TABLE public.courses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  is_published BOOLEAN DEFAULT false
);
CREATE TABLE public.course_modules (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id),
  title TEXT,
  module_number INTEGER,
  video_start_time INTEGER,
  video_end_time INTEGER,
  duration_seconds INTEGER
);
CREATE TABLE public.module_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.course_modules(id),
  content_type TEXT,
  title TEXT,
  content_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE public.module_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.course_modules(id)
);
CREATE TABLE public.learner_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES public.courses(id),
  module_id UUID REFERENCES public.course_modules(id),
  status TEXT,
  progress_percentage INTEGER,
  time_spent_seconds INTEGER,
  last_position_seconds INTEGER,
  quiz_score INTEGER,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, course_id, module_id)
);
CREATE TABLE public.profiles (id UUID PRIMARY KEY, role TEXT DEFAULT 'user');
CREATE TABLE public.learner_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_read ON public.courses FOR SELECT TO authenticated
  USING (is_published OR user_id = auth.uid());
CREATE POLICY module_read ON public.course_modules FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id
    AND (c.is_published OR c.user_id = auth.uid())));
CREATE POLICY content_read ON public.module_content FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND (c.is_published OR c.user_id = auth.uid())));
CREATE POLICY quiz_read ON public.module_quizzes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = module_id AND (c.is_published OR c.user_id = auth.uid())));
CREATE POLICY own_progress_read ON public.learner_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY own_progress_insert ON public.learner_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY own_progress_update ON public.learner_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
