import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  createSignedUrl: vi.fn(),
  storageFrom: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mocks.rpc, storage: { from: mocks.storageFrom } },
}));
import { missionReviewService } from "@/services/missionReviewService";

describe("mission review service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storageFrom.mockReturnValue({ createSignedUrl: mocks.createSignedUrl });
  });
  it("reads the scoped inbox through its authenticated RPC", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    expect(await missionReviewService.getSubmissions("course")).toEqual({ data: [], error: null });
    expect(mocks.rpc).toHaveBeenCalledWith("get_mission_review_submissions", { p_course_id: "course" });
  });
  it("never sends client-supplied reviewer identity or timestamps", async () => {
    await missionReviewService.reviewSubmission("progress", "approved", "Good practice");
    expect(mocks.rpc).toHaveBeenCalledWith("review_mission_evidence", {
      p_progress_id: "progress", p_status: "approved", p_feedback: "Good practice",
    });
  });
  it("requires actionable feedback for retries and bounds feedback length", async () => {
    expect((await missionReviewService.reviewSubmission("progress", "retry_requested", "  ")).error).toBeTruthy();
    expect((await missionReviewService.reviewSubmission("progress", "approved", "x".repeat(1001))).error).toBeTruthy();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("uses a dedicated retry operation, not a generic participant update", async () => {
    await missionReviewService.restartPractice("progress");
    expect(mocks.rpc).toHaveBeenCalledWith("restart_mission_practice", { p_progress_id: "progress" });
  });
  it("creates a short-lived private URL only when requested", async () => {
    mocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://example.test/proof" }, error: null });
    expect(await missionReviewService.openEvidence("owner/course/module/photo/proof.png")).toBe("https://example.test/proof");
    expect(mocks.storageFrom).toHaveBeenCalledWith("mission-evidence");
    expect(mocks.createSignedUrl).toHaveBeenCalledWith("owner/course/module/photo/proof.png", 60);
  });
  it("reports evidence access denial instead of providing a fallback URL", async () => {
    mocks.createSignedUrl.mockResolvedValue({ data: null, error: new Error("Access denied") });
    await expect(missionReviewService.openEvidence("someone-elses/proof")).rejects.toThrow("Access denied");
  });
});
