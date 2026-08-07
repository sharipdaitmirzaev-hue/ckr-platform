#!/usr/bin/env bash
# Проверка, что ЦКР запущен локально (за Nginx) и снаружи.
set -euo pipefail

LOCAL_URL="${CKR_LOCAL_URL:-http://127.0.0.1:3000/api/health}"
PUBLIC_URL="${CKR_PUBLIC_URL:-}"

echo "==> systemd"
systemctl is-active ckr
systemctl --no-pager --full status ckr | head -15 || true

echo "==> local health: ${LOCAL_URL}"
curl -fsS "${LOCAL_URL}" | tee /tmp/ckr-health.json
echo

if [[ -n "${PUBLIC_URL}" ]]; then
  echo "==> public health: ${PUBLIC_URL}"
  curl -fsS "${PUBLIC_URL}" | tee /tmp/ckr-health-public.json
  echo
fi

echo "==> OK"
