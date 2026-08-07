"use server";

import {
  isPartnershipPipelineStage,
  isPartnershipTaskStatus,
  isPartnershipTaskType,
} from "@/config/partnership-network";
import { requireStaff } from "@/lib/auth/require-staff";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PartnershipNetworkActionState = {
  error?: string;
  success?: string;
};

function revalidatePartnerships() {
  revalidatePath("/admin/partnerships");
  revalidatePath("/partner");
  revalidatePath("/admin/growth");
}

export async function createPartnershipTaskAction(
  prev: PartnershipNetworkActionState,
  formData: FormData,
): Promise<PartnershipNetworkActionState> {
  void prev;
  const staff = await requireStaff("/admin/partnerships");
  const taskType = String(formData.get("taskType") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!isPartnershipTaskType(taskType)) {
    return { error: "Некорректный тип задачи." };
  }
  if (title.length < 3) {
    return { error: "Укажите название задачи (от 3 символов)." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("partnership_tasks").insert({
    task_type: taskType,
    title,
    description,
    status: "new",
    created_by: staff.user.id,
    assignee_id: staff.user.id,
  });

  if (error) {
    return {
      error:
        error.message.includes("partnership_tasks") || error.code === "42P01"
          ? "Примените миграцию 20260325560000_partnership_network.sql"
          : error.message,
    };
  }

  revalidatePartnerships();
  return { success: "Задача PartnershipTasks создана." };
}

export async function updatePartnershipTaskStatusAction(
  formData: FormData,
): Promise<void> {
  await requireStaff("/admin/partnerships");
  const taskId = String(formData.get("taskId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!taskId || !isPartnershipTaskStatus(status)) return;

  const supabase = createClient();
  await supabase
    .from("partnership_tasks")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  revalidatePartnerships();
}

export async function updatePartnershipPipelineAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff("/admin/partnerships");
  const partnershipId = String(formData.get("partnershipId") ?? "").trim();
  const stage = String(formData.get("pipelineStage") ?? "").trim();
  if (!partnershipId || partnershipId.startsWith("org-")) return;
  if (!isPartnershipPipelineStage(stage)) return;

  const supabase = createClient();
  const status =
    stage === "active" ? "active" : stage === "completed" ? "inactive" : "pending";

  await supabase
    .from("partnerships")
    .update({
      pipeline_stage: stage,
      status,
      updated_at: new Date().toISOString(),
      ...(stage === "active"
        ? { started_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", partnershipId);

  try {
    const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
    if (stage === "contacted" || stage === "meeting") {
      await trackAnalyticsEvent({
        eventType: "partner_contacted",
        userId: staff.user.id,
        entityType: "partnership",
        entityId: partnershipId,
        metadata: { source: "partner", pipelineStage: stage },
      });
    }
    if (stage === "active") {
      await trackAnalyticsEvent({
        eventType: "partner_activated",
        userId: staff.user.id,
        entityType: "partnership",
        entityId: partnershipId,
        metadata: { source: "partner", pipelineStage: stage },
      });
    }
    if (stage === "completed") {
      await trackAnalyticsEvent({
        eventType: "partner_result_created",
        userId: staff.user.id,
        entityType: "partnership",
        entityId: partnershipId,
        metadata: { source: "partner", pipelineStage: stage },
      });
    }
  } catch {
    // мягкий сбой
  }

  revalidatePartnerships();
}
