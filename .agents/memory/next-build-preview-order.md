---
name: Next build and preview order
description: Prevent blank development previews after running a production build while the Next.js dev workflow is active.
---

Run the production build first, then restart the development workflow before validating the preview. Avoid treating a screenshot taken before that restart as an application regression.

**Why:** `next build` and `next dev` share the `.next` directory in this workspace. A production build can replace files expected by the running dev server, causing temporary page-module errors or a blank 500 preview even when the source and build are valid.

**How to apply:** After every production build, restart `Start application`, wait for it to become ready, and only then take screenshots or run browser checks.

Serialize clean dependency installation with app and test workflows; validate only after installation has finished.

**Why:** A clean install replaces `node_modules`. Already-running Node processes can report missing framework or test files during that replacement, even when those files exist again by the time they are inspected. Such errors alone do not prove a source-code regression.

**How to apply:** When multiple unrelated packages disappear from runtime logs after setup, first check whether an install is still running and whether the named files now resolve. Once the dependency tree is stable, restart affected workflows before evaluating application health.