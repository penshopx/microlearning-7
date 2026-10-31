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
  20261031000000_add_supervisor_mission_reviews.sql; do
  "${PSQL[@]}" -f "$ROOT/supabase/migrations/$migration" >/dev/null
done
"${PSQL[@]}" -f "$ROOT/supabase/tests/mission_evidence.sql"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261101000000_add_supervisor_mission_reviews.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261102000000_mission_evidence_concurrency.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/tests/mission_evidence_concurrency.sql"

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
