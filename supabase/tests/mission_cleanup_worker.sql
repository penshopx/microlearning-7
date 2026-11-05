BEGIN;
DELETE FROM storage.objects WHERE bucket_id = 'mission-evidence';
INSERT INTO public.profiles VALUES ('00000000-0000-4000-8000-000000000001', 'admin');
INSERT INTO storage.objects(bucket_id, name)
SELECT 'mission-evidence', '00000000-0000-4000-8000-000000000002/worker-' || n
FROM generate_series(1, 105) n;
INSERT INTO storage.objects(bucket_id, name) VALUES
 ('mission-evidence', '00000000-0000-4000-8000-000000000002/worker-attached'),
 ('mission-evidence', '00000000-0000-4000-8000-000000000002/worker-live');
UPDATE public.mission_evidence_objects SET expires_at = now() - interval '25 hours'
 WHERE storage_path ~ '/worker-[0-9]+$';
UPDATE public.mission_evidence_objects SET state = 'attached'
 WHERE storage_path LIKE '%/worker-attached';

SET LOCAL ROLE authenticated;
DO $$ BEGIN
  BEGIN PERFORM public.claim_mission_cleanup_batch(gen_random_uuid());
    RAISE EXCEPTION 'FAIL: participant claimed batch';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.finish_mission_cleanup_batch(gen_random_uuid(), ARRAY[]::text[]);
    RAISE EXCEPTION 'FAIL: participant finished batch';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
  BEGIN PERFORM public.claim_mission_cleanup_batch(gen_random_uuid());
    RAISE EXCEPTION 'FAIL: anonymous claimed batch';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

-- All candidates belong to a participant who never returns. RPC uses no uid.
CREATE TEMP TABLE batch(path TEXT);
GRANT ALL ON batch TO service_role;
SET LOCAL ROLE service_role;
INSERT INTO batch SELECT storage_path FROM public.claim_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000010');
RESET ROLE;
SELECT public.test_assert((SELECT count(*) = 100 FROM batch), 'bounded batch');
SELECT public.test_assert((SELECT bool_and(state = 'garbage' AND cleanup_since = expires_at)
 FROM public.mission_evidence_objects WHERE storage_path IN (SELECT path FROM batch)),
 'expired staging retired without resetting its age');
SELECT public.test_assert((SELECT state = 'attached' FROM public.mission_evidence_objects
 WHERE storage_path LIKE '%/worker-attached'), 'attached evidence untouched');
SELECT public.test_assert((SELECT state = 'staged' FROM public.mission_evidence_objects
 WHERE storage_path LIKE '%/worker-live'), 'staging grace preserved');
SET LOCAL ROLE service_role;
SELECT public.test_assert((SELECT count(*) = 0 FROM public.claim_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000011')), 'concurrent worker cannot claim');
RESET ROLE;
DO $$ BEGIN
  BEGIN UPDATE public.mission_evidence_objects SET state = 'attached'
    WHERE storage_path IN (SELECT path FROM batch);
    RAISE EXCEPTION 'FAIL: retired evidence resurrected';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Evidence retirement is irreversible' THEN RAISE; END IF;
  END;
END $$;

-- Simulate process death after claim: lease persists until expiry.
UPDATE public.mission_cleanup_worker SET lease_until = now() - interval '1 second';
SET LOCAL ROLE service_role;
DO $$ BEGIN
  BEGIN PERFORM public.finish_mission_cleanup_batch(
    '00000000-0000-4000-8000-000000000010', ARRAY(SELECT path FROM batch));
    RAISE EXCEPTION 'FAIL: stale worker finished';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Cleanup lease expired' THEN RAISE; END IF;
  END;
END $$;
RESET ROLE;
UPDATE public.mission_evidence_objects SET cleanup_next_attempt_at = now() - interval '1 second'
 WHERE storage_path IN (SELECT path FROM batch);
TRUNCATE batch;
SET LOCAL ROLE service_role;
INSERT INTO batch SELECT storage_path FROM public.claim_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000012');
-- Storage still has every object: trusted failure, no blind acknowledgement.
SELECT public.test_assert((public.finish_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000012', ARRAY(SELECT path FROM batch))->>'remaining')::int = 100,
 'restart reclaims safely and retains failed objects');
RESET ROLE;
SELECT public.test_assert((SELECT bool_and(cleanup_worker_failure_count = 1)
 FROM public.mission_evidence_objects WHERE storage_path IN (SELECT path FROM batch)),
 'trusted failure recorded');

-- Fairness: the remaining five get their turn before retried failures.
TRUNCATE batch;
SET LOCAL ROLE service_role;
INSERT INTO batch SELECT storage_path FROM public.claim_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000013');
SELECT public.test_assert((SELECT count(*) = 5 FROM batch), 'retry backoff prevents starvation');
RESET ROLE;
-- Emulate Storage API deletion (never delete storage metadata in worker code).
DELETE FROM storage.objects WHERE name IN (SELECT path FROM batch);
SET LOCAL ROLE service_role;
SELECT public.test_assert((public.finish_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000013', ARRAY(SELECT path FROM batch))->>'deleted')::int = 5,
 'lost success response confirmed by Storage absence');
RESET ROLE;

-- Spaced trusted retries produce an aggregate warning.
UPDATE public.mission_evidence_objects SET cleanup_next_attempt_at = now() - interval '1 second',
 cleanup_worker_failure_count = 2,
 cleanup_worker_first_failure_at = now() - interval '11 minutes',
 cleanup_worker_last_failure_at = now() - interval '5 minutes 1 second'
 WHERE state = 'garbage' AND EXISTS (
 SELECT 1 FROM storage.objects s WHERE s.name = storage_path AND s.bucket_id = 'mission-evidence');
TRUNCATE batch;
SET LOCAL ROLE service_role;
INSERT INTO batch SELECT storage_path FROM public.claim_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000014');
SELECT public.finish_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000014', ARRAY(SELECT path FROM batch));
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
SELECT public.test_assert((public.get_mission_cleanup_health()->>'repeatedFailureCount')::int = 100,
 'trusted retry warning aggregated without browser reports');
RESET ROLE;
-- Recover all files, retaining irreversible tombstones and historical failures.
UPDATE public.mission_evidence_objects SET cleanup_next_attempt_at = now() - interval '1 second';
TRUNCATE batch;
SET LOCAL ROLE service_role;
INSERT INTO batch SELECT storage_path FROM public.claim_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000015');
RESET ROLE;
DELETE FROM storage.objects WHERE name IN (SELECT path FROM batch);
SET LOCAL ROLE service_role;
SELECT public.finish_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000015', ARRAY(SELECT path FROM batch));
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT public.test_assert((public.get_mission_cleanup_health()->>'pendingCount')::int = 0
 AND (public.get_mission_cleanup_health()->>'repeatedFailureCount')::int = 0
 AND (public.get_mission_cleanup_health()->>'overdueCount')::int = 0,
 'Storage recovery clears all aggregates despite tombstones');
RESET ROLE;
SELECT public.test_assert((SELECT count(*) = 105 FROM public.mission_evidence_objects
 WHERE state = 'garbage' AND storage_path LIKE '%/worker-%'), 'retirement tombstones retained');
ROLLBACK;
