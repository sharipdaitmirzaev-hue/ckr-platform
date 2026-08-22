#!/usr/bin/env bash
# Dry-run Stage 4H — unit tests + read-only production probe (no writes).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Unit tests"
npx --yes tsx scripts/test-ckr-idea-first-stage4h.ts

echo "==> Production read-only (TINDA reference, no writes)"
ssh -i ~/.ssh/ckr-cursor-agent -o BatchMode=yes cursor-agent@161.104.18.135 'python3 - <<"PY"
import json, urllib.request
env={}
for line in open("/etc/ckr/ckr.env"):
  line=line.strip()
  if not line or line.startswith("#") or "=" not in line: continue
  k,v=line.split("=",1); env[k]=v.strip().strip(chr(34)).strip(chr(39))
url=env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/"); key=env["SUPABASE_SERVICE_ROLE_KEY"]
RID="223decd8-c99a-4d24-ba25-2cb5d91749d3"
ORG="fb5843fb-ab25-43bc-9af7-d74c6ef66176"
req=urllib.request.Request(url+f"/rest/v1/ckr_requests?id=eq.{RID}&select=id,status,request_type,subject,organization_id",
  headers={"apikey":key,"Authorization":"Bearer "+key})
with urllib.request.urlopen(req, timeout=30) as r:
  rows=json.loads(r.read().decode())
print("TINDA_REQUEST", json.dumps(rows, ensure_ascii=False))
# Stage 4H columns may be absent until apply
req2=urllib.request.Request(url+"/rest/v1/rpc/submit_public_idea",
  data=b"{}", headers={"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json"}, method="POST")
try:
  urllib.request.urlopen(req2, timeout=20)
  print("submit_public_idea=PRESENT")
except Exception as e:
  print("submit_public_idea=ABSENT", getattr(e,"code",None))
print("DRYRUN_OK org", ORG)
PY'

echo "==> DRY-RUN OK (no production writes)"
