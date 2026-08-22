"use server";

import { requireStaff } from "@/lib/auth/require-staff";
import {
  buildContextFromManual,
  buildContextFromNeed,
  formatDiscoveryRunRu,
  runDiscovery,
  type DiscoverySourceCategory,
} from "@/lib/opportunity-discovery";
import { rowToNeed, type NeedProfileRow } from "@/lib/need-profile/mappers";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DiscoveryActionState = {
  error?: string;
  success?: string;
  summary?: string;
  internalCount?: number;
  externalCount?: number;
  internalSufficient?: boolean;
};

function revalidateDiscovery(requestId?: string | null) {
  revalidatePath("/admin/owner/discovery");
  revalidatePath("/admin/owner/inbox");
  if (requestId) {
    revalidatePath(`/admin/owner/inbox/${requestId}`);
  }
  revalidatePath("/admin/owner/lia/opportunities");
  revalidatePath("/admin/owner/publishing");
}

async function loadNeed(needProfileId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("need_profiles")
    .select("*")
    .eq("id", needProfileId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToNeed(data as NeedProfileRow);
}

/**
 * PASS 1 only — internal CKR search for a request.
 */
export async function findInternalVariantsForRequestAction(
  _prev: DiscoveryActionState,
  formData: FormData,
): Promise<DiscoveryActionState> {
  const staff = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const needProfileId = String(formData.get("needProfileId") ?? "").trim();
  if (!requestId || !needProfileId) {
    return { error: "Нужны requestId и Need Profile" };
  }

  const need = await loadNeed(needProfileId);
  if (!need) return { error: "Need Profile не найден" };

  const supabase = createClient();
  const { data: req } = await supabase
    .from("ckr_requests")
    .select("organization_id")
    .eq("id", requestId)
    .maybeSingle();

  try {
    const context = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need,
      requestId,
      organizationId: (req?.organization_id as string) || null,
    });
    const result = await runDiscovery({
      context,
      userId: staff.user.id,
      expandExternal: false,
    });

    await supabase.from("ckr_request_events").insert({
      request_id: requestId,
      event_type: "DISCOVERY_INTERNAL",
      title: "Поиск внутри ЦКР",
      detail: `Найдено: ${result.internal.length}; достаточно: ${result.internalSufficient ? "да" : "нет"}`,
      visibility: "INTERNAL",
      actor_user_id: staff.user.id,
      meta: {
        stage4o: true,
        mode: "REQUEST_DRIVEN",
        pass: "INTERNAL",
        fingerprint: result.plan.contextFingerprint,
        internal_count: result.internal.length,
        internal_sufficient: result.internalSufficient,
        auto_publish: false,
      },
    });

    revalidateDiscovery(requestId);
    return {
      success: result.internalSufficient
        ? "Внутри ЦКР есть варианты. Можно работать с ними или расширить поиск."
        : "Внутри ЦКР мало вариантов. Рекомендуется расширить поиск.",
      summary: formatDiscoveryRunRu(result),
      internalCount: result.internal.length,
      externalCount: 0,
      internalSufficient: result.internalSufficient,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Ошибка внутреннего поиска",
    };
  }
}

/**
 * PASS 2+ — external expansion, owner-only action.
 */
export async function expandExternalSearchForRequestAction(
  _prev: DiscoveryActionState,
  formData: FormData,
): Promise<DiscoveryActionState> {
  const staff = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const needProfileId = String(formData.get("needProfileId") ?? "").trim();
  if (!requestId || !needProfileId) {
    return { error: "Нужны requestId и Need Profile" };
  }

  const need = await loadNeed(needProfileId);
  if (!need) return { error: "Need Profile не найден" };

  const supabase = createClient();
  try {
    const context = buildContextFromNeed({
      mode: "REQUEST_DRIVEN",
      need,
      requestId,
    });
    const result = await runDiscovery({
      context,
      userId: staff.user.id,
      expandExternal: true,
    });

    await supabase.from("ckr_request_events").insert({
      request_id: requestId,
      event_type: "DISCOVERY_EXTERNAL",
      title: "Расширенный поиск",
      detail: `Внешних: ${result.external.length}; всего после dedup: ${result.candidates.length}`,
      visibility: "INTERNAL",
      actor_user_id: staff.user.id,
      meta: {
        stage4o: true,
        mode: "REQUEST_DRIVEN",
        pass: "EXTERNAL",
        fingerprint: result.plan.contextFingerprint,
        external_count: result.external.length,
        duplicates: result.metrics.duplicates,
        auto_publish: false,
        auto_outreach: false,
      },
    });

    revalidateDiscovery(requestId);
    return {
      success:
        "Расширенный поиск завершён. Автопубликации нет — проверьте Controlled Publish.",
      summary: formatDiscoveryRunRu(result),
      internalCount: result.internal.length,
      externalCount: result.external.length,
      internalSufficient: result.internalSufficient,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Ошибка внешнего поиска",
    };
  }
}

/**
 * Market-driven discovery (no client request).
 */
export async function runMarketDiscoveryAction(
  _prev: DiscoveryActionState,
  formData: FormData,
): Promise<DiscoveryActionState> {
  const staff = await requireStaff();
  const freeText = String(formData.get("freeText") ?? "").trim();
  const intent = String(formData.get("intent") ?? "").trim() || null;
  const region = String(formData.get("region") ?? "").trim() || null;
  const industry = String(formData.get("industry") ?? "").trim() || null;
  const budgetMaxRaw = String(formData.get("budgetMax") ?? "").trim();
  const budgetMax = budgetMaxRaw ? Number(budgetMaxRaw) : null;
  const expandExternal = String(formData.get("expandExternal") ?? "") === "1";
  const category = String(formData.get("category") ?? "").trim();

  if (!freeText && !intent && !region) {
    return { error: "Укажите, что искать (текст, регион или intent)" };
  }

  const categories = category
    ? ([category] as DiscoverySourceCategory[])
    : undefined;

  try {
    const context = buildContextFromManual({
      mode: "MARKET_DRIVEN",
      freeText:
        freeText ||
        [intent, industry, region, budgetMax != null ? `до ${budgetMax}` : ""]
          .filter(Boolean)
          .join(" "),
      intent,
      region,
      industry,
      budgetMax: Number.isFinite(budgetMax) ? budgetMax : null,
      categories,
    });

    const result = await runDiscovery({
      context,
      userId: staff.user.id,
      expandExternal,
    });

    revalidateDiscovery(null);
    return {
      success: expandExternal
        ? "Market-driven поиск выполнен. Кандидаты только для owner review — без автопубликации."
        : "Сначала внутренний банк ЦКР. Отметьте «Расширить поиск», чтобы идти в интернет.",
      summary: formatDiscoveryRunRu(result),
      internalCount: result.internal.length,
      externalCount: result.external.length,
      internalSufficient: result.internalSufficient,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Ошибка market discovery",
    };
  }
}

/**
 * Persist owner review state via event (no new table).
 */
export async function setCandidateReviewStateAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const itemType = String(formData.get("itemType") ?? "").trim();
  const itemId = String(formData.get("itemId") ?? "").trim();
  const state = String(formData.get("state") ?? "CHECKING").trim();
  const title = String(formData.get("title") ?? "").trim() || "Кандидат";

  if (!requestId || !itemType || !itemId) {
    throw new Error("Недостаточно данных");
  }

  const supabase = createClient();
  await supabase.from("ckr_request_events").insert({
    request_id: requestId,
    event_type: "CANDIDATE_REVIEW",
    title: `Проверка: ${title.slice(0, 120)}`,
    detail: state,
    visibility: "INTERNAL",
    actor_user_id: staff.user.id,
    meta: {
      stage4o: true,
      item_type: itemType,
      item_id: itemId,
      state,
    },
  });

  revalidateDiscovery(requestId);
}
