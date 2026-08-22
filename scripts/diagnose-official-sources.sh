#!/usr/bin/env bash
# Stage 2C.2 — diagnose reachability of official RU sources from this host.
# No CAPTCHA/auth bypass. Read-only network probes.
set -euo pipefail

UA_BROWSER='Mozilla/5.0 (compatible; CKR-Diag/1.0)'
UA_SAFE='CKR-LiaOI-SafeFetch/2A'

probe_host() {
  local host="$1"
  local ip
  ip="$(dig +short A "$host" | head -1 || true)"
  if [[ -z "$ip" ]]; then
    printf '%-40s DNS=NONE\n' "$host"
    return
  fi
  local tcp="FAIL"
  if timeout 3 bash -c "echo >/dev/tcp/${ip}/443" 2>/dev/null; then
    tcp="OK"
  fi
  local code
  code="$(
    curl -4 --connect-timeout 4 --max-time 8 -sS -o /dev/null -w '%{http_code}' \
      -A "$UA_BROWSER" "https://${host}/" 2>/dev/null || echo ERR
  )"
  printf '%-40s A=%-16s TCP443=%-4s HTTPS=%s\n' "$host" "$ip" "$tcp" "$code"
}

echo "CKR official sources diagnose — $(hostname) — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Public IPv4: $(curl -4 -sS --max-time 5 ifconfig.me 2>/dev/null || echo unknown)"
echo

echo "== Hosts =="
for h in \
  torgi.gov.ru \
  zakupki.gov.ru \
  int.zakupki.gov.ru \
  bankrot.fedresurs.ru \
  bank-publications-demo.fedresurs.ru \
  bank-publications-prod.fedresurs.ru \
  xn--l1agf.xn--p1ai \
  corpmsp.ru \
  xn--90aifddrld7a.xn--p1ai \
  data.gov.ru
do
  probe_host "$h"
done

echo
echo "== Sample URLs (browser UA vs SafeFetch UA) =="
for url in \
  "https://bankrot.fedresurs.ru/TradeList.aspx" \
  "https://corpmsp.ru/" \
  "https://xn--l1agf.xn--p1ai/" \
  "https://xn--90aifddrld7a.xn--p1ai/" \
  "https://torgi.gov.ru/" \
  "https://zakupki.gov.ru/"
do
  for ua in "$UA_BROWSER" "$UA_SAFE"; do
    out="$(
      curl -4 --connect-timeout 4 --max-time 10 -sS -o /dev/null \
        -w '%{http_code} t=%{time_total}' -A "$ua" "$url" 2>&1 || true
    )"
    printf '%-12s %s -> %s\n' "$(echo "$ua" | cut -c1-12)" "$url" "$out"
  done
done
