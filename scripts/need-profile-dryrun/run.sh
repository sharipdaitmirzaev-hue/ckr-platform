#!/usr/bin/env bash
# Disposable Postgres dry-run for Need Profile Stage 4A migration.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${CKR_NEED_DRYRUN_PORT:-55433}"
DATA_DIR="${CKR_NEED_DRYRUN_DATA:-/tmp/ckr-need-dryrun-pgdata}"
LOG_FILE="/tmp/ckr-need-dryrun-pg.log"
PG_BIN="${CKR_PG_BIN:-/usr/lib/postgresql/16/bin}"

log() { printf '[need-dryrun] %s\n' "$*"; }
die() { printf '[need-dryrun] ERROR: %s\n' "$*" >&2; exit 1; }

command -v psql >/dev/null || die "psql required"
[[ -x "${PG_BIN}/initdb" ]] || die "Postgres binaries missing"

cleanup() {
  "${PG_BIN}/pg_ctl" -D "$DATA_DIR" -m fast stop >/dev/null 2>&1 || true
  rm -rf "$DATA_DIR"
}
trap cleanup EXIT

rm -rf "$DATA_DIR"
log "Starting local disposable Postgres on 127.0.0.1:${PORT}"
"${PG_BIN}/initdb" -D "$DATA_DIR" --auth-local=trust --auth-host=trust -U postgres >/dev/null
{
  echo "port = ${PORT}"
  echo "listen_addresses = '127.0.0.1'"
  echo "unix_socket_directories = '${DATA_DIR}'"
} >> "$DATA_DIR/postgresql.conf"
"${PG_BIN}/pg_ctl" -D "$DATA_DIR" -l "$LOG_FILE" -o "-p ${PORT} -k ${DATA_DIR}" start >/dev/null

PSQL=(psql -h 127.0.0.1 -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1)
for i in $(seq 1 40); do
  "${PSQL[@]}" -c 'SELECT 1' >/dev/null 2>&1 && break
  sleep 0.25
  [[ "$i" -eq 40 ]] && die "Postgres not ready"
done
"${PSQL[@]}" -c "CREATE DATABASE need_profile_dryrun;" >/dev/null
PSQL=(psql -h 127.0.0.1 -p "$PORT" -U postgres -d need_profile_dryrun -v ON_ERROR_STOP=1)

log "Bootstrap"
"${PSQL[@]}" -f "$ROOT/scripts/lia-oi-dryrun/00_supabase_compat_bootstrap.sql" >/dev/null
log "Baseline profiles/roles/orgs helpers"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20260325120000_profiles_and_roles.sql" >/dev/null
# is_org_member may come from partners migration — stub if missing
"${PSQL[@]}" -c "
CREATE OR REPLACE FUNCTION public.is_org_member(org uuid, uid uuid)
RETURNS boolean LANGUAGE sql STABLE AS \$\$ SELECT false; \$\$;
CREATE OR REPLACE FUNCTION public.is_operator(uid uuid)
RETURNS boolean LANGUAGE sql STABLE AS \$\$ SELECT false; \$\$;
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id)
);
" >/dev/null

log "Apply need_profiles Stage 4A"
"${PSQL[@]}" -f "$ROOT/supabase/migrations/20260811180000_need_profiles_stage4a.sql" >/dev/null

log "Validate"
"${PSQL[@]}" -c "
DO \$\$
BEGIN
  IF to_regclass('public.need_profiles') IS NULL THEN
    RAISE EXCEPTION 'missing need_profiles';
  END IF;
  IF to_regclass('public.need_profile_intent_catalog') IS NULL THEN
    RAISE EXCEPTION 'missing catalog';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='need_profiles' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS not enabled';
  END IF;
END \$\$;
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-4111-8111-111111111111', 'dryrun@example.com')
ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, full_name) VALUES
  ('11111111-1111-4111-8111-111111111111', 'Dryrun User')
ON CONFLICT DO NOTHING;
INSERT INTO public.need_profiles (intent_type, title, owner_type, owner_id, status, visibility, created_by)
VALUES ('INVEST', 'dryrun', 'user', '11111111-1111-4111-8111-111111111111', 'ACTIVE', 'CKR_ONLY', '11111111-1111-4111-8111-111111111111');
SELECT 'need_profile_dryrun_ok' AS status;
"

log "OK"
