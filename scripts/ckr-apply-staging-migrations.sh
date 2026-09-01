#!/usr/bin/env bash
# Apply supabase migrations to the pinned staging project only.
# Never targets production. Requires CKR_ENVIRONMENT=staging and staging flags.
#
# GitHub-hosted runners cannot reach db.<ref>.supabase.co (IPv6-only).
# Use the IPv4 session-mode pooler URL after ensuring the project is ACTIVE.
set -euo pipefail
set +x

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-staging-guard.sh"

ckr_assert_staging_target

if [[ "${CKR_STAGING_PROJECT_REF}" == "${CKR_PRODUCTION_PROJECT_REF}" ]]; then
  ckr_staging_die "refused production project ref"
fi

if [[ -z "${CKR_STAGING_DB_PASSWORD:-}" ]]; then
  ckr_staging_die "CKR_STAGING_DB_PASSWORD missing — cannot db push"
fi
if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  ckr_staging_die "SUPABASE_ACCESS_TOKEN missing — cannot restore / inspect staging"
fi

cd "${SCRIPT_DIR}/.."

# Unpause staging if needed, wait until ACTIVE, print IPv4 pooler URL on stdout.
# Status lines go to stderr. Never prints the password. Never targets production.
DB_URL="$(
  python3 - <<'PY'
import json, os, sys, time, urllib.error, urllib.parse, urllib.request

ref = os.environ["CKR_STAGING_PROJECT_REF"]
prod = os.environ.get("CKR_PRODUCTION_PROJECT_REF", "qsnbkhzewqlutdznrppl")
if ref == prod:
    print("refused production project ref", file=sys.stderr)
    sys.exit(2)
token = os.environ["SUPABASE_ACCESS_TOKEN"]
password = os.environ["CKR_STAGING_DB_PASSWORD"]
ua = "Mozilla/5.0 (compatible; ckr-staging-migrations/1.0)"
paused = {"INACTIVE", "PAUSED"}
ready = {"ACTIVE", "ACTIVE_HEALTHY"}
waitable = {
    "COMING_UP",
    "RESTORING",
    "RESTARTING",
    "UNKNOWN",
    "RESIZING",
    "ACTIVE_UNHEALTHY",
}

def api(method, path, body=None, timeout=60):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        f"https://api.supabase.com/v1{path}",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": ua,
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", "replace")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"message": raw[:400]}
        return e.code, parsed

def restore():
    code, body = api("POST", f"/projects/{ref}/restore", {})
    snippet = str(body)[:200]
    print(f"[STAGING] restore HTTP {code}", file=sys.stderr)
    if code in {200, 201}:
        return
    # Already waking / already active is fine.
    if any(s in snippet.upper() for s in ("COMING_UP", "ACTIVE", "RESTORING", "ALREADY")):
        return
    if code in {400, 409, 422}:
        print(f"[STAGING] restore ignored (project likely already waking) {snippet}", file=sys.stderr)
        return
    print(f"[STAGING] restore failed {snippet}", file=sys.stderr)
    sys.exit(1)

status_code, project = api("GET", f"/projects/{ref}")
if status_code != 200:
    print(f"[STAGING] GET project failed HTTP {status_code}", file=sys.stderr)
    sys.exit(1)
st = (project.get("status") or "").upper()
region = project.get("region") or "eu-west-1"
print(f"[STAGING] project status={st} region={region}", file=sys.stderr)

if st in paused:
    print("[STAGING] restoring paused staging project", file=sys.stderr)
    restore()

deadline = time.time() + 900
while time.time() < deadline:
    code, project = api("GET", f"/projects/{ref}")
    st = (project.get("status") or "").upper() if code == 200 else "UNKNOWN"
    print(f"[STAGING] wait status={st}", file=sys.stderr)
    if st in ready:
        break
    if st in paused:
        restore()
    elif st and st not in waitable:
        print(f"[STAGING] unexpected status={st}", file=sys.stderr)
    time.sleep(15)
else:
    print("[STAGING] project did not become ACTIVE/ACTIVE_HEALTHY in time", file=sys.stderr)
    sys.exit(1)

user = f"postgres.{ref}"
host = f"aws-0-{region}.pooler.supabase.com"
auth = urllib.parse.quote(password, safe="")
url = f"postgresql://{user}:{auth}@{host}:5432/postgres?sslmode=require"
print(f"[STAGING] using IPv4 pooler host={host}", file=sys.stderr)
print(url)
PY
)"

if [[ -z "${DB_URL}" || "${DB_URL}" != postgresql://* ]]; then
  echo "[STAGING] empty or invalid pooler URL" >&2
  exit 1
fi

echo "[STAGING] db push --dry-run ref=${CKR_STAGING_PROJECT_REF} (ipv4 pooler)"
npx --yes supabase db push \
  --db-url "${DB_URL}" \
  --yes \
  --dry-run

if [[ "${1:-}" == "--dry-run-only" ]]; then
  echo "[STAGING] dry-run only — no apply"
  exit 0
fi

echo "[STAGING] db push apply ref=${CKR_STAGING_PROJECT_REF} (ipv4 pooler)"
npx --yes supabase db push \
  --db-url "${DB_URL}" \
  --yes
