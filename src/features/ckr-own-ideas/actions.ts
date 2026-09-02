"use server";

import { revalidatePath } from "next/cache";
import {
  CKR_OWN_IDEAS_DIAGNOSTICS_PATH,
  CKR_OWN_IDEAS_PATH,
} from "@/config/ckr-own-ideas";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { applyOwnerAction, runOwnIdeaBuilder } from "@/lib/ckr-own-ideas/builder";
import { buildOwnIdeaCatalog } from "@/lib/ckr-own-ideas/live-catalog";
import { createOwnIdeaRunBudget } from "@/lib/ckr-own-ideas/run-budget";
import { getOwnIdeaStore } from "@/lib/ckr-own-ideas/store";
import type { OwnIdeaRunMetrics } from "@/types/ckr-own-ideas";

export type OwnIdeaActionState = {
  error?: string;
  success?: string;
  generated?: number;
  rejected?: number;
  persistStatus?: OwnIdeaRunMetrics["persistStatus"];
};

function revalidateIdeas(id?: string) {
  revalidatePath(CKR_OWN_IDEAS_PATH);
  revalidatePath(CKR_OWN_IDEAS_DIAGNOSTICS_PATH);
  revalidatePath("/admin/owner");
  if (id) revalidatePath(`${CKR_OWN_IDEAS_PATH}/${id}`);
}

export async function findNewOwnIdeasAction(): Promise<OwnIdeaActionState> {
  const owner = await requireLiaOiOwner();
  const store = getOwnIdeaStore();
  const existing = await store.list();
  const budget = createOwnIdeaRunBudget();
  let live;
  try {
    live = await buildOwnIdeaCatalog({ userId: owner.user.id, budget });
  } catch (e) {
    return {
      error: `Не удалось собрать каталог: ${e instanceof Error ? e.message : "unknown"}`,
      persistStatus: "failed",
    };
  }
  const result = runOwnIdeaBuilder({
    catalog: live.catalog,
    existing,
    catalogMode: live.mode,
    budget,
    liveMeta: {
      queries: live.queries,
      externalCalls: live.externalCalls,
      realSignals: live.realSignals,
      rejectedSignals: live.rejectedSignals,
      catalogSearches: live.catalogSearches,
      catalogExternalCalls: live.catalogExternalCalls,
      discoveryCandidates: live.discoveryCandidates,
      detailResolutionAttempts: live.detailResolutionAttempts,
      officialDetailsResolved: live.officialDetailsResolved,
      aggregatorCandidates: live.aggregatorCandidates,
      aggregatorToOfficialResolved: live.aggregatorToOfficialResolved,
      detailValidationRejected: live.detailValidationRejected,
      liveFacts: live.liveFacts,
      budgetExhausted: live.budgetExhausted,
      actualExternalHttpCalls: live.actualExternalHttpCalls,
      discoveryExternalCalls: live.discoveryExternalCalls,
      resolutionExternalCalls: live.resolutionExternalCalls,
      discoveryTimeMs: live.discoveryTimeMs,
      resolutionTimeMs: live.resolutionTimeMs,
      runWallTimeMs: live.runWallTimeMs,
      discoveryStoppedForResolutionReserve: live.discoveryStoppedForResolutionReserve,
      budgetRemainingAtFirstResolution: live.budgetRemainingAtFirstResolution,
      budgetExhaustedPhase: live.budgetExhaustedPhase,
      candidateDiagnostics: live.candidateDiagnostics,
    },
  });

  const running: OwnIdeaRunMetrics = {
    ...result.metrics,
    persistStatus: "running",
    persistError: null,
    ideasPersisted: 0,
  };
  try {
    await store.saveRun(running);
  } catch (e) {
    return {
      error: `Не удалось записать run: ${e instanceof Error ? e.message : "unknown"}`,
      persistStatus: "failed",
    };
  }

  const errors: string[] = [];
  let persisted = 0;
  for (const idea of result.ideas) {
    try {
      await store.upsert(idea);
      persisted += 1;
    } catch (e) {
      errors.push(`${idea.id}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  const persistStatus =
    errors.length === 0 ? "ok" : persisted === 0 ? "failed" : "partial";
  const finished: OwnIdeaRunMetrics = {
    ...result.metrics,
    persistStatus,
    persistError: errors.length ? errors.join("; ") : null,
    ideasPersisted: persisted,
  };
  try {
    await store.saveRun(finished);
  } catch (e) {
    return {
      error: `Идеи: ${persisted}, run status не обновлён: ${e instanceof Error ? e.message : "unknown"}`,
      generated: result.metrics.ideasGenerated,
      rejected: result.metrics.ideasRejected,
      persistStatus: "partial",
    };
  }

  revalidateIdeas();
  if (persistStatus !== "ok") {
    return {
      error: `Сохранение неполное (${persistStatus}). ${finished.persistError}`,
      generated: result.metrics.ideasGenerated,
      rejected: result.metrics.ideasRejected,
      persistStatus,
    };
  }
  return {
    success: `Черновиков: ${result.metrics.ideasGenerated}, обновлено: ${result.metrics.ideasUpdated}. Каталог: ${live.mode}.`,
    generated: result.metrics.ideasGenerated,
    rejected: result.metrics.ideasRejected,
    persistStatus: "ok",
  };
}

export async function ownIdeaOwnerAction(
  ideaId: string,
  action: "accept" | "reject" | "defer" | "research" | "refine" | "create_project",
): Promise<OwnIdeaActionState> {
  await requireLiaOiOwner();
  const store = getOwnIdeaStore();
  const idea = await store.get(ideaId);
  if (!idea) return { error: "Идея не найдена" };
  const next = applyOwnerAction(
    idea,
    action,
    action === "create_project" ? `draft-project-${idea.id}` : idea.projectId,
  );
  try {
    await store.upsert(next);
  } catch (e) {
    return { error: `Не удалось сохранить решение: ${e instanceof Error ? e.message : "unknown"}` };
  }
  revalidateIdeas(ideaId);
  return { success: "Решение владельца записано. Публикации не было." };
}
