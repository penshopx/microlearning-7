import { describe, expect, it, vi } from "vitest";
import { handleCleanupRequest, runCleanup } from "../../supabase/functions/mission-evidence-cleanup/worker";

function fixture() {
  const rpc = vi.fn().mockResolvedValueOnce({
    data: [{ storage_path: "private/evidence" }], error: null,
  }).mockResolvedValueOnce({
    data: { attempted: 1, deleted: 1, remaining: 0, storage_path: "private/evidence" }, error: null,
  });
  const remove = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn(() => ({ remove }));
  return { client: { rpc, storage: { from } }, rpc, remove, from };
}
describe("trusted scheduled cleanup", () => {
  it("deletes only claimed paths and returns aggregates only", async () => {
    const f = fixture();
    expect(await runCleanup(f.client, "lease")).toEqual({ attempted: 1, deleted: 1, remaining: 0 });
    expect(f.from).toHaveBeenCalledWith("mission-evidence");
    expect(f.remove).toHaveBeenCalledExactlyOnceWith(["private/evidence"]);
    expect(f.rpc).toHaveBeenLastCalledWith("finish_mission_cleanup_batch", {
      p_lease_id: "lease", p_paths: ["private/evidence"],
    });
  });
  it.each(["returned", "thrown"])("reconciles %s Storage failures instead of trusting the HTTP result", async kind => {
    const f = fixture();
    if (kind === "returned") f.remove.mockResolvedValue({ error: { message: "private/evidence" } });
    else f.remove.mockRejectedValue(new Error("private/evidence"));
    expect(await runCleanup(f.client, "lease")).toEqual({ attempted: 1, deleted: 1, remaining: 0 });
  });
  it("does not delete or release another invocation's lease on an empty claim", async () => {
    const f = fixture();
    f.rpc.mockReset().mockResolvedValue({ data: [], error: null });
    expect(await runCleanup(f.client, "lease")).toEqual({ attempted: 0, deleted: 0, remaining: 0 });
    expect(f.remove).not.toHaveBeenCalled();
    expect(f.rpc).toHaveBeenCalledTimes(1);
  });
  it("rejects oversized batches before touching Storage", async () => {
    const f = fixture();
    f.rpc.mockReset().mockResolvedValue({ data: Array(101).fill({ storage_path: "private/path" }), error: null });
    await expect(runCleanup(f.client, "lease")).rejects.toThrow("Cleanup unavailable");
    expect(f.remove).not.toHaveBeenCalled();
  });
  it("fails closed when the completion report is lost, leaving durable recovery to SQL", async () => {
    const f = fixture();
    f.rpc.mockReset().mockResolvedValueOnce({
      data: [{ storage_path: "private/path" }], error: null,
    }).mockResolvedValueOnce({ data: null, error: { message: "private/path" } });
    await expect(runCleanup(f.client, "lease")).rejects.toThrow("Cleanup unavailable");
  });
  it("requires service credentials, not a participant JWT, before running", async () => {
    const run = vi.fn();
    for (const token of ["", "participant-jwt"]) {
      const res = await handleCleanupRequest(new Request("https://worker", {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      }), "test-service-key", run);
      expect(res.status).toBe(401);
    }
    expect(run).not.toHaveBeenCalled();
  });
  it("returns a safe retryable response for unfinished cleanup without leaking errors", async () => {
    const req = () => new Request("https://worker", {
      method: "POST", headers: { Authorization: "Bearer test-service-key" },
    });
    const run = vi.fn().mockResolvedValue({ attempted: 1, deleted: 0, remaining: 1 });
    const res = await handleCleanupRequest(req(), "test-service-key", run);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ attempted: 1, deleted: 0, remaining: 1 });
    run.mockRejectedValue(new Error("private/path"));
    const failed = await handleCleanupRequest(req(), "test-service-key", run);
    expect(await failed.text()).toBe('{"error":"Cleanup unavailable"}');
    expect(failed.headers.get("Cache-Control")).toBe("no-store");
  });
});
