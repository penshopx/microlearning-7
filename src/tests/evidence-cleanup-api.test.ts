import type { NextApiRequest, NextApiResponse } from "next";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser }, rpc: mocks.rpc }),
}));
import handler from "@/pages/api/admin/evidence-cleanup";

const status = {
  pendingCount: 3, overdueCount: 1, repeatedFailureCount: 1,
  oldestPendingAt: "2026-11-01T00:00:00Z", checkedAt: "2026-11-02T00:00:00Z",
};
const request = (token = true, method = "GET") => ({
  method, headers: { authorization: token ? "Bearer test" : undefined },
}) as NextApiRequest;
function response() {
  const res = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as NextApiResponse;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null });
  mocks.rpc.mockResolvedValue({ data: status, error: null });
});
describe("cleanup admin endpoint", () => {
  it("requires a verified token before querying metadata", async () => {
    const res = response();
    await handler(request(false), res);
    expect(res.status).toHaveBeenLastCalledWith(401);
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: {} });
    await handler(request(), res);
    expect(res.status).toHaveBeenLastCalledWith(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("honors database admin denial for ordinary authenticated users", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "private" } });
    const res = response();
    await handler(request(), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
  });
  it("returns only aggregate metadata and disables caching", async () => {
    mocks.rpc.mockResolvedValue({ data: { ...status, storage_path: "private/path", content: "secret" }, error: null });
    const res = response();
    await handler(request(), res);
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("get_mission_cleanup_health");
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.json).toHaveBeenCalledWith(status);
  });
  it.each(["rpc", "network"])("fails explicitly and safely on %s failure", async kind => {
    if (kind === "rpc") mocks.rpc.mockResolvedValue({ data: null, error: { message: "private/path" } });
    else mocks.rpc.mockRejectedValue(new Error("private/path"));
    const res = response();
    await handler(request(), res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: "Status pembersihan tidak tersedia" });
  });
  it("rejects writes", async () => {
    const res = response();
    await handler(request(true, "POST"), res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
