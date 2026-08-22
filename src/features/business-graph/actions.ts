"use server";

import { requireLiaOiOwner } from "@/lib/auth/require-lia-oi-owner";
import { getBusinessGraphService } from "@/lib/business-graph/service";
import { revalidatePath } from "next/cache";

export type GraphActionState = {
  error?: string;
  success?: string;
};

function graphPath(nodeId?: string | null) {
  const q = nodeId ? `?node=${encodeURIComponent(nodeId)}` : "";
  return `/admin/owner/graph${q}`;
}

export async function confirmGraphEdgeAction(
  _prev: GraphActionState,
  formData: FormData,
): Promise<GraphActionState> {
  const current = await requireLiaOiOwner();
  const edgeId = String(formData.get("edgeId") || "");
  const nodeId = String(formData.get("nodeId") || "");
  const comment = String(formData.get("comment") || "").trim() || undefined;
  if (!edgeId) return { error: "edgeId обязателен" };
  try {
    await getBusinessGraphService().confirmEdge(
      edgeId,
      current.user.id,
      comment,
    );
    revalidatePath(graphPath(nodeId));
    return { success: "Связь подтверждена" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка подтверждения" };
  }
}

export async function rejectGraphEdgeAction(
  _prev: GraphActionState,
  formData: FormData,
): Promise<GraphActionState> {
  const current = await requireLiaOiOwner();
  const edgeId = String(formData.get("edgeId") || "");
  const nodeId = String(formData.get("nodeId") || "");
  const comment = String(formData.get("comment") || "").trim() || undefined;
  if (!edgeId) return { error: "edgeId обязателен" };
  try {
    await getBusinessGraphService().rejectEdge(
      edgeId,
      current.user.id,
      comment,
    );
    revalidatePath(graphPath(nodeId));
    return { success: "Связь отклонена" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка отклонения" };
  }
}

export async function commentGraphEdgeAction(
  _prev: GraphActionState,
  formData: FormData,
): Promise<GraphActionState> {
  const current = await requireLiaOiOwner();
  const edgeId = String(formData.get("edgeId") || "");
  const nodeId = String(formData.get("nodeId") || "");
  const comment = String(formData.get("comment") || "").trim();
  if (!edgeId) return { error: "edgeId обязателен" };
  if (!comment) return { error: "Комментарий пуст" };
  try {
    await getBusinessGraphService().commentEdge(
      edgeId,
      current.user.id,
      comment,
    );
    revalidatePath(graphPath(nodeId));
    return { success: "Комментарий сохранён" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка комментария" };
  }
}
