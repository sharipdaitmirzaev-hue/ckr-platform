#!/usr/bin/env bash
# =============================================================================
# CKR — Production apply LIA OI Stage 1 + Stage 2B (DDL)
#
# Требует ОДИН из вариантов (не печатает секреты):
#   export SUPABASE_ACCESS_TOKEN=...          # предпочтительно (backup + SQL API)
#   или
#   export SUPABASE_DB_PASSWORD=...           # прямой psql к production DB
#
# Использование на сервере:
#   cd /var/www/ckr-platform
#   sudo -E ./scripts/apply-lia-oi-stage2b-production.sh
#
# НЕ трогает public.opportunities. НЕ делает DROP данных.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

EXPECTED_REF="${CKR_EXPECTED_SUPABASE_REF:-qsnbkhzewqlutdznrppl}"
APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
MIG_DIR="${APP_DIR}/supabase/migrations"
STAGE1="${MIG_DIR}/20260810220000_lia_oi_stage1.sql"
STAGE2B="${MIG_DIR}/20260811083000_lia_oi_stage2b.sql"

require_root "$@"
ensure_env_or_stop
load_env_file "$CKR_ENV_FILE"

url="${NEXT_PUBLIC_SUPABASE_URL%/}"
ref="$(python3 - <<PY
from urllib.parse import urlparse
import os
h=urlparse(os.environ["NEXT_PUBLIC_SUPABASE_URL"].strip().strip("\"'")).hostname or ""
print(h.split(".")[0])
PY
)"

log_info "Expected Supabase ref: ${EXPECTED_REF}"
log_info "Configured Supabase ref: ${ref}"
[[ "$ref" == "$EXPECTED_REF" ]] || die "Supabase project ref mismatch — abort (got ${ref})"

[[ -f "$STAGE1" && -f "$STAGE2B" ]] || die "Migration files missing in ${MIG_DIR}"

service_key="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}"
[[ -n "$service_key" ]] || die "No service role key in env"

has_table() {
  local table="$1"
  local code
  code="$(
    curl -sS -o /tmp/ckr-oi-tbl.json -w '%{http_code}' \
      -H "apikey: ${service_key}" \
      -H "Authorization: Bearer ${service_key}" \
      -H "Accept: application/json" \
      "${url}/rest/v1/${table}?select=*&limit=1" || true
  )"
  [[ "$code" == "200" ]]
}

log_info "Pre-check: lia_oi_opportunities present?"
if has_table "lia_oi_opportunities"; then
  STAGE1_APPLIED=1
  log_ok "Stage 1 tables already present"
else
  STAGE1_APPLIED=0
  log_info "Stage 1 tables absent — will apply Stage 1"
fi

if has_table "lia_oi_opportunity_changes"; then
  STAGE2B_APPLIED=1
  log_ok "Stage 2B tables already present"
else
  STAGE2B_APPLIED=0
  log_info "Stage 2B tables absent — will apply Stage 2B"
fi

if [[ "${STAGE1_APPLIED}" -eq 1 && "${STAGE2B_APPLIED}" -eq 1 ]]; then
  log_ok "Both Stage 1 and Stage 2B already applied — skipping SQL"
  exit 0
fi

apply_via_psql() {
  local db_pass="${SUPABASE_DB_PASSWORD:-}"
  [[ -n "$db_pass" ]] || return 1
  local db_host="${SUPABASE_DB_HOST:-db.${EXPECTED_REF}.supabase.co}"
  local db_user="${SUPABASE_DB_USER:-postgres}"
  local db_name="${SUPABASE_DB_NAME:-postgres}"
  local db_port="${SUPABASE_DB_PORT:-5432}"
  log_info "Applying via psql to ${db_host} (password from env, not printed)"
  export PGPASSWORD="$db_pass"
  if [[ "${STAGE1_APPLIED}" -eq 0 ]]; then
    psql "host=${db_host} port=${db_port} dbname=${db_name} user=${db_user} sslmode=require" \
      -v ON_ERROR_STOP=1 -f "$STAGE1"
    log_ok "Stage 1 applied"
  fi
  if [[ "${STAGE2B_APPLIED}" -eq 0 ]]; then
    psql "host=${db_host} port=${db_port} dbname=${db_name} user=${db_user} sslmode=require" \
      -v ON_ERROR_STOP=1 -f "$STAGE2B"
    log_ok "Stage 2B applied"
  fi
}

apply_via_management_api() {
  local token="${SUPABASE_ACCESS_TOKEN:-}"
  [[ -n "$token" ]] || return 1
  log_info "Creating database backup via Management API (best-effort)"
  curl -sS -o /tmp/ckr-oi-backup.json -w '%{http_code}' \
    -X POST "https://api.supabase.com/v1/projects/${EXPECTED_REF}/database/backups" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{}' >/tmp/ckr-oi-backup.code || true
  log_info "Backup API HTTP $(cat /tmp/ckr-oi-backup.code)"

  run_sql_file() {
    local file="$1"
    local name
    name="$(basename "$file")"
    log_info "Execute SQL file via Management API: ${name}"
    python3 - "$file" "$token" "$EXPECTED_REF" <<'PY'
import json, sys, urllib.request
path, token, ref = sys.argv[1], sys.argv[2], sys.argv[3]
sql = open(path, "r", encoding="utf-8").read()
body = json.dumps({"query": sql}).encode()
req = urllib.request.Request(
  f"https://api.supabase.com/v1/projects/{ref}/database/query",
  data=body,
  headers={
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
  },
  method="POST",
)
with urllib.request.urlopen(req, timeout=300) as r:
  print("SQL_OK", r.status)
PY
  }

  if [[ "${STAGE1_APPLIED}" -eq 0 ]]; then
    run_sql_file "$STAGE1"
    log_ok "Stage 1 applied"
  fi
  if [[ "${STAGE2B_APPLIED}" -eq 0 ]]; then
    run_sql_file "$STAGE2B"
    log_ok "Stage 2B applied"
  fi
}

if apply_via_management_api; then
  :
elif apply_via_psql; then
  :
else
  die "Нужен SUPABASE_ACCESS_TOKEN или SUPABASE_DB_PASSWORD для apply SQL"
fi

log_info "Post-check tables"
for t in lia_oi_search_runs lia_oi_opportunities lia_oi_opportunity_changes lia_oi_opportunity_events; do
  if has_table "$t"; then
    log_ok "present: $t"
  else
    die "missing after apply: $t"
  fi
done

if has_table "opportunities"; then
  log_ok "public.opportunities still present (untouched catalog)"
fi

log_ok "LIA OI Stage 1/2B SQL apply complete"
echo
echo "Next: deploy Stage 2B code with LIA_OI_STORE=memory, smoke app,"
echo "then set LIA_OI_STORE=supabase and restart ckr."
