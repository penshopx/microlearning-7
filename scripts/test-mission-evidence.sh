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
