"use server";

import { expertProfileFormSchema } from "@/lib/experts/validations";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ExpertActionState = {
  error?: string;
  success?: string;
};

function parseExpertForm(formData: FormData) {
  return expertProfileFormSchema.safeParse({
    specialization: formData.get("specialization"),
    headline: formData.get("headline"),
    description: formData.get("description"),
    experienceYears: formData.get("experienceYears"),
    services: formData.get("services"),
    region: formData.get("region"),
    status: formData.get("status"),
  });
}

export async function createExpertProfileAction(
  _prev: ExpertActionState,
  formData: FormData,
): Promise<ExpertActionState> {
  const parsed = parseExpertForm(formData);
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

  const { data: existing } = await supabase
    .from("expert_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return { error: "Профиль эксперта уже создан. Откройте редактирование." };
  }

  // Добавляем роль expert, если ещё нет
  await supabase.from("user_roles").upsert(
    { user_id: user.id, role: "expert" },
    { onConflict: "user_id,role", ignoreDuplicates: true },
  );

  const { error } = await supabase.from("expert_profiles").insert({
    user_id: user.id,
    specialization: parsed.data.specialization,
    headline: parsed.data.headline,
    description: parsed.data.description,
    experience_years: parsed.data.experienceYears,
    services: parsed.data.services,
    region: parsed.data.region,
    status: parsed.data.status,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/experts");
  revalidatePath("/dashboard/expert");
  redirect("/dashboard/expert");
}

export async function updateExpertProfileAction(
  _prev: ExpertActionState,
  formData: FormData,
): Promise<ExpertActionState> {
  const parsed = parseExpertForm(formData);
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

  const { error } = await supabase
    .from("expert_profiles")
    .update({
      specialization: parsed.data.specialization,
      headline: parsed.data.headline,
      description: parsed.data.description,
      experience_years: parsed.data.experienceYears,
      services: parsed.data.services,
      region: parsed.data.region,
      status: parsed.data.status,
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/experts");
  revalidatePath("/dashboard/expert");
  return { success: "Профиль эксперта сохранён." };
}

