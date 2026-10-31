#!/usr/bin/env bash
# Exercise durable AI auth incident RPCs against a disposable local PostgreSQL cluster.
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
if ! pg_ctl -D "$TEMP/data" -l "$TEMP/postgres.log" \
  -o "-h '' -k $TEMP -p 55440" -w start >/dev/null; then
  cat "$TEMP/postgres.log" >&2
  exit 1
fi
PSQL=(psql -X -v ON_ERROR_STOP=1 -h "$TEMP" -p 55440 -U "$(id -un)" -d postgres)
"${PSQL[@]}" -c "CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;" >/dev/null
"${PSQL[@]}" -c "GRANT USAGE ON SCHEMA public TO service_role;" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20261103000000_persist_ai_auth_incidents.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/tests/ai_auth_incidents.sql"

# Exercise row-lock serialization from multiple independent PostgreSQL sessions.
"${PSQL[@]}" -c "UPDATE public.ai_auth_incident_state SET failure_sequence = 0,
  recent_failure_times = '{}'::timestamptz[], incident_id = NULL,
  failure_count = NULL, started_at = NULL, last_failure_at = NULL WHERE singleton = TRUE;" >/dev/null
writers=8
failures_per_writer=6
pids=()
for writer in $(seq 1 "$writers"); do
  {
    for _ in $(seq 1 "$failures_per_writer"); do
      echo "SET ROLE service_role; SELECT public.record_ai_auth_failure(clock_timestamp()); RESET ROLE;"
    done
  } | "${PSQL[@]}" >"$TEMP/writer-$writer.log" 2>&1 &
  pids+=("$!")
done
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then
    cat "$TEMP"/writer-*.log >&2
    exit 1
  fi
done
expected=$((writers * failures_per_writer))
"${PSQL[@]}" -c "SELECT public.test_assert(
  (SELECT failure_sequence = $expected AND failure_count = $expected
    FROM public.ai_auth_incident_state WHERE singleton = TRUE),
  'all concurrent writers are counted atomically');" >/dev/null
pg_ctl -D "$TEMP/data" -m fast stop >/dev/null
if ! pg_ctl -D "$TEMP/data" -l "$TEMP/postgres.log" \
  -o "-h '' -k $TEMP -p 55440" -w start >/dev/null; then
  cat "$TEMP/postgres.log" >&2
  exit 1
fi
"${PSQL[@]}" -c "SELECT public.test_assert(
  (SELECT failure_sequence = $expected AND failure_count = $expected
    FROM public.ai_auth_incident_state WHERE singleton = TRUE),
  'the active incident survives a PostgreSQL restart');" >/dev/null
echo "PASS: $expected concurrent database writes are retained"
echo "PASS: active incident survives a database restart"
