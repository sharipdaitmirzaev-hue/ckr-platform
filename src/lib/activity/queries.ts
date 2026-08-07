import { mapActivityFeedRow, type ActivityFeedItem } from "@/lib/activity/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ActivityFeedRow } from "@/types/database";

export async function listActivityFeed(
  userId: string,
  limit = 30,
): Promise<ActivityFeedItem[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_feed")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as ActivityFeedRow[]).map(mapActivityFeedRow);
}
