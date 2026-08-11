#!/usr/bin/env bash
# =============================================================================
# CKR — Production apply Business Graph Stage 3A (ADDITIVE DDL only)
# Requires explicit owner confirmation. Does not enable BUSINESS_GRAPH_STORE.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

EXPECTED_REF="${CKR_EXPECTED_SUPABASE_REF:-qsnbkhzewqlutdznrppl}"
APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
MIG="${APP_DIR}/supabase/migrations/20260811160000_business_graph_stage3a.sql"
CONFIRM_FLAG="${CKR_CONFIRM_BUSINESS_GRAPH_APPLY:-}"

require_root "$@"
ensure_env_or_stop
load_env_file "$CKR_ENV_FILE"

[[ "${CONFIRM_FLAG}" == "YES" ]] || die "Set CKR_CONFIRM_BUSINESS_GRAPH_APPLY=YES to apply"

url="${NEXT_PUBLIC_SUPABASE_URL%/}"
ref="$(python3 - <<PY
from urllib.parse import urlparse
import os
h=urlparse(os.environ["NEXT_PUBLIC_SUPABASE_URL"].strip().strip("\"'")).hostname or ""
print(h.split(".")[0])
PY
)"

[[ "$ref" == "$EXPECTED_REF" ]] || die "Supabase project ref mismatch — abort (got ${ref})"
[[ -f "$MIG" ]] || die "Migration file missing: ${MIG}"

service_key="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}"
[[ -n "$service_key" ]] || die "No service role key in env"

table_ok() {
  local table="$1"
  local code
  code="$(
    curl -sS -o /tmp/ckr-bg-table.json -w '%{http_code}' \
      -H "apikey: ${service_key}" \
      -H "Authorization: Bearer ${service_key}" \
      -H "Accept: application/json" \
      "${url}/rest/v1/${table}?select=id&limit=1" || true
  )"
  [[ "$code" == "200" ]]
}

if table_ok "business_graph_nodes" && table_ok "business_graph_edges"; then
  log_ok "Business Graph tables already present — skipping SQL"
  exit 0
fi

apply_via_management_api() {
  local token="${SUPABASE_ACCESS_TOKEN:-}"
  [[ -n "$token" ]] || return 1
  log_info "Execute SQL via Management API: $(basename "$MIG")"
  if ! python3 - "$MIG" "$token" "$EXPECTED_REF" <<'PY'
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
    "User-Agent": "ckr-business-graph-stage3a-apply/1.0",
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
  log_ok "Business Graph Stage 3A applied via Management API"
  return 0
}

APPLY_OK=0
if apply_via_management_api; then
  APPLY_OK=1
fi
[[ "${APPLY_OK}" -eq 1 ]] || die "Нужен SUPABASE_ACCESS_TOKEN для apply SQL"

for t in business_graph_nodes business_graph_edges business_graph_aliases business_graph_node_sources business_graph_events; do
  table_ok "$t" || die "missing after apply: ${t}"
  log_ok "table present: ${t}"
done

log_ok "Done. App remains on BUSINESS_GRAPH_STORE=memory until you enable supabase."
