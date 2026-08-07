#!/usr/bin/env bash
# =============================================================================
# CKR — финализация ByteString-фикса на production
#
#   sudo ./scripts/finalize-production-bytestring.sh
#   sudo ./scripts/finalize-production-bytestring.sh cursor/fix-register-bytestring-ff37
#
# Порядок:
#   1) fetch/reset ветки
#   2) check-supabase-env-bytestring.sh (без печати секретов)
#   3) update-production.sh (npm ci --include=dev, build, restart)
#   4) curl /api/health → supabaseHeadersSafe=true
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

require_root "$@"

TARGET_REF="${1:-cursor/fix-register-bytestring-ff37}"
APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"

log_info "=== CKR finalize ByteString production ==="
log_info "APP_DIR=${APP_DIR}"
log_info "TARGET=${TARGET_REF}"

[[ -d "${APP_DIR}/.git" ]] || die "Нет репозитория в ${APP_DIR}"
[[ -f "${CKR_ENV_FILE}" ]] || die "Нет ${CKR_ENV_FILE}. Сначала: sudo ./scripts/setup-production-env.sh"

cd "${APP_DIR}"
chmod +x scripts/*.sh scripts/lib/*.sh 2>/dev/null || true

log_info "git fetch/reset → ${TARGET_REF}"
git fetch origin "${TARGET_REF}"
git checkout -B "${TARGET_REF}" "origin/${TARGET_REF}"
git reset --hard "origin/${TARGET_REF}"
chmod +x scripts/*.sh scripts/lib/*.sh
log_ok "code @ $(git rev-parse --short HEAD)"

log_info "ByteString env check"
bash "${APP_DIR}/scripts/check-supabase-env-bytestring.sh"

log_info "update-production"
bash "${APP_DIR}/scripts/update-production.sh" "${TARGET_REF}"

log_info "health check"
HEALTH_JSON="$(curl -fsS --max-time 20 http://127.0.0.1:3000/api/health || true)"
echo "${HEALTH_JSON}"
echo

if ! printf '%s' "${HEALTH_JSON}" | node -e '
  let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{
    try {
      const j=JSON.parse(d);
      if (j.supabaseHeadersSafe === true) process.exit(0);
      console.error("[ERROR] supabaseHeadersSafe !== true");
      process.exit(2);
    } catch (e) {
      console.error("[ERROR] invalid health JSON");
      process.exit(2);
    }
  });
'; then
  die "Health не подтвердил supabaseHeadersSafe=true. Исправьте ключи и повторите."
fi

log_ok "supabaseHeadersSafe=true"

cat <<EOF

==============================================
 CKR ByteString finalize OK
==============================================
 version : $(app_version)
 commit  : $(git rev-parse --short HEAD)
 health  : supabaseHeadersSafe=true
 site    : ${NEXT_PUBLIC_SITE_URL:-}

Ручная проверка регистрации:
  1) Откройте ${NEXT_PUBLIC_SITE_URL:-https://ckr-center.ru}/register
  2) Имя: Шарип
  3) Email: (уникальный тестовый)
  4) Роль: Предприниматель
  5) Ожидание: аккаунт создан / онбординг или «подтвердите email»
     — без текста ByteString
==============================================
EOF
