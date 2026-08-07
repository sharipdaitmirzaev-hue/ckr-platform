"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markNotificationReadAction(notificationId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Требуется вход." };

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/applications");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Требуется вход." };

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  // Fallback for rows without is_read column populated
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString(), is_read: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/applications");
  return { success: true };
}
