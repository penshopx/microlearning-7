// @vitest-environment happy-dom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCourse: vi.fn(), getProgress: vi.fn(), save: vi.fn(),
  reconcile: vi.fn(), upload: vi.fn(), signedUrl: vi.fn(),
  getReview: vi.fn(), rpc: vi.fn(),
}));
vi.mock("next/router", () => ({ useRouter: () => ({ query: { id: "course" } }) }));
vi.mock("next/head", () => ({ default: () => null }));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "participant" } }) }));
vi.mock("@/components/mission/MissionReviewPanel", () => ({ MissionReviewPanel: () => null }));
vi.mock("@/components/mission/ParticipantReviewStatus", () => ({ ParticipantReviewStatus: () => null }));
vi.mock("@/services/supervisorReviewService", () => ({
  supervisorReviewService: {
    getReview: mocks.getReview,
    getComments: async () => ({ data: [] }),
  },
}));
vi.mock("@/services/microLearningService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/microLearningService")>();
  return { ...actual, microLearningService: {
    getCourseWithModules: mocks.getCourse, getLearnerProgress: mocks.getProgress,
    updateProgress: mocks.save, reconcileEvidence: mocks.reconcile,
  } };
});
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mocks.rpc,
    auth: {
      getUser: async () => ({ data: { user: { id: "participant" } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    storage: { from: () => ({ upload: mocks.upload, createSignedUrl: mocks.signedUrl }) },
  },
}));
import CoursePage from "@/pages/course/[id]";
import { emptyMissionProgress, type MissionEvidenceUpload } from "@/lib/workplaceMission";

function proof(name: string): MissionEvidenceUpload {
  return { evidenceId: "evidence-1", fileName: name, mimeType: "image/png",
    sizeBytes: 20, storagePath: `participant/course/module/evidence-1/${name}`,
    uploadedAt: new Date().toISOString() };
}
function progress(revision: number, uploads: MissionEvidenceUpload[]) {
  return { id: "progress", module_id: "module", status: "in_progress",
    mission_revision: revision, mission_progress: { ...emptyMissionProgress(), evidenceUploads: uploads } };
}
const course = {
  id: "course", title: "Praktik aman", user_id: "author", modules: [{
    id: "module", title: "Praktik", duration_minutes: 10, quizzes: [],
    content: [{ content_type: "worksheet", content_data: {
      kind: "workplace-mission", version: 1, objective: "Praktik aman",
      learn: ["Periksa alat"], practice: ["Periksa kondisi"], evidence: ["Foto hasil"],
      scenario: "Alat siap", feedbackPrompt: "Apa hasilnya?", repeatAfterDays: 3,
    } }],
  }],
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCourse.mockResolvedValue({ data: course });
  mocks.getProgress.mockResolvedValue({ data: [progress(4, [])], error: null });
  mocks.reconcile.mockResolvedValue(true);
  mocks.getReview.mockResolvedValue({ data: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.signedUrl.mockResolvedValue({ data: { signedUrl: "https://example.test/proof" } });
});
afterEach(cleanup);

describe("participant evidence conflicts", () => {
  it("reloads another device's evidence instead of rolling back to the stale local snapshot", async () => {
    const { container } = render(<CoursePage />);
    await screen.findByText("Foto hasil");
    mocks.getProgress.mockResolvedValue({ data: [progress(5, [proof("other-device.png")])], error: null });
    mocks.save.mockResolvedValue({ data: null, error: { code: "40001" } });
    const input = await waitFor(() => {
      const element = container.querySelector('input[type="file"]');
      expect(element).not.toBeNull();
      return element!;
    });
    fireEvent.change(input, { target: { files: [new File(["proof"], "local.png", { type: "image/png" })] } });
    expect(await screen.findByText(/Progres berubah di tab atau perangkat lain/)).toBeInTheDocument();
    expect(await screen.findByText("other-device.png")).toBeInTheDocument();
    expect(screen.queryByText("local.png")).not.toBeInTheDocument();
    expect(mocks.save.mock.calls[0][2].expectedMissionRevision).toBe(4);
    await waitFor(() => expect(mocks.reconcile).toHaveBeenCalledWith(expect.stringContaining("local.png")));
  });
  it("keeps refreshed replacement evidence after a stale delete conflicts", async () => {
    mocks.getProgress.mockResolvedValue({ data: [progress(4, [proof("original.png")])], error: null });
    render(<CoursePage />);
    await screen.findByText("original.png");
    mocks.getProgress.mockResolvedValue({ data: [progress(5, [proof("replacement.png")])], error: null });
    mocks.save.mockResolvedValue({ data: null, error: { code: "40001" } });
    fireEvent.click(screen.getByRole("button", { name: /Hapus/ }));
    expect(await screen.findByText(/Progres berubah di tab atau perangkat lain/)).toBeInTheDocument();
    expect(await screen.findByText("replacement.png")).toBeInTheDocument();
    expect(screen.queryByText("original.png")).not.toBeInTheDocument();
  });
  it("advances the expected revision after successful saves in the same tab", async () => {
    const { container } = render(<CoursePage />);
    await screen.findByText("Foto hasil");
    mocks.save.mockImplementation(async (_course, _module, change) => ({
      data: { ...progress(5, []), mission_progress: change.missionProgress }, error: null,
    }));
    const input = await waitFor(() => {
      const element = container.querySelector('input[type="file"]');
      expect(element).not.toBeNull();
      return element!;
    });
    fireEvent.change(input, {
      target: { files: [new File(["proof"], "saved.png", { type: "image/png" })] },
    });
    await screen.findByText("Bukti praktik berhasil disimpan.");
    fireEvent.click(screen.getByRole("button", { name: /Hapus/ }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.calls[1][2].expectedMissionRevision).toBe(5);
  });
  it("replaces and resubmits requested evidence without reopening completion or awarding it again", async () => {
    const completed = { ...progress(9, [proof("original.png")]), status: "completed" };
    mocks.getProgress.mockResolvedValue({ data: [completed], error: null });
    mocks.getReview.mockResolvedValue({ data: {
      id: "review", review_status: "resubmission_requested",
      glow_feedback: "Baik", grow_feedback: "Foto belum jelas", next_steps: "Ganti foto",
    } });
    mocks.rpc.mockResolvedValue({ data: { id: "review", review_status: "pending" }, error: null });
    mocks.save.mockImplementation(async (_course, _module, change) => ({
      data: { ...completed, mission_revision: 10, mission_progress: change.missionProgress }, error: null,
    }));
    const { container } = render(<CoursePage />);
    await screen.findByText("original.png");
    const input = await waitFor(() => {
      const element = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(element).not.toBeNull();
      expect(element.disabled).toBe(false);
      return element;
    });
    fireEvent.change(input, {
      target: { files: [new File(["proof"], "retry.png", { type: "image/png" })] },
    });
    expect(await screen.findByText("Bukti diperbarui dan dikirim kembali untuk ditinjau.")).toBeInTheDocument();
    expect(mocks.save.mock.calls[0][2]).toMatchObject({
      status: "completed", expectedMissionRevision: 9, awardCompletion: false,
    });
    expect(mocks.rpc).toHaveBeenCalledWith("submit_mission_resubmission", { p_learner_progress_id: "progress" });
    expect(screen.getByText("retry.png")).toBeInTheDocument();
  });
});
