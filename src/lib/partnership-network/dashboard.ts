/**
 * Partnership Network — дашборд партнёрской сети (этап 62).
 * Композиция: organizations + partnerships + CRM + analytics attribution.
 */

import {
  PARTNERSHIP_PIPELINE_STAGES,
  PARTNER_ATTRIBUTION_SOURCE,
  PARTNER_CATEGORIES,
  partnerCategoryLabel,
  partnershipPipelineStageLabels,
  partnershipTaskStatusLabels,
  partnershipTaskTypeLabels,
  pipelineToBucket,
  partnershipStatusToPipeline,
  type PartnerBucket,
  type PartnershipPipelineStage,
  type PartnershipTaskStatus,
  type PartnershipTaskType,
} from "@/config/partnership-network";
import { partnershipStatusLabels, partnershipTypeLabels } from "@/config/partners";
import { platformVersion } from "@/config/version";
import { listCrmContacts } from "@/lib/crm/queries";
import { mapOrganizationRow, mapPartnershipRow } from "@/lib/partners/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  OrganizationRow,
  PartnershipRow,
  PartnershipTaskRow,
} from "@/types/database";
import type { PartnershipReport } from "@/types/lia";

export type PartnershipPipelineView = {
  stages: Array<{
    id: PartnershipPipelineStage;
    label: string;
    count: number;
  }>;
};

export type PartnerCardView = {
  partnershipId: string;
  organizationId: string;
  name: string;
  description: string;
  direction: string;
  categoryLabel: string;
  contact: string;
  status: string;
  statusLabel: string;
  pipelineStage: PartnershipPipelineStage;
  pipelineLabel: string;
  bucket: PartnerBucket;
  responsible: string;
  startedAt: string | null;
  partnershipTypeLabel: string;
  outcomes: PartnershipOutcomesRow;
};

export type PartnershipOutcomesRow = {
  referredUsers: number;
  projects: number;
  experts: number;
  investors: number;
  applications: number;
  deals: number;
};

export type PartnerAttributionRow = {
  partnerName: string;
  organizationId: string;
  registrations: number;
  projects: number;
  applications: number;
  deals: number;
};

export type PartnershipTaskView = {
  id: string;
  taskType: PartnershipTaskType;
  taskTypeLabel: string;
  title: string;
  description: string;
  status: PartnershipTaskStatus;
  statusLabel: string;
  createdAt: string;
};

export type PartnershipNetworkDashboard = {
  buckets: Record<PartnerBucket, number>;
  categories: Array<{ type: string; label: string; count: number }>;
  pipeline: PartnershipPipelineView;
  partners: PartnerCardView[];
  outcomes: PartnershipOutcomesRow & { byPartner: PartnerCardView[] };
  attribution: PartnerAttributionRow[];
  tasks: PartnershipTaskView[];
  taskCounts: Record<PartnershipTaskStatus, number>;
  report: PartnershipReport;
};

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function emptyOutcomes(): PartnershipOutcomesRow {
  return {
    referredUsers: 0,
    projects: 0,
    experts: 0,
    investors: 0,
    applications: 0,
    deals: 0,
  };
}

export function buildPartnershipReport(input: {
  buckets: Record<PartnerBucket, number>;
  pipeline: PartnershipPipelineView;
  partners: PartnerCardView[];
  outcomes: PartnershipOutcomesRow;
  attribution: PartnerAttributionRow[];
}): PartnershipReport {
  const topPartners = [...input.partners]
    .sort(
      (a, b) =>
        b.outcomes.projects +
        b.outcomes.deals -
        (a.outcomes.projects + a.outcomes.deals),
    )
    .slice(0, 5)
    .map(
      (p) =>
        `${p.name}: ${p.pipelineLabel} · проекты ${p.outcomes.projects} · сделки ${p.outcomes.deals}`,
    );

  const problems: string[] = [];
  if (input.buckets.potential > input.buckets.active * 2 && input.buckets.potential > 3) {
    problems.push("Много потенциальных партнёров без активации");
  }
  if (input.buckets.active > 0 && input.outcomes.projects === 0) {
    problems.push("Активные партнёры есть, но приведённых проектов пока нет");
  }
  if (input.attribution.every((a) => a.registrations + a.projects === 0)) {
    problems.push("Слабая attribution source=partner — усилить трекинг referrals");
  }
  if (problems.length === 0) {
    problems.push("Критических разрывов партнёрской сети не выявлено");
  }

  return {
    summary: [
      `Partnership Network · активные ${input.buckets.active}, потенциальные ${input.buckets.potential}, завершённые ${input.buckets.completed}.`,
      `Результаты: пользователи ${input.outcomes.referredUsers}, проекты ${input.outcomes.projects}, сделки ${input.outcomes.deals}.`,
      `Версия ${platformVersion.version}. Только анализ.`,
    ].join(" "),
    partners:
      topPartners.length > 0
        ? topPartners
        : ["Партнёры ещё не заведены в organizations / partnerships"],
    activity: input.pipeline.stages.map((s) => `${s.label}: ${s.count}`),
    referrals: input.attribution
      .filter((a) => a.registrations + a.projects > 0)
      .slice(0, 6)
      .map(
        (a) =>
          `${a.partnerName}: рег. ${a.registrations} · проекты ${a.projects} · заявки ${a.applications} · сделки ${a.deals}`,
      )
      .concat(
        input.attribution.every((a) => a.registrations + a.projects === 0)
          ? ["Рефералов с source=partner пока нет"]
          : [],
      ),
    results: [
      `Приведённые пользователи: ${input.outcomes.referredUsers}`,
      `Проекты: ${input.outcomes.projects}`,
      `Эксперты: ${input.outcomes.experts}`,
      `Инвесторы: ${input.outcomes.investors}`,
      `Заявки: ${input.outcomes.applications}`,
      `Сделки: ${input.outcomes.deals}`,
      `Доля активных: ${pct(input.buckets.active, input.buckets.active + input.buckets.potential + input.buckets.completed)}%`,
    ],
    problems,
    recommendations: [
      "Вести PartnershipPipeline: found → contacted → meeting → negotiation → active",
      "Фиксировать attribution source=partner в регистрациях, проектах, заявках и сделках",
      "Закрывать PartnershipTasks и сопровождать активных партнёров",
      "Расширять первый набор: банки, ТПП, университеты, акселераторы",
      "Сверять KPI на /admin/partnerships еженедельно",
    ],
  };
}

export async function getPartnershipNetworkDashboard(): Promise<PartnershipNetworkDashboard> {
  const contacts = await listCrmContacts(200);
  const partnerContacts = contacts.filter((c) => c.type === "partner");

  const buckets: Record<PartnerBucket, number> = {
    active: 0,
    potential: 0,
    completed: 0,
  };

  const categoryCounts = new Map<string, number>();
  for (const t of PARTNER_CATEGORIES) categoryCounts.set(t, 0);

  const stageCounts: Record<PartnershipPipelineStage, number> = {
    partner_found: 0,
    contacted: 0,
    meeting: 0,
    negotiation: 0,
    active: 0,
    completed: 0,
  };

  const partners: PartnerCardView[] = [];
  const attributionMap = new Map<string, PartnerAttributionRow>();
  const totals = emptyOutcomes();

  let tasks: PartnershipTaskView[] = [];

  if (hasSupabaseEnv()) {
    try {
      const supabase = createClient();
      const [{ data: orgs }, { data: partnerships }] = await Promise.all([
        supabase.from("organizations").select("*").order("created_at", {
          ascending: false,
        }),
        supabase.from("partnerships").select("*").order("updated_at", {
          ascending: false,
        }),
      ]);

      const orgById = new Map(
        ((orgs ?? []) as OrganizationRow[]).map((o) => [o.id, o]),
      );
      const rows = (partnerships ?? []) as PartnershipRow[];

      // Profile names for responsible
      const assigneeIds = Array.from(
        new Set(
          rows
            .flatMap((r) => [r.assignee_id, r.created_by])
            .filter((id): id is string => Boolean(id)),
        ),
      );
      const nameById = new Map<string, string>();
      if (assigneeIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", assigneeIds);
        for (const p of profiles ?? []) {
          nameById.set(
            (p as { id: string }).id,
            (p as { full_name?: string }).full_name || "—",
          );
        }
      }

      // Linked entity counts by organization
      const orgIds = Array.from(orgById.keys());
      const projectsByOrg = new Map<string, number>();
      const appsByOrg = new Map<string, number>();
      const dealsByOrg = new Map<string, number>();

      if (orgIds.length > 0) {
        const { data: projects } = await supabase
          .from("projects")
          .select("id, organization_id")
          .in("organization_id", orgIds)
          .limit(2000);
        for (const p of projects ?? []) {
          const oid = (p as { organization_id?: string | null }).organization_id;
          if (!oid) continue;
          projectsByOrg.set(oid, (projectsByOrg.get(oid) ?? 0) + 1);
        }

        const projectIds = (projects ?? []).map(
          (p) => (p as { id: string }).id,
        );
        if (projectIds.length > 0) {
          const { data: apps } = await supabase
            .from("applications")
            .select("id, target_id, target_type")
            .eq("target_type", "project")
            .in("target_id", projectIds)
            .limit(3000);
          const projectOrg = new Map(
            (projects ?? []).map((p) => [
              (p as { id: string }).id,
              (p as { organization_id?: string | null }).organization_id ?? "",
            ]),
          );
          for (const a of apps ?? []) {
            const oid = projectOrg.get(
              (a as { target_id: string }).target_id,
            );
            if (!oid) continue;
            appsByOrg.set(oid, (appsByOrg.get(oid) ?? 0) + 1);
          }
        }

        const { data: deals } = await supabase
          .from("deals")
          .select("id, partner_id, deal_type")
          .limit(2000);
        for (const d of deals ?? []) {
          const pid = (d as { partner_id?: string | null }).partner_id;
          // partner_id may be profile — count partnership-type deals globally soft
          if ((d as { deal_type?: string }).deal_type === "partnership") {
            // distribute later via analytics
            void pid;
          }
        }
      }

      // Analytics attribution source=partner
      const { data: events } = await supabase
        .from("analytics_events")
        .select("event_type, metadata, user_id")
        .in("event_type", [
          "partner_created",
          "partner_contacted",
          "partner_activated",
          "partner_referral_created",
          "partner_result_created",
          "user_registered",
          "registration_completed",
          "project_created",
          "application_sent",
          "deal_created",
          "public_registration",
        ])
        .limit(6000);

      const referralUsers = new Set<string>();
      for (const e of events ?? []) {
        const meta = (e.metadata ?? {}) as Record<string, unknown>;
        const source = String(meta.source ?? meta.channel ?? "").toLowerCase();
        if (source !== PARTNER_ATTRIBUTION_SOURCE && source !== "partners") {
          continue;
        }
        const orgId = String(
          meta.organizationId ?? meta.organization_id ?? meta.partnerId ?? "",
        );
        const orgName =
          String(meta.partnerName ?? meta.organizationName ?? "") ||
          (orgId && orgById.get(orgId)?.name) ||
          "Партнёр";
        const key = orgId || orgName;
        if (!attributionMap.has(key)) {
          attributionMap.set(key, {
            partnerName: orgName,
            organizationId: orgId,
            registrations: 0,
            projects: 0,
            applications: 0,
            deals: 0,
          });
        }
        const row = attributionMap.get(key)!;
        const type = String((e as { event_type?: string }).event_type ?? "");
        const uid = (e as { user_id?: string | null }).user_id;
        if (
          type === "user_registered" ||
          type === "registration_completed" ||
          type === "public_registration" ||
          type === "partner_referral_created"
        ) {
          row.registrations += 1;
          if (uid) referralUsers.add(uid);
          totals.referredUsers += 1;
        }
        if (type === "project_created") {
          row.projects += 1;
          totals.projects += 1;
        }
        if (type === "application_sent") {
          row.applications += 1;
          totals.applications += 1;
        }
        if (type === "deal_created" || type === "partner_result_created") {
          row.deals += 1;
          totals.deals += 1;
        }
      }

      // CRM partner contacts as soft referrals signal
      for (const c of partnerContacts) {
        totals.referredUsers += c.linkedUserId ? 1 : 0;
      }

      // Role signals from profiles linked via partner channel (soft)
      if (referralUsers.size > 0) {
        const { data: roleProfiles } = await supabase
          .from("profiles")
          .select("id, role")
          .in("id", Array.from(referralUsers).slice(0, 500));
        for (const p of roleProfiles ?? []) {
          const role = String((p as { role?: string }).role ?? "");
          if (role === "expert") totals.experts += 1;
          if (role === "investor") totals.investors += 1;
        }
      }

      for (const row of rows) {
        const partnership = mapPartnershipRow(row);
        const org = orgById.get(row.organization_id);
        if (!org) continue;
        const organization = mapOrganizationRow(org);
        const stage: PartnershipPipelineStage =
          row.pipeline_stage ??
          partnershipStatusToPipeline(row.status);
        stageCounts[stage] += 1;
        const bucket = pipelineToBucket(stage);
        buckets[bucket] += 1;
        categoryCounts.set(
          organization.type,
          (categoryCounts.get(organization.type) ?? 0) + 1,
        );

        const contact =
          organization.website ||
          partnerContacts.find((c) =>
            c.companyName
              .toLowerCase()
              .includes(organization.name.toLowerCase().slice(0, 12)),
          )?.email ||
          partnerContacts.find((c) => c.type === "partner")?.email ||
          "—";

        const responsibleId = row.assignee_id || row.created_by;
        const outcomes: PartnershipOutcomesRow = {
          referredUsers:
            attributionMap.get(organization.id)?.registrations ?? 0,
          projects:
            (projectsByOrg.get(organization.id) ?? 0) +
            (attributionMap.get(organization.id)?.projects ?? 0),
          experts: 0,
          investors: 0,
          applications:
            (appsByOrg.get(organization.id) ?? 0) +
            (attributionMap.get(organization.id)?.applications ?? 0),
          deals:
            (dealsByOrg.get(organization.id) ?? 0) +
            (attributionMap.get(organization.id)?.deals ?? 0),
        };

        // floor totals from org-linked entities if analytics empty
        if (outcomes.projects > 0 && totals.projects === 0) {
          /* keep analytics totals separate; sum at end */
        }

        partners.push({
          partnershipId: partnership.id,
          organizationId: organization.id,
          name: organization.name,
          description:
            organization.description ||
            partnership.description ||
            "Описание не заполнено",
          direction: `${partnerCategoryLabel(organization.type)} · ${partnershipTypeLabels[partnership.type]}`,
          categoryLabel: partnerCategoryLabel(organization.type),
          contact,
          status: partnership.status,
          statusLabel: partnershipStatusLabels[partnership.status],
          pipelineStage: stage,
          pipelineLabel: partnershipPipelineStageLabels[stage],
          bucket,
          responsible: responsibleId
            ? nameById.get(responsibleId) || responsibleId.slice(0, 8)
            : "—",
          startedAt: row.started_at || partnership.createdAt || null,
          partnershipTypeLabel: partnershipTypeLabels[partnership.type],
          outcomes,
        });

        if (!attributionMap.has(organization.id)) {
          attributionMap.set(organization.id, {
            partnerName: organization.name,
            organizationId: organization.id,
            registrations: outcomes.referredUsers,
            projects: outcomes.projects,
            applications: outcomes.applications,
            deals: outcomes.deals,
          });
        } else {
          const a = attributionMap.get(organization.id)!;
          a.partnerName = organization.name;
          a.projects = Math.max(a.projects, outcomes.projects);
          a.applications = Math.max(a.applications, outcomes.applications);
          a.deals = Math.max(a.deals, outcomes.deals);
        }
      }

      // Organizations without partnership row → potential partner_found
      for (const org of orgById.values()) {
        const hasPartnership = rows.some((r) => r.organization_id === org.id);
        if (hasPartnership) continue;
        stageCounts.partner_found += 1;
        buckets.potential += 1;
        categoryCounts.set(org.type, (categoryCounts.get(org.type) ?? 0) + 1);
        const organization = mapOrganizationRow(org);
        partners.push({
          partnershipId: `org-${org.id}`,
          organizationId: org.id,
          name: organization.name,
          description: organization.description || "Потенциальный партнёр",
          direction: partnerCategoryLabel(organization.type),
          categoryLabel: partnerCategoryLabel(organization.type),
          contact: organization.website || "—",
          status: "pending",
          statusLabel: "Потенциальный",
          pipelineStage: "partner_found",
          pipelineLabel: partnershipPipelineStageLabels.partner_found,
          bucket: "potential",
          responsible: organization.createdBy
            ? nameById.get(organization.createdBy) || "—"
            : "—",
          startedAt: organization.createdAt || null,
          partnershipTypeLabel: "—",
          outcomes: emptyOutcomes(),
        });
      }

      // Sum outcomes from partner cards if analytics totals low
      const cardTotals = partners.reduce((acc, p) => {
        acc.referredUsers += p.outcomes.referredUsers;
        acc.projects += p.outcomes.projects;
        acc.experts += p.outcomes.experts;
        acc.investors += p.outcomes.investors;
        acc.applications += p.outcomes.applications;
        acc.deals += p.outcomes.deals;
        return acc;
      }, emptyOutcomes());
      totals.referredUsers = Math.max(totals.referredUsers, cardTotals.referredUsers);
      totals.projects = Math.max(totals.projects, cardTotals.projects);
      totals.applications = Math.max(totals.applications, cardTotals.applications);
      totals.deals = Math.max(totals.deals, cardTotals.deals);
      totals.experts = Math.max(totals.experts, cardTotals.experts);
      totals.investors = Math.max(totals.investors, cardTotals.investors);

      const { data: taskRows } = await supabase
        .from("partnership_tasks")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      tasks = ((taskRows ?? []) as PartnershipTaskRow[]).map((row) => ({
        id: row.id,
        taskType: row.task_type,
        taskTypeLabel: partnershipTaskTypeLabels[row.task_type],
        title: row.title,
        description: row.description,
        status: row.status,
        statusLabel: partnershipTaskStatusLabels[row.status],
        createdAt: row.created_at,
      }));
    } catch {
      // мягкий сбой / миграция может отсутствовать
    }
  }

  const pipeline: PartnershipPipelineView = {
    stages: PARTNERSHIP_PIPELINE_STAGES.map((id) => ({
      id,
      label: partnershipPipelineStageLabels[id],
      count: stageCounts[id],
    })),
  };

  const categories = PARTNER_CATEGORIES.map((type) => ({
    type,
    label: partnerCategoryLabel(type),
    count: categoryCounts.get(type) ?? 0,
  }));

  const attribution = Array.from(attributionMap.values()).sort(
    (a, b) =>
      b.registrations + b.projects + b.deals - (a.registrations + a.projects + a.deals),
  );

  const taskCounts: Record<PartnershipTaskStatus, number> = {
    new: tasks.filter((t) => t.status === "new").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const report = buildPartnershipReport({
    buckets,
    pipeline,
    partners,
    outcomes: totals,
    attribution,
  });

  return {
    buckets,
    categories,
    pipeline,
    partners,
    outcomes: { ...totals, byPartner: partners },
    attribution,
    tasks,
    taskCounts,
    report,
  };
}

export async function buildPartnershipReportAsync(): Promise<PartnershipReport> {
  const dashboard = await getPartnershipNetworkDashboard();
  return dashboard.report;
}
