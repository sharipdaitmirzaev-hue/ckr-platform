"use server";

import { PROJECT_STAGES } from "@/config/projects";
import { normalizeProjectDraft } from "@/lib/lia/project-draft";
import { slugifyTitle, withSlugSuffix } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";
import type { ProjectDraft } from "@/types/lia";
import type { ProjectStage } from "@/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type LiaProjectActionState = {
  error?: string;
};

async function ensureUniqueSlug(
  supabase: ReturnType<typeof createClient>,
  title: string,
) {
  const base = slugifyTitle(title);
  let candidate = base;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = withSlugSuffix(base, Math.random().toString(36).slice(2, 8));
  }

  return withSlugSuffix(base, Date.now().toString(36));
}

/**
 * Создание проекта из черновика Лии — только после явного подтверждения пользователя.
 * Статус всегда draft. Редирект на страницу редактирования.
 */
export async function createProjectFromLiaDraftAction(
  draftInput: ProjectDraft,
): Promise<LiaProjectActionState> {
  const draft = normalizeProjectDraft(draftInput);

  if (draft.title.trim().length < 3) {
    return { error: "Укажите название проекта (не короче 3 символов)." };
  }
  if (draft.summary.trim().length < 20) {
    return { error: "Краткое описание слишком короткое." };
  }
  if (draft.description.trim().length < 40) {
    return { error: "Описание слишком короткое." };
  }
  if (!draft.category.trim() || !draft.region.trim()) {
    return { error: "Укажите отрасль и регион." };
  }

  const stage = PROJECT_STAGES.includes(draft.stage as ProjectStage)
    ? (draft.stage as ProjectStage)
    : "idea";

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Войдите в аккаунт, чтобы создать проект." };
  }

  const slug = await ensureUniqueSlug(supabase, draft.title);

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      title: draft.title,
      slug,
      summary: draft.summary,
      description: draft.description,
      category: draft.category,
      region: draft.region,
      investment_required: draft.investment_required,
      currency: draft.currency || "RUB",
      stage,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать проект." };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${data.id}/edit`);
  revalidatePath(`/project/${data.id}`);
  redirect(`/dashboard/projects/${data.id}/edit`);
}
