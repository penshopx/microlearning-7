// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOtherReflectionDrafts, readReflectionDraft, reflectionDraftKey,
  removeReflectionDraft, writeReflectionDraft,
} from "@/lib/reflectionDraft";

const scope = { accountId: "account", courseId: "course", moduleId: "module" };
beforeEach(() => localStorage.clear());

describe("reflection draft storage", () => {
  it("stores only text, including an intentionally empty reflection", () => {
    writeReflectionDraft(scope, "");
    expect(JSON.parse(localStorage.getItem(reflectionDraftKey(scope))!)).toEqual({ version: 1, feedback: "" });
    expect(readReflectionDraft(scope)).toBe("");
  });
  it("keeps scopes distinct even when identifiers contain delimiters", () => {
    writeReflectionDraft({ ...scope, courseId: "x:y", moduleId: "z" }, "first");
    writeReflectionDraft({ ...scope, courseId: "x", moduleId: "y:z" }, "second");
    expect(localStorage.length).toBe(2);
    expect(readReflectionDraft(scope)).toBeNull();
  });
  it("removes malformed or incompatible drafts without applying them", () => {
    for (const raw of ["bad json", "null", '{"version":2,"feedback":"old"}', '{"version":1,"feedback":42}']) {
      localStorage.setItem(reflectionDraftKey(scope), raw);
      expect(readReflectionDraft(scope)).toBeNull();
      expect(localStorage.getItem(reflectionDraftKey(scope))).toBeNull();
    }
  });
  it("deletes only confirmed text and leaves a newer draft intact", () => {
    writeReflectionDraft(scope, "newer");
    removeReflectionDraft(scope, "older");
    expect(readReflectionDraft(scope)).toBe("newer");
    removeReflectionDraft(scope, "newer");
    expect(readReflectionDraft(scope)).toBeNull();
  });
  it("cleans account drafts without deleting unrelated browser data", () => {
    localStorage.setItem("unrelated", "keep");
    writeReflectionDraft(scope, "keep on refresh");
    writeReflectionDraft({ ...scope, accountId: "other" }, "remove");
    expect(clearOtherReflectionDrafts(scope.accountId)).toBe(true);
    expect(readReflectionDraft(scope)).toBe("keep on refresh");
    expect(localStorage.length).toBe(2);
    clearOtherReflectionDrafts(null);
    expect(localStorage.length).toBe(1);
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });
});
