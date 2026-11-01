// @vitest-environment happy-dom
import React, { type ReactNode } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AuthPage from "@/pages/auth";
import AuthCallback from "@/pages/auth/callback";
import ResetPasswordPage from "@/pages/auth/reset-password";

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
  getUser: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
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
      getUser: authState.getUser,
      updateUser: authState.updateUser,
    },
  },
  get isSupabaseConfigured() { return authState.isConfigured; },
}));
vi.mock("@/services/authService", () => ({
  authService: { signInWithGoogle: authState.signInWithOAuth, signOut: authState.signOut },
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
  authState.getUser.mockReset().mockResolvedValue({ data: { user: { id: "member" } }, error: null });
  authState.updateUser.mockReset().mockResolvedValue({ data: {}, error: null });
  authState.signOut.mockReset().mockResolvedValue({ error: null });
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
      "verification-code",
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

describe("password recovery", () => {
  it("sends recovery links to the callback with an explicit recovery destination", async () => {
    render(<AuthPage />);
    completeEmailForm("", "member@example.com", "");
    fireEvent.click(screen.getByRole("button", { name: "Lupa Password?" }));
    await waitFor(() => expect(authState.resetPasswordForEmail).toHaveBeenCalledWith(
      "member@example.com",
      { redirectTo: `${window.location.origin}/auth/callback?next=recovery` },
    ));
  });

  it("routes a recovered session to the password form, not the home page", async () => {
    window.history.replaceState({}, "", "/auth/callback?code=recovery-code&next=recovery");
    render(<AuthCallback />);
    await waitFor(() => expect(authState.replace).toHaveBeenCalledWith("/auth/reset-password"));
  });

  it("rejects provider callback errors even when another session exists", async () => {
    window.history.replaceState({}, "", "/auth/callback?error=access_denied");
    authState.getSession.mockResolvedValue({ data: { session: { user: { id: "existing" } } }, error: null });
    render(<AuthCallback />);
    expect(await screen.findByText(/Tautan verifikasi tidak valid/)).toBeVisible();
    expect(authState.replace).not.toHaveBeenCalled();
  });

  it("requires a verified session before showing the reset form", async () => {
    authState.getUser.mockResolvedValue({ data: { user: null }, error: new Error("expired") });
    render(<ResetPasswordPage />);
    expect(await screen.findByText(/Tautan pemulihan tidak valid/)).toBeVisible();
    expect(screen.queryByLabelText("Kata sandi baru")).not.toBeInTheDocument();
  });

  it("rejects mismatched passwords without changing the account", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(await screen.findByLabelText("Kata sandi baru"), { target: { value: "new-password" } });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi"), { target: { value: "different-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan kata sandi" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("tidak cocok");
    expect(authState.updateUser).not.toHaveBeenCalled();
  });

  it("updates the password and closes the current session", async () => {
    render(<ResetPasswordPage />);
    fireEvent.change(await screen.findByLabelText("Kata sandi baru"), { target: { value: "new-password" } });
    fireEvent.change(screen.getByLabelText("Konfirmasi kata sandi"), { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan kata sandi" }));
    expect(await screen.findByText("Kata sandi berhasil diperbarui.")).toBeVisible();
    expect(authState.updateUser).toHaveBeenCalledWith({ password: "new-password" });
    expect(authState.signOut).toHaveBeenCalledOnce();
  });
});
