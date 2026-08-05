import {
  PILOT_METRIC_TYPES,
  pilotMetricLabels,
  type PilotMetricType,
} from "@/config/pilot";
import { mapFeedbackRow } from "@/lib/beta/mappers";
import { mapPilotIssueRow } from "@/lib/pilot/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Feedback, PilotIssue } from "@/types";
import type { FeedbackRow, PilotIssueRow } from "@/types/database";

export type PilotMetricCount = {
  key: PilotMetricType;
  label: string;
  value: number;
};

export type PilotParticipant = {
  id: string;
  fullName: string | null;
  email: string | null;
  roles: string[];
  createdAt: string;
  inviteUsed: boolean;
};

export type PilotActivityItem = {
  id: string;
  eventType: string;
  userId: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
};

export type PilotDashboardData = {
  participants: PilotParticipant[];
  participantCount: number;
  activeProjects: Array<{
    id: string;
    title: string;
    status: string;
    ownerName: string | null;
    updatedAt: string;
  }>;
  applicationsCount: number;
  dealsCount: number;
  liaSessionsCount: number;
  metrics: PilotMetricCount[];
  recentActivity: PilotActivityItem[];
  recentFeedback: Feedback[];
  issues: PilotIssue[];
};

function emptyDashboard(): PilotDashboardData {
  return {
    participants: [],
    participantCount: 0,
    activeProjects: [],
    applicationsCount: 0,
    dealsCount: 0,
    liaSessionsCount: 0,
    metrics: PILOT_METRIC_TYPES.map((key) => ({
      key,
      label: pilotMetricLabels[key],
      value: 0,
    })),
    recentActivity: [],
    recentFeedback: [],
    issues: [],
  };
}

export async function getPilotDashboard(): Promise<PilotDashboardData> {
  if (!hasSupabaseEnv()) return emptyDashboard();

  try {
    const supabase = createClient();

    const [
      profilesRes,
      rolesRes,
      invitesRes,
      projectsRes,
      applicationsRes,
      dealsRes,
      liaRes,
      eventsRes,
      feedbackRes,
      issuesRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase.from("user_roles").select("user_id, role"),
      supabase
        .from("beta_invites")
        .select("used_by, email")
        .eq("status", "used")
        .not("used_by", "is", null),
      supabase
        .from("projects")
        .select(
          "id, title, status, updated_at, owner:owner_id ( full_name )",
        )
        .in("status", ["published", "active", "moderation"])
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }),
      supabase
        .from("lia_sessions")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("analytics_events")
        .select("id, event_type, user_id, entity_type, entity_id, created_at")
        .in("event_type", [...PILOT_METRIC_TYPES])
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("pilot_issues")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    const inviteEmailByUser = new Map<string, string>();
    for (const row of invitesRes.data ?? []) {
      const usedBy = row.used_by as string | null;
      if (usedBy) {
        inviteEmailByUser.set(usedBy, (row.email as string) || "");
      }
    }

    const rolesByUser = new Map<string, string[]>();
    for (const row of rolesRes.data ?? []) {
      const userId = row.user_id as string;
      const list = rolesByUser.get(userId) ?? [];
      list.push(row.role as string);
      rolesByUser.set(userId, list);
    }

    const participants: PilotParticipant[] = (profilesRes.data ?? [])
      .filter((profile) => {
        const roles = rolesByUser.get(profile.id as string) ?? [];
        return !roles.includes("admin");
      })
      .slice(0, 40)
      .map((profile) => ({
        id: profile.id as string,
        fullName: (profile.full_name as string | null) ?? null,
        email: inviteEmailByUser.get(profile.id as string) || null,
        roles: rolesByUser.get(profile.id as string) ?? [],
        createdAt: profile.created_at as string,
        inviteUsed: inviteEmailByUser.has(profile.id as string),
      }));

    const activeProjects = (projectsRes.data ?? []).map((row) => {
      const project = row as {
        id: string;
        title: string;
        status: string;
        updated_at: string;
        owner?:
          | { full_name: string | null }
          | { full_name: string | null }[]
          | null;
      };
      const ownerRaw = project.owner;
      const owner = Array.isArray(ownerRaw) ? ownerRaw[0] : ownerRaw;
      return {
        id: project.id,
        title: project.title,
        status: project.status,
        ownerName: owner?.full_name ?? null,
        updatedAt: project.updated_at,
      };
    });

    const metricCounts = new Map<PilotMetricType, number>();
    for (const key of PILOT_METRIC_TYPES) metricCounts.set(key, 0);

    const recentActivity: PilotActivityItem[] = [];
    for (const row of eventsRes.data ?? []) {
      const eventType = row.event_type as string;
      if ((PILOT_METRIC_TYPES as readonly string[]).includes(eventType)) {
        const key = eventType as PilotMetricType;
        metricCounts.set(key, (metricCounts.get(key) ?? 0) + 1);
      }
      if (recentActivity.length < 20) {
        recentActivity.push({
          id: row.id as string,
          eventType,
          userId: (row.user_id as string | null) ?? null,
          entityType: (row.entity_type as string | null) ?? null,
          entityId: (row.entity_id as string | null) ?? null,
          createdAt: row.created_at as string,
        });
      }
    }

    return {
      participants,
      participantCount: participants.length,
      activeProjects,
      applicationsCount: applicationsRes.count ?? 0,
      dealsCount: dealsRes.count ?? 0,
      liaSessionsCount: liaRes.count ?? 0,
      metrics: PILOT_METRIC_TYPES.map((key) => ({
        key,
        label: pilotMetricLabels[key],
        value: metricCounts.get(key) ?? 0,
      })),
      recentActivity,
      recentFeedback: ((feedbackRes.data ?? []) as FeedbackRow[]).map(
        mapFeedbackRow,
      ),
      issues: ((issuesRes.data ?? []) as PilotIssueRow[]).map(mapPilotIssueRow),
    };
  } catch {
    return emptyDashboard();
  }
}

export async function listPilotIssues(limit = 50): Promise<PilotIssue[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("pilot_issues")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as PilotIssueRow[]).map(mapPilotIssueRow);
  } catch {
    return [];
  }
}
