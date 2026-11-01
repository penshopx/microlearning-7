// @vitest-environment happy-dom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAIAuthIncident, useAIAuthStatus } from "@/hooks/useAIAuthIncident";
import { AI_AUTH_INCIDENT_UPDATED_EVENT } from "@/lib/ai-auth-incident";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "test-token" } } }) } },
}));
const incident = { id: "test-incident", failureCount: 3, startedAt: 1, lastFailureAt: 2 };
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true, status: 200, json: async () => ({ authFailureIncident: incident }),
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("admin incident refresh", () => {
  it("keeps the last known incident but explicitly marks failed reads as unavailable", async () => {
    const { result } = renderHook(() => useAIAuthStatus("admin", true));
    await waitFor(() => expect(result.current?.status).toBe("available"));
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    expect(result.current).toMatchObject({ status: "unavailable", incident });
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    expect(result.current).toMatchObject({ status: "available", incident });
  });

  it("never polls for non-admins and clears state when the account changes", async () => {
    const { result, rerender } = renderHook(
      ({ userId, isAdmin }) => useAIAuthIncident(userId, isAdmin),
      { initialProps: { userId: "admin", isAdmin: false } },
    );
    expect(fetch).not.toHaveBeenCalled();
    rerender({ userId: "admin", isAdmin: true });
    await waitFor(() => expect(result.current).toEqual(incident));
    expect(fetch).toHaveBeenCalledWith("/api/admin/ai-status", expect.objectContaining({
      headers: { Authorization: "Bearer test-token" }, cache: "no-store",
    }));
    rerender({ userId: "other-user", isAdmin: false });
    expect(result.current).toBeNull();
  });

  it("refreshes on recovery events and drops the cleared incident", async () => {
    const { result } = renderHook(() => useAIAuthIncident("admin", true));
    await waitFor(() => expect(result.current).toEqual(incident));
    vi.mocked(fetch).mockResolvedValue({
      ok: true, status: 200, json: async () => ({ authFailureIncident: null }),
    } as Response);
    act(() => window.dispatchEvent(new Event(AI_AUTH_INCIDENT_UPDATED_EVENT)));
    await waitFor(() => expect(result.current).toBeNull());
  });

  it("polls every 30 seconds without calling provider health", async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useAIAuthIncident("admin", true));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(fetch).toHaveBeenCalledTimes(2);
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("keeps a known alert on network failure, but hides it when access is revoked", async () => {
    const { result } = renderHook(() => useAIAuthIncident("admin", true));
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
});
