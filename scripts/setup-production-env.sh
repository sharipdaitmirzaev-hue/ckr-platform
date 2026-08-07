#!/usr/bin/env bash
# =============================================================================
# CKR — интерактивная настройка /etc/ckr/ckr.env
#
#   sudo ./scripts/setup-production-env.sh
#
# Секреты вводятся скрыто (без эха). В лог не печатаются.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

require_root "$@"

ask_visible() {
  local prompt="$1"
  local value=""
  while true; do
    read -r -p "${prompt}: " value
    value="$(printf '%s' "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    if [[ -n "$value" ]]; then
      printf '%s' "$value"
      return 0
    fi
    log_error "Значение обязательно"
  done
}

ask_secret() {
  local prompt="$1"
  local value=""
  while true; do
    read -r -s -p "${prompt}: " value
    echo
    value="$(printf '%s' "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    if [[ -n "$value" ]]; then
      printf '%s' "$value"
      return 0
    fi
    log_error "Значение обязательно"
  done
}

# Экранирование для dotenv: KEY='value' (без вывода value наружу)
dotenv_line() {
  local key="$1"
  local value="$2"
  local escaped="${value//\'/\'\\\'\'}"
  printf "%s='%s'\n" "$key" "$escaped"
}

# Пользователь ckr нужен для group ownership
if ! id "${CKR_APP_USER}" >/dev/null 2>&1; then
  useradd --system --home "${CKR_APP_DIR}" --shell /usr/sbin/nologin "${CKR_APP_USER}"
fi

mkdir -p /etc/ckr

echo
echo "CKR production env setup"
echo "Секретные поля вводятся скрыто. Значения не логируются."
echo

SITE_URL="$(ask_visible "1) NEXT_PUBLIC_SITE_URL (https://ваш-домен)")"
SUPABASE_URL="$(ask_visible "2) NEXT_PUBLIC_SUPABASE_URL")"
ANON_KEY="$(ask_secret "3) NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable или legacy anon)")"
SERVICE_KEY="$(ask_secret "4) SUPABASE_SERVICE_ROLE_KEY (secret или legacy service_role)")"

while true; do
  LIA_PROVIDER_RAW="$(ask_visible "5) LIA_PROVIDER (mock|openai)")"
  LIA_PROVIDER="$(printf '%s' "$LIA_PROVIDER_RAW" | tr '[:upper:]' '[:lower:]')"
  if [[ "$LIA_PROVIDER" == "mock" || "$LIA_PROVIDER" == "openai" ]]; then
    break
  fi
  log_error "Допустимо только: mock или openai"
done

LIA_API_KEY=""
LIA_API_BASE_URL=""
LIA_MODEL="gpt-4o-mini"

if [[ "$LIA_PROVIDER" != "mock" ]]; then
  LIA_API_KEY="$(ask_secret "6a) LIA_API_KEY")"
  LIA_API_BASE_URL="$(ask_visible "6b) LIA_API_BASE_URL (например https://api.openai.com/v1)")"
fi

# Валидация без печати секретов
fail=0
if is_placeholder "$SITE_URL" || [[ "$SITE_URL" != https://* ]]; then
  log_error "NEXT_PUBLIC_SITE_URL должен быть https://..."
  fail=1
fi
if is_placeholder "$SUPABASE_URL" || [[ "$SUPABASE_URL" != https://* ]]; then
  log_error "NEXT_PUBLIC_SUPABASE_URL должен быть https://..."
  fail=1
fi
if is_placeholder "$ANON_KEY" || [[ "$ANON_KEY" == sb_secret_* ]]; then
  log_error "NEXT_PUBLIC_SUPABASE_ANON_KEY некорректен (нужен publishable/anon)"
  fail=1
fi
if is_placeholder "$SERVICE_KEY" || [[ "$SERVICE_KEY" == sb_publishable_* ]]; then
  log_error "SUPABASE_SERVICE_ROLE_KEY некорректен (нужен secret/service_role)"
  fail=1
fi
if [[ "$LIA_PROVIDER" != "mock" ]]; then
  if is_placeholder "$LIA_API_KEY"; then
    log_error "LIA_API_KEY обязателен при LIA_PROVIDER=${LIA_PROVIDER}"
    fail=1
  fi
  if is_placeholder "$LIA_API_BASE_URL" || [[ "$LIA_API_BASE_URL" != http*://* ]]; then
    log_error "LIA_API_BASE_URL обязателен и должен быть URL"
    fail=1
  fi
fi
[[ "$fail" -eq 0 ]] || die "Env не записан — исправьте ввод и повторите"

TMP="$(mktemp)"
umask 077
{
  echo "# CKR production env — сгенерировано setup-production-env.sh"
  echo "# Не коммитить. Не логировать значения."
  echo
  dotenv_line "NODE_ENV" "production"
  dotenv_line "PORT" "3000"
  dotenv_line "HOSTNAME" "127.0.0.1"
  echo
  dotenv_line "NEXT_PUBLIC_SITE_URL" "$SITE_URL"
  dotenv_line "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
  dotenv_line "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ANON_KEY"
  dotenv_line "SUPABASE_SERVICE_ROLE_KEY" "$SERVICE_KEY"
  echo
  dotenv_line "LIA_PROVIDER" "$LIA_PROVIDER"
  dotenv_line "LIA_API_KEY" "$LIA_API_KEY"
  dotenv_line "LIA_API_BASE_URL" "$LIA_API_BASE_URL"
  dotenv_line "LIA_MODEL" "$LIA_MODEL"
  echo
  dotenv_line "LIA_WEB_SEARCH_PROVIDER" "mock"
  dotenv_line "LIA_WEB_SEARCH_ENGINE" "serper"
  dotenv_line "LIA_WEB_SEARCH_API_KEY" ""
  dotenv_line "LIA_WEB_SEARCH_BASE_URL" ""
  dotenv_line "LIA_WEB_SEARCH_METHOD" "POST"
  echo
  dotenv_line "PAYMENT_PROVIDER" "mock"
  echo
  dotenv_line "NEXT_PUBLIC_DEMO_MODE" "false"
  dotenv_line "DEMO_CATALOG_FALLBACK" "false"
  dotenv_line "DEMO_SEED_SECRET" ""
  dotenv_line "ALLOW_DEMO_SEED_IN_PRODUCTION" "false"
  dotenv_line "PILOT_SEED_SECRET" ""
  dotenv_line "ALLOW_PILOT_SEED_IN_PRODUCTION" "false"
  echo
  dotenv_line "NEXT_PUBLIC_BETA_REQUIRE_INVITE" "false"
} >"$TMP"

# Атомарная установка
install -m 640 -o root -g "${CKR_APP_USER}" "$TMP" "${CKR_ENV_FILE}"
rm -f "$TMP"

# Тихая повторная проверка (без печати секретов и лишнего вывода)
if ! ensure_env_or_stop >/dev/null 2>&1; then
  die "Файл ${CKR_ENV_FILE} записан, но валидация не прошла. Запустите setup снова."
fi

printf '[OK] env ready\n'
