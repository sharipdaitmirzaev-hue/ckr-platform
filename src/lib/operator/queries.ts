import { OPEN_TASK_STATUSES } from "@/config/operator";
import { mapSlaRuleRow, mapTaskRow } from "@/lib/operator/mappers";
import { buildOperatorInsights } from "@/lib/operator/insights";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  OperatorActivityItem,
  OperatorQueueItem,
  OperatorTask,
  SlaRule,
} from "@/types";
import type {
  ApplicationRow,
  DealRow,
  DocumentRow,
  LeadRow,
  ProjectRow,
  SlaRuleRow,
  TaskRow,
  VerificationRequestRow,
} from "@/types/database";

export type OperatorStatsData = {
  newLeads: number;
  newProjects: number;
  unansweredApplications: number;
  pendingDeals: number;
  documentsPending: number;
  openTasks: number;
};

function hoursSince(iso?: string | null) {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export async function listOperatorTasks(limit = 100): Promise<OperatorTask[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*, profiles:assigned_to(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => {
      const task = row as TaskRow & {
        profiles?: { full_name: string } | null;
      };
      return mapTaskRow(task, {
        assigneeName: task.profiles?.full_name,
      });
    });
  } catch {
    return [];
  }
}

export async function listOpenOperatorTasks(
  limit = 50,
): Promise<OperatorTask[]> {
  const tasks = await listOperatorTasks(limit * 2);
  return tasks
    .filter((task) => OPEN_TASK_STATUSES.includes(task.status))
    .slice(0, limit);
}

export async function listSlaRules(): Promise<SlaRule[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sla_rules")
      .select("*")
      .order("entity_type", { ascending: true });
    if (error || !data) return [];
    return (data as SlaRuleRow[]).map(mapSlaRuleRow);
  } catch {
    return [];
  }
}

export async function getOperatorStats(): Promise<OperatorStatsData> {
  const empty: OperatorStatsData = {
    newLeads: 0,
    newProjects: 0,
    unansweredApplications: 0,
    pendingDeals: 0,
    documentsPending: 0,
    openTasks: 0,
  };
  if (!hasSupabaseEnv()) return empty;

  try {
    const supabase = createClient();
    const [
      newLeads,
      newProjects,
      unansweredApplications,
      pendingDeals,
      documentsPending,
      openTasks,
    ] = await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("stage", "new"),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .in("status", ["moderation", "draft"]),
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .in("status", ["negotiation", "agreement", "draft"]),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .in("status", OPEN_TASK_STATUSES),
    ]);

    return {
      newLeads: newLeads.count ?? 0,
      newProjects: newProjects.count ?? 0,
      unansweredApplications: unansweredApplications.count ?? 0,
      pendingDeals: pendingDeals.count ?? 0,
      documentsPending: documentsPending.count ?? 0,
      openTasks: openTasks.count ?? 0,
    };
  } catch {
    return empty;
  }
}

export async function getOperatorQueue(): Promise<OperatorQueueItem[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const sla = await listSlaRules();
    const leadLimit =
      sla.find((rule) => rule.entityType === "lead")?.timeLimitHours ?? 24;
    const appLimit =
      sla.find((rule) => rule.entityType === "application")?.timeLimitHours ??
      48;
    const verLimit =
      sla.find((rule) => rule.entityType === "verification")?.timeLimitHours ??
      72;

    const [
      leads,
      projects,
      applications,
      deals,
      documents,
      verifications,
      tasks,
    ] = await Promise.all([
      supabase
        .from("leads")
        .select("id, title, stage, created_at")
        .eq("stage", "new")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("projects")
        .select("id, title, status, created_at")
        .in("status", ["moderation", "draft"])
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("applications")
        .select("id, message, status, created_at, target_type")
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("deals")
        .select("id, description, deal_type, status, created_at")
        .in("status", ["negotiation", "agreement", "draft"])
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("documents")
        .select("id, name, status, created_at, related_type")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("verification_requests")
        .select("id, status, created_at, target_type")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("tasks")
        .select("*")
        .in("status", OPEN_TASK_STATUSES)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const items: OperatorQueueItem[] = [];

    for (const row of (leads.data ?? []) as Pick<
      LeadRow,
      "id" | "title" | "stage" | "created_at"
    >[]) {
      items.push({
        id: `lead-${row.id}`,
        kind: "lead",
        title: row.title,
        subtitle: "Новый лид",
        status: row.stage,
        href: `/admin/crm/leads/${row.id}`,
        createdAt: row.created_at,
        overdue: hoursSince(row.created_at) > leadLimit,
      });
    }

    for (const row of (projects.data ?? []) as Pick<
      ProjectRow,
      "id" | "title" | "status" | "created_at"
    >[]) {
      items.push({
        id: `project-${row.id}`,
        kind: "project",
        title: row.title,
        subtitle: "Новый / на модерации",
        status: row.status,
        href: "/admin/projects",
        createdAt: row.created_at,
      });
    }

    for (const row of (applications.data ?? []) as Pick<
      ApplicationRow,
      "id" | "message" | "status" | "created_at" | "target_type"
    >[]) {
      items.push({
        id: `app-${row.id}`,
        kind: "application",
        title: row.message?.slice(0, 80) || "Заявка",
        subtitle: `Без ответа · ${row.target_type}`,
        status: row.status,
        href: "/dashboard/applications",
        createdAt: row.created_at,
        overdue: hoursSince(row.created_at) > appLimit,
      });
    }

    for (const row of (deals.data ?? []) as Pick<
      DealRow,
      "id" | "description" | "deal_type" | "status" | "created_at"
    >[]) {
      items.push({
        id: `deal-${row.id}`,
        kind: "deal",
        title: row.description?.slice(0, 80) || `Сделка · ${row.deal_type}`,
        subtitle: "Сделка в ожидании",
        status: row.status,
        href: "/admin/dashboard",
        createdAt: row.created_at,
      });
    }

    for (const row of (documents.data ?? []) as Pick<
      DocumentRow,
      "id" | "name" | "status" | "created_at" | "related_type"
    >[]) {
      items.push({
        id: `doc-${row.id}`,
        kind: "document",
        title: row.name || "Документ",
        subtitle: `На проверке · ${row.related_type}`,
        status: row.status,
        href: "/admin/verifications",
        createdAt: row.created_at,
        overdue: hoursSince(row.created_at) > verLimit,
      });
    }

    for (const row of (verifications.data ?? []) as Pick<
      VerificationRequestRow,
      "id" | "status" | "created_at" | "target_type"
    >[]) {
      items.push({
        id: `ver-${row.id}`,
        kind: "verification",
        title: `Верификация · ${row.target_type}`,
        subtitle: "Запрос на проверке",
        status: row.status,
        href: "/admin/verifications",
        createdAt: row.created_at,
        overdue: hoursSince(row.created_at) > verLimit,
      });
    }

    for (const row of (tasks.data ?? []) as TaskRow[]) {
      items.push({
        id: `task-${row.id}`,
        kind: "task",
        title: row.title,
        subtitle: `Задача · ${row.priority}`,
        status: row.status,
        href: "/operator/tasks",
        createdAt: row.created_at,
        overdue: Boolean(
          row.deadline && new Date(row.deadline).getTime() < Date.now(),
        ),
      });
    }

    return items.sort((a, b) => {
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
  } catch {
    return [];
  }
}

export async function getOperatorActivity(
  limit = 20,
): Promise<OperatorActivityItem[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const [tasks, leads, applications] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, status, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("leads")
        .select("id, title, stage, updated_at")
        .order("updated_at", { ascending: false })
        .limit(8),
      supabase
        .from("applications")
        .select("id, message, status, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const items: OperatorActivityItem[] = [];

    for (const row of tasks.data ?? []) {
      items.push({
        id: `act-task-${row.id}`,
        label: `Задача: ${row.title}`,
        detail: `Статус ${row.status}`,
        href: "/operator/tasks",
        at: row.updated_at ?? row.created_at,
      });
    }
    for (const row of leads.data ?? []) {
      items.push({
        id: `act-lead-${row.id}`,
        label: `Лид: ${row.title}`,
        detail: `Этап ${row.stage}`,
        href: `/admin/crm/leads/${row.id}`,
        at: row.updated_at,
      });
    }
    for (const row of applications.data ?? []) {
      items.push({
        id: `act-app-${row.id}`,
        label: "Новая заявка",
        detail: String(row.message ?? "").slice(0, 80) || row.status,
        href: "/dashboard/applications",
        at: row.created_at,
      });
    }

    return items
      .sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""))
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function getOperatorDashboardData() {
  const [stats, queue, activity, tasks, slaRules] = await Promise.all([
    getOperatorStats(),
    getOperatorQueue(),
    getOperatorActivity(),
    listOperatorTasks(80),
    listSlaRules(),
  ]);

  let stuckProjects: Array<{
    id: string;
    title: string;
    updatedAt?: string;
    status: string;
  }> = [];

  if (hasSupabaseEnv()) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("id, title, status, updated_at")
        .in("status", ["moderation", "draft"])
        .order("updated_at", { ascending: true })
        .limit(20);
      stuckProjects = (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        updatedAt: row.updated_at,
      }));
    } catch {
      stuckProjects = [];
    }
  }

  const insights = buildOperatorInsights({
    tasks,
    stuckProjects,
    unansweredApplications: stats.unansweredApplications,
    pendingVerifications: queue.filter((item) => item.kind === "verification")
      .length,
    newLeads: stats.newLeads,
    slaRules,
  });

  return { stats, queue, activity, tasks, slaRules, insights };
}
