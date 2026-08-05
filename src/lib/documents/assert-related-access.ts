import type { createClient } from "@/lib/supabase/server";

type Supabase = ReturnType<typeof createClient>;

/**
 * Проверяет, что пользователь связан с сущностью, к которой крепится документ.
 */
export async function assertDocumentRelatedAccess(
  supabase: Supabase,
  userId: string,
  relatedType: string,
  relatedId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (relatedType === "profile") {
    if (relatedId !== userId) {
      return {
        ok: false,
        error: "Можно загружать документы только к своему профилю.",
      };
    }
    return { ok: true };
  }

  if (relatedType === "project") {
    const { data } = await supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", relatedId)
      .maybeSingle();
    if (!data) return { ok: false, error: "Проект не найден." };
    if (data.owner_id === userId) return { ok: true };

    const { data: deal } = await supabase
      .from("deals")
      .select("id")
      .eq("project_id", relatedId)
      .or(`initiator_id.eq.${userId},partner_id.eq.${userId}`)
      .limit(1)
      .maybeSingle();
    if (deal) return { ok: true };

    return { ok: false, error: "Нет доступа к этому проекту." };
  }

  if (relatedType === "opportunity") {
    const { data } = await supabase
      .from("opportunities")
      .select("owner_id")
      .eq("id", relatedId)
      .maybeSingle();
    if (!data || data.owner_id !== userId) {
      return { ok: false, error: "Нет доступа к этой возможности." };
    }
    return { ok: true };
  }

  if (relatedType === "investment") {
    const { data } = await supabase
      .from("investment_offers")
      .select("owner_id")
      .eq("id", relatedId)
      .maybeSingle();
    if (!data || data.owner_id !== userId) {
      return { ok: false, error: "Нет доступа к этому предложению." };
    }
    return { ok: true };
  }

  if (relatedType === "expert") {
    const { data } = await supabase
      .from("expert_profiles")
      .select("user_id")
      .eq("id", relatedId)
      .maybeSingle();
    if (!data || data.user_id !== userId) {
      return { ok: false, error: "Нет доступа к этому профилю эксперта." };
    }
    return { ok: true };
  }

  return { ok: false, error: "Некорректный тип сущности документа." };
}
