"use server";

import { requireStaff } from "@/lib/auth/require-staff";
import { isCkrAccessLevel } from "@/config/idea-first";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Owner sets progressive cabinet access for a user. */
export async function setUserCabinetAccessAction(
  formData: FormData,
): Promise<void> {
  await requireStaff();
  const userId = String(formData.get("userId") ?? "").trim();
  const level = String(formData.get("accessLevel") ?? "").trim();
  if (!userId || !isCkrAccessLevel(level)) {
    throw new Error("Некорректные данные доступа");
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ ckr_access_level: level })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/owner/inbox");
  revalidatePath("/dashboard");
}
