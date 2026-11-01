import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyMissionProgress } from "@/lib/workplaceMission";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  remove: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
    storage: { from: () => ({ remove: mocks.remove }) },
  },
}));
import { microLearningService } from "@/services/microLearningService";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "participant" } } });
});

describe("versioned mission progress", () => {
  it("sends the server revision and never falls back to a blind JSON upsert", async () => {
    const missionProgress = emptyMissionProgress();
    mocks.rpc.mockResolvedValue({ data: { mission_revision: 8 }, error: null });
    await microLearningService.updateProgress("course", "module", {
      status: "in_progress", missionProgress, expectedMissionRevision: 7,
    });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("save_mission_progress", {
      p_course_id: "course", p_module_id: "module", p_status: "in_progress",
      p_progress_percentage: null, p_mission_progress: missionProgress, p_expected_revision: 7,
    });
  });
  it("fails closed without a revision and does not award failed completion", async () => {
    const error = { code: "40001", message: "Mission changed" };
    mocks.rpc.mockResolvedValue({ data: null, error });
    expect((await microLearningService.updateProgress("course", "module", {
      status: "completed", missionProgress: emptyMissionProgress(),
    })).error).toEqual(error);
    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.rpc.mock.calls[0][1].p_expected_revision).toBeNull();
  });
  it("leaves non-mission updates on the existing RPC", async () => {
    mocks.rpc.mockResolvedValue({ data: {}, error: null });
    await microLearningService.updateProgress("course", "module", {
      status: "in_progress", timeSpentSeconds: 20,
    });
    expect(mocks.rpc.mock.calls[0][0]).toBe("upsert_learner_progress_atomic");
    expect(mocks.rpc.mock.calls[0][1].p_mission_progress).toBeNull();
  });
  it("sends omitted mission metadata as null for completed time-only updates", async () => {
    mocks.rpc.mockResolvedValue({ data: {}, error: null });
    await microLearningService.updateProgress("course", "module", {
      status: "completed", timeSpentSeconds: 45, awardCompletion: false,
    });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("upsert_learner_progress_atomic", {
      p_course_id: "course",
      p_module_id: "module",
      p_status: "completed",
      p_progress_percentage: null,
      p_time_spent_seconds: 45,
      p_last_position_seconds: null,
      p_quiz_score: null,
      p_mission_progress: null,
    });
  });
  it("does not award completion again for a requested evidence resubmission", async () => {
    mocks.rpc.mockResolvedValue({ data: { mission_revision: 10 }, error: null });
    await microLearningService.updateProgress("course", "module", {
      status: "completed", missionProgress: emptyMissionProgress(),
      expectedMissionRevision: 9, awardCompletion: false,
    });
    expect(mocks.rpc).toHaveBeenCalledOnce();
    expect(mocks.rpc.mock.calls[0][0]).toBe("save_mission_progress");
  });
});

describe("Storage reconciliation", () => {
  it("only deletes paths confirmed as garbage by the server", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ storage_path: "retired" }], error: null });
    mocks.remove.mockResolvedValue({ error: null });
    expect(await microLearningService.reconcileEvidence("uncertain-upload")).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("reconcile_mission_evidence", {
      p_abandon_path: "uncertain-upload",
    });
    expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(["retired"]);
  });
  it("never deletes an attached path when a successful save response was lost", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    expect(await microLearningService.reconcileEvidence("attached")).toBe(true);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("reports cleanup failure so the durable queue can be retried", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ storage_path: "retired" }], error: null });
    mocks.remove.mockResolvedValue({ error: new Error("offline") });
    expect(await microLearningService.reconcileEvidence()).toBe(false);
    expect(mocks.rpc).toHaveBeenLastCalledWith("record_mission_cleanup_failure", { p_paths: ["retired"] });
  });
  it("records thrown network failures without forwarding error text", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ storage_path: "retired" }], error: null })
      .mockRejectedValueOnce(new Error("reporting unavailable"));
    mocks.remove.mockRejectedValueOnce(new Error("private Storage body"));
    expect(await microLearningService.reconcileEvidence()).toBe(false);
    expect(mocks.rpc).toHaveBeenLastCalledWith("record_mission_cleanup_failure", { p_paths: ["retired"] });
  });
  it("does not attempt deletion when reconciliation fails", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: new Error("offline") });
    expect(await microLearningService.reconcileEvidence("uncertain")).toBe(false);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
