// @vitest-environment happy-dom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCourse: vi.fn(), getProgress: vi.fn(), save: vi.fn(),
  reconcile: vi.fn(), upload: vi.fn(), signedUrl: vi.fn(),
  getReview: vi.fn(), rpc: vi.fn(), getUser: vi.fn(),
  authListener: null as null | ((event: string, session: { user: { id: string } } | null) => void),
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
      onAuthStateChange: (listener: typeof mocks.authListener) => {
        mocks.authListener = listener;
        return { data: { subscription: { unsubscribe() { mocks.authListener = null; } } } };
      },
    },
    storage: { from: () => ({ upload: mocks.upload, createSignedUrl: mocks.signedUrl }) },
  },
}));
import CoursePage from "@/pages/course/[id]";
import { emptyMissionProgress, type MissionEvidenceUpload } from "@/lib/workplaceMission";
import { reflectionDraftKey, writeReflectionDraft } from "@/lib/reflectionDraft";

const draftScope = { accountId: "participant", courseId: "course", moduleId: "module" };

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
const nextScope = { ...draftScope, moduleId: "next-module" };
const nextCourse = {
  ...course,
  modules: [...course.modules, { ...course.modules[0], id: nextScope.moduleId, title: "Praktik berikut" }],
};
function nextProgress() {
  return { ...progress(12, [], "Refleksi modul berikut"), id: "next-progress", module_id: nextScope.moduleId };
}
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
  localStorage.clear();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "participant" } } });
  mocks.getCourse.mockResolvedValue({ data: { course, modules: course.modules }, error: null });
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
  describe.each(["module", "account"] as const)("recovery isolation on %s switch", (target) => {
    const newScope = target === "module" ? nextScope : { ...draftScope, accountId: "another-account" };
    const freshFeedback = target === "module" ? "Refleksi modul berikut" : "Refleksi akun berikut";
    const freshRow = () => target === "module" ? nextProgress() : progress(12, [], freshFeedback);

    async function openRecovery() {
      mocks.getCourse.mockResolvedValue({ data: { course, modules: nextCourse.modules }, error: null });
      mocks.getProgress.mockResolvedValue({ data: [progress(4, [], "Refleksi server awal"), nextProgress()], error: null });
      writeReflectionDraft(draftScope, "Draf privat konteks lama");
      render(<CoursePage />);
      const editor = await waitForAuthenticatedCourse();
      await screen.findByRole("region", { name: "Pemulihan refleksi" });
      return editor;
    }
    async function switchContext() {
      mocks.getProgress.mockResolvedValue({ data: [freshRow()], error: null });
      if (target === "module") {
        fireEvent.click(screen.getByRole("button", { name: "Berikutnya" }));
      } else {
        await act(async () => { mocks.authListener?.("SIGNED_IN", { user: { id: newScope.accountId } }); });
      }
      await waitFor(() => expect(screen.getByRole("textbox", { name: "Catatan refleksi" })).toHaveValue(freshFeedback));
    }
    function expectCleanContext() {
      expect(screen.getByRole("textbox", { name: "Catatan refleksi" })).toHaveValue(freshFeedback);
      expect(screen.queryByRole("region", { name: "Pemulihan refleksi" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Simpan ulang refleksi" })).not.toBeInTheDocument();
      expect(screen.queryByText("Draf refleksi disalin.")).not.toBeInTheDocument();
      expect(screen.queryByText(/Pilih teks draf lokal lalu salin secara manual/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Refleksi disimpan ulang/)).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue("Draf privat konteks lama")).not.toBeInTheDocument();
      expect(screen.queryByText("late-private.png")).not.toBeInTheDocument();
    }
    async function conflictInNewContext() {
      const editor = screen.getByRole("textbox", { name: "Catatan refleksi" });
      mocks.save.mockResolvedValueOnce({ data: null, error: { code: "40001" } });
      fireEvent.change(editor, { target: { value: "Draf konteks baru" } });
      fireEvent.blur(editor);
      await screen.findByRole("region", { name: "Pemulihan refleksi" });
      await waitFor(() => expect(screen.getByRole("button", { name: "Pulihkan draf ke editor" })).toBeEnabled());
      expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf konteks baru");
    }

    it("clears the comparison, copy notice and restored editor without saving them", async () => {
      const editor = await openRecovery();
      vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
      fireEvent.click(screen.getByRole("button", { name: "Salin draf lokal" }));
      await screen.findByText("Draf refleksi disalin.");
      fireEvent.click(screen.getByRole("button", { name: "Pulihkan draf ke editor" }));
      fireEvent.change(editor, { target: { value: "Edit pemulihan privat" } });
      await switchContext();
      expectCleanContext();
      expect(screen.queryByDisplayValue("Edit pemulihan privat")).not.toBeInTheDocument();
      expect(mocks.save).not.toHaveBeenCalled();
      expect(localStorage.getItem(reflectionDraftKey(newScope))).toBeNull();
      if (target === "account") {
        expect(localStorage.getItem(reflectionDraftKey(draftScope))).toBeNull();
      } else {
        expect(JSON.parse(localStorage.getItem(reflectionDraftKey(draftScope))!).feedback).toBe("Edit pemulihan privat");
      }
      await conflictInNewContext();
      expect(mocks.save.mock.calls[0]).toMatchObject(["course", newScope.moduleId, { expectedMissionRevision: 12 }]);
    });

    it.each(["success", "failure"] as const)("ignores a late clipboard %s even after a new recovery panel opens", async (outcome) => {
      await openRecovery();
      const copy = deferred<void>();
      vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(() => copy.promise.then(() => {
        if (outcome === "failure") throw new Error("clipboard denied");
      })) } });
      fireEvent.click(screen.getByRole("button", { name: "Salin draf lokal" }));
      await switchContext();
      await conflictInNewContext();
      await act(async () => { copy.resolve(); });
      expect(screen.queryByText("Draf refleksi disalin.")).not.toBeInTheDocument();
      expect(screen.queryByText(/Pilih teks draf lokal lalu salin secara manual/)).not.toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf konteks baru");
    });

    it.each(["success", "conflict"] as const)("ignores a late recovery save %s and lets the new context save independently", async (outcome) => {
      await openRecovery();
      const save = deferred<unknown>();
      mocks.save.mockReturnValueOnce(save.promise);
      fireEvent.click(screen.getByRole("button", { name: "Pulihkan draf ke editor" }));
      fireEvent.click(screen.getByRole("button", { name: "Simpan ulang refleksi" }));
      await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
      expect(mocks.save.mock.calls[0][2].expectedMissionRevision).toBe(4);
      await switchContext();
      expectCleanContext();
      // This read/save must not wait for the old account/module's request.
      await conflictInNewContext();
      const reads = mocks.getProgress.mock.calls.length;
      await act(async () => { save.resolve(outcome === "success"
        ? { data: progress(5, [proof("late-private.png")], "Draf privat konteks lama"), error: null }
        : { data: null, error: { code: "40001" } }); });
      expect(mocks.getProgress).toHaveBeenCalledTimes(reads);
      expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf konteks baru");
      expect(screen.getByRole("textbox", { name: "Catatan refleksi" })).toHaveValue(freshFeedback);
      expect(screen.queryByText("late-private.png")).not.toBeInTheDocument();
      expect(screen.queryByText(/Refleksi disimpan ulang/)).not.toBeInTheDocument();
      expect(mocks.save.mock.calls[1]).toMatchObject(["course", newScope.moduleId, { expectedMissionRevision: 12 }]);
    });

    it.each(["success", "failure"] as const)("ignores a late refetch %s without releasing the new context's pending recovery", async (outcome) => {
      await openRecovery();
      const oldRead = deferred<unknown>();
      const newRead = deferred<unknown>();
      mocks.save.mockResolvedValue({ data: null, error: { code: "40001" } });
      mocks.getProgress.mockReturnValueOnce(oldRead.promise);
      fireEvent.click(screen.getByRole("button", { name: "Pulihkan draf ke editor" }));
      fireEvent.click(screen.getByRole("button", { name: "Simpan ulang refleksi" }));
      await screen.findByRole("button", { name: "Memuat data terbaru..." });
      await switchContext();
      expectCleanContext();
      mocks.getProgress.mockReturnValueOnce(newRead.promise);
      const editor = screen.getByRole("textbox", { name: "Catatan refleksi" });
      fireEvent.change(editor, { target: { value: "Draf konteks baru" } });
      fireEvent.blur(editor);
      const loading = await screen.findByRole("button", { name: "Memuat data terbaru..." });
      const reads = mocks.getProgress.mock.calls.length;
      await act(async () => { oldRead.resolve(outcome === "success"
        ? { data: [progress(99, [proof("late-private.png")], "Respons akun lama")], error: null }
        : { data: null, error: new Error("old read failed") }); });
      expect(loading).toBeDisabled();
      expect(loading).toHaveTextContent("Memuat data terbaru...");
      expect(screen.getByRole("textbox", { name: "Catatan refleksi" })).toHaveValue("Draf konteks baru");
      expect(screen.queryByText("late-private.png")).not.toBeInTheDocument();
      expect(mocks.getProgress).toHaveBeenCalledTimes(reads);
      await act(async () => { newRead.resolve({ data: [freshRow()], error: null }); });
      await waitFor(() => expect(editor).toHaveValue(freshFeedback));
      expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf konteks baru");
      expect(screen.getByRole("button", { name: "Pulihkan draf ke editor" })).toBeEnabled();
    });

    it.each(["success", "conflict"] as const)("invalidates queued autosaves after a late %s instead of sending old snapshots", async (outcome) => {
      mocks.getCourse.mockResolvedValue({ data: { course, modules: nextCourse.modules }, error: null });
      mocks.getProgress.mockResolvedValue({ data: [progress(4, []), nextProgress()], error: null });
      render(<CoursePage />);
      const editor = await waitForAuthenticatedCourse();
      const save = deferred<unknown>();
      mocks.save.mockReturnValueOnce(save.promise);
      fireEvent.change(editor, { target: { value: "Draf privat konteks lama" } });
      fireEvent.blur(editor);
      await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
      fireEvent.change(editor, { target: { value: "Antrean lama tidak boleh terkirim" } });
      fireEvent.blur(editor);
      await switchContext();
      expectCleanContext();
      await act(async () => { save.resolve(outcome === "success"
        ? { data: progress(5, [proof("late-private.png")], "Draf privat konteks lama"), error: null }
        : { data: null, error: { code: "40001" } }); });
      expectCleanContext();
      expect(mocks.save).toHaveBeenCalledTimes(1);
      await conflictInNewContext();
      expect(mocks.save.mock.calls[1]).toMatchObject(["course", newScope.moduleId, { expectedMissionRevision: 12 }]);
    });
  });

  it("offers a persisted draft after conflict and refresh, then saves only text against the latest revision", async () => {
    const view = render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    const server = progress(9, [proof("latest.png")], "Teks dari server");
    mocks.save.mockResolvedValueOnce({ data: null, error: { code: "40001" } });
    mocks.getProgress.mockResolvedValue({ data: [server], error: null });
    fireEvent.change(editor, { target: { value: "Draf bertahan setelah refresh" } });
    fireEvent.blur(editor);
    await screen.findByText("latest.png");
    expect(JSON.parse(localStorage.getItem(reflectionDraftKey(draftScope))!)).toEqual({
      version: 1, feedback: "Draf bertahan setelah refresh",
    });
    view.unmount();
    mocks.getCourse.mockClear();
    render(<CoursePage />);
    const reloadedEditor = await waitForAuthenticatedCourse();
    expect(await screen.findByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf bertahan setelah refresh");
    expect(reloadedEditor).toHaveValue("Teks dari server");
    expect(mocks.save).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Pulihkan draf ke editor" }));
    fireEvent.change(reloadedEditor, { target: { value: "Draf dipulihkan dan diedit" } });
    expect(JSON.parse(localStorage.getItem(reflectionDraftKey(draftScope))!).feedback).toBe("Draf dipulihkan dan diedit");
    mocks.save.mockImplementation(async (_course, _module, change) => ({
      data: { ...server, mission_revision: 10, mission_progress: change.missionProgress }, error: null,
    }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan ulang refleksi" }));
    await screen.findByText("Refleksi disimpan ulang. Bukti terbaru tetap dipertahankan.");
    expect(mocks.save.mock.calls[1][2]).toMatchObject({
      expectedMissionRevision: 9,
      missionProgress: { ...server.mission_progress, feedback: "Draf dipulihkan dan diedit" },
    });
    expect(localStorage.getItem(reflectionDraftKey(draftScope))).toBeNull();
  });

  it("keeps unblurred edits through refresh and lets the participant explicitly delete them", async () => {
    const view = render(<CoursePage />);
    fireEvent.change(await waitForAuthenticatedCourse(), { target: { value: "Belum meninggalkan editor" } });
    view.unmount();
    mocks.getCourse.mockClear();
    render(<CoursePage />);
    await waitForAuthenticatedCourse();
    expect(await screen.findByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Belum meninggalkan editor");
    fireEvent.click(screen.getByRole("button", { name: "Hapus draf lokal" }));
    expect(localStorage.getItem(reflectionDraftKey(draftScope))).toBeNull();
    expect(screen.queryByRole("region", { name: "Pemulihan refleksi" })).not.toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("does not restore drafts belonging to a different course or module", async () => {
    writeReflectionDraft({ ...draftScope, courseId: "another-course" }, "Draf course lain");
    writeReflectionDraft({ ...draftScope, moduleId: "another-module" }, "Draf modul lain");
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    expect(editor).toHaveValue("");
    expect(screen.queryByRole("region", { name: "Pemulihan refleksi" })).not.toBeInTheDocument();
    expect(localStorage.length).toBe(2);
  });

  it("clears old account drafts and ignores its pending save after an account switch", async () => {
    const save = deferred<unknown>();
    mocks.save.mockReturnValueOnce(save.promise);
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    fireEvent.change(editor, { target: { value: "Rahasia akun pertama" } });
    fireEvent.blur(editor);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    await act(async () => { mocks.authListener?.("SIGNED_IN", { user: { id: "another-account" } }); });
    await screen.findByRole("textbox", { name: "Catatan refleksi" });
    await act(async () => { save.resolve({ data: null, error: { code: "40001" } }); });
    expect(localStorage.getItem(reflectionDraftKey(draftScope))).toBeNull();
    expect(screen.queryByDisplayValue("Rahasia akun pertama")).not.toBeInTheDocument();
    await act(async () => { mocks.authListener?.("SIGNED_IN", { user: { id: "participant" } }); });
    await screen.findByRole("textbox", { name: "Catatan refleksi" });
    expect(screen.queryByRole("region", { name: "Pemulihan refleksi" })).not.toBeInTheDocument();
  });

  it("clears drafts on sign-out and removes other accounts' persisted drafts at startup", async () => {
    writeReflectionDraft({ ...draftScope, accountId: "old-account" }, "Akun lama");
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    expect(localStorage.length).toBe(0);
    fireEvent.change(editor, { target: { value: "Draf sebelum keluar" } });
    await act(async () => { mocks.authListener?.("SIGNED_OUT", null); });
    expect(localStorage.length).toBe(0);
  });

  it("does not delete newer edits when an older save succeeds", async () => {
    const save = deferred<unknown>();
    mocks.save.mockReturnValueOnce(save.promise);
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    fireEvent.change(editor, { target: { value: "Teks pertama" } });
    fireEvent.blur(editor);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    fireEvent.change(editor, { target: { value: "Teks kedua belum disimpan" } });
    await act(async () => { save.resolve({ data: progress(5, [], "Teks pertama"), error: null }); });
    expect(JSON.parse(localStorage.getItem(reflectionDraftKey(draftScope))!).feedback).toBe("Teks kedua belum disimpan");
  });

  it("blocks restoring a saved draft until the server revision can be loaded", async () => {
    writeReflectionDraft(draftScope, "Draf tersimpan");
    mocks.getProgress.mockResolvedValue({ data: null, error: new Error("offline") });
    render(<CoursePage />);
    await waitForAuthenticatedCourse();
    await screen.findByRole("textbox", { name: "Draf refleksi lokal" });
    expect(screen.getByRole("button", { name: "Pulihkan draf ke editor" })).toBeDisabled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it("warns instead of claiming refresh protection when browser storage is unavailable", async () => {
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    const spy = vi.spyOn(window, "localStorage", "get").mockReturnValue({
      setItem: () => { throw new Error("quota"); },
    } as unknown as Storage);
    fireEvent.change(editor, { target: { value: "Draf tanpa penyimpanan" } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Salin refleksi sebelum memuat ulang");
    expect(editor).toHaveValue("Draf tanpa penyimpanan");
    spy.mockRestore();
  });

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
    expect(screen.queryByRole("button", { name: /Hapus (?!draf)/ })).not.toBeInTheDocument();
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
    await screen.findByText(/Perubahan ini tidak disimpan, dan data terbaru belum berhasil dimuat/);
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

  it("retries only the server read, keeps the draft and blocks duplicate refreshes", async () => {
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    mocks.save.mockResolvedValueOnce({ data: null, error: { code: "40001" } });
    mocks.getProgress.mockResolvedValue({ data: null, error: new Error("offline") });
    fireEvent.change(editor, { target: { value: "Draf aman saat mencoba lagi" } });
    fireEvent.blur(editor);
    const retry = await screen.findByRole("button", { name: "Coba muat data terbaru" });
    await waitFor(() => expect(retry).toBeEnabled());
    expect(editor).toBeDisabled();
    expect(screen.queryByText(/Data terbaru berhasil dimuat/)).not.toBeInTheDocument();
    const reload = deferred<{ data: ReturnType<typeof progress>[]; error: null }>();
    mocks.getProgress.mockReturnValueOnce(reload.promise);
    const reads = mocks.getProgress.mock.calls.length;
    fireEvent.click(retry);
    fireEvent.click(retry);
    expect(retry).toBeDisabled();
    expect(mocks.getProgress).toHaveBeenCalledTimes(reads + 1);
    await act(async () => reload.resolve({
      data: [progress(9, [proof("confirmed.png")], "Refleksi terbaru")], error: null,
    }));
    await screen.findByText(/Data terbaru berhasil dimuat/);
    expect(editor).toHaveValue("Refleksi terbaru");
    expect(editor).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf aman saat mencoba lagi");
    expect(mocks.save).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Periksa kondisi" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    expect(mocks.save.mock.calls[1][2].expectedMissionRevision).toBe(9);
  });

  it("keeps uncertain uploaded proof visible and locked when save and reload fail", async () => {
    const { container } = render(<CoursePage />);
    await waitForAuthenticatedCourse();
    mocks.save.mockRejectedValueOnce(new Error("response lost"));
    mocks.getProgress.mockResolvedValue({ data: null, error: new Error("offline") });
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [new File(["proof"], "uncertain.png", { type: "image/png" })] },
    });
    await screen.findByText(/Penyimpanan belum dapat dipastikan dan data terbaru belum berhasil dimuat/);
    expect(screen.getByText("uncertain.png")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Coba muat data terbaru" })).toBeEnabled());
    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hapus (?!draf)/ })).not.toBeInTheDocument();
    mocks.getProgress.mockResolvedValue({ data: [progress(5, [proof("uncertain.png")])], error: null });
    fireEvent.click(screen.getByRole("button", { name: "Coba muat data terbaru" }));
    await screen.findByText(/sebagian perubahan mungkin sudah tersimpan/);
    expect(screen.getByText("uncertain.png")).toBeInTheDocument();
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });

  it("keeps recovery available after another failed refresh", async () => {
    render(<CoursePage />);
    const editor = await waitForAuthenticatedCourse();
    mocks.save.mockResolvedValueOnce({ data: null, error: new Error("lost response") });
    mocks.getProgress.mockRejectedValue(new Error("offline"));
    fireEvent.change(editor, { target: { value: "Draf tetap ada" } });
    fireEvent.blur(editor);
    const retry = await screen.findByRole("button", { name: "Coba muat data terbaru" });
    await waitFor(() => expect(retry).toBeEnabled());
    fireEvent.click(retry);
    await waitFor(() => expect(retry).toBeEnabled());
    expect(editor).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf tetap ada");
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
