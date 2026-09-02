/**
 * Stage 4Q.3 — one hard budget for a single owner run.
 * Catalog and builder share the same counters. Layers must not each
 * re-apply maxSearches / maxExternalCalls independently.
 */
import { CKR_OWN_IDEAS_BUDGETS } from "@/config/ckr-own-ideas";

export type OwnIdeaRunBudgetLayer = "catalog" | "builder";

export type OwnIdeaRunBudgetSnapshot = {
  catalogSearches: number;
  builderSearches: number;
  catalogExternalCalls: number;
  builderExternalCalls: number;
  totalSearches: number;
  totalExternalCalls: number;
  maxSearches: number;
  maxExternalCalls: number;
  timeoutMs: number;
  timedOut: boolean;
  stopReason: string | null;
};

export type OwnIdeaRunBudget = {
  readonly maxSearches: number;
  readonly maxExternalCalls: number;
  readonly timeoutMs: number;
  readonly startedAt: number;
  catalogSearches: number;
  builderSearches: number;
  catalogExternalCalls: number;
  builderExternalCalls: number;
  stopReason: string | null;
};

export function createOwnIdeaRunBudget(now = Date.now()): OwnIdeaRunBudget {
  return {
    maxSearches: CKR_OWN_IDEAS_BUDGETS.maxSearches,
    maxExternalCalls: CKR_OWN_IDEAS_BUDGETS.maxExternalCalls,
    timeoutMs: CKR_OWN_IDEAS_BUDGETS.timeoutMs,
    startedAt: now,
    catalogSearches: 0,
    builderSearches: 0,
    catalogExternalCalls: 0,
    builderExternalCalls: 0,
    stopReason: null,
  };
}

export function totalSearches(budget: OwnIdeaRunBudget): number {
  return budget.catalogSearches + budget.builderSearches;
}

export function totalExternalCalls(budget: OwnIdeaRunBudget): number {
  return budget.catalogExternalCalls + budget.builderExternalCalls;
}

export function budgetTimedOut(budget: OwnIdeaRunBudget, now = Date.now()): boolean {
  return now - budget.startedAt > budget.timeoutMs;
}

export function canConsumeSearch(budget: OwnIdeaRunBudget, now = Date.now()): boolean {
  if (budgetTimedOut(budget, now)) return false;
  return totalSearches(budget) < budget.maxSearches;
}

export function canConsumeExternal(budget: OwnIdeaRunBudget, now = Date.now()): boolean {
  if (budgetTimedOut(budget, now)) return false;
  return totalExternalCalls(budget) < budget.maxExternalCalls;
}

export function consumeSearch(
  budget: OwnIdeaRunBudget,
  layer: OwnIdeaRunBudgetLayer,
  now = Date.now(),
): boolean {
  if (budgetTimedOut(budget, now)) {
    budget.stopReason = "timeout";
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

export function consumeExternal(
  budget: OwnIdeaRunBudget,
  layer: OwnIdeaRunBudgetLayer,
  now = Date.now(),
): boolean {
  if (budgetTimedOut(budget, now)) {
    budget.stopReason = "timeout";
    return false;
  }
  if (totalExternalCalls(budget) >= budget.maxExternalCalls) {
    budget.stopReason = "budget_external";
    return false;
  }
  if (layer === "catalog") budget.catalogExternalCalls += 1;
  else budget.builderExternalCalls += 1;
  return true;
}

export function snapshotBudget(budget: OwnIdeaRunBudget, now = Date.now()): OwnIdeaRunBudgetSnapshot {
  return {
    catalogSearches: budget.catalogSearches,
    builderSearches: budget.builderSearches,
    catalogExternalCalls: budget.catalogExternalCalls,
    builderExternalCalls: budget.builderExternalCalls,
    totalSearches: totalSearches(budget),
    totalExternalCalls: totalExternalCalls(budget),
    maxSearches: budget.maxSearches,
    maxExternalCalls: budget.maxExternalCalls,
    timeoutMs: budget.timeoutMs,
    timedOut: budgetTimedOut(budget, now),
    stopReason: budget.stopReason,
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
}
