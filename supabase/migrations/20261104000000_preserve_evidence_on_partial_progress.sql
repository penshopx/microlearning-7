-- Keep omitted mission metadata distinct from an explicit empty object.
-- The BEFORE INSERT evidence trigger runs before ON CONFLICT can preserve
-- mission_progress from the existing row, so seed the attempted INSERT with
-- the authenticated participant's current metadata when the argument is NULL.
CREATE OR REPLACE FUNCTION upsert_learner_progress_atomic(
  p_course_id UUID,
  p_module_id UUID,
  p_status TEXT,
  p_progress_percentage INTEGER DEFAULT NULL,
  p_time_spent_seconds INTEGER DEFAULT NULL,
  p_last_position_seconds INTEGER DEFAULT NULL,
  p_quiz_score INTEGER DEFAULT NULL,
  p_mission_progress JSONB DEFAULT NULL
)
RETURNS learner_progress
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result learner_progress;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO learner_progress AS current_progress (
    user_id,
    course_id,
    module_id,
    status,
    progress_percentage,
    time_spent_seconds,
    last_position_seconds,
    quiz_score,
    mission_progress,
    completed_at,
    updated_at
  )
  VALUES (
    auth.uid(),
    p_course_id,
    p_module_id,
    p_status,
    COALESCE(p_progress_percentage, 0),
    COALESCE(p_time_spent_seconds, 0),
    COALESCE(p_last_position_seconds, 0),
    p_quiz_score,
    COALESCE(
      p_mission_progress,
      (
        SELECT stored_progress.mission_progress
        FROM learner_progress AS stored_progress
        WHERE stored_progress.user_id = auth.uid()
          AND stored_progress.course_id = p_course_id
          AND stored_progress.module_id = p_module_id
      ),
      '{}'::jsonb
    ),
    CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,
    NOW()
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
      WHEN current_progress.status = 'completed' AND EXCLUDED.status <> 'completed'
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

REVOKE ALL ON FUNCTION upsert_learner_progress_atomic(UUID, UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION upsert_learner_progress_atomic(UUID, UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, JSONB) TO authenticated;
