"use server";

import { requireStaff } from "@/lib/auth/require-staff";
import {
  formatDiscoverySummaryRu,
  runDemandDiscoveryForNeed,
} from "@/lib/demand-intelligence/discovery";
import { buildDemandClientShareMessage } from "@/lib/demand-intelligence/client-copy";
import { rowToNeed, type NeedProfileRow } from "@/lib/need-profile/mappers";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type DemandDiscoveryActionState = {
  error?: string;
  success?: string;
  summary?: string;
};

function revalidateRequest(id: string) {
  revalidatePath(`/admin/owner/inbox/${id}`);
  revalidatePath("/admin/owner/inbox");
  revalidatePath("/admin/owner/publishing");
  revalidatePath("/admin/owner/lia/opportunities");
}

/**
 * Manual «Найти ещё варианты» from Owner Inbox request card.
 * Does NOT mutate TINDA request fields. Does NOT auto-publish. Does NOT share to client.
 */
export async function findMoreDemandForRequestAction(
  _prev: DemandDiscoveryActionState,
  formData: FormData,
): Promise<DemandDiscoveryActionState> {
  const staff = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const needProfileId = String(formData.get("needProfileId") ?? "").trim();
  if (!requestId || !needProfileId) {
    return { error: "Нужны requestId и Need Profile" };
  }

  const supabase = createClient();
  const { data: needRow, error } = await supabase
    .from("need_profiles")
    .select("*")
    .eq("id", needProfileId)
    .maybeSingle();
  if (error || !needRow) {
    return { error: "Need Profile не найден" };
  }
  const need = rowToNeed(needRow as NeedProfileRow);

  try {
    const summary = await runDemandDiscoveryForNeed({
      need,
      userId: staff.user.id,
      maxQueries: 8,
    });

    // Internal audit only — does not change request status / next_step / client
    await supabase.from("ckr_request_events").insert({
      request_id: requestId,
      event_type: "DEMAND_DISCOVERY",
      title: "Поиск сигналов спроса",
      detail: `Новых: ${summary.newCandidates}; сильных: ${summary.strong}; на проверку: ${summary.needsReview}`,
      visibility: "INTERNAL",
      actor_user_id: staff.user.id,
      meta: {
        stage4m: true,
        queries_planned: summary.queriesPlanned,
        primary_query: summary.primaryQuery,
        new_candidates: summary.newCandidates,
        strong: summary.strong,
        auto_publish: false,
      },
    });

    revalidateRequest(requestId);
    return {
      success: "Поиск завершён. Автопубликации нет — проверьте Controlled Publish.",
      summary: formatDiscoverySummaryRu(summary),
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Ошибка поиска спроса",
    };
  }
}

/** Prefer Stage 4M cautious copy when sharing. */
export async function shareDemandCandidateWithClientAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const itemType = String(formData.get("itemType") ?? "").trim();
  const itemId = String(formData.get("itemId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim() || null;
  const tier = String(formData.get("tier") ?? "CONFIRMED_DEMAND").trim();
  const whyShort = String(formData.get("whyShort") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim() || null;

  if (!requestId || !itemType || !itemId || !title) {
    throw new Error("Недостаточно данных");
  }
  if (itemType === "lia_oi") {
    throw new Error(
      "Raw LIA OI нельзя показывать клиенту. Сначала Controlled Publish.",
    );
  }

  const supabase = createClient();
  if (itemType === "opportunity") {
    const { data: opp } = await supabase
      .from("opportunities")
      .select("id, status")
      .eq("id", itemId)
      .maybeSingle();
    if (!opp || String(opp.status).toLowerCase() !== "published") {
      throw new Error("Можно показать только опубликованную возможность.");
    }
  }

  const body = buildDemandClientShareMessage({
    title,
    region,
    tier,
    whyShort,
    sourceUrl,
  });

  const { error } = await supabase.from("ckr_request_comments").insert({
    request_id: requestId,
    author_id: staff.user.id,
    body,
    visibility: "CLIENT",
  });
  if (error) throw new Error(error.message);

  await supabase.from("ckr_request_events").insert({
    request_id: requestId,
    event_type: "CANDIDATE_SHARED",
    title: "ЦКР нашёл новый вариант",
    detail: title.slice(0, 200),
    visibility: "CLIENT",
    actor_user_id: staff.user.id,
    meta: { stage4m: true, item_type: itemType, item_id: itemId, tier },
  });

  const { data: req } = await supabase
    .from("ckr_requests")
    .select("from_user_id")
    .eq("id", requestId)
    .maybeSingle();
  if (req?.from_user_id) {
    await supabase.rpc("create_notification", {
      p_user_id: req.from_user_id,
      p_type: "ckr_request",
      p_title: "ЦКР нашёл новый вариант",
      p_body: title.slice(0, 200),
      p_link: `/dashboard/ckr-requests/${requestId}`,
      p_related_type: "ckr_request",
      p_related_id: requestId,
    });
  }

  revalidateRequest(requestId);
}
