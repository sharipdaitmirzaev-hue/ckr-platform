import {
  PILOT_METRIC_TYPES,
  pilotMetricLabels,
  type PilotMetricType,
} from "@/config/pilot";
import {
  DEFAULT_PILOT_CHECKLIST_ITEMS,
  type PilotParticipantRole,
  type PilotParticipantStatus,
} from "@/config/pilot-operations";
import { mapFeedbackRow } from "@/lib/beta/mappers";
import { mapPilotIssueRow } from "@/lib/pilot/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  Feedback,
  PilotChecklistItem,
  PilotIssue,
  PilotParticipantRecord,
  ProjectStage,
} from "@/types";
import type {
  FeedbackRow,
  PilotChecklistRow,
  PilotIssueRow,
  PilotParticipantRow,
} from "@/types/database";

export type PilotMetricCount = {
  key: PilotMetricType;
  label: string;
  value: number;
};

export type PilotLegacyParticipant = {
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

export type PilotFunnel = {
  registration: number;
  profile: number;
  project: number;
  activity: number;
  application: number;
  deal: number;
};

export type PilotUsageStats = {
  lia: number;
  projects: number;
  crmApplications: number;
  crmDeals: number;
  workspace: number;
  messages: number;
};

export type PilotOpsStats = {
  participants: {
    invited: number;
    registered: number;
    profileComplete: number;
    active: number;
    byRole: Record<PilotParticipantRole, number>;
    byStatus: Record<PilotParticipantStatus, number>;
    records: PilotParticipantRecord[];
  };
  projects: {
    created: number;
    active: number;
    inactive: number;
    byStage: Record<ProjectStage, number>;
  };
  activity: {
    lia: number;
    applications: number;
    deals: number;
    messages: number;
    workspaceActions: number;
  };
  funnel: PilotFunnel;
  usage: PilotUsageStats;
  checklistProgress: {
    total: number;
    done: number;
    percent: number;
  };
  feedbackByType: Record<string, number>;
  feedbackByPriority: Record<string, number>;
  tinda: {
    projectId: string;
    title: string;
    stage: string;
    status: string;
  } | null;
};

export type PilotDashboardData = {
  participants: PilotLegacyParticipant[];
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
  ops: PilotOpsStats;
};

function emptyRoleCounts(): Record<PilotParticipantRole, number> {
  return {
    entrepreneur: 0,
    investor: 0,
    expert: 0,
    organization: 0,
    operator: 0,
  };
}

function emptyStatusCounts(): Record<PilotParticipantStatus, number> {
  return {
    invited: 0,
    active: 0,
    inactive: 0,
    completed: 0,
  };
}

function emptyStageCounts(): Record<ProjectStage, number> {
  return {
    idea: 0,
    startup: 0,
    operating: 0,
    expansion: 0,
  };
}

function emptyOps(): PilotOpsStats {
  return {
    participants: {
      invited: 0,
      registered: 0,
      profileComplete: 0,
      active: 0,
      byRole: emptyRoleCounts(),
      byStatus: emptyStatusCounts(),
      records: [],
    },
    projects: {
      created: 0,
      active: 0,
      inactive: 0,
      byStage: emptyStageCounts(),
    },
    activity: {
      lia: 0,
      applications: 0,
      deals: 0,
      messages: 0,
      workspaceActions: 0,
    },
    funnel: {
      registration: 0,
      profile: 0,
      project: 0,
      activity: 0,
      application: 0,
      deal: 0,
    },
    usage: {
      lia: 0,
      projects: 0,
      crmApplications: 0,
      crmDeals: 0,
      workspace: 0,
      messages: 0,
    },
    checklistProgress: { total: 0, done: 0, percent: 0 },
    feedbackByType: {},
    feedbackByPriority: {},
    tinda: null,
  };
}

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
    ops: emptyOps(),
  };
}

function mapParticipantRow(
  row: PilotParticipantRow,
  profile?: { full_name: string | null } | null,
): PilotParticipantRecord {
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fullName: profile?.full_name ?? null,
  };
}

export async function getPilotDashboard(): Promise<PilotDashboardData> {
  if (!hasSupabaseEnv()) return emptyDashboard();

  try {
    const supabase = createClient();
    const cutoffIso = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [
      profilesRes,
      rolesRes,
      invitesRes,
      projectsRes,
      allProjectsRes,
      applicationsRes,
      dealsRes,
      liaRes,
      eventsRes,
      feedbackRes,
      issuesRes,
      participantsRes,
      checklistRes,
      messagesRes,
      activityRes,
      appsListRes,
      tindaRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase.from("user_roles").select("user_id, role"),
      supabase
        .from("beta_invites")
        .select("used_by, email, status")
        .in("status", ["created", "sent", "used"]),
      supabase
        .from("projects")
        .select(
          "id, title, status, updated_at, owner:owner_id ( full_name )",
        )
        .in("status", ["published", "active", "moderation"])
        .order("updated_at", { ascending: false })
        .limit(20),
      supabase
        .from("projects")
        .select("id, owner_id, stage, status, updated_at, created_at"),
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
        .limit(40),
      supabase
        .from("pilot_issues")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("pilot_participants")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("pilot_checklists").select("id, status"),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase
        .from("project_activity")
        .select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id, project_id").limit(500),
      supabase
        .from("projects")
        .select("id, title, stage, status")
        .ilike("title", "%ТИНДА%")
        .limit(1)
        .maybeSingle(),
    ]);

    const inviteEmailByUser = new Map<string, string>();
    let invitedCount = 0;
    for (const row of invitesRes.data ?? []) {
      const status = row.status as string;
      if (status === "created" || status === "sent") invitedCount += 1;
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

    const participants: PilotLegacyParticipant[] = (profilesRes.data ?? [])
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
    const profileCompleteUsers = new Set<string>();
    const activeEventUsers = new Set<string>();

    for (const row of eventsRes.data ?? []) {
      const eventType = row.event_type as string;
      const userId = (row.user_id as string | null) ?? null;
      if ((PILOT_METRIC_TYPES as readonly string[]).includes(eventType)) {
        const key = eventType as PilotMetricType;
        metricCounts.set(key, (metricCounts.get(key) ?? 0) + 1);
      }
      if (eventType === "profile_completed" && userId) {
        profileCompleteUsers.add(userId);
      }
      if (userId && (row.created_at as string) >= cutoffIso) {
        activeEventUsers.add(userId);
      }
      if (recentActivity.length < 20) {
        recentActivity.push({
          id: row.id as string,
          eventType,
          userId,
          entityType: (row.entity_type as string | null) ?? null,
          entityId: (row.entity_id as string | null) ?? null,
          createdAt: row.created_at as string,
        });
      }
    }

    const participantRows = (participantsRes.data ??
      []) as PilotParticipantRow[];
    const profileNameById = new Map(
      (profilesRes.data ?? []).map((p) => [
        p.id as string,
        { full_name: (p.full_name as string | null) ?? null },
      ]),
    );
    const byRole = emptyRoleCounts();
    const byStatus = emptyStatusCounts();
    const participantRecords = participantRows.map((row) => {
      byRole[row.role] = (byRole[row.role] ?? 0) + 1;
      byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
      return mapParticipantRow(
        row,
        row.user_id ? profileNameById.get(row.user_id) : null,
      );
    });

    const allProjects = allProjectsRes.data ?? [];
    const byStage = emptyStageCounts();
    let activeProjectCount = 0;
    let inactiveProjectCount = 0;
    const ownersWithProjects = new Set<string>();

    for (const project of allProjects) {
      const stage = project.stage as ProjectStage;
      if (stage in byStage) byStage[stage] += 1;
      ownersWithProjects.add(project.owner_id as string);
      if (
        project.status === "active" ||
        project.status === "published" ||
        project.status === "moderation"
      ) {
        activeProjectCount += 1;
        if ((project.updated_at as string) < cutoffIso) {
          inactiveProjectCount += 1;
        }
      }
    }

    const apps = appsListRes.data ?? [];
    const appProjectIds = new Set(
      apps.map((a) => a.project_id as string).filter(Boolean),
    );
    const projectsWithApps = allProjects.filter((p) =>
      appProjectIds.has(p.id as string),
    ).length;

    const checklistRows = checklistRes.data ?? [];
    const checklistDone = checklistRows.filter(
      (c) => c.status === "done",
    ).length;

    const feedbackRows = (feedbackRes.data ?? []) as FeedbackRow[];
    const feedbackByType: Record<string, number> = {};
    const feedbackByPriority: Record<string, number> = {};
    for (const f of feedbackRows) {
      feedbackByType[f.type] = (feedbackByType[f.type] ?? 0) + 1;
      const priority = f.priority ?? "medium";
      feedbackByPriority[priority] = (feedbackByPriority[priority] ?? 0) + 1;
    }

    const liaCount = liaRes.count ?? 0;
    const appCount = applicationsRes.count ?? 0;
    const dealCount = dealsRes.count ?? 0;
    const msgCount = messagesRes.count ?? 0;
    const workspaceCount = activityRes.count ?? 0;
    const registeredCount =
      (profilesRes.data ?? []).filter((profile) => {
        const roles = rolesByUser.get(profile.id as string) ?? [];
        return !roles.includes("admin");
      }).length || (profilesRes.data ?? []).length;

    const profileComplete =
      profileCompleteUsers.size ||
      (metricCounts.get("profile_completed") ?? 0);

    const activeParticipants =
      byStatus.active ||
      activeEventUsers.size ||
      participantRecords.filter((p) => p.status === "active").length;

    const ops: PilotOpsStats = {
      participants: {
        invited: byStatus.invited || invitedCount,
        registered: registeredCount,
        profileComplete,
        active: activeParticipants,
        byRole,
        byStatus,
        records: participantRecords,
      },
      projects: {
        created: allProjects.length,
        active: activeProjectCount,
        inactive: inactiveProjectCount,
        byStage,
      },
      activity: {
        lia: liaCount,
        applications: appCount,
        deals: dealCount,
        messages: msgCount,
        workspaceActions: workspaceCount,
      },
      funnel: {
        registration: registeredCount,
        profile: profileComplete,
        project: ownersWithProjects.size,
        activity: activeEventUsers.size || activeParticipants,
        application: projectsWithApps || appCount,
        deal: dealCount,
      },
      usage: {
        lia: liaCount,
        projects: allProjects.length,
        crmApplications: appCount,
        crmDeals: dealCount,
        workspace: workspaceCount,
        messages: msgCount,
      },
      checklistProgress: {
        total: checklistRows.length,
        done: checklistDone,
        percent: checklistRows.length
          ? Math.round((checklistDone / checklistRows.length) * 100)
          : 0,
      },
      feedbackByType,
      feedbackByPriority,
      tinda: tindaRes.data
        ? {
            projectId: tindaRes.data.id as string,
            title: tindaRes.data.title as string,
            stage: tindaRes.data.stage as string,
            status: tindaRes.data.status as string,
          }
        : null,
    };

    return {
      participants,
      participantCount: participants.length,
      activeProjects,
      applicationsCount: appCount,
      dealsCount: dealCount,
      liaSessionsCount: liaCount,
      metrics: PILOT_METRIC_TYPES.map((key) => ({
        key,
        label: pilotMetricLabels[key],
        value: metricCounts.get(key) ?? 0,
      })),
      recentActivity,
      recentFeedback: feedbackRows.slice(0, 15).map(mapFeedbackRow),
      issues: ((issuesRes.data ?? []) as PilotIssueRow[]).map(mapPilotIssueRow),
      ops,
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

export async function listPilotChecklists(
  participantId?: string,
): Promise<PilotChecklistItem[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    let query = supabase
      .from("pilot_checklists")
      .select("*")
      .order("created_at", { ascending: true });
    if (participantId) query = query.eq("participant_id", participantId);
    const { data, error } = await query;
    if (error || !data) return [];
    return (data as PilotChecklistRow[]).map((row) => ({
      id: row.id,
      participantId: row.participant_id,
      item: row.item,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch {
    return [];
  }
}

export function defaultChecklistItems(): string[] {
  return [...DEFAULT_PILOT_CHECKLIST_ITEMS];
}
