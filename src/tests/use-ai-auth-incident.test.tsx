// @vitest-environment happy-dom
import { StrictMode, type ReactNode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIAuthStatusProvider, useAIAuthIncident, useAIAuthStatus } from "@/hooks/useAIAuthIncident";
import { AI_AUTH_INCIDENT_UPDATED_EVENT } from "@/lib/ai-auth-incident";

const mocks = vi.hoisted(() => ({
  auth: { userId: "admin" as string | null, isAdmin: true },
  getSession: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: mocks.getSession } },
}));
function wrapper({ children }: { children: ReactNode }) {
  return <AIAuthStatusProvider>{children}</AIAuthStatusProvider>;
}
const incident = { id: "test-incident", failureCount: 3, startedAt: 1, lastFailureAt: 2 };
beforeEach(() => {
  mocks.auth = { userId: "admin", isAdmin: true };
  mocks.getSession.mockReset().mockImplementation(async () => ({
    data: { session: { access_token: "test-token", user: { id: mocks.auth.userId } } },
  }));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true, status: 200, json: async () => ({ authFailureIncident: incident }),
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("admin incident refresh", () => {
  it("keeps the last known incident but explicitly marks failed reads as unavailable", async () => {
    const { result } = renderHook(() => useAIAuthStatus(), { wrapper });
    await waitFor(() => expect(result.current?.status).toBe("available"));
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    expect(result.current).toMatchObject({ status: "unavailable", incident });
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    expect(result.current).toMatchObject({ status: "available", incident });
  });

  it("never polls for non-admins and clears state when the account changes", async () => {
    mocks.auth.isAdmin = false;
    const { result, rerender } = renderHook(() => useAIAuthIncident(), { wrapper });
    expect(fetch).not.toHaveBeenCalled();
    mocks.auth.isAdmin = true;
    rerender();
    await waitFor(() => expect(result.current).toEqual(incident));
    expect(fetch).toHaveBeenCalledWith("/api/admin/ai-status", expect.objectContaining({
      headers: { Authorization: "Bearer test-token" }, cache: "no-store",
    }));
    mocks.auth = { userId: "other-user", isAdmin: false };
    rerender();
    expect(result.current).toBeNull();
  });

  it("refreshes on recovery events and drops the cleared incident", async () => {
    const { result } = renderHook(() => useAIAuthIncident(), { wrapper });
    await waitFor(() => expect(result.current).toEqual(incident));
    vi.mocked(fetch).mockResolvedValue({
      ok: true, status: 200, json: async () => ({ authFailureIncident: null }),
    } as Response);
    act(() => window.dispatchEvent(new Event(AI_AUTH_INCIDENT_UPDATED_EVENT)));
    await waitFor(() => expect(result.current).toBeNull());
  });

  it("polls every 30 seconds without calling provider health", async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useAIAuthIncident(), { wrapper });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(fetch).toHaveBeenCalledTimes(2);
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("keeps a known alert on network failure, but hides it when access is revoked", async () => {
    const { result } = renderHook(() => useAIAuthIncident(), { wrapper });
    await waitFor(() => expect(result.current).toEqual(incident));
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });
    expect(result.current).toEqual(incident);
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403 } as Response);
    act(() => window.dispatchEvent(new Event("focus")));
    await waitFor(() => expect(result.current).toBeNull());
  });

  it("shares one request, interval and event listener across consumers and cleans them up", async () => {
    vi.useFakeTimers();
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const intervals = vi.spyOn(window, "setInterval");
    const clear = vi.spyOn(window, "clearInterval");
    const { result, unmount } = renderHook(() => ({
      status: useAIAuthStatus(),
      incident: useAIAuthIncident(),
      secondStatus: useAIAuthStatus(),
    }), { wrapper });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(result.current.secondStatus);
    expect(result.current.incident).toEqual(incident);
    expect(intervals).toHaveBeenCalledTimes(1);
    for (const name of ["focus", AI_AUTH_INCIDENT_UPDATED_EVENT]) {
      expect(add.mock.calls.filter(([event]) => event === name)).toHaveLength(1);
    }
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(fetch).toHaveBeenCalledTimes(2);
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    expect(fetch).toHaveBeenCalledTimes(3);
    await act(async () => { window.dispatchEvent(new Event(AI_AUTH_INCIDENT_UPDATED_EVENT)); });
    expect(fetch).toHaveBeenCalledTimes(4);
    unmount();
    expect(clear).toHaveBeenCalledWith(intervals.mock.results[0].value);
    for (const name of ["focus", AI_AUTH_INCIDENT_UPDATED_EVENT]) {
      const listener = add.mock.calls.find(([event]) => event === name)![1];
      expect(remove).toHaveBeenCalledWith(name, listener);
    }
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event(AI_AUTH_INCIDENT_UPDATED_EVENT));
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it("clears cached incidents on admin switches and ignores a late old response", async () => {
    const { result, rerender } = renderHook(() => useAIAuthStatus(), { wrapper });
    await waitFor(() => expect(result.current?.incident).toEqual(incident));
    let resolveOld!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    const oldSignal = vi.mocked(fetch).mock.calls.at(-1)![1]!.signal!;
    let resolveNew!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { resolveNew = resolve; }));
    mocks.auth = { userId: "second-admin", isAdmin: true };
    rerender();
    expect(result.current).toBeNull();
    expect(oldSignal.aborted).toBe(true);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    await act(async () => resolveOld({
      ok: true, status: 200, json: async () => ({ authFailureIncident: incident }),
    } as Response));
    expect(result.current).toBeNull();
    await act(async () => resolveNew({
      ok: true, status: 200, json: async () => ({ authFailureIncident: null, hasKey: true }),
    } as Response));
    expect(result.current).toEqual({ status: "available", incident: null, hasKey: true });
  });

  it("does not send a mismatched session token or accept an old session lookup", async () => {
    let resolveSession!: (value: unknown) => void;
    mocks.getSession.mockImplementationOnce(() => new Promise(resolve => { resolveSession = resolve; }));
    const { result, rerender } = renderHook(() => useAIAuthStatus(), { wrapper });
    mocks.auth = { userId: "second-admin", isAdmin: true };
    mocks.getSession.mockResolvedValue({
      data: { session: { user: { id: "admin" }, access_token: "old-token" } },
    });
    rerender();
    await act(async () => resolveSession({
      data: { session: { user: { id: "admin" }, access_token: "old-token" } },
    }));
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it("deduplicates overlapping focus, recovery and polling refreshes", async () => {
    vi.useFakeTimers();
    let resolveFetch!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { resolveFetch = resolve; }));
    const { result } = renderHook(() => useAIAuthStatus(), { wrapper });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event(AI_AUTH_INCIDENT_UPDATED_EVENT));
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => resolveFetch({
      ok: true, status: 200, json: async () => ({ authFailureIncident: incident }),
    } as Response));
    expect(result.current?.incident).toEqual(incident);
  });

  it("leaves only one live poll after StrictMode remounts effects", async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useAIAuthStatus(), {
      wrapper: ({ children }) => <StrictMode><AIAuthStatusProvider>{children}</AIAuthStatusProvider></StrictMode>,
    });
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(fetch).toHaveBeenCalledTimes(2);
    unmount();
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event(AI_AUTH_INCIDENT_UPDATED_EVENT));
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
