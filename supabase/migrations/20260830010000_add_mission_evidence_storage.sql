-- Keep participant evidence private and scoped to the authenticated owner.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'mission-evidence',
  'mission-evidence',
  false,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMENT ON COLUMN public.learner_progress.mission_progress IS
  'Version-tolerant workplace mission state including private evidence object paths and file metadata.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Mission evidence owners can upload'
  ) THEN
    CREATE POLICY "Mission evidence owners can upload"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'mission-evidence'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Mission evidence owners can view'
  ) THEN
    CREATE POLICY "Mission evidence owners can view"
      ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'mission-evidence'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Mission evidence owners can delete'
  ) THEN
    CREATE POLICY "Mission evidence owners can delete"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'mission-evidence'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
      );
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.validate_workplace_mission_evidence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, storage
AS $$
DECLARE
  mission_data JSONB;
BEGIN
  IF NEW.status <> 'completed' OR (
    TG_OP = 'UPDATE'
    AND OLD.status = 'completed'
    AND NEW.mission_progress IS NOT DISTINCT FROM OLD.mission_progress
  ) THEN
    RETURN NEW;
  END IF;

  SELECT mc.content_data
    INTO mission_data
  FROM public.module_content AS mc
  JOIN public.course_modules AS cm ON cm.id = mc.module_id
  WHERE mc.module_id = NEW.module_id
    AND cm.course_id = NEW.course_id
    AND mc.content_type = 'worksheet'
    AND mc.content_data->>'kind' = 'workplace-mission'
  ORDER BY mc.created_at DESC
  LIMIT 1;

  -- Legacy modules without a workplace-mission blueprint keep their old flow.
  IF mission_data IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    WITH required_evidence AS (
      SELECT
        CASE
          WHEN jsonb_typeof(item.value) = 'object' THEN item.value->>'id'
          ELSE 'evidence-' || item.ordinality::text
        END AS evidence_id
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(mission_data->'evidence') = 'array'
            THEN mission_data->'evidence'
          ELSE '[]'::jsonb
        END
      ) WITH ORDINALITY AS item(value, ordinality)
      WHERE jsonb_typeof(item.value) = 'string'
        OR (
          jsonb_typeof(item.value) = 'object'
          AND COALESCE(item.value->>'required', 'true') = 'true'
        )
    ),
    uploaded_evidence AS (
      SELECT
        upload.value->>'evidenceId' AS evidence_id,
        upload.value->>'storagePath' AS storage_path
      FROM jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(NEW.mission_progress->'evidenceUploads') = 'array'
            THEN NEW.mission_progress->'evidenceUploads'
          ELSE '[]'::jsonb
        END
      ) AS upload(value)
      WHERE jsonb_typeof(upload.value) = 'object'
    )
    SELECT 1
    FROM required_evidence AS required
    WHERE required.evidence_id IS NULL
      OR required.evidence_id = ''
      OR NOT EXISTS (
        SELECT 1
        FROM uploaded_evidence AS uploaded
        JOIN storage.objects AS object
          ON object.bucket_id = 'mission-evidence'
          AND object.name = uploaded.storage_path
        WHERE uploaded.evidence_id = required.evidence_id
          AND LEFT(
            object.name,
            LENGTH(
              auth.uid()::text || '/' ||
              NEW.course_id::text || '/' ||
              NEW.module_id::text || '/' ||
              required.evidence_id || '/'
            )
          ) = (
            auth.uid()::text || '/' ||
            NEW.course_id::text || '/' ||
            NEW.module_id::text || '/' ||
            required.evidence_id || '/'
          )
      )
  ) THEN
    RAISE EXCEPTION 'Required workplace mission evidence has not been uploaded';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_workplace_mission_evidence
  ON public.learner_progress;

CREATE TRIGGER validate_workplace_mission_evidence
BEFORE INSERT OR UPDATE ON public.learner_progress
FOR EACH ROW
EXECUTE FUNCTION public.validate_workplace_mission_evidence();