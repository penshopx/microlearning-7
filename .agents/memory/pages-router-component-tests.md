---
name: Pages Router component tests
description: Explains the non-obvious placement and transformer constraints for TSX component tests in this Next.js project.
---

Keep component tests outside Next.js Pages Router route directories, even when their names end in `.test.tsx`. Use the configured OXC JSX transform and happy-dom environment for TSX tests.

**Why:** Next treats colocated files as production routes, which can pull Vitest into the application bundle. The project’s preserved JSX setting requires an explicit OXC test transform, while jsdom conflicts with the enforced undici dependency override.

**How to apply:** Put new page/component tests in a non-route test directory and reuse the existing Vitest TSX configuration rather than adding a second browser-like environment.

For course-page interaction tests, wait for the authenticated viewer's data reload to settle before retaining editor elements or firing events.

**Why:** The initial anonymous render can be replaced immediately after the asynchronous auth lookup. An editor found during that render can become detached, making simulated input and blur events silently do nothing.

**How to apply:** Stabilize the auth-dependent load in the test fixture before querying interactive elements; do not treat the first visible editor as proof that initialization is finished.