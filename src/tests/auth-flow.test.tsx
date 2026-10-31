// @vitest-environment happy-dom
import React, { type ReactNode } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthPage from "@/pages/auth";
import AuthCallback from "@/pages/auth/callback";

const authState = vi.hoisted(() => ({
  query: {} as Record<string, string>,
  replace: vi.fn(),
  push: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  getSession: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  setSession: vi.fn(),
  signInWithOAuth: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  isConfigured: true,
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: authState.query,
    push: authState.push,
    replace: authState.replace,
  }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: authState.signInWithPassword,
      signUp: authState.signUp,
      getSession: authState.getSession,
      exchangeCodeForSession: authState.exchangeCodeForSession,
      setSession: authState.setSession,
      resetPasswordForEmail: authState.resetPasswordForEmail,
    },
  },
  get isSupabaseConfigured() { return authState.isConfigured; },
}));
vi.mock("@/services/authService", () => ({
  authService: { signInWithGoogle: authState.signInWithOAuth },
}));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/components/ChaesaLogo", () => ({ ChaesaLogo: () => <span>logo</span> }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

beforeEach(() => {
  authState.query = {};
  authState.replace.mockReset();
  authState.push.mockReset();
  authState.signInWithPassword.mockReset().mockResolvedValue({
    data: { session: { access_token: "session-token" } }, error: null,
  });
  authState.signUp.mockReset().mockResolvedValue({
    data: { user: { id: "user" }, session: null }, error: null,
  });
  authState.getSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
  authState.exchangeCodeForSession.mockReset().mockImplementation(async () => {
    authState.getSession.mockResolvedValue({
      data: { session: { access_token: "session-token" } }, error: null,
    });
    return {
      data: { session: { access_token: "session-token" } }, error: null,
    };
  });
  authState.setSession.mockReset().mockResolvedValue({ error: null });
  authState.signInWithOAuth.mockReset().mockResolvedValue({ error: null });
  authState.resetPasswordForEmail.mockReset().mockResolvedValue({ error: null });
  authState.isConfigured = true;
});
afterEach(() => cleanup());

function completeEmailForm(name: string, email: string, password: string) {
  if (name) fireEvent.change(screen.getByLabelText("Nama Lengkap"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
}

describe("email login and registration", () => {
  it("normalizes email and routes successful sign-in to the app", async () => {
    render(<AuthPage />);
    await waitFor(() => expect(authState.getSession).toHaveBeenCalled());
    completeEmailForm("", "  MEMBER@Example.com ", "secret-pass");
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    await waitFor(() => expect(authState.signInWithPassword).toHaveBeenCalledWith({
      email: "member@example.com", password: "secret-pass",
    }));
    await waitFor(() => expect(authState.replace).toHaveBeenCalledWith("/"));
  });

  it("shows an actionable credential error instead of raw provider text", async () => {
    authState.signInWithPassword.mockResolvedValue({
      data: { session: null }, error: new Error("Invalid login credentials"),
    });
    render(<AuthPage />);
    completeEmailForm("", "member@example.com", "wrong-pass");
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(await screen.findByText("Email atau kata sandi salah. Periksa kembali lalu coba lagi.")).toBeVisible();
    expect(authState.replace).not.toHaveBeenCalled();
  });

  it("blocks invalid email without calling the authentication service", async () => {
    render(<AuthPage />);
    completeEmailForm("", "not-an-email", "secret-pass");
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(await screen.findByText("Format email tidak valid")).toBeVisible();
    expect(authState.signInWithPassword).not.toHaveBeenCalled();
  });

  it("registers with a confirmation callback and clearly explains email verification", async () => {
    authState.query = { mode: "register" };
    render(<AuthPage />);
    completeEmailForm("  Alex Rivera  ", "  NEW@Example.com  ", "new-pass");
    fireEvent.click(screen.getByRole("button", { name: "Daftar Gratis" }));
    await waitFor(() => expect(authState.signUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "new-pass",
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: "Alex Rivera" },
      },
    }));
    expect(await screen.findByText(/verifikasi akun sebelum masuk/)).toBeVisible();
  });

  it("never pretends authentication succeeded when Supabase is not configured", async () => {
    authState.isConfigured = false;
    render(<AuthPage />);
    completeEmailForm("", "member@example.com", "secret-pass");
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));
    expect(await screen.findByText(
      "Login belum siap karena konfigurasi Supabase belum tersedia. Hubungi administrator aplikasi.",
    )).toBeVisible();
    expect(authState.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("email confirmation callback", () => {
  it("exchanges the verification code for a session before redirecting", async () => {
    window.history.replaceState({}, "", "/auth/callback?code=verification-code");
    render(<AuthCallback />);
    await waitFor(() => expect(authState.exchangeCodeForSession).toHaveBeenCalledWith(
      expect.stringContaining("code=verification-code"),
    ));
    expect(await screen.findByText("Login berhasil! Mengalihkan...")).toBeVisible();
    await waitFor(
      () => expect(authState.replace).toHaveBeenCalledWith("/"),
      { timeout: 2500 },
    );
  });

  it("reports expired or invalid verification links and keeps a manual login path", async () => {
    window.history.replaceState({}, "", "/auth/callback");
    authState.getSession.mockResolvedValue({ data: { session: null }, error: null });
    render(<AuthCallback />);
    expect(await screen.findByText(/Tautan verifikasi tidak valid atau sudah kedaluwarsa/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Kembali ke login" })).toHaveAttribute("href", "/auth");
  });
});
