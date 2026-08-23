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
import { getOwnIdeaStore } from "@/lib/ckr-own-ideas/store";
import type { OwnIdeaCatalog } from "@/types/ckr-own-ideas";

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

export async function findNewOwnIdeasAction(): Promise<OwnIdeaActionState> {
  await requireLiaOiOwner();
  const store = getOwnIdeaStore();
  const result = runOwnIdeaBuilder({
    catalog: marketCatalog(),
    existing: store.list(),
  });
  for (const idea of result.ideas) store.upsert(idea);
  store.saveRun(result.metrics);
  revalidateIdeas();
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
  const idea = store.get(ideaId);
  if (!idea) return { error: "Идея не найдена" };
  const next = applyOwnerAction(
    idea,
    action,
    action === "create_project" ? `draft-project-${idea.id}` : idea.projectId,
  );
  store.upsert(next);
  revalidateIdeas(ideaId);
  return { success: "Решение владельца записано. Публикации не было." };
}
