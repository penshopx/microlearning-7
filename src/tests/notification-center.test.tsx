// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NotificationCenter } from "@/components/NotificationCenter";
import type { AIAuthIncident } from "@/lib/ai-auth-incident";

const state = vi.hoisted(() => ({
  incident: null as AIAuthIncident | null,
  isAdmin: true,
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ userId: "test-user", isAdmin: state.isAdmin }),
}));
vi.mock("@/hooks/useAIAuthIncident", () => ({
  useAIAuthIncident: (_id: string, isAdmin: boolean) => isAdmin ? state.incident : null,
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
  state.incident = null;
  state.isAdmin = true;
});

describe("admin AI notification", () => {
  it("stays prominent and links to /admin even after marking everything read", () => {
    state.incident = { id: "incident", failureCount: 3, startedAt: 0, lastFailureAt: 1 };
    const { rerender } = render(<NotificationCenter />);
    expect(screen.getByRole("alert")).toHaveAttribute("href", "/admin");
    fireEvent.click(screen.getByRole("button", { name: /Notifikasi/ }));
    const notification = screen.getByText("Koneksi AI gagal berulang kali");
    expect(notification.closest("a")).toHaveAttribute("href", "/admin");
    fireEvent.click(screen.getByRole("button", { name: "Tandai Semua Dibaca" }));
    expect(screen.getByRole("button", { name: "Notifikasi, 1 belum dibaca" })).toBeVisible();
    expect(notification).toBeVisible();
    state.incident = null;
    rerender(<NotificationCenter />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Koneksi AI gagal berulang kali")).not.toBeInTheDocument();
  });

  it("does not show operational incidents to non-admin users", () => {
    state.isAdmin = false;
    state.incident = { id: "incident", failureCount: 3, startedAt: 0, lastFailureAt: 1 };
    render(<NotificationCenter />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
