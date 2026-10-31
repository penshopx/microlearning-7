import { describe, expect, it } from "vitest";
import { formatTimestamp, isCoachFeedbackComplete } from "./supervisorReview";

describe("supervisor review helpers", () => {
  it("requires all three focused coaching fields", () => {
    expect(isCoachFeedbackComplete({
      glowFeedback: "Bagus",
      growFeedback: "Perjelas",
      nextSteps: "Coba lagi",
    })).toBe(true);
    expect(isCoachFeedbackComplete({
      glowFeedback: "Bagus",
      growFeedback: "  ",
      nextSteps: "Coba lagi",
    })).toBe(false);
    expect(isCoachFeedbackComplete({
      glowFeedback: "ok",
      growFeedback: "Naikkan",
      nextSteps: "Lanjut",
    })).toBe(false);
  });

  it("formats media timestamps consistently and safely", () => {
    expect(formatTimestamp(0)).toBe("00:00");
    expect(formatTimestamp(59.9)).toBe("00:59");
    expect(formatTimestamp(125)).toBe("02:05");
    expect(formatTimestamp(-2)).toBe("00:00");
    expect(formatTimestamp(Number.NaN)).toBe("00:00");
  });
});
