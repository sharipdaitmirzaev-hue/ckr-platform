#!/usr/bin/env bash
# Disposable Postgres dry-run for Business Graph Stage 3A migration.
# Prefers local initdb cluster; falls back to Docker if available.
# Does NOT touch production.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${CKR_BG_DRYRUN_PORT:-55432}"
DATA_DIR="${CKR_BG_DRYRUN_DATA:-/tmp/ckr-bg-dryrun-pgdata}"
LOG_FILE="/tmp/ckr-bg-dryrun-pg.log"
PG_BIN="${CKR_PG_BIN:-/usr/lib/postgresql/16/bin}"
NAME="ckr-bg-dryrun"
MODE=""

log() { printf '[bg-dryrun] %s\n' "$*"; }
die() { printf '[bg-dryrun] ERROR: %s\n' "$*" >&2; exit 1; }

command -v psql >/dev/null || die "psql required"
[[ -x "${PG_BIN}/initdb" && -x "${PG_BIN}/pg_ctl" && -x "${PG_BIN}/postgres" ]] || die "Postgres 16 binaries not found in ${PG_BIN}"

cleanup() {
  if [[ "$MODE" == "local" ]]; then
    "${PG_BIN}/pg_ctl" -D "$DATA_DIR" -m fast stop >/dev/null 2>&1 || true
    rm -rf "$DATA_DIR"
  elif [[ "$MODE" == "docker" ]]; then
    docker rm -f "$NAME" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

start_local() {
  MODE="local"
  rm -rf "$DATA_DIR"
  log "Starting local disposable Postgres on 127.0.0.1:${PORT}"
  "${PG_BIN}/initdb" -D "$DATA_DIR" --auth-local=trust --auth-host=trust -U postgres >/dev/null
  {
    echo "port = ${PORT}"
    echo "listen_addresses = '127.0.0.1'"
    echo "unix_socket_directories = '${DATA_DIR}'"
  } >> "$DATA_DIR/postgresql.conf"
  "${PG_BIN}/pg_ctl" -D "$DATA_DIR" -l "$LOG_FILE" -o "-p ${PORT} -k ${DATA_DIR}" start >/dev/null
  export PGPASSWORD=""
  PSQL=(psql -h 127.0.0.1 -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1)
  for i in $(seq 1 40); do
    if "${PSQL[@]}" -c 'SELECT 1' >/dev/null 2>&1; then
      break
    fi
    sleep 0.25
    if [[ "$i" -eq 40 ]]; then
      die "local Postgres did not become ready; see ${LOG_FILE}"
    fi
  done
  "${PSQL[@]}" -c "CREATE DATABASE business_graph_dryrun;" >/dev/null
  PSQL=(psql -h 127.0.0.1 -p "$PORT" -U postgres -d business_graph_dryrun -v ON_ERROR_STOP=1)
}

start_docker() {
  MODE="docker"
  command -v docker >/dev/null || return 1
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  log "Starting Docker Postgres on 127.0.0.1:${PORT}"
  docker run -d --name "$NAME" \
    -e POSTGRES_PASSWORD=bg_dryrun_pass \
    -e POSTGRES_DB=business_graph_dryrun \
    -p "127.0.0.1:${PORT}:5432" \
    postgres:16-alpine >/dev/null || return 1
  export PGPASSWORD=bg_dryrun_pass
  PSQL=(psql -h 127.0.0.1 -p "$PORT" -U postgres -d business_graph_dryrun -v ON_ERROR_STOP=1)
  for i in $(seq 1 40); do
    if "${PSQL[@]}" -c 'SELECT 1' >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  return 1
}

if ! start_local; then
  log "Local initdb failed — trying Docker"
  start_docker || die "Could not start disposable Postgres"
fi

log "Bootstrap auth/roles"
"${PSQL[@]}" -f "$ROOT/scripts/lia-oi-dryrun/00_supabase_compat_bootstrap.sql" >/dev/null

log "Baseline is_admin"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20260325120000_profiles_and_roles.sql" >/dev/null

log "Apply business_graph Stage 3A migration"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20260811160000_business_graph_stage3a.sql" >/dev/null

log "Validate schema/RLS"
"${PSQL[@]}" -f "$ROOT/scripts/business-graph-dryrun/validate_schema_rls.sql"

log "OK — migration dry-run passed"
