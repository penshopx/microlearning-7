import { describe, expect, it } from "vitest";
import {
  WORKPLACE_MISSION_VERSION,
  normalizeMissionProgress,
  normalizeWorkplaceMission,
  type WorkplaceMission,
} from "./workplaceMission";

describe("normalizeWorkplaceMission", () => {
  it("keeps the structured v2 mission contract", () => {
    const mission: WorkplaceMission = {
      kind: "workplace-mission",
      version: WORKPLACE_MISSION_VERSION,
      workplaceTrack: "operations",
      objective: {
        statement: "Jalankan pemeriksaan sebelum mulai.",
        successCriteria: ["Checklist selesai."],
      },
      scenario: {
        prompt: "Satu langkah SOP terlewat.",
        decisionQuestion: "Apa tindakan pertama?",
        options: ["Berhenti dan periksa."],
        recommendedAction: "Berhenti dan periksa.",
        debrief: "Utamakan verifikasi.",
      },
      knowledge: ["Periksa konteks."],
      practice: [{
        id: "practice-1",
        instruction: "Audit satu proses.",
        checklist: ["Periksa langkah pertama."],
        estimatedMinutes: 5,
      }],
      evidence: [{
        id: "evidence-1",
        type: "checklist",
        label: "Checklist audit",
        instruction: "Simpan hasilnya.",
        required: true,
      }],
      feedback: {
        prompt: "Apa yang dipelajari?",
        questions: ["Apa yang berhasil?"],
        coachTip: "Ulangi pada proses lain.",
      },
      repetition: {
        intervalDays: 3,
        nextAction: "Audit proses berikutnya.",
        cadenceLabel: "Ulangi dalam 3 hari",
      },
    };

    expect(normalizeWorkplaceMission(mission)).toEqual(mission);
  });

  it("migrates the original flat mission blueprint safely", () => {
    const normalized = normalizeWorkplaceMission({
      kind: "workplace-mission",
      version: 1,
      workplaceTrack: "construction",
      objective: "Kenali risiko kerja.",
      learn: ["Lihat kondisi lapangan."],
      practice: ["Periksa satu area kerja."],
      evidence: ["Foto dan checklist."],
      scenario: "Kondisi lapangan berubah.",
      feedbackPrompt: "Apa yang berhasil?",
      repeatAfterDays: 7,
    });

    expect(normalized).toMatchObject({
      version: 1,
      objective: { statement: "Kenali risiko kerja." },
      knowledge: ["Lihat kondisi lapangan."],
      practice: [{ id: "practice-1", instruction: "Periksa satu area kerja." }],
      evidence: [{ id: "evidence-1", label: "Foto dan checklist." }],
      scenario: { prompt: "Kondisi lapangan berubah." },
      feedback: { prompt: "Apa yang berhasil?" },
      repetition: { intervalDays: 7 },
    });
  });

  it("ignores unrelated worksheet content", () => {
    expect(normalizeWorkplaceMission({ kind: "worksheet" })).toBeNull();
  });
});

describe("normalizeMissionProgress", () => {
  it("accepts partial persisted progress without breaking", () => {
    expect(normalizeMissionProgress({
      checkedPracticeIds: ["practice-1:1"],
      evidenceConfirmed: true,
    })).toEqual({
      checkedPracticeIds: ["practice-1:1"],
      selectedDecision: null,
      evidenceConfirmed: true,
      feedback: "",
    });
  });
});