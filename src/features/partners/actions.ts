"use server";

import {
  canManageOrganization,
  isOrganizationMemberRole,
  isOrganizationType,
  isPartnershipStatus,
  isPartnershipType,
} from "@/config/partners";
import { requirePartnerMembership, requirePartnerUser } from "@/lib/auth/require-partner";
import { getMembership } from "@/lib/partners/queries";
import { slugifyTitle, withSlugSuffix } from "@/lib/projects/slug";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type PartnerActionState = {
  error?: string;
  success?: string;
};

function revalidatePartner() {
  revalidatePath("/partner");
  revalidatePath("/partner/profile");
  revalidatePath("/partner/members");
  revalidatePath("/partner/projects");
  revalidatePath("/partner/offers");
  revalidatePath("/partner/applications");
}

export async function createOrganizationAction(
  _prev: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  const session = await requirePartnerUser();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "company");
  const description = String(formData.get("description") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (name.length < 2) return { error: "Укажите название организации." };
  if (!isOrganizationType(type)) return { error: "Некорректный тип." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name,
      type,
      description,
      website,
      region,
      city,
      created_by: session.user.id,
      verification_status: "unverified",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать организацию." };
  }

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: data.id,
      user_id: session.user.id,
      role: "owner",
    });

  if (memberError) {
    return { error: memberError.message };
  }

  // Добавим роль company на платформе, если её ещё нет
  if (!session.roles.includes("company")) {
    await supabase.from("user_roles").upsert(
      { user_id: session.user.id, role: "company" },
      { onConflict: "user_id,role" },
    );
  }

  const { trackBetaMilestone } = await import("@/lib/beta/track-milestone");
  await trackBetaMilestone({
    eventType: "first_object_created",
    userId: session.user.id,
    entityType: "organization",
    entityId: data.id,
    metadata: { channel: "first_users_launch", object: "organization" },
  });

  revalidatePartner();
  redirect("/partner/profile");
}

export async function updateOrganizationAction(
  _prev: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  const session = await requirePartnerMembership();
  const orgId = session.primary.organization.id;
  if (!canManageOrganization(session.primary.role)) {
    return { error: "Недостаточно прав для изменения профиля." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "company");
  const description = String(formData.get("description") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const requestVerification = formData.get("requestVerification") === "on";

  if (name.length < 2) return { error: "Укажите название организации." };
  if (!isOrganizationType(type)) return { error: "Некорректный тип." };

  const supabase = createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      type,
      description,
      website,
      region,
      city,
      verification_status: requestVerification
        ? "pending"
        : session.primary.organization.verificationStatus,
    })
    .eq("id", orgId);

  if (error) return { error: error.message };
  revalidatePartner();
  return { success: "Профиль организации обновлён." };
}

export async function addOrganizationMemberAction(
  _prev: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  const session = await requirePartnerMembership();
  if (!canManageOrganization(session.primary.role)) {
    return { error: "Недостаточно прав для добавления сотрудников." };
  }

  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "employee");
  if (!userId) return { error: "Укажите user id сотрудника." };
  if (!isOrganizationMemberRole(role) || role === "owner") {
    return { error: "Можно назначить manager или employee." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("organization_members").insert({
    organization_id: session.primary.organization.id,
    user_id: userId,
    role,
  });

  if (error) return { error: error.message };
  revalidatePartner();
  return { success: "Сотрудник добавлен." };
}

export async function updateMemberRoleAction(formData: FormData): Promise<void> {
  const session = await requirePartnerMembership();
  if (!canManageOrganization(session.primary.role)) return;

  const memberId = String(formData.get("memberId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!memberId || !isOrganizationMemberRole(role) || role === "owner") return;

  const supabase = createClient();
  await supabase
    .from("organization_members")
    .update({ role })
    .eq("id", memberId)
    .eq("organization_id", session.primary.organization.id)
    .neq("role", "owner");

  revalidatePartner();
}

export async function createPartnershipAction(
  _prev: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  const session = await requirePartnerMembership();
  if (!canManageOrganization(session.primary.role)) {
    return { error: "Недостаточно прав для партнёрства." };
  }

  const type = String(formData.get("type") ?? "strategic");
  const status = String(formData.get("status") ?? "pending");
  const description = String(formData.get("description") ?? "").trim();

  if (!isPartnershipType(type)) return { error: "Некорректный тип партнёрства." };
  if (!isPartnershipStatus(status)) {
    return { error: "Некорректный статус партнёрства." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("partnerships")
    .insert({
      organization_id: session.primary.organization.id,
      type,
      status,
      description,
      created_by: session.user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { recordEntityHistory } = await import(
    "@/lib/reputation/ensure-profile"
  );
  const org = session.primary.organization;
  await recordEntityHistory({
    entityType: "organization",
    entityId: org.id,
    kind: "partnership",
    title: `Партнёрство (${type}): ${org.name}`,
    relatedType: "partnership",
    relatedId: data?.id ?? null,
    meta: { status, description },
  });
  await recordEntityHistory({
    entityType: "user",
    entityId: session.user.id,
    kind: "partnership",
    title: `Партнёрство организации «${org.name}» (${type})`,
    relatedType: "partnership",
    relatedId: data?.id ?? null,
    meta: { organizationId: org.id, status },
  });

  revalidatePartner();
  return { success: "Партнёрство создано." };
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

/** Организация создаёт / участвует в проекте (черновик от имени участника). */
export async function createOrgProjectAction(
  _prev: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  const session = await requirePartnerMembership();
  const membership = await getMembership(
    session.primary.organization.id,
    session.user.id,
  );
  if (!membership || !canManageOrganization(membership.role)) {
    return { error: "Недостаточно прав." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "services").trim();
  const region =
    String(formData.get("region") ?? "").trim() ||
    session.primary.organization.region;

  if (title.length < 3) return { error: "Укажите название проекта." };

  const supabase = createClient();
  const slug = await ensureUniqueSlug(supabase, title);
  const { error } = await supabase.from("projects").insert({
    owner_id: session.user.id,
    organization_id: session.primary.organization.id,
    title,
    slug,
    summary: summary || title,
    description: description || summary || title,
    category: category || "services",
    region,
    status: "draft",
    stage: "idea",
  });

  if (error) return { error: error.message };
  revalidatePartner();
  revalidatePath("/dashboard/projects");
  return { success: "Проект организации создан (черновик)." };
}

export async function createOrgOpportunityAction(
  _prev: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  const session = await requirePartnerMembership();
  if (!canManageOrganization(session.primary.role)) {
    return { error: "Недостаточно прав." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "service");
  const region =
    String(formData.get("region") ?? "").trim() ||
    session.primary.organization.region;
  const city =
    String(formData.get("city") ?? "").trim() ||
    session.primary.organization.city;

  if (title.length < 3) return { error: "Укажите название возможности." };

  const supabase = createClient();
  const { error } = await supabase.from("opportunities").insert({
    owner_id: session.user.id,
    organization_id: session.primary.organization.id,
    title,
    description: description || title,
    type,
    region,
    city,
    status: "draft",
  });

  if (error) return { error: error.message };
  revalidatePartner();
  revalidatePath("/dashboard/opportunities");
  return { success: "Возможность организации создана (черновик)." };
}

export async function createOrgInvestmentAction(
  _prev: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  const session = await requirePartnerMembership();
  if (!canManageOrganization(session.primary.role)) {
    return { error: "Недостаточно прав." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amountMin = Number(formData.get("amountMin") ?? 0);
  const amountMax = Number(formData.get("amountMax") ?? 0);

  if (title.length < 3) return { error: "Укажите название предложения." };

  const supabase = createClient();
  const { error } = await supabase.from("investment_offers").insert({
    owner_id: session.user.id,
    organization_id: session.primary.organization.id,
    title,
    description: description || title,
    amount_min: Number.isFinite(amountMin) ? amountMin : 0,
    amount_max: Number.isFinite(amountMax) ? amountMax : 0,
    currency: "RUB",
    regions: session.primary.organization.region
      ? [session.primary.organization.region]
      : [],
    categories: [],
    investment_type: "partnership",
    status: "draft",
  });

  if (error) return { error: error.message };
  revalidatePartner();
  revalidatePath("/dashboard/investments");
  return { success: "Инвестиционное предложение создано (черновик)." };
}
