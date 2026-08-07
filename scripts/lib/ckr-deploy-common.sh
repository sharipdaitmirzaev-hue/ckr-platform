#!/usr/bin/env bash
# Общие функции для bootstrap/update ЦКР (production).
# shellcheck disable=SC2034

set -euo pipefail

CKR_APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
CKR_ENV_FILE="${CKR_ENV_FILE:-/etc/ckr/ckr.env}"
CKR_APP_USER="${CKR_APP_USER:-ckr}"
CKR_SERVICE_NAME="${CKR_SERVICE_NAME:-ckr}"
CKR_DEPLOY_BRANCH="${CKR_DEPLOY_BRANCH:-cursor/deploy-ubuntu-0.61-ff37}"
CKR_NODE_MAJOR="${CKR_NODE_MAJOR:-22}"
CKR_HEALTH_URL="${CKR_HEALTH_URL:-http://127.0.0.1:3000/api/health}"

log_ok()   { printf '[OK]   %s\n' "$*"; }
log_warn() { printf '[WARN] %s\n' "$*" >&2; }
log_error(){ printf '[ERROR] %s\n' "$*" >&2; }
log_info() { printf '[INFO] %s\n' "$*"; }

die() {
  log_error "$*"
  exit 1
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    die "Запустите с правами root: sudo $0 $*"
  fi
}

is_placeholder() {
  local value="${1:-}"
  [[ -z "$value" ]] && return 0
  [[ "$value" == REPLACE_* ]] && return 0
  [[ "$value" == YOUR_* ]] && return 0
  [[ "$value" == *YOUR_DOMAIN* ]] && return 0
  [[ "$value" == *YOUR_PROJECT* ]] && return 0
  [[ "$value" == your_* ]] && return 0
  [[ "$value" == https://YOUR_* ]] && return 0
  [[ "$value" == http://localhost* ]] && return 0
  return 1
}

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || die "Нет файла env: $file"
  set -a
  # shellcheck disable=SC1090
  source "$file"
  set +a
}

ensure_env_or_stop() {
  if [[ ! -f "$CKR_ENV_FILE" ]]; then
    log_error "Файл секретов не найден: $CKR_ENV_FILE"
    log_info  "Создайте его из шаблона и заполните реальные значения:"
    log_info  "  sudo mkdir -p /etc/ckr"
    log_info  "  sudo cp ${CKR_APP_DIR}/deploy/env/production.env.template ${CKR_ENV_FILE}"
    log_info  "  sudo chown root:${CKR_APP_USER} ${CKR_ENV_FILE}"
    log_info  "  sudo chmod 640 ${CKR_ENV_FILE}"
    log_info  "  sudo nano ${CKR_ENV_FILE}"
    die "Остановка: сначала заполните ${CKR_ENV_FILE}"
  fi

  load_env_file "$CKR_ENV_FILE"

  local missing=()
  local required=(
    NEXT_PUBLIC_SITE_URL
    NEXT_PUBLIC_SUPABASE_URL
  )

  local key
  for key in "${required[@]}"; do
    if is_placeholder "${!key:-}"; then
      missing+=("$key")
    fi
  done

  # Публичный ключ: anon (legacy JWT) или publishable (sb_publishable_...)
  local public_key="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}}"
  if is_placeholder "$public_key"; then
    missing+=("NEXT_PUBLIC_SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  elif [[ "$public_key" == sb_secret_* ]]; then
    missing+=("публичный ключ не должен быть sb_secret_... (нужен publishable/anon)")
  fi

  # Серверный ключ: service_role (legacy JWT) или secret (sb_secret_...)
  local secret_key="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}"
  if is_placeholder "$secret_key"; then
    missing+=("SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY")
  elif [[ "$secret_key" == sb_publishable_* ]]; then
    missing+=("серверный ключ не должен быть sb_publishable_... (нужен secret/service_role)")
  fi

  # Production safety flags
  if [[ "${NEXT_PUBLIC_DEMO_MODE:-true}" != "false" ]]; then
    missing+=("NEXT_PUBLIC_DEMO_MODE=false")
  fi
  if [[ "${DEMO_CATALOG_FALLBACK:-true}" != "false" ]]; then
    missing+=("DEMO_CATALOG_FALLBACK=false")
  fi
  if [[ "${ALLOW_DEMO_SEED_IN_PRODUCTION:-}" == "true" ]]; then
    missing+=("ALLOW_DEMO_SEED_IN_PRODUCTION=false")
  fi
  if [[ "${ALLOW_PILOT_SEED_IN_PRODUCTION:-}" == "true" ]]; then
    missing+=("ALLOW_PILOT_SEED_IN_PRODUCTION=false")
  fi

  if [[ "${LIA_PROVIDER:-mock}" != "mock" ]]; then
    if is_placeholder "${LIA_API_KEY:-}"; then
      missing+=("LIA_API_KEY")
    fi
    if is_placeholder "${LIA_API_BASE_URL:-}"; then
      missing+=("LIA_API_BASE_URL")
    fi
  else
    log_warn "LIA_PROVIDER=mock — ИИ будет без внешнего API (допустимо временно)"
  fi

  if ((${#missing[@]} > 0)); then
    log_error "В ${CKR_ENV_FILE} не хватает корректных production-значений:"
    for key in "${missing[@]}"; do
      log_error "  - $key"
    done
    log_info "Отредактируйте файл: sudo nano ${CKR_ENV_FILE}"
    log_info "Затем повторите запуск скрипта."
    die "Остановка: env не готов к production"
  fi

  log_ok "Env проверен: ${CKR_ENV_FILE}"
}

domain_from_site_url() {
  local url="${NEXT_PUBLIC_SITE_URL:-}"
  url="${url#https://}"
  url="${url#http://}"
  url="${url%%/*}"
  printf '%s' "$url"
}

app_version() {
  if [[ -f "${CKR_APP_DIR}/src/config/version.ts" ]]; then
    sed -n 's/.*version:[[:space:]]*"\([^"]*\)".*/\1/p' "${CKR_APP_DIR}/src/config/version.ts" | head -1
  else
    echo "unknown"
  fi
}

run_as_app() {
  local cmd="$*"
  if id "${CKR_APP_USER}" >/dev/null 2>&1; then
    sudo -u "${CKR_APP_USER}" bash -lc "set -a; source '${CKR_ENV_FILE}'; set +a; cd '${CKR_APP_DIR}'; ${cmd}"
  else
    bash -lc "set -a; source '${CKR_ENV_FILE}'; set +a; cd '${CKR_APP_DIR}'; ${cmd}"
  fi
}

wait_for_health() {
  local tries="${1:-30}"
  local i
  for ((i=1; i<=tries; i++)); do
    if curl -fsS "$CKR_HEALTH_URL" >/tmp/ckr-health.json 2>/dev/null; then
      log_ok "Health: $(tr -d '\n' </tmp/ckr-health.json)"
      return 0
    fi
    sleep 1
  done
  die "Health check не ответил: ${CKR_HEALTH_URL}"
}

check_migrations_readonly() {
  log_info "Проверка Supabase migrations (read-only, без apply/reset)"

  local mig_dir="${CKR_APP_DIR}/supabase/migrations"
  if [[ ! -d "$mig_dir" ]]; then
    log_warn "Каталог migrations не найден: ${mig_dir}"
    return 0
  fi

  local count
  count="$(find "$mig_dir" -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' ')"
  log_ok "В репозитории migrations: ${count} файлов"

  local list_file="/tmp/ckr-migrations-list.txt"
  find "$mig_dir" -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | sort >"$list_file"
  log_info "Список: ${list_file}"

  load_env_file "$CKR_ENV_FILE"
  local base="${NEXT_PUBLIC_SUPABASE_URL%/}"
  local key="${SUPABASE_SERVICE_ROLE_KEY:-${SUPABASE_SECRET_KEY:-}}"

  if is_placeholder "$base" || is_placeholder "$key"; then
    log_warn "Нельзя проверить БД удалённо: нет URL/серверного ключа"
    log_warn "Примените migrations вручную: supabase db push (или SQL по порядку)"
    return 0
  fi

  # Ключевые таблицы из ранних и поздних migrations 0.61
  local tables=(profiles projects opportunities analytics_events feedback)
  local missing_tables=()
  local table code
  local curl_args=(-sS -o /tmp/ckr-table-check.json -w '%{http_code}' -H "Accept: application/json" -H "apikey: ${key}")

  # Новые ключи sb_* — не JWT: не кладём их в Authorization: Bearer.
  # Legacy JWT service_role — можно (и привычно) слать и apikey, и Bearer.
  if [[ "$key" != sb_publishable_* && "$key" != sb_secret_* ]]; then
    curl_args+=(-H "Authorization: Bearer ${key}")
  fi

  for table in "${tables[@]}"; do
    code="$(
      curl "${curl_args[@]}" \
        "${base}/rest/v1/${table}?select=*&limit=1" || true
    )"
    if [[ "$code" == "200" ]]; then
      log_ok "Таблица доступна: ${table}"
    else
      log_warn "Таблица недоступна/отсутствует: ${table} (HTTP ${code})"
      missing_tables+=("$table")
    fi
  done

  if ((${#missing_tables[@]} > 0)); then
    log_warn "Production DB, похоже, не полностью мигрирована."
    log_warn "НЕ применяю migrations автоматически (безопасность)."
    log_warn "Сделайте вручную на production Supabase:"
    log_warn "  cd ${CKR_APP_DIR} && supabase link && supabase db push"
    log_warn "или выполните SQL-файлы из supabase/migrations/ по возрастанию имени."
  else
    log_ok "Базовая проверка schema: ключевые таблицы отвечают"
  fi
}
