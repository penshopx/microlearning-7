#!/usr/bin/env bash
# Database integration checks only; never connects to a remote Supabase project.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
for binary in initdb pg_ctl psql; do
  command -v "$binary" >/dev/null || {
    echo "Missing PostgreSQL binary: $binary (add PostgreSQL binaries to PATH)" >&2
    exit 1
  }
done

TEMP="$(mktemp -d)"
cleanup() {
  pg_ctl -D "$TEMP/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$TEMP"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
initdb -D "$TEMP/data" -A trust --no-locale >/dev/null
# A unique Unix socket directory allows concurrent runs without a TCP listener.
if ! pg_ctl -D "$TEMP/data" -l "$TEMP/postgres.log" \
  -o "-h '' -k $TEMP -p 55439" -w start >/dev/null; then
  cat "$TEMP/postgres.log" >&2
  exit 1
fi
PSQL=(psql -X -v ON_ERROR_STOP=1 -h "$TEMP" -p 55439 -U "$(id -un)" -d postgres)
"${PSQL[@]}" -f "$ROOT/supabase/tests/mission_reviews_fixture.sql" >/dev/null
for migration in \
  20260830000000_add_mission_progress.sql \
  20260830010000_add_mission_evidence_storage.sql \
  20261031000000_add_supervisor_mission_reviews.sql \
  20261104000000_preserve_evidence_on_partial_progress.sql; do
  "${PSQL[@]}" -f "$ROOT/supabase/migrations/$migration" >/dev/null
done
"${PSQL[@]}" -f "$ROOT/supabase/tests/mission_evidence.sql"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261101000000_add_supervisor_mission_reviews.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261102000000_mission_evidence_concurrency.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/tests/mission_evidence_concurrency.sql"
"${PSQL[@]}" -f "$ROOT/supabase/tests/mission_review_rls.sql"

# Real overlapping transactions (not just two snapshots in one connection).
for action in upload replace delete; do
  "${PSQL[@]}" -v action="$action" -f "$ROOT/supabase/tests/mission_evidence_race_setup.sql" >/dev/null
  "${PSQL[@]}" >"$TEMP/session-a.log" 2>&1 <<'SQL' &
BEGIN;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
SELECT public.test_race_save('a');
SELECT pg_sleep(0.4);
COMMIT;
SQL
  a=$!
  "${PSQL[@]}" >"$TEMP/session-b.log" 2>&1 <<'SQL' &
BEGIN;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
SELECT public.test_race_save('b');
COMMIT;
SQL
  b=$!
  if ! wait "$a" || ! wait "$b"; then
    cat "$TEMP/session-a.log" "$TEMP/session-b.log"; exit 1
  fi
  "${PSQL[@]}" -c "SELECT public.test_assert(
    (SELECT count(*) = 1 FROM public.test_race_results WHERE saved)
    AND (SELECT count(*) = 1 FROM public.test_race_results WHERE NOT saved),
    'overlapping $action has exactly one winner and one explicit conflict');" >/dev/null
  echo "PASS: overlapping two-connection $action"
done

# Cleanup observability uses the same profiles role as the existing admin API.
# Surrounding profile schema is not part of the minimal evidence fixture.
"${PSQL[@]}" -c "CREATE TABLE public.profiles(id UUID PRIMARY KEY, role TEXT DEFAULT 'user'); GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261105000000_evidence_cleanup_health.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/tests/mission_cleanup_health.sql"
node "$ROOT/scripts/test-mission-cleanup-concurrency.mjs" "$TEMP" 55439 "$(id -un)"
"${PSQL[@]}" >/dev/null <<'SQL'
DELETE FROM storage.objects WHERE name LIKE '%/cleanup-race-%';
DELETE FROM public.mission_evidence_objects WHERE storage_path LIKE '%/cleanup-race-%';
DELETE FROM public.profiles WHERE id IN (
 '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002');
DROP FUNCTION public.test_cleanup_race_setup(INTEGER), public.test_cleanup_race_assert(INTEGER, BOOLEAN);
DROP TABLE public.test_cleanup_foreign_snapshot;
SQL
"${PSQL[@]}" -c "CREATE ROLE service_role NOLOGIN BYPASSRLS; GRANT USAGE ON SCHEMA public TO service_role;" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261106000000_scheduled_evidence_cleanup.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/tests/mission_cleanup_worker.sql"

# Separate committed connections model a process disappearing after claim.
"${PSQL[@]}" >/dev/null <<'SQL'
DELETE FROM storage.objects WHERE bucket_id = 'mission-evidence';
INSERT INTO storage.objects(bucket_id, name) VALUES
 ('mission-evidence', '00000000-0000-4000-8000-000000000002/restart-worker');
UPDATE public.mission_evidence_objects SET expires_at = now() - interval '1 hour'
 WHERE storage_path LIKE '%/restart-worker';
CREATE TABLE public.test_cleanup_restart(path TEXT);
GRANT ALL ON public.test_cleanup_restart TO service_role;
SET ROLE service_role;
INSERT INTO public.test_cleanup_restart SELECT storage_path
 FROM public.claim_mission_cleanup_batch('00000000-0000-4000-8000-000000000020');
SQL
"${PSQL[@]}" >/dev/null <<'SQL'
SELECT public.test_assert((SELECT count(*) = 1 FROM public.test_cleanup_restart),
 'claim survives connection/process exit');
SET ROLE service_role;
SELECT public.test_assert((SELECT count(*) = 0 FROM public.claim_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000021')), 'persisted lease blocks early restart');
RESET ROLE;
UPDATE public.mission_cleanup_worker SET lease_until = now() - interval '1 second';
UPDATE public.mission_evidence_objects SET cleanup_next_attempt_at = now() - interval '1 second'
 WHERE storage_path IN (SELECT path FROM public.test_cleanup_restart);
SET ROLE service_role;
SELECT public.test_assert((SELECT count(*) = 1 FROM public.claim_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000022')), 'new process reclaims after expiry');
SQL
"${PSQL[@]}" >/dev/null <<'SQL'
-- Model successful provider deletion followed by loss of its HTTP response.
DELETE FROM storage.objects WHERE name IN (SELECT path FROM public.test_cleanup_restart);
SET ROLE service_role;
SELECT public.test_assert((public.finish_mission_cleanup_batch(
 '00000000-0000-4000-8000-000000000022',
 ARRAY(SELECT path FROM public.test_cleanup_restart))->>'deleted')::int = 1,
 'new connection confirms durable Storage recovery');
RESET ROLE;
DROP TABLE public.test_cleanup_restart;
SQL
echo "PASS: cleanup lease and recovery survive separate worker connections"
