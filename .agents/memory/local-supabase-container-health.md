---
name: Local Supabase container health
description: A Docker limitation observed while running Supabase's local integration stack in this Replit environment.
---

The Replit Docker daemon may start the local Supabase PostgreSQL container, but
its health check can fail with `OCI runtime exec failed` / `setns` before tests
run. In that environment, further health-check retries do not diagnose SQL or
Storage API behavior.

**Why:** The container can log that PostgreSQL is ready while Docker cannot
execute the health-check process inside it. This is a runtime limitation rather
than evidence that a migration or application request failed.

**How to apply:** Keep integration tests isolated and locally runnable, but
report this exact limitation when verification is blocked. Validate the real
HTTP Storage path in a Docker-enabled runner rather than substituting a mocked
Storage endpoint or a hosted production database.
