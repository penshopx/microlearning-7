---
name: Pages Router component tests
description: Explains the non-obvious placement and transformer constraints for TSX component tests in this Next.js project.
---

Keep component tests outside Next.js Pages Router route directories, even when their names end in `.test.tsx`. Use the configured OXC JSX transform and happy-dom environment for TSX tests.

**Why:** Next treats colocated files as production routes, which can pull Vitest into the application bundle. The project’s preserved JSX setting requires an explicit OXC test transform, while jsdom conflicts with the enforced undici dependency override.

**How to apply:** Put new page/component tests in a non-route test directory and reuse the existing Vitest TSX configuration rather than adding a second browser-like environment.