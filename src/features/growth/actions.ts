"use server";

import {
  isGrowthTaskStatus,
  isGrowthTaskType,
} from "@/config/growth";
import { requireStaff } from "@/lib/auth/require-staff";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type GrowthActionState = {
  error?: string;
  success?: string;
};

function revalidateGrowth() {
  revalidatePath("/admin/growth");
  revalidatePath("/admin/growth-kpi");
}

export async function createGrowthTaskAction(
  prev: GrowthActionState,
  formData: FormData,
): Promise<GrowthActionState> {
  void prev;
  const staff = await requireStaff("/admin/growth");
  const taskType = String(formData.get("taskType") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!isGrowthTaskType(taskType)) {
    return { error: "Некорректный тип задачи." };
  }
  if (title.length < 3) {
    return { error: "Укажите название задачи (от 3 символов)." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("growth_tasks").insert({
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
        error.message.includes("growth_tasks") || error.code === "42P01"
          ? "Примените миграцию 20260325550000_growth_engine.sql"
          : error.message,
    };
  }

  revalidateGrowth();
  return { success: "Задача GrowthTasks создана." };
}

export async function updateGrowthTaskStatusAction(
  formData: FormData,
): Promise<void> {
  await requireStaff("/admin/growth");
  const taskId = String(formData.get("taskId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!taskId || !isGrowthTaskStatus(status)) return;

  const supabase = createClient();
  await supabase
    .from("growth_tasks")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  revalidateGrowth();
}
