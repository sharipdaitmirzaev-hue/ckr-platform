import {
  mapActivityRow,
  mapDealParticipantRow,
  mapDealRow,
  mapMilestoneRow,
} from "@/lib/deals/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  Deal,
  DealParticipant,
  ProjectActivity,
  ProjectMilestone,
} from "@/types";
import type {
  DealParticipantRow,
  DealRow,
  ProjectActivityRow,
  ProjectMilestoneRow,
} from "@/types/database";

export type DealWithNames = Deal & {
  initiatorName: string | null;
  partnerName: string | null;
};

export type ParticipantWithName = DealParticipant & {
  fullName: string | null;
  dealId: string;
};

export type ActivityWithActor = ProjectActivity & {
  actorName: string | null;
};

export async function listDealsForProject(
  projectId: string,
): Promise<DealWithNames[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(
      "*, initiator:initiator_id ( full_name ), partner:partner_id ( full_name )",
    )
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const deal = mapDealRow(row as DealRow);
    const initiator = row.initiator as { full_name: string | null } | null;
    const partner = row.partner as { full_name: string | null } | null;
    return {
      ...deal,
      initiatorName: initiator?.full_name ?? null,
      partnerName: partner?.full_name ?? null,
    };
  });
}

export async function listParticipantsForProject(
  projectId: string,
): Promise<ParticipantWithName[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data: deals } = await supabase
    .from("deals")
    .select("id")
    .eq("project_id", projectId);

  const dealIds = (deals ?? []).map((d) => d.id as string);
  if (dealIds.length === 0) return [];

  const { data, error } = await supabase
    .from("deal_participants")
    .select("*, profiles:user_id ( full_name )")
    .in("deal_id", dealIds)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const participant = mapDealParticipantRow(row as DealParticipantRow);
    const profiles = row.profiles as
      | { full_name: string | null }
      | { full_name: string | null }[]
      | null;
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    return {
      ...participant,
      fullName: profile?.full_name ?? null,
    };
  });
}

export async function listMilestonesForProject(
  projectId: string,
): Promise<ProjectMilestone[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as ProjectMilestoneRow[]).map(mapMilestoneRow);
}

export async function listActivityForProject(
  projectId: string,
  limit = 40,
): Promise<ActivityWithActor[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_activity")
    .select("*, profiles:actor_id ( full_name )")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const activity = mapActivityRow(row as ProjectActivityRow);
    const profiles = row.profiles as
      | { full_name: string | null }
      | { full_name: string | null }[]
      | null;
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;
    return {
      ...activity,
      actorName: profile?.full_name ?? null,
    };
  });
}

export async function canAccessProjectWorkspace(
  projectId: string,
  userId: string,
): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  const supabase = createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return false;
  if (project.owner_id === userId) return true;

  const { data: deals } = await supabase
    .from("deals")
    .select("id, initiator_id, partner_id")
    .eq("project_id", projectId);

  if ((deals ?? []).some(
    (d) => d.initiator_id === userId || d.partner_id === userId,
  )) {
    return true;
  }

  const dealIds = (deals ?? []).map((d) => d.id as string);
  if (dealIds.length === 0) return false;

  const { data: parts } = await supabase
    .from("deal_participants")
    .select("id")
    .in("deal_id", dealIds)
    .eq("user_id", userId)
    .limit(1);

  return Boolean(parts && parts.length > 0);
}
