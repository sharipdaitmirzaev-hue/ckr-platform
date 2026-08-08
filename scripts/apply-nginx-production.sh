#!/usr/bin/env bash
# Применяет nginx-конфиг из репозитория.
# Если есть Let's Encrypt для домена — HTTPS, иначе HTTP-only.
# Вызывается из update-production ПОСЛЕ git reset (чтобы всегда брать свежую логику с диска).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/lib/ckr-deploy-common.sh"

require_root "$@"
load_env_file "${CKR_ENV_FILE}"

DOMAIN="$(domain_from_site_url)"
[[ -n "$DOMAIN" ]] || die "Не удалось определить DOMAIN из NEXT_PUBLIC_SITE_URL"

NGINX_HTTP_SRC="${CKR_APP_DIR}/deploy/nginx/ckr.conf"
NGINX_HTTPS_SRC="${CKR_APP_DIR}/deploy/nginx/ckr.https.conf"
CERT_FULLCHAIN="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
CERT_PRIVKEY="/etc/letsencrypt/live/${DOMAIN}/privkey.pem"

if [[ -f "$CERT_FULLCHAIN" && -f "$CERT_PRIVKEY" && -f "$NGINX_HTTPS_SRC" ]]; then
  NGINX_SRC="$NGINX_HTTPS_SRC"
  log_info "nginx: Let's Encrypt для ${DOMAIN} → HTTPS"
elif [[ -f "$NGINX_HTTP_SRC" ]]; then
  NGINX_SRC="$NGINX_HTTP_SRC"
  log_warn "nginx: сертификата нет — HTTP-only (${DOMAIN})"
else
  die "Нет deploy/nginx/ckr.conf / ckr.https.conf"
fi

TMP_NGINX="$(mktemp)"
sed "s/YOUR_DOMAIN/${DOMAIN}/g" "$NGINX_SRC" >"$TMP_NGINX"
cp "$TMP_NGINX" /etc/nginx/sites-available/ckr
rm -f "$TMP_NGINX"
ln -sfn /etc/nginx/sites-available/ckr /etc/nginx/sites-enabled/ckr
nginx -t
systemctl reload nginx || systemctl restart nginx
log_ok "nginx обновлён (${DOMAIN})"
