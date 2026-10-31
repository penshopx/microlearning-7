---
name: Reproducible npm lockfiles
description: Prevent npm dependency cleanup from producing a lockfile that builds locally but fails in clean production installs.
---

After moving dependencies between production and development scopes, validate the result with `npm ci --omit=dev` in an empty directory. If npm reports incompatible or missing transitive packages despite `npm install --package-lock-only` succeeding in the workspace, regenerate the lockfile from `package.json` in an empty directory.

**Why:** npm can reuse the existing hoisted `node_modules` layout when updating a lockfile. That produced a lockfile that passed the normal build but failed clean installation because multiple incompatible `picomatch` versions were recorded incorrectly.

**How to apply:** Use this check whenever dependency scopes or overrides change. Only adopt the regenerated lockfile after both a clean production install and the normal production build succeed.

Keep the high-severity audit gate active during post-merge recovery; repairing a blocked download is not sufficient proof that installation will succeed.

**Why:** The registry firewall and npm's advisory audit are independent checks. An allowed replacement package can install successfully while the root postinstall audit still rejects other dependencies. The install flag `--no-audit` does not disable an explicit audit in a lifecycle script.

**How to apply:** Re-run the real configured post-merge setup after dependency changes, rather than relying only on the package-update command. Report remaining moderate findings separately instead of describing a passing high-severity gate as a clean audit.