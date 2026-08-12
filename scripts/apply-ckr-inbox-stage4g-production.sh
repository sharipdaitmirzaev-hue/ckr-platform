#!/usr/bin/env bash
# Production apply: Stage 4G CKR Inbox (additive only)
# Applies ONLY: supabase/migrations/20260812180000_ckr_inbox_stage4g.sql
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

EXPECTED_REF="${CKR_EXPECTED_SUPABASE_REF:-qsnbkhzewqlutdznrppl}"
APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
MIG="${APP_DIR}/supabase/migrations/20260812180000_ckr_inbox_stage4g.sql"

require_root "$@"
ensure_env_or_stop
load_env_file "$CKR_ENV_FILE"

[[ "${CKR_CONFIRM_CKR_INBOX_4G_APPLY:-}" == "YES" ]] || die "Set CKR_CONFIRM_CKR_INBOX_4G_APPLY=YES"

url="${NEXT_PUBLIC_SUPABASE_URL%/}"
ref="$(python3 - <<PY
from urllib.parse import urlparse
import os
h=urlparse(os.environ["NEXT_PUBLIC_SUPABASE_URL"].strip().strip("\"'")).hostname or ""
print(h.split(".")[0])
PY
)"
[[ "$ref" == "$EXPECTED_REF" ]] || die "Supabase ref mismatch: got $ref"
[[ -f "$MIG" ]] || die "Missing $MIG — deploy code first or copy migration"

service_key="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}"
[[ -n "$service_key" ]] || die "No service role key"

# Skip if already applied
if curl -sS -o /tmp/ckr-4g-probe.json -w '%{http_code}' \
  -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
  "${url}/rest/v1/ckr_requests?select=id&limit=1" | grep -q '^200$'; then
  log_ok "ckr_requests already present — skip apply"
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
try:
  with urllib.request.urlopen(req, timeout=300) as r:
    print("SQL_OK", r.status, r.read()[:800])
except urllib.error.HTTPError as e:
  print("SQL_FAIL", e.code, e.read()[:2000].decode("utf-8", "replace"))
  raise
PY

  code="$(curl -sS -o /tmp/ckr-4g-probe.json -w '%{http_code}' \
  -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
  "${url}/rest/v1/ckr_requests?select=id&limit=1" || true)"

# PostgREST may need a schema reload after CREATE TABLE
if [[ "$code" != "200" ]]; then
  log_info "Reloading PostgREST schema cache"
  python3 - "$token" "$EXPECTED_REF" <<'PY'
import json, sys, urllib.request
token, ref = sys.argv[1], sys.argv[2]
body = json.dumps({"query": "NOTIFY pgrst, 'reload schema';"}).encode()
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
with urllib.request.urlopen(req, timeout=60) as r:
  print("RELOAD", r.status)
PY
  sleep 2
  code="$(curl -sS -o /tmp/ckr-4g-probe.json -w '%{http_code}' \
    -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
    "${url}/rest/v1/ckr_requests?select=id&limit=1" || true)"
fi

[[ "$code" == "200" ]] || die "ckr_requests missing after apply (HTTP $code)"

code2="$(curl -sS -o /tmp/ckr-4g-comments.json -w '%{http_code}' \
  -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
  "${url}/rest/v1/ckr_request_comments?select=id&limit=1" || true)"
[[ "$code2" == "200" ]] || die "ckr_request_comments missing (HTTP $code2)"

code3="$(curl -sS -o /tmp/ckr-4g-events.json -w '%{http_code}' \
  -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
  "${url}/rest/v1/ckr_request_events?select=id&limit=1" || true)"
[[ "$code3" == "200" ]] || die "ckr_request_events missing (HTTP $code3)"

log_ok "Stage 4G migration applied"
