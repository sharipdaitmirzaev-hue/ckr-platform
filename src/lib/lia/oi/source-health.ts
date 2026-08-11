/**
 * Stage 4D — source health for owner diagnostics.
 * One failed source must not break discovery (pipeline already isolates errors).
 */

import { getOfficialAndDiscoveryStatusRows } from "@/lib/lia/oi/sources/providers/status";
import { LIA_OI_BUDGETS } from "@/config/lia-oi";

export type SourceHealthLevel = "OK" | "DEGRADED" | "UNAVAILABLE";

export type SourceHealthRow = {
  id: string;
  label: string;
  health: SourceHealthLevel;
  statusRaw: string;
  message: string;
};

function mapHealth(status: string): SourceHealthLevel {
  const s = status.toUpperCase();
  if (s === "LIVE" || s === "CONNECTED") return "OK";
  if (s === "STUB" || s === "NOT_CONFIGURED") return "DEGRADED";
  if (s === "UNAVAILABLE" || s === "ERROR") return "UNAVAILABLE";
  return "DEGRADED";
}

export function getSourceHealthRows(): SourceHealthRow[] {
  return getOfficialAndDiscoveryStatusRows().map((r) => ({
    id: r.id,
    label: r.label,
    health: mapHealth(String(r.status)),
    statusRaw: String(r.status),
    message: r.statusMessage,
  }));
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
