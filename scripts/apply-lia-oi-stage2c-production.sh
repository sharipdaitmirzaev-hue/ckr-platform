#!/usr/bin/env bash
# =============================================================================
# CKR — Production apply LIA OI Stage 2C (ADDITIVE DDL only)
#
# Требует ОДИН из вариантов (не печатает секреты):
#   export SUPABASE_ACCESS_TOKEN=...          # предпочтительно (backup + SQL API)
#   или
#   export SUPABASE_DB_PASSWORD=...           # прямой psql к production DB
#
# Использование на сервере:
#   cd /var/www/ckr-platform
#   sudo -E ./scripts/apply-lia-oi-stage2c-production.sh
#
# НЕ трогает public.opportunities. НЕ делает DROP. Только ADD COLUMN / INDEX IF NOT EXISTS.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

EXPECTED_REF="${CKR_EXPECTED_SUPABASE_REF:-qsnbkhzewqlutdznrppl}"
APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
MIG_DIR="${APP_DIR}/supabase/migrations"
STAGE2C="${MIG_DIR}/20260811130000_lia_oi_stage2c_sources.sql"

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

[[ -f "$STAGE2C" ]] || die "Migration file missing: ${STAGE2C}"

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

column_exists() {
  local table="$1"
  local column="$2"
  local code
  code="$(
    curl -sS -o /tmp/ckr-oi-col.json -w '%{http_code}' \
      -H "apikey: ${service_key}" \
      -H "Authorization: Bearer ${service_key}" \
      -H "Accept: application/json" \
      -H "Prefer: count=exact" \
      "${url}/rest/v1/${table}?select=${column}&limit=1" || true
  )"
  [[ "$code" == "200" ]]
}

log_info "Pre-check: Stage 2B base table present?"
has_table "lia_oi_opportunities" || die "lia_oi_opportunities missing — apply Stage 2B first"
has_table "lia_oi_opportunity_changes" || die "lia_oi_opportunity_changes missing — apply Stage 2B first"

if column_exists "lia_oi_opportunities" "source_adapter_id" \
  && column_exists "lia_oi_opportunities" "deadline_at" \
  && column_exists "lia_oi_opportunities" "is_official_source"; then
  log_ok "Stage 2C columns already present — skipping SQL"
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
  psql "host=${db_host} port=${db_port} dbname=${db_name} user=${db_user} sslmode=require" \
    -v ON_ERROR_STOP=1 -f "$STAGE2C"
  log_ok "Stage 2C applied via psql"
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

  log_info "Execute SQL file via Management API: $(basename "$STAGE2C")"
  python3 - "$STAGE2C" "$token" "$EXPECTED_REF" <<'PY'
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
  log_ok "Stage 2C applied via Management API"
}

if apply_via_management_api; then
  :
elif apply_via_psql; then
  :
else
  die "Нужен SUPABASE_ACCESS_TOKEN или SUPABASE_DB_PASSWORD для apply SQL"
fi

log_info "Post-check Stage 2C columns"
for col in opportunity_type source_adapter_id source_confidence is_official_source deadline_at days_remaining; do
  if column_exists "lia_oi_opportunities" "$col"; then
    log_ok "column present: ${col}"
  else
    die "missing after apply: lia_oi_opportunities.${col}"
  fi
done

if has_table "opportunities"; then
  log_ok "public.opportunities still present (untouched catalog)"
fi

log_ok "LIA OI Stage 2C SQL apply complete"
echo
echo "Next: deploy Stage 2C code with LIA_OI_STORE=supabase and restart ckr."
