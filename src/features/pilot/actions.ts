"use server";

import {
  isPilotIssueSeverity,
  isPilotIssueStatus,
} from "@/config/pilot";
import { requireStaff } from "@/lib/auth/require-staff";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PilotActionState = {
  error?: string;
  success?: string;
};

function revalidatePilot() {
  revalidatePath("/admin/pilot");
}

export async function createPilotIssueAction(
  _prev: PilotActionState,
  formData: FormData,
): Promise<PilotActionState> {
  const staff = await requireStaff("/admin/pilot");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const severity = String(formData.get("severity") ?? "medium");
  const status = String(formData.get("status") ?? "open");

  if (title.length < 3) {
    return { error: "Укажите заголовок (от 3 символов)." };
  }
  if (!isPilotIssueSeverity(severity)) {
    return { error: "Некорректный severity." };
  }
  if (!isPilotIssueStatus(status)) {
    return { error: "Некорректный статус." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("pilot_issues").insert({
    title,
    description,
    severity,
    status,
    created_by: staff.user.id,
  });

  if (error) return { error: error.message };

  revalidatePilot();
  return { success: "Проблема добавлена." };
}

export async function updatePilotIssueStatusAction(
  formData: FormData,
): Promise<void> {
  await requireStaff("/admin/pilot");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !isPilotIssueStatus(status)) return;

  const supabase = createClient();
  await supabase
    .from("pilot_issues")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePilot();
}
