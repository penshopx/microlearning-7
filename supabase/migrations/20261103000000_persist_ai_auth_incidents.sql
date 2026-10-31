-- Provider-auth incidents contain operational metadata only. Application
-- access is restricted to server-side service-role RPCs.
CREATE TABLE public.ai_auth_incident_state (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  failure_sequence BIGINT NOT NULL DEFAULT 0 CHECK (failure_sequence >= 0),
  recent_failure_times TIMESTAMPTZ[] NOT NULL DEFAULT '{}'::timestamptz[],
  incident_id TEXT,
  failure_count INTEGER,
  started_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  CHECK (
    (incident_id IS NULL AND failure_count IS NULL AND started_at IS NULL AND last_failure_at IS NULL)
    OR
    (incident_id IS NOT NULL AND failure_count IS NOT NULL AND failure_count >= 3
      AND started_at IS NOT NULL AND last_failure_at IS NOT NULL)
  )
);

INSERT INTO public.ai_auth_incident_state(singleton) VALUES (TRUE)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.ai_auth_incident_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_auth_incident_state FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.record_ai_auth_failure(p_occurred_at TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  state public.ai_auth_incident_state;
  occurred_at TIMESTAMPTZ := COALESCE(p_occurred_at, clock_timestamp());
  recent TIMESTAMPTZ[];
BEGIN
  SELECT * INTO state
  FROM public.ai_auth_incident_state
  WHERE singleton = TRUE
  FOR UPDATE;

  SELECT COALESCE(array_agg(ts ORDER BY ts), ARRAY[]::timestamptz[])
  INTO recent
  FROM unnest(state.recent_failure_times || occurred_at) AS ts
  WHERE ts > occurred_at - INTERVAL '5 minutes';

  UPDATE public.ai_auth_incident_state
  SET failure_sequence = state.failure_sequence + 1,
      recent_failure_times = recent,
      incident_id = CASE
        WHEN state.incident_id IS NULL AND cardinality(recent) >= 3
          THEN 'ai-auth-' || gen_random_uuid()::text
        ELSE state.incident_id
      END,
      failure_count = CASE
        WHEN state.incident_id IS NOT NULL THEN state.failure_count + 1
        WHEN cardinality(recent) >= 3 THEN cardinality(recent)
        ELSE NULL
      END,
      started_at = CASE
        WHEN state.incident_id IS NOT NULL THEN state.started_at
        WHEN cardinality(recent) >= 3 THEN recent[1]
        ELSE NULL
      END,
      last_failure_at = CASE
        WHEN state.incident_id IS NOT NULL OR cardinality(recent) >= 3 THEN occurred_at
        ELSE NULL
      END
  WHERE singleton = TRUE;

  RETURN public.get_ai_auth_incident();
END;
$$;

CREATE FUNCTION public.get_ai_auth_incident()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT CASE WHEN incident_id IS NULL THEN NULL ELSE jsonb_build_object(
    'id', incident_id,
    'failureCount', failure_count,
    'startedAt', floor(extract(epoch FROM started_at) * 1000)::BIGINT,
    'lastFailureAt', floor(extract(epoch FROM last_failure_at) * 1000)::BIGINT
  ) END
  FROM public.ai_auth_incident_state
  WHERE singleton = TRUE;
$$;

CREATE FUNCTION public.get_ai_auth_failure_sequence()
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT failure_sequence
  FROM public.ai_auth_incident_state
  WHERE singleton = TRUE;
$$;

CREATE FUNCTION public.clear_ai_auth_failures(p_checked_sequence BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_sequence BIGINT;
BEGIN
  SELECT failure_sequence INTO current_sequence
  FROM public.ai_auth_incident_state
  WHERE singleton = TRUE
  FOR UPDATE;

  IF current_sequence <> p_checked_sequence THEN
    RETURN FALSE;
  END IF;

  UPDATE public.ai_auth_incident_state
  SET recent_failure_times = '{}'::timestamptz[],
      incident_id = NULL,
      failure_count = NULL,
      started_at = NULL,
      last_failure_at = NULL
  WHERE singleton = TRUE;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.record_ai_auth_failure(TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_ai_auth_incident() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_ai_auth_failure_sequence() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.clear_ai_auth_failures(BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_ai_auth_failure(TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_auth_incident() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_ai_auth_failure_sequence() TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_ai_auth_failures(BIGINT) TO service_role;
