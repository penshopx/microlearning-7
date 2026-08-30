/** Shared client-side handling for AI provider outages. */
import {
  AI_API_KEY_ERROR_CODE,
  type AIUnavailableDetails,
} from "@/lib/ai-error-contract";

export const AI_UNAVAILABLE_EVENT = "chaesa:ai-unavailable";
export { AI_API_KEY_ERROR_CODE };
export type { AIUnavailableDetails };

function getUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.pathname;
  return input.url;
}

function isAIEndpoint(input: RequestInfo | URL): boolean {
  return getUrl(input).startsWith("/api/ai/");
}

/** Notify the global banner without coupling API callers to UI state. */
export function notifyAIUnavailable(details: AIUnavailableDetails = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AIUnavailableDetails>(AI_UNAVAILABLE_EVENT, {
    detail: details,
  }));
}

/**
 * Fetch an AI endpoint and surface the shared provider-auth error when the
 * server returns it. The original response is returned for the caller to
 * consume normally.
 */
export async function fetchAI(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);

  if (isAIEndpoint(input) && response.status === 503) {
    const payload = await response.clone().json().catch(() => ({})) as AIUnavailableDetails;
    if (payload.code === AI_API_KEY_ERROR_CODE) {
      notifyAIUnavailable(payload);
    }
  }

  return response;
}