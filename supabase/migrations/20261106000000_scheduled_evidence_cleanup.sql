-- Durable, service-only lease. No private paths leave the worker RPCs.
CREATE TABLE public.mission_cleanup_worker (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
  lease_id UUID,
  lease_until TIMESTAMPTZ
);
INSERT INTO public.mission_cleanup_worker(singleton) VALUES (true);
ALTER TABLE public.mission_cleanup_worker ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mission_cleanup_worker FROM PUBLIC, anon, authenticated, service_role;

ALTER TABLE public.mission_evidence_objects
  ADD COLUMN cleanup_next_attempt_at TIMESTAMPTZ,
  ADD COLUMN cleanup_lease_id UUID,
  ADD COLUMN cleanup_worker_failure_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN cleanup_worker_first_failure_at TIMESTAMPTZ,
  ADD COLUMN cleanup_worker_last_failure_at TIMESTAMPTZ;

CREATE FUNCTION public.guard_mission_evidence_retirement()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = ''
AS $$
BEGIN
  IF OLD.state = 'garbage' AND NEW.state <> 'garbage' THEN
    RAISE EXCEPTION 'Evidence retirement is irreversible';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_mission_evidence_retirement BEFORE UPDATE
ON public.mission_evidence_objects FOR EACH ROW
EXECUTE FUNCTION public.guard_mission_evidence_retirement();

CREATE FUNCTION public.claim_mission_cleanup_batch(p_lease_id UUID)
RETURNS TABLE(storage_path TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF p_lease_id IS NULL THEN RAISE EXCEPTION 'Lease required'; END IF;
  UPDATE public.mission_cleanup_worker SET lease_id = p_lease_id,
    lease_until = clock_timestamp() + interval '2 minutes'
  WHERE singleton AND (lease_until IS NULL OR lease_until <= clock_timestamp());
  IF NOT FOUND THEN RETURN; END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT o.storage_path
    FROM public.mission_evidence_objects o
    JOIN storage.objects s ON s.bucket_id = 'mission-evidence' AND s.name = o.storage_path
    WHERE (o.state = 'garbage' OR (o.state = 'staged' AND o.expires_at <= clock_timestamp()))
      AND (o.cleanup_next_attempt_at IS NULL OR o.cleanup_next_attempt_at <= clock_timestamp())
      -- Defense in depth for legacy/inconsistent lifecycle metadata.
      AND NOT EXISTS (
        SELECT 1 FROM public.learner_progress p,
          jsonb_array_elements(CASE WHEN jsonb_typeof(p.mission_progress->'evidenceUploads') = 'array'
            THEN p.mission_progress->'evidenceUploads' ELSE '[]'::jsonb END) u
        WHERE u->>'storagePath' = o.storage_path
      )
    ORDER BY coalesce(o.cleanup_next_attempt_at, o.cleanup_since, o.expires_at), o.storage_path
    LIMIT 100 FOR UPDATE OF o SKIP LOCKED
  )
  UPDATE public.mission_evidence_objects o SET state = 'garbage',
    cleanup_next_attempt_at = clock_timestamp() + interval '5 minutes',
    cleanup_lease_id = p_lease_id
  FROM candidates c WHERE o.storage_path = c.storage_path
  RETURNING o.storage_path;
  IF NOT FOUND THEN
    UPDATE public.mission_cleanup_worker SET lease_id = NULL, lease_until = NULL WHERE singleton;
  END IF;
END $$;

-- The provider call is made outside SQL, exclusively by the trusted worker.
-- Absence of storage.objects is authoritative even after a lost HTTP response.
CREATE FUNCTION public.finish_mission_cleanup_batch(p_lease_id UUID, p_paths TEXT[])
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE remaining INTEGER; attempted INTEGER;
BEGIN
  IF cardinality(p_paths) > 100 THEN RAISE EXCEPTION 'Too many cleanup objects'; END IF;
  PERFORM 1 FROM public.mission_cleanup_worker
    WHERE singleton AND lease_id = p_lease_id AND lease_until > clock_timestamp() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cleanup lease expired'; END IF;
  -- Only the current claimed batch may be reported.
  SELECT count(*) INTO attempted FROM public.mission_evidence_objects o
    WHERE o.storage_path = ANY(p_paths) AND o.state = 'garbage' AND o.cleanup_lease_id = p_lease_id;
  IF attempted <> coalesce(cardinality(p_paths), 0) THEN
    RAISE EXCEPTION 'Invalid cleanup batch';
  END IF;
  UPDATE public.mission_evidence_objects o SET
    cleanup_worker_failure_count = o.cleanup_worker_failure_count + 1,
    cleanup_worker_first_failure_at = coalesce(o.cleanup_worker_first_failure_at, clock_timestamp()),
    cleanup_worker_last_failure_at = clock_timestamp()
  WHERE o.storage_path = ANY(p_paths) AND o.state = 'garbage'
    AND (o.cleanup_worker_last_failure_at IS NULL
      OR o.cleanup_worker_last_failure_at <= clock_timestamp() - interval '5 minutes')
    AND EXISTS (SELECT 1 FROM storage.objects s
      WHERE s.bucket_id = 'mission-evidence' AND s.name = o.storage_path);
  SELECT count(*) INTO remaining FROM public.mission_evidence_objects o
    JOIN storage.objects s ON s.bucket_id = 'mission-evidence' AND s.name = o.storage_path
    WHERE o.storage_path = ANY(p_paths) AND o.state = 'garbage';
  UPDATE public.mission_cleanup_worker SET lease_id = NULL, lease_until = NULL WHERE singleton;
  RETURN jsonb_build_object('attempted', attempted, 'deleted', attempted - remaining, 'remaining', remaining);
END $$;

CREATE OR REPLACE FUNCTION public.get_mission_cleanup_health()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE result JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  WITH pending AS (
    SELECT coalesce(o.cleanup_since, o.expires_at) AS eligible_at,
      (o.cleanup_failure_count >= 3 AND
        o.cleanup_last_failure_at - o.cleanup_first_failure_at >= interval '10 minutes')
      OR (o.cleanup_worker_failure_count >= 3 AND
        o.cleanup_worker_last_failure_at - o.cleanup_worker_first_failure_at >= interval '10 minutes')
        AS repeated_failure
    FROM public.mission_evidence_objects o
    JOIN storage.objects s ON s.bucket_id = 'mission-evidence' AND s.name = o.storage_path
    WHERE o.state = 'garbage' OR (o.state = 'staged' AND o.expires_at <= now())
  )
  SELECT jsonb_build_object(
    'pendingCount', count(*),
    'overdueCount', count(*) FILTER (WHERE eligible_at <= now() - interval '24 hours'),
    'repeatedFailureCount', count(*) FILTER (WHERE repeated_failure),
    'oldestPendingAt', min(eligible_at), 'checkedAt', now()
  ) INTO result FROM pending;
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.guard_mission_evidence_retirement(),
  public.claim_mission_cleanup_batch(UUID), public.finish_mission_cleanup_batch(UUID,TEXT[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_mission_cleanup_batch(UUID),
  public.finish_mission_cleanup_batch(UUID,TEXT[]) TO service_role;
