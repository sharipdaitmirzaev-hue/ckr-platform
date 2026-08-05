"use server";

import { createVerificationRequestSchema } from "@/lib/verification/validations";
import { adminVerificationDecisionSchema } from "@/lib/verification/validations";
import { createClient } from "@/lib/supabase/server";
import type { DocumentRelatedType, VerificationStatus } from "@/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type VerificationActionState = {
  error?: string;
  success?: string;
};

async function assertOwnsTarget(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  targetType: DocumentRelatedType,
  targetId: string,
) {
  if (targetType === "profile") {
    return targetId === userId;
  }

  if (targetType === "project") {
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("id", targetId)
      .eq("owner_id", userId)
      .maybeSingle();
    return Boolean(data);
  }

  if (targetType === "opportunity") {
    const { data } = await supabase
      .from("opportunities")
      .select("id")
      .eq("id", targetId)
      .eq("owner_id", userId)
      .maybeSingle();
    return Boolean(data);
  }

  if (targetType === "investment") {
    const { data } = await supabase
      .from("investment_offers")
      .select("id")
      .eq("id", targetId)
      .eq("owner_id", userId)
      .maybeSingle();
    return Boolean(data);
  }

  if (targetType === "expert") {
    const { data } = await supabase
      .from("expert_profiles")
      .select("id")
      .eq("id", targetId)
      .eq("user_id", userId)
      .maybeSingle();
    return Boolean(data);
  }

  return false;
}

async function setTargetStatus(
  supabase: ReturnType<typeof createClient>,
  targetType: DocumentRelatedType,
  targetId: string,
  status: VerificationStatus,
) {
  if (targetType === "profile") {
    await supabase
      .from("profiles")
      .update({ verification_status: status })
      .eq("id", targetId);
    return;
  }

  if (targetType === "project") {
    await supabase
      .from("projects")
      .update({ verification_status: status })
      .eq("id", targetId);
    return;
  }

  if (targetType === "opportunity") {
    await supabase
      .from("opportunities")
      .update({ verification_status: status })
      .eq("id", targetId);
    return;
  }

  if (targetType === "investment") {
    await supabase
      .from("investment_offers")
      .update({ verification_status: status })
      .eq("id", targetId);
    return;
  }

  if (targetType === "expert") {
    await supabase
      .from("expert_profiles")
      .update({ verification_status: status })
      .eq("id", targetId);
  }
}

export async function createVerificationRequestAction(
  _prev: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  const parsed = createVerificationRequestSchema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
  });

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

  const owns = await assertOwnsTarget(
    supabase,
    user.id,
    parsed.data.targetType,
    parsed.data.targetId,
  );

  if (!owns) {
    return { error: "Можно запросить проверку только для своих объектов." };
  }

  const { data: existing } = await supabase
    .from("verification_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_type", parsed.data.targetType)
    .eq("target_id", parsed.data.targetId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { error: "Заявка на проверку уже отправлена." };
  }

  const { error } = await supabase.from("verification_requests").insert({
    user_id: user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    status: "pending",
  });

  if (error) {
    return { error: error.message };
  }

  await setTargetStatus(
    supabase,
    parsed.data.targetType,
    parsed.data.targetId,
    "pending",
  );

  // Документы на review переводим в pending
  await supabase
    .from("documents")
    .update({ status: "pending" })
    .eq("owner_id", user.id)
    .eq("related_type", parsed.data.targetType)
    .eq("related_id", parsed.data.targetId)
    .eq("visibility", "review")
    .in("status", ["uploaded", "pending"]);

  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expert");
  revalidatePath("/admin/verifications");
  return { success: "Заявка на проверку отправлена." };
}

export async function adminDecideVerificationAction(
  formData: FormData,
): Promise<void> {
  const parsed = adminVerificationDecisionSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    adminComment: formData.get("adminComment") || "",
  });

  if (!parsed.success) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isAdmin = (roles ?? []).some((row) => row.role === "admin");
  if (!isAdmin) redirect("/dashboard");

  const { data: request } = await supabase
    .from("verification_requests")
    .select("*")
    .eq("id", parsed.data.requestId)
    .maybeSingle();

  if (!request || request.status !== "pending") return;

  const nextStatus = parsed.data.decision;
  const entityStatus: VerificationStatus =
    nextStatus === "approved" ? "verified" : "unverified";

  await supabase
    .from("verification_requests")
    .update({
      status: nextStatus,
      admin_comment: parsed.data.adminComment || "",
    })
    .eq("id", request.id);

  await setTargetStatus(
    supabase,
    request.target_type as DocumentRelatedType,
    request.target_id,
    entityStatus,
  );

  if (nextStatus === "approved") {
    await supabase
      .from("documents")
      .update({ status: "verified" })
      .eq("related_type", request.target_type)
      .eq("related_id", request.target_id)
      .in("status", ["uploaded", "pending"]);
  } else {
    await supabase
      .from("documents")
      .update({ status: "rejected" })
      .eq("related_type", request.target_type)
      .eq("related_id", request.target_id)
      .eq("status", "pending");
  }

  revalidatePath("/admin/verifications");
  revalidatePath("/dashboard/documents");
  revalidatePath("/dashboard");
  revalidatePath("/experts");
  revalidatePath("/projects");
  revalidatePath("/opportunities");
  revalidatePath("/investments");
}
