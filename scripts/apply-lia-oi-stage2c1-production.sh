#!/usr/bin/env bash
# =============================================================================
# CKR — Production apply LIA OI Stage 2C.1 (ADDITIVE DDL only)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

EXPECTED_REF="${CKR_EXPECTED_SUPABASE_REF:-qsnbkhzewqlutdznrppl}"
APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
MIG_DIR="${APP_DIR}/supabase/migrations"
STAGE2C1="${MIG_DIR}/20260811140000_lia_oi_stage2c1_enrichment.sql"

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

[[ "$ref" == "$EXPECTED_REF" ]] || die "Supabase project ref mismatch — abort (got ${ref})"
[[ -f "$STAGE2C1" ]] || die "Migration file missing: ${STAGE2C1}"

service_key="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}"
[[ -n "$service_key" ]] || die "No service role key in env"

column_exists() {
  local table="$1"
  local column="$2"
  local code
  code="$(
    curl -sS -o /tmp/ckr-oi-col.json -w '%{http_code}' \
      -H "apikey: ${service_key}" \
      -H "Authorization: Bearer ${service_key}" \
      -H "Accept: application/json" \
      "${url}/rest/v1/${table}?select=${column}&limit=1" || true
  )"
  [[ "$code" == "200" ]]
}

column_exists "lia_oi_opportunities" "source_adapter_id" || die "Stage 2C columns missing — apply 2C first"

if column_exists "lia_oi_opportunities" "matching_readiness" \
  && column_exists "lia_oi_opportunities" "data_quality_score"; then
  log_ok "Stage 2C.1 columns already present — skipping SQL"
  exit 0
fi

apply_via_management_api() {
  local token="${SUPABASE_ACCESS_TOKEN:-}"
  [[ -n "$token" ]] || return 1
  log_info "Execute SQL via Management API: $(basename "$STAGE2C1")"
  if ! python3 - "$STAGE2C1" "$token" "$EXPECTED_REF" <<'PY'
import json, sys, urllib.request, urllib.error
path, token, ref = sys.argv[1], sys.argv[2], sys.argv[3]
sql = open(path, "r", encoding="utf-8").read()
body = json.dumps({"query": sql}).encode()
req = urllib.request.Request(
  f"https://api.supabase.com/v1/projects/{ref}/database/query",
  data=body,
  headers={
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "ckr-stage2c1-apply/1.0",
  },
  method="POST",
)
try:
  with urllib.request.urlopen(req, timeout=300) as r:
    print("SQL_OK", r.status)
except urllib.error.HTTPError as e:
    err = e.read().decode("utf-8", "replace")[:500]
    print("SQL_FAIL", e.code, err, file=sys.stderr)
    sys.exit(1)
PY
  then
    return 1
  fi
  log_ok "Stage 2C.1 applied via Management API"
  return 0
}

APPLY_OK=0
if apply_via_management_api; then
  APPLY_OK=1
fi
[[ "${APPLY_OK}" -eq 1 ]] || die "Нужен SUPABASE_ACCESS_TOKEN для apply SQL"

for col in matching_readiness data_quality_score starting_price nmck support_amount; do
  column_exists "lia_oi_opportunities" "$col" || die "missing after apply: ${col}"
  log_ok "column present: ${col}"
done

log_ok "LIA OI Stage 2C.1 SQL apply complete"
