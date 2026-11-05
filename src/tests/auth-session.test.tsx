// @vitest-environment happy-dom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/useAuth";
import { readReflectionDraft, writeReflectionDraft } from "@/lib/reflectionDraft";

const mocks = vi.hoisted(() => ({
  listener: null as null | ((event: string, session: unknown) => void),
  getSession: vi.fn(),
  profile: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: (callback: typeof mocks.listener) => {
        mocks.listener = callback;
        return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
      },
    },
    from: () => ({ select: () => ({ eq: (_: string, id: string) => ({ single: () => mocks.profile(id) }) }) }),
  },
}));
const session = (id: string) => ({ user: { id, email: `${id}@example.com` } });
function deferredProfile() {
  let resolve!: (value: { data: { role: string } }) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<{ data: { role: string } }>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.getSession.mockResolvedValue({ data: { session: null } });
  mocks.profile.mockResolvedValue({ data: { role: "user" } });
});
afterEach(cleanup);

it("preserves drafts on same-account refresh but removes them on account switch outside the course page", async () => {
  const scope = { accountId: "first", courseId: "course", moduleId: "module" };
  writeReflectionDraft(scope, "Private reflection");
  mocks.getSession.mockResolvedValue({ data: { session: session("first") } });
  const { result } = renderHook(() => useAuth());
  await waitFor(() => expect(result.current.userId).toBe("first"));
  expect(readReflectionDraft(scope)).toBe("Private reflection");
  act(() => mocks.listener?.("TOKEN_REFRESHED", session("first")));
  expect(readReflectionDraft(scope)).toBe("Private reflection");
  act(() => mocks.listener?.("SIGNED_IN", session("second")));
  expect(readReflectionDraft(scope)).toBeNull();
  const secondScope = { ...scope, accountId: "second" };
  writeReflectionDraft(secondScope, "Another reflection");
  act(() => mocks.listener?.("SIGNED_OUT", null));
  expect(readReflectionDraft(secondScope)).toBeNull();
});

it("ignores a late admin profile response after logout", async () => {
  let resolveProfile!: (value: unknown) => void;
  mocks.profile.mockImplementation(() => new Promise(resolve => { resolveProfile = resolve; }));
  mocks.getSession.mockResolvedValue({ data: { session: session("admin") } });
  const { result } = renderHook(() => useAuth());
  await waitFor(() => expect(mocks.profile).toHaveBeenCalledWith("admin"));
  act(() => mocks.listener?.("SIGNED_OUT", null));
  await act(async () => resolveProfile({ data: { role: "admin" } }));
  expect(result.current.isAdmin).toBe(false);
  expect(result.current.userId).toBeNull();
  expect(result.current.userName).toBe("");
});

it("clears admin status immediately when switching accounts", async () => {
  mocks.profile.mockResolvedValue({ data: { role: "admin" } });
  mocks.getSession.mockResolvedValue({ data: { session: session("admin") } });
  const { result } = renderHook(() => useAuth());
  await waitFor(() => expect(result.current.isAdmin).toBe(true));
  mocks.profile.mockReturnValue(new Promise(() => {}));
  act(() => mocks.listener?.("SIGNED_IN", session("member")));
  expect(result.current.userId).toBe("member");
  expect(result.current.isAdmin).toBe(false);
});

it.each(["old-first", "active-first"])(
  "keeps the participant role when account profiles complete %s",
  async order => {
    const oldProfile = deferredProfile();
    const activeProfile = deferredProfile();
    mocks.getSession.mockResolvedValue({ data: { session: session("admin") } });
    mocks.profile.mockResolvedValueOnce({ data: { role: "admin" } });
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isAdmin).toBe(true));

    // Leave a refresh for the old admin in flight before changing identity.
    mocks.profile.mockReturnValueOnce(oldProfile.promise);
    act(() => mocks.listener?.("TOKEN_REFRESHED", session("admin")));
    await waitFor(() => expect(mocks.profile).toHaveBeenCalledTimes(2));
    mocks.profile.mockReturnValueOnce(activeProfile.promise);
    act(() => mocks.listener?.("SIGNED_IN", session("member")));
    expect(result.current.userId).toBe("member");
    expect(result.current.isAdmin).toBe(false);
    await waitFor(() => expect(mocks.profile).toHaveBeenLastCalledWith("member"));

    const completions = order === "old-first"
      ? [() => oldProfile.resolve({ data: { role: "admin" } }),
         () => activeProfile.resolve({ data: { role: "user" } })]
      : [() => activeProfile.resolve({ data: { role: "user" } }),
         () => oldProfile.resolve({ data: { role: "admin" } })];
    for (const complete of completions) {
      await act(async () => complete());
      expect(result.current.userId).toBe("member");
      expect(result.current.userName).toBe("member");
      expect(result.current.isAdmin).toBe(false);
    }
  },
);

it("does not let a failed old profile revoke the active admin role", async () => {
  const oldProfile = deferredProfile();
  mocks.getSession.mockResolvedValue({ data: { session: session("member") } });
  mocks.profile.mockReturnValueOnce(oldProfile.promise);
  const { result } = renderHook(() => useAuth());
  await waitFor(() => expect(mocks.profile).toHaveBeenCalledWith("member"));
  mocks.profile.mockResolvedValueOnce({ data: { role: "admin" } });
  act(() => mocks.listener?.("SIGNED_IN", session("admin")));
  await waitFor(() => expect(result.current.isAdmin).toBe(true));
  await act(async () => oldProfile.reject(new Error("Profile request failed")));
  expect(result.current.userId).toBe("admin");
  expect(result.current.isAdmin).toBe(true);
});

it("does not restore an old startup session after a newer logout event", async () => {
  let resolveSession!: (value: unknown) => void;
  mocks.getSession.mockImplementation(() => new Promise(resolve => { resolveSession = resolve; }));
  const { result } = renderHook(() => useAuth());
  act(() => mocks.listener?.("SIGNED_OUT", null));
  await act(async () => resolveSession({ data: { session: session("old-account") } }));
  expect(result.current.isLoggedIn).toBe(false);
});
