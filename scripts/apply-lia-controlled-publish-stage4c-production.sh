#!/usr/bin/env bash
# Production apply Controlled Publish Stage 4C — gated.
# Does NOT enable Matching / Synthesis / Scheduler / mass publish.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

EXPECTED_REF="${CKR_EXPECTED_SUPABASE_REF:-qsnbkhzewqlutdznrppl}"
APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
MIG="${APP_DIR}/supabase/migrations/20260811220000_lia_controlled_publish_stage4c.sql"

require_root "$@"
ensure_env_or_stop
load_env_file "$CKR_ENV_FILE"

[[ "${CKR_CONFIRM_CONTROLLED_PUBLISH_APPLY:-}" == "YES" ]] || die "Set CKR_CONFIRM_CONTROLLED_PUBLISH_APPLY=YES"

url="${NEXT_PUBLIC_SUPABASE_URL%/}"
ref="$(python3 - <<PY
from urllib.parse import urlparse
import os
h=urlparse(os.environ["NEXT_PUBLIC_SUPABASE_URL"].strip().strip("\"'")).hostname or ""
print(h.split(".")[0])
PY
)"
[[ "$ref" == "$EXPECTED_REF" ]] || die "Supabase ref mismatch: got ${ref}"
[[ -f "$MIG" ]] || die "Missing $MIG"
service_key="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}"
[[ -n "$service_key" ]] || die "No service role key"

rest_code() {
  local path="$1"
  curl -sS -o /tmp/ckr-cp.json -w '%{http_code}' \
    -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
    "${url}/rest/v1/${path}" || true
}

# Already applied?
code="$(rest_code "lia_oi_publication_events?select=id&limit=1")"
if [[ "$code" == "200" || "$code" == "206" ]]; then
  col="$(rest_code "opportunities?select=source_type&limit=1")"
  if [[ "$col" == "200" || "$col" == "206" ]]; then
    log_ok "Stage 4C already applied — skip"
    exit 0
  fi
fi

token="${SUPABASE_ACCESS_TOKEN:-}"
[[ -n "$token" ]] || die "Need SUPABASE_ACCESS_TOKEN"

log_info "Apply $(basename "$MIG")"
python3 - "$MIG" "$token" "$EXPECTED_REF" <<'PY'
import json,sys,urllib.request
path,token,ref=sys.argv[1],sys.argv[2],sys.argv[3]
body=json.dumps({"query":open(path,encoding="utf-8").read()}).encode()
req=urllib.request.Request(
  f"https://api.supabase.com/v1/projects/{ref}/database/query",
  data=body,
  headers={
    "Authorization":f"Bearer {token}",
    "Content-Type":"application/json",
    "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  method="POST",
)
with urllib.request.urlopen(req,timeout=300) as r:
  print("SQL_OK", r.status)
PY

sleep 2
code="$(rest_code "lia_oi_publication_events?select=id&limit=1")"
[[ "$code" == "200" || "$code" == "206" ]] || die "missing lia_oi_publication_events (HTTP ${code})"
code="$(rest_code "opportunities?select=source_type,source_id,owner_edited_fields&limit=1")"
[[ "$code" == "200" || "$code" == "206" ]] || die "missing opportunities Stage 4C cols (HTTP ${code})"
code="$(rest_code "lia_oi_opportunities?select=publication_state,marketplace_opportunity_id&limit=1")"
[[ "$code" == "200" || "$code" == "206" ]] || die "missing lia_oi publication cols (HTTP ${code})"
code="$(rest_code "opportunity_categories?select=slug&slug=in.(support_program,procurement,auction_asset)")"
[[ "$code" == "200" || "$code" == "206" ]] || die "missing new categories"

log_ok "Stage 4C migration applied. No mass publish. Matching not enabled."
