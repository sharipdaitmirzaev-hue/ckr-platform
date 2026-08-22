"use server";

import { requireStaff } from "@/lib/auth/require-staff";
import { buildClientShareMessage } from "@/lib/ckr-inbox/request-workbench";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function revalidateShare(id: string) {
  revalidatePath("/admin/owner/inbox");
  revalidatePath(`/admin/owner/inbox/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ckr-requests");
  revalidatePath(`/dashboard/ckr-requests/${id}`);
}

/**
 * Stage 4L — share a published demand candidate with the CLIENT.
 * Uses existing ckr_request_comments + events + notification.
 * No new table. No auto-publish. No MATCHES. No outreach.
 */
export async function shareCandidateWithClientAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const itemType = String(formData.get("itemType") ?? "").trim();
  const itemId = String(formData.get("itemId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const signalTypeLabel = String(formData.get("signalTypeLabel") ?? "Вариант").trim();
  const region = String(formData.get("region") ?? "").trim() || null;
  const whyShort = String(formData.get("whyShort") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim() || null;

  if (!requestId || !itemType || !itemId || !title) {
    throw new Error("Недостаточно данных для показа клиенту");
  }

  const supabase = createClient();

  // Only share published marketplace opportunities (defense in depth).
  if (itemType === "opportunity") {
    const { data: opp } = await supabase
      .from("opportunities")
      .select("id, status, type")
      .eq("id", itemId)
      .maybeSingle();
    if (!opp || String(opp.status).toLowerCase() !== "published") {
      throw new Error(
        "Можно показать клиенту только опубликованную возможность. Сначала Controlled Publish.",
      );
    }
  }

  const body = buildClientShareMessage({
    title,
    signalTypeLabel,
    region,
    whyShort:
      whyShort ||
      "Эта закупка может соответствовать вашему ассортименту. ЦКР рекомендует проверить условия участия.",
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
    detail: `${signalTypeLabel}: ${title}`.slice(0, 200),
    visibility: "CLIENT",
    actor_user_id: staff.user.id,
    meta: {
      stage4l: true,
      item_type: itemType,
      item_id: itemId,
      signal_type: signalTypeLabel,
      region,
      shared: true,
    },
  });

  // Internal audit trail (staff-only)
  await supabase.from("ckr_request_events").insert({
    request_id: requestId,
    event_type: "CANDIDATE_SHARED_INTERNAL",
    title: "Вариант показан клиенту",
    detail: `${itemType}:${itemId}`,
    visibility: "INTERNAL",
    actor_user_id: staff.user.id,
    meta: {
      stage4l: true,
      item_type: itemType,
      item_id: itemId,
    },
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
      p_body: `${signalTypeLabel}: ${title}`.slice(0, 200),
      p_link: `/dashboard/ckr-requests/${requestId}`,
      p_related_type: "ckr_request",
      p_related_id: requestId,
    });
  }

  revalidateShare(requestId);
}
