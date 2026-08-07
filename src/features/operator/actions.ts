"use server";

import {
  isOperatorRole,
  isTaskPriority,
  isTaskRelatedType,
  isTaskStatus,
} from "@/config/operator";
import { requireOperator } from "@/lib/auth/require-operator";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type OperatorActionState = {
  error?: string;
  success?: string;
};

function revalidateOperator() {
  revalidatePath("/operator");
  revalidatePath("/operator/tasks");
}

export async function createOperatorTaskAction(
  _prev: OperatorActionState,
  formData: FormData,
): Promise<OperatorActionState> {
  const operator = await requireOperator();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium");
  const status = String(formData.get("status") ?? "new");
  const relatedTypeRaw = String(formData.get("relatedType") ?? "").trim();
  const relatedId = String(formData.get("relatedId") ?? "").trim() || null;
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();
  const assignedTo =
    String(formData.get("assignedTo") ?? "").trim() || operator.user.id;

  if (title.length < 3) return { error: "Укажите название задачи." };
  if (!isTaskPriority(priority)) return { error: "Некорректный приоритет." };
  if (!isTaskStatus(status)) return { error: "Некорректный статус." };

  const relatedType =
    relatedTypeRaw && isTaskRelatedType(relatedTypeRaw)
      ? relatedTypeRaw
      : null;

  if (relatedTypeRaw && !relatedType) {
    return { error: "Некорректный тип связи." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("tasks").insert({
    title,
    description,
    priority,
    status,
    assigned_to: assignedTo,
    related_type: relatedType,
    related_id: relatedId,
    deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : null,
    created_by: operator.user.id,
  });

  if (error) return { error: error.message };
  revalidateOperator();
  return { success: "Задача создана." };
}

export async function updateOperatorTaskStatusAction(
  formData: FormData,
): Promise<void> {
  await requireOperator();
  const id = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isTaskStatus(status)) return;

  const supabase = createClient();
  await supabase.from("tasks").update({ status }).eq("id", id);
  revalidateOperator();
}

export async function assignOperatorRoleAction(
  _prev: OperatorActionState,
  formData: FormData,
): Promise<OperatorActionState> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const role = String(formData.get("role") ?? "analyst");

  if (!userId) return { error: "Укажите user id." };
  if (!isOperatorRole(role)) return { error: "Некорректная роль оператора." };

  const supabase = createClient();
  const { error } = await supabase.from("operator_roles").upsert(
    {
      user_id: userId,
      role,
      active: true,
    },
    { onConflict: "user_id,role" },
  );

  if (error) return { error: error.message };
  revalidateOperator();
  revalidatePath("/admin/users");
  return { success: "Роль оператора назначена." };
}
