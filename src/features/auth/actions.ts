"use server";

import { mapAuthError } from "@/lib/auth/errors";
import {
  loginSchema,
  onboardingSchema,
  registerSchema,
} from "@/lib/auth/validations";
import { createClient } from "@/lib/supabase/server";
import { ASSIGNABLE_ROLES, type AssignableRole } from "@/config/roles";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionState = {
  error?: string;
  success?: string;
};

async function syncRoles(userId: string, nextRoles: AssignableRole[]) {
  const supabase = createClient();

  const { data: existing, error: readError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (readError) {
    throw new Error(readError.message);
  }

  const current = new Set(
    (existing ?? [])
      .map((row) => row.role as string)
      .filter((role) => role !== "admin"),
  );
  const desired = new Set(nextRoles);

  const toAdd = Array.from(desired).filter((role) => !current.has(role));
  const toRemove = Array.from(current).filter(
    (role) => !desired.has(role as AssignableRole),
  );

  if (toAdd.length > 0) {
    const { error } = await supabase.from("user_roles").insert(
      toAdd.map((role) => ({
        user_id: userId,
        role,
      })),
    );
    if (error) throw new Error(error.message);
  }

  for (const role of toRemove) {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) throw new Error(error.message);
  }
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    inviteCode: formData.get("inviteCode") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const { email, password, fullName, inviteCode } = parsed.data;
  let { role } = parsed.data;
  const supabase = createClient();

  const { isInviteRequired } = await import("@/config/beta");
  let inviteId: string | null = null;

  if (isInviteRequired() || inviteCode) {
    if (!inviteCode) {
      return { error: "Для закрытой beta нужен код приглашения." };
    }
    const normalized = inviteCode.trim().toUpperCase();
    const { data: invite, error: inviteError } = await supabase
      .from("beta_invites")
      .select("*")
      .eq("code", normalized)
      .maybeSingle();

    if (inviteError || !invite) {
      return { error: "Приглашение не найдено." };
    }
    if (
      invite.status !== "created" &&
      invite.status !== "sent" &&
      invite.status !== "invited"
    ) {
      return { error: "Приглашение уже использовано или отключено." };
    }
    if (
      invite.email &&
      invite.email.toLowerCase() !== email.toLowerCase()
    ) {
      return { error: "Email не совпадает с приглашением." };
    }
    if (
      invite.role &&
      (ASSIGNABLE_ROLES as readonly string[]).includes(invite.role)
    ) {
      role = invite.role as typeof role;
    }
    inviteId = invite.id;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  if (!data.user) {
    return { error: "Не удалось создать пользователя." };
  }

  const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
  await trackAnalyticsEvent({
    eventType: "user_registered",
    userId: data.user.id,
    entityType: "user",
    entityId: data.user.id,
    metadata: { role, inviteId },
  });
  await trackAnalyticsEvent({
    eventType: "public_registration",
    userId: data.user.id,
    entityType: "user",
    entityId: data.user.id,
    metadata: { role, inviteId, channel: "public_launch" },
  });

  const { trackPilotMetric } = await import("@/lib/pilot/track");
  await trackPilotMetric({
    eventType: "registration_completed",
    userId: data.user.id,
    entityType: "user",
    entityId: data.user.id,
    metadata: { role, inviteId },
  });

  if (inviteId) {
    await supabase
      .from("beta_invites")
      .update({
        status: "activated",
        used_at: new Date().toISOString(),
        used_by: data.user.id,
      })
      .eq("id", inviteId);
  }

  // Если email confirmation включён и сессии нет — просим подтвердить почту.
  if (!data.session) {
    return {
      success:
        "Аккаунт создан. Подтвердите email — после этого войдите и завершите онбординг.",
    };
  }

  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: data.user.id,
    role,
  });

  if (roleError) {
    return { error: mapAuthError(roleError.message) };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

function safeNextPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(formData.get("next")));
}

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function onboardingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const roles = formData.getAll("roles").map(String);

  const parsed = onboardingSchema.safeParse({
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName") || undefined,
    website: formData.get("website") || undefined,
    phone: formData.get("phone") || undefined,
    city: formData.get("city") || undefined,
    region: formData.get("region") || undefined,
    bio: formData.get("bio") || undefined,
    telegram: formData.get("telegram") || undefined,
    linkedin: formData.get("linkedin") || undefined,
    vk: formData.get("vk") || undefined,
    roles,
    isPublic: formData.get("isPublic") === "on",
    showContact: formData.get("showContact") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте форму" };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Необходимо войти в аккаунт." };
  }

  const socialLinks: Record<string, string> = {};
  if (parsed.data.telegram) socialLinks.telegram = parsed.data.telegram;
  if (parsed.data.linkedin) socialLinks.linkedin = parsed.data.linkedin;
  if (parsed.data.vk) socialLinks.vk = parsed.data.vk;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      company_name: parsed.data.companyName || null,
      website: parsed.data.website || null,
      social_links: socialLinks,
      phone: parsed.data.phone || null,
      city: parsed.data.city || null,
      region: parsed.data.region || null,
      bio: parsed.data.bio || null,
      is_public: parsed.data.isPublic !== false,
      show_contact: Boolean(parsed.data.showContact),
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: mapAuthError(profileError.message) };
  }

  try {
    await syncRoles(user.id, parsed.data.roles);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? mapAuthError(error.message)
          : "Не удалось сохранить роли.",
    };
  }

  const { trackPilotMetric } = await import("@/lib/pilot/track");
  await trackPilotMetric({
    eventType: "profile_completed",
    userId: user.id,
    entityType: "user",
    entityId: user.id,
    metadata: { roles: parsed.data.roles },
  });

  const { trackBetaMilestone } = await import("@/lib/beta/track-milestone");
  await trackBetaMilestone({
    eventType: "onboarding_completed",
    userId: user.id,
    metadata: { roles: parsed.data.roles },
  });
  await trackBetaMilestone({
    eventType: "profile_completed",
    userId: user.id,
    metadata: { roles: parsed.data.roles },
  });

  const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
  await trackAnalyticsEvent({
    eventType: "role_selected",
    userId: user.id,
    entityType: "user",
    entityId: user.id,
    metadata: { roles: parsed.data.roles, channel: "public_launch" },
  });

  const { pathForRoles } = await import("@/config/onboarding");
  const nextPath = pathForRoles(parsed.data.roles).href;

  revalidatePath("/", "layout");
  redirect(nextPath);
}
