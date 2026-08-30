import {
  DEFAULT_WORKPLACE_TRACK,
  normalizeWorkplaceMission,
  WORKPLACE_MISSION_VERSION,
  type WorkplaceMission,
} from "./workplaceMission";

export type GeneratedMission = {
  title: string;
  durationSeconds: number;
  mission: WorkplaceMission;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function hasDuplicateIds(items: { id: string }[]): boolean {
  return new Set(items.map((item) => item.id)).size !== items.length;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function isStringList(value: unknown, minItems = 1, maxItems = Number.POSITIVE_INFINITY): value is string[] {
  return Array.isArray(value) &&
    value.length >= minItems &&
    value.length <= maxItems &&
    value.every(isNonEmptyString);
}

function isValidPracticeStep(value: unknown): boolean {
  const step = asRecord(value);
  return Boolean(
    step &&
    isNonEmptyString(step.id) &&
    isNonEmptyString(step.instruction) &&
    isStringList(step.checklist) &&
    typeof step.estimatedMinutes === "number" &&
    Number.isFinite(step.estimatedMinutes) &&
    step.estimatedMinutes > 0 &&
    step.estimatedMinutes <= 20
  );
}

function isValidEvidence(value: unknown): boolean {
  const evidence = asRecord(value);
  const validTypes = ["photo", "checklist", "written", "recording", "reflection", "other"];
  return Boolean(
    evidence &&
    isNonEmptyString(evidence.id) &&
    validTypes.includes(String(evidence.type)) &&
    isNonEmptyString(evidence.label) &&
    isNonEmptyString(evidence.instruction) &&
    typeof evidence.required === "boolean"
  );
}

function hasCompleteRawContract(raw: Record<string, unknown>): boolean {
  const objective = asRecord(raw.objective);
  const scenario = asRecord(raw.scenario);
  const feedback = asRecord(raw.feedback);
  const repetition = asRecord(raw.repetition);
  const practice = Array.isArray(raw.practice) ? raw.practice : [];
  const evidence = Array.isArray(raw.evidence) ? raw.evidence : [];

  return Boolean(
    objective &&
    isNonEmptyString(objective.statement) &&
    isStringList(objective.successCriteria) &&
    scenario &&
    isNonEmptyString(scenario.prompt) &&
    isNonEmptyString(scenario.decisionQuestion) &&
    isStringList(scenario.options, 2, 5) &&
    isNonEmptyString(scenario.recommendedAction) &&
    scenario.options.includes(scenario.recommendedAction) &&
    isNonEmptyString(scenario.debrief) &&
    isStringList(raw.knowledge, 1, 3) &&
    practice.length > 0 &&
    practice.every(isValidPracticeStep) &&
    evidence.length > 0 &&
    evidence.every(isValidEvidence) &&
    feedback &&
    isNonEmptyString(feedback.prompt) &&
    isStringList(feedback.questions) &&
    isNonEmptyString(feedback.coachTip) &&
    repetition &&
    typeof repetition.intervalDays === "number" &&
    Number.isFinite(repetition.intervalDays) &&
    repetition.intervalDays > 0 &&
    isNonEmptyString(repetition.nextAction) &&
    isNonEmptyString(repetition.cadenceLabel)
  );
}

/**
 * Validate and normalize the single output contract shared by meeting and
 * document generation. Keeping this outside the API handler makes the source
 * parity testable without calling OpenAI or Supabase.
 */
export function parseGeneratedMissions(
  value: unknown,
  workplaceTrack: string = DEFAULT_WORKPLACE_TRACK
): GeneratedMission[] {
  const normalizedTrack = typeof workplaceTrack === "string" && workplaceTrack.trim()
    ? workplaceTrack.trim()
    : DEFAULT_WORKPLACE_TRACK;
  const payload = asRecord(value);
  const rawMissions = payload?.missions;
  if (!Array.isArray(rawMissions) || rawMissions.length < 2 || rawMissions.length > 4) {
    throw new Error("AI returned an invalid mission count");
  }

  return rawMissions.map((item, index) => {
    const raw = asRecord(item);
    const title = typeof raw?.title === "string" ? raw.title.trim() : "";
    const durationIsValid = typeof raw?.durationSeconds === "number" &&
      Number.isFinite(raw.durationSeconds) &&
      raw.durationSeconds >= 300 &&
      raw.durationSeconds <= 1200;

    if (!raw || !title || !durationIsValid || !hasCompleteRawContract(raw)) {
      throw new Error(`AI returned an incomplete mission at index ${index}`);
    }

    const durationSeconds = Math.round(raw.durationSeconds as number);
    const mission = normalizeWorkplaceMission({
      ...raw,
      kind: "workplace-mission",
      version: WORKPLACE_MISSION_VERSION,
      workplaceTrack: normalizedTrack,
    });

    if (
      !mission ||
      hasDuplicateIds(mission.practice) ||
      hasDuplicateIds(mission.evidence)
    ) {
      throw new Error(`AI returned an incomplete mission at index ${index}`);
    }

    return { title, durationSeconds, mission };
  });
}