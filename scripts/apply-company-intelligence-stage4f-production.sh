#!/usr/bin/env bash
# Production apply: Stage 4F Company Intelligence (additive only)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

EXPECTED_REF="${CKR_EXPECTED_SUPABASE_REF:-qsnbkhzewqlutdznrppl}"
APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
MIG="${APP_DIR}/supabase/migrations/20260811230000_company_intelligence_stage4f.sql"

require_root "$@"
ensure_env_or_stop
load_env_file "$CKR_ENV_FILE"

[[ "${CKR_CONFIRM_COMPANY_INTELLIGENCE_4F_APPLY:-}" == "YES" ]] || die "Set CKR_CONFIRM_COMPANY_INTELLIGENCE_4F_APPLY=YES"

url="${NEXT_PUBLIC_SUPABASE_URL%/}"
ref="$(python3 - <<PY
from urllib.parse import urlparse
import os
h=urlparse(os.environ["NEXT_PUBLIC_SUPABASE_URL"].strip().strip("\"'")).hostname or ""
print(h.split(".")[0])
PY
)"
[[ "$ref" == "$EXPECTED_REF" ]] || die "Supabase ref mismatch: got $ref"
[[ -f "$MIG" ]] || die "Missing $MIG"

service_key="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}"
[[ -n "$service_key" ]] || die "No service role key"

# Skip if already applied
if curl -sS -o /tmp/ckr-4f-probe.json -w '%{http_code}' \
  -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
  "${url}/rest/v1/organization_events?select=id&limit=1" | grep -q '^200$'; then
  log_ok "organization_events already present — skip apply"
  exit 0
fi

token="${SUPABASE_ACCESS_TOKEN:-}"
[[ -n "$token" ]] || die "Need SUPABASE_ACCESS_TOKEN"

log_info "Apply $(basename "$MIG")"
python3 - "$MIG" "$token" "$EXPECTED_REF" <<'PY'
import json, sys, urllib.request
path, token, ref = sys.argv[1], sys.argv[2], sys.argv[3]
body = json.dumps({"query": open(path, encoding="utf-8").read()}).encode()
req = urllib.request.Request(
  f"https://api.supabase.com/v1/projects/{ref}/database/query",
  data=body,
  headers={
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  method="POST",
)
with urllib.request.urlopen(req, timeout=300) as r:
  print("SQL_OK", r.status, r.read()[:400])
PY

code="$(curl -sS -o /tmp/ckr-4f-probe.json -w '%{http_code}' \
  -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
  "${url}/rest/v1/organization_events?select=id&limit=1" || true)"
[[ "$code" == "200" ]] || die "organization_events missing after apply (HTTP $code)"

# column probe
code2="$(curl -sS -o /tmp/ckr-4f-org.json -w '%{http_code}' \
  -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
  "${url}/rest/v1/organizations?select=id,legal_name,inn,is_listed&limit=1" || true)"
[[ "$code2" == "200" ]] || die "4F org columns missing (HTTP $code2)"
log_ok "Stage 4F migration applied"
