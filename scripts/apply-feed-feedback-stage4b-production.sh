#!/usr/bin/env bash
# Production apply Feed feedback Stage 4B — gated. Does NOT enable Matching.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

EXPECTED_REF="${CKR_EXPECTED_SUPABASE_REF:-qsnbkhzewqlutdznrppl}"
APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
MIG="${APP_DIR}/supabase/migrations/20260811200000_feed_feedback_stage4b.sql"

require_root "$@"
ensure_env_or_stop
load_env_file "$CKR_ENV_FILE"

[[ "${CKR_CONFIRM_FEED_FEEDBACK_APPLY:-}" == "YES" ]] || die "Set CKR_CONFIRM_FEED_FEEDBACK_APPLY=YES"

url="${NEXT_PUBLIC_SUPABASE_URL%/}"
ref="$(python3 - <<PY
from urllib.parse import urlparse
import os
h=urlparse(os.environ["NEXT_PUBLIC_SUPABASE_URL"].strip().strip("\"'")).hostname or ""
print(h.split(".")[0])
PY
)"
[[ "$ref" == "$EXPECTED_REF" ]] || die "Supabase ref mismatch"
[[ -f "$MIG" ]] || die "Missing $MIG"
service_key="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}"
[[ -n "$service_key" ]] || die "No service role key"

table_ok() {
  local table="$1" code i
  for i in 1 2 3 4 5 6 7 8; do
    code="$(curl -sS -o /tmp/ckr-feed.json -w '%{http_code}' \
      -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
      "${url}/rest/v1/${table}?select=id&limit=1" || true)"
    [[ "$code" == "200" ]] && return 0
    sleep 2
  done
  return 1
}

if table_ok "feed_feedback_events"; then
  log_ok "feed_feedback_events already present — skip"
  exit 0
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

table_ok "feed_feedback_events" || die "missing feed_feedback_events"
log_ok "Done. Feed recommendations remain on-demand."
