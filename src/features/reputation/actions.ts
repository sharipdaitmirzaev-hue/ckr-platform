"use server";

import {
  isReviewTargetType,
  isTrustBadgeKey,
  trustBadgeDescriptions,
  trustBadgeLabels,
} from "@/config/reputation";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ensureReputationProfile } from "@/lib/reputation/ensure-profile";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ReputationActionState = {
  error?: string;
  success?: string;
};

function revalidateReputation(targetId: string) {
  revalidatePath(`/profile/${targetId}`);
  revalidatePath("/lia");
}

export async function createReviewAction(
  _prev: ReputationActionState,
  formData: FormData,
): Promise<ReputationActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Войдите в аккаунт, чтобы оставить отзыв." };

  const targetType = String(formData.get("targetType") ?? "").trim();
  const targetId = String(formData.get("targetId") ?? "").trim();
  const dealIdRaw = String(formData.get("dealId") ?? "").trim();
  const ratingRaw = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!isReviewTargetType(targetType)) {
    return { error: "Некорректный тип цели отзыва." };
  }
  if (!targetId) return { error: "Не указан участник или сущность." };
  if (!Number.isInteger(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    return { error: "Оценка должна быть от 1 до 5." };
  }
  if (comment.length > 2000) {
    return { error: "Комментарий слишком длинный (макс. 2000 символов)." };
  }
  if (
    user.id === targetId &&
    ["expert", "investor", "service"].includes(targetType)
  ) {
    return { error: "Нельзя оставить отзыв самому себе." };
  }

  const dealId = dealIdRaw || null;

  const { error } = await supabase.from("reviews").insert({
    author_id: user.id,
    target_type: targetType,
    target_id: targetId,
    deal_id: dealId,
    rating: ratingRaw,
    comment,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Вы уже оставляли отзыв об этой цели." };
    }
    return { error: error.message };
  }

  if (targetType === "organization") {
    await ensureReputationProfile("organization", targetId);
  } else {
    await ensureReputationProfile("user", targetId);
  }

  revalidateReputation(targetId);
  return { success: "Отзыв опубликован." };
}

export async function awardTrustBadgeAction(
  _prev: ReputationActionState,
  formData: FormData,
): Promise<ReputationActionState> {
  const current = await getCurrentUser();
  if (!current) return { error: "Войдите в аккаунт." };
  if (!current.roles.includes("admin")) {
    return { error: "Выдача бейджей доступна только администратору ЦКР." };
  }

  const entityType = String(formData.get("entityType") ?? "user").trim();
  const entityId = String(formData.get("entityId") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim();

  if (entityType !== "user" && entityType !== "organization") {
    return { error: "Некорректный тип сущности." };
  }
  if (!entityId) return { error: "Не указан участник." };
  if (!isTrustBadgeKey(badge)) return { error: "Некорректный бейдж." };

  const supabase = createClient();
  const { error } = await supabase.from("trust_badges").upsert(
    {
      entity_type: entityType,
      entity_id: entityId,
      badge,
    },
    { onConflict: "entity_type,entity_id,badge" },
  );

  if (error) return { error: error.message };

  revalidateReputation(entityId);
  return {
    success: `Бейдж «${trustBadgeLabels[badge]}» выдан. ${trustBadgeDescriptions[badge]}`,
  };
}
