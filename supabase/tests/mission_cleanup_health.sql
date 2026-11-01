BEGIN;
-- Isolate aggregation from the earlier evidence fixtures.
DELETE FROM storage.objects WHERE bucket_id = 'mission-evidence';
INSERT INTO public.profiles VALUES
 ('00000000-0000-4000-8000-000000000001', 'admin'),
 ('00000000-0000-4000-8000-000000000002', 'user');
INSERT INTO storage.objects(bucket_id, name) VALUES
 ('mission-evidence', '00000000-0000-4000-8000-000000000002/cleanup-test'),
 ('mission-evidence', '00000000-0000-4000-8000-000000000001/cleanup-other'),
 ('mission-evidence', '00000000-0000-4000-8000-000000000002/cleanup-attached');
UPDATE public.mission_evidence_objects SET state = 'garbage'
 WHERE storage_path LIKE '%/cleanup-test' OR storage_path LIKE '%/cleanup-other';
UPDATE public.mission_evidence_objects SET state = 'attached'
 WHERE storage_path LIKE '%/cleanup-attached';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
DO $$ BEGIN
  BEGIN PERFORM public.get_mission_cleanup_health();
    RAISE EXCEPTION 'FAIL: participant read health';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM * FROM public.mission_evidence_objects;
    RAISE EXCEPTION 'FAIL: participant read queue';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
    RAISE EXCEPTION 'FAIL: self promotion';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN INSERT INTO public.profiles VALUES ('00000000-0000-4000-8000-000000000003', 'admin');
    RAISE EXCEPTION 'FAIL: insert admin role';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT public.record_mission_cleanup_failure(ARRAY[
 '00000000-0000-4000-8000-000000000002/cleanup-test',
 '00000000-0000-4000-8000-000000000001/cleanup-other',
 '00000000-0000-4000-8000-000000000002/cleanup-attached']);
SELECT public.record_mission_cleanup_failure(ARRAY['00000000-0000-4000-8000-000000000002/cleanup-test']);
RESET ROLE;
SELECT public.test_assert((SELECT cleanup_failure_count = 1 FROM public.mission_evidence_objects
 WHERE storage_path LIKE '%/cleanup-test'), 'rapid retries deduplicated');
SELECT public.test_assert((SELECT cleanup_failure_count = 0 FROM public.mission_evidence_objects
 WHERE storage_path LIKE '%/cleanup-other'), 'cannot report another owner failure');
SELECT public.test_assert((SELECT cleanup_failure_count = 0 FROM public.mission_evidence_objects
 WHERE storage_path LIKE '%/cleanup-attached'), 'cannot report attached evidence failure');
UPDATE public.mission_evidence_objects SET cleanup_failure_count = 3,
 cleanup_first_failure_at = now() - interval '1 minute',
 cleanup_last_failure_at = now()
 WHERE storage_path LIKE '%/cleanup-other';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
SELECT public.test_assert((public.get_mission_cleanup_health()->>'repeatedFailureCount')::int = 0
 AND (public.get_mission_cleanup_health()->>'overdueCount')::int = 0,
 'transient failures or a short burst produce no warning');
SELECT public.test_assert((public.get_mission_cleanup_health()->>'pendingCount')::int = 2,
 'attached evidence excluded');
RESET ROLE;
-- Simulate passage of time without sleeps or caller-controlled timestamps.
UPDATE public.mission_evidence_objects SET cleanup_failure_count = 2,
 cleanup_first_failure_at = now() - interval '11 minutes',
 cleanup_last_failure_at = now() - interval '5 minutes 1 second'
 WHERE storage_path LIKE '%/cleanup-test';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
SELECT public.record_mission_cleanup_failure(ARRAY['00000000-0000-4000-8000-000000000002/cleanup-test']);
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
SELECT public.test_assert((public.get_mission_cleanup_health()->>'repeatedFailureCount')::int = 1,
 'third spaced failure raises one aggregate warning');
RESET ROLE;
UPDATE public.mission_evidence_objects SET cleanup_since = now() - interval '24 hours'
 WHERE storage_path LIKE '%/cleanup-other';
SET LOCAL ROLE authenticated;
SELECT public.test_assert((public.get_mission_cleanup_health()->>'overdueCount')::int = 1,
 '24 hour boundary alerts');
SELECT public.test_assert((SELECT count(*) = 5 FROM jsonb_object_keys(public.get_mission_cleanup_health())),
 'only aggregate metadata returned');
SELECT public.test_assert(public.get_mission_cleanup_health()::text NOT LIKE '%cleanup-test%',
 'no private paths in health response');
RESET ROLE;
DELETE FROM storage.objects WHERE name LIKE '%/cleanup-test' OR name LIKE '%/cleanup-other';
SET LOCAL ROLE authenticated;
SELECT public.test_assert((public.get_mission_cleanup_health()->>'pendingCount')::int = 0
 AND (public.get_mission_cleanup_health()->>'repeatedFailureCount')::int = 0
 AND (public.get_mission_cleanup_health()->>'overdueCount')::int = 0,
 'actual deletion clears health even with durable tombstones');
RESET ROLE;
-- Unvisited expired staging is backlog too; do not start the age over when
-- reconciliation finally changes it to garbage.
UPDATE public.mission_evidence_objects SET state = 'staged',
 cleanup_since = NULL, expires_at = now() - interval '25 hours'
 WHERE storage_path LIKE '%/cleanup-attached';
SET LOCAL ROLE authenticated;
SELECT public.test_assert((public.get_mission_cleanup_health()->>'overdueCount')::int = 1,
 'expired staged upload warns before participant revisits');
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
SELECT * FROM public.reconcile_mission_evidence();
RESET ROLE;
SELECT public.test_assert((SELECT cleanup_since = expires_at FROM public.mission_evidence_objects
 WHERE storage_path LIKE '%/cleanup-attached'), 'reconciliation preserves staging expiry age');
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM public.get_mission_cleanup_health();
    RAISE EXCEPTION 'FAIL: anonymous read';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
