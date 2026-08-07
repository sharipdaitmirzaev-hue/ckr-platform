"use server";

import { isProductionLaunchDecision } from "@/config/production-go-live";
import { requireStaff } from "@/lib/auth/require-staff";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProductionActionState = {
  error?: string;
  success?: string;
};

function revalidateProduction() {
  revalidatePath("/admin/system-health");
}

export async function recordProductionLaunchDecisionAction(
  _prev: ProductionActionState,
  formData: FormData,
): Promise<ProductionActionState> {
  const staff = await requireStaff("/admin/system-health");
  const decision = String(formData.get("decision") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const responsible = String(formData.get("responsible") ?? "").trim();

  if (!isProductionLaunchDecision(decision)) {
    return { error: "Некорректное решение ProductionLaunchDecision." };
  }
  if (notes.length < 3) {
    return { error: "Укажите комментарий к решению (от 3 символов)." };
  }
  if (responsible.length < 2) {
    return { error: "Укажите ответственного (от 2 символов)." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("production_launch_decisions").insert({
    decision,
    notes,
    responsible_name: responsible,
    created_by: staff.user.id,
  });

  if (error) {
    return {
      error:
        error.message.includes("production_launch_decisions") ||
        error.code === "42P01"
          ? "Примените миграцию 20260325580000_production_go_live.sql"
          : error.message,
    };
  }

  revalidateProduction();
  return {
    success: "Решение ProductionLaunchDecision зафиксировано.",
  };
}
