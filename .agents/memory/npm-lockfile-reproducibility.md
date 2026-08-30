---
name: Reproducible npm lockfiles
description: Prevent npm dependency cleanup from producing a lockfile that builds locally but fails in clean production installs.
---

After moving dependencies between production and development scopes, validate the result with `npm ci --omit=dev` in an empty directory. If npm reports incompatible or missing transitive packages despite `npm install --package-lock-only` succeeding in the workspace, regenerate the lockfile from `package.json` in an empty directory.

**Why:** npm can reuse the existing hoisted `node_modules` layout when updating a lockfile. That produced a lockfile that passed the normal build but failed clean installation because multiple incompatible `picomatch` versions were recorded incorrectly.

**How to apply:** Use this check whenever dependency scopes or overrides change. Only adopt the regenerated lockfile after both a clean production install and the normal production build succeed.