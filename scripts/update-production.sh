#!/usr/bin/env bash
# =============================================================================
# CKR — безопасное обновление production
#
#   sudo ./scripts/update-production.sh
#   sudo ./scripts/update-production.sh cursor/deploy-ubuntu-0.61-ff37
#
# Схема: fetch → hard reset → npm ci --include=dev → build → restart → health
# Секреты только из /etc/ckr/ckr.env
# npm ci всегда с --include=dev: NODE_ENV=production иначе пропускает
# tailwindcss/postcss/typescript (нужны на этапе Next.js build).
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

require_root "$@"

TARGET_REF="${1:-${CKR_DEPLOY_BRANCH}}"

log_info "=== CKR update-production ==="
log_info "APP_DIR=${CKR_APP_DIR}"
log_info "TARGET=${TARGET_REF}"

[[ -d "${CKR_APP_DIR}/.git" ]] || die "Нет репозитория в ${CKR_APP_DIR}"
ensure_env_or_stop

sync_git_tree "${TARGET_REF}"

chown -R "${CKR_APP_USER}:${CKR_APP_USER}" "${CKR_APP_DIR}"
chown "root:${CKR_APP_USER}" "${CKR_ENV_FILE}"
chmod 640 "${CKR_ENV_FILE}"

check_migrations_readonly

assert_build_sources

# Чистый build: убираем кэш и зависимости
log_info "rm -rf .next node_modules"
run_as_app "rm -rf .next node_modules"

npm_ci_for_build

# Повторно после npm ci (на случай postinstall/clean сюрпризов)
assert_build_sources

log_info "npm run build"
run_as_app "npm run build"
log_ok "build"

if [[ -f "${CKR_APP_DIR}/deploy/systemd/ckr.service" ]]; then
  NPM_BIN="$(command -v npm)"
  cp "${CKR_APP_DIR}/deploy/systemd/ckr.service" "/etc/systemd/system/${CKR_SERVICE_NAME}.service"
  sed -i "s|^ExecStart=.*|ExecStart=${NPM_BIN} run start -- --hostname 127.0.0.1 --port 3000|" \
    "/etc/systemd/system/${CKR_SERVICE_NAME}.service"
  systemctl daemon-reload
  log_ok "systemd unit обновлён"
fi

DOMAIN="$(domain_from_site_url)"
if [[ -n "$DOMAIN" && -f "${CKR_APP_DIR}/deploy/nginx/ckr.conf" ]]; then
  TMP_NGINX="$(mktemp)"
  sed "s/YOUR_DOMAIN/${DOMAIN}/g" "${CKR_APP_DIR}/deploy/nginx/ckr.conf" >"$TMP_NGINX"
  cp "$TMP_NGINX" /etc/nginx/sites-available/ckr
  rm -f "$TMP_NGINX"
  ln -sfn /etc/nginx/sites-available/ckr /etc/nginx/sites-enabled/ckr
  nginx -t
  systemctl reload nginx || systemctl restart nginx
  log_ok "nginx обновлён (${DOMAIN})"
fi

log_info "systemctl restart ${CKR_SERVICE_NAME}"
systemctl restart "${CKR_SERVICE_NAME}"
wait_for_health 40

echo
echo "=============================================="
echo " CKR update завершён"
echo "=============================================="
echo " ckr     : $(systemctl is-active "${CKR_SERVICE_NAME}" || true)"
echo " nginx   : $(systemctl is-active nginx || true)"
echo " version : $(app_version)"
echo " site    : ${NEXT_PUBLIC_SITE_URL}"
if [[ -f /tmp/ckr-health.json ]]; then
  echo " health  : $(tr -d '\n' </tmp/ckr-health.json)"
fi
echo "=============================================="
log_ok "Update OK"
