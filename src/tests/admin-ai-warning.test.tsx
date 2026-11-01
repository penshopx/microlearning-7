// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminAIWarning } from "@/components/AdminAIWarning";

const auth = vi.hoisted(() => ({ userId: "admin", isAdmin: true }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => auth }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: async () => ({
    data: { session: { access_token: "test-token" } },
  }) } },
}));

beforeEach(() => {
  auth.userId = "admin";
  auth.isAdmin = true;
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: false, status: 503, json: vi.fn(),
  }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
async function settle() {
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
}
function healthy(incident: object | null = null, hasKey = true) {
  return { ok: true, status: 200, json: async () => ({ hasKey, authFailureIncident: incident }) } as Response;
}

describe("admin incident storage warning", () => {
  it("warns on an initial server failure and clears after automatic polling recovery", async () => {
    render(<AdminAIWarning />);
    await settle();
    expect(screen.getByRole("alert")).toHaveTextContent("Status insiden AI tidak tersedia");
    expect(screen.getByRole("alert")).toHaveTextContent("Belum dapat dipastikan");
    expect(screen.queryByText("Kunci AI belum dikonfigurasi")).not.toBeInTheDocument();
    vi.mocked(fetch).mockResolvedValue(healthy());
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("warns on network failure and recovers on focus", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("private provider response"));
    render(<AdminAIWarning />);
    await settle();
    expect(screen.getByRole("alert")).not.toHaveTextContent("private");
    vi.mocked(fetch).mockResolvedValue(healthy());
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([401, 403])("clears the warning when the server denies access (%i)", async status => {
    render(<AdminAIWarning />);
    await settle();
    vi.mocked(fetch).mockResolvedValue({ ok: false, status } as Response);
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not request or display operational status for non-admins", async () => {
    auth.isAdmin = false;
    render(<AdminAIWarning />);
    await settle();
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears on account changes and ignores late results from the old account", async () => {
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const { rerender } = render(<AdminAIWarning />);
    await settle();
    auth.userId = "learner";
    auth.isAdmin = false;
    rerender(<AdminAIWarning />);
    await act(async () => { finish({ ok: false, status: 503 } as Response); });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("preserves the missing-key warning after storage recovers", async () => {
    render(<AdminAIWarning />);
    await settle();
    vi.mocked(fetch).mockResolvedValue(healthy(null, false));
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(screen.getByRole("alert")).toHaveTextContent("Kunci AI belum dikonfigurasi");
    expect(screen.queryByText("Status insiden AI tidak tersedia")).not.toBeInTheDocument();
  });
});
