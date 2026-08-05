import { mapApplicationRow } from "@/lib/applications/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Application, ApplicationTargetType } from "@/types";
import type { ApplicationRow } from "@/types/database";

export type ApplicationListItem = Application & {
  fromUserName: string | null;
  targetTitle: string | null;
  direction: "incoming" | "outgoing";
};

async function resolveTargetTitle(
  supabase: ReturnType<typeof createClient>,
  targetType: ApplicationTargetType,
  targetId: string,
) {
  if (targetType === "project") {
    const { data } = await supabase
      .from("projects")
      .select("title")
      .eq("id", targetId)
      .maybeSingle();
    return data?.title ?? null;
  }

  if (targetType === "opportunity") {
    const { data } = await supabase
      .from("opportunities")
      .select("title")
      .eq("id", targetId)
      .maybeSingle();
    return data?.title ?? null;
  }

  if (targetType === "investment") {
    const { data } = await supabase
      .from("investment_offers")
      .select("title")
      .eq("id", targetId)
      .maybeSingle();
    return data?.title ?? null;
  }

  return null;
}

export async function listMyApplications(userId: string): Promise<{
  incoming: ApplicationListItem[];
  outgoing: ApplicationListItem[];
}> {
  if (!hasSupabaseEnv()) {
    return { incoming: [], outgoing: [] };
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("applications")
    .select("*, profiles:from_user_id ( full_name )")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { incoming: [], outgoing: [] };
  }

  const incoming: ApplicationListItem[] = [];
  const outgoing: ApplicationListItem[] = [];

  for (const row of data) {
    const application = mapApplicationRow(row as ApplicationRow);
    const profiles = row.profiles as { full_name: string | null } | null;
    const targetTitle = await resolveTargetTitle(
      supabase,
      application.targetType,
      application.targetId,
    );

    const item: ApplicationListItem = {
      ...application,
      fromUserName: profiles?.full_name ?? null,
      targetTitle,
      direction:
        application.fromUserId === userId ? "outgoing" : "incoming",
    };

    if (item.direction === "outgoing") {
      outgoing.push(item);
    } else {
      incoming.push(item);
    }
  }

  return { incoming, outgoing };
}

export async function countUnreadNotifications(userId: string) {
  if (!hasSupabaseEnv()) return 0;

  const supabase = createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}
