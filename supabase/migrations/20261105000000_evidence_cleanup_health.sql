-- Operational metadata only. Existing garbage starts its age at migration time:
-- its original retirement time was not recorded.
-- Profile edit policies must not let a participant promote themselves.
CREATE FUNCTION public.guard_profile_admin_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') AND (
    (TG_OP = 'INSERT' AND coalesce(NEW.role, 'user') <> 'user')
    OR (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role)
  ) THEN
    RAISE EXCEPTION 'Role changes require a trusted administrator' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_profile_admin_role BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_admin_role();
REVOKE ALL ON FUNCTION public.guard_profile_admin_role() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.mission_evidence_objects
  ADD COLUMN cleanup_since TIMESTAMPTZ,
  ADD COLUMN cleanup_failure_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN cleanup_first_failure_at TIMESTAMPTZ,
  ADD COLUMN cleanup_last_failure_at TIMESTAMPTZ;
UPDATE public.mission_evidence_objects SET cleanup_since = now() WHERE state = 'garbage';

CREATE FUNCTION public.track_mission_cleanup_age()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.state = 'garbage' AND OLD.state <> 'garbage' THEN
    NEW.cleanup_since := CASE WHEN OLD.state = 'staged'
      THEN least(OLD.expires_at, clock_timestamp()) ELSE clock_timestamp() END;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER track_mission_cleanup_age BEFORE UPDATE
ON public.mission_evidence_objects FOR EACH ROW
EXECUTE FUNCTION public.track_mission_cleanup_age();

-- Browser reports are advisory, not proof of a provider outage. They cannot
-- alter deletion eligibility or clear an incident. Deduplicate rapid retries.
CREATE FUNCTION public.record_mission_cleanup_failure(p_paths TEXT[])
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF cardinality(p_paths) > 100 THEN RAISE EXCEPTION 'Too many cleanup objects'; END IF;
  UPDATE public.mission_evidence_objects o SET
    cleanup_failure_count = o.cleanup_failure_count + 1,
    cleanup_first_failure_at = coalesce(o.cleanup_first_failure_at, clock_timestamp()),
    cleanup_last_failure_at = clock_timestamp()
  WHERE o.storage_path = ANY(p_paths) AND o.user_id = auth.uid()
    AND o.state = 'garbage'
    AND (o.cleanup_last_failure_at IS NULL
      OR o.cleanup_last_failure_at <= clock_timestamp() - interval '5 minutes')
    AND EXISTS (SELECT 1 FROM storage.objects s
      WHERE s.bucket_id = 'mission-evidence' AND s.name = o.storage_path);
END $$;

CREATE FUNCTION public.get_mission_cleanup_health()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE result JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  WITH pending AS (
    SELECT coalesce(o.cleanup_since, o.expires_at) AS eligible_at,
      o.cleanup_failure_count >= 3 AND
        o.cleanup_last_failure_at - o.cleanup_first_failure_at >= interval '10 minutes'
        AS repeated_failure
    FROM public.mission_evidence_objects o
    JOIN storage.objects s ON s.bucket_id = 'mission-evidence' AND s.name = o.storage_path
    WHERE o.state = 'garbage' OR (o.state = 'staged' AND o.expires_at <= now())
  )
  SELECT jsonb_build_object(
    'pendingCount', count(*),
    'overdueCount', count(*) FILTER (WHERE eligible_at <= now() - interval '24 hours'),
    'repeatedFailureCount', count(*) FILTER (WHERE repeated_failure),
    'oldestPendingAt', min(eligible_at),
    'checkedAt', now()
  ) INTO result FROM pending;
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.track_mission_cleanup_age(),
  public.record_mission_cleanup_failure(TEXT[]), public.get_mission_cleanup_health()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_mission_cleanup_failure(TEXT[]),
  public.get_mission_cleanup_health() TO authenticated;
