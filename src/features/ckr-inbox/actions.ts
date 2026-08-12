"use server";

import {
  intentDraftFromRequestType,
  isCkrRequestPriority,
  isCkrRequestStatus,
  isCkrRequestType,
  partnershipTypeToCkrRequestType,
} from "@/config/ckr-inbox";
import { requireStaff } from "@/lib/auth/require-staff";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { buildLiaBriefDraft } from "@/lib/ckr-inbox/mappers";
import { createClient } from "@/lib/supabase/server";
import { fingerprintFromCreate } from "@/lib/need-profile/fingerprint";
import { needToRow } from "@/lib/need-profile/mappers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";

export type CkrInboxActionState = {
  error?: string;
  success?: string;
  requestId?: string;
};

function revalidateInbox(id?: string) {
  revalidatePath("/admin/owner");
  revalidatePath("/admin/owner/inbox");
  revalidatePath("/dashboard/ckr-requests");
  revalidatePath("/partner");
  if (id) {
    revalidatePath(`/admin/owner/inbox/${id}`);
    revalidatePath(`/dashboard/ckr-requests/${id}`);
  }
}

async function appendEvent(input: {
  requestId: string;
  eventType: string;
  title: string;
  detail?: string;
  visibility?: "INTERNAL" | "CLIENT";
  actorUserId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const supabase = createClient();
  await supabase.from("ckr_request_events").insert({
    request_id: input.requestId,
    event_type: input.eventType,
    title: input.title,
    detail: input.detail || "",
    visibility: input.visibility || "INTERNAL",
    actor_user_id: input.actorUserId ?? null,
    meta: input.meta || {},
  });
}

/** In-app only: notify admins about a new inbox item (no SMS/email). */
async function notifyStaffNewRequest(requestId: string, subject: string) {
  const supabase = createClient();
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(30);
  for (const admin of admins || []) {
    await supabase.rpc("create_notification", {
      p_user_id: admin.id,
      p_type: "ckr_request",
      p_title: "Новая заявка в ЦКР",
      p_body: subject.slice(0, 200) || "Новое обращение",
      p_link: `/admin/owner/inbox/${requestId}`,
      p_related_type: "ckr_request",
      p_related_id: requestId,
    });
  }
}

/** Client/org creates a direct CKR request. */
export async function createCkrRequestAction(
  _prev: CkrInboxActionState,
  formData: FormData,
): Promise<CkrInboxActionState> {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/dashboard/ckr-requests/new");

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const requestType = String(formData.get("requestType") ?? "GENERAL");
  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const idempotencyKey = String(formData.get("idempotencyKey") ?? "").trim();

  if (subject.length < 3) return { error: "Укажите тему обращения." };
  if (body.length < 10) return { error: "Опишите запрос подробнее." };
  if (!isCkrRequestType(requestType)) return { error: "Некорректный тип." };

  const supabase = createClient();
  if (organizationId) {
    const { data: mem } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", current.user.id)
      .maybeSingle();
    if (!mem) return { error: "Нет доступа к организации." };
  }

  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from("ckr_requests")
      .select("id")
      .eq("from_user_id", current.user.id)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing?.id) {
      revalidateInbox(existing.id);
      return {
        success: "Заявка уже отправлена.",
        requestId: existing.id,
      };
    }
  }

  const region = organizationId
    ? (
        await supabase
          .from("organizations")
          .select("region")
          .eq("id", organizationId)
          .maybeSingle()
      ).data?.region || ""
    : "";

  const { data, error } = await supabase
    .from("ckr_requests")
    .insert({
      subject,
      body,
      request_type: requestType,
      status: "NEW",
      priority: "NORMAL",
      source: "direct",
      source_table: "ckr_requests",
      organization_id: organizationId || null,
      from_user_id: current.user.id,
      region,
      idempotency_key: idempotencyKey || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message || "Не удалось отправить заявку." };
  }

  await appendEvent({
    requestId: data.id,
    eventType: "APPLICATION_CREATED",
    title: "Заявка создана",
    detail: subject,
    visibility: "CLIENT",
    actorUserId: current.user.id,
  });
  await notifyStaffNewRequest(data.id, subject);

  revalidateInbox(data.id);
  redirect(`/dashboard/ckr-requests/${data.id}`);
}

export async function importPartnershipToInboxAction(
  partnershipId: string,
): Promise<CkrInboxActionState> {
  await requireStaff();
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "ensure_ckr_request_from_partnership",
    { p_partnership_id: partnershipId },
  );
  if (error || !data) {
    return { error: error?.message || "Import failed" };
  }
  revalidateInbox(data as string);
  return { success: "Импортировано в Inbox", requestId: data as string };
}

export async function updateCkrRequestStatusAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(formData.get("requestId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !isCkrRequestStatus(status)) throw new Error("Некорректные данные");

  const supabase = createClient();
  const { data: prev } = await supabase
    .from("ckr_requests")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("ckr_requests")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await appendEvent({
    requestId: id,
    eventType:
      status === "COMPLETED"
        ? "COMPLETED"
        : status === "REJECTED"
          ? "REJECTED"
          : "STATUS_CHANGED",
    title: `Статус: ${status}`,
    detail: `${prev?.status || "?"} → ${status}`,
    visibility: "CLIENT",
    actorUserId: staff.user.id,
  });

  revalidateInbox(id);
  return;
}

export async function assignCkrRequestAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(formData.get("requestId") ?? "").trim();
  const assignedTo = String(formData.get("assignedTo") ?? "").trim();
  if (!id || !assignedTo) throw new Error("Укажите ответственного");

  const supabase = createClient();
  const { error } = await supabase
    .from("ckr_requests")
    .update({
      assigned_to: assignedTo,
      assigned_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await appendEvent({
    requestId: id,
    eventType: "ASSIGNED",
    title: "Назначен ответственный",
    detail: assignedTo,
    visibility: "INTERNAL",
    actorUserId: staff.user.id,
    meta: { assigned_to: assignedTo },
  });

  revalidateInbox(id);
  return;
}

export async function addCkrRequestCommentAction(formData: FormData): Promise<void> {
  const current = await getCurrentUser();
  if (!current) throw new Error("Требуется вход");

  const id = String(formData.get("requestId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "INTERNAL");
  if (!id || body.length < 2) throw new Error("Пустой комментарий");
  if (visibility !== "INTERNAL" && visibility !== "CLIENT") {
    throw new Error("Некорректная видимость");
  }

  // Clients may only post CLIENT messages on their own requests
  const isStaff =
    current.roles.includes("admin") ||
    (await (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("operator_roles")
        .select("id")
        .eq("user_id", current.user.id)
        .eq("active", true)
        .limit(1);
      return Boolean(data?.length);
    })());

  if (!isStaff && visibility !== "CLIENT") {
    throw new Error("Клиент может писать только ответы клиенту.");
  }

  const supabase = createClient();
  const { error } = await supabase.from("ckr_request_comments").insert({
    request_id: id,
    author_id: current.user.id,
    body,
    visibility,
  });
  if (error) throw new Error(error.message);

  await appendEvent({
    requestId: id,
    eventType: visibility === "CLIENT" ? "CLIENT_MESSAGE" : "COMMENT_ADDED",
    title: visibility === "CLIENT" ? "Ответ клиенту" : "Внутренний комментарий",
    detail: body.slice(0, 200),
    visibility,
    actorUserId: current.user.id,
  });

  if (visibility === "CLIENT" && isStaff) {
    const { data: req } = await supabase
      .from("ckr_requests")
      .select("from_user_id, subject")
      .eq("id", id)
      .maybeSingle();
    if (req?.from_user_id) {
      await supabase.rpc("create_notification", {
        p_user_id: req.from_user_id,
        p_type: "ckr_request",
        p_title: "Ответ ЦКР по заявке",
        p_body: body.slice(0, 200),
        p_link: `/dashboard/ckr-requests/${id}`,
        p_related_type: "ckr_request",
        p_related_id: id,
      });
    }
  }

  revalidateInbox(id);
  return;
}

export async function createNeedFromCkrRequestAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(formData.get("requestId") ?? "").trim();
  const confirm = formData.get("confirm") === "on";
  const linkExisting = String(formData.get("linkExistingId") ?? "").trim();
  if (!id) throw new Error("requestId required");
  if (!confirm && !linkExisting) {
    throw new Error("Подтвердите создание или укажите существующий Need.");
  }

  const supabase = createClient();
  const { data: req } = await supabase
    .from("ckr_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!req) throw new Error("Заявка не найдена");

  if (linkExisting) {
    const { error } = await supabase
      .from("ckr_requests")
      .update({ need_profile_id: linkExisting })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await appendEvent({
      requestId: id,
      eventType: "NEED_LINKED",
      title: "Need Profile связан",
      detail: linkExisting,
      visibility: "INTERNAL",
      actorUserId: staff.user.id,
    });
    revalidateInbox(id);
    return;
  }

  const draft = intentDraftFromRequestType(req.request_type);
  const ownerType = req.organization_id ? "organization" : "user";
  const ownerId = req.organization_id || req.from_user_id;
  const title =
    String(formData.get("title") ?? "").trim() ||
    req.subject ||
    draft.hint;
  const description =
    String(formData.get("description") ?? "").trim() || req.body;
  const intentType =
    String(formData.get("intentType") ?? "").trim() || draft.intentType;
  const regions = String(
    formData.get("regions") ?? req.region ?? "Дагестан",
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const input = {
    intentType: intentType as never,
    title,
    description,
    ownerType: ownerType as "organization" | "user",
    ownerId,
    budgetMax: null as number | null,
    regions,
    industries: ["food", "beverage"],
    visibility: "CKR_ONLY" as const,
    status: "ACTIVE" as const,
    source: "manual" as const,
    createdBy: staff.user.id,
  };
  const fingerprint = fingerprintFromCreate(input);

  const { data: existing } = await supabase
    .from("need_profiles")
    .select("id")
    .eq("fingerprint", fingerprint)
    .in("status", ["DRAFT", "ACTIVE", "PAUSED"])
    .maybeSingle();
  if (existing?.id) {
    await supabase
      .from("ckr_requests")
      .update({ need_profile_id: existing.id })
      .eq("id", id);
    await appendEvent({
      requestId: id,
      eventType: "NEED_LINKED",
      title: "Связан существующий Need (fingerprint)",
      detail: existing.id,
      visibility: "INTERNAL",
      actorUserId: staff.user.id,
    });
    revalidateInbox(id);
    return;
  }

  const row = needToRow({
    id: randomUUID(),
    intentType: intentType as never,
    title,
    description,
    ownerType: ownerType as never,
    ownerId,
    status: "ACTIVE",
    budgetMin: null,
    budgetMax: null,
    currency: "RUB",
    regions,
    industries: ["food", "beverage"],
    keywords: [],
    criteria: {},
    visibility: "CKR_ONLY",
    priority: "NORMAL",
    timeHorizon: null,
    riskPreference: null,
    matchingEnabled: true,
    lastMatchedAt: null,
    contextGroupId: null,
    fingerprint,
    source: "manual",
    createdBy: staff.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const { data: need, error } = await supabase
    .from("need_profiles")
    .insert(row)
    .select("id")
    .single();
  if (error || !need) throw new Error(error?.message || "Need create failed");

  await supabase
    .from("ckr_requests")
    .update({ need_profile_id: need.id })
    .eq("id", id);

  await appendEvent({
    requestId: id,
    eventType: "NEED_CREATED",
    title: `Need Profile · ${intentType}`,
    detail: title,
    visibility: "INTERNAL",
    actorUserId: staff.user.id,
    meta: { need_profile_id: need.id },
  });

  revalidateInbox(id);
  return;
}

export async function createTaskFromCkrRequestAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(formData.get("requestId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!id || title.length < 3) throw new Error("Укажите название задачи");

  const supabase = createClient();
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description,
      assigned_to: staff.user.id,
      related_type: "ckr_request",
      related_id: id,
      priority: "medium",
      status: "new",
      created_by: staff.user.id,
    })
    .select("id")
    .single();
  if (error || !task) {
    // Fallback if enum value not yet applied
    const retry = await supabase
      .from("tasks")
      .insert({
        title,
        description,
        assigned_to: staff.user.id,
        related_type: "lead",
        related_id: id,
        priority: "medium",
        status: "new",
        created_by: staff.user.id,
      })
      .select("id")
      .single();
    if (retry.error || !retry.data) {
      throw new Error(error?.message || retry.error?.message || "Task failed");
    }
    await supabase
      .from("ckr_requests")
      .update({ linked_task_id: retry.data.id })
      .eq("id", id);
    await appendEvent({
      requestId: id,
      eventType: "TASK_CREATED",
      title: "Задача создана",
      detail: title,
      visibility: "INTERNAL",
      actorUserId: staff.user.id,
      meta: { task_id: retry.data.id },
    });
    revalidateInbox(id);
    return;
  }

  await supabase
    .from("ckr_requests")
    .update({ linked_task_id: task.id })
    .eq("id", id);
  await appendEvent({
    requestId: id,
    eventType: "TASK_CREATED",
    title: "Задача создана",
    detail: title,
    visibility: "INTERNAL",
    actorUserId: staff.user.id,
    meta: { task_id: task.id },
  });
  revalidateInbox(id);
  return;
}

/**
 * Manual deal from inbox — uses existing deals (project_id required).
 * Never auto-created.
 */
export async function createDealFromCkrRequestAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff();
  const id = String(formData.get("requestId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!id || !projectId) {
    throw new Error("Укажите заявку и project_id существующего проекта.");
  }

  const supabase = createClient();
  const { data: req } = await supabase
    .from("ckr_requests")
    .select("id, subject, body, deal_id, from_user_id")
    .eq("id", id)
    .maybeSingle();
  if (!req) throw new Error("Заявка не найдена");
  if (req.deal_id) throw new Error("Сделка уже связана с этой заявкой.");

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      project_id: projectId,
      initiator_id: staff.user.id,
      partner_id: req.from_user_id,
      deal_type: "other",
      status: "draft",
      description:
        description || req.subject || req.body.slice(0, 200) || "Сделка по заявке ЦКР",
      ckr_request_id: id,
    } as never)
    .select("id")
    .single();
  if (error || !deal) throw new Error(error?.message || "Не удалось создать сделку");

  await supabase
    .from("ckr_requests")
    .update({ deal_id: deal.id })
    .eq("id", id);

  await appendEvent({
    requestId: id,
    eventType: "DEAL_CREATED",
    title: "Сделка создана",
    detail: deal.id,
    visibility: "INTERNAL",
    actorUserId: staff.user.id,
    meta: { deal_id: deal.id, project_id: projectId },
  });
  revalidateInbox(id);
}

export async function generateLiaBriefAction(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(formData.get("requestId") ?? "").trim();
  if (!id) throw new Error("requestId required");

  const supabase = createClient();
  const { data: req } = await supabase
    .from("ckr_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!req) throw new Error("Не найдена");

  let orgName = "Клиент";
  if (req.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", req.organization_id)
      .maybeSingle();
    orgName = org?.name || orgName;
  }

  let needTitle: string | undefined;
  if (req.need_profile_id) {
    const { data: need } = await supabase
      .from("need_profiles")
      .select("title")
      .eq("id", req.need_profile_id)
      .maybeSingle();
    needTitle = need?.title;
  }

  const brief = buildLiaBriefDraft({
    organizationName: orgName,
    requestBody: req.body,
    region: req.region,
    hasNeed: Boolean(req.need_profile_id),
    needTitle,
    feedHints: [
      "Проверить published procurement / demand по региону",
      "Не считать POTENTIAL_BUYER подтверждённым спросом",
    ],
  });

  const { error } = await supabase
    .from("ckr_requests")
    .update({ lia_brief: brief })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await appendEvent({
    requestId: id,
    eventType: "LIA_BRIEF",
    title: "LIA brief подготовлен",
    detail: "CKR_ONLY · без auto outreach / MATCHES",
    visibility: "INTERNAL",
    actorUserId: staff.user.id,
  });

  revalidateInbox(id);
  return;
}

export async function updateCkrRequestPriorityAction(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("requestId") ?? "").trim();
  const priority = String(formData.get("priority") ?? "").trim();
  if (!id || !isCkrRequestPriority(priority)) throw new Error("Некорректно");
  const supabase = createClient();
  const { error } = await supabase
    .from("ckr_requests")
    .update({ priority })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateInbox(id);
  return;
}

export { partnershipTypeToCkrRequestType };
