"use server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getPersonalizedFeedService } from "@/lib/personalized-feed/service";
import type { FeedAction, FeedItemType } from "@/types/personalized-feed";
import { revalidatePath } from "next/cache";

export type FeedActionState = {
  error?: string;
  success?: string;
};

async function requireUser() {
  const current = await getCurrentUser();
  if (!current) throw new Error("auth_required");
  return current;
}

export async function feedFeedbackAction(
  _prev: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  try {
    const current = await requireUser();
    const action = String(formData.get("action") || "") as FeedAction;
    const itemType = String(formData.get("itemType") || "") as FeedItemType;
    const itemId = String(formData.get("itemId") || "").trim();
    const needProfileId = String(formData.get("needProfileId") || "").trim() || null;
    const scoreRaw = String(formData.get("score") || "").trim();
    const title = String(formData.get("title") || "").trim();

    if (!action || !itemType || !itemId) {
      return { error: "Некорректные параметры" };
    }

    const svc = getPersonalizedFeedService("supabase");

    if (action === "assigned_to_lia") {
      await svc.assignLiaReview({
        userId: current.user.id,
        needProfileId,
        itemType,
        itemId,
        title: title || itemId,
      });
      revalidatePath("/dashboard/for-you");
      return { success: "Лия получила задачу на проверку (без авто-контактов)." };
    }

    await svc.recordFeedback({
      userId: current.user.id,
      needProfileId,
      itemType,
      itemId,
      action,
      score: scoreRaw ? Number(scoreRaw) : null,
      metadata: title ? { title } : {},
    });

    revalidatePath("/dashboard/for-you");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/interests");

    const labels: Record<string, string> = {
      interested: "Отмечено как интересное",
      not_interested: "Скрыто из ленты",
      saved: "Сохранено",
      open: "Открыто",
    };
    return { success: labels[action] || "Сохранено" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }
}
