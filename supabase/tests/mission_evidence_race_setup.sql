DROP TABLE IF EXISTS public.test_race_results;
CREATE TABLE public.test_race_results(session TEXT, saved BOOLEAN);
GRANT INSERT, SELECT ON public.test_race_results TO authenticated;
DELETE FROM public.learner_progress WHERE module_id = '20000000-0000-4000-8000-000000000002';
CREATE TABLE IF NOT EXISTS public.test_race_state(revision BIGINT, mission_a JSONB, mission_b JSONB);
TRUNCATE public.test_race_state;
GRANT SELECT ON public.test_race_state TO authenticated;
SELECT set_config('test.action', :'action', false);
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
DO $$
DECLARE prefix TEXT := auth.uid()::text ||
 '/10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000002/photo/';
  path_a TEXT := prefix || gen_random_uuid()::text;
  path_b TEXT := prefix || gen_random_uuid()::text;
  a JSONB; b JSONB; r public.learner_progress;
BEGIN
  INSERT INTO storage.objects(bucket_id,name) VALUES ('mission-evidence',path_a),('mission-evidence',path_b);
  a := jsonb_build_object('evidenceUploads',jsonb_build_array(
    jsonb_build_object('evidenceId','photo','storagePath',path_a)));
  b := jsonb_build_object('evidenceUploads',jsonb_build_array(
    jsonb_build_object('evidenceId','photo','storagePath',path_b)));
  IF current_setting('test.action') <> 'upload' THEN
    SELECT * INTO r FROM public.save_mission_progress(
      '10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',
      'in_progress',25,a,0);
    IF current_setting('test.action') = 'delete' THEN
      a := '{"evidenceUploads":[]}';
      b := a;
    ELSE
      -- Both sessions replace the same original object with a distinct upload.
      path_a := prefix || gen_random_uuid()::text;
      INSERT INTO storage.objects(bucket_id,name) VALUES ('mission-evidence',path_a);
      a := jsonb_build_object('evidenceUploads',jsonb_build_array(
        jsonb_build_object('evidenceId','photo','storagePath',path_a)));
    END IF;
  END IF;
  -- State is inserted as the fixture owner below because the participant has
  -- no permission to alter another session's expected revision.
  PERFORM set_config('test.revision',COALESCE(r.mission_revision,0)::text,false);
  PERFORM set_config('test.a',a::text,false);
  PERFORM set_config('test.b',b::text,false);
END $$;
RESET ROLE;
INSERT INTO public.test_race_state VALUES
 (current_setting('test.revision')::bigint,current_setting('test.a')::jsonb,current_setting('test.b')::jsonb);
CREATE OR REPLACE FUNCTION public.test_race_save(session_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE s public.test_race_state; won BOOLEAN := true;
BEGIN
  SELECT * INTO s FROM public.test_race_state;
  BEGIN
    PERFORM public.save_mission_progress(
      '10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002',
      'in_progress',25,CASE WHEN session_id = 'a' THEN s.mission_a ELSE s.mission_b END,s.revision);
  EXCEPTION WHEN serialization_failure THEN won := false;
  END;
  INSERT INTO public.test_race_results VALUES(session_id,won);
END $$;
