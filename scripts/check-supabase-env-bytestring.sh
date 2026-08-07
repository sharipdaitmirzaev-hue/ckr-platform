#!/usr/bin/env bash
# Проверка /etc/ckr/ckr.env: значения для HTTP headers должны быть ByteString.
# Секреты НЕ печатаются — только имя переменной, OK/INVALID, индекс.
#
#   sudo ./scripts/check-supabase-env-bytestring.sh
set -euo pipefail

ENV_FILE="${CKR_ENV_FILE:-/etc/ckr/ckr.env}"
[[ -f "$ENV_FILE" ]] || { echo "[ERROR] нет $ENV_FILE" >&2; exit 1; }

# shellcheck disable=SC1090
set -a
# shellcheck disable=SC1091
source "$ENV_FILE"
set +a

check() {
  local name="$1"
  local value="${2:-}"
  if [[ -z "$value" ]]; then
    printf '%-36s  %-7s  %s\n' "$name" "INVALID" "empty"
    return 1
  fi
  local idx
  idx="$(
    node -e '
      const s = process.argv[1];
      for (let i = 0; i < s.length; i += 1) {
        if (s.charCodeAt(i) > 255) {
          process.stdout.write(String(i));
          process.exit(2);
        }
      }
      process.stdout.write("-1");
    ' "$value" || true
  )"
  if [[ "$idx" != "-1" ]]; then
    printf '%-36s  %-7s  index=%s (code>255)\n' "$name" "INVALID" "$idx"
    return 1
  fi
  printf '%-36s  %-7s\n' "$name" "OK"
  return 0
}

echo "CKR env ByteString check (${ENV_FILE})"
echo "----------------------------------------------"
printf '%-36s  %-7s  %s\n' "VARIABLE" "STATUS" "DETAIL"
echo "----------------------------------------------"

fail=0
check "NEXT_PUBLIC_SITE_URL" "${NEXT_PUBLIC_SITE_URL:-}" || fail=1
check "NEXT_PUBLIC_SUPABASE_URL" "${NEXT_PUBLIC_SUPABASE_URL:-}" || fail=1
check "NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}}" || fail=1
check "SUPABASE_SERVICE_ROLE_KEY" \
  "${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}" || fail=1

echo "----------------------------------------------"

if [[ "$fail" -ne 0 ]]; then
  cat <<'MSG'

[ACTION REQUIRED] Замените INVALID-переменные из Supabase Dashboard:

  1) Откройте Supabase → Project Settings → API Keys
  2) Скопируйте заново:
     - Publishable / anon     → NEXT_PUBLIC_SUPABASE_ANON_KEY
     - Secret / service_role  → SUPABASE_SERVICE_ROLE_KEY
  3) Только ASCII: без кириллицы, без «умных» кавычек, без пробелов по краям
  4) На сервере (секреты не в git):

       sudo ./scripts/setup-production-env.sh
       # или вручную отредактируйте /etc/ckr/ckr.env (chmod 640, root:ckr)

  5) Повторите:

       sudo ./scripts/check-supabase-env-bytestring.sh
       sudo ./scripts/finalize-production-bytestring.sh

MSG
  exit 1
fi

echo "All checked variables: OK"
exit 0
