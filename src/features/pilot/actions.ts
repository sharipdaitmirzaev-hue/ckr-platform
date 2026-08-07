"use server";

import {
  isPilotIssueSeverity,
  isPilotIssueStatus,
} from "@/config/pilot";
import {
  DEFAULT_PILOT_CHECKLIST_ITEMS,
  PILOT_CHECKLIST_STATUSES,
  PILOT_PARTICIPANT_ROLES,
  PILOT_PARTICIPANT_STATUSES,
  type PilotChecklistStatus,
  type PilotParticipantRole,
  type PilotParticipantStatus,
} from "@/config/pilot-operations";
import { requireStaff } from "@/lib/auth/require-staff";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PilotActionState = {
  error?: string;
  success?: string;
};

function revalidatePilot() {
  revalidatePath("/admin/pilot");
  revalidatePath("/admin/pilot/report");
}

function isParticipantRole(value: string): value is PilotParticipantRole {
  return (PILOT_PARTICIPANT_ROLES as readonly string[]).includes(value);
}

function isParticipantStatus(value: string): value is PilotParticipantStatus {
  return (PILOT_PARTICIPANT_STATUSES as readonly string[]).includes(value);
}

function isChecklistStatus(value: string): value is PilotChecklistStatus {
  return (PILOT_CHECKLIST_STATUSES as readonly string[]).includes(value);
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

export async function createPilotParticipantAction(
  _prev: PilotActionState,
  formData: FormData,
): Promise<PilotActionState> {
  await requireStaff("/admin/pilot");
  const userIdRaw = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "entrepreneur");
  const status = String(formData.get("status") ?? "invited");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!isParticipantRole(role)) {
    return { error: "Некорректная роль участника." };
  }
  if (!isParticipantStatus(status)) {
    return { error: "Некорректный статус участника." };
  }

  const userId = userIdRaw || null;
  if (
    userId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      userId,
    )
  ) {
    return { error: "User ID должен быть UUID." };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("pilot_participants")
    .insert({
      user_id: userId,
      role,
      status,
      notes,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Не удалось создать участника." };
  }

  const checklistRows = DEFAULT_PILOT_CHECKLIST_ITEMS.map((item) => ({
    participant_id: data.id as string,
    item,
    status: "pending" as const,
  }));
  await supabase.from("pilot_checklists").insert(checklistRows);

  revalidatePilot();
  return { success: "Участник добавлен, чеклист создан." };
}

export async function updatePilotParticipantStatusAction(
  formData: FormData,
): Promise<void> {
  await requireStaff("/admin/pilot");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !isParticipantStatus(status)) return;

  const supabase = createClient();
  await supabase
    .from("pilot_participants")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePilot();
}

export async function updatePilotChecklistStatusAction(
  formData: FormData,
): Promise<void> {
  await requireStaff("/admin/pilot");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !isChecklistStatus(status)) return;

  const supabase = createClient();
  await supabase
    .from("pilot_checklists")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePilot();
}
