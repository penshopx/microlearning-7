-- Minimal surrounding Supabase schema for disposable local policy tests.
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE anon NOLOGIN;
CREATE SCHEMA auth;
CREATE SCHEMA storage;
CREATE TABLE auth.users(id UUID PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
CREATE TABLE public.courses(id UUID PRIMARY KEY, user_id UUID REFERENCES auth.users, is_published BOOLEAN DEFAULT false);
CREATE TABLE public.course_modules(id UUID PRIMARY KEY, course_id UUID REFERENCES public.courses, title TEXT);
CREATE TABLE public.module_content(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), module_id UUID REFERENCES public.course_modules,
  content_type TEXT, content_data JSONB, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE public.module_quizzes(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), module_id UUID REFERENCES public.course_modules);
CREATE TABLE public.learner_progress(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users,
  course_id UUID REFERENCES public.courses, module_id UUID REFERENCES public.course_modules, status TEXT,
  progress_percentage INTEGER, time_spent_seconds INTEGER, last_position_seconds INTEGER, quiz_score INTEGER,
  completed_at TIMESTAMPTZ, updated_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id,course_id,module_id));
CREATE TABLE storage.buckets(id TEXT PRIMARY KEY, name TEXT, public BOOLEAN, file_size_limit BIGINT, allowed_mime_types TEXT[]);
CREATE TABLE storage.objects(id UUID PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id TEXT, name TEXT);
CREATE FUNCTION storage.foldername(TEXT) RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1, '/') $$;
GRANT USAGE ON SCHEMA public, auth, storage TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, storage TO authenticated;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_read ON public.courses FOR SELECT USING (is_published OR user_id = auth.uid());
CREATE POLICY module_read ON public.course_modules FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.is_published OR c.user_id = auth.uid())));
CREATE POLICY own_progress_read ON public.learner_progress FOR SELECT USING (user_id = auth.uid());
CREATE POLICY own_progress_insert ON public.learner_progress FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY own_progress_update ON public.learner_progress FOR UPDATE USING (user_id = auth.uid());
