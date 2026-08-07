"use server";

import { isDealRevenueStatus } from "@/config/revenue";
import { requireStaff } from "@/lib/auth/require-staff";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateDealRevenueStatusAction(
  formData: FormData,
): Promise<void> {
  await requireStaff("/admin/revenue");
  const dealId = String(formData.get("dealId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const status = String(formData.get("revenueStatus") ?? "").trim();
  if (!dealId || !isDealRevenueStatus(status)) return;

  const supabase = createClient();
  const { error } = await supabase
    .from("deals")
    .update({
      revenue_status: status,
      updated_at: new Date().toISOString(),
      ...(status === "paid"
        ? { commission_status: "paid" as const }
        : status === "cancelled"
          ? { commission_status: "cancelled" as const }
          : {}),
    })
    .eq("id", dealId);

  if (error && (error.message.includes("revenue_status") || error.code === "42P01")) {
    // миграция ещё не применена — тихо
    return;
  }

  revalidatePath("/admin/revenue");
  revalidatePath("/admin/revenue-kpi");
  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}/workspace`);
  }
}
