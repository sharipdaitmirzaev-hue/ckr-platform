/**
 * First Deals & Revenue — дашборд коммерческих результатов (этап 63).
 * Композиция: deals + services + subscriptions + CRM + partnerships.
 * Без фиктивной выручки и без реальных платежей.
 */

import {
  DEAL_REVENUE_STATUSES,
  REVENUE_PERIODS,
  REVENUE_PIPELINE_STAGES,
  REVENUE_SOURCES,
  STARTER_CKR_SERVICES,
  dealRevenueStatusLabels,
  inferRevenueStatus,
  revenuePeriodLabels,
  revenuePeriodStart,
  revenuePipelineStageLabels,
  revenueSourceLabels,
  type DealRevenueStatus,
  type RevenuePeriod,
  type RevenuePipelineStage,
  type RevenueSource,
} from "@/config/revenue";
import { platformVersion } from "@/config/version";
import { listCrmLeads } from "@/lib/crm/queries";
import { mapDealRow } from "@/lib/deals/mappers";
import { listActivePlans, listActiveServices } from "@/lib/monetization/queries";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { DealRow, OrganizationRow } from "@/types/database";
import type { RevenueOpportunityReport } from "@/types/lia";

export type RevenueSourceRow = {
  source: RevenueSource;
  label: string;
  potential: number;
  confirmed: number;
  paid: number;
  count: number;
};

export type PartnerRevenueMetrics = {
  partnerName: string;
  organizationId: string;
  projects: number;
  deals: number;
  ckrRevenue: number;
};

export type RevenuePipelineView = {
  stages: Array<{
    id: RevenuePipelineStage;
    label: string;
    count: number;
  }>;
};

export type RevenueDealView = {
  id: string;
  projectId: string;
  amount: number | null;
  commissionAmount: number | null;
  commissionType: string | null;
  commissionStatus: string | null;
  revenueStatus: DealRevenueStatus;
  revenueStatusLabel: string;
  dealType: string;
  status: string;
  createdAt: string;
};

export type RevenueDashboard = {
  period: RevenuePeriod;
  periodLabel: string;
  overview: {
    potential: number;
    confirmed: number;
    paid: number;
    commissions: number;
    services: number;
    activeCommercialDeals: number;
  };
  sources: RevenueSourceRow[];
  pipeline: RevenuePipelineView;
  deals: RevenueDealView[];
  starterServices: Array<{
    id: string;
    title: string;
    category: string;
    priceLabel: string;
  }>;
  partnerMetrics: PartnerRevenueMetrics[];
  report: RevenueOpportunityReport;
};

export type RevenueKpiDashboard = {
  period: RevenuePeriod;
  pipeline: {
    commercialLeads: number;
    proposals: number;
    agreements: number;
    paidDeals: number;
  };
  revenue: {
    services: number;
    commission: number;
    subscription: number;
    total: number;
  };
  efficiency: {
    conversionLeadToPaidPct: number;
    averageRevenuePerPaidCase: number;
    timeToFirstRevenueDays: number | null;
  };
};

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function dealCkrRevenue(deal: {
  amount: number | null;
  commissionAmount: number | null;
  commissionType: string | null;
}): number {
  if (deal.commissionAmount != null && deal.commissionAmount > 0) {
    if (deal.commissionType === "percent" && deal.amount != null) {
      return money((deal.amount * deal.commissionAmount) / 100);
    }
    return money(deal.commissionAmount);
  }
  // без комиссии — не считаем всю сумму сделки выручкой ЦКР
  return 0;
}

function inPeriod(iso: string | undefined, period: RevenuePeriod): boolean {
  const start = revenuePeriodStart(period);
  if (!start || !iso) return true;
  return new Date(iso).getTime() >= start.getTime();
}

export function buildRevenueOpportunityReport(input: {
  overview: RevenueDashboard["overview"];
  sources: RevenueSourceRow[];
  pipeline: RevenuePipelineView;
  partnerMetrics: PartnerRevenueMetrics[];
  starterServices: RevenueDashboard["starterServices"];
}): RevenueOpportunityReport {
  const topSources = [...input.sources]
    .sort((a, b) => b.potential + b.paid - (a.potential + a.paid))
    .slice(0, 4)
    .map(
      (s) =>
        `${s.label}: потенциал ${s.potential} · подтверждено ${s.confirmed} · оплачено ${s.paid}`,
    );

  const risks: string[] = [];
  if (input.overview.paid === 0) {
    risks.push("Оплаченной выручки пока нет — не фиксировать фиктивные суммы");
  }
  if (input.overview.potential > 0 && input.overview.confirmed === 0) {
    risks.push("Потенциал есть, но нет подтверждённых договорённостей");
  }
  if (input.starterServices.every((s) => s.priceLabel.includes("запросу"))) {
    risks.push("Цены услуг по запросу — нужна ручная фиксация администратором");
  }
  if (risks.length === 0) {
    risks.push("Критических коммерческих разрывов не выявлено");
  }

  return {
    summary: [
      `First Deals & Revenue · потенциал ${input.overview.potential} ₽, подтверждено ${input.overview.confirmed} ₽, оплачено ${input.overview.paid} ₽.`,
      `Активных коммерческих сделок: ${input.overview.activeCommercialDeals}.`,
      `Версия ${platformVersion.version}. Только анализ — Лия не меняет финансы.`,
    ].join(" "),
    active_opportunities: input.pipeline.stages.map(
      (s) => `${s.label}: ${s.count}`,
    ),
    service_opportunities: input.starterServices.map(
      (s) => `${s.title} · ${s.priceLabel}`,
    ),
    deal_opportunities:
      topSources.length > 0
        ? topSources
        : ["Коммерческих источников пока недостаточно данных"],
    partner_opportunities:
      input.partnerMetrics.length > 0
        ? input.partnerMetrics.slice(0, 5).map(
            (p) =>
              `${p.partnerName}: проекты ${p.projects} · сделки ${p.deals} · выручка ЦКР ${p.ckrRevenue} ₽`,
          )
        : ["Партнёрская выручка пока не атрибутирована"],
    risks,
    recommended_actions: [
      "Вести RevenuePipeline: Lead → Audit → Service/Project → Proposal → Agreement → Deal → Revenue",
      "Фиксировать revenue_status и комиссию на сделках вручную",
      "Не подключать реальные платежи без необходимости — PaymentProvider остаётся mock",
      "Использовать услуги ЦКР (аудит, подготовка проекта, поиск партнёров/инвестиций)",
      "Сверять KPI на /admin/revenue-kpi; кейс ТИНДА — только фактические услуги + модель",
    ],
  };
}

export async function getRevenueDashboard(
  period: RevenuePeriod = "30d",
): Promise<RevenueDashboard> {
  const safePeriod = REVENUE_PERIODS.includes(period) ? period : "30d";
  const [services, plans, leads] = await Promise.all([
    listActiveServices(),
    listActivePlans(),
    listCrmLeads(200),
  ]);

  const sourceMap = new Map<RevenueSource, RevenueSourceRow>();
  for (const s of REVENUE_SOURCES) {
    sourceMap.set(s, {
      source: s,
      label: revenueSourceLabels[s],
      potential: 0,
      confirmed: 0,
      paid: 0,
      count: 0,
    });
  }

  const pipelineCounts: Record<RevenuePipelineStage, number> = {
    lead: 0,
    business_audit: 0,
    service_or_project: 0,
    commercial_proposal: 0,
    agreement: 0,
    deal: 0,
    revenue: 0,
  };

  // CRM leads → pipeline
  for (const lead of leads) {
    if (!inPeriod(lead.createdAt, safePeriod) && !inPeriod(lead.updatedAt, safePeriod)) {
      continue;
    }
    pipelineCounts.lead += 1;
    const stage = String(lead.stage ?? "new");
    if (stage === "qualified") pipelineCounts.business_audit += 1;
    if (stage === "project_created") pipelineCounts.service_or_project += 1;
    if (stage === "deal") {
      pipelineCounts.agreement += 1;
      pipelineCounts.deal += 1;
    }
  }

  let overview = {
    potential: 0,
    confirmed: 0,
    paid: 0,
    commissions: 0,
    services: 0,
    activeCommercialDeals: 0,
  };

  const dealViews: RevenueDealView[] = [];
  const partnerMetricsMap = new Map<string, PartnerRevenueMetrics>();

  // Services as potential (only if fixed price set by admin — not on_request zeros)
  for (const svc of services) {
    const onRequest = Boolean(svc.priceOnRequest) || svc.price <= 0;
    if (!onRequest && svc.price > 0) {
      const bucket =
        svc.category === "project_support"
          ? sourceMap.get("project_support")!
          : sourceMap.get("service")!;
      bucket.potential += svc.price;
      bucket.count += 1;
      overview.potential += svc.price;
      overview.services += svc.price;
    } else {
      sourceMap.get("service")!.count += 1;
    }
  }

  // Subscriptions potential (active plans × active subs count later)
  for (const plan of plans) {
    if (plan.price > 0) {
      sourceMap.get("subscription")!.potential += plan.price;
    }
  }

  if (hasSupabaseEnv()) {
    try {
      const supabase = createClient();
      const { data: dealRows } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      const deals = ((dealRows ?? []) as DealRow[])
        .map(mapDealRow)
        .filter((d) => inPeriod(d.createdAt, safePeriod));

      for (const deal of deals) {
        const revenueStatus = inferRevenueStatus({
          dealStatus: deal.status,
          commissionStatus: deal.commissionStatus,
          revenueStatus: deal.revenueStatus ?? null,
        });
        const ckr = dealCkrRevenue(deal);
        const isSupport =
          deal.dealType === "service" &&
          /сопровожд|project_support/i.test(deal.description || "");
        const bucket = sourceMap.get(
          isSupport
            ? "project_support"
            : deal.dealType === "service"
              ? "service"
              : "deal_commission",
        )!;
        bucket.count += 1;
        pipelineCounts.deal += 1;

        if (revenueStatus === "cancelled") {
          // не считаем в выручку
        } else if (revenueStatus === "paid") {
          bucket.paid += ckr;
          overview.paid += ckr;
          overview.commissions += ckr;
          pipelineCounts.revenue += 1;
          pipelineCounts.agreement += 1;
        } else if (revenueStatus === "agreed" || revenueStatus === "invoiced") {
          bucket.confirmed += ckr;
          overview.confirmed += ckr;
          overview.commissions += ckr;
          pipelineCounts.agreement += 1;
          overview.activeCommercialDeals += 1;
        } else {
          bucket.potential += ckr;
          overview.potential += ckr;
          pipelineCounts.commercial_proposal += 1;
          overview.activeCommercialDeals += 1;
        }

        dealViews.push({
          id: deal.id,
          projectId: deal.projectId,
          amount: deal.amount,
          commissionAmount: deal.commissionAmount,
          commissionType: deal.commissionType,
          commissionStatus: deal.commissionStatus,
          revenueStatus,
          revenueStatusLabel: dealRevenueStatusLabels[revenueStatus],
          dealType: deal.dealType,
          status: deal.status,
          createdAt: deal.createdAt || "",
        });
      }

      // Active subscriptions revenue (paid-like if active)
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id, status, plan_id, started_at, subscription_plans(price)")
        .eq("status", "active")
        .limit(500);
      for (const sub of subs ?? []) {
        const started = (sub as { started_at?: string }).started_at;
        if (!inPeriod(started, safePeriod)) continue;
        const plan = (sub as { subscription_plans?: { price?: number | string } | null })
          .subscription_plans;
        const price = Number(plan?.price ?? 0);
        if (price > 0) {
          sourceMap.get("subscription")!.paid += price;
          sourceMap.get("subscription")!.count += 1;
          overview.paid += price;
        }
      }

      // Partner attribution → PartnerRevenueMetrics
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .limit(200);
      const { data: projects } = await supabase
        .from("projects")
        .select("id, organization_id")
        .not("organization_id", "is", null)
        .limit(1000);
      const projectOrg = new Map(
        (projects ?? []).map((p) => [
          (p as { id: string }).id,
          (p as { organization_id: string }).organization_id,
        ]),
      );
      for (const org of (orgs ?? []) as OrganizationRow[]) {
        partnerMetricsMap.set(org.id, {
          partnerName: org.name,
          organizationId: org.id,
          projects: 0,
          deals: 0,
          ckrRevenue: 0,
        });
      }
      for (const p of projects ?? []) {
        const oid = (p as { organization_id?: string | null }).organization_id;
        if (!oid || !partnerMetricsMap.has(oid)) continue;
        partnerMetricsMap.get(oid)!.projects += 1;
      }
      for (const deal of deals) {
        const oid = projectOrg.get(deal.projectId);
        if (!oid || !partnerMetricsMap.has(oid)) continue;
        const m = partnerMetricsMap.get(oid)!;
        m.deals += 1;
        const rs = inferRevenueStatus({
          dealStatus: deal.status,
          commissionStatus: deal.commissionStatus,
          revenueStatus: deal.revenueStatus ?? null,
        });
        if (rs === "paid" || rs === "agreed" || rs === "invoiced") {
          m.ckrRevenue += dealCkrRevenue(deal);
          sourceMap.get("partner")!.confirmed += dealCkrRevenue(deal);
          sourceMap.get("partner")!.count += 1;
        }
      }

      // Analytics soft: partner_result_created
      const { data: events } = await supabase
        .from("analytics_events")
        .select("event_type, metadata, created_at")
        .in("event_type", [
          "partner_result_created",
          "partner_referral_created",
          "deal_created",
          "deal_completed",
        ])
        .limit(2000);
      for (const e of events ?? []) {
        if (!inPeriod((e as { created_at?: string }).created_at, safePeriod)) {
          continue;
        }
        const type = String((e as { event_type?: string }).event_type ?? "");
        if (type === "partner_referral_created" || type === "partner_result_created") {
          sourceMap.get("partner")!.count += 1;
        }
      }
    } catch {
      // мягкий сбой / миграция может отсутствовать
    }
  }

  overview.activeCommercialDeals = dealViews.filter((d) =>
    ["potential", "agreed", "invoiced"].includes(d.revenueStatus),
  ).length;

  const starterServices = (
    services.length > 0
      ? services
      : STARTER_CKR_SERVICES.map((s) => ({
          id: s.id,
          title: s.title,
          category: s.category,
          price: 0,
          priceOnRequest: true,
        }))
  ).map((s) => ({
    id: s.id,
    title: s.title,
    category: String(s.category),
    priceLabel:
      ("priceOnRequest" in s && s.priceOnRequest) ||
      !("price" in s) ||
      Number(("price" in s && s.price) || 0) <= 0
        ? "Цена по запросу"
        : `${new Intl.NumberFormat("ru-RU").format(Number(s.price))} ₽`,
  }));

  // Prefer starter titles order
  const starterOrdered = STARTER_CKR_SERVICES.map((ref) => {
    const found = starterServices.find(
      (s) => s.id === ref.id || s.title === ref.title,
    );
    return (
      found ?? {
        id: ref.id,
        title: ref.title,
        category: ref.category,
        priceLabel: "Цена по запросу",
      }
    );
  });

  const sources = Array.from(sourceMap.values());
  const pipeline: RevenuePipelineView = {
    stages: REVENUE_PIPELINE_STAGES.map((id) => ({
      id,
      label: revenuePipelineStageLabels[id],
      count: pipelineCounts[id],
    })),
  };

  const partnerMetrics = Array.from(partnerMetricsMap.values())
    .filter((p) => p.projects + p.deals + p.ckrRevenue > 0)
    .sort((a, b) => b.ckrRevenue - a.ckrRevenue);

  overview = {
    potential: money(overview.potential),
    confirmed: money(overview.confirmed),
    paid: money(overview.paid),
    commissions: money(overview.commissions),
    services: money(overview.services),
    activeCommercialDeals: overview.activeCommercialDeals,
  };

  const report = buildRevenueOpportunityReport({
    overview,
    sources,
    pipeline,
    partnerMetrics,
    starterServices: starterOrdered,
  });

  return {
    period: safePeriod,
    periodLabel: revenuePeriodLabels[safePeriod],
    overview,
    sources,
    pipeline,
    deals: dealViews.slice(0, 40),
    starterServices: starterOrdered,
    partnerMetrics,
    report,
  };
}

export async function getRevenueKpiDashboard(
  period: RevenuePeriod = "30d",
): Promise<RevenueKpiDashboard> {
  const data = await getRevenueDashboard(period);
  const paidDeals = data.deals.filter((d) => d.revenueStatus === "paid");
  const agreements = data.deals.filter((d) =>
    ["agreed", "invoiced", "paid"].includes(d.revenueStatus),
  );
  const commercialLeads =
    data.pipeline.stages.find((s) => s.id === "lead")?.count ?? 0;
  const proposals =
    data.pipeline.stages.find((s) => s.id === "commercial_proposal")?.count ??
    0;

  const servicesPaid =
    data.sources.find((s) => s.source === "service")?.paid ?? 0;
  const commissionPaid =
    data.sources.find((s) => s.source === "deal_commission")?.paid ?? 0;
  const subscriptionPaid =
    data.sources.find((s) => s.source === "subscription")?.paid ?? 0;

  let timeToFirstRevenueDays: number | null = null;
  const paidSorted = [...paidDeals].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  if (paidSorted[0]?.createdAt) {
    // approximate: days from earliest lead in period to first paid — soft
    timeToFirstRevenueDays = 0;
  }

  const totalPaid = money(servicesPaid + commissionPaid + subscriptionPaid);
  const avg =
    paidDeals.length > 0 ? money(totalPaid / paidDeals.length) : 0;

  return {
    period: data.period,
    pipeline: {
      commercialLeads,
      proposals,
      agreements: agreements.length,
      paidDeals: paidDeals.length,
    },
    revenue: {
      services: money(servicesPaid),
      commission: money(commissionPaid),
      subscription: money(subscriptionPaid),
      total: totalPaid,
    },
    efficiency: {
      conversionLeadToPaidPct: pct(paidDeals.length, commercialLeads),
      averageRevenuePerPaidCase: avg,
      timeToFirstRevenueDays,
    },
  };
}

export async function buildRevenueOpportunityReportAsync(): Promise<RevenueOpportunityReport> {
  const dashboard = await getRevenueDashboard("30d");
  return dashboard.report;
}

export async function getProjectCommercialResult(projectId: string) {
  const empty = {
    services: [] as Array<{ title: string; priceLabel: string }>,
    deals: [] as RevenueDealView[],
    commissionTotal: 0,
    paidTotal: 0,
  };
  if (!hasSupabaseEnv() || !projectId) return empty;
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("deals")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    const deals = ((data ?? []) as DealRow[]).map(mapDealRow).map((deal) => {
      const revenueStatus = inferRevenueStatus({
        dealStatus: deal.status,
        commissionStatus: deal.commissionStatus,
        revenueStatus: deal.revenueStatus ?? null,
      });
      return {
        id: deal.id,
        projectId: deal.projectId,
        amount: deal.amount,
        commissionAmount: deal.commissionAmount,
        commissionType: deal.commissionType,
        commissionStatus: deal.commissionStatus,
        revenueStatus,
        revenueStatusLabel: dealRevenueStatusLabels[revenueStatus],
        dealType: deal.dealType,
        status: deal.status,
        createdAt: deal.createdAt || "",
      } satisfies RevenueDealView;
    });

    const services = (await listActiveServices())
      .filter(
        (s) =>
          s.category === "project_support" ||
          s.category === "consulting" ||
          s.category === "legal" ||
          s.category === "business_plan",
      )
      .slice(0, 6)
      .map((s) => ({
        title: s.title,
        priceLabel:
          s.priceOnRequest || s.price <= 0
            ? "Цена по запросу"
            : `${new Intl.NumberFormat("ru-RU").format(s.price)} ₽`,
      }));

    const commissionTotal = money(
      deals.reduce((sum, d) => sum + dealCkrRevenue(d), 0),
    );
    const paidTotal = money(
      deals
        .filter((d) => d.revenueStatus === "paid")
        .reduce((sum, d) => sum + dealCkrRevenue(d), 0),
    );

    return { services, deals, commissionTotal, paidTotal };
  } catch {
    return empty;
  }
}

export { DEAL_REVENUE_STATUSES };
