import { createClient } from "@supabase/supabase-js";
import type { AIAuthIncident } from "@/lib/ai-auth-incident";

interface StoredIncident {
  id: string;
  failureCount: number;
  startedAt: number;
  lastFailureAt: number;
}

const seenErrors = new WeakSet<object>();

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("AI auth incident storage is not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function throwIfStoreError(error: unknown): void {
  if (error) throw new Error("AI auth incident storage request failed");
}

export async function recordAIAuthFailure(providerError: object, now?: number): Promise<void> {
  // Nested catch blocks may log the same SDK error more than once.
  if (seenErrors.has(providerError)) return;
  seenErrors.add(providerError);
  try {
    const { error: storeError } = await serverClient().rpc("record_ai_auth_failure", {
      p_occurred_at: now === undefined ? null : new Date(now).toISOString(),
    });
    throwIfStoreError(storeError);
  } catch (error) {
    seenErrors.delete(providerError);
    throw error instanceof Error && error.message === "AI auth incident storage request failed"
      ? error
      : new Error("AI auth incident storage request failed");
  }
}

export async function getAIAuthIncident(): Promise<AIAuthIncident | null> {
  const { data, error } = await serverClient().rpc("get_ai_auth_incident");
  throwIfStoreError(error);
  if (!data || typeof data !== "object") return null;
  const incident = data as StoredIncident;
  return {
    id: incident.id,
    failureCount: incident.failureCount,
    startedAt: incident.startedAt,
    lastFailureAt: incident.lastFailureAt,
  };
}

export async function getAIAuthFailureSequence(): Promise<number> {
  const { data, error } = await serverClient().rpc("get_ai_auth_failure_sequence");
  throwIfStoreError(error);
  const sequence = Number(data);
  if (!Number.isSafeInteger(sequence) || sequence < 0) {
    throw new Error("AI auth incident storage returned an invalid sequence");
  }
  return sequence;
}

/** A successful probe must not clear failures arriving while it was in flight. */
export async function clearAIAuthFailures(checkedSequence: number): Promise<void> {
  const { error } = await serverClient().rpc("clear_ai_auth_failures", {
    p_checked_sequence: checkedSequence,
  });
  throwIfStoreError(error);
}
