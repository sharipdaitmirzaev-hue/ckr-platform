"use server";

import { ASSIGNABLE_ROLES } from "@/config/roles";
import { requireAdmin } from "@/lib/auth/require-admin";
import { requireStaff } from "@/lib/auth/require-staff";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUSES, PUBLISH_STATUSES } from "@/config/projects";
import type {
  ExpertProfileStatus,
  InvestmentOfferStatus,
  ProjectStatus,
  PublishStatus,
  UserRole,
  VerificationStatus,
} from "@/types";
import { revalidatePath } from "next/cache";

const INVESTMENT_STATUSES: InvestmentOfferStatus[] = [
  "draft",
  "moderation",
  "published",
  "closed",
];

const EXPERT_STATUSES: ExpertProfileStatus[] = [
  "draft",
  "moderation",
  "published",
  "archived",
];

const VERIFICATION_STATUSES: VerificationStatus[] = [
  "unverified",
  "pending",
  "verified",
];

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/investments");
  revalidatePath("/admin/experts");
  revalidatePath("/admin/verifications");
  revalidatePath("/admin/product-tests");
  revalidatePath("/projects");
  revalidatePath("/opportunities");
  revalidatePath("/investments");
  revalidatePath("/experts");
  revalidatePath("/dashboard");
}

export async function adminUpdateUserRolesAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  const selected = formData
    .getAll("roles")
    .map(String)
    .filter((role): role is UserRole =>
      [...ASSIGNABLE_ROLES, "admin"].includes(role as UserRole),
    );

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  const currentRoles = ((existing ?? []) as { role: UserRole }[]).map(
    (row) => row.role,
  );
  const nextRoles = selected;

  for (const role of currentRoles) {
    if (!nextRoles.includes(role)) {
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
    }
  }

  for (const role of nextRoles) {
    if (!currentRoles.includes(role)) {
      await supabase.from("user_roles").insert({ user_id: userId, role });
    }
  }

  revalidateAdmin();
  revalidatePath(`/admin/users/${userId}`);
}

export async function adminSetUserBlockedAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const blocked = String(formData.get("blocked") ?? "") === "true";

  if (!userId || userId === admin.user.id) return;

  const supabase = createClient();
  await supabase
    .from("profiles")
    .update({ is_blocked: blocked })
    .eq("id", userId);

  revalidateAdmin();
  revalidatePath(`/admin/users/${userId}`);
}

export async function adminUpdateProjectModerationAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ProjectStatus;
  const verificationStatus = String(
    formData.get("verificationStatus") ?? "",
  ) as VerificationStatus;

  if (!id) return;
  if (!PROJECT_STATUSES.includes(status)) return;
  if (!VERIFICATION_STATUSES.includes(verificationStatus)) return;

  const supabase = createClient();
  await supabase
    .from("projects")
    .update({
      status,
      verification_status: verificationStatus,
    })
    .eq("id", id);

  revalidateAdmin();
  revalidatePath(`/project/${id}`);
}

export async function adminUpdateOpportunityModerationAction(
  formData: FormData,
) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as PublishStatus;
  const verificationStatus = String(
    formData.get("verificationStatus") ?? "",
  ) as VerificationStatus;

  if (!id) return;
  if (!(PUBLISH_STATUSES as readonly string[]).includes(status)) return;
  if (!VERIFICATION_STATUSES.includes(verificationStatus)) return;

  const supabase = createClient();
  await supabase
    .from("opportunities")
    .update({
      status,
      verification_status: verificationStatus,
    })
    .eq("id", id);

  revalidateAdmin();
  revalidatePath(`/opportunity/${id}`);
}

export async function adminUpdateInvestmentModerationAction(
  formData: FormData,
) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as InvestmentOfferStatus;
  const verificationStatus = String(
    formData.get("verificationStatus") ?? "",
  ) as VerificationStatus;

  if (!id) return;
  if (!INVESTMENT_STATUSES.includes(status)) return;
  if (!VERIFICATION_STATUSES.includes(verificationStatus)) return;

  const supabase = createClient();
  await supabase
    .from("investment_offers")
    .update({
      status,
      verification_status: verificationStatus,
    })
    .eq("id", id);

  revalidateAdmin();
  revalidatePath(`/investment/${id}`);
}

export async function adminUpdateExpertModerationAction(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as ExpertProfileStatus;
  const verificationStatus = String(
    formData.get("verificationStatus") ?? "",
  ) as VerificationStatus;

  if (!id) return;
  if (!EXPERT_STATUSES.includes(status)) return;
  if (!VERIFICATION_STATUSES.includes(verificationStatus)) return;

  const supabase = createClient();
  await supabase
    .from("expert_profiles")
    .update({
      status,
      verification_status: verificationStatus,
    })
    .eq("id", id);

  revalidateAdmin();
  revalidatePath(`/expert/${id}`);
}
