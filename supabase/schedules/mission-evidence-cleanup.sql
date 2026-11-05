-- Opt-in activation, AFTER deploying the Edge Function and setting Vault entries
-- mission_cleanup_project_url and mission_cleanup_service_role_key through the
-- trusted operator's secret-management UI. Never put their values in this file.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.invoke_mission_cleanup_worker()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE project_url TEXT; service_key TEXT;
BEGIN
  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets
    WHERE name = 'mission_cleanup_project_url';
  SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets
    WHERE name = 'mission_cleanup_service_role_key';
  IF project_url IS NULL OR service_key IS NULL THEN
    RAISE EXCEPTION 'Cleanup scheduler secrets are not configured';
  END IF;
  PERFORM net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/mission-evidence-cleanup',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key),
    body := '{}'::jsonb, timeout_milliseconds := 55000
  );
END $$;
REVOKE ALL ON FUNCTION public.invoke_mission_cleanup_worker()
  FROM PUBLIC, anon, authenticated, service_role;
-- Fail activation explicitly if configuration is incomplete, without printing it.
DO $$ BEGIN
  IF (SELECT count(DISTINCT name) FROM vault.decrypted_secrets
    WHERE name IN ('mission_cleanup_project_url', 'mission_cleanup_service_role_key')) <> 2 THEN
    RAISE EXCEPTION 'Cleanup scheduler secrets are not configured';
  END IF;
END $$;
-- Named scheduling updates the existing job when this script is reapplied.
SELECT cron.schedule('mission-evidence-cleanup', '*/5 * * * *',
  'SELECT public.invoke_mission_cleanup_worker();');
COMMIT;
