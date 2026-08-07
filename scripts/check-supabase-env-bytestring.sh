#!/usr/bin/env bash
# Проверка /etc/ckr/ckr.env: ключи должны быть ByteString (без кириллицы).
# Не печатает значения секретов — только OK/FAIL и index.
#
#   sudo ./scripts/check-supabase-env-bytestring.sh
set -euo pipefail

ENV_FILE="${CKR_ENV_FILE:-/etc/ckr/ckr.env}"
[[ -f "$ENV_FILE" ]] || { echo "[ERROR] нет $ENV_FILE" >&2; exit 1; }

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

check() {
  local name="$1"
  local value="${2:-}"
  if [[ -z "$value" ]]; then
    echo "[FAIL] $name пуст"
    return 1
  fi
  local idx
  idx="$(node -e 'const s=process.argv[1]; for (let i=0;i<s.length;i++){ if (s.charCodeAt(i)>255) { process.stdout.write(String(i)); process.exit(2);} } process.stdout.write("-1");' "$value" || true)"
  if [[ "$idx" != "-1" ]]; then
    echo "[FAIL] $name: non-ByteString at index ${idx} (length ${#value})"
    return 1
  fi
  echo "[OK]   $name: ByteString-safe (length ${#value})"
  return 0
}

fail=0
check "NEXT_PUBLIC_SITE_URL" "${NEXT_PUBLIC_SITE_URL:-}" || fail=1
check "NEXT_PUBLIC_SUPABASE_URL" "${NEXT_PUBLIC_SUPABASE_URL:-}" || fail=1
check "NEXT_PUBLIC_SUPABASE_ANON_KEY" "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}}" || fail=1
check "SUPABASE_SERVICE_ROLE_KEY" "${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}" || fail=1

if [[ "$fail" -ne 0 ]]; then
  echo
  echo "Исправьте ключи: скопируйте заново из Supabase Dashboard → API Keys"
  echo "(без кириллицы, без лишних пробелов/кавычек) в /etc/ckr/ckr.env,"
  echo "затем: sudo ./scripts/update-production.sh"
  exit 1
fi

echo "[OK] все проверенные env-значения ByteString-safe"
