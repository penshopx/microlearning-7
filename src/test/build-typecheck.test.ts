import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const nextConfig = readFileSync(path.join(root, "next.config.mjs"), "utf8");

describe("production type-check gate", () => {
  it("provides a standalone check that does not emit JavaScript", () => {
    expect(pkg.scripts.typecheck).toBe("tsc --noEmit");
  });

  it("keeps the security audit and stops before building if type checking fails", () => {
    expect(pkg.scripts.prebuild).toBe("npm run audit && npm run typecheck");
    expect(pkg.scripts.build).toBe("next build");
  });

  it("does not bypass Next.js type validation", () => {
    expect(nextConfig).not.toMatch(/ignoreBuildErrors\s*:\s*true/);
  });
});
