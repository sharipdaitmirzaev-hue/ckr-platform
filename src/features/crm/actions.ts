"use server";

import {
  contactTypeToPlatformRole,
  isCrmActivityType,
  isCrmContactStatus,
  isCrmContactType,
  isCrmConversionTarget,
  isCrmLeadStage,
} from "@/config/crm";
import { getCrmSegmentTemplate } from "@/config/crm-templates";
import { generateInviteCode } from "@/config/beta";
import { requireStaff } from "@/lib/auth/require-staff";
import { slugifyTitle, withSlugSuffix } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CrmActionState = {
  error?: string;
  success?: string;
  inviteCode?: string;
  entityId?: string;
};

function revalidateCrm(paths: string[] = []) {
  revalidatePath("/admin/crm");
  for (const path of paths) revalidatePath(path);
}

async function logActivity(
  supabase: ReturnType<typeof createClient>,
  input: {
    contactId?: string | null;
    leadId?: string | null;
    type: "call" | "meeting" | "email" | "comment" | "task";
    title: string;
    body?: string;
    createdBy: string;
    taskStatus?: "open" | "done" | "cancelled" | null;
    dueAt?: string | null;
  },
) {
  await supabase.from("crm_activities").insert({
    contact_id: input.contactId ?? null,
    lead_id: input.leadId ?? null,
    type: input.type,
    title: input.title,
    body: input.body ?? "",
    task_status: input.type === "task" ? (input.taskStatus ?? "open") : null,
    due_at: input.dueAt ?? null,
    created_by: input.createdBy,
  });
}

export async function createCrmContactAction(
  _prev: CrmActionState,
  formData: FormData,
): Promise<CrmActionState> {
  const staff = await requireStaff();
  const name = String(formData.get("name") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const type = String(formData.get("type") ?? "other");
  const source = String(formData.get("source") ?? "").trim();
  const status = String(formData.get("status") ?? "new");
  const notes = String(formData.get("notes") ?? "").trim();

  if (name.length < 2) return { error: "Укажите имя контакта." };
  if (!isCrmContactType(type)) return { error: "Некорректный тип контакта." };
  if (!isCrmContactStatus(status)) {
    return { error: "Некорректный статус контакта." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("crm_contacts").insert({
    name,
    company_name: companyName,
    phone,
    email,
    type,
    source,
    status,
    notes,
    assigned_to: staff.user.id,
    created_by: staff.user.id,
  });

  if (error) return { error: error.message };
  revalidateCrm();
  return { success: "Контакт создан." };
}

/**
 * Применить шаблон сегмента CRM (customers / suppliers / partners).
 * Требует явного confirm=on.
 */
export async function applyCrmSegmentTemplateAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff("/admin/crm");
  const templateId = String(formData.get("templateId") ?? "").trim();
  const confirmed = formData.get("confirm") === "on";
  const organizationLabel = String(formData.get("organizationLabel") ?? "")
    .trim()
    .slice(0, 120);

  if (!confirmed) return;

  const template = getCrmSegmentTemplate(templateId);
  if (!template) return;

  const supabase = createClient();
  const companyName = organizationLabel
    ? `${organizationLabel} — ${template.label.toLowerCase()}`
    : template.companyName;

  await supabase.from("crm_contacts").insert({
    name: template.name,
    company_name: companyName,
    phone: "",
    email: "",
    type: template.contactType,
    source: template.source,
    status: "new",
    notes: template.notes,
    assigned_to: staff.user.id,
    created_by: staff.user.id,
  });

  revalidateCrm(["/admin/crm"]);
}

export async function updateCrmContactStatusAction(
  formData: FormData,
): Promise<void> {
  await requireStaff();
  const id = String(formData.get("contactId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isCrmContactStatus(status)) return;

  const supabase = createClient();
  await supabase.from("crm_contacts").update({ status }).eq("id", id);
  revalidateCrm();
}

export async function createCrmLeadAction(
  _prev: CrmActionState,
  formData: FormData,
): Promise<CrmActionState> {
  const staff = await requireStaff();
  const contactId = String(formData.get("contactId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const stage = String(formData.get("stage") ?? "new");

  if (!contactId) return { error: "Выберите контакт." };
  if (title.length < 3) return { error: "Укажите название лида." };
  if (!isCrmLeadStage(stage)) return { error: "Некорректный этап лида." };

  const supabase = createClient();
  const { error } = await supabase.from("leads").insert({
    contact_id: contactId,
    title,
    description,
    category,
    stage,
    assigned_to: staff.user.id,
    created_by: staff.user.id,
  });

  if (error) return { error: error.message };
  revalidateCrm();
  return { success: "Лид создан." };
}

export async function updateCrmLeadStageAction(
  formData: FormData,
): Promise<void> {
  await requireStaff();
  const id = String(formData.get("leadId") ?? "");
  const stage = String(formData.get("stage") ?? "");
  if (!id || !isCrmLeadStage(stage)) return;

  const supabase = createClient();
  await supabase.from("leads").update({ stage }).eq("id", id);
  revalidateCrm([`/admin/crm/leads/${id}`]);
}

export async function createCrmActivityAction(
  _prev: CrmActionState,
  formData: FormData,
): Promise<CrmActionState> {
  const staff = await requireStaff();
  const type = String(formData.get("type") ?? "comment");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const contactId = String(formData.get("contactId") ?? "") || null;
  const leadId = String(formData.get("leadId") ?? "") || null;
  const dueAtRaw = String(formData.get("dueAt") ?? "").trim();

  if (!isCrmActivityType(type)) return { error: "Некорректный тип активности." };
  if (!contactId && !leadId) {
    return { error: "Укажите контакт или лид." };
  }
  if (!title && !body) {
    return { error: "Добавьте заголовок или текст." };
  }

  const supabase = createClient();
  await logActivity(supabase, {
    contactId,
    leadId,
    type,
    title: title || crmActivityFallbackTitle(type),
    body,
    createdBy: staff.user.id,
    taskStatus: type === "task" ? "open" : null,
    dueAt: dueAtRaw ? new Date(dueAtRaw).toISOString() : null,
  });

  revalidateCrm(leadId ? [`/admin/crm/leads/${leadId}`] : []);
  return { success: "Активность добавлена." };
}

function crmActivityFallbackTitle(type: string) {
  if (type === "call") return "Звонок";
  if (type === "meeting") return "Встреча";
  if (type === "email") return "Письмо";
  if (type === "task") return "Задача";
  return "Комментарий";
}

export async function completeCrmTaskAction(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("activityId") ?? "");
  if (!id) return;

  const supabase = createClient();
  await supabase
    .from("crm_activities")
    .update({
      task_status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("type", "task");

  revalidateCrm();
}

/**
 * Конвертация лида. Только после явного confirm=on от администратора.
 */
export async function convertCrmLeadAction(
  _prev: CrmActionState,
  formData: FormData,
): Promise<CrmActionState> {
  const staff = await requireStaff();
  const leadId = String(formData.get("leadId") ?? "");
  const target = String(formData.get("target") ?? "");
  const confirmed = formData.get("confirm") === "on";

  if (!confirmed) {
    return {
      error:
        "Подтвердите конвертацию: действие создаёт сущность на платформе.",
    };
  }
  if (!leadId) return { error: "Не указан лид." };
  if (!isCrmConversionTarget(target)) {
    return { error: "Некорректная цель конвертации." };
  }

  const supabase = createClient();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*, crm_contacts(*)")
    .eq("id", leadId)
    .maybeSingle();

  if (leadError || !lead) return { error: "Лид не найден." };

  const contact = (
    lead as {
      crm_contacts?: {
        id: string;
        name: string;
        email: string;
        company_name: string;
        type: string;
        linked_user_id: string | null;
      } | null;
    }
  ).crm_contacts;

  if (!contact) return { error: "Контакт лида не найден." };

  if (target === "user") {
    return convertLeadToUser(supabase, staff.user.id, leadId, contact);
  }
  if (target === "project") {
    return convertLeadToProject(supabase, staff.user.id, lead, contact);
  }
  if (target === "opportunity") {
    return convertLeadToOpportunity(supabase, staff.user.id, lead, contact);
  }
  return convertLeadToInvestment(supabase, staff.user.id, lead, contact);
}

async function convertLeadToUser(
  supabase: ReturnType<typeof createClient>,
  adminId: string,
  leadId: string,
  contact: {
    id: string;
    name: string;
    email: string;
    type: string;
    linked_user_id: string | null;
  },
): Promise<CrmActionState> {
  if (!contact.email) {
    return { error: "У контакта нет email — нельзя создать пользователя." };
  }

  if (contact.linked_user_id) {
    await supabase
      .from("leads")
      .update({
        converted_user_id: contact.linked_user_id,
        stage: "qualified",
      })
      .eq("id", leadId);

    await logActivity(supabase, {
      contactId: contact.id,
      leadId,
      type: "comment",
      title: "Конвертация: пользователь уже связан",
      body: `Контакт уже связан с пользователем ${contact.linked_user_id}.`,
      createdBy: adminId,
    });

    revalidateCrm([`/admin/crm/leads/${leadId}`]);
    return {
      success: "Лид связан с существующим пользователем контакта.",
      entityId: contact.linked_user_id,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("full_name", contact.name)
    .limit(1)
    .maybeSingle();

  // Предпочтительный путь closed beta: приглашение по email.
  const role = contactTypeToPlatformRole(
    isCrmContactType(contact.type) ? contact.type : "other",
  );
  const code = generateInviteCode();
  const { error: inviteError } = await supabase.from("beta_invites").insert({
    email: contact.email.toLowerCase(),
    code,
    role,
    status: "invited",
    created_by: adminId,
  });

  if (inviteError) {
    return {
      error: `Не удалось создать приглашение: ${inviteError.message}`,
    };
  }

  if (profile?.id) {
    await supabase
      .from("crm_contacts")
      .update({ linked_user_id: profile.id, status: "active" })
      .eq("id", contact.id);
    await supabase
      .from("leads")
      .update({ converted_user_id: profile.id, stage: "qualified" })
      .eq("id", leadId);
  } else {
    await supabase
      .from("leads")
      .update({ stage: "qualified" })
      .eq("id", leadId);
  }

  await logActivity(supabase, {
    contactId: contact.id,
    leadId,
    type: "comment",
    title: "Конвертация: приглашение пользователя",
    body: `Создано приглашение ${code} для ${contact.email} (роль ${role}). Регистрация: /register?invite=${code}`,
    createdBy: adminId,
  });

  revalidateCrm([`/admin/crm/leads/${leadId}`, "/admin/invites"]);
  return {
    success:
      "Создано приглашение для пользователя. Передайте код контакту для регистрации.",
    inviteCode: code,
    entityId: profile?.id,
  };
}

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

async function convertLeadToProject(
  supabase: ReturnType<typeof createClient>,
  adminId: string,
  lead: { id: string; title: string; description: string; category: string },
  contact: {
    id: string;
    name: string;
    linked_user_id: string | null;
  },
): Promise<CrmActionState> {
  const ownerId = contact.linked_user_id ?? adminId;
  const slug = await ensureUniqueSlug(supabase, lead.title);
  const category = lead.category || "services";

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: ownerId,
      title: lead.title,
      slug,
      summary: lead.description.slice(0, 280) || lead.title,
      description:
        lead.description ||
        `Проект создан из CRM-лида. Контакт: ${contact.name}.`,
      category,
      region: "",
      status: "draft",
      stage: "idea",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать проект." };
  }

  await supabase
    .from("leads")
    .update({
      converted_project_id: data.id,
      stage: "project_created",
    })
    .eq("id", lead.id);

  await logActivity(supabase, {
    contactId: contact.id,
    leadId: lead.id,
    type: "comment",
    title: "Конвертация: проект",
    body: `Создан черновик проекта ${data.id}.`,
    createdBy: adminId,
  });

  revalidateCrm([
    `/admin/crm/leads/${lead.id}`,
    "/dashboard/projects",
    "/admin/projects",
  ]);
  return {
    success: "Лид конвертирован в черновик проекта.",
    entityId: data.id,
  };
}

async function convertLeadToOpportunity(
  supabase: ReturnType<typeof createClient>,
  adminId: string,
  lead: { id: string; title: string; description: string },
  contact: { id: string; name: string; linked_user_id: string | null },
): Promise<CrmActionState> {
  const ownerId = contact.linked_user_id ?? adminId;
  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      owner_id: ownerId,
      title: lead.title,
      description:
        lead.description ||
        `Возможность из CRM-лида. Контакт: ${contact.name}.`,
      type: "partner",
      region: "",
      city: "",
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать возможность." };
  }

  await supabase
    .from("leads")
    .update({
      converted_opportunity_id: data.id,
      stage: "project_created",
    })
    .eq("id", lead.id);

  await logActivity(supabase, {
    contactId: contact.id,
    leadId: lead.id,
    type: "comment",
    title: "Конвертация: возможность",
    body: `Создан черновик возможности ${data.id}.`,
    createdBy: adminId,
  });

  revalidateCrm([
    `/admin/crm/leads/${lead.id}`,
    "/dashboard/opportunities",
    "/admin/opportunities",
  ]);
  return {
    success: "Лид конвертирован в черновик возможности.",
    entityId: data.id,
  };
}

async function convertLeadToInvestment(
  supabase: ReturnType<typeof createClient>,
  adminId: string,
  lead: { id: string; title: string; description: string; category: string },
  contact: { id: string; name: string; linked_user_id: string | null },
): Promise<CrmActionState> {
  const ownerId = contact.linked_user_id ?? adminId;
  const { data, error } = await supabase
    .from("investment_offers")
    .insert({
      owner_id: ownerId,
      title: lead.title,
      description:
        lead.description ||
        `Инвестиционное предложение из CRM-лида. Контакт: ${contact.name}.`,
      amount_min: 0,
      amount_max: 0,
      currency: "RUB",
      regions: [],
      categories: lead.category ? [lead.category] : [],
      investment_type: "equity",
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать инвестицию." };
  }

  await supabase
    .from("leads")
    .update({
      converted_investment_id: data.id,
      stage: "deal",
    })
    .eq("id", lead.id);

  await logActivity(supabase, {
    contactId: contact.id,
    leadId: lead.id,
    type: "comment",
    title: "Конвертация: инвестиция",
    body: `Создан черновик инвестиционного предложения ${data.id}.`,
    createdBy: adminId,
  });

  revalidateCrm([
    `/admin/crm/leads/${lead.id}`,
    "/dashboard/investments",
    "/admin/investments",
  ]);
  return {
    success: "Лид конвертирован в черновик инвестиции.",
    entityId: data.id,
  };
}
