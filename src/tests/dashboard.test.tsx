// @vitest-environment happy-dom

import React, { type MouseEvent, type ReactNode } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/pages/dashboard";

const testState = vi.hoisted(() => ({
  auth: {
    user: { id: "test-user" },
    isLoggedIn: true,
    isLoading: false,
    userName: "Test User",
    userId: "test-user",
    isGuest: false,
    isAdmin: false,
  },
  push: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => testState.auth,
  getUserStorageKey: (userId: string | null, key: string) =>
    `test_${userId ?? "guest"}_${key}`,
}));

vi.mock("@/components/SEO", () => ({
  SEO: () => null,
}));

vi.mock("@/components/PageHeader", () => ({
  PageHeader: ({ title }: { title: string }) => <header>{title}</header>,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: {
    href: string;
    children: ReactNode;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
        testState.push(href);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  testState.auth.isAdmin = false;
  testState.push.mockClear();
});

describe("Dashboard admin navigation", () => {
  it("does not show the admin link for a non-admin session", async () => {
    render(<DashboardPage />);

    await screen.findByRole("heading", { name: "Lanjutkan Belajar" });

    expect(document.querySelector('a[href="/admin"]')).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Admin\b/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the admin link and navigates to /admin for an admin session", async () => {
    testState.auth.isAdmin = true;
    render(<DashboardPage />);

    const adminLink = await screen.findByRole("link", { name: /^Admin\b/i });

    expect(adminLink).toBeVisible();
    expect(adminLink).toHaveAttribute("href", "/admin");

    fireEvent.click(adminLink);

    expect(testState.push).toHaveBeenCalledOnce();
    expect(testState.push).toHaveBeenCalledWith("/admin");
  });
});