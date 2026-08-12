"use server";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function assertOwnsRequest(requestId: string, userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("ckr_requests")
    .select("id, from_user_id, organization_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!data) return false;
  if (data.from_user_id === userId) return true;
  if (data.organization_id) {
    const { data: mem } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", data.organization_id)
      .eq("user_id", userId)
      .maybeSingle();
    return Boolean(mem);
  }
  return false;
}

function revalidateClient(requestId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ckr-requests");
  revalidatePath(`/dashboard/ckr-requests/${requestId}`);
  revalidatePath("/admin/owner/inbox");
  revalidatePath(`/admin/owner/inbox/${requestId}`);
}

/** Client reply to CKR — uses existing ckr_request_comments (CLIENT). */
export async function replyToCkrRequestAction(formData: FormData): Promise<void> {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const requestId = String(formData.get("requestId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!requestId || body.length < 2) {
    throw new Error("Напишите сообщение.");
  }
  if (!(await assertOwnsRequest(requestId, current.user.id))) {
    throw new Error("Нет доступа к обращению.");
  }

  const supabase = createClient();
  const { error } = await supabase.from("ckr_request_comments").insert({
    request_id: requestId,
    author_id: current.user.id,
    body,
    visibility: "CLIENT",
  });
  if (error) throw new Error(error.message);

  await supabase.from("ckr_request_events").insert({
    request_id: requestId,
    event_type: "CLIENT_MESSAGE",
    title: "Вы написали ЦКР",
    detail: body.slice(0, 200),
    visibility: "CLIENT",
    actor_user_id: current.user.id,
    meta: { kind: "client_reply" },
  });

  // Notify staff (in-app)
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(20);
  for (const admin of admins || []) {
    await supabase.rpc("create_notification", {
      p_user_id: admin.id,
      p_type: "ckr_request",
      p_title: "Ответ клиента по обращению",
      p_body: body.slice(0, 200),
      p_link: `/admin/owner/inbox/${requestId}`,
      p_related_type: "ckr_request",
      p_related_id: requestId,
    });
  }

  revalidateClient(requestId);
}

/**
 * Client supplements idea text without overwriting original body.
 * Stored as CLIENT comment + CLIENT event in existing tables.
 */
export async function appendIdeaSupplementAction(
  formData: FormData,
): Promise<void> {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const requestId = String(formData.get("requestId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!requestId || body.length < 5) {
    throw new Error("Добавьте текст дополнения.");
  }
  if (!(await assertOwnsRequest(requestId, current.user.id))) {
    throw new Error("Нет доступа к обращению.");
  }

  const text = `Дополнение к идее:\n${body}`;
  const supabase = createClient();
  const { error } = await supabase.from("ckr_request_comments").insert({
    request_id: requestId,
    author_id: current.user.id,
    body: text,
    visibility: "CLIENT",
  });
  if (error) throw new Error(error.message);

  await supabase.from("ckr_request_events").insert({
    request_id: requestId,
    event_type: "CLIENT_MESSAGE",
    title: "Вы дополнили идею",
    detail: body.slice(0, 200),
    visibility: "CLIENT",
    actor_user_id: current.user.id,
    meta: { kind: "idea_supplement" },
  });

  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(20);
  for (const admin of admins || []) {
    await supabase.rpc("create_notification", {
      p_user_id: admin.id,
      p_type: "ckr_request",
      p_title: "Клиент дополнил идею",
      p_body: body.slice(0, 200),
      p_link: `/admin/owner/inbox/${requestId}`,
      p_related_type: "ckr_request",
      p_related_id: requestId,
    });
  }

  revalidateClient(requestId);
}
