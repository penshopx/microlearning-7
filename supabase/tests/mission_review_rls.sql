-- Run after the evidence and supervisor-review migrations in a disposable cluster.
-- The signed-URL assertions exercise the storage.objects SELECT permission that
-- Supabase Storage requires before it can mint a signed URL.
BEGIN;

\set participant '00000000-0000-4000-8000-000000000002'
\set owner_a '00000000-0000-4000-8000-000000000006'
\set owner_b '00000000-0000-4000-8000-000000000007'
\set course_a '10000000-0000-4000-8000-000000000006'
\set course_b '10000000-0000-4000-8000-000000000007'
\set module_a '20000000-0000-4000-8000-000000000006'
\set module_b '20000000-0000-4000-8000-000000000007'
\set progress_a '30000000-0000-4000-8000-000000000006'
\set progress_b '30000000-0000-4000-8000-000000000007'
\set path_a '00000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000006/20000000-0000-4000-8000-000000000006/photo/course-a.png'
\set path_b '00000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000007/20000000-0000-4000-8000-000000000007/photo/course-b.png'
\set unlinked_path '00000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000006/20000000-0000-4000-8000-000000000006/photo/not-submitted.png'

CREATE OR REPLACE FUNCTION public.test_assert(ok BOOLEAN, message TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'FAIL: %', message;
  END IF;
END
$$;

-- Mirrors the authorization lookup Storage performs before signing an object.
CREATE OR REPLACE FUNCTION public.test_signed_url_authorized(p_path TEXT)
RETURNS BOOLEAN LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE bucket_id = 'mission-evidence' AND name = p_path
  )
$$;

INSERT INTO auth.users(id) VALUES (:'owner_a'), (:'owner_b');
INSERT INTO public.courses(id, user_id, is_published) VALUES
  (:'course_a', :'owner_a', true),
  (:'course_b', :'owner_b', true);
INSERT INTO public.course_modules(id, course_id, title) VALUES
  (:'module_a', :'course_a', 'Course A practice'),
  (:'module_b', :'course_b', 'Course B practice');
INSERT INTO public.module_content(module_id, content_type, content_data) VALUES
  (:'module_a', 'worksheet', '{"kind":"workplace-mission","evidence":[{"id":"photo","required":true}]}'),
  (:'module_b', 'worksheet', '{"kind":"workplace-mission","evidence":[{"id":"photo","required":true}]}');
INSERT INTO storage.objects(bucket_id, name) VALUES
  ('mission-evidence', :'path_a'),
  ('mission-evidence', :'path_b'),
  ('mission-evidence', :'unlinked_path');

-- These rows are fixtures, not learner submissions. Bypass only the evidence
-- validator during setup; the authorization checks below still run as users.
ALTER TABLE public.learner_progress DISABLE TRIGGER validate_workplace_mission_evidence;
ALTER TABLE public.learner_progress DISABLE TRIGGER guard_mission_progress_version;
INSERT INTO public.learner_progress(
  id, user_id, course_id, module_id, status, mission_progress
) VALUES
  (:'progress_a', :'participant', :'course_a', :'module_a', 'completed',
    jsonb_build_object('evidenceUploads', jsonb_build_array(jsonb_build_object(
      'evidenceId', 'photo', 'storagePath', :'path_a', 'fileName', 'course-a.png',
      'mimeType', 'image/png', 'sizeBytes', 100, 'uploadedAt', now()
    )))),
  (:'progress_b', :'participant', :'course_b', :'module_b', 'completed',
    jsonb_build_object('evidenceUploads', jsonb_build_array(jsonb_build_object(
      'evidenceId', 'photo', 'storagePath', :'path_b', 'fileName', 'course-b.png',
      'mimeType', 'image/png', 'sizeBytes', 100, 'uploadedAt', now()
    ))));
ALTER TABLE public.learner_progress ENABLE TRIGGER validate_workplace_mission_evidence;
ALTER TABLE public.learner_progress ENABLE TRIGGER guard_mission_progress_version;

INSERT INTO public.mission_reviews(
  id, learner_progress_id, reviewer_id, review_status,
  glow_feedback, grow_feedback, next_steps
) VALUES
  ('40000000-0000-4000-8000-000000000006', :'progress_a', :'owner_a', 'completed',
    'Course A strength', 'Course A improvement', 'Course A next step'),
  ('40000000-0000-4000-8000-000000000007', :'progress_b', :'owner_b', 'completed',
    'Course B strength', 'Course B improvement', 'Course B next step');
INSERT INTO public.mission_review_comments(
  review_id, reviewer_id, evidence_id, timestamp_seconds, comment_text
) VALUES
  ('40000000-0000-4000-8000-000000000006', :'owner_a', 'photo', 4, 'Course A comment'),
  ('40000000-0000-4000-8000-000000000007', :'owner_b', 'photo', 8, 'Course B comment');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :'participant', false);
SELECT public.test_assert(
  (SELECT count(*) = 2 FROM public.learner_progress
   WHERE id IN (:'progress_a', :'progress_b')),
  'learner can read both of their progress rows'
);
SELECT public.test_assert(
  (SELECT count(*) = 2 FROM public.mission_reviews
   WHERE learner_progress_id IN (:'progress_a', :'progress_b')),
  'learner can read both of their reviews'
);
SELECT public.test_assert(
  (SELECT count(*) = 2 FROM public.mission_review_comments),
  'learner can read comments on their reviews'
);
SELECT public.test_assert(
  (SELECT count(*) = 2 FROM storage.objects
   WHERE name IN (:'path_a', :'path_b')),
  'learner can read their submitted evidence'
);

SELECT set_config('request.jwt.claim.sub', :'owner_a', false);
SELECT public.test_assert(
  (SELECT count(*) = 1 FROM public.learner_progress
   WHERE id IN (:'progress_a', :'progress_b')) AND
  (SELECT count(*) = 1 FROM public.learner_progress WHERE id = :'progress_a'),
  'course A owner can list only progress from course A'
);
SELECT public.test_assert(
  (SELECT count(*) = 1 FROM public.mission_reviews
   WHERE learner_progress_id = :'progress_a') AND
  (SELECT count(*) = 0 FROM public.mission_reviews
   WHERE learner_progress_id = :'progress_b'),
  'course A owner reads their review but not course B review'
);
SELECT public.test_assert(
  (SELECT count(*) = 1 FROM public.mission_review_comments
   WHERE comment_text = 'Course A comment') AND
  (SELECT count(*) = 0 FROM public.mission_review_comments
   WHERE comment_text = 'Course B comment'),
  'course A owner reads their comments but not course B comments'
);
SELECT public.test_assert(
  (SELECT count(*) = 1 FROM storage.objects
   WHERE name IN (:'path_a', :'path_b', :'unlinked_path'))
  AND public.test_signed_url_authorized(:'path_a')
  AND NOT public.test_signed_url_authorized(:'path_b')
  AND NOT public.test_signed_url_authorized(:'unlinked_path'),
  'course A owner can sign only evidence attached to course A progress'
);

SELECT set_config('request.jwt.claim.sub', :'owner_b', false);
SELECT public.test_assert(
  (SELECT count(*) = 1 FROM public.learner_progress
   WHERE id IN (:'progress_a', :'progress_b')) AND
  (SELECT count(*) = 0 FROM public.learner_progress WHERE id = :'progress_a'),
  'course B owner cannot list course A progress'
);
SELECT public.test_assert(
  (SELECT count(*) = 0 FROM public.mission_reviews
   WHERE learner_progress_id = :'progress_a') AND
  (SELECT count(*) = 0 FROM public.mission_review_comments
   WHERE comment_text = 'Course A comment'),
  'course B owner cannot read course A review or comments'
);
SELECT public.test_assert(
  NOT public.test_signed_url_authorized(:'path_a')
  AND (SELECT count(*) = 1 FROM storage.objects
       WHERE name IN (:'path_a', :'path_b', :'unlinked_path')),
  'course B owner cannot create a signed URL for course A evidence'
);

RESET ROLE;
ROLLBACK;
\echo 'Course-scoped review, progress, comment, and evidence RLS checks passed.'
