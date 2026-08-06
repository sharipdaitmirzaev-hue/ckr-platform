"use server";

import { isInterestTargetType } from "@/config/interests";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type InterestActionState = {
  error?: string;
  success?: string;
  interested?: boolean;
};

export async function toggleInterestAction(
  _prev: InterestActionState,
  formData: FormData,
): Promise<InterestActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Войдите в аккаунт." };

  const targetType = String(formData.get("targetType") ?? "").trim();
  const targetId = String(formData.get("targetId") ?? "").trim();

  if (!isInterestTargetType(targetType)) {
    return { error: "Некорректный тип интереса." };
  }
  if (!targetId) return { error: "Не указан объект." };

  const { data: existing } = await supabase
    .from("investor_interests")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("investor_interests")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/interests");
    revalidatePath("/dashboard");
    return { success: "Интерес снят.", interested: false };
  }

  const { error } = await supabase.from("investor_interests").insert({
    user_id: user.id,
    target_type: targetType,
    target_id: targetId,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: "Уже в интересах.", interested: true };
    }
    return { error: error.message };
  }

  const { trackBetaMilestone } = await import("@/lib/beta/track-milestone");
  await trackBetaMilestone({
    eventType: "first_interest_created",
    userId: user.id,
    entityType: targetType,
    entityId: targetId,
  });
  if (targetType === "project" || targetType === "investment") {
    await trackBetaMilestone({
      eventType: "first_investment_interest",
      userId: user.id,
      entityType: targetType,
      entityId: targetId,
      metadata: { channel: "public_launch" },
    });
  }

  revalidatePath("/dashboard/interests");
  revalidatePath("/dashboard");
  return { success: "Добавлено в интересы.", interested: true };
}
