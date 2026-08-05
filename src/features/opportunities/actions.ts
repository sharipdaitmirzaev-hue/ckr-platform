"use server";

import { opportunityFormSchema } from "@/lib/opportunities/validations";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type OpportunityActionState = {
  error?: string;
  success?: string;
};

function parseOpportunityForm(formData: FormData) {
  return opportunityFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    region: formData.get("region"),
    city: formData.get("city"),
    price: formData.get("price"),
    currency: formData.get("currency"),
    status: formData.get("status"),
  });
}

export async function createOpportunityAction(
  _prev: OpportunityActionState,
  formData: FormData,
): Promise<OpportunityActionState> {
  const parsed = parseOpportunityForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Необходимо войти в аккаунт." };
  }

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      region: parsed.data.region,
      city: parsed.data.city,
      price: parsed.data.price,
      currency: parsed.data.currency,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать возможность." };
  }

  const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
  await trackAnalyticsEvent({
    eventType: "opportunity_created",
    userId: user.id,
    entityType: "opportunity",
    entityId: data.id,
    metadata: { type: parsed.data.type, region: parsed.data.region },
  });

  const { trackUserFeedbackEvent } = await import(
    "@/lib/beta/track-feedback-event"
  );
  await trackUserFeedbackEvent({
    eventType: "opportunity_created",
    userId: user.id,
    entityType: "opportunity",
    entityId: data.id,
  });

  revalidatePath("/opportunities");
  revalidatePath("/dashboard/opportunities");
  redirect("/dashboard/opportunities?feedback=opportunity_created");
}

export async function updateOpportunityAction(
  _prev: OpportunityActionState,
  formData: FormData,
): Promise<OpportunityActionState> {
  const opportunityId = String(formData.get("opportunityId") ?? "");
  if (!opportunityId) {
    return { error: "Не указана возможность." };
  }

  const parsed = parseOpportunityForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Необходимо войти в аккаунт." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("opportunities")
    .select("id, owner_id")
    .eq("id", opportunityId)
    .maybeSingle();

  if (existingError || !existing) {
    return { error: "Возможность не найдена." };
  }

  if (existing.owner_id !== user.id) {
    return { error: "Можно редактировать только свои возможности." };
  }

  const { error } = await supabase
    .from("opportunities")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      region: parsed.data.region,
      city: parsed.data.city,
      price: parsed.data.price,
      currency: parsed.data.currency,
      status: parsed.data.status,
    })
    .eq("id", opportunityId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/opportunities");
  revalidatePath("/dashboard/opportunities");
  revalidatePath(`/opportunity/${opportunityId}`);
  revalidatePath(`/dashboard/opportunities/${opportunityId}/edit`);

  return { success: "Возможность сохранена." };
}

export async function archiveOpportunityAction(formData: FormData) {
  const opportunityId = String(formData.get("opportunityId") ?? "");
  if (!opportunityId) {
    redirect("/dashboard/opportunities");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("opportunities")
    .update({ status: "archived" })
    .eq("id", opportunityId)
    .eq("owner_id", user.id);

  revalidatePath("/opportunities");
  revalidatePath("/dashboard/opportunities");
  revalidatePath(`/opportunity/${opportunityId}`);
  redirect("/dashboard/opportunities");
}
