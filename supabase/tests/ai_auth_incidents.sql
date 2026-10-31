CREATE FUNCTION public.test_assert(condition BOOLEAN, message TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  IF condition IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Assertion failed: %', message;
  END IF;
END;
$$;

SELECT public.test_assert(
  NOT has_table_privilege('anon', 'public.ai_auth_incident_state', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'public.ai_auth_incident_state', 'SELECT')
  AND NOT has_function_privilege('anon', 'public.record_ai_auth_failure(timestamptz)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.get_ai_auth_incident()', 'EXECUTE'),
  'incident storage and RPCs are not public or authenticated');

UPDATE public.ai_auth_incident_state
SET failure_sequence = 0, recent_failure_times = '{}'::timestamptz[],
    incident_id = NULL, failure_count = NULL, started_at = NULL, last_failure_at = NULL
WHERE singleton = TRUE;

SET ROLE service_role;
SELECT public.record_ai_auth_failure(clock_timestamp());
SELECT public.record_ai_auth_failure(clock_timestamp());
SELECT public.test_assert(public.get_ai_auth_incident() IS NULL, 'two failures do not open an incident');
SELECT public.record_ai_auth_failure(clock_timestamp());
SELECT public.test_assert(
  (public.get_ai_auth_incident()->>'failureCount')::INTEGER = 3,
  'the third failure opens a single incident');
SELECT public.record_ai_auth_failure(clock_timestamp());
SELECT public.test_assert(
  (public.get_ai_auth_incident()->>'failureCount')::INTEGER = 4,
  'the open incident continues counting failures');

RESET ROLE;
UPDATE public.ai_auth_incident_state
SET failure_sequence = 0, recent_failure_times = '{}'::timestamptz[],
    incident_id = NULL, failure_count = NULL, started_at = NULL, last_failure_at = NULL
WHERE singleton = TRUE;
SET ROLE service_role;
SELECT public.record_ai_auth_failure(clock_timestamp() - INTERVAL '10 minutes');
SELECT public.record_ai_auth_failure(clock_timestamp() - INTERVAL '9 minutes');
SELECT public.record_ai_auth_failure(clock_timestamp() - INTERVAL '1 minute');
SELECT public.record_ai_auth_failure(clock_timestamp());
SELECT public.test_assert(
  public.get_ai_auth_incident() IS NULL,
  'failures outside the rolling five-minute window do not contribute');
SELECT public.record_ai_auth_failure(clock_timestamp());
SELECT public.test_assert(
  (public.get_ai_auth_incident()->>'failureCount')::INTEGER = 3,
  'the threshold uses only failures within the rolling window');

DO $$
DECLARE
  checked_sequence BIGINT := public.get_ai_auth_failure_sequence();
BEGIN
  PERFORM public.record_ai_auth_failure(clock_timestamp());
  PERFORM public.test_assert(
    NOT public.clear_ai_auth_failures(checked_sequence),
    'recovery does not clear a failure newer than the health-check snapshot');
  PERFORM public.test_assert(
    (public.get_ai_auth_incident()->>'failureCount')::INTEGER = 4,
    'the incident retains a failure concurrent with recovery');
  PERFORM public.test_assert(
    public.clear_ai_auth_failures(public.get_ai_auth_failure_sequence()),
    'a current successful health-check snapshot clears the incident');
  PERFORM public.test_assert(
    public.get_ai_auth_incident() IS NULL,
    'cleared incidents are no longer active');
END;
$$;
RESET ROLE;
