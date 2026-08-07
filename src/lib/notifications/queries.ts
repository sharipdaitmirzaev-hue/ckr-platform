import { mapNotificationRow, type AppNotification } from "@/lib/notifications/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { NotificationRow } from "@/types/database";

export async function listNotifications(
  userId: string,
  limit = 40,
): Promise<AppNotification[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as NotificationRow[]).map(mapNotificationRow);
}

export async function countUnreadNotifications(userId: string) {
  if (!hasSupabaseEnv()) return 0;
  const supabase = createClient();

  const { count: byFlag } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (typeof byFlag === "number") return byFlag;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}
