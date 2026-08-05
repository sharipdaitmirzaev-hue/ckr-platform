"use server";

import {
  DEAL_PARTICIPANT_ROLES,
  DEAL_STATUSES,
  DEAL_TYPES,
  DEFAULT_PROJECT_MILESTONES,
  MILESTONE_STATUSES,
} from "@/config/deals";
import { createClient } from "@/lib/supabase/server";
import type {
  DealParticipantRole,
  DealStatus,
  DealType,
  MilestoneStatus,
} from "@/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type DealActionState = {
  error?: string;
  success?: string;
};

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null as null };
  return { supabase, user };
}

async function assertProjectOwner(
  supabase: ReturnType<typeof createClient>,
  projectId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("projects")
    .select("id, owner_id, title, status")
    .eq("id", projectId)
    .maybeSingle();
  if (!data) return null;
  if (data.owner_id !== userId) return null;
  return data;
}

async function logActivity(
  supabase: ReturnType<typeof createClient>,
  input: {
    projectId: string;
    actorId: string;
    activityType: string;
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

function revalidateWorkspace(projectId: string) {
  revalidatePath(`/dashboard/projects/${projectId}/workspace`);
  revalidatePath(`/dashboard/projects/${projectId}/edit`);
  revalidatePath("/dashboard/projects");
}

export async function createDealAction(
  projectId: string,
  formData: FormData,
): Promise<DealActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Войдите в аккаунт." };

  const project = await assertProjectOwner(supabase, projectId, user.id);
  if (!project) return { error: "Доступ только владельцу проекта." };

  const dealType = String(formData.get("dealType") || "other") as DealType;
  const status = String(formData.get("status") || "draft") as DealStatus;
  const description = String(formData.get("description") || "").trim();
  const currency = String(formData.get("currency") || "RUB").trim() || "RUB";
  const amountRaw = String(formData.get("amount") || "").trim();
  const partnerId = String(formData.get("partnerId") || "").trim() || null;
  const applicationId =
    String(formData.get("applicationId") || "").trim() || null;
  const amount = amountRaw ? Number(amountRaw) : null;

  if (!DEAL_TYPES.includes(dealType)) {
    return { error: "Некорректный тип сделки." };
  }
  if (!DEAL_STATUSES.includes(status)) {
    return { error: "Некорректный статус сделки." };
  }

  const { data, error } = await supabase
    .from("deals")
    .insert({
      project_id: projectId,
      initiator_id: user.id,
      partner_id: partnerId,
      application_id: applicationId,
      deal_type: dealType,
      amount: Number.isFinite(amount as number) ? amount : null,
      currency,
      status,
      description,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать сделку." };
  }

  await supabase.from("deal_participants").insert({
    deal_id: data.id,
    user_id: user.id,
    role: "owner",
  });

  if (partnerId && partnerId !== user.id) {
    await supabase.from("deal_participants").insert({
      deal_id: data.id,
      user_id: partnerId,
      role: dealType === "investment" ? "investor" : "partner",
    });
  }

  await logActivity(supabase, {
    projectId,
    actorId: user.id,
    activityType: "deal_created",
    title: "Создана сделка",
    body: description.slice(0, 200) || dealType,
    metadata: {
      dealId: data.id,
      dealType,
      status,
      applicationId,
    },
  });

  const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
  await trackAnalyticsEvent({
    eventType: "deal_created",
    userId: user.id,
    entityType: "deal",
    entityId: data.id,
    metadata: { projectId, dealType, status, applicationId },
  });

  const notifyIds = [user.id, partnerId].filter(
    (id): id is string => Boolean(id),
  );
  for (const notifyId of notifyIds) {
    await supabase.rpc("create_notification", {
      p_user_id: notifyId,
      p_type: "deal_update",
      p_title: "Создана сделка",
      p_body: `По проекту открыта сделка (${dealType}).`,
      p_link: `/dashboard/projects/${projectId}/workspace`,
      p_application_id: applicationId,
      p_related_type: "deal",
      p_related_id: data.id,
    });
  }

  if (status === "active" || status === "completed") {
    const { syncProjectLifecycleFromDeal } = await import(
      "@/features/projects/actions"
    );
    await syncProjectLifecycleFromDeal({
      projectId,
      dealStatus: status,
      actorId: user.id,
    });
  }

  revalidateWorkspace(projectId);
  revalidatePath("/dashboard/applications");
  return { success: "Сделка создана." };
}

/**
 * Полный цикл: accepted application → deal → workspace.
 */
export async function createDealFromApplicationAction(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  if (!applicationId) {
    redirect("/dashboard/applications");
  }

  const { supabase, user } = await requireUser();
  if (!user) redirect("/login?next=/dashboard/applications");

  const { data: application } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (!application || application.status !== "accepted") {
    redirect("/dashboard/applications");
  }
  if (application.target_type !== "project") {
    redirect("/dashboard/applications");
  }

  const projectId = application.target_id as string;
  const project = await assertProjectOwner(supabase, projectId, user.id);
  if (!project) {
    redirect("/dashboard/applications");
  }

  const { data: existing } = await supabase
    .from("deals")
    .select("id")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (existing) {
    redirect(`/dashboard/projects/${projectId}/workspace`);
  }

  const partnerId = application.from_user_id as string;
  const dealType =
    partnerId && application.message?.toLowerCase().includes("инвест")
      ? "investment"
      : "partnership";

  const { data, error } = await supabase
    .from("deals")
    .insert({
      project_id: projectId,
      initiator_id: user.id,
      partner_id: partnerId,
      application_id: applicationId,
      deal_type: dealType,
      status: "negotiation",
      description: `Сделка по заявке: ${(application.message as string)?.slice(0, 280) || "без описания"}`,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/dashboard/projects/${projectId}/workspace`);
  }

  await supabase.from("deal_participants").insert({
    deal_id: data.id,
    user_id: user.id,
    role: "owner",
  });

  if (partnerId !== user.id) {
    await supabase.from("deal_participants").insert({
      deal_id: data.id,
      user_id: partnerId,
      role: dealType === "investment" ? "investor" : "partner",
    });
  }

  await logActivity(supabase, {
    projectId,
    actorId: user.id,
    activityType: "deal_created",
    title: "Сделка создана из заявки",
    body: application.message?.slice(0, 200) || dealType,
    metadata: { dealId: data.id, applicationId, dealType },
  });

  const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
  await trackAnalyticsEvent({
    eventType: "deal_created",
    userId: user.id,
    entityType: "deal",
    entityId: data.id,
    metadata: { projectId, applicationId, from: "application" },
  });

  await supabase.rpc("create_notification", {
    p_user_id: partnerId,
    p_type: "deal_update",
    p_title: "Открыта сделка по вашей заявке",
    p_body: `Проект «${project.title}»: перейдите в кабинет сделки.`,
    p_link: `/dashboard/projects/${projectId}/workspace`,
    p_application_id: applicationId,
    p_related_type: "deal",
    p_related_id: data.id,
  });

  revalidateWorkspace(projectId);
  revalidatePath("/dashboard/applications");
  redirect(`/dashboard/projects/${projectId}/workspace`);
}

export async function updateDealStatusAction(
  dealId: string,
  projectId: string,
  status: DealStatus,
): Promise<DealActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Войдите в аккаунт." };
  if (!DEAL_STATUSES.includes(status)) {
    return { error: "Некорректный статус." };
  }

  const { error } = await supabase
    .from("deals")
    .update({ status })
    .eq("id", dealId);

  if (error) return { error: error.message };

  await logActivity(supabase, {
    projectId,
    actorId: user.id,
    activityType: "deal_updated",
    title: "Обновлён статус сделки",
    body: status,
    metadata: { dealId, status },
  });

  if (status === "active" || status === "completed") {
    const { syncProjectLifecycleFromDeal } = await import(
      "@/features/projects/actions"
    );
    await syncProjectLifecycleFromDeal({
      projectId,
      dealStatus: status,
      actorId: user.id,
    });
  }

  if (status === "completed") {
    const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
    await trackAnalyticsEvent({
      eventType: "deal_completed",
      userId: user.id,
      entityType: "deal",
      entityId: dealId,
      metadata: { projectId, status },
    });

    const { data: deal } = await supabase
      .from("deals")
      .select("id, initiator_id, partner_id, deal_type")
      .eq("id", dealId)
      .maybeSingle();

    if (deal) {
      const {
        ensureReputationProfile,
        recordEntityHistory,
      } = await import("@/lib/reputation/ensure-profile");
      const title = `Завершена сделка (${deal.deal_type ?? "deal"})`;
      const participants = [deal.initiator_id, deal.partner_id].filter(
        (id): id is string => Boolean(id),
      );
      for (const participantId of participants) {
        await recordEntityHistory({
          entityType: "user",
          entityId: participantId,
          kind: "deal",
          title,
          relatedType: "deal",
          relatedId: dealId,
          meta: { projectId, status },
        });
        await ensureReputationProfile("user", participantId);
        await supabase.rpc("create_notification", {
          p_user_id: participantId,
          p_type: "deal_update",
          p_title: "Сделка завершена",
          p_body: title,
          p_link: `/dashboard/projects/${projectId}/workspace`,
          p_application_id: null,
          p_related_type: "deal",
          p_related_id: dealId,
        });
      }
    }
  }

  revalidateWorkspace(projectId);
  return { success: "Статус сделки обновлён." };
}

export async function addDealParticipantAction(
  dealId: string,
  projectId: string,
  formData: FormData,
): Promise<DealActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Войдите в аккаунт." };

  const project = await assertProjectOwner(supabase, projectId, user.id);
  if (!project) return { error: "Доступ только владельцу проекта." };

  const userId = String(formData.get("userId") || "").trim();
  const role = String(formData.get("role") || "partner") as DealParticipantRole;

  if (!userId) return { error: "Укажите ID пользователя." };
  if (!DEAL_PARTICIPANT_ROLES.includes(role)) {
    return { error: "Некорректная роль." };
  }

  const { error } = await supabase.from("deal_participants").insert({
    deal_id: dealId,
    user_id: userId,
    role,
  });

  if (error) {
    return { error: error.message };
  }

  await logActivity(supabase, {
    projectId,
    actorId: user.id,
    activityType: "participant_added",
    title: "Добавлен участник сделки",
    body: role,
    metadata: { dealId, userId, role },
  });

  revalidateWorkspace(projectId);
  return { success: "Участник добавлен." };
}

export async function createMilestoneAction(
  projectId: string,
  formData: FormData,
): Promise<DealActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Войдите в аккаунт." };

  const project = await assertProjectOwner(supabase, projectId, user.id);
  if (!project) return { error: "Доступ только владельцу проекта." };

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const deadline = String(formData.get("deadline") || "").trim() || null;

  if (title.length < 2) return { error: "Укажите название этапа." };

  const { data: existing } = await supabase
    .from("project_milestones")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const sortOrder =
    existing && existing[0] ? Number(existing[0].sort_order) + 1 : 0;

  const { error } = await supabase.from("project_milestones").insert({
    project_id: projectId,
    title,
    description,
    deadline,
    status: "planned",
    sort_order: sortOrder,
  });

  if (error) return { error: error.message };

  await logActivity(supabase, {
    projectId,
    actorId: user.id,
    activityType: "milestone_created",
    title: "Добавлен этап",
    body: title,
  });

  revalidateWorkspace(projectId);
  return { success: "Этап добавлен." };
}

export async function seedDefaultMilestonesAction(
  projectId: string,
): Promise<DealActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Войдите в аккаунт." };

  const project = await assertProjectOwner(supabase, projectId, user.id);
  if (!project) return { error: "Доступ только владельцу проекта." };

  const { data: existing } = await supabase
    .from("project_milestones")
    .select("id")
    .eq("project_id", projectId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: "Этапы уже созданы." };
  }

  const rows = DEFAULT_PROJECT_MILESTONES.map((item, index) => ({
    project_id: projectId,
    title: item.title,
    description: item.description,
    status: "planned" as const,
    sort_order: index,
  }));

  const { error } = await supabase.from("project_milestones").insert(rows);
  if (error) return { error: error.message };

  await logActivity(supabase, {
    projectId,
    actorId: user.id,
    activityType: "milestone_created",
    title: "Созданы типовые этапы реализации",
    body: `${rows.length} этапов`,
  });

  revalidateWorkspace(projectId);
  return { success: "Типовые этапы добавлены." };
}

export async function updateMilestoneStatusAction(
  milestoneId: string,
  projectId: string,
  status: MilestoneStatus,
): Promise<DealActionState> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Войдите в аккаунт." };
  if (!MILESTONE_STATUSES.includes(status)) {
    return { error: "Некорректный статус этапа." };
  }

  const project = await assertProjectOwner(supabase, projectId, user.id);
  if (!project) return { error: "Доступ только владельцу проекта." };

  const { data: milestone, error } = await supabase
    .from("project_milestones")
    .update({ status })
    .eq("id", milestoneId)
    .eq("project_id", projectId)
    .select("title")
    .single();

  if (error) return { error: error.message };

  await logActivity(supabase, {
    projectId,
    actorId: user.id,
    activityType:
      status === "completed" ? "milestone_completed" : "milestone_updated",
    title:
      status === "completed" ? "Этап завершён" : "Обновлён статус этапа",
    body: milestone?.title || status,
    metadata: { milestoneId, status },
  });

  if (status === "completed") {
    const { recordEntityHistory } = await import(
      "@/lib/reputation/ensure-profile"
    );
    await recordEntityHistory({
      entityType: "user",
      entityId: user.id,
      kind: "task",
      title: milestone?.title
        ? `Завершён этап: ${milestone.title}`
        : "Завершён этап проекта",
      relatedType: "milestone",
      relatedId: milestoneId,
      meta: { projectId, status },
    });

    const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
    await trackAnalyticsEvent({
      eventType: "milestone_completed",
      userId: user.id,
      entityType: "project",
      entityId: projectId,
      metadata: { milestoneId, title: milestone?.title },
    });
  }

  revalidateWorkspace(projectId);
  return { success: "Статус этапа обновлён." };
}
