import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { classifyOpenAIError, getOpenAIErrorResponse, logOpenAIError } from "@/lib/openai-error";
import {
  clearAIAuthFailures,
  getAIAuthFailureSequence,
  getAIAuthIncident,
  recordAIAuthFailure,
} from "@/lib/server/ai-auth-failures";
import { AI_AUTH_FAILURE_WINDOW_MS } from "@/lib/ai-auth-incident";

const store = vi.hoisted(() => {
  let sequence = 0;
  let recent: number[] = [];
  let incident: { id: string; failureCount: number; startedAt: number; lastFailureAt: number } | null = null;
  const calls: Array<{ name: string; args?: Record<string, unknown> }> = [];
  return {
    reset() { sequence = 0; recent = []; incident = null; calls.length = 0; },
    calls,
    async rpc(name: string, args?: Record<string, unknown>) {
      calls.push({ name, args });
      if (name === "record_ai_auth_failure") {
        const time = args?.p_occurred_at ? Date.parse(String(args.p_occurred_at)) : Date.now();
        sequence++;
        recent = [...recent.filter(timestamp => timestamp > time - 300_000), time];
        if (incident) {
          incident.failureCount++;
          incident.lastFailureAt = time;
        } else if (recent.length >= 3) {
          incident = {
            id: `ai-auth-${sequence}`,
            failureCount: recent.length,
            startedAt: recent[0],
            lastFailureAt: time,
          };
        }
        return { data: incident, error: null };
      }
      if (name === "get_ai_auth_incident") return { data: incident, error: null };
      if (name === "get_ai_auth_failure_sequence") return { data: sequence, error: null };
      if (name === "clear_ai_auth_failures") {
        if (sequence === args?.p_checked_sequence) {
          recent = [];
          incident = null;
        }
        return { data: sequence === args?.p_checked_sequence, error: null };
      }
      throw new Error(`Unexpected RPC ${name}`);
    },
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc: store.rpc }),
}));

beforeEach(() => {
  store.reset();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role");
});

afterEach(() => vi.unstubAllEnvs());

describe("provider authentication incidents", () => {
  it("alerts only after three separate 401 failures in five minutes", async () => {
    classifyOpenAIError({ status: 401 });
    classifyOpenAIError({ status: 401 });
    expect(await getAIAuthIncident()).toBeNull();
    await logOpenAIError("Provider failed", { status: 401 });
    await logOpenAIError("Provider failed", { status: 401 });
    await logOpenAIError("Provider failed", { status: 401 });
    expect((await getAIAuthIncident())?.failureCount).toBe(3);
  });

  it("excludes expired failures and unrelated provider errors", async () => {
    await recordAIAuthFailure({}, 1000);
    await recordAIAuthFailure({}, 2000);
    await recordAIAuthFailure({}, 1000 + AI_AUTH_FAILURE_WINDOW_MS);
    expect(await getAIAuthIncident()).toBeNull();
    classifyOpenAIError({ status: 429 });
    classifyOpenAIError({ status: 500 });
    expect(await getAIAuthIncident()).toBeNull();
  });

  it("counts a rethrown/reclassified error only once", async () => {
    const error = { status: 401 };
    await logOpenAIError("Provider failed", error);
    getOpenAIErrorResponse(error);
    await logOpenAIError("Provider failed again", error);
    expect(await getAIAuthIncident()).toBeNull();
    await recordAIAuthFailure({});
    await recordAIAuthFailure({});
    expect((await getAIAuthIncident())?.failureCount).toBe(3);
  });

  it("latches an incident until recovery and does not expose provider data", async () => {
    for (let i = 0; i < 3; i++) await recordAIAuthFailure({ body: "secret" }, i);
    await recordAIAuthFailure({ key: "secret" }, AI_AUTH_FAILURE_WINDOW_MS * 2);
    expect(await getAIAuthIncident()).toEqual({
      id: expect.any(String),
      failureCount: 4,
      startedAt: 0,
      lastFailureAt: AI_AUTH_FAILURE_WINDOW_MS * 2,
    });
    await clearAIAuthFailures(await getAIAuthFailureSequence());
    expect(await getAIAuthIncident()).toBeNull();
    await recordAIAuthFailure({});
    expect(await getAIAuthIncident()).toBeNull();
  });

  it("does not let an older successful probe clear a newer failure", async () => {
    for (let i = 0; i < 3; i++) await recordAIAuthFailure({});
    const checkedSequence = await getAIAuthFailureSequence();
    await recordAIAuthFailure({});
    await clearAIAuthFailures(checkedSequence);
    expect((await getAIAuthIncident())?.failureCount).toBe(4);
  });

  it("atomically accumulates failures arriving from concurrent writers", async () => {
    await Promise.all(Array.from({ length: 24 }, () => recordAIAuthFailure({})));
    expect((await getAIAuthIncident())?.failureCount).toBe(24);
    expect(await getAIAuthFailureSequence()).toBe(24);
  });

  it("logs only a fixed category, not error messages, bodies or headers", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await logOpenAIError("Provider failed", {
        status: 401, message: "private", body: "private", headers: { Authorization: "private" },
      });
      expect(log).toHaveBeenCalledExactlyOnceWith("Provider failed", { code: "invalid_api_key" });
      expect(store.calls).toContainEqual({
        name: "record_ai_auth_failure",
        args: { p_occurred_at: null },
      });
    } finally {
      log.mockRestore();
    }
  });
});
