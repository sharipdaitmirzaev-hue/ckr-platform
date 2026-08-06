"use server";

import { revalidatePath } from "next/cache";
import { trackAnalyticsEvent } from "@/lib/analytics/track";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  DbFinancialMetricType,
  DbProjectResultType,
} from "@/types/database";

export type OutcomeActionState = {
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

function revalidateOutcomes(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}/workspace`);
  revalidatePath("/admin/results");
  revalidatePath("/lia");
}

export async function createProjectResultAction(
  projectId: string,
  formData: FormData,
): Promise<OutcomeActionState> {
  const auth = await requireOwner(projectId);
  if ("error" in auth) return { error: auth.error };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const resultType = String(formData.get("resultType") || "other").trim();
  const unit = String(formData.get("unit") || "").trim();
  const metricId = String(formData.get("metricId") || "").trim() || null;
  const valueRaw = String(formData.get("value") || "").trim();
  const value = valueRaw === "" ? null : Number(valueRaw);
  const achievedAt =
    String(formData.get("achievedAt") || "").trim() ||
    new Date().toISOString();

  if (title.length < 2) return { error: "Укажите название результата." };
  if (value !== null && !Number.isFinite(value)) {
    return { error: "Некорректное значение." };
  }

  const { data, error } = await auth.supabase
    .from("project_results")
    .insert({
      project_id: projectId,
      result_type: resultType as DbProjectResultType,
      title,
      description,
      value,
      unit,
      achieved_at: achievedAt,
      metric_id: metricId,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message || "Ошибка создания." };

  await auth.supabase.from("project_activity").insert({
    project_id: projectId,
    actor_id: auth.user.id,
    activity_type: "result_created",
    title: "Зафиксирован результат проекта",
    body: title,
    metadata: { resultId: data.id, resultType },
  });

  await trackAnalyticsEvent({
    eventType: "result_created",
    userId: auth.user.id,
    entityType: "project_result",
    entityId: data.id,
    metadata: { projectId, resultType },
  });

  await auth.supabase.rpc("create_notification", {
    p_user_id: auth.user.id,
    p_type: "result_created",
    p_title: "Результат проекта зафиксирован",
    p_body: title,
    p_link: `/dashboard/projects/${projectId}/workspace`,
    p_application_id: null,
    p_related_type: "project",
    p_related_id: projectId,
  });

  revalidateOutcomes(projectId);
  return { success: "Результат добавлен." };
}

export async function upsertFinancialMetricAction(
  projectId: string,
  formData: FormData,
): Promise<OutcomeActionState> {
  const auth = await requireOwner(projectId);
  if ("error" in auth) return { error: auth.error };

  const metricType = String(formData.get("metricType") || "").trim();
  const currency = String(formData.get("currency") || "RUB").trim() || "RUB";
  const period = String(formData.get("period") || "year").trim() || "year";
  const value = Number(formData.get("value") || 0);
  const existingId = String(formData.get("id") || "").trim() || null;

  if (!metricType) return { error: "Укажите тип показателя." };
  if (!Number.isFinite(value)) return { error: "Некорректное значение." };

  if (existingId) {
    const { error } = await auth.supabase
      .from("project_financial_metrics")
      .update({
        value,
        currency,
        period,
        metric_type: metricType as DbFinancialMetricType,
      })
      .eq("id", existingId)
      .eq("project_id", projectId);
    if (error) return { error: error.message };
  } else {
    const { error } = await auth.supabase
      .from("project_financial_metrics")
      .insert({
        project_id: projectId,
        metric_type: metricType as DbFinancialMetricType,
        value,
        currency,
        period,
      });
    if (error) return { error: error.message };
  }

  await auth.supabase.from("project_activity").insert({
    project_id: projectId,
    actor_id: auth.user.id,
    activity_type: "financial_metric_updated",
    title: "Обновлён финансовый показатель",
    body: `${metricType}: ${value} ${currency}`,
    metadata: { metricType, value },
  });

  await trackAnalyticsEvent({
    eventType: "financial_metric_updated",
    userId: auth.user.id,
    entityType: "project",
    entityId: projectId,
    metadata: { metricType, value, currency },
  });

  revalidateOutcomes(projectId);
  return { success: "Финансовый показатель сохранён." };
}
