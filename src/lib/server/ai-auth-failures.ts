import {
  AI_AUTH_FAILURE_THRESHOLD,
  AI_AUTH_FAILURE_WINDOW_MS,
  type AIAuthIncident,
} from "@/lib/ai-auth-incident";

interface FailureState {
  recent: number[];
  incident: AIAuthIncident | null;
  sequence: number;
  seen: WeakSet<object>;
}

// Share across Next route bundles and dev hot reloads in this server process.
// This intentionally stores only counters/times, not keys, users or error bodies.
const server = globalThis as typeof globalThis & { aiAuthFailures?: FailureState };
function state(): FailureState {
  return server.aiAuthFailures ??= {
    recent: [], incident: null, sequence: 0, seen: new WeakSet(),
  };
}

export function recordAIAuthFailure(error: object, now = Date.now()): void {
  const current = state();
  // Nested catch blocks may classify the same SDK error more than once.
  if (current.seen.has(error)) return;
  current.seen.add(error);
  current.sequence += 1;

  current.recent = current.recent.filter(time => now - time < AI_AUTH_FAILURE_WINDOW_MS);
  current.recent.push(now);
  // Only the most recent threshold-sized window is needed to detect recurrence.
  current.recent = current.recent.slice(-AI_AUTH_FAILURE_THRESHOLD);
  if (current.incident) {
    current.incident.failureCount += 1;
    current.incident.lastFailureAt = now;
  } else if (current.recent.length >= AI_AUTH_FAILURE_THRESHOLD) {
    current.incident = {
      id: `ai-auth-${now}-${current.sequence}`,
      failureCount: current.recent.length,
      startedAt: current.recent[0],
      lastFailureAt: now,
    };
  }
}

export function getAIAuthIncident(): AIAuthIncident | null {
  const incident = state().incident;
  return incident ? { ...incident } : null;
}

export function getAIAuthFailureSequence(): number {
  return state().sequence;
}

/** A successful probe must not clear failures arriving while it was in flight. */
export function clearAIAuthFailures(checkedSequence: number): void {
  const current = state();
  if (current.sequence !== checkedSequence) return;
  current.recent = [];
  current.incident = null;
}
