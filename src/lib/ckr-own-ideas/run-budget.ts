/**
 * Stage 4Q.3 / 4Q.4.1 — one shared run budget.
 * Catalog and builder share counters. Actual HTTP (Serper / safeFetch /
 * hook stand-in) is the unit — not adapter.search() invocations.
 * Discovery cannot consume the whole run: calls and time are reserved
 * for DETAIL resolution.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { CKR_OWN_IDEAS_BUDGETS } from "@/config/ckr-own-ideas";

export type OwnIdeaRunBudgetLayer = "catalog" | "builder";
export type OwnIdeaBudgetPhase = "discovery" | "resolution" | "builder";
export type OwnIdeaBudgetExhaustedPhase = "discovery" | "resolution" | "timeout" | null;

export type OwnIdeaRunBudgetSnapshot = {
  catalogSearches: number;
  builderSearches: number;
  catalogExternalCalls: number;
  builderExternalCalls: number;
  discoveryExternalCalls: number;
  resolutionExternalCalls: number;
  actualExternalHttpCalls: number;
  totalSearches: number;
  totalExternalCalls: number;
  maxSearches: number;
  maxExternalCalls: number;
  timeoutMs: number;
  timedOut: boolean;
  stopReason: string | null;
  discoveryStoppedForResolutionReserve: boolean;
  budgetRemainingAtFirstResolution: number | null;
  budgetExhaustedPhase: OwnIdeaBudgetExhaustedPhase;
  discoveryTimeMs: number;
  resolutionTimeMs: number;
  runWallTimeMs: number;
};

export type OwnIdeaRunBudget = {
  readonly maxSearches: number;
  readonly maxExternalCalls: number;
  readonly timeoutMs: number;
  readonly maxDiscoveryExternalCalls: number;
  readonly minResolutionReservedCalls: number;
  readonly resolutionReserveMs: number;
  readonly startedAt: number;
  catalogSearches: number;
  builderSearches: number;
  catalogExternalCalls: number;
  builderExternalCalls: number;
  discoveryExternalCalls: number;
  resolutionExternalCalls: number;
  phase: OwnIdeaBudgetPhase;
  hadResolvableCandidate: boolean;
  discoveryStoppedForResolutionReserve: boolean;
  budgetRemainingAtFirstResolution: number | null;
  budgetExhaustedPhase: OwnIdeaBudgetExhaustedPhase;
  discoveryTimeMs: number;
  resolutionTimeMs: number;
  stopReason: string | null;
};

const budgetAls = new AsyncLocalStorage<OwnIdeaRunBudget>();

export function runWithOwnIdeaBudget<T>(budget: OwnIdeaRunBudget, fn: () => T): T {
  return budgetAls.run(budget, fn);
}

export function getActiveOwnIdeaBudget(): OwnIdeaRunBudget | undefined {
  return budgetAls.getStore();
}

export function createOwnIdeaRunBudget(now = Date.now()): OwnIdeaRunBudget {
  return {
    maxSearches: CKR_OWN_IDEAS_BUDGETS.maxSearches,
    maxExternalCalls: CKR_OWN_IDEAS_BUDGETS.maxExternalCalls,
    timeoutMs: CKR_OWN_IDEAS_BUDGETS.timeoutMs,
    maxDiscoveryExternalCalls: CKR_OWN_IDEAS_BUDGETS.discoveryMaxExternalCalls,
    minResolutionReservedCalls: CKR_OWN_IDEAS_BUDGETS.resolutionReservedExternalCalls,
    resolutionReserveMs: CKR_OWN_IDEAS_BUDGETS.resolutionReserveMs,
    startedAt: now,
    catalogSearches: 0,
    builderSearches: 0,
    catalogExternalCalls: 0,
    builderExternalCalls: 0,
    discoveryExternalCalls: 0,
    resolutionExternalCalls: 0,
    phase: "discovery",
    hadResolvableCandidate: false,
    discoveryStoppedForResolutionReserve: false,
    budgetRemainingAtFirstResolution: null,
    budgetExhaustedPhase: null,
    discoveryTimeMs: 0,
    resolutionTimeMs: 0,
    stopReason: null,
  };
}

/** Test-only overrides (timeout / caps). Production always uses createOwnIdeaRunBudget(). */
export function createOwnIdeaRunBudgetForTest(opts?: {
  now?: number;
  timeoutMs?: number;
  maxExternalCalls?: number;
  maxDiscoveryExternalCalls?: number;
  minResolutionReservedCalls?: number;
  resolutionReserveMs?: number;
}): OwnIdeaRunBudget {
  const base = createOwnIdeaRunBudget(opts?.now ?? Date.now());
  return {
    ...base,
    timeoutMs: opts?.timeoutMs ?? base.timeoutMs,
    maxExternalCalls: opts?.maxExternalCalls ?? base.maxExternalCalls,
    maxDiscoveryExternalCalls: opts?.maxDiscoveryExternalCalls ?? base.maxDiscoveryExternalCalls,
    minResolutionReservedCalls: opts?.minResolutionReservedCalls ?? base.minResolutionReservedCalls,
    resolutionReserveMs: opts?.resolutionReserveMs ?? base.resolutionReserveMs,
  };
}

export function setOwnIdeaBudgetPhase(budget: OwnIdeaRunBudget, phase: OwnIdeaBudgetPhase): void {
  budget.phase = phase;
}

export function markResolvableCandidate(budget: OwnIdeaRunBudget): void {
  budget.hadResolvableCandidate = true;
}

export function totalSearches(budget: OwnIdeaRunBudget): number {
  return budget.catalogSearches + budget.builderSearches;
}

export function totalExternalCalls(budget: OwnIdeaRunBudget): number {
  return budget.discoveryExternalCalls + budget.resolutionExternalCalls + budget.builderExternalCalls;
}

export function budgetTimedOut(budget: OwnIdeaRunBudget, now = Date.now()): boolean {
  return now - budget.startedAt > budget.timeoutMs;
}

export function remainingMs(budget: OwnIdeaRunBudget, now = Date.now()): number {
  return Math.max(0, budget.timeoutMs - (now - budget.startedAt));
}

export function remainingResolutionReserve(budget: OwnIdeaRunBudget): number {
  return Math.max(0, budget.minResolutionReservedCalls - budget.resolutionExternalCalls);
}

export function remainingForPhase(
  budget: OwnIdeaRunBudget,
  phase: OwnIdeaBudgetPhase,
  now = Date.now(),
): number {
  const rem = remainingMs(budget, now);
  if (phase === "discovery" && budget.resolutionExternalCalls === 0) {
    return Math.max(0, rem - budget.resolutionReserveMs);
  }
  return rem;
}

export function requestTimeoutMs(
  budget: OwnIdeaRunBudget,
  providerTimeoutMs: number,
  phase: OwnIdeaBudgetPhase = budget.phase,
  now = Date.now(),
): number {
  const cap = remainingForPhase(budget, phase, now);
  return Math.max(250, Math.min(providerTimeoutMs, cap || 250));
}

export function canConsumeSearch(budget: OwnIdeaRunBudget, now = Date.now()): boolean {
  if (budgetTimedOut(budget, now)) return false;
  return totalSearches(budget) < budget.maxSearches;
}

export function canConsumeExternal(budget: OwnIdeaRunBudget, now = Date.now()): boolean {
  if (budgetTimedOut(budget, now)) return false;
  return totalExternalCalls(budget) < budget.maxExternalCalls;
}

export function canConsumeDiscovery(budget: OwnIdeaRunBudget, now = Date.now()): boolean {
  if (!canConsumeExternal(budget, now)) return false;
  if (budget.discoveryExternalCalls >= budget.maxDiscoveryExternalCalls) {
    return false;
  }
  if (remainingForPhase(budget, "discovery", now) < 250) {
    return false;
  }
  if (budget.hadResolvableCandidate) {
    const reserve = remainingResolutionReserve(budget);
    if (budget.maxExternalCalls - totalExternalCalls(budget) <= reserve) {
      return false;
    }
  }
  return true;
}

export function canConsumeResolution(budget: OwnIdeaRunBudget, now = Date.now()): boolean {
  if (!canConsumeExternal(budget, now)) return false;
  return remainingMs(budget, now) >= 250;
}

export function shouldStopDiscoveryForReserve(budget: OwnIdeaRunBudget, now = Date.now()): boolean {
  if (budgetTimedOut(budget, now)) return true;
  if (!canConsumeDiscovery(budget, now)) return true;
  if (budget.hadResolvableCandidate && remainingForPhase(budget, "discovery", now) < 400) {
    return true;
  }
  return false;
}

export function consumeSearch(
  budget: OwnIdeaRunBudget,
  layer: OwnIdeaRunBudgetLayer,
  now = Date.now(),
): boolean {
  if (budgetTimedOut(budget, now)) {
    budget.stopReason = "timeout";
    budget.budgetExhaustedPhase = "timeout";
    return false;
  }
  if (totalSearches(budget) >= budget.maxSearches) {
    budget.stopReason = "budget_searches";
    return false;
  }
  if (layer === "catalog") budget.catalogSearches += 1;
  else budget.builderSearches += 1;
  return true;
}

export function consumeActualHttp(
  budget: OwnIdeaRunBudget,
  phase: OwnIdeaBudgetPhase,
  now = Date.now(),
): boolean {
  if (budgetTimedOut(budget, now)) {
    budget.stopReason = "timeout";
    budget.budgetExhaustedPhase = "timeout";
    return false;
  }
  if (totalExternalCalls(budget) >= budget.maxExternalCalls) {
    budget.stopReason = "budget_external";
    budget.budgetExhaustedPhase = phase === "builder" ? budget.budgetExhaustedPhase : phase;
    return false;
  }
  if (phase === "discovery") {
    if (!canConsumeDiscovery(budget, now)) {
      budget.discoveryStoppedForResolutionReserve = true;
      budget.stopReason = budget.stopReason || "discovery_reserve";
      budget.budgetExhaustedPhase = budget.budgetExhaustedPhase || "discovery";
      return false;
    }
    budget.discoveryExternalCalls += 1;
    budget.catalogExternalCalls += 1;
    return true;
  }
  if (phase === "resolution") {
    if (!canConsumeResolution(budget, now)) {
      budget.stopReason = budget.stopReason || "budget_external";
      budget.budgetExhaustedPhase = budget.budgetExhaustedPhase || "resolution";
      return false;
    }
    if (budget.budgetRemainingAtFirstResolution == null) {
      budget.budgetRemainingAtFirstResolution = remainingMs(budget, now);
    }
    budget.resolutionExternalCalls += 1;
    budget.catalogExternalCalls += 1;
    return true;
  }
  budget.builderExternalCalls += 1;
  return true;
}

/**
 * Legacy hard-cap counter (4Q.3 tests). Does not apply discovery reserve.
 * Live Serper / safeFetch / interleaved catalog use consumeActualHttp.
 */
export function consumeExternal(
  budget: OwnIdeaRunBudget,
  layer: OwnIdeaRunBudgetLayer,
  now = Date.now(),
): boolean {
  if (budgetTimedOut(budget, now)) {
    budget.stopReason = "timeout";
    budget.budgetExhaustedPhase = "timeout";
    return false;
  }
  if (totalExternalCalls(budget) >= budget.maxExternalCalls) {
    budget.stopReason = "budget_external";
    return false;
  }
  if (layer === "builder") {
    budget.builderExternalCalls += 1;
    return true;
  }
  if (budget.phase === "resolution") {
    if (budget.budgetRemainingAtFirstResolution == null) {
      budget.budgetRemainingAtFirstResolution = remainingMs(budget, now);
    }
    budget.resolutionExternalCalls += 1;
    budget.catalogExternalCalls += 1;
    return true;
  }
  budget.discoveryExternalCalls += 1;
  budget.catalogExternalCalls += 1;
  return true;
}

/** Count one actual HTTP when an own-ideas run is active. No-op outside that ALS. */
export function noteActiveExternalHttp(
  phase?: OwnIdeaBudgetPhase,
  now = Date.now(),
): boolean {
  const budget = budgetAls.getStore();
  if (!budget) return true;
  return consumeActualHttp(budget, phase ?? budget.phase, now);
}

export function snapshotBudget(budget: OwnIdeaRunBudget, now = Date.now()): OwnIdeaRunBudgetSnapshot {
  const actual = totalExternalCalls(budget);
  return {
    catalogSearches: budget.catalogSearches,
    builderSearches: budget.builderSearches,
    catalogExternalCalls: budget.catalogExternalCalls,
    builderExternalCalls: budget.builderExternalCalls,
    discoveryExternalCalls: budget.discoveryExternalCalls,
    resolutionExternalCalls: budget.resolutionExternalCalls,
    actualExternalHttpCalls: actual,
    totalSearches: totalSearches(budget),
    totalExternalCalls: actual,
    maxSearches: budget.maxSearches,
    maxExternalCalls: budget.maxExternalCalls,
    timeoutMs: budget.timeoutMs,
    timedOut: budgetTimedOut(budget, now),
    stopReason: budget.stopReason,
    discoveryStoppedForResolutionReserve: budget.discoveryStoppedForResolutionReserve,
    budgetRemainingAtFirstResolution: budget.budgetRemainingAtFirstResolution,
    budgetExhaustedPhase: budget.budgetExhaustedPhase,
    discoveryTimeMs: budget.discoveryTimeMs,
    resolutionTimeMs: budget.resolutionTimeMs,
    runWallTimeMs: now - budget.startedAt,
  };
}

export function assertHardBudget(budget: OwnIdeaRunBudget): void {
  if (totalSearches(budget) > budget.maxSearches) {
    throw new Error(
      `own-ideas run searches ${totalSearches(budget)} exceed hard maxSearches=${budget.maxSearches}`,
    );
  }
  if (totalExternalCalls(budget) > budget.maxExternalCalls) {
    throw new Error(
      `own-ideas run externalCalls ${totalExternalCalls(budget)} exceed hard maxExternalCalls=${budget.maxExternalCalls}`,
    );
  }
  if (budget.discoveryExternalCalls > budget.maxDiscoveryExternalCalls) {
    throw new Error(
      `own-ideas discovery HTTP ${budget.discoveryExternalCalls} exceed discoveryMaxExternalCalls=${budget.maxDiscoveryExternalCalls}`,
    );
  }
}
