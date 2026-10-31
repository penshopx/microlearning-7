import { beforeEach, describe, expect, it, vi } from "vitest";
import { classifyOpenAIError, getOpenAIErrorResponse, logOpenAIError } from "@/lib/openai-error";
import {
  clearAIAuthFailures,
  getAIAuthFailureSequence,
  getAIAuthIncident,
  recordAIAuthFailure,
} from "@/lib/server/ai-auth-failures";
import { AI_AUTH_FAILURE_WINDOW_MS } from "@/lib/ai-auth-incident";

beforeEach(() => {
  clearAIAuthFailures(getAIAuthFailureSequence());
});

describe("provider authentication incidents", () => {
  it("alerts only after three separate 401 failures in five minutes", () => {
    classifyOpenAIError({ status: 401 });
    classifyOpenAIError({ status: 401 });
    expect(getAIAuthIncident()).toBeNull();
    classifyOpenAIError({ status: 401 });
    expect(getAIAuthIncident()?.failureCount).toBe(3);
  });

  it("excludes expired failures and unrelated provider errors", () => {
    recordAIAuthFailure({}, 1000);
    recordAIAuthFailure({}, 2000);
    recordAIAuthFailure({}, 1000 + AI_AUTH_FAILURE_WINDOW_MS);
    expect(getAIAuthIncident()).toBeNull();
    classifyOpenAIError({ status: 429 });
    classifyOpenAIError({ status: 500 });
    expect(getAIAuthIncident()).toBeNull();
  });

  it("counts a rethrown/reclassified error only once", () => {
    const error = { status: 401 };
    classifyOpenAIError(error);
    getOpenAIErrorResponse(error);
    classifyOpenAIError(error);
    expect(getAIAuthIncident()).toBeNull();
    classifyOpenAIError({ status: 401 });
    classifyOpenAIError({ status: 401 });
    expect(getAIAuthIncident()?.failureCount).toBe(3);
  });

  it("latches an incident until recovery and does not expose provider data", () => {
    for (let i = 0; i < 3; i++) recordAIAuthFailure({ body: "secret" }, i);
    recordAIAuthFailure({ key: "secret" }, AI_AUTH_FAILURE_WINDOW_MS * 2);
    expect(getAIAuthIncident()).toEqual({
      id: expect.any(String),
      failureCount: 4,
      startedAt: 0,
      lastFailureAt: AI_AUTH_FAILURE_WINDOW_MS * 2,
    });
    clearAIAuthFailures(getAIAuthFailureSequence());
    expect(getAIAuthIncident()).toBeNull();
    recordAIAuthFailure({});
    expect(getAIAuthIncident()).toBeNull();
  });

  it("does not let an older successful probe clear a newer failure", () => {
    for (let i = 0; i < 3; i++) recordAIAuthFailure({});
    const checkedSequence = getAIAuthFailureSequence();
    recordAIAuthFailure({});
    clearAIAuthFailures(checkedSequence);
    expect(getAIAuthIncident()?.failureCount).toBe(4);
  });

  it("logs only a fixed category, not error messages, bodies or headers", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      logOpenAIError("Provider failed", {
        status: 401, message: "private", body: "private", headers: { Authorization: "private" },
      });
      expect(log).toHaveBeenCalledExactlyOnceWith("Provider failed", { code: "invalid_api_key" });
    } finally {
      log.mockRestore();
    }
  });
});
