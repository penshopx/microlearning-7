# Scheduled mission evidence cleanup

This worker runs on Supabase, not in a learner tab or a Next.js request process.
It survives application restarts and works while the web application is idle.
No shared/production resources are changed automatically by this fork.

## Activation after merge

1. Apply `20261106000000_scheduled_evidence_cleanup.sql` through the normal
   migration process (after the evidence lifecycle and health migrations).
2. Deploy `mission-evidence-cleanup` through the normal Supabase Edge Function
   release process. Keep JWT verification enabled. The runtime supplies
   `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; never expose them to the browser.
3. In the trusted project's Vault UI, configure `mission_cleanup_project_url`
   and `mission_cleanup_service_role_key` with the same project's URL and
   service-role key. Do not paste credentials into source, terminal commands,
   tickets, chat, or logs. These are operator-only settings.
4. Apply `supabase/schedules/mission-evidence-cleanup.sql` using the trusted
   database migration runner. The script fails if Vault configuration is missing
   and installs/updates one named cron job every five minutes. It requires
   Supabase Vault, pg_cron and pg_net. Do not point it at another environment.
5. Confirm the job runs, then check `/admin` for the aggregate pending count.
   The function returns only `attempted`, `deleted`, `remaining`, or a fixed
   safe error. HTTP 503 means retry on the next scheduled tick. Do not log SDK
   errors or queue rows: they can contain private paths.

Reapplying the schedule updates the same job, not a duplicate. To pause it:
`SELECT cron.unschedule('mission-evidence-cleanup');`
To resume, reapply the schedule script. Rotate the runtime and Vault key
together when rotating the project's service-role credential.

## Safety and recovery

- One database-backed lease lasts two minutes. Each Storage/RPC request times
  out after 20 seconds. No in-memory queue needs restoring after a restart.
- Each invocation claims at most 100 objects. Failed/interrupted batches wait
  five minutes before retry, allowing other objects their turn.
- Only garbage or expired staged objects are claimed. The 24-hour upload grace
  period remains unchanged; referenced and attached evidence is never claimed.
- Claiming irreversibly retires an object before the HTTP delete. A stale
  invocation cannot finish a newer worker's lease, nor resurrect a retired path.
- Storage deletion uses the provider API, never direct SQL deletion. The finish
  RPC checks actual `storage.objects` absence even if the delete response was
  lost, and keeps the tombstone. Outstanding files, not success claims or
  historical failure counters, drive aggregate recovery.
- Browser-reported failures remain advisory and separate from service-worker
  failures. Three spaced worker failures over ten minutes also raise the
  existing aggregate warning. Successful deletion clears the warning on the
  next health read without resetting history.
- If a worker dies after deleting bytes but before reporting, no file remains
  in the next candidate scan and the aggregate already recovers.

## Checks

`npm run test:integration:evidence` checks real PostgreSQL permissions, bounded
claims, grace periods, lease fencing, crash recovery, backoff/fairness, immutable
retirement, and aggregate failure/recovery in an isolated database.

`src/tests/evidence-cleanup-worker.test.ts` checks worker authorization, safe
responses, provider errors/lost responses, malformed claims, and no path leaks.

`npm run test:integration:evidence:storage` checks actual physical file deletion
through the local Supabase Storage API and preserves attached evidence. It needs
a Docker-capable runner; it never connects to the configured hosted database.
