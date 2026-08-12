#!/usr/bin/env bash
# Production apply: hotfix organization create RLS
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

EXPECTED_REF="${CKR_EXPECTED_SUPABASE_REF:-qsnbkhzewqlutdznrppl}"
APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
MIG="${APP_DIR}/supabase/migrations/20260812150000_hotfix_org_create_rls.sql"

require_root "$@"
ensure_env_or_stop
load_env_file "$CKR_ENV_FILE"

[[ "${CKR_CONFIRM_ORG_CREATE_RLS_HOTFIX:-}" == "YES" ]] || die "Set CKR_CONFIRM_ORG_CREATE_RLS_HOTFIX=YES"

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
  print("SQL_OK", r.status, r.read()[:500])
PY

log_info "Verify RPC exists via REST"
service_key="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}"
code="$(curl -sS -o /tmp/ckr-org-rpc.json -w '%{http_code}' \
  -X POST \
  -H "apikey: ${service_key}" \
  -H "Authorization: Bearer ${service_key}" \
  -H "Content-Type: application/json" \
  -d '{"p_name":"__probe_should_fail_unauth_path__"}' \
  "${url}/rest/v1/rpc/create_organization_with_owner" || true)"
# service_role may succeed or fail auth.uid null — either means RPC is registered
[[ "$code" != "404" ]] || die "RPC create_organization_with_owner not found (HTTP $code)"
log_ok "RPC reachable (HTTP $code)"
log_ok "Hotfix SQL applied"
