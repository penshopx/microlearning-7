-- Supervisors are the owners of the course whose workplace mission was completed.
CREATE TABLE IF NOT EXISTS public.mission_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_progress_id UUID NOT NULL UNIQUE
    REFERENCES public.learner_progress(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_status TEXT NOT NULL
    CHECK (review_status IN ('completed', 'resubmission_requested', 'pending')),
  glow_feedback TEXT NOT NULL,
  grow_feedback TEXT NOT NULL,
  next_steps TEXT NOT NULL,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  evidence_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mission_reviews_reviewer_status_idx
  ON public.mission_reviews (reviewer_id, review_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.mission_review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.mission_reviews(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL,
  timestamp_seconds INTEGER NOT NULL CHECK (timestamp_seconds >= 0),
  comment_text TEXT NOT NULL CHECK (length(trim(comment_text)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mission_review_comments_review_idx
  ON public.mission_review_comments (review_id, timestamp_seconds);

ALTER TABLE public.mission_review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants and course owners can read timestamped comments"
  ON public.mission_review_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.mission_reviews AS review
      JOIN public.learner_progress AS lp ON lp.id = review.learner_progress_id
      JOIN public.courses AS c ON c.id = lp.course_id
      WHERE review.id = mission_review_comments.review_id
        AND (lp.user_id = auth.uid() OR c.user_id = auth.uid())
    )
  );

CREATE POLICY "Course owners can add timestamped comments"
  ON public.mission_review_comments FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.mission_reviews AS review
      JOIN public.learner_progress AS lp ON lp.id = review.learner_progress_id
      JOIN public.courses AS c ON c.id = lp.course_id
      WHERE review.id = mission_review_comments.review_id
        AND review.reviewer_id = auth.uid()
        AND c.user_id = auth.uid()
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(lp.mission_progress->'evidenceUploads') = 'array'
                THEN lp.mission_progress->'evidenceUploads'
              ELSE '[]'::jsonb
            END
          ) AS upload(value)
          WHERE upload.value->>'evidenceId' = mission_review_comments.evidence_id
            AND (
              upload.value->>'mimeType' LIKE 'audio/%'
              OR upload.value->>'mimeType' LIKE 'video/%'
            )
        )
    )
  );

CREATE POLICY "Course owners can replace their timestamped comments"
  ON public.mission_review_comments FOR DELETE TO authenticated
  USING (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.mission_reviews AS review
      JOIN public.learner_progress AS lp ON lp.id = review.learner_progress_id
      JOIN public.courses AS c ON c.id = lp.course_id
      WHERE review.id = mission_review_comments.review_id
        AND review.reviewer_id = auth.uid()
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Course owners can read learner mission progress"
  ON public.learner_progress FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.courses AS c
      WHERE c.id = learner_progress.course_id
        AND c.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.capture_mission_review_evidence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  SELECT COALESCE(lp.mission_progress->'evidenceUploads', '[]'::jsonb)
    INTO NEW.evidence_snapshot
  FROM public.learner_progress AS lp
  WHERE lp.id = NEW.learner_progress_id;

  IF NEW.evidence_snapshot IS NULL THEN
    RAISE EXCEPTION 'Mission evidence could not be read';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS capture_mission_review_evidence
  ON public.mission_reviews;
CREATE TRIGGER capture_mission_review_evidence
  BEFORE INSERT OR UPDATE OF learner_progress_id, review_status
  ON public.mission_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.capture_mission_review_evidence();

ALTER TABLE public.mission_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants and course owners can read mission reviews"
  ON public.mission_reviews FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.learner_progress AS lp
      JOIN public.courses AS c ON c.id = lp.course_id
      WHERE lp.id = mission_reviews.learner_progress_id
        AND (lp.user_id = auth.uid() OR c.user_id = auth.uid())
    )
  );

CREATE POLICY "Course owners can create mission reviews"
  ON public.mission_reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.learner_progress AS lp
      JOIN public.courses AS c ON c.id = lp.course_id
      WHERE lp.id = mission_reviews.learner_progress_id
        AND lp.status = 'completed'
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Course owners can update mission reviews"
  ON public.mission_reviews FOR UPDATE TO authenticated
  USING (
    reviewer_id = auth.uid()
    AND review_status <> 'completed'
    AND EXISTS (
      SELECT 1
      FROM public.learner_progress AS lp
      JOIN public.courses AS c ON c.id = lp.course_id
      WHERE lp.id = mission_reviews.learner_progress_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.learner_progress AS lp
      JOIN public.courses AS c ON c.id = lp.course_id
      WHERE lp.id = mission_reviews.learner_progress_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Course owners can view submitted private mission evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'mission-evidence'
    AND EXISTS (
      SELECT 1
      FROM public.learner_progress AS lp
      JOIN public.courses AS c ON c.id = lp.course_id
      WHERE c.user_id = auth.uid()
        AND lp.user_id::text = (storage.foldername(name))[1]
        AND lp.course_id::text = (storage.foldername(name))[2]
        AND lp.module_id::text = (storage.foldername(name))[3]
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements(
            CASE
              WHEN jsonb_typeof(lp.mission_progress->'evidenceUploads') = 'array'
                THEN lp.mission_progress->'evidenceUploads'
              ELSE '[]'::jsonb
            END
          ) AS upload(value)
          WHERE upload.value->>'storagePath' = storage.objects.name
        )
    )
  );

-- Preserve the completed mission while permitting evidence edits only after
-- the course owner explicitly requests a resubmission.
CREATE OR REPLACE FUNCTION public.upsert_learner_progress_atomic(
  p_course_id UUID,
  p_module_id UUID,
  p_status TEXT,
  p_progress_percentage INTEGER DEFAULT NULL,
  p_time_spent_seconds INTEGER DEFAULT NULL,
  p_last_position_seconds INTEGER DEFAULT NULL,
  p_quiz_score INTEGER DEFAULT NULL,
  p_mission_progress JSONB DEFAULT NULL
)
RETURNS public.learner_progress
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result public.learner_progress;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.learner_progress AS current_progress (
    user_id, course_id, module_id, status, progress_percentage,
    time_spent_seconds, last_position_seconds, quiz_score,
    mission_progress, completed_at, updated_at
  )
  VALUES (
    auth.uid(), p_course_id, p_module_id, p_status,
    COALESCE(p_progress_percentage, 0),
    COALESCE(p_time_spent_seconds, 0),
    COALESCE(p_last_position_seconds, 0),
    p_quiz_score, COALESCE(p_mission_progress, '{}'::jsonb),
    CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END, NOW()
  )
  ON CONFLICT (user_id, course_id, module_id)
  DO UPDATE SET
    status = CASE
      WHEN current_progress.status = 'completed' THEN 'completed'
      ELSE EXCLUDED.status
    END,
    progress_percentage = CASE
      WHEN current_progress.status = 'completed' THEN current_progress.progress_percentage
      ELSE COALESCE(p_progress_percentage, current_progress.progress_percentage)
    END,
    time_spent_seconds = COALESCE(p_time_spent_seconds, current_progress.time_spent_seconds),
    last_position_seconds = COALESCE(p_last_position_seconds, current_progress.last_position_seconds),
    quiz_score = COALESCE(p_quiz_score, current_progress.quiz_score),
    mission_progress = CASE
      WHEN current_progress.status = 'completed'
        AND NOT EXISTS (
          SELECT 1 FROM public.mission_reviews AS review
          WHERE review.learner_progress_id = current_progress.id
            AND review.review_status = 'resubmission_requested'
        )
        THEN current_progress.mission_progress
      ELSE COALESCE(p_mission_progress, current_progress.mission_progress)
    END,
    completed_at = CASE
      WHEN current_progress.status = 'completed' THEN current_progress.completed_at
      WHEN EXCLUDED.status = 'completed' THEN NOW()
      ELSE current_progress.completed_at
    END,
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_mission_resubmission(p_learner_progress_id UUID)
RETURNS public.mission_reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.mission_reviews;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.mission_reviews AS review
  SET review_status = 'pending',
      glow_feedback = '',
      grow_feedback = '',
      next_steps = '',
      overall_rating = NULL,
      reviewed_at = NULL,
      updated_at = NOW()
  WHERE review.learner_progress_id = p_learner_progress_id
    AND review.review_status = 'resubmission_requested'
    AND EXISTS (
      SELECT 1
      FROM public.learner_progress AS lp
      WHERE lp.id = review.learner_progress_id
        AND lp.user_id = auth.uid()
        AND lp.status = 'completed'
        AND lp.mission_progress->'evidenceUploads'
          IS DISTINCT FROM review.evidence_snapshot
    )
  RETURNING review.* INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Resubmission is not ready';
  END IF;

  DELETE FROM public.mission_review_comments
  WHERE review_id = result.id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_mission_resubmission(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_mission_resubmission(UUID) TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.mission_reviews TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.mission_review_comments TO authenticated;
