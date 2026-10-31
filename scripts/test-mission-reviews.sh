#!/usr/bin/env bash
# Exercise real PostgreSQL RLS and RPCs in an isolated, disposable cluster.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMP="$(mktemp -d)"
cleanup() {
  pg_ctl -D "$TEMP/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$TEMP"
}
trap cleanup EXIT
initdb -D "$TEMP/data" -A trust --no-locale >/dev/null
pg_ctl -D "$TEMP/data" -l "$TEMP/postgres.log" -o "-h '' -k $TEMP -p 55439" -w start >/dev/null
PSQL=(psql -X -v ON_ERROR_STOP=1 -h "$TEMP" -p 55439 -U "$(id -un)" -d postgres)
"${PSQL[@]}" -f "$ROOT/supabase/tests/mission_reviews_fixture.sql" >/dev/null
for migration in \
  20260830000000_add_mission_progress.sql \
  20260830010000_add_mission_evidence_storage.sql \
  20261031000000_add_supervisor_mission_reviews.sql; do
  "${PSQL[@]}" -f "$ROOT/supabase/migrations/$migration" >/dev/null
done
"${PSQL[@]}" -f "$ROOT/supabase/tests/mission_reviews.sql"
