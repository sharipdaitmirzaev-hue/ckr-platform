"use server";

import { projectFormSchema } from "@/lib/projects/validations";
import { slugifyTitle, withSlugSuffix } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ProjectActionState = {
  error?: string;
  success?: string;
};

function parseProjectForm(formData: FormData) {
  return projectFormSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    category: formData.get("category"),
    region: formData.get("region"),
    investmentRequired: formData.get("investmentRequired"),
    currency: formData.get("currency"),
    stage: formData.get("stage"),
    status: formData.get("status"),
  });
}

async function ensureUniqueSlug(
  supabase: ReturnType<typeof createClient>,
  title: string,
  excludeId?: string,
) {
  const base = slugifyTitle(title);
  let candidate = base;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    let query = supabase.from("projects").select("id").eq("slug", candidate);
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = withSlugSuffix(base, Math.random().toString(36).slice(2, 8));
  }

  return withSlugSuffix(base, Date.now().toString(36));
}

export async function createProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = parseProjectForm(formData);
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

  const slug = await ensureUniqueSlug(supabase, parsed.data.title);

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      title: parsed.data.title,
      slug,
      summary: parsed.data.summary,
      description: parsed.data.description,
      category: parsed.data.category,
      region: parsed.data.region,
      investment_required: parsed.data.investmentRequired,
      currency: parsed.data.currency,
      stage: parsed.data.stage,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать проект." };
  }

  const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
  await trackAnalyticsEvent({
    eventType: "project_created",
    userId: user.id,
    entityType: "project",
    entityId: data.id,
    metadata: {
      category: parsed.data.category,
      region: parsed.data.region,
      status: parsed.data.status,
    },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/project/${data.id}`);
  redirect("/dashboard/projects");
}

export async function updateProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) {
    return { error: "Не указан проект." };
  }

  const parsed = parseProjectForm(formData);
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
    .from("projects")
    .select("id, owner_id, title, slug")
    .eq("id", projectId)
    .maybeSingle();

  if (existingError || !existing) {
    return { error: "Проект не найден." };
  }

  if (existing.owner_id !== user.id) {
    return { error: "Можно редактировать только свои проекты." };
  }

  const slug =
    existing.title === parsed.data.title
      ? existing.slug
      : await ensureUniqueSlug(supabase, parsed.data.title, projectId);

  const { error } = await supabase
    .from("projects")
    .update({
      title: parsed.data.title,
      slug,
      summary: parsed.data.summary,
      description: parsed.data.description,
      category: parsed.data.category,
      region: parsed.data.region,
      investment_required: parsed.data.investmentRequired,
      currency: parsed.data.currency,
      stage: parsed.data.stage,
      status: parsed.data.status,
    })
    .eq("id", projectId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/project/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/edit`);

  return { success: "Проект сохранён." };
}

export async function archiveProjectAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  if (!projectId) {
    redirect("/dashboard/projects");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("projects")
    .update({ status: "archived" })
    .eq("id", projectId)
    .eq("owner_id", user.id);

  revalidatePath("/projects");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/project/${projectId}`);
  redirect("/dashboard/projects");
}
