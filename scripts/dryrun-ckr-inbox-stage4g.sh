#!/usr/bin/env bash
# Dry-run Stage 4G against production READ + optional local memory checks.
# Does NOT apply migration. Does NOT mutate production by default.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Unit tests"
npx --yes tsx scripts/test-ckr-inbox-stage4g.ts

echo "==> Locate TINDA partnership on production (read-only)"
ssh -i ~/.ssh/ckr-cursor-agent -o BatchMode=yes cursor-agent@161.104.18.135 'python3 - <<"PY"
import json, urllib.request
env={}
for line in open("/etc/ckr/ckr.env"):
  line=line.strip()
  if not line or line.startswith("#") or "=" not in line: continue
  k,v=line.split("=",1); env[k]=v.strip().strip(chr(34)).strip(chr(39))
url=env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/"); key=env["SUPABASE_SERVICE_ROLE_KEY"]
ORG="fb5843fb-ab25-43bc-9af7-d74c6ef66176"
r=urllib.request.Request(url+f"/rest/v1/partnerships?organization_id=eq.{ORG}&select=*",
  headers={"apikey":key,"Authorization":"Bearer "+key})
with urllib.request.urlopen(r, timeout=60) as resp:
  rows=json.loads(resp.read().decode())
print(json.dumps({
  "count": len(rows),
  "items": [{
    "id": x["id"],
    "type": x["type"],
    "status": x["status"],
    "description": x["description"],
    "created_by": x["created_by"],
    "created_at": x["created_at"],
    "mapped_inbox_type": "FIND_BUYER" if x["type"]=="supplier" else x["type"],
    "would_import_via": "ensure_ckr_request_from_partnership",
  } for x in rows]
}, ensure_ascii=False, indent=2))
# confirm ckr_requests not yet on prod
r2=urllib.request.Request(url+"/rest/v1/ckr_requests?select=id&limit=1",
  headers={"apikey":key,"Authorization":"Bearer "+key})
try:
  urllib.request.urlopen(r2, timeout=30)
  print("ckr_requests_table=PRESENT")
except Exception as e:
  print("ckr_requests_table=ABSENT", getattr(e,"code",None))
PY'

echo "==> DRY-RUN OK (no production writes)"
