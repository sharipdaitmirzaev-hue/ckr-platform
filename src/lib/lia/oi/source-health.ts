/**
 * Stage 4D / 4N — source health for owner diagnostics.
 * One failed source must not break discovery (pipeline already isolates errors).
 * Stage 4N: EIS reason classes (credentials_missing / tcp_timeout) without secrets.
 */

import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import { assessOfficialEisAccess } from "@/lib/lia/oi/procurement/official-access";
import { getOfficialAndDiscoveryStatusRows } from "@/lib/lia/oi/sources/providers/status";

export type SourceHealthLevel = "OK" | "DEGRADED" | "UNAVAILABLE";

export type SourceHealthRow = {
  id: string;
  label: string;
  health: SourceHealthLevel;
  statusRaw: string;
  message: string;
  /** INTERNAL diagnostic reason — never secrets */
  reason?: string | null;
};

function mapHealth(status: string): SourceHealthLevel {
  const s = status.toUpperCase();
  if (s === "LIVE" || s === "CONNECTED") return "OK";
  if (s === "STUB" || s === "NOT_CONFIGURED") return "DEGRADED";
  if (s === "UNAVAILABLE" || s === "ERROR") return "UNAVAILABLE";
  return "DEGRADED";
}

export function getSourceHealthRows(input?: {
  /** Optional read-only probe result from ops (not required at runtime). */
  eisPublicHtmlProbe?: {
    dnsOk: boolean;
    tcp443Ok: boolean;
    httpStatus: number | null;
    error?: string | null;
  };
}): SourceHealthRow[] {
  const eisAccess = assessOfficialEisAccess({
    publicHtmlProbe: input?.eisPublicHtmlProbe,
  });

  return getOfficialAndDiscoveryStatusRows().map((r) => {
    let health = mapHealth(String(r.status));
    let message = r.statusMessage;
    let reason: string | null = null;

    if (r.id === "eis") {
      reason = eisAccess.networkFailureClass;
      if (eisAccess.networkFailureClass === "credentials_missing") {
        health = "DEGRADED";
        message = "credentials_missing · SOAP NOT_CONFIGURED";
      } else if (eisAccess.networkFailureClass === "tcp_timeout") {
        health = "UNAVAILABLE";
        message = "tcp_timeout · public HTML unreachable from VPS";
      }
      // Known production posture without live probe: HTML often TCP-timeout
      if (
        !input?.eisPublicHtmlProbe &&
        eisAccess.networkFailureClass === "credentials_missing"
      ) {
        message +=
          " · public HTML typically tcp_timeout from VPS (see Stage 4N diagnosis)";
      }
    }

    return {
      id: r.id,
      label: r.label,
      health,
      statusRaw: String(r.status),
      message,
      reason,
    };
  });
}

/** Cost / budget snapshot for owner (no API keys). */
export function getDiscoveryBudgetSnapshot() {
  return {
    maxQueriesPass1: LIA_OI_BUDGETS.maxQueriesPass1,
    maxQueriesPass2: LIA_OI_BUDGETS.maxQueriesPass2,
    maxQueriesPerRun: LIA_OI_BUDGETS.maxQueriesPerRun,
    maxResultsPerQuery: LIA_OI_BUDGETS.maxResultsPerQuery,
    maxSafeFetchesPerRun: LIA_OI_BUDGETS.maxFetchesPerRun,
    maxCandidatesPerRun: LIA_OI_BUDGETS.maxCandidatesPerRun,
    maxAiAnalysesPerRun: LIA_OI_BUDGETS.maxAiAnalysesPerRun,
  };
}
