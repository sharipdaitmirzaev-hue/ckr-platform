#!/usr/bin/env bash
# Общие функции для bootstrap/update ЦКР (production).
# shellcheck disable=SC2034

set -euo pipefail

CKR_APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
CKR_ENV_FILE="${CKR_ENV_FILE:-/etc/ckr/ckr.env}"
CKR_APP_USER="${CKR_APP_USER:-ckr}"
CKR_SERVICE_NAME="${CKR_SERVICE_NAME:-ckr}"
CKR_DEPLOY_BRANCH="${CKR_DEPLOY_BRANCH:-cursor/fix-register-bytestring-ff37}"
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
    log_info  "Настройте env одной командой:"
    log_info  "  cd ${CKR_APP_DIR} && sudo ./scripts/setup-production-env.sh"
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
    log_info "Пересоздайте env: cd ${CKR_APP_DIR} && sudo ./scripts/setup-production-env.sh"
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

assert_production_site_url() {
  local url="${NEXT_PUBLIC_SITE_URL:-}"
  if [[ -z "$url" ]]; then
    die "NEXT_PUBLIC_SITE_URL пуст"
  fi
  if [[ "$url" == *localhost* ]] || [[ "$url" == *127.0.0.1* ]]; then
    die "NEXT_PUBLIC_SITE_URL не должен указывать на localhost в production (сейчас: ${url})"
  fi
  if [[ "$url" != https://* ]]; then
    die "NEXT_PUBLIC_SITE_URL должен начинаться с https://"
  fi
  # Ключи/URL уходят в HTTP headers — только ByteString (коды ≤255).
  local key="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}}"
  if [[ -n "$key" ]]; then
    if ! node -e 'const s=process.argv[1]; for (const ch of s) { if (ch.codePointAt(0)>255) process.exit(2); }' "$key"; then
      die "Публичный Supabase-ключ содержит не-ByteString символы — проверьте /etc/ckr/ckr.env"
    fi
  fi
  if ! node -e 'const s=process.argv[1]; for (const ch of s) { if (ch.codePointAt(0)>255) process.exit(2); }' "$url"; then
    die "NEXT_PUBLIC_SITE_URL содержит не-ByteString символы"
  fi
  log_ok "SITE_URL production-safe (${url})"
}

app_version() {
  if [[ -f "${CKR_APP_DIR}/src/config/version.ts" ]]; then
    sed -n 's/.*version:[[:space:]]*"\([^"]*\)".*/\1/p' "${CKR_APP_DIR}/src/config/version.ts" | head -1
  else
    echo "unknown"
  fi
}

run_as_app() {
  # Без login-shell (--noprofile/--norc): иначе cd из profile может сломать cwd.
  local cmd="$*"
  local wrapper
  wrapper="$(cat <<EOF
set -euo pipefail
set -a
# shellcheck disable=SC1091
source '${CKR_ENV_FILE}'
set +a
cd '${CKR_APP_DIR}' || { echo '[ERROR] cd ${CKR_APP_DIR} failed' >&2; exit 1; }
pwd
${cmd}
EOF
)"
  if id "${CKR_APP_USER}" >/dev/null 2>&1; then
    sudo -u "${CKR_APP_USER}" bash --noprofile --norc -c "${wrapper}"
  else
    bash --noprofile --norc -c "${wrapper}"
  fi
}

# /etc/ckr/ckr.env задаёт NODE_ENV=production. При этом npm ci по умолчанию
# пропускает devDependencies, а Next.js build нуждается в них:
# tailwindcss, postcss, typescript, eslint-config-next и т.п.
# Runtime (systemd npm start) остаётся с NODE_ENV=production.
npm_ci_for_build() {
  log_info "npm ci --include=dev (build-time deps: tailwindcss/postcss/typescript)"
  run_as_app "npm ci --include=dev"
  # Жёсткая проверка: без этих модулей webpack/Next build падает.
  run_as_app "node -e \"require.resolve('tailwindcss'); require.resolve('postcss'); require.resolve('typescript');\""
  log_ok "build dependencies установлены (включая devDependencies)"
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

CRITICAL_SOURCE_FILES=(
  "src/components/ui/error-state.tsx"
  "src/components/analytics/analytics-chart.tsx"
  "src/components/analytics/metric-card.tsx"
)

# Принудительно восстанавливает критичные файлы из HEAD (даже если «пропали» с диска).
restore_critical_sources() {
  local path abs expected actual
  mkdir -p \
    "${CKR_APP_DIR}/src/components/ui" \
    "${CKR_APP_DIR}/src/components/analytics"

  for path in "${CRITICAL_SOURCE_FILES[@]}"; do
    abs="${CKR_APP_DIR}/${path}"
    if ! git -C "${CKR_APP_DIR}" cat-file -e "HEAD:${path}" 2>/dev/null; then
      die "В Git HEAD нет объекта: ${path} (ветка/checkout неверный)"
    fi
    # Перезапись с диска из git object DB
    git -C "${CKR_APP_DIR}" checkout -f HEAD -- "${path}"
    if [[ ! -f "${abs}" ]]; then
      # fallback: прямая выгрузка blob
      git -C "${CKR_APP_DIR}" show "HEAD:${path}" >"${abs}"
    fi
    [[ -f "${abs}" ]] || die "Не удалось восстановить ${path}"
    [[ -s "${abs}" ]] || die "Файл пуст после restore: ${path}"

    expected="$(git -C "${CKR_APP_DIR}" rev-parse "HEAD:${path}")"
    actual="$(git -C "${CKR_APP_DIR}" hash-object "${abs}")"
    if [[ "${expected}" != "${actual}" ]]; then
      die "hash mismatch для ${path}: git=${expected} disk=${actual}"
    fi
    log_ok "restored ${path} (${actual:0:12})"
  done
}

# Критичные исходники для production build (case-sensitive Linux).
assert_build_sources() {
  local path abs
  restore_critical_sources

  for path in "${CRITICAL_SOURCE_FILES[@]}" "src/app/error.tsx" "tsconfig.json" "next.config.mjs"; do
    abs="${CKR_APP_DIR}/${path}"
    if [[ ! -f "${abs}" ]]; then
      die "Нет файла: ${path}"
    fi
  done

  if ! grep -q 'baseUrl' "${CKR_APP_DIR}/tsconfig.json"; then
    die "tsconfig.json без baseUrl"
  fi
  if ! grep -q '@/\*' "${CKR_APP_DIR}/tsconfig.json"; then
    die "tsconfig.json не содержит paths @/*"
  fi

  # Проверка читаемости именно пользователем приложения (ckr)
  if id "${CKR_APP_USER}" >/dev/null 2>&1; then
    for path in "${CRITICAL_SOURCE_FILES[@]}"; do
      if ! sudo -u "${CKR_APP_USER}" test -r "${CKR_APP_DIR}/${path}"; then
        die "Файл не читается пользователем ${CKR_APP_USER}: ${path}"
      fi
    done
  fi

  log_info "ls критичных файлов:"
  ls -la \
    "${CKR_APP_DIR}/src/components/ui/error-state.tsx" \
    "${CKR_APP_DIR}/src/components/analytics/analytics-chart.tsx" \
    "${CKR_APP_DIR}/src/components/analytics/metric-card.tsx" \
    || true

  log_ok "Build sources: error-state, analytics-chart, metric-card на месте и читаемы"
}

sync_git_tree() {
  local target_ref="${1:-${CKR_DEPLOY_BRANCH}}"
  git config --global --add safe.directory "${CKR_APP_DIR}" || true

  local git_user="${SUDO_USER:-}"
  git_as() {
    if [[ -n "${git_user}" ]] && id "${git_user}" >/dev/null 2>&1; then
      sudo -u "${git_user}" -H git -C "${CKR_APP_DIR}" "$@"
    else
      git -C "${CKR_APP_DIR}" "$@"
    fi
  }

  log_info "git fetch --all --prune"
  git_as fetch --all --prune

  if git_as show-ref --verify --quiet "refs/remotes/origin/${target_ref}"; then
    log_info "hard sync → origin/${target_ref}"
    git_as checkout -B "${target_ref}" "origin/${target_ref}"
    # Гарантированно восстанавливает удалённые/битые файлы на Linux
    git_as reset --hard "origin/${target_ref}"
    git_as clean -fd
  elif git_as rev-parse --verify "${target_ref}^{commit}" >/dev/null 2>&1; then
    log_info "hard sync → ${target_ref} (detached)"
    git_as checkout --detach "${target_ref}"
    git_as reset --hard "${target_ref}"
    git_as clean -fd
  else
    die "Ref ${target_ref} не найден. Сначала: git push origin ${target_ref}"
  fi

  log_ok "Git: $(git_as log -1 --oneline)"
  log_ok "version: $(app_version)"
  assert_build_sources
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
