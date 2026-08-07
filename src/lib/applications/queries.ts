import { mapApplicationRow } from "@/lib/applications/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Application, ApplicationTargetType } from "@/types";
import type { ApplicationRow } from "@/types/database";

export type ApplicationListItem = Application & {
  fromUserName: string | null;
  targetTitle: string | null;
  direction: "incoming" | "outgoing";
  dealId: string | null;
  dealProjectId: string | null;
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

  if (targetType === "expert") {
    const { data } = await supabase
      .from("expert_profiles")
      .select("headline")
      .eq("id", targetId)
      .maybeSingle();
    return data?.headline ?? null;
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

  const applicationIds = data.map((row) => row.id as string);
  const dealByApplication = new Map<
    string,
    { id: string; projectId: string }
  >();

  if (applicationIds.length > 0) {
    const { data: deals } = await supabase
      .from("deals")
      .select("id, project_id, application_id")
      .in("application_id", applicationIds);

    for (const deal of deals ?? []) {
      if (!deal.application_id) continue;
      dealByApplication.set(deal.application_id as string, {
        id: deal.id as string,
        projectId: deal.project_id as string,
      });
    }
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
    const linkedDeal = dealByApplication.get(application.id) ?? null;

    const item: ApplicationListItem = {
      ...application,
      fromUserName: profiles?.full_name ?? null,
      targetTitle,
      direction:
        application.fromUserId === userId ? "outgoing" : "incoming",
      dealId: linkedDeal?.id ?? null,
      dealProjectId: linkedDeal?.projectId ?? null,
    };

    if (item.direction === "outgoing") {
      outgoing.push(item);
    } else {
      incoming.push(item);
    }
  }

  return { incoming, outgoing };
}

export { countUnreadNotifications } from "@/lib/notifications/queries";
