#!/usr/bin/env bash
# Безопасное обновление ЦКР на Ubuntu-сервере.
#
# Схема: git checkout → npm ci → npm run build → systemctl restart
#
# Использование:
#   cd /var/www/ckr-platform
#   ./scripts/server-deploy.sh
#   ./scripts/server-deploy.sh cursor/deploy-ubuntu-0.61-ff37
#   ./scripts/server-deploy.sh e1bedb7978c039c75784254eb82ea8689a0e7f13
set -euo pipefail

APP_DIR="${CKR_APP_DIR:-/var/www/ckr-platform}"
TARGET_REF="${1:-cursor/deploy-ubuntu-0.61-ff37}"
SERVICE_NAME="${CKR_SERVICE_NAME:-ckr}"
APP_USER="${CKR_APP_USER:-ckr}"

cd "$APP_DIR"

echo "==> [1/6] git fetch"
git fetch --all --prune

echo "==> [2/6] checkout ${TARGET_REF}"
if git show-ref --verify --quiet "refs/remotes/origin/${TARGET_REF}"; then
  git checkout -B "${TARGET_REF}" "origin/${TARGET_REF}"
elif git show-ref --verify --quiet "refs/heads/${TARGET_REF}"; then
  git checkout "${TARGET_REF}"
  git pull --ff-only "origin" "${TARGET_REF}" || true
else
  git checkout --detach "${TARGET_REF}"
fi

echo "==> [3/6] revision"
git rev-parse HEAD
git log -1 --oneline
grep -E "version:" src/config/version.ts || true

if [[ ! -f /etc/ckr/ckr.env ]]; then
  echo "ERROR: нет /etc/ckr/ckr.env — см. docs/deploy-server.md" >&2
  exit 1
fi

run_as_app() {
  if [[ "$(id -un)" == "${APP_USER}" ]]; then
    bash -lc "$*"
  elif id "${APP_USER}" >/dev/null 2>&1; then
    sudo -u "${APP_USER}" bash -lc "$*"
  else
    bash -lc "$*"
  fi
}

echo "==> [4/6] npm ci"
run_as_app "cd '${APP_DIR}' && set -a && source /etc/ckr/ckr.env && set +a && npm ci"

echo "==> [5/6] npm run build"
run_as_app "cd '${APP_DIR}' && set -a && source /etc/ckr/ckr.env && set +a && npm run build"

echo "==> [6/6] restart ${SERVICE_NAME}"
sudo systemctl restart "${SERVICE_NAME}"
sleep 2
sudo systemctl --no-pager --full status "${SERVICE_NAME}" | head -25

echo "==> health"
curl -fsS http://127.0.0.1:3000/api/health
echo
echo "==> deploy OK"
