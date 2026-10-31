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
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
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
function triggerIncident() {
  for (let i = 0; i < 3; i++) recordAIAuthFailure({});
}

beforeEach(() => {
  clearAIAuthFailures(getAIAuthFailureSequence());
  auth.role = "admin";
  auth.valid = true;
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
    triggerIncident();
    const res = response();
    await aiStatus(request(), res);
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.json).toHaveBeenCalledWith({
      hasKey: true, hasBaseUrl: true, authFailureIncident: getAIAuthIncident(),
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("test-key");
  });
});

describe("health-driven recovery", () => {
  it("clears the incident only on a successful provider response", async () => {
    triggerIncident();
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
    const res = response();
    await health(request(), res);
    expect(getAIAuthIncident()).toBeNull();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "ok" }));
  });

  it.each([401, 403, 429, 500, 503])("does not clear the alert for HTTP %i", async (status) => {
    triggerIncident();
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
    triggerIncident();
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "");
    await health(request(), response());
    expect(getAIAuthIncident()).not.toBeNull();
    vi.stubEnv("AI_INTEGRATIONS_OPENAI_API_KEY", "test-key");
    vi.mocked(fetch).mockRejectedValue(new Error("private provider failure"));
    const res = response();
    await health(request(), res);
    expect(getAIAuthIncident()).not.toBeNull();
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("private");
  });

  it("does not erase failures that arrive during a successful probe", async () => {
    triggerIncident();
    vi.mocked(fetch).mockImplementation(async () => {
      recordAIAuthFailure({});
      return new Response(null, { status: 200 });
    });
    await health(request(), response());
    expect(getAIAuthIncident()?.failureCount).toBe(4);
  });
});
