/**
 * Stage 4N — official EIS access status (no bypass, no secrets in output).
 */

import {
  eisConnectionStatus,
  getEisOfficialConfig,
} from "@/lib/lia/oi/sources/providers/config";

export type OfficialEisAccessReport = {
  publicHtmlReachable: boolean | null;
  soapConfigured: boolean;
  soapStatus: "NOT_CONFIGURED" | "CONNECTED" | "UNAVAILABLE";
  credentialsRequired: boolean;
  requiresOwnerCredentials: boolean;
  notes: string[];
  networkFailureClass:
    | "none"
    | "credentials_missing"
    | "tcp_timeout"
    | "unknown";
};

/**
 * Static + env assessment. Live TCP probe is optional (set probeResult).
 */
export function assessOfficialEisAccess(input?: {
  /** Result of read-only TCP/HTTP probe from ops/diagnostics */
  publicHtmlProbe?: {
    dnsOk: boolean;
    tcp443Ok: boolean;
    httpStatus: number | null;
    error?: string | null;
  };
}): OfficialEisAccessReport {
  const cfg = getEisOfficialConfig();
  const soapStatus = eisConnectionStatus();
  const notes: string[] = [
    "FTP-выгрузки ЕИС закрыты с 01.01.2025",
    "Интеграционный SOAP требует token / ЭЦП и актуальные домены ТФФ (в т.ч. ГОСТ-каналы с 2025)",
    "Публичный HTML zakupki.gov.ru не обходится при TCP timeout / WAF",
  ];

  let networkFailureClass: OfficialEisAccessReport["networkFailureClass"] =
    "none";
  let publicHtmlReachable: boolean | null = null;

  if (!cfg.enabled || !cfg.hasToken) {
    networkFailureClass = "credentials_missing";
    notes.push("LIA_EIS_ENABLED / LIA_EIS_TOKEN не настроены → NOT_CONFIGURED");
  }

  if (input?.publicHtmlProbe) {
    const p = input.publicHtmlProbe;
    publicHtmlReachable = Boolean(p.tcp443Ok && p.httpStatus && p.httpStatus < 400);
    if (p.dnsOk && !p.tcp443Ok) {
      networkFailureClass = "tcp_timeout";
      notes.push("DNS резолвится, TCP:443 к zakupki.gov.ru timeout с VPS");
    } else if (p.httpStatus === 403) {
      notes.push("HTTP 403 на HTML (WAF/bot protection) — не обходим");
    }
  }

  return {
    publicHtmlReachable,
    soapConfigured: cfg.enabled && cfg.hasToken,
    soapStatus,
    credentialsRequired: true,
    requiresOwnerCredentials: !cfg.hasToken,
    notes,
    networkFailureClass,
  };
}

export function officialEisRequiresOwnerCredentialsMessage(): string {
  return [
    "REQUIRES OWNER CREDENTIALS",
    "",
    "Для официального live SOAP ЕИС нужны server-side credentials владельца:",
    "1) токен участника / интеграционный доступ по актуальному Альбому ТФФ ЕИС;",
    "2) при ГОСТ-каналах — инфраструктура КриптоПро / сертификат по требованиям ЕИС;",
    "3) переменные только в /etc/ckr/ckr.env: LIA_EIS_ENABLED=1, LIA_EIS_TOKEN=…, опционально LIA_EIS_ENDPOINT;",
    "4) не присылать секреты в чат и не коммитить.",
    "",
    "Без этого Stage 4N использует trusted secondary mirrors с честным provenance (не «официально подтверждено ЕИС»).",
  ].join("\n");
}
