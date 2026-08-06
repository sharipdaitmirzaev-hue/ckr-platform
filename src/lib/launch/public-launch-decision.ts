/**
 * Public Launch Decision Gate — готовность к публичному запуску (этап 57).
 * Только аналитика поверх open_beta + open_beta_growth + improvements.
 */

import { OPEN_BETA_WAVE_ID } from "@/config/open-beta";
import {
  readinessStatusLabels,
  type ReadinessCheckItem,
  type ReadinessStatus,
} from "@/config/open-beta-readiness";
import {
  BUSINESS_LAUNCH_CHECKS,
  LAUNCH_RISK_CATEGORIES,
  PUBLIC_LAUNCH_CRITERIA,
  PUBLIC_PRODUCT_CHECKS,
  publicLaunchDecisionHints,
  publicLaunchDecisionLabels,
  type LaunchRiskCategory,
  type PublicLaunchDecision,
  type RiskImpact,
  type RiskProbability,
} from "@/config/public-launch-decision";
import { platformVersion } from "@/config/version";
import { getImprovementsDashboard } from "@/lib/improvements/queries";
import { getOpenBetaDashboard } from "@/lib/launch/open-beta";
import { getOpenBetaGrowthDashboard } from "@/lib/launch/open-beta-growth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { PublicLaunchDecisionRow } from "@/types/database";
import type { PublicLaunchDecisionReport } from "@/types/lia";

export type UserReadinessBlock = {
  growth: {
    registrations: number;
    activeUsers: number;
    retentionD7: number;
    retentionD30: number;
    returningUsers: number;
    cohortSize: number;
  };
  activation: {
    firstProject: number;
    firstInteraction: number;
    liaUsed: number;
    liaPct: number;
  };
  roles: {
    entrepreneurs: string[];
    experts: string[];
    investors: string[];
    organizations: string[];
  };
  aggregateStatus: ReadinessStatus;
};

export type EcosystemLaunchReadiness = {
  projects: number;
  experts: number;
  investors: number;
  organizations: number;
  connections: number;
  applications: number;
  deals: number;
  interests: number;
  createsRealInteractions: boolean;
  aggregateStatus: ReadinessStatus;
  signals: string[];
};

export type BusinessLaunchReadiness = {
  checks: ReadinessCheckItem[];
  aggregateStatus: ReadinessStatus;
};

export type LaunchRiskItem = {
  id: string;
  category: LaunchRiskCategory;
  problem: string;
  impact: RiskImpact;
  probability: RiskProbability;
  actionPlan: string;
};

export type LaunchRiskReview = {
  items: LaunchRiskItem[];
  blockingCount: number;
  elevatedCount: number;
  aggregateStatus: ReadinessStatus;
};

export type PublicLaunchDecisionRecord = {
  id: string;
  decision: PublicLaunchDecision;
  comment: string;
  responsible: string;
  responsibleId: string | null;
  date: string;
  waveId: string | null;
};

export type PublicLaunchDecisionBlock = {
  suggested: PublicLaunchDecision;
  label: string;
  hint: string;
  readiness: number;
  indicators: string[];
  problems: string[];
  recommendations: string[];
};

export type PublicLaunchDecisionDashboard = {
  product: ReadinessCheckItem[];
  productStatus: ReadinessStatus;
  users: UserReadinessBlock;
  ecosystem: EcosystemLaunchReadiness;
  business: BusinessLaunchReadiness;
  riskReview: LaunchRiskReview;
  decision: PublicLaunchDecisionBlock;
  latestDecision: PublicLaunchDecisionRecord | null;
  report: PublicLaunchDecisionReport;
  criteria: readonly string[];
  waveId: string | null;
};

function statusToneScore(status: ReadinessStatus): number {
  if (status === "ready") return 100;
  if (status === "needs_attention") return 55;
  return 15;
}

function aggregateStatus(items: ReadinessCheckItem[]): ReadinessStatus {
  if (items.some((i) => i.status === "blocked")) return "blocked";
  if (items.some((i) => i.status === "needs_attention")) {
    return "needs_attention";
  }
  return "ready";
}

function formatCheckLine(item: ReadinessCheckItem): string {
  return `[${readinessStatusLabels[item.status]}] ${item.label}: ${item.detail}`;
}

export function decidePublicLaunch(input: {
  productBlocked: boolean;
  businessBlocked: boolean;
  riskBlocked: boolean;
  openCritical: number;
  d7: number;
  d30: number;
  registered: number;
  applications: number;
  interests: number;
  deals: number;
  growthDecision: string;
  healthCritical: boolean;
}): PublicLaunchDecision {
  if (
    input.productBlocked ||
    input.businessBlocked ||
    input.riskBlocked ||
    input.openCritical > 0 ||
    input.healthCritical ||
    input.registered < 8
  ) {
    return "improve_product";
  }
  if (
    input.d7 >= 25 &&
    input.d30 >= 15 &&
    input.applications + input.interests + input.deals >= 8 &&
    (input.growthDecision === "scale_public" ||
      input.applications + input.deals >= 5)
  ) {
    return "public_launch";
  }
  if (input.d7 >= 15 && input.openCritical === 0) {
    return "continue_beta";
  }
  return "improve_product";
}

function buildProductChecks(input: {
  hasEnv: boolean;
  openCritical: number;
  liaPct: number;
  projectsPublished: number;
  registered: number;
}): ReadinessCheckItem[] {
  return PUBLIC_PRODUCT_CHECKS.map((item) => {
    if (item.id === "lia") {
      const status: ReadinessStatus =
        input.liaPct >= 35
          ? "ready"
          : input.liaPct >= 15
            ? "needs_attention"
            : "blocked";
      return {
        id: item.id,
        label: item.label,
        status,
        detail: `${item.readyDetail} · Лия ${input.liaPct}%`,
        href: item.href,
      };
    }
    if (item.id === "core_scenarios") {
      const status: ReadinessStatus =
        input.projectsPublished >= 3
          ? "ready"
          : input.projectsPublished >= 1
            ? "needs_attention"
            : "blocked";
      return {
        id: item.id,
        label: item.label,
        status,
        detail: `${item.readyDetail} · опубликовано проектов: ${input.projectsPublished}`,
        href: item.href,
      };
    }
    if (item.id === "registration") {
      const status: ReadinessStatus =
        input.registered >= 10
          ? "ready"
          : input.registered >= 3
            ? "needs_attention"
            : "blocked";
      return {
        id: item.id,
        label: item.label,
        status,
        detail: `${item.readyDetail} · зарегистрировано: ${input.registered}`,
        href: item.href,
      };
    }
    if (!input.hasEnv && (item.id === "dashboards" || item.id === "lia")) {
      return {
        id: item.id,
        label: item.label,
        status: "blocked",
        detail: "Supabase env не настроен — кабинеты/Лия недоступны в полном объёме.",
        href: item.href,
      };
    }
    if (input.openCritical > 0 && item.id === "public_site") {
      return {
        id: item.id,
        label: item.label,
        status: "needs_attention",
        detail: `${item.readyDetail} · открыты Critical: ${input.openCritical}`,
        href: "/admin/improvements",
      };
    }
    return {
      id: item.id,
      label: item.label,
      status: "ready" as const,
      detail: item.readyDetail,
      href: item.href,
    };
  });
}

function buildBusinessLaunchReadiness(input: {
  projects: number;
  organizations: number;
  deals: number;
  hasPricingSignal: boolean;
}): BusinessLaunchReadiness {
  const checks: ReadinessCheckItem[] = BUSINESS_LAUNCH_CHECKS.map((item) => {
    if (item.id === "tinda_case") {
      const status: ReadinessStatus =
        input.projects >= 5
          ? "ready"
          : input.projects >= 1
            ? "needs_attention"
            : "blocked";
      return {
        id: item.id,
        label: item.label,
        status,
        detail: `${item.readyDetail} · проектов в экосистеме: ${input.projects}`,
        href: item.href,
      };
    }
    if (item.id === "partner_readiness") {
      const status: ReadinessStatus =
        input.organizations >= 3
          ? "ready"
          : input.organizations >= 1
            ? "needs_attention"
            : "blocked";
      return {
        id: item.id,
        label: item.label,
        status,
        detail: `${item.readyDetail} · организаций: ${input.organizations}`,
        href: item.href,
      };
    }
    if (item.id === "commercial_scenarios" || item.id === "monetization") {
      return {
        id: item.id,
        label: item.label,
        status: input.hasPricingSignal ? "ready" : "needs_attention",
        detail: item.readyDetail,
        href: item.href,
      };
    }
    if (item.id === "value_clarity") {
      return {
        id: item.id,
        label: item.label,
        status: input.deals + input.projects >= 3 ? "ready" : "needs_attention",
        detail: item.readyDetail,
        href: item.href,
      };
    }
    return {
      id: item.id,
      label: item.label,
      status: "ready" as const,
      detail: item.readyDetail,
      href: item.href,
    };
  });
  return { checks, aggregateStatus: aggregateStatus(checks) };
}

function buildLaunchRiskReview(input: {
  openCritical: number;
  openHigh: number;
  d7: number;
  d30: number;
  funnelDrops: string[];
  healthStatus: string;
  applications: number;
  deals: number;
  businessBlocked: boolean;
  productBlocked: boolean;
}): LaunchRiskReview {
  const items: LaunchRiskItem[] = [];

  if (input.productBlocked) {
    items.push({
      id: "product-blocked",
      category: "Product",
      problem: "Есть blocked-проверки Product Readiness",
      impact: "critical",
      probability: "high",
      actionPlan: "Закрыть блокеры публичных путей и основных сценариев",
    });
  } else if (input.openHigh > 2) {
    items.push({
      id: "product-high",
      category: "Product",
      problem: `Открытых High improvements/issues: ${input.openHigh}`,
      impact: "high",
      probability: "medium",
      actionPlan: "Приоритизировать High в /admin/improvements до public",
    });
  } else {
    items.push({
      id: "product-ok",
      category: "Product",
      problem: "Критических продуктовых блокеров не выявлено",
      impact: "low",
      probability: "low",
      actionPlan: "Держать мониторинг UX и feedback категорий",
    });
  }

  if (input.openCritical > 0 || input.healthStatus === "critical") {
    items.push({
      id: "tech-critical",
      category: "Technical",
      problem:
        input.openCritical > 0
          ? `Открытые Critical: ${input.openCritical}`
          : "Open Beta Health = critical",
      impact: "critical",
      probability: "high",
      actionPlan: "Не открывать public до закрытия Critical и стабилизации health",
    });
  } else {
    items.push({
      id: "tech-ok",
      category: "Technical",
      problem: "Critical = 0; health не в critical",
      impact: "low",
      probability: "low",
      actionPlan: "Продолжать lint/build и env checklist перед каждым релизом",
    });
  }

  if (input.d7 < 15 || input.d30 < 10) {
    items.push({
      id: "user-retention",
      category: "User",
      problem: `Слабое удержание: D7 ${input.d7}% · D30 ${input.d30}%`,
      impact: "high",
      probability: "high",
      actionPlan: "Усилить ценные действия и онбординг (см. Open Beta Growth)",
    });
  } else if (input.d7 < 25) {
    items.push({
      id: "user-retention-mid",
      category: "User",
      problem: `D7 ${input.d7}% ниже порога масштабирования (25%)`,
      impact: "medium",
      probability: "medium",
      actionPlan: "Продолжить Open Beta и закрепить цепочки возврата",
    });
  } else {
    items.push({
      id: "user-ok",
      category: "User",
      problem: `Удержание приемлемо: D7 ${input.d7}% · D30 ${input.d30}%`,
      impact: "low",
      probability: "low",
      actionPlan: "Мониторить retention по ролям на /admin/open-beta-growth",
    });
  }

  if (input.funnelDrops.length > 0) {
    items.push({
      id: "user-funnel",
      category: "User",
      problem: input.funnelDrops[0]!,
      impact: "medium",
      probability: "medium",
      actionPlan: "Сократить drop-off на проблемном шаге воронки Open Beta",
    });
  }

  if (input.businessBlocked) {
    items.push({
      id: "business-blocked",
      category: "Business",
      problem: "BusinessLaunchReadiness содержит blocked",
      impact: "high",
      probability: "medium",
      actionPlan: "Усилить кейс ТИНДА, партнёров и ясность ценности",
    });
  } else {
    items.push({
      id: "business-ok",
      category: "Business",
      problem: "Бизнес-готовность без блокеров",
      impact: "low",
      probability: "low",
      actionPlan: "Подготовить коммуникацию public и коммерческие сценарии",
    });
  }

  if (input.applications + input.deals < 3) {
    items.push({
      id: "eco-weak",
      category: "Ecosystem",
      problem: `Мало реальных связей: заявки ${input.applications}, сделки ${input.deals}`,
      impact: "high",
      probability: "medium",
      actionPlan: "Сфокусировать matching и заявки до расширения public",
    });
  } else {
    items.push({
      id: "eco-ok",
      category: "Ecosystem",
      problem: `Есть взаимодействия: заявки ${input.applications}, сделки ${input.deals}`,
      impact: "low",
      probability: "low",
      actionPlan: "Масштабировать качество match, не только объём",
    });
  }

  // Ensure all categories represented
  for (const cat of LAUNCH_RISK_CATEGORIES) {
    if (!items.some((i) => i.category === cat)) {
      items.push({
        id: `${cat.toLowerCase()}-placeholder`,
        category: cat,
        problem: "Дополнительных рисков не зафиксировано",
        impact: "low",
        probability: "low",
        actionPlan: "Продолжать мониторинг категории",
      });
    }
  }

  const blockingCount = items.filter(
    (i) => i.impact === "critical" || (i.impact === "high" && i.probability === "high"),
  ).length;
  const elevatedCount = items.filter(
    (i) => i.impact === "high" || i.impact === "medium",
  ).length;

  const aggregateStatus: ReadinessStatus =
    blockingCount > 0
      ? "blocked"
      : elevatedCount > 2
        ? "needs_attention"
        : "ready";

  return { items, blockingCount, elevatedCount, aggregateStatus };
}

export function buildPublicLaunchDecisionReport(input: {
  product: ReadinessCheckItem[];
  productStatus: ReadinessStatus;
  users: UserReadinessBlock;
  ecosystem: EcosystemLaunchReadiness;
  business: BusinessLaunchReadiness;
  riskReview: LaunchRiskReview;
  decision: PublicLaunchDecisionBlock;
}): PublicLaunchDecisionReport {
  return {
    summary: [
      `Public Launch Decision Gate · рекомендация: ${input.decision.suggested}.`,
      `Product: ${readinessStatusLabels[input.productStatus]} · Users: ${readinessStatusLabels[input.users.aggregateStatus]} · Ecosystem: ${readinessStatusLabels[input.ecosystem.aggregateStatus]} · Business: ${readinessStatusLabels[input.business.aggregateStatus]}.`,
      `Версия ${platformVersion.version}. Лия только анализирует — решение фиксирует команда.`,
    ].join(" "),
    product_status: input.product.map(formatCheckLine),
    user_status: [
      `Регистрации: ${input.users.growth.registrations}`,
      `Активные: ${input.users.growth.activeUsers}`,
      `D7 ${input.users.growth.retentionD7}% · D30 ${input.users.growth.retentionD30}%`,
      `Вернулись: ${input.users.growth.returningUsers} / ${input.users.growth.cohortSize}`,
      `Первый проект (экосистема): ${input.users.activation.firstProject}`,
      `Первое взаимодействие (заявки+интересы): ${input.users.activation.firstInteraction}`,
      `Лия: ${input.users.activation.liaUsed} (${input.users.activation.liaPct}%)`,
      ...input.users.roles.entrepreneurs.map((s) => `Предприниматели: ${s}`),
      ...input.users.roles.experts.map((s) => `Эксперты: ${s}`),
      ...input.users.roles.investors.map((s) => `Инвесторы: ${s}`),
      ...input.users.roles.organizations.map((s) => `Организации: ${s}`),
    ],
    ecosystem_status: [
      `Проекты: ${input.ecosystem.projects}`,
      `Эксперты: ${input.ecosystem.experts}`,
      `Инвесторы: ${input.ecosystem.investors}`,
      `Организации: ${input.ecosystem.organizations}`,
      `Связи: ${input.ecosystem.connections}`,
      `Заявки: ${input.ecosystem.applications}`,
      `Сделки: ${input.ecosystem.deals}`,
      input.ecosystem.createsRealInteractions
        ? "ЦКР создаёт реальные взаимодействия"
        : "Реальных взаимодействий пока недостаточно",
      ...input.ecosystem.signals,
    ],
    business_status: input.business.checks.map(formatCheckLine),
    risks: input.riskReview.items.map(
      (r) =>
        `[${r.category}] ${r.problem} · влияние ${r.impact} · вероятность ${r.probability} → ${r.actionPlan}`,
    ),
    recommendation: [
      `${publicLaunchDecisionLabels[input.decision.suggested]} (${input.decision.suggested})`,
      input.decision.hint,
      ...input.decision.recommendations,
    ],
  };
}

function mapLatestDecision(
  row: PublicLaunchDecisionRow | null,
  responsibleName: string | null,
): PublicLaunchDecisionRecord | null {
  if (!row) return null;
  return {
    id: row.id,
    decision: row.decision,
    comment: row.notes,
    responsible: responsibleName || "Команда ЦКР",
    responsibleId: row.created_by,
    date: row.created_at,
    waveId: row.wave_id,
  };
}

export async function getPublicLaunchDecisionDashboard(): Promise<PublicLaunchDecisionDashboard> {
  const [openBeta, growth, improvements] = await Promise.all([
    getOpenBetaDashboard(),
    getOpenBetaGrowthDashboard(),
    getImprovementsDashboard(),
  ]);

  const openCritical =
    improvements.problems.filter(
      (p) =>
        p.severity === "critical" &&
        !["done", "closed", "resolved"].includes(p.status),
    ).length +
    improvements.improvements.filter(
      (i) =>
        i.priority === "critical" &&
        (i.status === "planned" || i.status === "in_progress"),
    ).length;

  const openHigh =
    improvements.problems.filter(
      (p) =>
        p.severity === "high" &&
        (p.status === "open" || p.status === "in_progress"),
    ).length +
    improvements.improvements.filter(
      (i) =>
        i.priority === "high" &&
        (i.status === "planned" || i.status === "in_progress"),
    ).length;

  const product = buildProductChecks({
    hasEnv: hasSupabaseEnv(),
    openCritical,
    liaPct: openBeta.metrics.liaPct,
    projectsPublished: openBeta.metrics.projectsPublished,
    registered: openBeta.users.registered,
  });
  const productStatus = aggregateStatus(product);

  const roleActive = (key: string) =>
    openBeta.roles.find((r) => r.key === key)?.active ?? 0;
  const roleRegistered = (key: string) =>
    openBeta.roles.find((r) => r.key === key)?.registered ?? 0;

  const users: UserReadinessBlock = {
    growth: {
      registrations: growth.growth.newRegistrations || openBeta.users.registered,
      activeUsers: growth.growth.activeUsers || openBeta.users.active,
      retentionD7: growth.retention.overall[7],
      retentionD30: growth.retention.overall[30],
      returningUsers: growth.retention.returningUsers,
      cohortSize: growth.retention.cohortSize,
    },
    activation: {
      firstProject: openBeta.metrics.projectsCreated,
      firstInteraction:
        openBeta.metrics.applications + openBeta.metrics.interests,
      liaUsed: openBeta.metrics.liaUsed,
      liaPct: openBeta.metrics.liaPct,
    },
    roles: {
      entrepreneurs: [
        `Проекты: ${openBeta.metrics.projectsCreated}`,
        `Заявки: ${openBeta.metrics.applications}`,
        `Активных: ${roleActive("entrepreneurs")} · рег. ${roleRegistered("entrepreneurs")}`,
        `D7: ${growth.retention.byRole.entrepreneurs[7]}%`,
      ],
      experts: [
        `Профили/активных: ${roleActive("experts")}`,
        `Запросы/взаимодействия: ${openBeta.metrics.expertInteractions}`,
        `Рег.: ${roleRegistered("experts")}`,
        `D7: ${growth.retention.byRole.experts[7]}%`,
      ],
      investors: [
        `Интересы: ${openBeta.metrics.interests}`,
        `Взаимодействия/заявки: ${openBeta.metrics.applications}`,
        `Активных: ${roleActive("investors")}`,
        `D7: ${growth.retention.byRole.investors[7]}%`,
      ],
      organizations: [
        `Проекты/сделки: ${openBeta.metrics.deals}`,
        `Партнёрства (сигнал deals): ${openBeta.metrics.deals}`,
        `Активных: ${roleActive("organizations")}`,
        `D7: ${growth.retention.byRole.organizations[7]}%`,
      ],
    },
    aggregateStatus: "ready",
  };

  if (
    users.growth.retentionD7 < 15 ||
    users.growth.registrations < 8 ||
    users.activation.liaPct < 15
  ) {
    users.aggregateStatus = "blocked";
  } else if (
    users.growth.retentionD7 < 25 ||
    users.activation.liaPct < 35 ||
    users.activation.firstInteraction < 3
  ) {
    users.aggregateStatus = "needs_attention";
  }

  const ecosystem: EcosystemLaunchReadiness = {
    projects: openBeta.metrics.projectsCreated,
    experts: roleActive("experts") || roleRegistered("experts"),
    investors: roleActive("investors") || roleRegistered("investors"),
    organizations:
      roleActive("organizations") || roleRegistered("organizations"),
    connections: growth.ecosystem.newConnections,
    applications: openBeta.metrics.applications,
    deals: openBeta.metrics.deals,
    interests: openBeta.metrics.interests,
    createsRealInteractions:
      openBeta.metrics.applications +
        openBeta.metrics.interests +
        openBeta.metrics.deals >=
      5,
    aggregateStatus: "ready",
    signals: [
      `Growth ecosystem: связи ${growth.ecosystem.newConnections}, взаимодействия ${growth.ecosystem.activeInteractions}`,
      `Open Beta health: ${openBeta.health.status}`,
    ],
  };
  if (!ecosystem.createsRealInteractions) {
    ecosystem.aggregateStatus =
      ecosystem.applications + ecosystem.interests > 0
        ? "needs_attention"
        : "blocked";
  }

  const business = buildBusinessLaunchReadiness({
    projects: openBeta.metrics.projectsCreated,
    organizations: ecosystem.organizations,
    deals: openBeta.metrics.deals,
    hasPricingSignal: true,
  });

  const funnelDrops = openBeta.funnel
    .filter((f) => (f.dropOffPct ?? 0) >= 30)
    .map(
      (f) => `${f.label}: потеря ${f.dropOffPct}% (−${f.dropOffCount ?? 0})`,
    );

  const riskReview = buildLaunchRiskReview({
    openCritical,
    openHigh,
    d7: growth.retention.overall[7],
    d30: growth.retention.overall[30],
    funnelDrops,
    healthStatus: openBeta.health.status,
    applications: openBeta.metrics.applications,
    deals: openBeta.metrics.deals,
    businessBlocked: business.aggregateStatus === "blocked",
    productBlocked: productStatus === "blocked",
  });

  const suggested = decidePublicLaunch({
    productBlocked: productStatus === "blocked",
    businessBlocked: business.aggregateStatus === "blocked",
    riskBlocked: riskReview.aggregateStatus === "blocked",
    openCritical,
    d7: growth.retention.overall[7],
    d30: growth.retention.overall[30],
    registered: openBeta.users.registered,
    applications: openBeta.metrics.applications,
    interests: openBeta.metrics.interests,
    deals: openBeta.metrics.deals,
    growthDecision: growth.decision.decision,
    healthCritical: openBeta.health.status === "critical",
  });

  const problems: string[] = [];
  if (productStatus !== "ready") {
    problems.push(`Product: ${readinessStatusLabels[productStatus]}`);
  }
  if (users.aggregateStatus !== "ready") {
    problems.push(`Users: ${readinessStatusLabels[users.aggregateStatus]}`);
  }
  if (ecosystem.aggregateStatus !== "ready") {
    problems.push(
      `Ecosystem: ${readinessStatusLabels[ecosystem.aggregateStatus]}`,
    );
  }
  if (business.aggregateStatus !== "ready") {
    problems.push(
      `Business: ${readinessStatusLabels[business.aggregateStatus]}`,
    );
  }
  if (riskReview.blockingCount > 0) {
    problems.push(`Блокирующих рисков: ${riskReview.blockingCount}`);
  }
  if (problems.length === 0) {
    problems.push("Критических пробелов готовности не выявлено");
  }

  const recommendations: string[] = [publicLaunchDecisionHints[suggested]];
  if (suggested === "improve_product") {
    recommendations.push("Закрыть blocked Product / Critical / retention");
    recommendations.push("Повторить Decision Gate после улучшений");
  } else if (suggested === "continue_beta") {
    recommendations.push("Донабрать когорту Open Beta Wave 1");
    recommendations.push("Усилить связи и D7/D30 на /admin/open-beta-growth");
  } else {
    recommendations.push("Зафиксировать решение формой на этой странице");
    recommendations.push("Следовать docs/public-beta-launch-plan.md (90 дней)");
  }

  const readiness = Math.round(
    (statusToneScore(productStatus) +
      statusToneScore(users.aggregateStatus) +
      statusToneScore(ecosystem.aggregateStatus) +
      statusToneScore(business.aggregateStatus) +
      statusToneScore(riskReview.aggregateStatus)) /
      5,
  );

  const decision: PublicLaunchDecisionBlock = {
    suggested,
    label: publicLaunchDecisionLabels[suggested],
    hint: publicLaunchDecisionHints[suggested],
    readiness,
    indicators: [
      `D7 ${growth.retention.overall[7]}% · D30 ${growth.retention.overall[30]}%`,
      `Рег. ${openBeta.users.registered} · активных ${openBeta.users.active}`,
      `Заявки ${openBeta.metrics.applications} · интересы ${openBeta.metrics.interests} · сделки ${openBeta.metrics.deals}`,
      `Growth decision: ${growth.decision.decision}`,
      `Версия ${platformVersion.version}`,
    ],
    problems,
    recommendations,
  };

  const report = buildPublicLaunchDecisionReport({
    product,
    productStatus,
    users,
    ecosystem,
    business,
    riskReview,
    decision,
  });

  let latestDecision: PublicLaunchDecisionRecord | null = null;
  let waveId: string | null = openBeta.wave?.id ?? OPEN_BETA_WAVE_ID;

  if (hasSupabaseEnv()) {
    try {
      const supabase = createClient();
      const { data: row } = await supabase
        .from("public_launch_decisions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const decisionRow = (row as PublicLaunchDecisionRow | null) ?? null;
      let responsibleName: string | null = null;
      if (decisionRow?.created_by) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, company_name")
          .eq("id", decisionRow.created_by)
          .maybeSingle();
        responsibleName =
          (profile as { full_name?: string | null; company_name?: string | null } | null)
            ?.full_name ||
          (profile as { company_name?: string | null } | null)?.company_name ||
          null;
      }
      latestDecision = mapLatestDecision(decisionRow, responsibleName);
      if (decisionRow?.wave_id) waveId = decisionRow.wave_id;
    } catch {
      // таблица может отсутствовать до миграции
    }
  }

  return {
    product,
    productStatus,
    users,
    ecosystem,
    business,
    riskReview,
    decision,
    latestDecision,
    report,
    criteria: PUBLIC_LAUNCH_CRITERIA,
    waveId,
  };
}

export async function buildPublicLaunchDecisionReportAsync(): Promise<PublicLaunchDecisionReport> {
  const dashboard = await getPublicLaunchDecisionDashboard();
  return dashboard.report;
}
