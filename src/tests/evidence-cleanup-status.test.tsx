// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EvidenceCleanupStatus } from "@/components/admin/EvidenceCleanupStatus";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "test" } } }) } },
}));
const healthy = {
  pendingCount: 1, overdueCount: 0, repeatedFailureCount: 0,
  oldestPendingAt: "2026-11-01T00:00:00Z", checkedAt: "2026-11-01T01:00:00Z",
};
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => healthy }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("does not warn about a fresh queue and shows recovery after refresh", async () => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true, json: async () => ({ ...healthy, overdueCount: 1, repeatedFailureCount: 1 }),
  } as Response);
  render(<EvidenceCleanupStatus />);
  await screen.findByText("Pembersihan bukti perlu diperiksa");
  fireEvent.click(screen.getByRole("button", { name: "Periksa kembali" }));
  await screen.findByText("Tidak ada peringatan pembersihan");
  expect(screen.queryByRole("alert")).toBeNull();
  expect(fetch).toHaveBeenCalledWith("/api/admin/evidence-cleanup", expect.objectContaining({ cache: "no-store" }));
});
it("does not represent an unavailable status as healthy", async () => {
  vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
  render(<EvidenceCleanupStatus />);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Status tidak tersedia"));
  expect(screen.queryByText("Tidak ada peringatan pembersihan")).toBeNull();
});
