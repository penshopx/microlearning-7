// @vitest-environment happy-dom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ParticipantReviewStatus } from "@/components/mission/ParticipantReviewStatus";
import { MissionReviewPanel } from "@/components/mission/MissionReviewPanel";

const mocks = vi.hoisted(() => ({
  getMyReview: vi.fn(), getAssignments: vi.fn(), getSubmissions: vi.fn(),
  assignSupervisor: vi.fn(), removeAssignment: vi.fn(), reviewSubmission: vi.fn(), openEvidence: vi.fn(),
  authCallback: null as null | ((event: string, session: unknown) => void),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: {
    getUser: vi.fn(async () => ({ data: { user: { id: "viewer" } } })),
    onAuthStateChange: vi.fn((callback) => {
      mocks.authCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
  } },
}));
vi.mock("@/services/missionReviewService", () => ({ missionReviewService: mocks }));

const review = {
  id: "review", progress_id: "progress", reviewer_id: "supervisor",
  status: "retry_requested", feedback: "Periksa sambungan sebelum latihan berikutnya.",
  reviewed_at: "2026-10-31T10:00:00Z",
};
const submission = {
  id: "progress", user_id: "participant", module_id: "module", status: "completed",
  module_title: "Praktik aman", review: null,
  mission_progress: {
    feedback: "Saya sudah memeriksa alat.",
    evidenceUploads: [{ evidenceId: "photo", fileName: "proof.png", mimeType: "image/png",
      sizeBytes: 100, storagePath: "participant/course/module/photo/proof.png", uploadedAt: "2026-10-31T09:00:00Z" }],
  },
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getMyReview.mockResolvedValue({ data: review, error: null });
  mocks.getAssignments.mockResolvedValue({ data: [], error: null });
  mocks.getSubmissions.mockResolvedValue({ data: [submission], error: null });
  mocks.reviewSubmission.mockResolvedValue({ data: review, error: null });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("participant coaching", () => {
  it("shows the supervisor decision and reopens practice through the supplied action", async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);
    render(<ParticipantReviewStatus progressId="progress" onRetry={onRetry} />);
    expect(await screen.findByText(review.feedback)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("button-retry-mission"));
    await waitFor(() => expect(onRetry).toHaveBeenCalledOnce());
  });
  it("does not claim that draft evidence has already been submitted", async () => {
    mocks.getMyReview.mockResolvedValue({ data: null, error: null });
    render(<ParticipantReviewStatus progressId="progress" isSubmitted={false} />);
    expect(await screen.findByText("Bukti belum dikirim untuk ditinjau")).toBeInTheDocument();
    expect(screen.queryByText("Menunggu tinjauan pendamping")).not.toBeInTheDocument();
  });
  it("shows a failed retry instead of claiming success", async () => {
    render(<ParticipantReviewStatus progressId="progress" onRetry={async () => { throw new Error("denied"); }} />);
    fireEvent.click(await screen.findByTestId("button-retry-mission"));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

describe("supervisor review panel", () => {
  it("shows reflection and proof without revealing owner-only assignment controls", async () => {
    render(<MissionReviewPanel courseId="course" isOwner={false} />);
    expect(await screen.findByText("proof.png")).toBeInTheDocument();
    expect(screen.getByText("Saya sudah memeriksa alat.")).toBeInTheDocument();
    expect(screen.queryByText("Penugasan pendamping")).not.toBeInTheDocument();
    expect(mocks.openEvidence).not.toHaveBeenCalled();
  });
  it("validates retry coaching and saves a concise decision", async () => {
    render(<MissionReviewPanel courseId="course" isOwner={false} />);
    await screen.findByText("proof.png");
    fireEvent.click(screen.getByTestId("button-request-retry-progress"));
    expect(mocks.reviewSubmission).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("Tambahkan arahan");
    fireEvent.change(screen.getByTestId("textarea-review-feedback-progress"), { target: { value: "Periksa ulang" } });
    fireEvent.click(screen.getByTestId("button-request-retry-progress"));
    await waitFor(() => expect(mocks.reviewSubmission).toHaveBeenCalledWith("progress", "retry_requested", "Periksa ulang"));
  });
  it("lets the course owner assign and revoke a scoped supervisor", async () => {
    const assignment = {
      id: "assignment", course_id: "course",
      participant_id: "00000000-0000-4000-8000-000000000002",
      supervisor_id: "00000000-0000-4000-8000-000000000003",
    };
    mocks.getSubmissions.mockResolvedValue({ data: [], error: null });
    mocks.assignSupervisor.mockImplementation(async () => {
      mocks.getAssignments.mockResolvedValue({ data: [assignment], error: null });
      return { data: assignment, error: null };
    });
    mocks.removeAssignment.mockImplementation(async () => {
      mocks.getAssignments.mockResolvedValue({ data: [], error: null });
      return { error: null };
    });
    vi.stubGlobal("confirm", vi.fn(() => true));
    render(<MissionReviewPanel courseId="course" isOwner />);
    await screen.findByText("Penugasan pendamping");
    fireEvent.change(screen.getByTestId("input-review-participant"), { target: { value: assignment.participant_id } });
    fireEvent.change(screen.getByTestId("input-review-supervisor"), { target: { value: assignment.supervisor_id } });
    fireEvent.click(screen.getByTestId("button-assign-supervisor"));
    await screen.findByTestId("assignment-assignment");
    expect(mocks.assignSupervisor).toHaveBeenCalledWith("course", assignment.participant_id, assignment.supervisor_id);
    fireEvent.click(screen.getByTestId("button-revoke-assignment-assignment"));
    await waitFor(() => expect(screen.queryByTestId("assignment-assignment")).not.toBeInTheDocument());
    expect(mocks.removeAssignment).toHaveBeenCalledWith("assignment");
  });
  it("shows approval errors instead of falsely confirming a review", async () => {
    mocks.reviewSubmission.mockResolvedValue({ data: null, error: new Error("forbidden") });
    render(<MissionReviewPanel courseId="course" isOwner={false} />);
    await screen.findByText("proof.png");
    fireEvent.click(screen.getByTestId("button-approve-review-progress"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Peninjauan belum tersimpan");
    expect(screen.queryByText("Bukti disetujui.")).not.toBeInTheDocument();
  });
});
