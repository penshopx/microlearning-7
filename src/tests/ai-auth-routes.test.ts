import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import caption from "@/pages/api/ai/generate-caption";
import exam from "@/pages/api/ai/generate-exam";
import story from "@/pages/api/ai/generate-story";
import competency from "@/pages/api/ai/generate-competency";
import chunkMeeting from "@/pages/api/ai/chunk-meeting";
import multiAgent from "@/pages/api/ai/multi-agent";
import collab from "@/pages/api/ai/multi-agent-collab";
import runTool from "@/pages/api/ai/run-tool";
import chat from "@/pages/api/chat/ask";
import { AI_API_KEY_ERROR_CODE, AI_API_KEY_ERROR_MESSAGE } from "@/lib/openai-error";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  rpc: vi.fn(),
}));

// Keep the real classifier, incident writer and SSE helpers in the call chain.
// Only the provider and database boundaries are replaced.
vi.mock("openai", async importOriginal => {
  const actual = await importOriginal<typeof import("openai")>();
  return {
    default: class {
      static APIError = actual.default.APIError;
      chat = { completions: { create: mocks.create } };
    },
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    rpc: mocks.rpc,
    auth: { getUser: async () => ({ data: { user: { id: "owner" } }, error: null }) },
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        limit: () => query,
        single: async () => ({
          data: table === "courses"
            ? { id: "course", user_id: "owner", meeting_id: "meeting", title: "Safety" }
            : { id: "meeting", host_id: "owner", title: "Safety", ai_summary: "Workplace safety procedures. ".repeat(10) },
          error: null,
        }),
        then: (resolve: (value: unknown) => unknown) => resolve({ data: [], error: null }),
      };
      return query;
    },
  }),
}));

function response() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
  };
  return res as typeof res & NextApiResponse;
}

function completion(content = "{}") {
  return { choices: [{ message: { content } }] };
}

async function* stream(error?: unknown) {
  yield { choices: [{ delta: { content: "Safe partial answer" } }] };
  if (error) throw error;
}

const routeSelection = JSON.stringify({
  agentId: "struktur",
  agents: [{ agentId: "struktur" }, { agentId: "k3" }],
});
const documentBody = {
  courseId: "course",
  sourceType: "document",
  sourceText: "Workplace safety procedures and practices for every team member.",
};

interface RouteCase {
  name: string;
  handler: NextApiHandler;
  body: Record<string, unknown>;
  mode: "json" | "sse" | "chat";
  // SDK calls before the failing call, including parallel specialists.
  before?: unknown[];
  duringStream?: boolean;
  outerChatCatch?: boolean;
}

const cases: RouteCase[] = [
  { name: "caption nested catch", handler: caption, body: { topic: "Safety", platform: "instagram", tone: "professional" }, mode: "json" },
  { name: "exam nested catch", handler: exam, body: { topic: "Safety", difficulty: "beginner" }, mode: "json" },
  { name: "story", handler: story, body: { topic: "Safety" }, mode: "json" },
  { name: "competency", handler: competency, body: { type: "indicators", competencyUnit: "Safety" }, mode: "json" },
  { name: "document missions", handler: chunkMeeting, body: documentBody, mode: "json" },
  { name: "meeting missions", handler: chunkMeeting, body: { courseId: "course" }, mode: "json" },
  { name: "tool stream creation", handler: runTool, body: { toolId: "wbs-generator", formData: {} }, mode: "sse" },
  { name: "tool stream iteration", handler: runTool, body: { toolId: "wbs-generator", formData: {} }, mode: "sse", duringStream: true },
  { name: "agent routing", handler: multiAgent, body: { message: "Safety" }, mode: "sse" },
  { name: "agent specialist", handler: multiAgent, body: { message: "Safety" }, mode: "sse", before: [completion(routeSelection)] },
  { name: "manual agent", handler: multiAgent, body: { message: "Safety", preferredAgent: "struktur" }, mode: "sse" },
  { name: "agent stream iteration", handler: multiAgent, body: { message: "Safety", preferredAgent: "struktur" }, mode: "sse", duringStream: true },
  { name: "agent follow-ups", handler: multiAgent, body: { message: "Safety" }, mode: "sse", before: [completion(routeSelection), stream()] },
  ...(["json", "sse"] as const).flatMap(mode => {
    const base = { handler: collab, body: { message: "Safety", stream: mode === "sse" }, mode };
    const followups = completion('{"followups":[]}');
    // Streaming follow-ups start immediately after routing, before specialists.
    const prefix = mode === "sse" ? [completion(routeSelection), followups] : [completion(routeSelection)];
    const specialist = () => mode === "sse" ? stream() : completion("Safe answer");
    return [
      { ...base, name: `collab ${mode} routing` },
      { ...base, name: `collab ${mode} first specialist`, before: prefix },
      { ...base, name: `collab ${mode} second specialist`, before: [...prefix, specialist()] },
      { ...base, name: `collab ${mode} synthesis`, before: [...prefix, specialist(), specialist()] },
      {
        ...base,
        name: `collab ${mode} follow-ups`,
        before: mode === "sse"
          ? [completion(routeSelection)]
          : [...prefix, specialist(), specialist(), completion("Safe synthesis")],
      },
    ];
  }),
  {
    name: "collab specialist stream iteration", handler: collab,
    body: { message: "Safety", stream: true }, mode: "sse",
    before: [completion(routeSelection), completion('{"followups":[]}')], duringStream: true,
  },
  {
    name: "collab synthesis stream iteration", handler: collab,
    body: { message: "Safety", stream: true }, mode: "sse",
    before: [completion(routeSelection), completion('{"followups":[]}'), stream(), stream()], duringStream: true,
  },
  { name: "chat inner catch", handler: chat, body: { message: "Safety" }, mode: "chat" },
  { name: "chat stream iteration", handler: chat, body: { message: "Safety" }, mode: "chat", duringStream: true },
  { name: "chat outer catch", handler: chat, body: { message: "Safety" }, mode: "chat", outerChatCatch: true },
];

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role");
  mocks.create.mockReset();
  mocks.rpc.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe.each(["SDK", "structural"] as const)("%s authentication failure", errorType => {
  it.each(cases)("$name waits for metadata-only persistence and sanitizes the response", async testCase => {
    const privateValues = ["provider-private-body", "provider-private-header", "sk-test-private-key"];
    const providerBody = { message: `${privateValues[0]} ${privateValues[2]}`, code: "invalid_api_key" };
    const providerHeaders = new Headers({ "x-provider-private": privateValues[1] });
    const error = errorType === "SDK"
      ? new OpenAI.APIError(401, providerBody, providerBody.message, providerHeaders)
      : Object.assign(new Error(providerBody.message), {
        status: 401, code: "invalid_api_key", error: providerBody, headers: providerHeaders,
      });

    let finishStore!: (value: { data: null; error: null }) => void;
    const pendingStore = new Promise<{ data: null; error: null }>(resolve => { finishStore = resolve; });
    mocks.rpc.mockReturnValue(pendingStore);
    for (const value of testCase.before ?? []) mocks.create.mockResolvedValueOnce(value);
    if (testCase.outerChatCatch) {
      // A failure writing an AI chunk escapes the inner catch on its retry.
      mocks.create.mockResolvedValueOnce(stream());
    } else if (testCase.duringStream) {
      mocks.create.mockResolvedValueOnce(stream(error));
    } else {
      mocks.create.mockRejectedValueOnce(error);
    }
    // Other parallel work succeeds, so it cannot mask the injected failure.
    mocks.create.mockImplementation(async (params: { stream?: boolean }) =>
      params.stream ? stream() : completion("Safe answer"));

    const req = {
      method: "POST", headers: { authorization: "Bearer test-token" }, body: testCase.body,
    } as NextApiRequest;
    const res = response();
    if (testCase.outerChatCatch) {
      res.write
        .mockImplementationOnce(() => { throw error; })
        .mockImplementationOnce(() => { throw error; });
    }
    const running = Promise.resolve(testCase.handler(req, res));
    let settled = false;
    void running.then(() => { settled = true; }, () => { settled = true; });

    // Wait on an observable boundary, not a fixed sleep or microtask count.
    try {
      await vi.waitFor(() => expect(mocks.rpc).toHaveBeenCalledTimes(1));
      expect(mocks.rpc).toHaveBeenCalledWith("record_ai_auth_failure", { p_occurred_at: null });
      expect(settled).toBe(false);
      // Setting status alone does not send a response (collab sets 200
      // before awaiting its result). No error response may be sent yet.
      expect(res.status).not.toHaveBeenCalledWith(503);
      expect(res.json).not.toHaveBeenCalled();
      expect(res.end).not.toHaveBeenCalled();
      expect(res.write.mock.calls.flat().join("")).not.toContain(AI_API_KEY_ERROR_MESSAGE);
      expect(res.write.mock.calls.flat().join("")).not.toContain("event: error");
    } finally {
      finishStore({ data: null, error: null });
      await running;
    }

    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    if (testCase.mode === "json") {
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        error: AI_API_KEY_ERROR_MESSAGE, code: AI_API_KEY_ERROR_CODE, adminUrl: "/admin",
      });
    } else {
      expect(res.end).toHaveBeenCalledTimes(1);
      const output = res.write.mock.calls.flat().join("");
      expect(output).toContain(AI_API_KEY_ERROR_MESSAGE);
      if (testCase.mode === "sse") {
        expect(output).toContain("event: error");
        expect(output).toContain(AI_API_KEY_ERROR_CODE);
        expect(output).not.toContain("event: done");
      }
    }
    const exposed = JSON.stringify({
      json: res.json.mock.calls, headers: res.setHeader.mock.calls,
      stream: res.write.mock.calls, logs: vi.mocked(console.error).mock.calls,
      storage: mocks.rpc.mock.calls,
    });
    for (const value of privateValues) expect(exposed).not.toContain(value);
  });
});
