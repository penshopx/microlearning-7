// @vitest-environment happy-dom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  courseId: "first-course",
  getCourse: vi.fn(), getProgress: vi.fn(), save: vi.fn(),
  signedUrl: vi.fn(), getReview: vi.fn(),
}));
vi.mock("next/router", () => ({ useRouter: () => ({ query: { id: mocks.courseId } }) }));
vi.mock("next/head", () => ({ default: () => null }));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "participant" } }) }));
vi.mock("@/components/mission/MissionReviewPanel", () => ({ MissionReviewPanel: () => null }));
vi.mock("@/components/mission/ParticipantReviewStatus", () => ({ ParticipantReviewStatus: () => null }));
vi.mock("@/services/supervisorReviewService", () => ({
  supervisorReviewService: { getReview: mocks.getReview, getComments: async () => ({ data: [] }) },
}));
vi.mock("@/services/microLearningService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/microLearningService")>();
  return { ...actual, microLearningService: {
    getCourseWithModules: mocks.getCourse, getLearnerProgress: mocks.getProgress,
    updateProgress: mocks.save, reconcileEvidence: async () => true,
  } };
});
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () => ({ data: { user: { id: "participant" } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    storage: { from: () => ({ createSignedUrl: mocks.signedUrl }) },
  },
}));
import CoursePage from "@/pages/course/[id]";
import { emptyMissionProgress } from "@/lib/workplaceMission";
import { reflectionDraftKey } from "@/lib/reflectionDraft";

function course(id: string) {
  const moduleIds = id === "first-course" ? [`${id}-module`, "second-module"] : [`${id}-module`];
  return { id, title: id, user_id: "author", modules: moduleIds.map(moduleId => ({
    id: moduleId, title: `Praktik ${moduleId}`, duration_seconds: 600, quizzes: [],
    content: [{ content_type: "worksheet", content_data: {
      kind: "workplace-mission", version: 1, objective: "Praktik aman",
      learn: ["Periksa alat"], practice: ["Periksa kondisi"], evidence: ["Foto hasil"],
      scenario: "Alat siap", feedbackPrompt: "Apa hasilnya?", repeatAfterDays: 3,
    } }],
  })) };
}
function progress(id: string, revision: number, feedback: string, fileName?: string, moduleId = `${id}-module`) {
  return {
    id: `${moduleId}-progress`, module_id: moduleId, status: "in_progress",
    mission_revision: revision,
    mission_progress: {
      ...emptyMissionProgress(), feedback,
      evidenceUploads: fileName ? [{
        evidenceId: "evidence-1", fileName, mimeType: "image/png", sizeBytes: 20,
        storagePath: `participant/${id}/${id}-module/evidence-1/${fileName}`,
        uploadedAt: new Date().toISOString(),
      }] : [],
    },
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
type Progress = ReturnType<typeof progress>;
type ReadResult = { data: Progress[] | null; error: Error | null };
type SaveResult = { data: Progress | null; error: { code: string } | null };
const nextFeedback = "Refleksi course kedua";

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  mocks.courseId = "first-course";
  mocks.getCourse.mockImplementation(async (id: string) => ({ data: course(id) }));
  mocks.getProgress.mockImplementation(async (id: string) => ({
    data: [
      progress(id, id === "first-course" ? 4 : 40,
        id === "first-course" ? "Refleksi awal" : nextFeedback),
      ...(id === "first-course"
        ? [progress(id, 40, nextFeedback, undefined, "second-module")] : []),
    ],
    error: null,
  }));
  mocks.getReview.mockResolvedValue({ data: null });
  mocks.signedUrl.mockResolvedValue({ data: { signedUrl: "https://example.test/old-evidence" } });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function startRecovery() {
  const view = render(<CoursePage />);
  await waitFor(() => expect(mocks.getCourse).toHaveBeenCalledTimes(2));
  const editor = await screen.findByRole("textbox", { name: "Catatan refleksi" });
  mocks.save.mockResolvedValueOnce({ data: null, error: { code: "40001" } });
  mocks.getProgress.mockResolvedValueOnce({
    data: [
      progress("first-course", 5, "Versi server lama", "old-proof.png"),
      progress("first-course", 40, nextFeedback, undefined, "second-module"),
    ], error: null,
  });
  fireEvent.change(editor, { target: { value: "Draf milik course pertama" } });
  fireEvent.blur(editor);
  await screen.findByRole("region", { name: "Pemulihan refleksi" });
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  fireEvent.click(screen.getByRole("button", { name: "Salin draf lokal" }));
  await screen.findByText("Draf refleksi disalin.");
  fireEvent.click(screen.getByRole("button", { name: "Pulihkan draf ke editor" }));
  fireEvent.change(editor, { target: { value: "Draf pemulihan course pertama" } });
  return view;
}

async function switchContext(view: ReturnType<typeof render>, kind: "course" | "module") {
  if (kind === "course") {
    mocks.courseId = "second-course";
    view.rerender(<CoursePage />);
  } else {
    fireEvent.click(screen.getByRole("button", { name: /Praktik second-module/ }));
  }
  const editor = await screen.findByRole("textbox", { name: "Catatan refleksi" });
  await waitFor(() => expect(editor).toHaveValue(nextFeedback));
  return editor;
}

function expectCleanContext() {
  expect(screen.queryByRole("region", { name: "Pemulihan refleksi" })).not.toBeInTheDocument();
  expect(screen.queryByText("Draf refleksi disalin.")).not.toBeInTheDocument();
  expect(screen.queryByDisplayValue("Draf pemulihan course pertama")).not.toBeInTheDocument();
  expect(screen.queryByText("old-proof.png")).not.toBeInTheDocument();
  expect(document.querySelector('a[href="https://example.test/old-evidence"]')).toBeNull();
  expect(screen.queryByText(/Progres berubah di tab atau perangkat lain/)).not.toBeInTheDocument();
}

describe.each(["course", "module"] as const)("recovery isolation when %s changes without unmount", kind => {
  const targetCourse = kind === "course" ? "second-course" : "first-course";
  const targetModule = kind === "course" ? "second-course-module" : "second-module";
  it.each(["success", "conflict"] as const)(
    "ignores an old recovery save %s after the new course saves its own text",
    async outcome => {
      const view = await startRecovery();
      const oldSave = deferred<SaveResult>();
      mocks.save.mockReturnValueOnce(oldSave.promise);
      fireEvent.click(screen.getByRole("button", { name: "Simpan ulang refleksi" }));
      await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
      const editor = await switchContext(view, kind);
      expectCleanContext();
      expect(editor).toBeEnabled();
      mocks.save.mockImplementation(async (id: string, moduleId: string, change) => ({
        data: { ...progress(id, 41, "", undefined, moduleId), mission_progress: change.missionProgress }, error: null,
      }));
      fireEvent.change(editor, { target: { value: "Teks baru sebelum respons lama" } });
      fireEvent.blur(editor);
      // The new context must not wait for a request belonging to the old course.
      await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(3));
      expect(mocks.save.mock.calls[2]).toMatchObject([
        targetCourse, targetModule, { expectedMissionRevision: 40 },
      ]);
      fireEvent.change(editor, { target: { value: "Edit baru yang belum disimpan" } });
      await act(async () => oldSave.resolve(outcome === "success"
        ? { data: progress("first-course", 999, "Hasil lama"), error: null }
        : { data: null, error: { code: "40001" } }));
      expectCleanContext();
      expect(editor).toHaveValue("Edit baru yang belum disimpan");
      const key = reflectionDraftKey({
        accountId: "participant", courseId: targetCourse, moduleId: targetModule,
      });
      expect(JSON.parse(localStorage.getItem(key)!).feedback).toBe("Edit baru yang belum disimpan");
      fireEvent.blur(editor);
      await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(4));
      expect(mocks.save.mock.calls[3][2].expectedMissionRevision).toBe(41);
    },
  );

  it("ignores an old recovery refetch after the new course has committed progress", async () => {
    const view = await startRecovery();
    const oldRefresh = deferred<ReadResult>();
    mocks.save.mockResolvedValueOnce({ data: null, error: { code: "40001" } });
    mocks.getProgress.mockReturnValueOnce(oldRefresh.promise);
    const reads = mocks.getProgress.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Simpan ulang refleksi" }));
    await waitFor(() => expect(mocks.getProgress).toHaveBeenCalledTimes(reads + 1));
    const editor = await switchContext(view, kind);
    expectCleanContext();
    expect(editor).toBeEnabled();
    mocks.save.mockImplementation(async (id: string, moduleId: string, change) => ({
      data: { ...progress(id, 41, "", undefined, moduleId), mission_progress: change.missionProgress }, error: null,
    }));
    fireEvent.change(editor, { target: { value: "Refleksi baru course kedua" } });
    fireEvent.blur(editor);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(3));
    await act(async () => oldRefresh.resolve({
      data: [progress("first-course", 999, "Refleksi refetch lama", "old-proof.png")], error: null,
    }));
    expectCleanContext();
    expect(editor).toHaveValue("Refleksi baru course kedua");
    fireEvent.change(editor, { target: { value: "Simpan berikutnya course kedua" } });
    fireEvent.blur(editor);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(4));
    expect(mocks.save.mock.calls[3][2].expectedMissionRevision).toBe(41);
  });

  it("does not let an old refetch release the new context's recovery lock", async () => {
    const view = await startRecovery();
    const oldRefresh = deferred<ReadResult>();
    mocks.save.mockResolvedValueOnce({ data: null, error: { code: "40001" } });
    mocks.getProgress.mockReturnValueOnce(oldRefresh.promise);
    const reads = mocks.getProgress.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Simpan ulang refleksi" }));
    await waitFor(() => expect(mocks.getProgress).toHaveBeenCalledTimes(reads + 1));
    const editor = await switchContext(view, kind);
    const newRefresh = deferred<ReadResult>();
    mocks.save.mockResolvedValueOnce({ data: null, error: { code: "40001" } });
    mocks.getProgress.mockReturnValueOnce(newRefresh.promise);
    fireEvent.change(editor, { target: { value: "Draf konflik pada konteks baru" } });
    fireEvent.blur(editor);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(3));
    const retry = await screen.findByRole("button", { name: "Memuat data terbaru..." });
    expect(retry).toBeDisabled();
    await act(async () => oldRefresh.resolve({
      data: [progress("first-course", 999, "Respons lama", "old-proof.png")], error: null,
    }));
    expect(retry).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf konflik pada konteks baru");
    await act(async () => newRefresh.resolve({
      data: [progress(targetCourse, 41, "Versi server konteks baru", undefined, targetModule)], error: null,
    }));
    expect(editor).toHaveValue("Versi server konteks baru");
    expect(screen.queryByText("old-proof.png")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Draf refleksi lokal" })).toHaveValue("Draf konflik pada konteks baru");
  });
});
