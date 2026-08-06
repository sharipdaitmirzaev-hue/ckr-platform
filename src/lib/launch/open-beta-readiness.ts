/**
 * Open Beta Readiness — дашборд и решение (этап 54).
 * Композиция beta-expansion + improvements + статические проверки продукта.
 */

import {
  BUSINESS_READINESS_CHECKS,
  OPEN_BETA_DECISIONS,
  PRODUCT_READINESS_CHECKS,
  TECHNICAL_CHECKLIST_ITEMS,
  USER_READINESS_ROLES,
  openBetaDecisionHints,
  openBetaDecisionLabels,
  type OpenBetaDecision,
  type ReadinessCheckItem,
  type ReadinessStatus,
  type UserReadinessRoleKey,
} from "@/config/open-beta-readiness";
import { platformVersion } from "@/config/version";
import { getImprovementsDashboard } from "@/lib/improvements/queries";
import { getBetaExpansionDashboard } from "@/lib/launch/beta-expansion";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { OpenBetaReadinessReport } from "@/types/lia";

export type UserReadinessRow = {
  key: UserReadinessRoleKey;
  label: string;
  checks: string[];
  registered: number;
  active: number;
  signal: string;
  status: ReadinessStatus;
};

export type EcosystemReadiness = {
  projects: number;
  experts: number;
  investors: number;
  organizations: number;
  connections: number;
  applications: number;
  deals: number;
};

export type OpenBetaDecisionBlock = {
  decision: OpenBetaDecision;
  label: string;
  hint: string;
  readiness: number;
  reasons: string[];
  risks: string[];
  nextSteps: string[];
};

export type OpenBetaReadinessDashboard = {
  product: ReadinessCheckItem[];
  users: UserReadinessRow[];
  ecosystem: EcosystemReadiness;
  technical: ReadinessCheckItem[];
  business: ReadinessCheckItem[];
  decision: OpenBetaDecisionBlock;
  report: OpenBetaReadinessReport;
  betaExpansion: {
    registrationPct: number;
    profilePct: number;
    liaPct: number;
    firstObjectPct: number;
    invited: number;
    registered: number;
  };
  issues: {
    openCritical: number;
    openHigh: number;
    released: number;
    planned: number;
  };
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

export function decideOpenBeta(input: {
  productBlocked: boolean;
  technicalBlocked: boolean;
  openCritical: number;
  openHigh: number;
  registrationPct: number;
  profilePct: number;
  liaPct: number;
  firstObjectPct: number;
  projects: number;
  applications: number;
  registered: number;
  businessBlocked: boolean;
}): OpenBetaDecision {
  if (
    input.productBlocked ||
    input.technicalBlocked ||
    input.businessBlocked ||
    input.openCritical > 0 ||
    input.registered < 10
  ) {
    return "needs_improvement";
  }
  if (
    input.registrationPct >= 70 &&
    input.profilePct >= 60 &&
    input.liaPct >= 40 &&
    input.firstObjectPct >= 25 &&
    input.projects >= 15 &&
    input.applications >= 3 &&
    input.openHigh <= 2
  ) {
    return "open_beta";
  }
  if (input.registrationPct >= 50 && input.openCritical === 0) {
    return "continue_beta";
  }
  return "needs_improvement";
}

function buildTechnicalChecklist(input: {
  hasEnv: boolean;
  openCritical: number;
}): ReadinessCheckItem[] {
  return TECHNICAL_CHECKLIST_ITEMS.map((item) => {
    if (item.id === "env") {
      return {
        id: item.id,
        label: item.label,
        status: input.hasEnv ? "ready" : "blocked",
        detail: input.hasEnv
          ? `${item.detail} · версия ${platformVersion.version}`
          : "Supabase env не настроен в этом окружении.",
      };
    }
    if (item.id === "errors") {
      return {
        id: item.id,
        label: item.label,
        status: input.openCritical === 0 ? "ready" : "blocked",
        detail:
          input.openCritical === 0
            ? "Открытых Critical нет."
            : `Открытых Critical: ${input.openCritical}`,
        href: "/admin/improvements",
      };
    }
    if (item.id === "security") {
      return {
        id: item.id,
        label: item.label,
        status: "needs_attention",
        detail: item.detail,
        href: "/admin/dashboard",
      };
    }
    if (item.id === "performance") {
      return {
        id: item.id,
        label: item.label,
        status: "needs_attention",
        detail: item.detail,
      };
    }
    // build / lint — оператор подтверждает перед релизом
    return {
      id: item.id,
      label: item.label,
      status: "ready",
      detail: item.detail,
    };
  });
}

function buildProductChecks(input: {
  openCritical: number;
  liaPct: number;
  registrationPct: number;
  profilePct: number;
}): ReadinessCheckItem[] {
  return PRODUCT_READINESS_CHECKS.map((item) => {
    let status: ReadinessStatus = "ready";
    let detail: string = item.readyDetail;

    if (item.id === "lia") {
      if (input.liaPct < 30) {
        status = "needs_attention";
        detail = `Лия: ${input.liaPct}% когорты — усилить первый ответ и CTA.`;
      }
    }
    if (item.id === "registration" || item.id === "onboarding") {
      if (input.registrationPct < 50 || input.profilePct < 40) {
        status = "needs_attention";
        detail = `Регистрация ${input.registrationPct}% · профиль ${input.profilePct}%.`;
      }
    }
    if (item.id === "dashboard" && input.openCritical > 0) {
      status = "blocked";
      detail = `Кабинет заблокирован Critical issues: ${input.openCritical}.`;
    }

    return {
      id: item.id,
      label: item.label,
      status,
      detail,
      href: item.href,
    };
  });
}

function buildBusinessChecks(input: {
  projects: number;
  invited: number;
  casesReady: boolean;
}): ReadinessCheckItem[] {
  return BUSINESS_READINESS_CHECKS.map((item) => {
    let status: ReadinessStatus = "ready";
    let detail: string = item.readyDetail;

    if (item.id === "cases" && input.projects < 5) {
      status = "needs_attention";
      detail = `Мало проектов для демо (${input.projects}). Кейс ТИНДА на /cases.`;
    }
    if (item.id === "invite_pipeline" && input.invited < 15) {
      status = "needs_attention";
      detail = `Пайплайн приглашений слабый: invited ${input.invited}.`;
    }
    if (item.id === "cases" && !input.casesReady) {
      status = "needs_attention";
    }

    return {
      id: item.id,
      label: item.label,
      status,
      detail,
      href: item.href,
    };
  });
}

function buildUserRows(
  beta: Awaited<ReturnType<typeof getBetaExpansionDashboard>>,
): UserReadinessRow[] {
  return (Object.keys(USER_READINESS_ROLES) as UserReadinessRoleKey[]).map(
    (key) => {
      const meta = USER_READINESS_ROLES[key];
      const role = beta.roles.find((r) => r.key === key);
      const registered = role?.registered ?? 0;
      const active = role?.active ?? 0;
      const targetMin = role?.targetMin ?? 1;

      let status: ReadinessStatus = "ready";
      let signal = `${registered} зарегистрировано · ${active} активно`;
      if (registered < Math.max(1, Math.floor(targetMin * 0.4))) {
        status = "needs_attention";
        signal = `${signal} · ниже целевого диапазона`;
      }
      if (key === "entrepreneurs" && beta.metrics.projects < 5) {
        status = "needs_attention";
        signal = `${signal} · мало проектов`;
      }
      if (key === "investors" && beta.metrics.interests < 3) {
        status = "needs_attention";
        signal = `${signal} · мало интересов`;
      }
      if (key === "experts" && beta.metrics.expertInteractions < 2) {
        status = "needs_attention";
        signal = `${signal} · мало запросов`;
      }

      return {
        key,
        label: meta.label,
        checks: meta.checks,
        registered,
        active,
        signal,
        status,
      };
    },
  );
}

function buildDecision(
  product: ReadinessCheckItem[],
  technical: ReadinessCheckItem[],
  business: ReadinessCheckItem[],
  users: UserReadinessRow[],
  ecosystem: EcosystemReadiness,
  beta: Awaited<ReturnType<typeof getBetaExpansionDashboard>>,
  issues: OpenBetaReadinessDashboard["issues"],
): OpenBetaDecisionBlock {
  const productBlocked = product.some((i) => i.status === "blocked");
  const technicalBlocked = technical.some((i) => i.status === "blocked");
  const businessBlocked = business.some((i) => i.status === "blocked");

  const decision = decideOpenBeta({
    productBlocked,
    technicalBlocked,
    businessBlocked,
    openCritical: issues.openCritical,
    openHigh: issues.openHigh,
    registrationPct: beta.metrics.registrationPct,
    profilePct: beta.metrics.profilePct,
    liaPct: beta.metrics.liaPct,
    firstObjectPct: beta.metrics.firstObjectPct,
    projects: ecosystem.projects,
    applications: ecosystem.applications,
    registered: beta.metrics.registered,
  });

  const reasons: string[] = [];
  if (decision === "open_beta") {
    reasons.push("Critical issues закрыты");
    reasons.push(
      `Активация: reg ${beta.metrics.registrationPct}% · профиль ${beta.metrics.profilePct}% · Лия ${beta.metrics.liaPct}%`,
    );
    reasons.push(
      `Экосистема: ${ecosystem.projects} проектов · ${ecosystem.applications} заявок · ${ecosystem.deals} сделок`,
    );
  } else if (decision === "continue_beta") {
    reasons.push("Нет Critical, но метрики open beta ещё не достигнуты");
    reasons.push(
      `Когорта: ${beta.metrics.registered} зарегистрированных из ${beta.metrics.invited} приглашённых`,
    );
  } else {
    if (productBlocked) reasons.push("Product Readiness: есть blocked");
    if (technicalBlocked) reasons.push("TechnicalChecklist: есть blocked");
    if (issues.openCritical > 0) {
      reasons.push(`Открытых Critical: ${issues.openCritical}`);
    }
    if (beta.metrics.registered < 10) {
      reasons.push("Слишком малая когорта для open beta");
    }
  }

  const risks: string[] = [];
  if (issues.openHigh > 0) risks.push(`High issues: ${issues.openHigh}`);
  if (beta.metrics.liaPct < 40) {
    risks.push(`Лия ${beta.metrics.liaPct}% ниже целевых 40–50%`);
  }
  if (ecosystem.deals < 1) risks.push("Нет первых сделок/партнёрств");
  if (users.some((u) => u.status !== "ready")) {
    risks.push("Часть ролей не добрала сценарии");
  }
  if (risks.length === 0) risks.push("Критических рисков по срезу нет");

  const nextSteps: string[] = [openBetaDecisionHints[decision]];
  if (decision === "open_beta") {
    nextSteps.push("Следовать docs/open-beta-launch-plan.md (первые 30 дней)");
    nextSteps.push("Контролировать активацию и Critical на /admin/open-beta-review");
  } else if (decision === "continue_beta") {
    nextSteps.push("Донабрать Beta Expansion Wave до целевых ролей");
    nextSteps.push("Усилить связи: интересы, заявки, экспертные запросы");
  } else {
    nextSteps.push("Закрыть блокеры в /admin/product-sprint и /admin/improvements");
    nextSteps.push("Повторить review после зелёного lint/build и снижения Critical");
  }

  const scores = [
    ...product.map((i) => statusToneScore(i.status)),
    ...technical.map((i) => statusToneScore(i.status)),
    ...business.map((i) => statusToneScore(i.status)),
    ...users.map((u) => statusToneScore(u.status)),
  ];
  const readiness = Math.round(
    scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1),
  );

  return {
    decision,
    label: openBetaDecisionLabels[decision],
    hint: openBetaDecisionHints[decision],
    readiness,
    reasons: reasons.length > 0 ? reasons : ["Недостаточно данных"],
    risks,
    nextSteps,
  };
}

export function buildOpenBetaReadinessReport(
  data: Omit<OpenBetaReadinessDashboard, "report">,
): OpenBetaReadinessReport {
  return {
    summary: [
      `Open Beta Readiness · версия ${platformVersion.version}.`,
      `Решение: ${data.decision.decision} (готовность ${data.decision.readiness}%).`,
      `Когорта Beta Expansion: ${data.betaExpansion.registered}/${data.betaExpansion.invited}.`,
    ].join(" "),
    product_readiness: data.product.map(
      (i) => `[${i.status}] ${i.label}: ${i.detail}`,
    ),
    user_readiness: data.users.map(
      (u) => `[${u.status}] ${u.label}: ${u.signal}`,
    ),
    ecosystem_readiness: [
      `Проекты: ${data.ecosystem.projects}`,
      `Эксперты: ${data.ecosystem.experts}`,
      `Инвесторы: ${data.ecosystem.investors}`,
      `Организации: ${data.ecosystem.organizations}`,
      `Связи (проекты+интересы): ${data.ecosystem.connections}`,
      `Заявки: ${data.ecosystem.applications}`,
      `Сделки: ${data.ecosystem.deals}`,
    ],
    risks: data.decision.risks,
    recommendations: data.decision.nextSteps,
  };
}

export async function getOpenBetaReadinessDashboard(): Promise<OpenBetaReadinessDashboard> {
  const [beta, improvements] = await Promise.all([
    getBetaExpansionDashboard(),
    getImprovementsDashboard(),
  ]);

  const openCritical = improvements.problems.filter(
    (p) =>
      (p.severity ?? "").toLowerCase() === "critical" &&
      !["done", "closed", "resolved"].includes(p.status),
  ).length;
  const openHigh = improvements.problems.filter(
    (p) =>
      (p.severity ?? "").toLowerCase() === "high" &&
      !["done", "closed", "resolved"].includes(p.status),
  ).length;
  const released = improvements.improvements.filter(
    (i) => i.status === "released",
  ).length;
  const planned = improvements.improvements.filter(
    (i) => i.status === "planned" || i.status === "in_progress",
  ).length;

  // Critical из product_improvements тоже учитываем
  const impCritical = improvements.improvements.filter(
    (i) =>
      i.priority === "critical" &&
      (i.status === "planned" || i.status === "in_progress"),
  ).length;

  const issues = {
    openCritical: openCritical + impCritical,
    openHigh,
    released,
    planned,
  };

  const product = buildProductChecks({
    openCritical: issues.openCritical,
    liaPct: beta.metrics.liaPct,
    registrationPct: beta.metrics.registrationPct,
    profilePct: beta.metrics.profilePct,
  });

  const technical = buildTechnicalChecklist({
    hasEnv: hasSupabaseEnv(),
    openCritical: issues.openCritical,
  });

  const business = buildBusinessChecks({
    projects: beta.metrics.projects,
    invited: beta.metrics.invited,
    casesReady: true,
  });

  const users = buildUserRows(beta);

  const ecosystem: EcosystemReadiness = {
    projects: beta.metrics.projects,
    experts: beta.metrics.experts || beta.metrics.expertInteractions,
    investors: beta.metrics.investors,
    organizations: beta.metrics.organizations,
    connections: beta.metrics.projects + beta.metrics.interests,
    applications: beta.metrics.applications,
    deals: beta.metrics.deals,
  };

  const decision = buildDecision(
    product,
    technical,
    business,
    users,
    ecosystem,
    beta,
    issues,
  );

  const partial = {
    product,
    users,
    ecosystem,
    technical,
    business,
    decision,
    betaExpansion: {
      registrationPct: beta.metrics.registrationPct,
      profilePct: beta.metrics.profilePct,
      liaPct: beta.metrics.liaPct,
      firstObjectPct: beta.metrics.firstObjectPct,
      invited: beta.metrics.invited,
      registered: beta.metrics.registered,
    },
    issues,
  };

  return {
    ...partial,
    report: buildOpenBetaReadinessReport(partial),
  };
}

export async function buildOpenBetaReadinessReportAsync(): Promise<OpenBetaReadinessReport> {
  const dashboard = await getOpenBetaReadinessDashboard();
  return dashboard.report;
}

export { OPEN_BETA_DECISIONS, aggregateStatus };
