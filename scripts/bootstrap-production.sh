#!/usr/bin/env bash
# =============================================================================
# CKR — bootstrap production на Ubuntu (идемпотентный)
#
#   cd /var/www/ckr-platform
#   sudo ./scripts/bootstrap-production.sh
#
# Секреты только в /etc/ckr/ckr.env (не в скрипте).
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

require_root "$@"

log_info "=== CKR bootstrap-production ==="
log_info "APP_DIR=${CKR_APP_DIR}"
log_info "BRANCH=${CKR_DEPLOY_BRANCH}"
log_info "ENV=${CKR_ENV_FILE}"

# --- OS ---
if [[ -f /etc/os-release ]]; then
  # shellcheck disable=SC1091
  source /etc/os-release
  log_ok "OS: ${PRETTY_NAME:-$ID $VERSION_ID}"
  if [[ "${ID:-}" != "ubuntu" ]]; then
    log_warn "Ожидался Ubuntu; продолжаю на ${ID:-unknown}"
  fi
else
  die "Не удалось определить ОС (/etc/os-release отсутствует)"
fi

export DEBIAN_FRONTEND=noninteractive

# --- packages ---
need_apt=()
command -v git >/dev/null 2>&1 || need_apt+=(git)
command -v curl >/dev/null 2>&1 || need_apt+=(curl)
command -v nginx >/dev/null 2>&1 || need_apt+=(nginx)
dpkg -s ca-certificates >/dev/null 2>&1 || need_apt+=(ca-certificates)
dpkg -s gnupg >/dev/null 2>&1 || need_apt+=(gnupg)
dpkg -s apt-transport-https >/dev/null 2>&1 || need_apt+=(apt-transport-https)

if ((${#need_apt[@]} > 0)); then
  log_info "Устанавливаю пакеты: ${need_apt[*]}"
  apt-get update -y
  apt-get install -y "${need_apt[@]}"
  log_ok "Пакеты установлены"
else
  log_ok "git/curl/nginx уже установлены"
fi

# --- Node.js 22 ---
node_ok=0
if command -v node >/dev/null 2>&1; then
  major="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
  if [[ "$major" -ge "$CKR_NODE_MAJOR" ]]; then
    log_ok "Node.js $(node -v) (npm $(npm -v))"
    node_ok=1
  else
    log_warn "Node.js $(node -v) < ${CKR_NODE_MAJOR}; обновляю"
  fi
fi

if [[ "$node_ok" -eq 0 ]]; then
  log_info "Устанавливаю Node.js ${CKR_NODE_MAJOR}.x (NodeSource)"
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg
  mkdir -p /etc/apt/keyrings
  if [[ ! -f /etc/apt/keyrings/nodesource.gpg ]]; then
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  fi
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${CKR_NODE_MAJOR}.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
  log_ok "Node.js $(node -v) / npm $(npm -v)"
fi

# --- system user ---
if id "${CKR_APP_USER}" >/dev/null 2>&1; then
  log_ok "Пользователь ${CKR_APP_USER} уже есть"
else
  useradd --system --home "${CKR_APP_DIR}" --shell /usr/sbin/nologin "${CKR_APP_USER}"
  log_ok "Создан пользователь ${CKR_APP_USER}"
fi

if [[ -n "${SUDO_USER:-}" ]]; then
  usermod -aG "${CKR_APP_USER}" "${SUDO_USER}" || true
fi

# --- app directory ---
if [[ ! -d "${CKR_APP_DIR}/.git" ]]; then
  die "Репозиторий не найден в ${CKR_APP_DIR}. Сначала клонируйте проект туда."
fi

git config --global --add safe.directory "${CKR_APP_DIR}" || true

git_as() {
  if [[ -n "${SUDO_USER:-}" ]] && id "${SUDO_USER}" >/dev/null 2>&1; then
    sudo -u "${SUDO_USER}" -H git -C "${CKR_APP_DIR}" "$@"
  else
    git -C "${CKR_APP_DIR}" "$@"
  fi
}

# --- env template if missing (before checkout so message is clear) ---
mkdir -p /etc/ckr
TEMPLATE_CANDIDATES=(
  "${CKR_APP_DIR}/deploy/env/production.env.template"
  "${SCRIPT_DIR}/../deploy/env/production.env.template"
)
if [[ ! -f "${CKR_ENV_FILE}" ]]; then
  for tpl in "${TEMPLATE_CANDIDATES[@]}"; do
    if [[ -f "$tpl" ]]; then
      cp "$tpl" "${CKR_ENV_FILE}"
      log_warn "Создан шаблон ${CKR_ENV_FILE} из $(basename "$tpl")"
      break
    fi
  done
fi
if [[ -f "${CKR_ENV_FILE}" ]]; then
  chown "root:${CKR_APP_USER}" "${CKR_ENV_FILE}"
  chmod 640 "${CKR_ENV_FILE}"
fi

# --- secrets must be filled before build ---
ensure_env_or_stop
DOMAIN="$(domain_from_site_url)"
[[ -n "$DOMAIN" ]] || die "Не удалось извлечь домен из NEXT_PUBLIC_SITE_URL"

# --- git branch (credentials владельца репо / SUDO_USER) ---
log_info "Переключение на ${CKR_DEPLOY_BRANCH}"
git_as fetch --all --prune
if git_as show-ref --verify --quiet "refs/remotes/origin/${CKR_DEPLOY_BRANCH}"; then
  git_as checkout -B "${CKR_DEPLOY_BRANCH}" "origin/${CKR_DEPLOY_BRANCH}"
elif git_as show-ref --verify --quiet "refs/heads/${CKR_DEPLOY_BRANCH}"; then
  git_as checkout "${CKR_DEPLOY_BRANCH}"
  git_as pull --ff-only origin "${CKR_DEPLOY_BRANCH}" || true
else
  die "Ветка ${CKR_DEPLOY_BRANCH} не найдена на origin. Сначала запушьте её."
fi
log_ok "Git: $(git_as log -1 --oneline)"

chown -R "${CKR_APP_USER}:${CKR_APP_USER}" "${CKR_APP_DIR}"
chown "root:${CKR_APP_USER}" "${CKR_ENV_FILE}"
chmod 640 "${CKR_ENV_FILE}"
log_ok "Права: ${CKR_APP_DIR} → ${CKR_APP_USER}; env root:${CKR_APP_USER} 640"
log_ok "Версия приложения: $(app_version)"

# --- migrations check (read-only) ---
check_migrations_readonly

# --- build ---
log_info "npm ci"
run_as_app "npm ci"
log_ok "npm ci завершён"

log_info "npm run build"
run_as_app "npm run build"
log_ok "production build готов"

# --- systemd ---
UNIT_SRC="${CKR_APP_DIR}/deploy/systemd/ckr.service"
[[ -f "$UNIT_SRC" ]] || die "Нет ${UNIT_SRC}"
NPM_BIN="$(command -v npm)"
cp "$UNIT_SRC" "/etc/systemd/system/${CKR_SERVICE_NAME}.service"
sed -i "s|^ExecStart=.*|ExecStart=${NPM_BIN} run start -- --hostname 127.0.0.1 --port 3000|" \
  "/etc/systemd/system/${CKR_SERVICE_NAME}.service"
systemctl daemon-reload
systemctl enable "${CKR_SERVICE_NAME}"
systemctl restart "${CKR_SERVICE_NAME}"
log_ok "systemd: ${CKR_SERVICE_NAME} enabled + restarted"

# --- nginx ---
NGINX_SRC="${CKR_APP_DIR}/deploy/nginx/ckr.conf"
[[ -f "$NGINX_SRC" ]] || die "Нет ${NGINX_SRC}"
TMP_NGINX="$(mktemp)"
sed "s/YOUR_DOMAIN/${DOMAIN}/g" "$NGINX_SRC" >"$TMP_NGINX"
cp "$TMP_NGINX" /etc/nginx/sites-available/ckr
rm -f "$TMP_NGINX"
ln -sfn /etc/nginx/sites-available/ckr /etc/nginx/sites-enabled/ckr
if [[ -L /etc/nginx/sites-enabled/default ]] || [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
  log_ok "Отключён sites-enabled/default"
fi
nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx
log_ok "Nginx настроен для ${DOMAIN}"

# --- health ---
wait_for_health 40

# --- summary ---
CKR_STATUS="$(systemctl is-active "${CKR_SERVICE_NAME}" || true)"
NGINX_STATUS="$(systemctl is-active nginx || true)"
VERSION="$(app_version)"
SITE_URL="${NEXT_PUBLIC_SITE_URL}"

echo
echo "=============================================="
echo " CKR bootstrap завершён"
echo "=============================================="
echo " ckr service : ${CKR_STATUS}"
echo " nginx       : ${NGINX_STATUS}"
echo " version     : ${VERSION}"
echo " health      : ${CKR_HEALTH_URL}"
if [[ -f /tmp/ckr-health.json ]]; then
  echo " health body : $(tr -d '\n' </tmp/ckr-health.json)"
fi
echo " site        : ${SITE_URL}"
echo " domain      : ${DOMAIN}"
echo " env file    : ${CKR_ENV_FILE}"
echo " branch      : ${CKR_DEPLOY_BRANCH}"
echo "=============================================="
echo
log_info "SSL (когда DNS готов): sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
log_info "Обновления: sudo ./scripts/update-production.sh"
log_ok "Bootstrap OK"
