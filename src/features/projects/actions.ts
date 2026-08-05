"use server";

import { isProjectStatus, projectStatusLabels } from "@/config/projects";
import {
  canTransitionProjectStatus,
  ownerAllowedTransitions,
} from "@/lib/projects/lifecycle";
import { projectFormSchema } from "@/lib/projects/validations";
import { slugifyTitle, withSlugSuffix } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/types";
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

function revalidateProject(projectId: string) {
  revalidatePath("/projects");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  revalidatePath(`/project/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/edit`);
  revalidatePath(`/dashboard/projects/${projectId}/workspace`);
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

  // Жизненный цикл: новый проект всегда draft
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
      status: "draft",
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
      status: "draft",
    },
  });

  const { trackUserFeedbackEvent } = await import(
    "@/lib/beta/track-feedback-event"
  );
  await trackUserFeedbackEvent({
    eventType: "project_created",
    userId: user.id,
    entityType: "project",
    entityId: data.id,
  });

  revalidateProject(data.id);
  redirect("/dashboard/projects?feedback=project_created");
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
    .select("id, owner_id, title, slug, status")
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
    })
    .eq("id", projectId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidateProject(projectId);
  return { success: "Проект сохранён." };
}

export async function advanceProjectStatusAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const projectId = String(formData.get("projectId") ?? "");
  const nextStatus = String(formData.get("status") ?? "");

  if (!projectId) return { error: "Не указан проект." };
  if (!isProjectStatus(nextStatus)) {
    return { error: "Некорректный этап жизненного цикла." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Необходимо войти в аккаунт." };

  const { data: existing } = await supabase
    .from("projects")
    .select("id, owner_id, status, title")
    .eq("id", projectId)
    .maybeSingle();

  if (!existing) return { error: "Проект не найден." };
  if (existing.owner_id !== user.id) {
    return { error: "Менять этап может только владелец проекта." };
  }

  const current = existing.status as ProjectStatus;
  const allowed = ownerAllowedTransitions(current);
  if (!allowed.includes(nextStatus)) {
    return {
      error: `Переход «${projectStatusLabels[current]}» → «${projectStatusLabels[nextStatus]}» недоступен владельцу.`,
    };
  }
  if (!canTransitionProjectStatus(current, nextStatus)) {
    return { error: "Недопустимый переход жизненного цикла." };
  }

  const { error } = await supabase
    .from("projects")
    .update({ status: nextStatus })
    .eq("id", projectId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  await supabase.from("project_activity").insert({
    project_id: projectId,
    actor_id: user.id,
    activity_type: "status_change",
    title: "Изменён этап жизненного цикла",
    body: `${projectStatusLabels[current]} → ${projectStatusLabels[nextStatus]}`,
    metadata: { from: current, to: nextStatus },
  });

  await supabase.rpc("create_notification", {
    p_user_id: user.id,
    p_type: "project_update",
    p_title: "Этап проекта обновлён",
    p_body: `«${existing.title}»: ${projectStatusLabels[nextStatus]}`,
    p_link: `/dashboard/projects/${projectId}/workspace`,
    p_application_id: null,
    p_related_type: "project",
    p_related_id: projectId,
  });

  if (nextStatus === "published") {
    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "project_published",
      userId: user.id,
      entityType: "project",
      entityId: projectId,
      metadata: { from: current },
    });
  }

  if (nextStatus === "completed") {
    const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
    await supabase.from("project_activity").insert({
      project_id: projectId,
      actor_id: user.id,
      activity_type: "project_completed",
      title: "Проект завершён",
      body: existing.title,
      metadata: { from: current, to: nextStatus },
    });
    await trackAnalyticsEvent({
      eventType: "project_completed",
      userId: user.id,
      entityType: "project",
      entityId: projectId,
      metadata: { from: current },
    });
  }

  revalidateProject(projectId);
  return {
    success: `Этап: ${projectStatusLabels[nextStatus]}`,
  };
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

  const { data: existing } = await supabase
    .from("projects")
    .select("id, owner_id, status")
    .eq("id", projectId)
    .maybeSingle();

  if (
    existing &&
    existing.owner_id === user.id &&
    existing.status !== "archived"
  ) {
    const current = existing.status as ProjectStatus;
    if (canTransitionProjectStatus(current, "archived")) {
      await supabase
        .from("projects")
        .update({ status: "archived" })
        .eq("id", projectId)
        .eq("owner_id", user.id);
    }
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  revalidatePath(`/project/${projectId}`);
  redirect("/dashboard/projects");
}

/**
 * Синхронизация: при активной/завершённой сделке проект
 * из published переходит в active (без принудительного completed).
 */
export async function syncProjectLifecycleFromDeal(input: {
  projectId: string;
  dealStatus: string;
  actorId: string;
}): Promise<void> {
  if (input.dealStatus !== "active" && input.dealStatus !== "completed") {
    return;
  }

  try {
    const supabase = createClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id, status")
      .eq("id", input.projectId)
      .maybeSingle();

    if (!project || project.status !== "published") return;

    await supabase
      .from("projects")
      .update({ status: "active" })
      .eq("id", input.projectId);

    await supabase.from("project_activity").insert({
      project_id: input.projectId,
      actor_id: input.actorId,
      activity_type: "status_change",
      title: "Проект переведён в реализацию",
      body: "Автоматически после активной сделки",
      metadata: { from: "published", to: "active", reason: "deal" },
    });

    revalidateProject(input.projectId);
  } catch {
    // не ломаем основной сценарий сделки
  }
}
