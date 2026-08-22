#!/usr/bin/env bash
# Production apply: Stage 4H Idea-First (additive only)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

EXPECTED_REF="${CKR_EXPECTED_SUPABASE_REF:-qsnbkhzewqlutdznrppl}"
APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
MIG="${APP_DIR}/supabase/migrations/20260812190000_ckr_idea_first_stage4h.sql"

require_root "$@"
ensure_env_or_stop
load_env_file "$CKR_ENV_FILE"

[[ "${CKR_CONFIRM_CKR_IDEA_4H_APPLY:-}" == "YES" ]] || die "Set CKR_CONFIRM_CKR_IDEA_4H_APPLY=YES"

url="${NEXT_PUBLIC_SUPABASE_URL%/}"
ref="$(python3 - <<PY
from urllib.parse import urlparse
import os
h=urlparse(os.environ["NEXT_PUBLIC_SUPABASE_URL"].strip().strip("\"'")).hostname or ""
print(h.split(".")[0])
PY
)"
[[ "$ref" == "$EXPECTED_REF" ]] || die "Supabase ref mismatch: got $ref"
[[ -f "$MIG" ]] || die "Missing $MIG — deploy code first"

service_key="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}"
[[ -n "$service_key" ]] || die "No service role key"
token="${SUPABASE_ACCESS_TOKEN:-}"
[[ -n "$token" ]] || die "Need SUPABASE_ACCESS_TOKEN"

# Skip if already applied
if curl -sS -o /tmp/ckr-4h-probe.json -w '%{http_code}' \
  -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
  -H "Content-Type: application/json" \
  -d '{}' \
  "${url}/rest/v1/rpc/submit_public_idea" | grep -Eq '^(200|400|404)$'; then
  code="$(curl -sS -o /tmp/ckr-4h-probe.json -w '%{http_code}' \
    -H "apikey: ${service_key}" -H "Authorization: Bearer ${service_key}" \
    -H "Content-Type: application/json" \
    -d '{}' \
    "${url}/rest/v1/rpc/submit_public_idea" || true)"
  # 404 = missing RPC; 400 = present but bad args
  if [[ "$code" != "404" ]]; then
    # also check profiles column via SQL
    present="$(python3 - "$token" "$EXPECTED_REF" <<'PY'
import json,sys,urllib.request
token,ref=sys.argv[1],sys.argv[2]
q="select 1 from information_schema.columns where table_name='profiles' and column_name='ckr_access_level' limit 1;"
body=json.dumps({"query":q}).encode()
req=urllib.request.Request(f"https://api.supabase.com/v1/projects/{ref}/database/query",data=body,headers={"Authorization":f"Bearer {token}","Content-Type":"application/json","User-Agent":"Mozilla/5.0"},method="POST")
with urllib.request.urlopen(req,timeout=60) as r:
  print("YES" if json.loads(r.read().decode()) else "NO")
PY
)"
    if [[ "$present" == "YES" && "$code" != "404" ]]; then
      log_ok "Stage 4H already present — skip apply"
      exit 0
    fi
  fi
fi

log_info "Apply $(basename "$MIG")"
python3 - "$MIG" "$token" "$EXPECTED_REF" <<'PY'
import json, sys, urllib.request, urllib.error
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
    print("SQL_OK", r.status, r.read()[:600])
except urllib.error.HTTPError as e:
  print("SQL_FAIL", e.code, e.read()[:2000].decode("utf-8", "replace"))
  raise
PY

# Reload PostgREST
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
    "User-Agent": "Mozilla/5.0",
  },
  method="POST",
)
with urllib.request.urlopen(req, timeout=60) as r:
  print("RELOAD", r.status)
PY
sleep 2

# Verify
python3 - "$token" "$EXPECTED_REF" "$service_key" "$url" <<'PY'
import json, sys, urllib.request, urllib.error
token, ref, skey, url = sys.argv[1:5]
checks = [
  "select 1 from pg_type where typname='ckr_request_type' and exists (select 1 from pg_enum e where e.enumtypid=pg_type.oid and e.enumlabel='IDEA')",
  "select column_name from information_schema.columns where table_name='profiles' and column_name='ckr_access_level'",
  "select proname from pg_proc where proname in ('submit_public_idea','claim_ckr_request') order by 1",
  "select to_regclass('public.ckr_public_submit_rate') as t",
  "select is_nullable from information_schema.columns where table_name='ckr_requests' and column_name='from_user_id'",
]
for q in checks:
  body=json.dumps({"query":q}).encode()
  req=urllib.request.Request(f"https://api.supabase.com/v1/projects/{ref}/database/query",data=body,headers={"Authorization":f"Bearer {token}","Content-Type":"application/json","User-Agent":"Mozilla/5.0"},method="POST")
  with urllib.request.urlopen(req,timeout=60) as r:
    print("OK", q[:50], r.read().decode()[:200])

# RPC present?
req=urllib.request.Request(url.rstrip("/")+"/rest/v1/rpc/submit_public_idea", data=b"{}", headers={"apikey":skey,"Authorization":"Bearer "+skey,"Content-Type":"application/json"}, method="POST")
try:
  urllib.request.urlopen(req, timeout=30)
  print("RPC_HTTP", 200)
except urllib.error.HTTPError as e:
  print("RPC_HTTP", e.code)  # 400 expected for empty body
  if e.code == 404:
    raise SystemExit("submit_public_idea still missing")
PY

log_ok "Stage 4H migration applied"
