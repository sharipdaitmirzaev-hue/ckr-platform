/**
 * First Users Review — анализ First Users Wave и решение (этап 51).
 * Композиция существующих данных: first-users dashboard, improvements, analytics.
 */

import { TINDA_CASE_DETAIL } from "@/config/first-users";
import {
  FIRST_USERS_REVIEW_FUNNEL,
  ISSUE_PRIORITY_ORDER,
  firstUsersDecisionHints,
  type FirstUsersDecision,
  type FirstUsersReviewFunnelKey,
  type IssuePriorityBucket,
} from "@/config/first-users-review";
import {
  FIRST_USERS_ROLE_TARGETS,
  FIRST_USERS_WAVE_NAME,
  type FirstUsersRoleKey,
} from "@/config/first-users-wave";
import { TINDA_PUBLIC_CASE } from "@/config/marketplace";
import { getImprovementsDashboard } from "@/lib/improvements/queries";
import {
  getFirstUsersDashboard,
  type FirstUsersDashboard,
  type FirstUsersJourneyRow,
} from "@/lib/launch/first-users";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  FirstUsersLiaReport,
  FirstUsersReviewReport,
} from "@/types/lia";

export type FunnelStepStats = {
  key: FirstUsersReviewFunnelKey;
  label: string;
  count: number;
  conversionFromPrevPct: number | null;
  dropOffPct: number | null;
  dropOffCount: number | null;
};

export type RoleAnalysisBlock = {
  key: FirstUsersRoleKey;
  label: string;
  registered: number;
  metrics: Array<{ label: string; value: number }>;
  checks: string[];
};

export type ProductIssueReviewItem = {
  id: string;
  title: string;
  priority: IssuePriorityBucket;
  usersAffected: number;
  impact: string;
  resolution: string;
  status: string;
  source: "product_improvements" | "pilot_issues" | "feedback";
};

export type FirstUsersDecisionBlock = {
  decision: FirstUsersDecision;
  readiness: number;
  productReadiness: string[];
  risks: string[];
  requiredImprovements: string[];
  hint: string;
};

export type TindaFirstUsersInsight = {
  caseTitle: string;
  caseHref: string;
  descriptionClear: string;
  interestSignal: string;
  questions: string[];
  notes: string[];
};

export type FirstUsersReviewDashboard = {
  waveName: string;
  funnel: FunnelStepStats[];
  roles: RoleAnalysisBlock[];
  liaReport: FirstUsersLiaReport;
  productIssues: Record<IssuePriorityBucket, ProductIssueReviewItem[]>;
  reviewReport: FirstUsersReviewReport;
  decision: FirstUsersDecisionBlock;
  tinda: TindaFirstUsersInsight;
  base: FirstUsersDashboard;
};

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function toPriority(raw: string): IssuePriorityBucket {
  const v = raw.toLowerCase();
  if (v === "critical" || v === "blocker") return "critical";
  if (v === "high") return "high";
  if (v === "low") return "low";
  return "medium";
}

function buildFunnel(base: FirstUsersDashboard): FunnelStepStats[] {
  const invited = Math.max(base.users.invited, base.journeys.length);
  const journeys = base.journeys;

  const countReached = (stepKey: string): number => {
    if (stepKey === "invited") return invited;
    return journeys.filter((j) =>
      j.completedSteps.includes(
        stepKey as FirstUsersJourneyRow["completedSteps"][number],
      ),
    ).length;
  };

  // Регистрация также по статусу invite, если events ещё нет
  const registration = Math.max(
    countReached("registration"),
    base.users.registered,
  );

  const counts: Record<FirstUsersReviewFunnelKey, number> = {
    invited,
    registration,
    role: countReached("role"),
    profile: countReached("profile"),
    first_action: Math.max(
      countReached("first_action"),
      base.metrics.firstAction,
    ),
    lia: Math.max(countReached("lia"), base.metrics.liaUsed),
    object: countReached("object"),
  };

  // Монотонность: каждый следующий ≤ предыдущего
  let prev = invited;
  for (const step of FIRST_USERS_REVIEW_FUNNEL) {
    counts[step.key] = Math.min(counts[step.key], prev);
    prev = counts[step.key];
  }

  return FIRST_USERS_REVIEW_FUNNEL.map((step, index) => {
    const count = counts[step.key];
    const prevCount =
      index === 0 ? null : counts[FIRST_USERS_REVIEW_FUNNEL[index - 1].key];
    const conversionFromPrevPct =
      prevCount == null || prevCount <= 0 ? null : pct(count, prevCount);
    const dropOffCount =
      prevCount == null ? null : Math.max(0, prevCount - count);
    const dropOffPct =
      prevCount == null || prevCount <= 0
        ? null
        : pct(dropOffCount ?? 0, prevCount);

    return {
      key: step.key,
      label: step.label,
      count,
      conversionFromPrevPct,
      dropOffPct,
      dropOffCount,
    };
  });
}

export function decideFirstUsersNext(input: {
  activationPct: number;
  firstActionPct: number;
  liaPct: number;
  criticalIssues: number;
  highIssues: number;
  registered: number;
  feedbackSent: number;
  objectCreated: number;
}): FirstUsersDecision {
  if (input.criticalIssues > 0 || input.registered < 3) {
    return "continue_closed";
  }
  if (
    input.activationPct >= 70 &&
    input.firstActionPct >= 50 &&
    input.liaPct >= 40 &&
    input.criticalIssues === 0 &&
    input.highIssues <= 2 &&
    input.objectCreated >= 3 &&
    input.feedbackSent >= 3
  ) {
    return "prepare_public";
  }
  if (
    input.activationPct >= 50 &&
    input.firstActionPct >= 35 &&
    input.criticalIssues === 0
  ) {
    return "expand_beta";
  }
  return "continue_closed";
}

function buildLiaReport(
  base: FirstUsersDashboard,
  scenarioHints: {
    successful: string[];
    blocked: string[];
  },
): FirstUsersLiaReport {
  const scenarios = base.lia.scenarios;
  const used = scenarios.map((s) => `${s.scenario}: ${s.count}`);
  const recommendations: string[] = [];

  if (base.lia.dialogues < 5) {
    recommendations.push(
      "Мало диалогов — провести участников через стартовый сценарий Лии.",
    );
  }
  if (scenarioHints.blocked.length > 0) {
    recommendations.push(
      "Разобрать blocked flows: уточнить CTA и сценарии в онбординге.",
    );
  }
  if (base.metrics.liaPct < 40) {
    recommendations.push("Довести долю использовавших Лию до 40% когорты.");
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Сценарии Лии работают — зафиксировать successful flows в help/onboarding.",
    );
  }

  return {
    summary: [
      `Лия в First Users Wave: ${base.lia.dialogues} диалогов.`,
      `Использовали Лию: ${base.metrics.liaUsed} (${base.metrics.liaPct}% зарегистрированных).`,
      `Размеченных сценариев: ${scenarios.length}.`,
    ].join(" "),
    used_scenarios:
      used.length > 0 ? used : ["Пока нет размеченных сценариев в сообщениях"],
    successful_flows:
      scenarioHints.successful.length > 0
        ? scenarioHints.successful
        : [
            base.metrics.liaUsed > 0
              ? "Есть первые диалоги — сценарии запускаются"
              : "Успешных потоков пока недостаточно данных",
          ],
    blocked_flows:
      scenarioHints.blocked.length > 0
        ? scenarioHints.blocked
        : [
            base.metrics.liaPct < 40
              ? "Часть когорты не доходит до Лии после профиля"
              : "Явных blocked flows не зафиксировано",
          ],
    recommendations,
  };
}

function buildProductIssues(
  improvements: Awaited<ReturnType<typeof getImprovementsDashboard>>,
): Record<IssuePriorityBucket, ProductIssueReviewItem[]> {
  const buckets: Record<IssuePriorityBucket, ProductIssueReviewItem[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const item of improvements.improvements) {
    const priority = toPriority(item.priority);
    buckets[priority].push({
      id: item.id,
      title: item.title,
      priority,
      usersAffected: 1,
      impact: item.description?.slice(0, 160) || "Влияние на продукт / UX",
      resolution: `Статус improvement: ${item.status}`,
      status: item.status,
      source: "product_improvements",
    });
  }

  for (const issue of improvements.problems) {
    if (["done", "closed", "resolved"].includes(issue.status)) continue;
    const priority = toPriority(issue.severity ?? "medium");
    buckets[priority].push({
      id: issue.id,
      title: issue.title,
      priority,
      usersAffected: 1,
      impact: issue.description?.slice(0, 160) || "Блокер сценария участника",
      resolution: "Связать с product_improvement при необходимости",
      status: issue.status,
      source: "pilot_issues",
    });
  }

  for (const fb of improvements.proposals.slice(0, 20)) {
    const priority = toPriority(fb.priority ?? "medium");
    const title = fb.message.slice(0, 80);
    buckets[priority].push({
      id: fb.id,
      title: title.length < fb.message.length ? `${title}…` : title,
      priority,
      usersAffected: 1,
      impact: `Feedback (${fb.type}) со страницы ${fb.page || "/"}`,
      resolution: "Рассмотреть → pilot_issue → product_improvement",
      status: "feedback",
      source: "feedback",
    });
  }

  // Агрегация «сколько пользователей» по одинаковым заголовкам
  for (const key of ISSUE_PRIORITY_ORDER) {
    const map = new Map<string, ProductIssueReviewItem>();
    for (const item of buckets[key]) {
      const norm = item.title.toLowerCase().slice(0, 60);
      const existing = map.get(norm);
      if (existing) {
        existing.usersAffected += 1;
      } else {
        map.set(norm, { ...item });
      }
    }
    buckets[key] = Array.from(map.values()).slice(0, 12);
  }

  return buckets;
}

function buildReviewReport(
  base: FirstUsersDashboard,
  funnel: FunnelStepStats[],
  decision: FirstUsersDecisionBlock,
  productIssues: Record<IssuePriorityBucket, ProductIssueReviewItem[]>,
): FirstUsersReviewReport {
  const dropMax = funnel
    .filter((s) => s.dropOffPct != null)
    .sort((a, b) => (b.dropOffPct ?? 0) - (a.dropOffPct ?? 0))[0];

  const mainProblems: string[] = [];
  if (dropMax && (dropMax.dropOffPct ?? 0) >= 30) {
    mainProblems.push(
      `Главная потеря воронки: ${dropMax.label} (−${dropMax.dropOffPct}% / ${dropMax.dropOffCount} чел.)`,
    );
  }
  for (const item of productIssues.critical.slice(0, 3)) {
    mainProblems.push(`[critical] ${item.title}`);
  }
  for (const item of productIssues.high.slice(0, 2)) {
    mainProblems.push(`[high] ${item.title}`);
  }
  if (mainProblems.length === 0) {
    mainProblems.push("Критических проблем по данным когорты не выявлено");
  }

  const success = base.journeys
    .filter((j) => j.completedSteps.includes("object"))
    .slice(0, 5)
    .map((j) => `${j.email} (${j.role}) → создание объекта`);

  return {
    summary: [
      `${FIRST_USERS_WAVE_NAME}: обзор первого запуска.`,
      `Приглашено ${base.users.invited}, зарегистрировано ${base.users.registered}, активно ${base.users.active}.`,
      `Рекомендуемое решение: ${decision.decision}.`,
    ].join(" "),
    activation: [
      `Активация приглашений: ${base.metrics.activationPct}%`,
      `Первое действие: ${base.metrics.firstActionPct}%`,
      `Лия: ${base.metrics.liaPct}%`,
      `Feedback: ${base.metrics.feedbackSent}`,
      ...funnel.map(
        (s) =>
          `${s.label}: ${s.count}` +
          (s.conversionFromPrevPct != null
            ? ` (${s.conversionFromPrevPct}% от предыдущего)`
            : ""),
      ),
    ],
    user_behavior: [
      `Предприниматели: ${base.metrics.entrepreneurs}`,
      `Эксперты: ${base.metrics.experts}`,
      `Инвесторы: ${base.metrics.investors}`,
      `Организации: ${base.metrics.organizations}`,
      `Проектов: ${base.metrics.projects} · интересов: ${base.metrics.interests}`,
      ...base.report.user_behavior.slice(0, 4),
    ],
    successful_cases:
      success.length > 0
        ? success
        : base.report.success_cases.slice(0, 5),
    main_problems: mainProblems,
    recommendations: [
      decision.hint,
      ...decision.requiredImprovements.slice(0, 3),
      ...base.report.recommendations.slice(0, 2),
    ],
  };
}

async function loadRoleExtraMetrics(): Promise<{
  applicationsByFrom: number;
  expertVerified: number;
  projectViews: number;
  opportunities: number;
  deals: number;
}> {
  if (!hasSupabaseEnv()) {
    return {
      applicationsByFrom: 0,
      expertVerified: 0,
      projectViews: 0,
      opportunities: 0,
      deals: 0,
    };
  }
  try {
    const supabase = createClient();
    const [apps, experts, views, opps, deals] = await Promise.all([
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("expert_profiles")
        .select("id", { count: "exact", head: true })
        .in("verification_status", ["verified", "pending"]),
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "project_viewed"),
      supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true }),
      supabase.from("deals").select("id", { count: "exact", head: true }),
    ]);
    return {
      applicationsByFrom: apps.count ?? 0,
      expertVerified: experts.count ?? 0,
      projectViews: views.count ?? 0,
      opportunities: opps.count ?? 0,
      deals: deals.count ?? 0,
    };
  } catch {
    return {
      applicationsByFrom: 0,
      expertVerified: 0,
      projectViews: 0,
      opportunities: 0,
      deals: 0,
    };
  }
}

async function loadTindaInsight(
  base: FirstUsersDashboard,
): Promise<TindaFirstUsersInsight> {
  const questions = base.journeys
    .flatMap((j) => j.questions)
    .filter((q) => /тинда|tinda|кейс|опт/i.test(q))
    .slice(0, 5);

  let caseViews = 0;
  let tindaMentions = 0;
  if (hasSupabaseEnv()) {
    try {
      const supabase = createClient();
      const [viewsRes, fbRes] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .eq("event_type", "public_page_view")
          .contains("metadata", { path: "/cases" }),
        supabase
          .from("feedback")
          .select("id, message")
          .ilike("message", "%тинд%")
          .limit(20),
      ]);
      caseViews = viewsRes.count ?? 0;
      tindaMentions = (fbRes.data ?? []).length;
      for (const row of fbRes.data ?? []) {
        const msg = (row as { message?: string }).message ?? "";
        if (msg && !questions.includes(msg.slice(0, 120))) {
          questions.push(msg.slice(0, 120));
        }
      }
    } catch {
      // мягкий сбой
    }
  }

  const notes: string[] = [
    `Публичный кейс: ${TINDA_PUBLIC_CASE.summary}`,
    `Задача кейса: ${TINDA_CASE_DETAIL.task.slice(0, 140)}…`,
  ];
  if (caseViews === 0 && tindaMentions === 0) {
    notes.push(
      "Прямых сигналов по /cases и feedback о ТИНДА мало — проверить, видят ли участники кейс на главной.",
    );
  }

  return {
    caseTitle: TINDA_CASE_DETAIL.title,
    caseHref: TINDA_PUBLIC_CASE.href,
    descriptionClear:
      caseViews > 0 || base.users.active > 0
        ? "Описание кейса доступно на /cases; при наличии просмотров — контур понятен для знакомства."
        : "Пока мало подтверждений, что участники читают описание кейса ТИНДА.",
    interestSignal:
      tindaMentions > 0 || caseViews > 2
        ? `Есть интерес: просмотры /cases ≈ ${caseViews}, упоминания в feedback ≈ ${tindaMentions}.`
        : "Явного интереса к кейсу ТИНДА в feedback/analytics пока недостаточно.",
    questions:
      questions.length > 0
        ? questions.slice(0, 6)
        : [
            "Пока нет явных вопросов участников про ТИНДА — собрать через feedback в волне.",
          ],
    notes,
  };
}

export async function getFirstUsersReviewDashboard(): Promise<FirstUsersReviewDashboard> {
  const base = await getFirstUsersDashboard();
  const improvements = await getImprovementsDashboard();
  const extra = await loadRoleExtraMetrics();
  const funnel = buildFunnel(base);
  const productIssues = buildProductIssues(improvements);

  const objectCreated = funnel.find((f) => f.key === "object")?.count ?? 0;
  const criticalIssues = productIssues.critical.length;
  const highIssues = productIssues.high.length;

  const decisionValue = decideFirstUsersNext({
    activationPct: base.metrics.activationPct,
    firstActionPct: base.metrics.firstActionPct,
    liaPct: base.metrics.liaPct,
    criticalIssues,
    highIssues,
    registered: base.users.registered,
    feedbackSent: base.metrics.feedbackSent,
    objectCreated,
  });

  const readiness = Math.round(
    (base.metrics.activationPct * 0.35 +
      base.metrics.firstActionPct * 0.35 +
      base.metrics.liaPct * 0.2 +
      Math.min(100, base.metrics.feedbackSent * 15) * 0.1) *
      (criticalIssues > 0 ? 0.6 : 1),
  );

  const risks: string[] = [];
  if (criticalIssues > 0) {
    risks.push(`Critical issues: ${criticalIssues}`);
  }
  if (base.metrics.activationPct < 70) {
    risks.push("Активация приглашений ниже целевых 70%");
  }
  if (base.metrics.firstActionPct < 50) {
    risks.push("Менее 50% доходят до первого действия");
  }
  if (base.users.registered < 5) {
    risks.push("Когорта ещё мала для уверенного public");
  }
  if (risks.length === 0) {
    risks.push("Критических рисков по текущим данным нет");
  }

  const requiredImprovements = [
    ...productIssues.critical.map((i) => `Critical: ${i.title}`),
    ...productIssues.high.map((i) => `High: ${i.title}`),
  ].slice(0, 8);
  if (requiredImprovements.length === 0) {
    requiredImprovements.push(
      "Критичных improvements нет — поддерживать feedback loop",
    );
  }

  const decision: FirstUsersDecisionBlock = {
    decision: decisionValue,
    readiness: Math.min(100, Math.max(0, readiness)),
    productReadiness: [
      `Активация: ${base.metrics.activationPct}% (цель ≥70%)`,
      `Первое действие: ${base.metrics.firstActionPct}% (цель ≥50%)`,
      `Лия: ${base.metrics.liaPct}% (цель ≥40%)`,
      `Объекты созданы: ${objectCreated}`,
      `Feedback: ${base.metrics.feedbackSent}`,
      `Critical open: ${criticalIssues}`,
    ],
    risks,
    requiredImprovements,
    hint: firstUsersDecisionHints[decisionValue],
  };

  const scenarioHints = {
    successful: base.journeys
      .filter((j) => j.completedSteps.includes("lia") && j.completedSteps.includes("object"))
      .slice(0, 5)
      .map((j) => `${j.role}: Лия → объект (${j.email})`),
    blocked: base.journeys
      .filter(
        (j) =>
          j.userId &&
          j.stoppedAt !== "Создание объекта" &&
          !j.completedSteps.includes("lia"),
      )
      .slice(0, 5)
      .map((j) => `${j.email}: остановился на «${j.stoppedAt}»`),
  };

  const liaReport = buildLiaReport(base, scenarioHints);
  const reviewReport = buildReviewReport(
    base,
    funnel,
    decision,
    productIssues,
  );
  const tinda = await loadTindaInsight(base);

  const roles: RoleAnalysisBlock[] = (
    Object.keys(FIRST_USERS_ROLE_TARGETS) as FirstUsersRoleKey[]
  ).map((key) => {
    const meta = FIRST_USERS_ROLE_TARGETS[key];
    const scenario = base.scenarios.find((s) => s.key === key);
    const registered = scenario?.registered ?? 0;

    if (key === "entrepreneurs") {
      return {
        key,
        label: meta.label,
        registered,
        checks: meta.checks,
        metrics: [
          { label: "Зарегистрировано", value: registered },
          { label: "Проекты (платформа)", value: base.metrics.projects },
          { label: "Использовали Лию (когорта)", value: base.metrics.liaUsed },
          { label: "Заявки", value: extra.applicationsByFrom },
        ],
      };
    }
    if (key === "experts") {
      return {
        key,
        label: meta.label,
        registered,
        checks: meta.checks,
        metrics: [
          { label: "Зарегистрировано", value: registered },
          {
            label: "Профили экспертов",
            value: base.metrics.expertProfiles,
          },
          { label: "Верификация / pending", value: extra.expertVerified },
          { label: "Заявки (платформа)", value: extra.applicationsByFrom },
        ],
      };
    }
    if (key === "investors") {
      return {
        key,
        label: meta.label,
        registered,
        checks: meta.checks,
        metrics: [
          { label: "Зарегистрировано", value: registered },
          { label: "Просмотры проектов", value: extra.projectViews },
          { label: "Интересы", value: base.metrics.interests },
          { label: "Заявки", value: extra.applicationsByFrom },
        ],
      };
    }
    return {
      key,
      label: meta.label,
      registered,
      checks: meta.checks,
      metrics: [
        { label: "Зарегистрировано", value: registered },
        { label: "Организации", value: base.metrics.organizations },
        { label: "Проекты", value: base.metrics.projects },
        { label: "Возможности", value: extra.opportunities },
      ],
    };
  });

  return {
    waveName: base.wave?.name ?? FIRST_USERS_WAVE_NAME,
    funnel,
    roles,
    liaReport,
    productIssues,
    reviewReport,
    decision,
    tinda,
    base,
  };
}

export async function buildFirstUsersReviewReport(): Promise<FirstUsersReviewReport> {
  const dashboard = await getFirstUsersReviewDashboard();
  return dashboard.reviewReport;
}

export async function buildFirstUsersLiaReport(): Promise<FirstUsersLiaReport> {
  const dashboard = await getFirstUsersReviewDashboard();
  return dashboard.liaReport;
}
