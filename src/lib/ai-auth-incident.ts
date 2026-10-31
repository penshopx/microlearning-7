/** Safe to return to authenticated admins; never contains provider error data. */
export interface AIAuthIncident {
  id: string;
  failureCount: number;
  startedAt: number;
  lastFailureAt: number;
}

export const AI_AUTH_FAILURE_WINDOW_MS = 5 * 60 * 1000;
export const AI_AUTH_FAILURE_THRESHOLD = 3;
export const AI_AUTH_INCIDENT_UPDATED_EVENT = "chaesa:ai-auth-incident-updated";
