/**
 * Project Acquisition Engine — дашборд потока проектов (этап 61).
 * Композиция: CRM leads + projects + analytics_events + quality.
 */

import {
  BUSINESS_DEVELOPMENT_PATH,
  PROJECT_ACQUISITION_STAGES,
  PROJECT_SOURCES,
  crmLeadToAcquisitionStage,
  normalizeProjectSource,
  projectAcquisitionStageLabels,
  projectSourceLabels,
  type ProjectAcquisitionStage,
  type ProjectSource,
} from "@/config/project-acquisition";
import { platformVersion } from "@/config/version";
import { listCrmContacts, listCrmLeads } from "@/lib/crm/queries";
import {
  computeProjectQualityScore,
  type ProjectQualityScore,
} from "@/lib/project-acquisition/quality";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ProjectRow } from "@/types/database";
import type { ProjectAcquisitionReport } from "@/types/lia";

export type AcquisitionFunnelStage = {
  id: ProjectAcquisitionStage;
  label: string;
  count: number;
  conversionFromPrevPct: number;
  avgDaysFromPrev: number | null;
};

export type ProjectSourceFunnel = {
  source: ProjectSource;
  label: string;
  leads: number;
  projects: number;
  results: number;
};

export type ProjectAcquisitionPipeline = {
  stages: AcquisitionFunnelStage[];
  totalLeads: number;
  totalProjects: number;
  overallConversionPct: number;
};

export type ProjectAcquisitionDashboard = {
  funnel: AcquisitionFunnelStage[];
  pipeline: ProjectAcquisitionPipeline;
  sources: ProjectSourceFunnel[];
  quality: {
    averagePct: number;
    samples: ProjectQualityScore[];
    distribution: { low: number; medium: number; high: number };
  };
  developmentPath: typeof BUSINESS_DEVELOPMENT_PATH;
  metrics: {
    leads: number;
    drafts: number;
    moderation: number;
    published: number;
    active: number;
    interactions: number;
  };
  report: ProjectAcquisitionReport;
};

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function daysBetween(a: string | undefined, b: string | undefined): number | null {
  if (!a || !b) return null;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.round((ms / (24 * 60 * 60 * 1000)) * 10) / 10;
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10;
}

export function buildProjectAcquisitionReport(input: {
  funnel: AcquisitionFunnelStage[];
  sources: ProjectSourceFunnel[];
  quality: ProjectAcquisitionDashboard["quality"];
  metrics: ProjectAcquisitionDashboard["metrics"];
}): ProjectAcquisitionReport {
  const topSources = [...input.sources]
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5)
    .map(
      (s) =>
        `${s.label}: лиды ${s.leads} → проекты ${s.projects} → результаты ${s.results}`,
    );

  const conversionLines = input.funnel.map((s, i) => {
    if (i === 0) return `${s.label}: ${s.count}`;
    return `${s.label}: ${s.count} (конверсия ${s.conversionFromPrevPct}%${
      s.avgDaysFromPrev != null ? `, ~${s.avgDaysFromPrev} дн.` : ""
    })`;
  });

  const problems: string[] = [];
  const leadFound = input.funnel.find((s) => s.id === "lead_found")?.count ?? 0;
  const published = input.metrics.published + input.metrics.active;
  if (leadFound > 0 && published === 0) {
    problems.push("Лиды есть, но публикации из acquisition ещё нет");
  }
  const interested = input.funnel.find((s) => s.id === "interested")?.count ?? 0;
  const drafts = input.metrics.drafts;
  if (interested > drafts * 2 && interested > 3) {
    problems.push("Много заинтересованных без черновика проекта");
  }
  if (input.quality.averagePct > 0 && input.quality.averagePct < 50) {
    problems.push(
      `Среднее качество карточек ${input.quality.averagePct}% — усилить заполненность`,
    );
  }
  if (input.metrics.moderation > input.metrics.published && input.metrics.moderation > 2) {
    problems.push("Очередь модерации растёт относительно публикаций");
  }
  if (problems.length === 0) {
    problems.push("Критических разрывов воронки не выявлено");
  }

  return {
    summary: [
      `Project Acquisition · лиды ${input.metrics.leads}, черновики ${input.metrics.drafts}, опубликовано ${published}.`,
      `Среднее качество карточек ${input.quality.averagePct}%.`,
      `Версия ${platformVersion.version}. Только анализ.`,
    ].join(" "),
    sources:
      topSources.length > 0
        ? topSources
        : ["Нет данных по источникам проектов"],
    conversion: conversionLines,
    quality: [
      `Средний ProjectQualityScore: ${input.quality.averagePct}%`,
      `high ${input.quality.distribution.high} · medium ${input.quality.distribution.medium} · low ${input.quality.distribution.low}`,
      ...input.quality.samples.slice(0, 3).map(
        (q) =>
          `«${q.title}»: ${q.pct}% (${q.level}) — ${q.recommendations[0] ?? ""}`,
      ),
    ],
    problems,
    recommendations: [
      "Вести ProjectAcquisitionPipeline через CRM (lead_found → active)",
      "Усиливать источники с лучшей конверсией лид → проект → результат",
      "Публичный сценарий Лии «Аудит моего бизнеса» → шаблон business_development",
      "Поднимать ProjectQualityScore до публикации (без автоблокировки)",
      "Использовать кейс ТИНДА как эталон пути: задача → анализ → проект → ресурсы",
    ],
  };
}

export async function getProjectAcquisitionDashboard(): Promise<ProjectAcquisitionDashboard> {
  const [leads, contacts] = await Promise.all([
    listCrmLeads(200),
    listCrmContacts(200),
  ]);

  const contactById = new Map(contacts.map((c) => [c.id, c]));

  const stageCounts: Record<ProjectAcquisitionStage, number> = {
    lead_found: 0,
    contacted: 0,
    interested: 0,
    draft_created: 0,
    moderation: 0,
    published: 0,
    active: 0,
  };

  const stageEnteredAt: Record<ProjectAcquisitionStage, string[]> = {
    lead_found: [],
    contacted: [],
    interested: [],
    draft_created: [],
    moderation: [],
    published: [],
    active: [],
  };

  const sourceBuckets = new Map<
    ProjectSource,
    { leads: number; projects: number; results: number }
  >();
  for (const s of PROJECT_SOURCES) {
    sourceBuckets.set(s, { leads: 0, projects: 0, results: 0 });
  }

  for (const lead of leads) {
    const acq = crmLeadToAcquisitionStage(String(lead.stage ?? "new"));
    stageCounts[acq] += 1;
    if (lead.createdAt) stageEnteredAt[acq].push(lead.createdAt);
    if (lead.updatedAt && acq !== "lead_found") {
      stageEnteredAt[acq].push(lead.updatedAt);
    }

    const contact = contactById.get(lead.contactId);
    const source = normalizeProjectSource(contact?.source ?? lead.category);
    const bucket = sourceBuckets.get(source)!;
    bucket.leads += 1;
    if (lead.convertedProjectId) bucket.projects += 1;
    if (lead.stage === "deal" || lead.stage === "closed") bucket.results += 1;
  }

  let projects: ProjectRow[] = [];
  let interactions = 0;

  if (hasSupabaseEnv()) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      projects = (data ?? []) as ProjectRow[];

      const { count } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true });
      interactions = count ?? 0;

      // Enrich funnel from project statuses (без двойного счёта CRM draft)
      for (const p of projects) {
        if (p.status === "moderation") stageCounts.moderation += 1;
        if (p.status === "published") stageCounts.published += 1;
        if (p.status === "active" || p.status === "completed") {
          stageCounts.active += 1;
        }
        if (p.status === "draft") {
          // уже может быть в CRM project_created — добавляем только «сирот»
          const linked = leads.some((l) => l.convertedProjectId === p.id);
          if (!linked) stageCounts.draft_created += 1;
        }
      }

      // Analytics source enrichment
      const { data: events } = await supabase
        .from("analytics_events")
        .select("event_type, metadata, created_at")
        .in("event_type", [
          "project_lead_created",
          "project_contacted",
          "project_interest_confirmed",
          "project_draft_created",
          "project_published_from_acquisition",
          "project_created",
          "lia_started",
        ])
        .limit(4000);

      for (const e of events ?? []) {
        const meta = (e.metadata ?? {}) as Record<string, unknown>;
        const source = normalizeProjectSource(
          String(meta.source ?? meta.channel ?? meta.scenario ?? ""),
        );
        const bucket = sourceBuckets.get(source);
        if (!bucket) continue;
        const type = String((e as { event_type?: string }).event_type ?? "");
        if (
          type === "project_lead_created" ||
          type === "lia_started"
        ) {
          if (type === "project_lead_created") bucket.leads += 1;
          if (
            type === "lia_started" &&
            String(meta.scenario ?? "") === "business_audit"
          ) {
            bucket.leads += 1;
          }
        }
        if (type === "project_draft_created" || type === "project_created") {
          bucket.projects += 1;
        }
        if (type === "project_published_from_acquisition") {
          bucket.results += 1;
        }
      }
    } catch {
      // мягкий сбой
    }
  }

  const funnelBase = PROJECT_ACQUISITION_STAGES.map((id) => ({
    id,
    label: projectAcquisitionStageLabels[id],
    count: stageCounts[id],
  }));

  // Cumulative-style conversion: each stage vs previous stage count
  const funnel: AcquisitionFunnelStage[] = funnelBase.map((stage, index) => {
    const prev = index === 0 ? null : funnelBase[index - 1]!;
    const conversionFromPrevPct =
      index === 0 ? 100 : pct(stage.count, prev?.count ?? 0);

    let avgDaysFromPrev: number | null = null;
    if (index > 0 && prev) {
      const prevTimes = stageEnteredAt[prev.id];
      const currTimes = stageEnteredAt[stage.id];
      const deltas: number[] = [];
      const n = Math.min(prevTimes.length, currTimes.length);
      for (let i = 0; i < n; i += 1) {
        const d = daysBetween(prevTimes[i], currTimes[i]);
        if (d != null) deltas.push(d);
      }
      avgDaysFromPrev = avg(deltas);
    }

    return {
      ...stage,
      conversionFromPrevPct,
      avgDaysFromPrev,
    };
  });

  const drafts = projects.filter((p) => p.status === "draft").length;
  const moderation = projects.filter((p) => p.status === "moderation").length;
  const published = projects.filter((p) => p.status === "published").length;
  const active = projects.filter(
    (p) => p.status === "active" || p.status === "completed",
  ).length;

  const qualitySamples = projects
    .slice(0, 40)
    .map((p) => computeProjectQualityScore(p));
  const averagePct =
    qualitySamples.length > 0
      ? Math.round(
          (qualitySamples.reduce((s, q) => s + q.pct, 0) /
            qualitySamples.length) *
            10,
        ) / 10
      : 0;
  const distribution = {
    low: qualitySamples.filter((q) => q.level === "low").length,
    medium: qualitySamples.filter((q) => q.level === "medium").length,
    high: qualitySamples.filter((q) => q.level === "high").length,
  };

  const sources: ProjectSourceFunnel[] = PROJECT_SOURCES.map((source) => {
    const b = sourceBuckets.get(source)!;
    return {
      source,
      label: projectSourceLabels[source],
      leads: b.leads,
      projects: b.projects,
      results: b.results,
    };
  }).sort((a, b) => b.leads - a.leads);

  const metrics = {
    leads: leads.length,
    drafts,
    moderation,
    published,
    active,
    interactions,
  };

  const pipeline: ProjectAcquisitionPipeline = {
    stages: funnel,
    totalLeads: leads.length,
    totalProjects: projects.length,
    overallConversionPct: pct(published + active, Math.max(1, leads.length)),
  };

  const report = buildProjectAcquisitionReport({
    funnel,
    sources,
    quality: { averagePct, samples: qualitySamples, distribution },
    metrics,
  });

  return {
    funnel,
    pipeline,
    sources,
    quality: {
      averagePct,
      samples: qualitySamples.slice(0, 12),
      distribution,
    },
    developmentPath: BUSINESS_DEVELOPMENT_PATH,
    metrics,
    report,
  };
}

export async function buildProjectAcquisitionReportAsync(): Promise<ProjectAcquisitionReport> {
  const dashboard = await getProjectAcquisitionDashboard();
  return dashboard.report;
}
