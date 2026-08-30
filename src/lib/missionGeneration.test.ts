import { describe, expect, it } from "vitest";
import { parseGeneratedMissions } from "./missionGeneration";
import { DEFAULT_WORKPLACE_TRACK } from "./workplaceMission";

const mission = {
  title: "Jalankan satu checkpoint",
  durationSeconds: 360,
  objective: {
    statement: "Checkpoint selesai dengan bukti yang dapat ditinjau.",
    successCriteria: ["Langkah kritis diperiksa."],
  },
  scenario: {
    prompt: "Kondisi berubah saat pekerjaan dimulai.",
    decisionQuestion: "Apa tindakan pertama?",
    options: ["Berhenti dan klarifikasi.", "Lanjut tanpa perubahan."],
    recommendedAction: "Berhenti dan klarifikasi.",
    debrief: "Klarifikasi mencegah asumsi yang berisiko.",
  },
  knowledge: ["Gunakan standar kerja yang berlaku."],
  practice: [{
    id: "practice-1",
    instruction: "Periksa satu proses nyata.",
    checklist: ["Catat kondisi awal."],
    estimatedMinutes: 5,
  }],
  evidence: [{
    id: "evidence-1",
    type: "checklist",
    label: "Checklist checkpoint",
    instruction: "Simpan hasil pemeriksaan.",
    required: true,
  }],
  feedback: {
    prompt: "Apa yang kamu pelajari?",
    questions: ["Apa yang akan diubah?"],
    coachTip: "Ulangi di proses berikutnya.",
  },
  repetition: {
    intervalDays: 3,
    nextAction: "Ulangi pada pekerjaan berikutnya.",
    cadenceLabel: "Ulangi dalam 3 hari",
  },
};

describe("parseGeneratedMissions", () => {
  it("keeps meeting and document outputs on the same mission contract", () => {
    const meetingOutput = parseGeneratedMissions({
      missions: [mission, { ...mission, title: "Checkpoint dokumen meeting" }],
    }, "operations");
    const documentOutput = parseGeneratedMissions({
      missions: [mission, { ...mission, title: "Checkpoint dari SOP" }],
    }, "operations");

    expect(Object.keys(meetingOutput[0].mission).sort()).toEqual(
      Object.keys(documentOutput[0].mission).sort()
    );
    expect(meetingOutput[0].mission.workplaceTrack).toBe("operations");
    expect(documentOutput[0].mission.version).toBe(meetingOutput[0].mission.version);
    expect(meetingOutput[0].mission.evidence[0]).toMatchObject({
      id: "evidence-1",
      required: true,
    });
  });

  it("rejects output outside the shared 2-to-4 mission contract", () => {
    expect(() => parseGeneratedMissions({ missions: [mission] })).toThrow(
      "invalid mission count"
    );
    expect(() => parseGeneratedMissions({
      missions: [mission, { ...mission, title: "Dua" }, { ...mission, title: "Tiga" }, { ...mission, title: "Empat" }, { ...mission, title: "Lima" }],
    })).toThrow("invalid mission count");
  });

  it("uses the same default workplace domain when callers omit it", () => {
    const payload = {
      missions: [mission, { ...mission, title: "Misi kedua" }],
    };
    const generated = parseGeneratedMissions(payload);
    const blankTrack = parseGeneratedMissions(payload, "  ");
    const invalidRuntimeTrack = parseGeneratedMissions(
      payload,
      null as unknown as string
    );

    expect(generated.every(
      (item) => item.mission.workplaceTrack === DEFAULT_WORKPLACE_TRACK
    )).toBe(true);
    expect(blankTrack[0].mission.workplaceTrack).toBe(DEFAULT_WORKPLACE_TRACK);
    expect(invalidRuntimeTrack[0].mission.workplaceTrack).toBe(DEFAULT_WORKPLACE_TRACK);
    expect(DEFAULT_WORKPLACE_TRACK).toBe("construction");
  });

  it("rejects duplicate practice or evidence identifiers", () => {
    expect(() => parseGeneratedMissions({
      missions: [
        {
          ...mission,
          practice: [mission.practice[0], mission.practice[0]],
        },
        { ...mission, title: "Misi kedua" },
      ],
    })).toThrow("incomplete mission");

    expect(() => parseGeneratedMissions({
      missions: [
        {
          ...mission,
          evidence: [mission.evidence[0], mission.evidence[0]],
        },
        { ...mission, title: "Misi kedua" },
      ],
    })).toThrow("incomplete mission");
  });

  it.each([
    ["objective statement", {
      ...mission,
      objective: { ...mission.objective, statement: "" },
    }],
    ["scenario debrief", {
      ...mission,
      scenario: { ...mission.scenario, debrief: "" },
    }],
    ["knowledge", {
      ...mission,
      knowledge: [],
    }],
    ["practice estimate", {
      ...mission,
      practice: [{ ...mission.practice[0], estimatedMinutes: 0 }],
    }],
    ["evidence required flag", {
      ...mission,
      evidence: [{ ...mission.evidence[0], required: undefined }],
    }],
    ["feedback coach tip", {
      ...mission,
      feedback: { ...mission.feedback, coachTip: "" },
    }],
    ["repetition cadence", {
      ...mission,
      repetition: { ...mission.repetition, cadenceLabel: "" },
    }],
  ])("rejects a mission missing its raw %s", (_label, incompleteMission) => {
    expect(() => parseGeneratedMissions({
      missions: [incompleteMission, { ...mission, title: "Misi kedua" }],
    })).toThrow("incomplete mission");
  });

  it.each([299, 1201])("rejects duration outside 5-to-20 minutes: %i seconds", (durationSeconds) => {
    expect(() => parseGeneratedMissions({
      missions: [
        { ...mission, durationSeconds },
        { ...mission, title: "Misi kedua" },
      ],
    })).toThrow("incomplete mission");
  });
});