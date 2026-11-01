// @vitest-environment happy-dom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCourse: vi.fn(), getProgress: vi.fn(), save: vi.fn(),
  reconcile: vi.fn(), upload: vi.fn(), signedUrl: vi.fn(),
  getReview: vi.fn(), rpc: vi.fn(), getUser: vi.fn(),
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
      getUser: mocks.getUser,
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
function progress(revision: number, uploads: MissionEvidenceUpload[], feedback = "") {
  return { id: "progress", module_id: "module", status: "in_progress",
    mission_revision: revision, mission_progress: { ...emptyMissionProgress(), evidenceUploads: uploads, feedback } };
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
async function waitForAuthenticatedCourse() {
  // Auth triggers a second load that unmounts the first form and invalidates
  // in-flight saves. Wait for that load to start AND its form to be committed.
  await waitFor(() => expect(mocks.getCourse).toHaveBeenCalledTimes(2));
  return screen.findByRole("textbox", { name: "Catatan refleksi" });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "participant" } } });
  mocks.getCourse.mockResolvedValue({ data: course });
  mocks.getProgress.mockResolvedValue({ data: [progress(4, [])], error: null });
  mocks.reconcile.mockResolvedValue(true);
  mocks.getReview.mockResolvedValue({ data: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.signedUrl.mockResolvedValue({ data: { signedUrl: "https://example.test/proof" } });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("participant evidence conflicts", () => {
  it("waits for authentication and the committed reload before interacting with evidence", async () => {
    const auth = deferred<{ data: { user: { id: string } } }>();
    const reload = deferred<{ data: ReturnType<typeof progress>[]; error: null }>();
    mocks.getUser.mockReturnValueOnce(auth.promise);
    mocks.getProgress
      .mockResolvedValueOnce({ data: [progress(4, [])], error: null })
      .mockReturnValueOnce(reload.promise);
    mocks.save.mockImplementation(async (_course, _module, change) => ({
      data: { ...progress(8, []), mission_progress: change.missionProgress }, error: null,
    }));
    const { container } = render(<CoursePage />);
    await screen.findByText("Foto hasil");
    const anonymousInput = container.querySelector('input[type="file"]')!;
    expect(anonymousInput).toBeInTheDocument();

    let ready = false;
    const initialized = waitForAuthenticatedCourse().then(() => { ready = true; });
    await act(async () => {});
    expect(ready).toBe(false);

    await act(async () => { auth.resolve({ data: { user: { id: "participant" } } }); });
    expect(mocks.getCourse).toHaveBeenCalledTimes(2);
    expect(anonymousInput).not.toBeInTheDocument();
    expect(ready).toBe(false);

    await act(async () => { reload.resolve({ data: [progress(7, [])], error: null }); });
    await initialized;
    const input = container.querySelector('input[type="file"]')!;
    expect(input).not.toBe(anonymousInput);
    fireEvent.change(input, {
      target: { files: [new File(["proof"], "authenticated.png", { type: "image/png" })] },
    });
    await screen.findByText("Bukti praktik berhasil disimpan.");
    expect(mocks.save).toHaveBeenCalledTimes(1);
    expect(mocks.save.mock.calls[0][2].expectedMissionRevision).toBe(7);
    await waitFor(() => expect(container.querySelector('input[type="file"]')).toBeEnabled());
  });

  it("compares, copies, edits and deliberately resaves only reflection with the newest evidence and revision", async () => {
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    const server = progress(5, [proof("newest.png")], "Refleksi dari perangkat lain");
    server.mission_progress.checkedPracticeIds = ["server-check"];
    server.mission_progress.selectedDecision = "Keputusan server";
    mocks.getProgress.mockResolvedValue({ data: [server], error: null });
    mocks.save.mockResolvedValueOnce({ data: null, error: { code: "40001" } });
    fireEvent.change(editor, { target: { value: "Refleksi lokal belum tersimpan" } });
    fireEvent.blur(editor);
    expect(await screen.findByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Refleksi lokal belum tersimpan");
    expect(screen.getByRole("textbox", { name: "Refleksi versi server" })).toHaveValue(server.mission_progress.feedback);
    expect(editor).toHaveValue(server.mission_progress.feedback);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    fireEvent.click(screen.getByRole("button", { name: "Salin draf lokal" }));
    await screen.findByText("Draf refleksi disalin.");
    expect(writeText).toHaveBeenCalledWith("Refleksi lokal belum tersimpan");
    fireEvent.click(screen.getByRole("button", { name: "Pulihkan draf ke editor" }));
    expect(editor).toHaveValue("Refleksi lokal belum tersimpan");
    fireEvent.change(editor, { target: { value: "Refleksi lokal hasil perbandingan" } });
    fireEvent.blur(editor);
    expect(mocks.save).toHaveBeenCalledTimes(1);
    mocks.save.mockImplementation(async (_course, _module, change) => ({
      data: { ...server, mission_revision: 6, mission_progress: change.missionProgress }, error: null,
    }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan ulang refleksi" }));
    await screen.findByText("Refleksi disimpan ulang. Bukti terbaru tetap dipertahankan.");
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(mocks.save.mock.calls[1][2]).toMatchObject({
      expectedMissionRevision: 5,
      missionProgress: {
        ...server.mission_progress, feedback: "Refleksi lokal hasil perbandingan",
      },
    });
    expect(screen.getByText("newest.png")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Pemulihan refleksi" })).not.toBeInTheDocument();
  });

  it("retains the latest typed draft and invalidates older queued saves after conflict", async () => {
    let resolveSave!: (value: unknown) => void;
    mocks.save.mockImplementationOnce(() => new Promise((resolve) => { resolveSave = resolve; }));
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    fireEvent.change(editor, { target: { value: "Draf pertama" } });
    fireEvent.blur(editor);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    fireEvent.change(editor, { target: { value: "Draf terakhir masih dalam antrean" } });
    fireEvent.blur(editor);
    mocks.getProgress.mockResolvedValue({ data: [progress(8, [proof("remote.png")], "Versi server terbaru")], error: null });
    resolveSave({ data: null, error: { code: "40001" } });
    await screen.findByText("remote.png");
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf terakhir masih dalam antrean"));
    fireEvent.click(screen.getByRole("button", { name: "Gunakan versi server" }));
    expect(editor).toHaveValue("Versi server terbaru");
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });

  it("preserves the edited recovery draft if another device changes progress again", async () => {
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    mocks.getProgress.mockResolvedValue({ data: [progress(5, [], "Server pertama")], error: null });
    mocks.save.mockResolvedValue({ data: null, error: { code: "40001" } });
    fireEvent.change(editor, { target: { value: "Draf lokal pertama" } });
    fireEvent.blur(editor);
    await screen.findByRole("region", { name: "Pemulihan refleksi" });
    fireEvent.click(screen.getByRole("button", { name: "Pulihkan draf ke editor" }));
    fireEvent.change(editor, { target: { value: "Draf pemulihan yang diedit" } });
    mocks.getProgress.mockResolvedValue({ data: [progress(6, [proof("even-newer.png")], "Server kedua")], error: null });
    fireEvent.click(screen.getByRole("button", { name: "Simpan ulang refleksi" }));
    await screen.findByText("even-newer.png");
    expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf pemulihan yang diedit");
    expect(screen.getByRole("textbox", { name: "Refleksi versi server" })).toHaveValue("Server kedua");
    expect(mocks.save.mock.calls[1][2].expectedMissionRevision).toBe(5);
  });

  it("blocks competing edits while an explicit reflection recovery save is in flight", async () => {
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    const server = progress(5, [proof("remote.png")], "Refleksi server");
    mocks.getProgress.mockResolvedValue({ data: [server], error: null });
    mocks.save.mockResolvedValueOnce({ data: null, error: { code: "40001" } });
    fireEvent.change(editor, { target: { value: "Refleksi yang dipulihkan" } });
    fireEvent.blur(editor);
    await screen.findByRole("region", { name: "Pemulihan refleksi" });
    fireEvent.click(screen.getByRole("button", { name: "Pulihkan draf ke editor" }));
    let resolveSave!: (value: unknown) => void;
    mocks.save.mockImplementationOnce(() => new Promise((resolve) => { resolveSave = resolve; }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan ulang refleksi" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(editor).toBeDisabled();
    expect(screen.getByRole("button", { name: /Periksa kondisi/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Hapus/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gunakan versi server" })).toBeDisabled();
    resolveSave({ data: { ...server, mission_revision: 6,
      mission_progress: { ...server.mission_progress, feedback: "Refleksi yang dipulihkan" } }, error: null });
    await screen.findByText("Refleksi disimpan ulang. Bukti terbaru tetap dipertahankan.");
    expect(editor).toHaveValue("Refleksi yang dipulihkan");
    expect(mocks.save).toHaveBeenCalledTimes(2);
  });

  it("retains a copyable draft when saving and the refresh both lose connection", async () => {
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    mocks.save.mockResolvedValueOnce({ data: null, error: { code: "40001" } });
    mocks.getProgress.mockRejectedValueOnce(new Error("connection lost"));
    fireEvent.change(editor, { target: { value: "Draf sebelum koneksi terputus" } });
    fireEvent.blur(editor);
    await screen.findByText("Penyimpanan belum dapat dipastikan. Muat ulang halaman sebelum mencoba lagi.");
    expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf sebelum koneksi terputus");
    expect(screen.getByRole("button", { name: "Pulihkan draf ke editor" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Salin draf lokal" })).toBeEnabled();
  });

  it("allows copying but blocks restoration when refresh fails", async () => {
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    mocks.save.mockResolvedValue({ data: null, error: { code: "40001" } });
    mocks.getProgress.mockResolvedValue({ data: null, error: new Error("offline") });
    fireEvent.change(editor, { target: { value: "Draf aman saat offline" } });
    fireEvent.blur(editor);
    await screen.findByRole("region", { name: "Pemulihan refleksi" });
    expect(screen.getByRole("button", { name: "Pulihkan draf ke editor" })).toBeDisabled();
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    fireEvent.click(screen.getByRole("button", { name: "Salin draf lokal" }));
    await screen.findByText(/Pilih teks draf lokal lalu salin secara manual/);
    expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf aman saat offline");
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });

  it("keeps completed server progress locked while still offering a copy of the local draft", async () => {
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    mocks.getProgress.mockResolvedValue({
      data: [{ ...progress(5, [proof("completed.png")], "Refleksi selesai"), status: "completed" }], error: null,
    });
    mocks.save.mockResolvedValue({ data: null, error: { code: "40001" } });
    fireEvent.change(editor, { target: { value: "Draf sebelum selesai" } });
    fireEvent.blur(editor);
    await screen.findByText("completed.png");
    expect(screen.getByRole("button", { name: "Pulihkan draf ke editor" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Salin draf lokal" })).toBeEnabled();
    expect(editor).toBeDisabled();
  });

  it("reloads another device's evidence instead of rolling back to the stale local snapshot", async () => {
    const { container } = render(<CoursePage />);
    await waitForAuthenticatedCourse();
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
    await waitForAuthenticatedCourse();
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
    await waitForAuthenticatedCourse();
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
    await waitFor(() => expect(screen.getByRole("button", { name: /Hapus/ })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: /Hapus/ }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.calls[1][2].expectedMissionRevision).toBe(5);
    await screen.findByText("Bukti praktik dihapus.");
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
    await waitForAuthenticatedCourse();
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
