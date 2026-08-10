#!/usr/bin/env bash
# Безопасная установка Serper env для LIA OI (Stage 2A LIVE).
# НЕ печатает API key. Читает ключ из fd 3 или файла с правами 600.
#
# Использование на production (пример):
#   read -r -s -p "Serper API key: " KEY; echo
#   sudo KEY="$KEY" bash scripts/set-lia-serper-env.sh
# или:
#   printf '%s' "$KEY" | sudo bash scripts/set-lia-serper-env.sh --stdin
#
# Обновляет только:
#   LIA_WEB_SEARCH_PROVIDER=web_api
#   LIA_WEB_SEARCH_ENGINE=serper
#   LIA_WEB_SEARCH_API_KEY=<secret>
#   LIA_OI_SEARCH_MODE=auto
#
# Env file: /etc/ckr/ckr.env (или CKR_ENV_FILE)

set -euo pipefail

ENV_FILE="${CKR_ENV_FILE:-/etc/ckr/ckr.env}"
MODE_STDIN=0
if [[ "${1:-}" == "--stdin" ]]; then
  MODE_STDIN=1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: env file not found: $ENV_FILE" >&2
  exit 1
fi

if [[ "$MODE_STDIN" -eq 1 ]]; then
  API_KEY="$(cat)"
elif [[ -n "${KEY:-}" ]]; then
  API_KEY="$KEY"
elif [[ -n "${LIA_WEB_SEARCH_API_KEY:-}" && "${ALLOW_ENV_KEY:-}" == "1" ]]; then
  API_KEY="$LIA_WEB_SEARCH_API_KEY"
else
  echo "ERROR: provide key via KEY=... or --stdin" >&2
  exit 1
fi

API_KEY="$(printf '%s' "$API_KEY" | tr -d '\r\n' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
if [[ -z "$API_KEY" ]]; then
  echo "ERROR: empty API key" >&2
  exit 1
fi
if [[ ${#API_KEY} -lt 16 ]]; then
  echo "ERROR: API key looks too short (refusing to write)" >&2
  exit 1
fi

TMP="$(mktemp)"
chmod 600 "$TMP"
trap 'rm -f "$TMP"' EXIT

# Escape for dotenv single-quoted value: ' -> '\'' 
escape_sq() {
  printf "%s" "$1" | sed "s/'/'\\\\''/g"
}

KEY_ESC="$(escape_sq "$API_KEY")"

# Copy existing file without the four target keys, then append fresh values.
grep -Ev '^(LIA_WEB_SEARCH_PROVIDER|LIA_WEB_SEARCH_ENGINE|LIA_WEB_SEARCH_API_KEY|LIA_OI_SEARCH_MODE)=' \
  "$ENV_FILE" >"$TMP" || true

{
  echo "LIA_WEB_SEARCH_PROVIDER=web_api"
  echo "LIA_WEB_SEARCH_ENGINE=serper"
  echo "LIA_WEB_SEARCH_API_KEY='${KEY_ESC}'"
  echo "LIA_OI_SEARCH_MODE=auto"
} >>"$TMP"

# Preserve ownership/mode of original
OWNER="$(stat -c '%u:%g' "$ENV_FILE")"
MODE="$(stat -c '%a' "$ENV_FILE")"
cp "$TMP" "$ENV_FILE"
chown "$OWNER" "$ENV_FILE"
chmod "$MODE" "$ENV_FILE"

# Verify without revealing secret
python3 - <<'PY'
import re
from pathlib import Path
import os
p = Path(os.environ.get("CKR_ENV_FILE", "/etc/ckr/ckr.env"))
text = p.read_text(encoding="utf-8", errors="replace")
want = {
  "LIA_WEB_SEARCH_PROVIDER": "web_api",
  "LIA_WEB_SEARCH_ENGINE": "serper",
  "LIA_OI_SEARCH_MODE": "auto",
}
for k, v in want.items():
    m = re.search(rf"^{k}=(.*)$", text, re.M)
    got = (m.group(1).strip().strip("'").strip('"') if m else "")
    print(f"OK {k}={got}" if got == v else f"BAD {k}")
m = re.search(r"^LIA_WEB_SEARCH_API_KEY=(.*)$", text, re.M)
val = (m.group(1).strip().strip("'").strip('"') if m else "")
print(f"OK LIA_WEB_SEARCH_API_KEY=SET(len={len(val)})" if len(val) >= 16 else "BAD LIA_WEB_SEARCH_API_KEY")
PY

echo "Done. Restart ckr.service to apply (systemctl restart ckr)."
echo "Do not cat the env file in shared logs."
