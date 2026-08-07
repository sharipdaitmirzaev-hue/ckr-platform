"use server";

import { revalidatePath } from "next/cache";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { DbRoadmapItemStatus, DbRoadmapStatus } from "@/types/database";

export type ExecutionActionState = {
  error?: string;
  success?: string;
};

async function requireOwner(projectId: string) {
  if (!hasSupabaseEnv()) return { error: "Supabase не настроен." } as const;
  const current = await getCurrentUser();
  if (!current) return { error: "Войдите в аккаунт." } as const;

  const supabase = createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, owner_id, title")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return { error: "Проект не найден." } as const;
  if (
    project.owner_id !== current.user.id &&
    !current.roles.includes("admin")
  ) {
    return { error: "Доступ только владельцу проекта." } as const;
  }

  return { supabase, user: current.user, project } as const;
}

async function logProjectActivity(
  supabase: ReturnType<typeof createClient>,
  input: {
    projectId: string;
    actorId: string;
    activityType:
      | "roadmap_created"
      | "roadmap_item_completed"
      | "metric_updated"
      | "project_progress_checked"
      | "note";
    title: string;
    body?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from("project_activity").insert({
    project_id: input.projectId,
    actor_id: input.actorId,
    activity_type: input.activityType,
    title: input.title,
    body: input.body ?? "",
    metadata: input.metadata ?? {},
  });
}

function revalidateExecution(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}/workspace`);
  revalidatePath(`/project/${projectId}`);
  revalidatePath("/lia");
}

export async function createRoadmapAction(
  projectId: string,
  formData: FormData,
): Promise<ExecutionActionState> {
  const auth = await requireOwner(projectId);
  if ("error" in auth) return { error: auth.error };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (title.length < 2) return { error: "Укажите название roadmap." };

  const { data, error } = await auth.supabase
    .from("project_roadmaps")
    .insert({
      project_id: projectId,
      title,
      description,
      status: "active" as DbRoadmapStatus,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Не удалось создать." };

  await logProjectActivity(auth.supabase, {
    projectId,
    actorId: auth.user.id,
    activityType: "roadmap_created",
    title: "Создана дорожная карта",
    body: title,
    metadata: { roadmapId: data.id },
  });

  await trackAnalyticsEvent({
    eventType: "roadmap_created",
    userId: auth.user.id,
    entityType: "project_roadmap",
    entityId: data.id,
    metadata: { projectId },
  });

  await auth.supabase.rpc("create_notification", {
    p_user_id: auth.user.id,
    p_type: "roadmap_created",
    p_title: "Дорожная карта создана",
    p_body: title,
    p_link: `/dashboard/projects/${projectId}/workspace`,
    p_application_id: null,
    p_related_type: "project",
    p_related_id: projectId,
  });

  revalidateExecution(projectId);
  return { success: "Дорожная карта создана." };
}

export async function createRoadmapItemAction(
  projectId: string,
  roadmapId: string,
  formData: FormData,
): Promise<ExecutionActionState> {
  const auth = await requireOwner(projectId);
  if ("error" in auth) return { error: auth.error };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const deadline = String(formData.get("deadline") || "").trim() || null;
  const milestoneId =
    String(formData.get("milestoneId") || "").trim() || null;

  if (title.length < 2) return { error: "Укажите название этапа." };

  const { data: existing } = await auth.supabase
    .from("roadmap_items")
    .select("order_number")
    .eq("roadmap_id", roadmapId)
    .order("order_number", { ascending: false })
    .limit(1);

  const orderNumber =
    existing && existing[0] ? Number(existing[0].order_number) + 1 : 1;

  const { error } = await auth.supabase.from("roadmap_items").insert({
    roadmap_id: roadmapId,
    title,
    description,
    order_number: orderNumber,
    responsible_user_id: auth.user.id,
    deadline,
    status: "planned",
    milestone_id: milestoneId,
  });

  if (error) return { error: error.message };

  revalidateExecution(projectId);
  return { success: "Этап добавлен." };
}

export async function updateRoadmapItemStatusAction(
  projectId: string,
  itemId: string,
  status: DbRoadmapItemStatus,
): Promise<ExecutionActionState> {
  const auth = await requireOwner(projectId);
  if ("error" in auth) return { error: auth.error };

  const { data: item, error: loadError } = await auth.supabase
    .from("roadmap_items")
    .select("id, title, status, milestone_id")
    .eq("id", itemId)
    .maybeSingle();

  if (loadError || !item) return { error: "Этап не найден." };

  const { error } = await auth.supabase
    .from("roadmap_items")
    .update({ status })
    .eq("id", itemId);

  if (error) return { error: error.message };

  if (status === "completed") {
    await logProjectActivity(auth.supabase, {
      projectId,
      actorId: auth.user.id,
      activityType: "roadmap_item_completed",
      title: "Этап roadmap завершён",
      body: item.title,
      metadata: { itemId },
    });

    await trackAnalyticsEvent({
      eventType: "roadmap_item_completed",
      userId: auth.user.id,
      entityType: "roadmap_item",
      entityId: itemId,
      metadata: { projectId },
    });

    if (item.milestone_id) {
      await auth.supabase
        .from("project_milestones")
        .update({ status: "completed" })
        .eq("id", item.milestone_id);
    }

    await auth.supabase.rpc("create_notification", {
      p_user_id: auth.user.id,
      p_type: "roadmap_item_completed",
      p_title: "Этап roadmap завершён",
      p_body: item.title,
      p_link: `/dashboard/projects/${projectId}/workspace`,
      p_application_id: null,
      p_related_type: "project",
      p_related_id: projectId,
    });
  }

  revalidateExecution(projectId);
  return { success: "Статус этапа обновлён." };
}

export async function createRoadmapTaskAction(
  projectId: string,
  itemId: string,
  formData: FormData,
): Promise<ExecutionActionState> {
  const auth = await requireOwner(projectId);
  if ("error" in auth) return { error: auth.error };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const deadline = String(formData.get("deadline") || "").trim() || null;

  if (title.length < 2) return { error: "Укажите название задачи." };

  const { error } = await auth.supabase.from("tasks").insert({
    title,
    description,
    assigned_to: auth.user.id,
    related_type: "roadmap_item",
    related_id: itemId,
    roadmap_item_id: itemId,
    priority: "medium",
    status: "new",
    deadline,
    created_by: auth.user.id,
  });

  if (error) return { error: error.message };

  revalidateExecution(projectId);
  return { success: "Задача добавлена." };
}

export async function updateRoadmapTaskStatusAction(
  projectId: string,
  taskId: string,
  status: string,
): Promise<ExecutionActionState> {
  const auth = await requireOwner(projectId);
  if ("error" in auth) return { error: auth.error };

  const { error } = await auth.supabase
    .from("tasks")
    .update({ status: status as "new" | "in_progress" | "completed" | "cancelled" | "waiting" })
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidateExecution(projectId);
  return { success: "Статус задачи обновлён." };
}

export async function createProjectMetricAction(
  projectId: string,
  formData: FormData,
): Promise<ExecutionActionState> {
  const auth = await requireOwner(projectId);
  if ("error" in auth) return { error: auth.error };

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const period = String(formData.get("period") || "quarter").trim();
  const targetValue = Number(formData.get("targetValue") || 0);
  const currentValue = Number(formData.get("currentValue") || 0);

  if (name.length < 2) return { error: "Укажите название KPI." };

  const { error } = await auth.supabase.from("project_metrics").insert({
    project_id: projectId,
    name,
    description,
    unit,
    period,
    target_value: Number.isFinite(targetValue) ? targetValue : 0,
    current_value: Number.isFinite(currentValue) ? currentValue : 0,
  });

  if (error) return { error: error.message };

  revalidateExecution(projectId);
  return { success: "KPI добавлен." };
}

export async function updateProjectMetricAction(
  projectId: string,
  metricId: string,
  formData: FormData,
): Promise<ExecutionActionState> {
  const auth = await requireOwner(projectId);
  if ("error" in auth) return { error: auth.error };

  const currentValue = Number(formData.get("currentValue") || 0);
  if (!Number.isFinite(currentValue)) {
    return { error: "Некорректное значение." };
  }

  const { data: metric, error: loadError } = await auth.supabase
    .from("project_metrics")
    .select("id, name")
    .eq("id", metricId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (loadError || !metric) return { error: "KPI не найден." };

  const { error } = await auth.supabase
    .from("project_metrics")
    .update({ current_value: currentValue })
    .eq("id", metricId);

  if (error) return { error: error.message };

  await logProjectActivity(auth.supabase, {
    projectId,
    actorId: auth.user.id,
    activityType: "metric_updated",
    title: "Обновлён KPI",
    body: `${metric.name}: ${currentValue}`,
    metadata: { metricId, currentValue },
  });

  await trackAnalyticsEvent({
    eventType: "metric_updated",
    userId: auth.user.id,
    entityType: "project_metric",
    entityId: metricId,
    metadata: { projectId, currentValue },
  });

  revalidateExecution(projectId);
  return { success: "KPI обновлён." };
}

export async function markProgressCheckedAction(
  projectId: string,
): Promise<ExecutionActionState> {
  const auth = await requireOwner(projectId);
  if ("error" in auth) return { error: auth.error };

  await logProjectActivity(auth.supabase, {
    projectId,
    actorId: auth.user.id,
    activityType: "project_progress_checked",
    title: "Проверка прогресса проекта",
    body: "Зафиксирована ручная проверка прогресса в workspace.",
  });

  await trackAnalyticsEvent({
    eventType: "project_progress_checked",
    userId: auth.user.id,
    entityType: "project",
    entityId: projectId,
  });

  revalidateExecution(projectId);
  return { success: "Проверка прогресса зафиксирована." };
}
