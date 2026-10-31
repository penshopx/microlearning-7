export type CoachFeedbackDraft = {
  glowFeedback: string;
  growFeedback: string;
  nextSteps: string;
};

export function isCoachFeedbackComplete(feedback: CoachFeedbackDraft): boolean {
  return [
    feedback.glowFeedback,
    feedback.growFeedback,
    feedback.nextSteps,
  ].every((value) => value.trim().length >= 3);
}

export function formatTimestamp(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}
