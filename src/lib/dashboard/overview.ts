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

    const [
      projectsRes,
      outgoingApps,
      investmentsRes,
      dealsRes,
      unreadRes,
    ] = await Promise.all([
      supabase
        .from("projects")
        .select("id, title, status, updated_at")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false })
        .limit(5),
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
    ]);

    const projectIds = (projectsRes.data ?? []).map((item) => item.id);

    // Входящие заявки на проекты пользователя
    let applicationsIncoming = 0;
    if (projectIds.length > 0) {
      const { count } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("target_type", "project")
        .in("target_id", projectIds)
        .in("status", ["new", "reviewing"]);
      applicationsIncoming = count ?? 0;
    }

    let openMilestones = 0;
    if (projectIds.length > 0) {
      const { count } = await supabase
        .from("project_milestones")
        .select("id", { count: "exact", head: true })
        .in("project_id", projectIds)
        .neq("status", "completed");
      openMilestones = count ?? 0;
    }

    return {
      projects: (projectsRes.data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status as ProjectStatus,
        updatedAt: item.updated_at,
      })),
      applicationsIncoming,
      applicationsOutgoing: outgoingApps.count ?? 0,
      investments: investmentsRes.count ?? 0,
      deals: dealsRes.count ?? 0,
      openMilestones,
      unreadNotifications: unreadRes.count ?? 0,
    };
  } catch {
    return empty;
  }
}
