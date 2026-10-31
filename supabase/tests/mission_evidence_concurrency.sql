-- Latest schema tests. Disposable fixtures deliberately persist for the real
-- multi-connection races in the runner; no remote database is ever contacted.
CREATE FUNCTION public.test_assert(ok BOOLEAN, message TEXT) RETURNS VOID
LANGUAGE plpgsql AS $$
BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', message; END IF;
END $$;
INSERT INTO auth.users VALUES ('00000000-0000-4000-8000-000000000001'),
 ('00000000-0000-4000-8000-000000000002'),
 ('00000000-0000-4000-8000-000000000003');
INSERT INTO public.courses(id,user_id,is_published) VALUES
 ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',true);
-- The production blueprint policy grants participant access through scope.
-- Without this fixture, a SECURITY INVOKER validator cannot see the mission.
INSERT INTO public.mission_supervisor_assignments(course_id,participant_id,supervisor_id)
VALUES ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',
 '00000000-0000-4000-8000-000000000003');
INSERT INTO public.course_modules(id,course_id,title) VALUES
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Evidence'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Racing');
INSERT INTO public.module_content(module_id,content_type,content_data) VALUES
 ('20000000-0000-4000-8000-000000000001','worksheet',
  '{"kind":"workplace-mission","evidence":[{"id":"photo","required":true},{"id":"notes","required":false}]}');

CREATE FUNCTION public.test_upload(label TEXT, evidence_id TEXT DEFAULT 'photo')
RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE path TEXT := auth.uid()::text ||
 '/10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001/' ||
 evidence_id || '/' || label || '.png';
BEGIN
  INSERT INTO storage.objects(bucket_id,name) VALUES ('mission-evidence',path);
  RETURN jsonb_build_object('evidenceId',evidence_id,'storagePath',path);
END $$;
CREATE FUNCTION public.test_save(revision BIGINT, uploads JSONB, target_status TEXT DEFAULT 'in_progress')
RETURNS public.learner_progress LANGUAGE sql SECURITY INVOKER AS $$
  SELECT public.save_mission_progress(
    '10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',
    target_status,75,jsonb_build_object('evidenceUploads',uploads),revision);
$$;
CREATE FUNCTION public.test_conflict(revision BIGINT, uploads JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  BEGIN
    PERFORM public.test_save(revision,uploads);
  EXCEPTION WHEN serialization_failure THEN RETURN;
  END;
  RAISE EXCEPTION 'FAIL: stale session silently saved';
END $$;

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
DO $$
DECLARE
  a JSONB; b JSONB; replacement JSONB; loser JSONB; row public.learner_progress;
  path TEXT;
BEGIN
  -- Two tabs opened with no progress (revision zero).
  a := public.test_upload('a');
  b := public.test_upload('b','notes');
  row := public.test_save(0,jsonb_build_array(a));
  PERFORM public.test_assert(row.mission_revision = 1,'first save has revision one');
  PERFORM public.test_conflict(0,jsonb_build_array(b));
  -- Reload and retry merges the other session's photo into the local notes.
  row := public.test_save(row.mission_revision,jsonb_build_array(a,b));
  PERFORM public.test_assert(jsonb_array_length(row.mission_progress->'evidenceUploads') = 2,
    'retry after reload keeps both uploads');
  loser := public.test_upload('loser');
  PERFORM public.test_conflict(1,jsonb_build_array(loser));
  PERFORM public.reconcile_mission_evidence(loser->>'storagePath');
  DELETE FROM storage.objects WHERE name = loser->>'storagePath';
  PERFORM public.test_assert(NOT EXISTS(SELECT 1 FROM storage.objects WHERE name = loser->>'storagePath'),
    'conflicting upload is reconciled and removed');

  replacement := public.test_upload('replacement');
  row := public.test_save(row.mission_revision,jsonb_build_array(replacement,b));
  -- B tries deleting from its stale snapshot: must not resurrect A's old photo.
  PERFORM public.test_conflict(2,jsonb_build_array(a));
  PERFORM public.test_assert((SELECT mission_progress->'evidenceUploads'->0 = replacement
    FROM public.learner_progress WHERE id = row.id),'stale delete cannot undo replacement');
  -- Lost successful response: abandoning the committed object is harmless.
  PERFORM public.reconcile_mission_evidence(replacement->>'storagePath');
  DELETE FROM storage.objects WHERE name = replacement->>'storagePath';
  PERFORM public.test_assert(EXISTS(SELECT 1 FROM storage.objects WHERE name = replacement->>'storagePath'),
    'attached evidence cannot be deleted even after an ambiguous save response');
  PERFORM public.test_assert(EXISTS(SELECT 1 FROM public.reconcile_mission_evidence()
    WHERE storage_path = a->>'storagePath'),'old replaced object stays queued until deletion succeeds');
  DELETE FROM storage.objects WHERE name = a->>'storagePath';
  PERFORM public.test_assert(NOT EXISTS(SELECT 1 FROM storage.objects WHERE name = a->>'storagePath'),
    'replaced object removed through owner Storage RLS');
  row := public.test_save(row.mission_revision,jsonb_build_array(replacement));
  PERFORM public.reconcile_mission_evidence();
  DELETE FROM storage.objects WHERE name = b->>'storagePath';
  PERFORM public.test_assert(NOT EXISTS(SELECT 1 FROM storage.objects WHERE name = b->>'storagePath'),
    'refreshed delete removes only its own evidence');
  -- A retired path cannot be reattached between reconciliation and deletion.
  BEGIN
    PERFORM public.test_save(row.mission_revision,jsonb_build_array(replacement,b));
    RAISE EXCEPTION 'FAIL: garbage object reattached';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Evidence object is unavailable; upload again' THEN RAISE; END IF;
  END;
  -- Legacy RPC/direct JSON writes may not bypass optimistic checks.
  BEGIN
    PERFORM public.upsert_learner_progress_atomic(
      row.course_id,row.module_id,'in_progress',25,NULL,NULL,NULL,'{}');
    RAISE EXCEPTION 'FAIL: legacy RPC bypassed version check';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  BEGIN
    UPDATE public.learner_progress SET mission_progress = '{}' WHERE id = row.id;
    RAISE EXCEPTION 'FAIL: direct write bypassed version check';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  row := public.test_save(row.mission_revision,jsonb_build_array(replacement),'completed');
  PERFORM public.test_assert(row.status = 'completed','valid uploaded evidence still completes');
  PERFORM public.test_conflict(row.mission_revision - 1,'[]');
  -- Another owner cannot abandon or delete this participant's evidence.
  path := replacement->>'storagePath';
  PERFORM set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
  PERFORM public.reconcile_mission_evidence(path);
  DELETE FROM storage.objects WHERE name = path;
  PERFORM set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
  PERFORM public.test_assert(EXISTS(SELECT 1 FROM storage.objects WHERE name = path),
    'cross-user cleanup cannot destroy evidence');
  PERFORM public.test_upload('abandoned');
  PERFORM public.test_upload('fresh');
END $$;
RESET ROLE;
-- Simulate a closed tab's upload expiring without waiting for the grace period.
UPDATE public.mission_evidence_objects SET expires_at = now() - interval '1 minute'
WHERE storage_path LIKE '%/abandoned.png';
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
SELECT public.test_assert((SELECT count(*) = 1 FROM public.reconcile_mission_evidence()),
  'closed-tab upload is found after grace period, fresh uploads are not collected');
DELETE FROM storage.objects WHERE name LIKE '%/abandoned.png' OR name LIKE '%/fresh.png';
SELECT public.test_assert(EXISTS(SELECT 1 FROM storage.objects WHERE name LIKE '%/fresh.png')
  AND NOT EXISTS(SELECT 1 FROM storage.objects WHERE name LIKE '%/abandoned.png'),
  'only expired staged object is deletable');
RESET ROLE;
-- Current supervisor-requested resubmission keeps completion intact and is
-- still version checked. Set up the request as the fixture administrator.
INSERT INTO public.mission_reviews(learner_progress_id,reviewer_id,review_status,
  glow_feedback,grow_feedback,next_steps)
SELECT id,'00000000-0000-4000-8000-000000000001','resubmission_requested',
  'Good start','Photo is unclear','Replace the photo'
FROM public.learner_progress WHERE module_id = '20000000-0000-4000-8000-000000000001';
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
DO $$
DECLARE row public.learner_progress; saved public.learner_progress;
  replacement JSONB; rejected JSONB; submitted public.mission_reviews;
BEGIN
  SELECT * INTO row FROM public.learner_progress
    WHERE module_id = '20000000-0000-4000-8000-000000000001';
  replacement := public.test_upload('resubmitted');
  BEGIN
    PERFORM public.test_save(row.mission_revision,'[]','completed');
    RAISE EXCEPTION 'FAIL: resubmission bypassed required evidence validation';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Required workplace mission evidence has not been uploaded' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.test_save(row.mission_revision - 1,jsonb_build_array(replacement),'completed');
    RAISE EXCEPTION 'FAIL: stale resubmission accepted';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  saved := public.test_save(row.mission_revision,jsonb_build_array(replacement),'completed');
  PERFORM public.test_assert(saved.status = 'completed' AND saved.completed_at = row.completed_at
    AND saved.progress_percentage = row.progress_percentage
    AND saved.mission_revision = row.mission_revision + 1,
    'requested replacement preserves completion and advances its revision');
  SELECT * INTO submitted FROM public.submit_mission_resubmission(row.id);
  PERFORM public.test_assert(submitted.review_status = 'pending'
    AND submitted.evidence_snapshot = jsonb_build_array(replacement),
    'replacement is resubmitted with the latest evidence snapshot');
  rejected := public.test_upload('unrequested-replacement');
  BEGIN
    PERFORM public.test_save(saved.mission_revision,jsonb_build_array(rejected),'completed');
    RAISE EXCEPTION 'FAIL: completed evidence edited without a resubmission request';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  PERFORM public.reconcile_mission_evidence(rejected->>'storagePath');
  DELETE FROM storage.objects WHERE name = rejected->>'storagePath';
  PERFORM public.test_assert(EXISTS (SELECT 1 FROM storage.objects
    WHERE name = replacement->>'storagePath'),
    'rejected unrequested edit cannot remove the submitted replacement');
END $$;
RESET ROLE;
\echo 'All multi-session evidence, optimistic conflict, and durable cleanup checks passed.'
