"use server";

import {
  isProductImprovementPriority,
  isProductImprovementSource,
  isProductImprovementStatus,
  priorityFromFeedback,
  priorityFromSeverity,
} from "@/config/improvements";
import { isPilotIssueSeverity } from "@/config/pilot";
import { requireStaff } from "@/lib/auth/require-staff";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ImprovementActionState = {
  error?: string;
  success?: string;
};

function revalidateImprovements() {
  revalidatePath("/admin/improvements");
  revalidatePath("/admin/pilot");
  revalidatePath("/admin/product-sprint");
}

export async function createProductImprovementAction(
  _prev: ImprovementActionState,
  formData: FormData,
): Promise<ImprovementActionState> {
  await requireStaff("/admin/improvements");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const status = String(formData.get("status") ?? "planned");
  const sourceType = String(formData.get("sourceType") ?? "manual");
  const sourceIdRaw = String(formData.get("sourceId") ?? "").trim();

  if (title.length < 3) {
    return { error: "Укажите заголовок (от 3 символов)." };
  }
  if (!isProductImprovementPriority(priority)) {
    return { error: "Некорректный приоритет." };
  }
  if (!isProductImprovementStatus(status)) {
    return { error: "Некорректный статус." };
  }
  if (!isProductImprovementSource(sourceType)) {
    return { error: "Некорректный источник." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("product_improvements").insert({
    title,
    description,
    priority,
    status,
    source_type: sourceType,
    source_id: sourceIdRaw || null,
  });

  if (error) return { error: error.message };

  revalidateImprovements();
  return { success: "Улучшение добавлено." };
}

export async function updateProductImprovementStatusAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff("/admin/improvements");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !isProductImprovementStatus(status)) return;

  const supabase = createClient();
  await supabase
    .from("product_improvements")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  try {
    const { trackAnalyticsEvent } = await import("@/lib/analytics/track");
    if (status === "in_progress") {
      await trackAnalyticsEvent({
        eventType: "product_fix_started",
        userId: staff.user.id,
        entityType: "product_improvement",
        entityId: id,
        metadata: { status, sprint: "product_fix" },
      });
    }
    if (status === "released") {
      await trackAnalyticsEvent({
        eventType: "product_fix_completed",
        userId: staff.user.id,
        entityType: "product_improvement",
        entityId: id,
        metadata: { status, sprint: "product_fix" },
      });
    }
  } catch {
    // мягкий сбой аналитики
  }

  revalidateImprovements();
}

export async function updateProductImprovementPriorityAction(
  formData: FormData,
): Promise<void> {
  await requireStaff("/admin/improvements");
  const id = String(formData.get("id") ?? "").trim();
  const priority = String(formData.get("priority") ?? "").trim();
  if (!id || !isProductImprovementPriority(priority)) return;

  const supabase = createClient();
  await supabase
    .from("product_improvements")
    .update({ priority, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidateImprovements();
}

/** feedback → pilot_issues */
export async function promoteFeedbackToIssueAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireStaff("/admin/improvements");
  const feedbackId = String(formData.get("feedbackId") ?? "").trim();
  if (!feedbackId) return;

  const supabase = createClient();
  const { data: feedback } = await supabase
    .from("feedback")
    .select("id, type, message, priority, page")
    .eq("id", feedbackId)
    .maybeSingle();

  if (!feedback) return;

  const severityRaw = String(feedback.priority ?? "medium");
  const severity = isPilotIssueSeverity(severityRaw) ? severityRaw : "medium";

  await supabase.from("pilot_issues").insert({
    title: `[${feedback.type}] ${String(feedback.message).slice(0, 80)}`,
    description: `${feedback.message}\n\nСтраница: ${feedback.page || "/"}`,
    severity,
    status: "open",
    created_by: staff.user.id,
    source_type: "feedback",
    source_id: feedback.id,
  });

  revalidateImprovements();
}

/** pilot_issues → product_improvements */
export async function promoteIssueToImprovementAction(
  formData: FormData,
): Promise<void> {
  await requireStaff("/admin/improvements");
  const issueId = String(formData.get("issueId") ?? "").trim();
  if (!issueId) return;

  const supabase = createClient();
  const { data: issue } = await supabase
    .from("pilot_issues")
    .select("id, title, description, severity")
    .eq("id", issueId)
    .maybeSingle();

  if (!issue) return;

  await supabase.from("product_improvements").insert({
    title: issue.title,
    description: issue.description || "",
    source_type: "pilot_issue",
    source_id: issue.id,
    priority: priorityFromSeverity(issue.severity as string),
    status: "planned",
  });

  revalidateImprovements();
}

/** feedback → product_improvements (напрямую) */
export async function promoteFeedbackToImprovementAction(
  formData: FormData,
): Promise<void> {
  await requireStaff("/admin/improvements");
  const feedbackId = String(formData.get("feedbackId") ?? "").trim();
  if (!feedbackId) return;

  const supabase = createClient();
  const { data: feedback } = await supabase
    .from("feedback")
    .select("id, type, message, priority, page")
    .eq("id", feedbackId)
    .maybeSingle();

  if (!feedback) return;

  await supabase.from("product_improvements").insert({
    title: `[${feedback.type}] ${String(feedback.message).slice(0, 80)}`,
    description: `${feedback.message}\n\nСтраница: ${feedback.page || "/"}`,
    source_type: "feedback",
    source_id: feedback.id,
    priority: priorityFromFeedback(String(feedback.priority ?? "medium")),
    status: "planned",
  });

  revalidateImprovements();
}
