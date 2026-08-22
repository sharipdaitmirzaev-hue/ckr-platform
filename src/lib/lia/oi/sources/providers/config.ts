/**
 * Server-side env for official APIs. Never log or return secret values.
 */

import type { OfficialApiConnectionStatus } from "@/lib/lia/oi/sources/providers/types";

function envFlag(name: string): boolean {
  const v = (process.env[name] || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function envStr(name: string): string {
  return (process.env[name] || "").trim();
}

export type EisOfficialConfig = {
  enabled: boolean;
  hasToken: boolean;
  endpoint: string;
};

export type FedresursOfficialConfig = {
  enabled: boolean;
  hasLogin: boolean;
  hasPassword: boolean;
  baseUrl: string;
};

/** Default public EIS SOAP endpoint placeholder (docs / future live). */
export const LIA_EIS_DEFAULT_ENDPOINT =
  "https://int44.zakupki.gov.ru/eis-integration/services/getDocsIP";

/** Default Fedresurs REST base (docs / future live). */
export const LIA_FEDRESURS_DEFAULT_BASE_URL =
  "https://bank-publications-prod.fedresurs.ru";

export function getEisOfficialConfig(): EisOfficialConfig {
  return {
    enabled: envFlag("LIA_EIS_ENABLED"),
    hasToken: Boolean(envStr("LIA_EIS_TOKEN")),
    endpoint: envStr("LIA_EIS_ENDPOINT") || LIA_EIS_DEFAULT_ENDPOINT,
  };
}

export function getFedresursOfficialConfig(): FedresursOfficialConfig {
  return {
    enabled: envFlag("LIA_FEDRESURS_ENABLED"),
    hasLogin: Boolean(envStr("LIA_FEDRESURS_LOGIN")),
    hasPassword: Boolean(envStr("LIA_FEDRESURS_PASSWORD")),
    baseUrl:
      envStr("LIA_FEDRESURS_BASE_URL") || LIA_FEDRESURS_DEFAULT_BASE_URL,
  };
}

/** Raw token — server-only, never expose to UI/logs. */
export function readEisToken(): string | null {
  const t = envStr("LIA_EIS_TOKEN");
  return t || null;
}

export function readFedresursCredentials(): {
  login: string;
  password: string;
} | null {
  const login = envStr("LIA_FEDRESURS_LOGIN");
  const password = envStr("LIA_FEDRESURS_PASSWORD");
  if (!login || !password) return null;
  return { login, password };
}

export function eisConnectionStatus(): OfficialApiConnectionStatus {
  const cfg = getEisOfficialConfig();
  if (!cfg.enabled || !cfg.hasToken) return "NOT_CONFIGURED";
  return "CONNECTED";
}

export function fedresursConnectionStatus(): OfficialApiConnectionStatus {
  const cfg = getFedresursOfficialConfig();
  if (!cfg.enabled || !cfg.hasLogin || !cfg.hasPassword) {
    return "NOT_CONFIGURED";
  }
  return "CONNECTED";
}

export function eisStatusMessage(): string {
  const st = eisConnectionStatus();
  if (st === "NOT_CONFIGURED") return "credentials не настроены";
  if (st === "UNAVAILABLE") return "API временно недоступен";
  return "credentials настроены (готово к live)";
}

export function fedresursStatusMessage(): string {
  const st = fedresursConnectionStatus();
  if (st === "NOT_CONFIGURED") return "credentials не настроены";
  if (st === "UNAVAILABLE") return "API временно недоступен";
  return "credentials настроены (готово к live)";
}
