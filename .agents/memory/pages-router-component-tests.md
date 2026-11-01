---
name: Pages Router component tests
description: Explains the non-obvious placement and transformer constraints for TSX component tests in this Next.js project.
---

Keep component tests outside Next.js Pages Router route directories, even when their names end in `.test.tsx`. Use the configured OXC JSX transform and happy-dom environment for TSX tests.

**Why:** Next treats colocated files as production routes, which can pull Vitest into the application bundle. The project’s preserved JSX setting requires an explicit OXC test transform, while jsdom conflicts with the enforced undici dependency override.

**How to apply:** Put new page/component tests in a non-route test directory and reuse the existing Vitest TSX configuration rather than adding a second browser-like environment.

For course-page interaction tests, wait for the authenticated viewer's data reload to settle before retaining editor elements or firing events.

**Why:** The initial anonymous render can be replaced immediately after the asynchronous auth lookup. An editor found during that render can become detached, making simulated input and blur events silently do nothing. Evidence uploads begun before the reload can also be invalidated by the save-context change, so waiting for the first visible upload prompt is unsafe.

**How to apply:** Stabilize the auth-dependent load in the test fixture before querying interactive elements; do not treat the first visible editor as proof that initialization is finished. Test this readiness barrier with separately controlled auth and reload promises, not longer timeouts.

Mock service responses at their actual public boundary, not at the shape the component happens to expect.

**Why:** A flat course mock previously hid a mismatch with the service's nested course/modules envelope: component tests passed while the real browser could not display the mission.

**How to apply:** Check service DTOs when maintaining fixtures. Browser isolation should intercept Supabase transport requests while leaving the real service adapters and Next assets intact.