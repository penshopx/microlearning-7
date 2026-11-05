// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdminAIWarning } from "@/components/AdminAIWarning";
import { NotificationCenter } from "@/components/NotificationCenter";

const mocks = vi.hoisted(() => ({
  listeners: new Set<(event: string, session: unknown) => void>(),
  getSession: vi.fn(),
  profile: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        mocks.listeners.add(callback);
        return { data: { subscription: { unsubscribe: () => mocks.listeners.delete(callback) } } };
      },
    },
    from: () => ({
      select: () => ({
        eq: (_: string, id: string) => ({ single: () => mocks.profile(id) }),
      }),
    }),
  },
}));

const session = (id: string) => ({
  user: { id, email: `${id}@example.com` },
  access_token: "test-token",
});
function emit(event: string, id: string) {
  mocks.listeners.forEach(listener => listener(event, session(id)));
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.getSession.mockResolvedValue({ data: { session: session("admin") } });
  mocks.profile.mockResolvedValue({ data: { role: "admin" } });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      hasKey: false,
      authFailureIncident: { id: "incident", failureCount: 3, startedAt: 0, lastFailureAt: 1 },
    }),
  }));
});
afterEach(() => {
  cleanup();
  mocks.listeners.clear();
  vi.unstubAllGlobals();
});

it("removes both admin surfaces during a participant's delayed profile and ignores old admin results", async () => {
  render(<><AdminAIWarning /><NotificationCenter /></>);
  await waitFor(() => {
    expect(screen.getByText("Kunci AI belum dikonfigurasi")).toBeVisible();
    expect(screen.getByText("Gangguan AI")).toBeVisible();
  });
  fireEvent.click(screen.getByRole("button", { name: /Notifikasi/ }));
  expect(screen.getByText("Koneksi AI gagal berulang kali")).toBeVisible();
  const initialFetches = vi.mocked(fetch).mock.calls.length;

  let finishOldProfile!: (value: { data: { role: string } }) => void;
  const oldProfile = new Promise(resolve => { finishOldProfile = resolve; });
  let finishMemberProfile!: (value: { data: { role: string } }) => void;
  const memberProfile = new Promise(resolve => { finishMemberProfile = resolve; });
  mocks.profile.mockImplementation((id: string) => id === "admin" ? oldProfile : memberProfile);
  act(() => emit("TOKEN_REFRESHED", "admin"));
  await waitFor(() => expect(mocks.profile).toHaveBeenCalledTimes(4));
  act(() => emit("SIGNED_IN", "member"));

  const expectNoAdminUI = () => {
    expect(screen.queryByText("Kunci AI belum dikonfigurasi")).not.toBeInTheDocument();
    expect(screen.queryByText("Gangguan AI")).not.toBeInTheDocument();
    expect(screen.queryByText("Koneksi AI gagal berulang kali")).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/admin"]')).toBeNull();
  };
  expectNoAdminUI();
  await waitFor(() => expect(mocks.profile).toHaveBeenCalledTimes(6));
  await act(async () => finishMemberProfile({ data: { role: "user" } }));
  await act(async () => finishOldProfile({ data: { role: "admin" } }));
  expectNoAdminUI();
  act(() => window.dispatchEvent(new Event("focus")));
  expect(fetch).toHaveBeenCalledTimes(initialFetches);
});
