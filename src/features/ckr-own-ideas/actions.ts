"use server";

import { revalidatePath } from "next/cache";
import {
  CKR_OWN_IDEAS_DIAGNOSTICS_PATH,
  CKR_OWN_IDEAS_PATH,
} from "@/config/ckr-own-ideas";
import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { applyOwnerAction, runOwnIdeaBuilder } from "@/lib/ckr-own-ideas/builder";
import {
  landTourismCatalog,
  missingFinancingCatalog,
  negativeEconomicsCatalog,
  procurementCatalog,
  tractorEarthworksCatalog,
} from "@/lib/ckr-own-ideas/fixtures";
import { assertNoAutoActions, assertOwnerOnly } from "@/lib/ckr-own-ideas/guards";
import { getOwnIdeaStore } from "@/lib/ckr-own-ideas/store-server";
import type { OwnIdeaCatalog, OwnIdeaRunMetrics } from "@/types/ckr-own-ideas";

export type OwnIdeaActionState = {
  error?: string;
  success?: string;
  generated?: number;
  rejected?: number;
};

function revalidateIdeas(id?: string) {
  revalidatePath(CKR_OWN_IDEAS_PATH);
  revalidatePath(CKR_OWN_IDEAS_DIAGNOSTICS_PATH);
  revalidatePath("/admin/owner");
  if (id) revalidatePath(`${CKR_OWN_IDEAS_PATH}/${id}`);
}

function marketCatalog(): OwnIdeaCatalog {
  const a = tractorEarthworksCatalog();
  const b = landTourismCatalog();
  const c = procurementCatalog();
  const d = missingFinancingCatalog();
  const e = negativeEconomicsCatalog();
  return {
    signals: [...a.signals, ...b.signals, ...c.signals, ...d.signals, ...e.signals],
    internalResources: [
      ...a.internalResources,
      ...b.internalResources,
      ...c.internalResources,
      ...d.internalResources,
      ...e.internalResources,
    ],
    externalResources: [
      ...a.externalResources,
      ...b.externalResources,
      ...c.externalResources,
      ...d.externalResources,
      ...e.externalResources,
    ],
  };
}

function persistErrorMessage(status: NonNullable<OwnIdeaRunMetrics["persistStatus"]>, saved: number, total: number) {
  return `Запуск ${status}: сохранено ${saved} из ${total} идей. Успех не зафиксирован.`;
}

export async function findNewOwnIdeasAction(): Promise<OwnIdeaActionState> {
  await requireLiaOiOwner();
  const store = getOwnIdeaStore();
  const existing = await store.list();
  const result = runOwnIdeaBuilder({
    catalog: marketCatalog(),
    existing,
  });
  assertNoAutoActions(result.metrics);
  for (const idea of result.ideas) assertOwnerOnly(idea);

  const total = result.ideas.length;
  let persisted = 0;
  try {
    await store.saveRun({
      ...result.metrics,
      persistStatus: "running",
      ideasPersisted: 0,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "db error";
    return { error: `Запуск failed: не удалось сохранить run. ${detail}` };
  }

  for (const idea of result.ideas) {
    try {
      await store.upsert(idea);
      persisted += 1;
    } catch (e) {
      console.error("own-ideas persist idea failed", idea.id, e);
    }
  }

  const persistStatus: NonNullable<OwnIdeaRunMetrics["persistStatus"]> =
    persisted === total ? "ok" : persisted === 0 ? "failed" : "partial";
  try {
    await store.saveRun({
      ...result.metrics,
      persistStatus,
      ideasPersisted: persisted,
    });
  } catch (e) {
    console.error("own-ideas persist run status failed", persistStatus, e);
    return {
      error: persistErrorMessage(persistStatus === "ok" ? "failed" : persistStatus, persisted, total),
    };
  }
  revalidateIdeas();

  if (persistStatus !== "ok") {
    return { error: persistErrorMessage(persistStatus, persisted, total) };
  }
  return {
    success: `Черновиков: ${result.metrics.ideasGenerated}, обновлено: ${result.metrics.ideasUpdated}`,
    generated: result.metrics.ideasGenerated,
    rejected: result.metrics.ideasRejected,
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
  assertOwnerOnly(next);
  await store.upsert(next);
  revalidateIdeas(ideaId);
  return { success: "Решение владельца записано. Публикации не было." };
}
