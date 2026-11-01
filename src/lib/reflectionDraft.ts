// Store text only: evidence, checklists and revisions must always come from the server.
const PREFIX = "chaesa_reflection_draft_v1:";
export type ReflectionDraftScope = { accountId: string; courseId: string; moduleId: string };

export function reflectionDraftKey(scope: ReflectionDraftScope): string {
  return PREFIX + [scope.accountId, scope.courseId, scope.moduleId].map(encodeURIComponent).join(":");
}

export function clearOtherReflectionDrafts(accountId: string | null): boolean {
  try {
    const keepPrefix = accountId === null ? null : PREFIX + encodeURIComponent(accountId) + ":";
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(PREFIX) && (!keepPrefix || !key.startsWith(keepPrefix))) {
        window.localStorage.removeItem(key);
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function readReflectionDraft(scope: ReflectionDraftScope): string | null {
  const raw = window.localStorage.getItem(reflectionDraftKey(scope));
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === "object" && "version" in value && value.version === 1 &&
      "feedback" in value && typeof value.feedback === "string") return value.feedback;
  } catch {
    // Invalid local data is never applied to progress.
  }
  window.localStorage.removeItem(reflectionDraftKey(scope));
  return null;
}

export function writeReflectionDraft(scope: ReflectionDraftScope, feedback: string): void {
  window.localStorage.setItem(reflectionDraftKey(scope), JSON.stringify({ version: 1, feedback }));
}

export function removeReflectionDraft(scope: ReflectionDraftScope, confirmedFeedback?: string): void {
  if (confirmedFeedback === undefined || readReflectionDraft(scope) === confirmedFeedback) {
    window.localStorage.removeItem(reflectionDraftKey(scope));
  }
}
