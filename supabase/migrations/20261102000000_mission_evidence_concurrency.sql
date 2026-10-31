-- A row version covers the whole mission, including non-evidence edits from
-- stale tabs. Storage lifecycle rows are durable, even if the browser closes.
ALTER TABLE public.learner_progress
  ADD COLUMN IF NOT EXISTS mission_revision BIGINT NOT NULL DEFAULT 0;

CREATE TABLE public.mission_evidence_objects (
  storage_path TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('staged', 'attached', 'garbage')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);
ALTER TABLE public.mission_evidence_objects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mission_evidence_objects FROM PUBLIC, authenticated, anon;

INSERT INTO public.mission_evidence_objects(storage_path, user_id, state)
SELECT o.name, split_part(o.name, '/', 1)::uuid,
  CASE WHEN EXISTS (
    SELECT 1 FROM public.learner_progress p,
      jsonb_array_elements(CASE WHEN jsonb_typeof(p.mission_progress->'evidenceUploads') = 'array'
        THEN p.mission_progress->'evidenceUploads' ELSE '[]'::jsonb END) u
    WHERE u->>'storagePath' = o.name
  ) THEN 'attached' ELSE 'staged' END
FROM storage.objects o WHERE o.bucket_id = 'mission-evidence';

CREATE FUNCTION public.track_mission_evidence_object()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NEW.bucket_id = 'mission-evidence' THEN
    INSERT INTO public.mission_evidence_objects(storage_path, user_id, state)
    VALUES (NEW.name, split_part(NEW.name, '/', 1)::uuid, 'staged');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER track_mission_evidence_object AFTER INSERT ON storage.objects
FOR EACH ROW EXECUTE FUNCTION public.track_mission_evidence_object();

CREATE FUNCTION public.guard_mission_progress_version()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  upload JSONB;
  tracked public.mission_evidence_objects;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.mission_progress <> '{}'::jsonb)
    OR (TG_OP = 'UPDATE' AND NEW.mission_progress IS DISTINCT FROM OLD.mission_progress) THEN
    IF current_setting('app.mission_version_checked', true) IS DISTINCT FROM 'yes' THEN
      RAISE EXCEPTION 'Mission changed; reload before saving' USING ERRCODE = '40001';
    END IF;
    IF NEW.mission_progress ? 'evidenceUploads'
      AND jsonb_typeof(NEW.mission_progress->'evidenceUploads') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Evidence uploads must be an array';
    END IF;
    FOR upload IN SELECT * FROM jsonb_array_elements(
      COALESCE(NEW.mission_progress->'evidenceUploads', '[]'::jsonb))
    LOOP
      SELECT * INTO tracked FROM public.mission_evidence_objects
        WHERE storage_path = upload->>'storagePath' FOR UPDATE;
      IF NOT FOUND OR tracked.user_id <> NEW.user_id
        OR tracked.state = 'garbage'
        OR (tracked.state = 'staged' AND tracked.expires_at <= clock_timestamp())
        OR left(tracked.storage_path, length(NEW.user_id::text || '/' ||
          NEW.course_id::text || '/' || NEW.module_id::text || '/' ||
          (upload->>'evidenceId') || '/')) IS DISTINCT FROM
          NEW.user_id::text || '/' || NEW.course_id::text || '/' ||
          NEW.module_id::text || '/' || (upload->>'evidenceId') || '/'
        OR NOT EXISTS (SELECT 1 FROM storage.objects o
          WHERE o.bucket_id = 'mission-evidence' AND o.name = tracked.storage_path) THEN
        RAISE EXCEPTION 'Evidence object is unavailable; upload again';
      END IF;
      UPDATE public.mission_evidence_objects SET state = 'attached'
        WHERE storage_path = tracked.storage_path;
    END LOOP;
    IF TG_OP = 'UPDATE' THEN
      UPDATE public.mission_evidence_objects SET state = 'garbage'
      WHERE storage_path IN (
        SELECT u->>'storagePath' FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(OLD.mission_progress->'evidenceUploads') = 'array'
            THEN OLD.mission_progress->'evidenceUploads' ELSE '[]'::jsonb END) u
        EXCEPT
        SELECT u->>'storagePath' FROM jsonb_array_elements(
          COALESCE(NEW.mission_progress->'evidenceUploads', '[]'::jsonb)) u
      );
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.mission_revision := OLD.mission_revision + 1;
  ELSE
    NEW.mission_revision := 1;
  END IF;
  RETURN NEW;
END $$;
-- Run before the existing completion validator; never weaken that validator.
CREATE TRIGGER guard_mission_progress_version BEFORE INSERT OR UPDATE
ON public.learner_progress FOR EACH ROW
EXECUTE FUNCTION public.guard_mission_progress_version();

CREATE FUNCTION public.save_mission_progress(
  p_course_id UUID, p_module_id UUID, p_status TEXT,
  p_progress_percentage INTEGER, p_mission_progress JSONB,
  p_expected_revision BIGINT
)
RETURNS public.learner_progress LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public
AS $$
DECLARE current_row public.learner_progress; result public.learner_progress;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_status NOT IN ('not_started', 'in_progress', 'completed')
    OR jsonb_typeof(p_mission_progress) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid mission progress';
  END IF;
  -- Also serialize the first save, for which no row exists to lock yet.
  PERFORM pg_advisory_xact_lock(hashtextextended(
    auth.uid()::text || p_course_id::text || p_module_id::text, 0));
  SELECT * INTO current_row FROM public.learner_progress
    WHERE user_id = auth.uid() AND course_id = p_course_id AND module_id = p_module_id
    FOR UPDATE;
  IF p_expected_revision IS NULL OR
    p_expected_revision <> COALESCE(current_row.mission_revision, 0) THEN
    RAISE EXCEPTION 'Mission changed in another session; reload before saving'
      USING ERRCODE = '40001';
  END IF;
  IF current_row.status = 'completed' AND (p_status <> 'completed'
    OR (p_mission_progress IS DISTINCT FROM current_row.mission_progress AND NOT EXISTS (
      SELECT 1 FROM public.mission_reviews r WHERE r.learner_progress_id = current_row.id
        AND r.review_status = 'resubmission_requested'
    ))) THEN
    RAISE EXCEPTION 'Mission completed in another session; reload before saving'
      USING ERRCODE = '40001';
  END IF;
  PERFORM set_config('app.mission_version_checked', 'yes', true);
  -- Do not upsert existing rows: BEFORE INSERT side effects run even when
  -- ON CONFLICT later keeps the old JSON, potentially stranding an upload.
  IF current_row.id IS NOT NULL THEN
    UPDATE public.learner_progress SET
      status = p_status,
      progress_percentage = CASE WHEN status = 'completed' THEN progress_percentage
        ELSE COALESCE(p_progress_percentage, progress_percentage) END,
      mission_progress = p_mission_progress,
      completed_at = CASE WHEN status = 'completed' THEN completed_at
        WHEN p_status = 'completed' THEN now() ELSE completed_at END,
      updated_at = now()
    WHERE id = current_row.id RETURNING * INTO result;
  ELSE
    INSERT INTO public.learner_progress(user_id,course_id,module_id,status,
      progress_percentage,time_spent_seconds,last_position_seconds,mission_progress,
      completed_at,updated_at)
    VALUES (auth.uid(),p_course_id,p_module_id,p_status,
      COALESCE(p_progress_percentage,0),0,0,p_mission_progress,
      CASE WHEN p_status = 'completed' THEN now() ELSE NULL END,now())
    RETURNING * INTO result;
  END IF;
  PERFORM set_config('app.mission_version_checked', '', true);
  RETURN result;
END $$;

CREATE FUNCTION public.retire_deleted_mission_evidence()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  UPDATE public.mission_evidence_objects SET state = 'garbage'
  WHERE storage_path IN (SELECT u->>'storagePath' FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(OLD.mission_progress->'evidenceUploads') = 'array'
      THEN OLD.mission_progress->'evidenceUploads' ELSE '[]'::jsonb END) u);
  RETURN OLD;
END $$;
CREATE TRIGGER retire_deleted_mission_evidence AFTER DELETE ON public.learner_progress
FOR EACH ROW EXECUTE FUNCTION public.retire_deleted_mission_evidence();

-- Retain tombstones: once eligible for deletion, a path can never be attached
-- again. This makes Storage API deletion safe after the RPC transaction ends.
CREATE FUNCTION public.reconcile_mission_evidence(p_abandon_path TEXT DEFAULT NULL)
RETURNS TABLE(storage_path TEXT) LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  UPDATE public.mission_evidence_objects o SET state = 'garbage'
  WHERE o.user_id = auth.uid() AND o.state = 'staged'
    AND (o.expires_at <= clock_timestamp() OR o.storage_path = p_abandon_path);
  RETURN QUERY SELECT o.storage_path FROM public.mission_evidence_objects o
    JOIN storage.objects s ON s.bucket_id = 'mission-evidence' AND s.name = o.storage_path
    WHERE o.user_id = auth.uid() AND o.state = 'garbage'
    ORDER BY o.expires_at LIMIT 100;
END $$;

CREATE FUNCTION public.can_delete_mission_evidence(p_path TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.mission_evidence_objects o
    WHERE o.storage_path = p_path AND o.user_id = auth.uid() AND o.state = 'garbage');
$$;
-- Restrictive policy also applies if another permissive delete policy exists.
CREATE POLICY "Only reconciled mission evidence can be deleted"
ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
USING (bucket_id <> 'mission-evidence' OR public.can_delete_mission_evidence(name));

REVOKE ALL ON FUNCTION public.save_mission_progress(UUID,UUID,TEXT,INTEGER,JSONB,BIGINT),
  public.reconcile_mission_evidence(TEXT), public.can_delete_mission_evidence(TEXT),
  public.track_mission_evidence_object(), public.guard_mission_progress_version(),
  public.retire_deleted_mission_evidence() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_mission_progress(UUID,UUID,TEXT,INTEGER,JSONB,BIGINT),
  public.reconcile_mission_evidence(TEXT), public.can_delete_mission_evidence(TEXT) TO authenticated;
