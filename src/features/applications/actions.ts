"use server";

import { ownerActionStatuses } from "@/config/applications";
import { createApplicationSchema } from "@/lib/applications/validations";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus, ApplicationTargetType } from "@/types";
import { revalidatePath } from "next/cache";

export type ApplicationActionState = {
  error?: string;
  success?: string;
};

async function getTargetOwnerId(
  supabase: ReturnType<typeof createClient>,
  targetType: ApplicationTargetType,
  targetId: string,
) {
  if (targetType === "project") {
    const { data } = await supabase
      .from("projects")
      .select("owner_id, status, title")
      .eq("id", targetId)
      .maybeSingle();
    return data;
  }

  if (targetType === "opportunity") {
    const { data } = await supabase
      .from("opportunities")
      .select("owner_id, status, title")
      .eq("id", targetId)
      .maybeSingle();
    return data;
  }

  if (targetType === "investment") {
    const { data } = await supabase
      .from("investment_offers")
      .select("owner_id, status, title")
      .eq("id", targetId)
      .maybeSingle();
    return data;
  }

  if (targetType === "expert") {
    const { data } = await supabase
      .from("expert_profiles")
      .select("user_id, status, headline")
      .eq("id", targetId)
      .maybeSingle();
    if (!data) return null;
    return {
      owner_id: data.user_id,
      status: data.status,
      title: data.headline,
    };
  }

  return null;
}

export async function createApplicationAction(
  _prev: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const parsed = createApplicationSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Войдите в аккаунт, чтобы отправить заявку." };
  }

  const target = await getTargetOwnerId(
    supabase,
    parsed.data.targetType,
    parsed.data.targetId,
  );

  if (!target) {
    return { error: "Объект заявки не найден." };
  }

  if (target.owner_id === user.id) {
    return { error: "Нельзя отправить заявку на собственный объект." };
  }

  if (target.status !== "published") {
    return { error: "Заявку можно отправить только на опубликованный объект." };
  }

  const { error } = await supabase.from("applications").insert({
    from_user_id: user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    message: parsed.data.message,
    status: "new",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/applications");
  revalidatePath(`/project/${parsed.data.targetId}`);
  revalidatePath(`/opportunity/${parsed.data.targetId}`);
  revalidatePath(`/investment/${parsed.data.targetId}`);
  revalidatePath(`/expert/${parsed.data.targetId}`);

  return { success: "Заявка отправлена. Владелец получит уведомление." };
}

export async function updateApplicationStatusAction(
  formData: FormData,
): Promise<void> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const status = String(formData.get("status") ?? "") as ApplicationStatus;

  if (!applicationId || !ownerActionStatuses.includes(status as typeof ownerActionStatuses[number])) {
    return;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application) return;

  const target = await getTargetOwnerId(
    supabase,
    application.target_type as ApplicationTargetType,
    application.target_id,
  );

  if (!target || target.owner_id !== user.id) {
    return;
  }

  await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);

  await supabase.rpc("create_notification", {
    p_user_id: application.from_user_id,
    p_type: "application_status",
    p_title: "Статус заявки обновлён",
    p_body: `Заявка по «${target.title}» теперь: ${status}.`,
    p_link: "/dashboard/applications",
    p_application_id: applicationId,
  });

  revalidatePath("/dashboard/applications");
}

export async function markNotificationsReadAction() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/dashboard/applications");
}
