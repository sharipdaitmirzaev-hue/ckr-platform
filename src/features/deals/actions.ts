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
    metadata: { dealId: data.id, dealType, status },
  });

  revalidateWorkspace(projectId);
  return { success: "Сделка создана." };
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

  revalidateWorkspace(projectId);
  return { success: "Статус этапа обновлён." };
}
