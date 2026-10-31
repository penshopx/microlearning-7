-- Run only through scripts/test-mission-evidence.sh in its disposable cluster.
-- Objects below are database rows, not HTTP Storage uploads or physical files.
BEGIN;
\set owner '00000000-0000-4000-8000-000000000001'
\set participant '00000000-0000-4000-8000-000000000002'
\set other '00000000-0000-4000-8000-000000000003'
\set course '10000000-0000-4000-8000-000000000001'
\set module '20000000-0000-4000-8000-000000000001'
\set legacy '20000000-0000-4000-8000-000000000002'
\set prefix '00000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001'
\set other_path '00000000-0000-4000-8000-000000000003/10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001/photo/proof.png'

CREATE FUNCTION public.test_assert(ok BOOLEAN, message TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', message; END IF;
END $$;

INSERT INTO auth.users VALUES (:'owner'), (:'participant'), (:'other');
INSERT INTO public.courses(id,user_id) VALUES (:'course',:'owner');
INSERT INTO public.course_modules VALUES
  (:'module',:'course','Workplace mission'),
  (:'legacy',:'course','Legacy worksheet');
INSERT INTO public.module_content(module_id,content_type,content_data) VALUES
  (:'module','worksheet','{"kind":"workplace-mission","evidence":[{"id":"photo","required":true},{"id":"notes","required":false}]}'),
  (:'legacy','worksheet','{"kind":"legacy-worksheet","evidence":["not-a-mission"]}');
-- Use the real assignment migration to make the blueprint visible under RLS.
INSERT INTO public.mission_supervisor_assignments(course_id,participant_id,supervisor_id)
VALUES (:'course',:'participant',:'other');
INSERT INTO storage.buckets(id,name,public) VALUES ('test-other-bucket','test-other-bucket',false);
INSERT INTO storage.objects(bucket_id,name)
VALUES ('test-other-bucket',:'prefix'||'/photo/wrong-bucket.png');

CREATE TEMP TABLE evidence_cases(label TEXT, mission JSONB);
GRANT SELECT ON evidence_cases TO authenticated;
INSERT INTO evidence_cases VALUES
  ('fabricated metadata with no object', jsonb_build_object(
    'evidenceConfirmed',true,'evidenceUploads',jsonb_build_array(jsonb_build_object(
      'evidenceId','photo','storagePath',:'prefix'||'/photo/missing.png',
      'fileName','missing.png','mimeType','image/png','sizeBytes',32,'uploadedAt',now())))),
  ('another participant path',jsonb_build_object('evidenceUploads',jsonb_build_array(
    jsonb_build_object('evidenceId','photo','storagePath',:'other_path')))),
  ('wrong course',jsonb_build_object('evidenceUploads',jsonb_build_array(
    jsonb_build_object('evidenceId','photo','storagePath',
      :'participant'||'/10000000-0000-4000-8000-000000000099/'||:'module'||'/photo/proof.png')))),
  ('wrong module',jsonb_build_object('evidenceUploads',jsonb_build_array(
    jsonb_build_object('evidenceId','photo','storagePath',
      :'participant'||'/'||:'course'||'/20000000-0000-4000-8000-000000000099/photo/proof.png')))),
  ('wrong evidence namespace',jsonb_build_object('evidenceUploads',jsonb_build_array(
    jsonb_build_object('evidenceId','photo','storagePath',:'prefix'||'/notes/proof.png')))),
  ('evidence namespace prefix collision',jsonb_build_object('evidenceUploads',jsonb_build_array(
    jsonb_build_object('evidenceId','photo','storagePath',:'prefix'||'/photo-extra/proof.png')))),
  ('wrong bucket',jsonb_build_object('evidenceUploads',jsonb_build_array(
    jsonb_build_object('evidenceId','photo','storagePath',:'prefix'||'/photo/wrong-bucket.png')))),
  ('wrong evidence ID',jsonb_build_object('evidenceUploads',jsonb_build_array(
    jsonb_build_object('evidenceId','notes','storagePath',:'prefix'||'/photo/proof.png')))),
  ('confirmation without uploads','{"evidenceConfirmed":true}'),
  ('malformed uploads','{"evidenceUploads":{"evidenceId":"photo"}}');

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :'other', true);
INSERT INTO storage.objects(bucket_id,name) VALUES ('mission-evidence',:'other_path');
SELECT set_config('request.jwt.claim.sub', :'participant', true);
SELECT public.test_assert(current_user = 'authenticated', 'tests are not running as a bypass-RLS role');
SELECT public.test_assert((SELECT count(*) = 1 FROM public.module_content
  WHERE content_data->>'kind' = 'workplace-mission'), 'blueprint is visible to the invoker');
SELECT public.test_assert((SELECT count(*) = 0 FROM storage.objects WHERE name = :'other_path'),
  'RLS hides another participant object');

-- All wrong namespaces except the owner are legal uploads; completion must
-- independently reject them, rather than passing because every object is absent.
INSERT INTO storage.objects(bucket_id,name)
SELECT 'mission-evidence', mission->'evidenceUploads'->0->>'storagePath'
FROM evidence_cases WHERE label IN
  ('wrong course','wrong module','wrong evidence namespace','evidence namespace prefix collision');
INSERT INTO storage.objects(bucket_id,name) VALUES ('mission-evidence',:'prefix'||'/photo/proof.png');
SELECT public.test_assert((SELECT count(*) = 5 FROM storage.objects),
  'owner can upload and read own objects');

DO $$ BEGIN
  BEGIN
    INSERT INTO storage.objects(bucket_id,name) VALUES ('mission-evidence',
      '00000000-0000-4000-8000-000000000003/forged-upload.png');
    RAISE EXCEPTION 'FAIL: upload into another user namespace accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
WITH deleted AS (
  DELETE FROM storage.objects
  WHERE name LIKE '00000000-0000-4000-8000-000000000003/%' RETURNING *
)
SELECT public.test_assert((SELECT count(*) = 0 FROM deleted), 'owner cannot delete another participant object');

-- A narrow exception assertion: permission errors, unrelated failures and
-- successful writes all fail this suite instead of being treated as rejection.
CREATE FUNCTION pg_temp.expect_evidence_rejection(command TEXT, label TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  BEGIN
    EXECUTE command;
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM = 'Required workplace mission evidence has not been uploaded' THEN
      RETURN;
    END IF;
    RAISE;
  END;
  RAISE EXCEPTION 'FAIL: accepted %', label;
END $$;

-- Positive INSERT controls ensure rejection checks cannot pass merely because
-- every completion write is broken. Roll back each control before testing drafts.
SAVEPOINT valid_insert;
SELECT public.test_assert((public.upsert_learner_progress_atomic(
  :'course',:'module','completed',100,NULL,NULL,NULL,
  jsonb_build_object('evidenceUploads',jsonb_build_array(jsonb_build_object(
    'evidenceId','photo','storagePath',:'prefix'||'/photo/proof.png')))
)).status = 'completed', 'valid owner-scoped evidence inserts via RPC');
ROLLBACK TO SAVEPOINT valid_insert;
INSERT INTO public.learner_progress(user_id,course_id,module_id,status,mission_progress)
VALUES (auth.uid(),:'course',:'module','completed',
  jsonb_build_object('evidenceUploads',jsonb_build_array(jsonb_build_object(
    'evidenceId','photo','storagePath',:'prefix'||'/photo/proof.png'))));
SELECT public.test_assert((SELECT status = 'completed' FROM public.learner_progress
  WHERE module_id = :'module'), 'valid owner-scoped evidence inserts directly');
ROLLBACK TO SAVEPOINT valid_insert;
RELEASE SAVEPOINT valid_insert;

-- Test both INSERT and UPDATE, through the app RPC and direct table writes.
DO $$
DECLARE
  item RECORD;
  phase TEXT;
  c CONSTANT UUID := '10000000-0000-4000-8000-000000000001';
  m CONSTANT UUID := '20000000-0000-4000-8000-000000000001';
BEGIN
  FOREACH phase IN ARRAY ARRAY['insert','update'] LOOP
    IF phase = 'update' THEN
      PERFORM public.upsert_learner_progress_atomic(c,m,'in_progress',25,NULL,NULL,NULL,'{}');
    END IF;
    FOR item IN SELECT * FROM evidence_cases LOOP
      PERFORM pg_temp.expect_evidence_rejection(format(
        'SELECT public.upsert_learner_progress_atomic(%L,%L,%L,100,NULL,NULL,NULL,%L::jsonb)',
        c,m,'completed',item.mission), phase || ' RPC: ' || item.label);
      IF phase = 'insert' THEN
        PERFORM pg_temp.expect_evidence_rejection(format(
          'INSERT INTO public.learner_progress(user_id,course_id,module_id,status,mission_progress)
           VALUES (auth.uid(),%L,%L,%L,%L::jsonb)', c,m,'completed',item.mission),
          'direct insert: ' || item.label);
      ELSE
        PERFORM pg_temp.expect_evidence_rejection(format(
          'UPDATE public.learner_progress SET status=%L, mission_progress=%L::jsonb WHERE module_id=%L',
          'completed',item.mission,m), 'direct update: ' || item.label);
      END IF;
      IF phase = 'insert' THEN
        PERFORM public.test_assert((SELECT count(*) = 0 FROM public.learner_progress),
          'rejected insert leaves no progress row');
      ELSE
        PERFORM public.test_assert((SELECT status = 'in_progress' AND mission_progress = '{}'::jsonb
          AND progress_percentage = 25 AND completed_at IS NULL
          FROM public.learner_progress WHERE module_id = m), 'rejected update preserves draft');
      END IF;
      RAISE NOTICE 'PASS: % RPC and direct write reject %', phase, item.label;
    END LOOP;
  END LOOP;
END $$;

-- Optional evidence is not required; a real object under the exact namespace is.
SELECT public.test_assert((public.upsert_learner_progress_atomic(
  :'course',:'module','completed',100,NULL,NULL,NULL,
  jsonb_build_object('evidenceUploads',jsonb_build_array(jsonb_build_object(
    'evidenceId','photo','storagePath',:'prefix'||'/photo/proof.png')))
)).status = 'completed', 'valid owner-scoped evidence completes via RPC');
SELECT public.test_assert((SELECT completed_at IS NOT NULL AND progress_percentage = 100
  FROM public.learner_progress WHERE module_id = :'module'), 'completion persisted');
SELECT pg_temp.expect_evidence_rejection(format(
  'UPDATE public.learner_progress SET mission_progress=%L::jsonb WHERE module_id=%L',
  '{}', :'module'), 'removing evidence from an already completed row');
UPDATE public.learner_progress SET time_spent_seconds = 12 WHERE module_id = :'module';
SELECT public.test_assert((SELECT status = 'completed' AND time_spent_seconds = 12
  AND jsonb_array_length(mission_progress->'evidenceUploads') = 1
  FROM public.learner_progress WHERE module_id = :'module'),
  'ordinary direct update preserves valid completed evidence');

-- Both direct INSERT and the application RPC preserve the no-blueprint flow.
INSERT INTO public.learner_progress(user_id,course_id,module_id,status,mission_progress)
VALUES (auth.uid(),:'course',:'legacy','completed','{}');
SELECT public.test_assert((public.upsert_learner_progress_atomic(
  :'course',:'legacy','completed',100,NULL,NULL,NULL,'{}'
)).status = 'completed', 'legacy worksheet completes without mission evidence');

-- Exercise owner deletion RLS too, without relying on privileged cleanup.
WITH deleted AS (
  DELETE FROM storage.objects WHERE name = :'prefix'||'/photo/proof.png' RETURNING *
)
SELECT public.test_assert((SELECT count(*) = 1 FROM deleted), 'owner can delete own evidence');
RESET ROLE;
SELECT public.test_assert((SELECT count(*) = 1 FROM storage.objects WHERE name = :'other_path'),
  'another participant object was not deleted');
ROLLBACK;

-- Rollback removes fixtures even after successful completion; the runner also
-- destroys the entire cluster on failure, interruption, or success.
DO $$
DECLARE table_name TEXT; remaining BIGINT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'auth.users','public.courses','public.course_modules','public.module_content',
    'public.learner_progress','public.mission_supervisor_assignments',
    'public.mission_evidence_reviews','storage.objects'
  ] LOOP
    EXECUTE format('SELECT count(*) FROM %s',table_name) INTO remaining;
    IF remaining <> 0 THEN RAISE EXCEPTION 'FAIL: leftover test rows in %',table_name; END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'test-other-bucket') THEN
    RAISE EXCEPTION 'FAIL: leftover test bucket';
  END IF;
END $$;
\echo 'All mission evidence trigger, Storage RLS, legacy completion, and cleanup checks passed.'
