import type { NextApiRequest, NextApiResponse } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import health from "@/pages/api/ai/health";
import aiStatus from "@/pages/api/admin/ai-status";
import {
  clearAIAuthFailures,
  getAIAuthFailureSequence,
  getAIAuthIncident,
  recordAIAuthFailure,
} from "@/lib/server/ai-auth-failures";

const auth = vi.hoisted(() => ({
  role: "admin", valid: true,
}));
const incidentStore = vi.hoisted(() => {
  let sequence = 0;
  let recent: number[] = [];
  let incident: { id: string; failureCount: number; startedAt: number; lastFailureAt: number } | null = null;
  return {
    reset() { sequence = 0; recent = []; incident = null; },
    async rpc(name: string, args?: Record<string, unknown>) {
      if (name === "record_ai_auth_failure") {
        const time = args?.p_occurred_at ? Date.parse(String(args.p_occurred_at)) : Date.now();
        sequence++;
        recent = [...recent.filter(timestamp => timestamp > time - 300_000), time];
        if (incident) {
          incident.failureCount++;
          incident.lastFailureAt = time;
        } else if (recent.length >= 3) {
          incident = { id: `ai-auth-${sequence}`, failureCount: recent.length, startedAt: recent[0], lastFailureAt: time };
        }
        return { data: incident, error: null };
      }
      if (name === "get_ai_auth_incident") return { data: incident, error: null };
      if (name === "get_ai_auth_failure_sequence") return { data: sequence, error: null };
      if (name === "clear_ai_auth_failures") {
        const matches = sequence === args?.p_checked_sequence;
        if (matches) { recent = []; incident = null; }
        return { data: matches, error: null };
      }
      throw new Error(`Unexpected RPC ${name}`);
    },
  };
});
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc: incidentStore.rpc,
    auth: {
      getUser: async () => ({ data: { user: auth.valid ? { id: "admin" } : null } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: { role: auth.role } }) }),
      }),
    }),
  }),
}));

function request(token = true, method = "GET") {
  return { method, headers: token ? { authorization: "Bearer test-token" } : {} } as NextApiRequest;
}
function response() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
  };
  return res as typeof res & NextApiResponse;
}
async function triggerIncident() {
  for (let i = 0; i < 3; i++) await recordAIAuthFailure({});
}

beforeEach(() => {
  incidentStore.reset();
  auth.role = "admin";
  auth.valid = true;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role");
  vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "test-key");
  vi.stubEnv("AI_INTEGRATIONS_OPENAI_BASE_URL", "https://example.test/v1");
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe.each([["health", health], ["status", aiStatus]] as const)("%s admin gate", (_name, handler) => {
  it("rejects missing/invalid tokens and non-admin users", async () => {
    const res = response();
    await handler(request(false), res);
    expect(res.status).toHaveBeenLastCalledWith(401);
    auth.valid = false;
    await handler(request(), res);
    expect(res.status).toHaveBeenLastCalledWith(401);
    auth.valid = true;
    auth.role = "user";
    await handler(request(), res);
    expect(res.status).toHaveBeenLastCalledWith(403);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects unsupported methods", async () => {
    const res = response();
    await handler(request(true, "POST"), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});

describe("admin incident status", () => {
  it("returns safe incident metadata without probing the provider", async () => {
    await triggerIncident();
    const res = response();
    await aiStatus(request(), res);
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.json).toHaveBeenCalledWith({
      hasKey: true, hasBaseUrl: true, authFailureIncident: await getAIAuthIncident(),
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("test-key");
  });
});

describe("health-driven recovery", () => {
  it("clears the incident only on a successful provider response", async () => {
    await triggerIncident();
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
    const res = response();
    await health(request(), res);
    expect(await getAIAuthIncident()).toBeNull();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "ok" }));
  });

  it.each([401, 403, 429, 500, 503])("does not clear the alert for HTTP %i", async (status) => {
    await triggerIncident();
    vi.mocked(fetch).mockResolvedValue(new Response("private provider body", { status }));
    const res = response();
    await health(request(), res);
    expect(getAIAuthIncident()).not.toBeNull();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: status === 401 ? "invalid" : "unreachable",
    }));
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("private");
  });

  it("keeps incidents when credentials are missing or the provider cannot be reached", async () => {
    await triggerIncident();
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "");
    await health(request(), response());
    expect(await getAIAuthIncident()).not.toBeNull();
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "test-key");
    vi.mocked(fetch).mockRejectedValue(new Error("private provider failure"));
    const res = response();
    await health(request(), res);
    expect(await getAIAuthIncident()).not.toBeNull();
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("private");
  });

  it("does not erase failures that arrive during a successful probe", async () => {
    await triggerIncident();
    vi.mocked(fetch).mockImplementation(async () => {
      await recordAIAuthFailure({});
      return new Response(null, { status: 200 });
    });
    await health(request(), response());
    expect((await getAIAuthIncident())?.failureCount).toBe(4);
  });
});
