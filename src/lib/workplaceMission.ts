/**
 * Canonical contract for a workplace mission.
 *
 * Mission content is stored in module_content.content_data (JSONB), so this
 * file also owns the safe migration boundary for older, flat blueprints.
 */
export const WORKPLACE_MISSION_VERSION = 2;
export const DEFAULT_WORKPLACE_TRACK = "construction";

export type MissionObjective = {
  statement: string;
  successCriteria: string[];
};

export type MissionScenario = {
  prompt: string;
  decisionQuestion: string;
  options: string[];
  recommendedAction: string;
  debrief: string;
};

export type MissionPracticeStep = {
  id: string;
  instruction: string;
  checklist: string[];
  estimatedMinutes: number;
};

export type MissionEvidence = {
  id: string;
  type: "photo" | "checklist" | "written" | "recording" | "reflection" | "other";
  label: string;
  instruction: string;
  required: boolean;
};

export type MissionFeedback = {
  prompt: string;
  questions: string[];
  coachTip: string;
};

export type MissionRepetition = {
  intervalDays: number;
  nextAction: string;
  cadenceLabel: string;
};

export type WorkplaceMission = {
  kind: "workplace-mission";
  version: number;
  workplaceTrack: string;
  objective: MissionObjective;
  scenario: MissionScenario;
  knowledge: string[];
  practice: MissionPracticeStep[];
  evidence: MissionEvidence[];
  feedback: MissionFeedback;
  repetition: MissionRepetition;
};

export type MissionProgress = {
  checkedPracticeIds: string[];
  selectedDecision: string | null;
  evidenceConfirmed: boolean;
  feedback: string;
  evidenceUploads: MissionEvidenceUpload[];
};

export type MissionEvidenceUpload = {
  evidenceId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedAt: string;
};

const DEFAULT_FEEDBACK_QUESTIONS = [
  "Apa yang berhasil saat kamu mempraktikkan langkah ini?",
  "Apa satu hal yang akan kamu ubah pada percobaan berikutnya?",
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => typeof item === "string" ? item.trim() : "")
    .filter(Boolean);
}

function asPositiveInt(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : fallback;
}

function normalizeEvidenceType(value: unknown): MissionEvidence["type"] {
  if (value === "photo" || value === "checklist" || value === "written" ||
      value === "recording" || value === "reflection") {
    return value;
  }
  return "other";
}

/**
 * Normalize both the v2 contract and the original flat blueprint.
 * Returning null means the content is not a workplace mission.
 */
export function normalizeWorkplaceMission(value: unknown): WorkplaceMission | null {
  const raw = asRecord(value);
  if (!raw || raw.kind !== "workplace-mission") return null;

  const objectiveRaw = asRecord(raw.objective);
  const objective: MissionObjective = {
    statement: objectiveRaw
      ? asString(objectiveRaw.statement, "Terapkan skill ini pada situasi kerja.")
      : asString(raw.objective, "Terapkan skill ini pada situasi kerja."),
    successCriteria: objectiveRaw
      ? asStringList(objectiveRaw.successCriteria)
      : [],
  };

  const scenarioRaw = asRecord(raw.scenario);
  const legacyScenario = asString(raw.scenario, "Ada kondisi kerja yang berbeda dari rencana.");
  const scenario: MissionScenario = {
    prompt: scenarioRaw
      ? asString(scenarioRaw.prompt, legacyScenario)
      : legacyScenario,
    decisionQuestion: scenarioRaw
      ? asString(scenarioRaw.decisionQuestion, "Apa tindakan pertama yang paling tepat?")
      : "Apa tindakan pertama yang paling tepat?",
    options: scenarioRaw ? asStringList(scenarioRaw.options) : [],
    recommendedAction: scenarioRaw
      ? asString(scenarioRaw.recommendedAction, "Klarifikasi kondisi sebelum bertindak.")
      : "Klarifikasi kondisi sebelum bertindak.",
    debrief: scenarioRaw
      ? asString(scenarioRaw.debrief, "Pilih tindakan yang jelas, aman, dan dapat diverifikasi.")
      : "Pilih tindakan yang jelas, aman, dan dapat diverifikasi.",
  };

  const legacyPractice = asStringList(raw.practice);
  const practice: MissionPracticeStep[] = Array.isArray(raw.practice)
    ? raw.practice.map((item, index) => {
      const step = asRecord(item);
      if (!step) {
        return {
          id: `practice-${index + 1}`,
          instruction: legacyPractice[index] || `Selesaikan langkah praktik ${index + 1}.`,
          checklist: [],
          estimatedMinutes: 5,
        };
      }
      return {
        id: asString(step.id, `practice-${index + 1}`),
        instruction: asString(step.instruction, asString(step.label, `Selesaikan langkah praktik ${index + 1}.`)),
        checklist: asStringList(step.checklist),
        estimatedMinutes: asPositiveInt(step.estimatedMinutes, 5),
      };
    })
    : [];

  const legacyEvidence = asStringList(raw.evidence);
  const evidence: MissionEvidence[] = Array.isArray(raw.evidence)
    ? raw.evidence.map((item, index) => {
      const evidenceItem = asRecord(item);
      if (!evidenceItem) {
        return {
          id: `evidence-${index + 1}`,
          type: index === 0 ? "checklist" : "other",
          label: legacyEvidence[index] || `Bukti praktik ${index + 1}`,
          instruction: "Siapkan bukti yang dapat ditinjau oleh rekan atau coach.",
          required: true,
        };
      }
      return {
        id: asString(evidenceItem.id, `evidence-${index + 1}`),
        type: normalizeEvidenceType(evidenceItem.type),
        label: asString(evidenceItem.label, `Bukti praktik ${index + 1}`),
        instruction: asString(evidenceItem.instruction, "Siapkan bukti yang dapat ditinjau oleh rekan atau coach."),
        required: evidenceItem.required !== false,
      };
    })
    : [];

  const feedbackRaw = asRecord(raw.feedback);
  const repetitionRaw = asRecord(raw.repetition);
  const intervalDays = repetitionRaw
    ? asPositiveInt(repetitionRaw.intervalDays, 3)
    : asPositiveInt(raw.repeatAfterDays, 3);

  return {
    kind: "workplace-mission",
    version: asPositiveInt(raw.version, 1),
    workplaceTrack: asString(raw.workplaceTrack, "custom"),
    objective,
    scenario,
    knowledge: asStringList(raw.knowledge).length
      ? asStringList(raw.knowledge)
      : asStringList(raw.learn),
    practice,
    evidence,
    feedback: {
      prompt: feedbackRaw
        ? asString(feedbackRaw.prompt, "Catat pembelajaranmu sebelum menutup misi.")
        : asString(raw.feedbackPrompt, "Catat pembelajaranmu sebelum menutup misi."),
      questions: feedbackRaw
        ? (asStringList(feedbackRaw.questions).length ? asStringList(feedbackRaw.questions) : DEFAULT_FEEDBACK_QUESTIONS)
        : DEFAULT_FEEDBACK_QUESTIONS,
      coachTip: feedbackRaw
        ? asString(feedbackRaw.coachTip, "Cari satu perubahan kecil yang bisa langsung dicoba.")
        : "Cari satu perubahan kecil yang bisa langsung dicoba.",
    },
    repetition: {
      intervalDays,
      nextAction: repetitionRaw
        ? asString(repetitionRaw.nextAction, "Ulangi misi pada situasi kerja berikutnya.")
        : "Ulangi misi pada situasi kerja berikutnya.",
      cadenceLabel: repetitionRaw
        ? asString(repetitionRaw.cadenceLabel, `Ulangi dalam ${intervalDays} hari`)
        : `Ulangi dalam ${intervalDays} hari`,
    },
  };
}

export function emptyMissionProgress(): MissionProgress {
  return {
    checkedPracticeIds: [],
    selectedDecision: null,
    evidenceConfirmed: false,
    feedback: "",
    evidenceUploads: [],
  };
}

export function normalizeMissionProgress(value: unknown): MissionProgress {
  const raw = asRecord(value);
  if (!raw) return emptyMissionProgress();
  return {
    checkedPracticeIds: asStringList(raw.checkedPracticeIds),
    selectedDecision: typeof raw.selectedDecision === "string" ? raw.selectedDecision : null,
    evidenceConfirmed: raw.evidenceConfirmed === true,
    feedback: typeof raw.feedback === "string" ? raw.feedback : "",
    evidenceUploads: Array.isArray(raw.evidenceUploads)
      ? raw.evidenceUploads.flatMap((item) => {
        const upload = asRecord(item);
        if (
          !upload ||
          typeof upload.evidenceId !== "string" ||
          typeof upload.fileName !== "string" ||
          typeof upload.mimeType !== "string" ||
          typeof upload.sizeBytes !== "number" ||
          !Number.isFinite(upload.sizeBytes) ||
          upload.sizeBytes < 0 ||
          typeof upload.storagePath !== "string" ||
          typeof upload.uploadedAt !== "string"
        ) {
          return [];
        }
        return [{
          evidenceId: upload.evidenceId,
          fileName: upload.fileName,
          mimeType: upload.mimeType,
          sizeBytes: Math.round(upload.sizeBytes),
          storagePath: upload.storagePath,
          uploadedAt: upload.uploadedAt,
        }];
      })
      : [],
  };
}
