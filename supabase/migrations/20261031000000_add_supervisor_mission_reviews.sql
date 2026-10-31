-- Scope is explicitly assigned by the course owner, never inferred from a role
-- stored in user-editable profile metadata.
CREATE TABLE public.mission_supervisor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, participant_id, supervisor_id),
  CHECK (participant_id <> supervisor_id)
);
CREATE INDEX mission_supervisor_scope ON public.mission_supervisor_assignments(supervisor_id, course_id, participant_id);
ALTER TABLE public.mission_supervisor_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Course owners manage supervisor scope"
ON public.mission_supervisor_assignments FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.user_id = auth.uid()));
CREATE POLICY "Supervisors see their assignments"
ON public.mission_supervisor_assignments FOR SELECT TO authenticated
USING (supervisor_id = auth.uid());
GRANT SELECT, INSERT, DELETE ON public.mission_supervisor_assignments TO authenticated;

CREATE FUNCTION public.can_access_assigned_mission_course(p_course_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.mission_supervisor_assignments a
    WHERE a.course_id = p_course_id
      AND (a.supervisor_id = auth.uid() OR a.participant_id = auth.uid()));
$$;
REVOKE ALL ON FUNCTION public.can_access_assigned_mission_course(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_assigned_mission_course(UUID) TO authenticated;
CREATE POLICY "Assigned users see mission course" ON public.courses FOR SELECT TO authenticated
USING (public.can_access_assigned_mission_course(id));
CREATE POLICY "Assigned users see mission modules" ON public.course_modules FOR SELECT TO authenticated
USING (public.can_access_assigned_mission_course(course_id));
CREATE POLICY "Assigned users see mission content" ON public.module_content FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.course_modules m WHERE m.id = module_id
  AND public.can_access_assigned_mission_course(m.course_id)));
CREATE POLICY "Assigned users see mission quizzes" ON public.module_quizzes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.course_modules m WHERE m.id = module_id
  AND public.can_access_assigned_mission_course(m.course_id)));

CREATE TABLE public.mission_evidence_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id UUID NOT NULL UNIQUE REFERENCES public.learner_progress(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('approved', 'retry_requested')),
  feedback TEXT NOT NULL DEFAULT '' CHECK (char_length(feedback) <= 1000),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status <> 'retry_requested' OR char_length(btrim(feedback)) > 0)
);
ALTER TABLE public.mission_evidence_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mission_evidence_reviews FROM anon, authenticated;
GRANT SELECT ON public.mission_evidence_reviews TO authenticated;

CREATE FUNCTION public.can_review_mission(p_progress_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.learner_progress p
    JOIN public.course_modules m ON m.id = p.module_id AND m.course_id = p.course_id
    JOIN public.mission_supervisor_assignments a
      ON a.course_id = p.course_id AND a.participant_id = p.user_id
    WHERE p.id = p_progress_id AND a.supervisor_id = auth.uid()
      AND p.user_id <> auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.can_review_mission(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_review_mission(UUID) TO authenticated;

CREATE POLICY "Participants and scoped supervisors see reviews"
ON public.mission_evidence_reviews FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.learner_progress p WHERE p.id = progress_id AND p.user_id = auth.uid())
  OR public.can_review_mission(progress_id)
);

-- Return only submitted evidence, not every draft in a participant's account.
CREATE FUNCTION public.get_mission_review_submissions(p_course_id UUID)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.updated_at DESC), '[]'::jsonb)
  FROM (
    SELECT p.id, p.user_id, p.module_id, p.status, p.mission_progress, p.updated_at,
      m.title AS module_title,
      (SELECT to_jsonb(r) FROM public.mission_evidence_reviews r WHERE r.progress_id = p.id) AS review
    FROM public.learner_progress p
    JOIN public.course_modules m ON m.id = p.module_id AND m.course_id = p.course_id
    WHERE p.course_id = p_course_id AND p.status = 'completed'
      AND public.can_review_mission(p.id)
      AND jsonb_typeof(p.mission_progress->'evidenceUploads') = 'array'
      AND p.mission_progress->'evidenceUploads' <> '[]'::jsonb
  ) s;
$$;

CREATE FUNCTION public.review_mission_evidence(p_progress_id UUID, p_status TEXT, p_feedback TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE p public.learner_progress; result public.mission_evidence_reviews;
BEGIN
  SELECT * INTO p FROM public.learner_progress WHERE id = p_progress_id FOR UPDATE;
  IF NOT FOUND OR NOT public.can_review_mission(p_progress_id) THEN
    RAISE EXCEPTION 'Not authorized to review this submission';
  END IF;
  IF p.status <> 'completed' OR jsonb_typeof(p.mission_progress->'evidenceUploads') IS DISTINCT FROM 'array'
    OR p.mission_progress->'evidenceUploads' = '[]'::jsonb THEN
    RAISE EXCEPTION 'Evidence must be submitted before review';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('approved', 'retry_requested')
    OR p_feedback IS NULL OR char_length(p_feedback) > 1000
    OR (p_status = 'retry_requested' AND btrim(p_feedback) = '') THEN
    RAISE EXCEPTION 'Invalid review status or feedback';
  END IF;
  INSERT INTO public.mission_evidence_reviews(progress_id, reviewer_id, status, feedback)
  VALUES (p.id, auth.uid(), p_status, btrim(p_feedback))
  ON CONFLICT (progress_id) DO UPDATE SET
    reviewer_id = auth.uid(), status = EXCLUDED.status,
    feedback = EXCLUDED.feedback, reviewed_at = now()
  RETURNING * INTO result;
  RETURN to_jsonb(result);
END;
$$;

-- Storage access requires both a current assignment and an exact referenced
-- object in a completed submission. An assignment never opens a whole folder.
CREATE FUNCTION public.can_open_mission_evidence(p_path TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.learner_progress p
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(p.mission_progress->'evidenceUploads') = 'array'
        THEN p.mission_progress->'evidenceUploads' ELSE '[]'::jsonb END
    ) u
    WHERE p.status = 'completed' AND public.can_review_mission(p.id)
      AND u->>'storagePath' = p_path
      AND starts_with(p_path, p.user_id::text || '/' || p.course_id::text || '/' ||
        p.module_id::text || '/' || (u->>'evidenceId') || '/')
  );
$$;
CREATE POLICY "Assigned supervisors can open submitted evidence"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'mission-evidence' AND public.can_open_mission_evidence(name));

CREATE FUNCTION public.restart_mission_practice(p_progress_id UUID)
RETURNS public.learner_progress LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE p public.learner_progress;
BEGIN
  SELECT * INTO p FROM public.learner_progress WHERE id = p_progress_id FOR UPDATE;
  IF NOT FOUND OR p.user_id IS DISTINCT FROM auth.uid() OR p.status <> 'completed'
    OR NOT EXISTS (SELECT 1 FROM public.mission_evidence_reviews r
      WHERE r.progress_id = p.id AND r.status = 'retry_requested') THEN
    RAISE EXCEPTION 'Only the participant can restart a practice requested for retry';
  END IF;
  UPDATE public.learner_progress SET status = 'in_progress', completed_at = NULL,
    progress_percentage = 75, updated_at = now()
    WHERE id = p.id RETURNING * INTO p;
  RETURN p;
END;
$$;

-- A retry keeps coaching visible during edits. Submitting the next attempt
-- returns it to pending; old approval cannot silently apply to new evidence.
CREATE FUNCTION public.guard_mission_review_revision()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW.status <> 'completed' AND (
    NEW.status <> 'in_progress' OR NEW.user_id IS DISTINCT FROM auth.uid()
    OR NEW.mission_progress IS DISTINCT FROM OLD.mission_progress
    OR NOT EXISTS (SELECT 1 FROM public.mission_evidence_reviews r
      WHERE r.progress_id = OLD.id AND r.status = 'retry_requested')
  ) THEN
    RAISE EXCEPTION 'Only requested practice can be restarted by its participant';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.course_id IS DISTINCT FROM OLD.course_id
    OR NEW.module_id IS DISTINCT FROM OLD.module_id THEN
    IF EXISTS (SELECT 1 FROM public.mission_evidence_reviews WHERE progress_id = OLD.id)
      -- Preserve the existing module FK's ON DELETE SET NULL behavior.
      AND NOT (NEW.user_id = OLD.user_id AND NEW.course_id = OLD.course_id
        AND NEW.module_id IS NULL AND NOT EXISTS (
          SELECT 1 FROM public.course_modules m WHERE m.id = OLD.module_id
        )) THEN
      RAISE EXCEPTION 'Reviewed submission identity cannot change';
    END IF;
  END IF;
  IF OLD.status = 'completed' AND NEW.mission_progress IS DISTINCT FROM OLD.mission_progress
    AND EXISTS (SELECT 1 FROM public.mission_evidence_reviews WHERE progress_id = OLD.id) THEN
    RAISE EXCEPTION 'Restart requested practice before changing reviewed evidence';
  END IF;
  IF OLD.status <> 'completed' AND NEW.status = 'completed' THEN
    DELETE FROM public.mission_evidence_reviews
      WHERE progress_id = OLD.id AND status = 'retry_requested';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER guard_mission_review_revision BEFORE UPDATE ON public.learner_progress
FOR EACH ROW EXECUTE FUNCTION public.guard_mission_review_revision();

REVOKE ALL ON FUNCTION public.get_mission_review_submissions(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_mission_evidence(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_open_mission_evidence(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restart_mission_practice(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_mission_review_revision() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mission_review_submissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_mission_evidence(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_open_mission_evidence(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restart_mission_practice(UUID) TO authenticated;
