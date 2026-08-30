---
name: Next build and preview order
description: Prevent blank development previews after running a production build while the Next.js dev workflow is active.
---

Run the production build first, then restart the development workflow before validating the preview. Avoid treating a screenshot taken before that restart as an application regression.

**Why:** `next build` and `next dev` share the `.next` directory in this workspace. A production build can replace files expected by the running dev server, causing temporary page-module errors or a blank 500 preview even when the source and build are valid.

**How to apply:** After every production build, restart `Start application`, wait for it to become ready, and only then take screenshots or run browser checks.