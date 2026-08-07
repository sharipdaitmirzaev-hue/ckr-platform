import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/types";

export type DashboardOverview = {
  projects: Array<{
    id: string;
    title: string;
    status: ProjectStatus;
    updatedAt: string;
  }>;
  applicationsIncoming: number;
  applicationsOutgoing: number;
  investments: number;
  deals: number;
  openMilestones: number;
  unreadNotifications: number;
};

export async function getDashboardOverview(
  userId: string,
): Promise<DashboardOverview> {
  const empty: DashboardOverview = {
    projects: [],
    applicationsIncoming: 0,
    applicationsOutgoing: 0,
    investments: 0,
    deals: 0,
    openMilestones: 0,
    unreadNotifications: 0,
  };

  if (!hasSupabaseEnv() || !userId) return empty;

  try {
    const supabase = createClient();

    // Все id проектов пользователя — для корректных счётчиков (не только top-5)
    const { data: allProjectRows } = await supabase
      .from("projects")
      .select("id, title, status, updated_at")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    const allProjects = allProjectRows ?? [];
    const projectIds = allProjects.map((item) => item.id);
    const preview = allProjects.slice(0, 5);

    const [
      outgoingApps,
      investmentsRes,
      dealsRes,
      unreadRes,
      incomingApps,
      openMilestonesRes,
    ] = await Promise.all([
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("from_user_id", userId),
      supabase
        .from("investment_offers")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .or(`initiator_id.eq.${userId},partner_id.eq.${userId}`),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false),
      projectIds.length
        ? supabase
            .from("applications")
            .select("id", { count: "exact", head: true })
            .eq("target_type", "project")
            .in("target_id", projectIds)
            .in("status", ["new", "reviewing"])
        : Promise.resolve({ count: 0 }),
      projectIds.length
        ? supabase
            .from("project_milestones")
            .select("id", { count: "exact", head: true })
            .in("project_id", projectIds)
            .neq("status", "completed")
        : Promise.resolve({ count: 0 }),
    ]);

    return {
      projects: preview.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status as ProjectStatus,
        updatedAt: item.updated_at,
      })),
      applicationsIncoming: incomingApps.count ?? 0,
      applicationsOutgoing: outgoingApps.count ?? 0,
      investments: investmentsRes.count ?? 0,
      deals: dealsRes.count ?? 0,
      openMilestones: openMilestonesRes.count ?? 0,
      unreadNotifications: unreadRes.count ?? 0,
    };
  } catch {
    return empty;
  }
}
