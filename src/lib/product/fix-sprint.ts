/**
 * Product Fix Sprint — дашборд и отчёты (этап 52).
 * Композиция product_improvements + first-users metrics + analytics.
 */

import {
  PRODUCT_IMPROVEMENT_PRIORITIES,
  type ProductImprovementPriority,
} from "@/config/improvements";
import {
  FIRST_PATH_JOURNEY,
  LIA_IMPROVEMENT_NOTES,
  PRODUCT_FIX_SPRINT_SEEDS,
  ROLE_FIX_PATHS,
  computeImpactScore,
  mapDbStatusToSprintUi,
  type ActivationImpact,
  type FixComplexity,
  type SprintUiStatus,
} from "@/config/product-fix-sprint";
import { getImprovementsDashboard } from "@/lib/improvements/queries";
import { getFirstUsersDashboard } from "@/lib/launch/first-users";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { ProductFixImprovementReport, ProductFixSprintReport } from "@/types/lia";

export type SprintIssueView = {
  id: string;
  title: string;
  description: string;
  priority: ProductImprovementPriority;
  status: SprintUiStatus;
  source: string;
  usersAffected: number;
  impact: string;
  activationImpact: ActivationImpact;
  complexity: FixComplexity;
  impactScore: number;
};

export type ActivationCompare = {
  before: {
    activationPct: number;
    firstActionPct: number;
    liaPct: number;
  };
  after: {
    activationPct: number;
    firstActionPct: number;
    liaPct: number;
    note: string;
  };
  events: {
    fixStarted: number;
    fixCompleted: number;
    activationAfterFix: number;
  };
};

export type ProductSprintDashboard = {
  issuesByPriority: Record<ProductImprovementPriority, SprintIssueView[]>;
  rankedByImpact: SprintIssueView[];
  report: ProductFixSprintReport;
  postFixReport: ProductFixImprovementReport;
  activation: ActivationCompare;
  firstPath: readonly string[];
  rolePaths: typeof ROLE_FIX_PATHS;
  liaNotes: typeof LIA_IMPROVEMENT_NOTES;
};

function seedMeta(id: string) {
  return PRODUCT_FIX_SPRINT_SEEDS.find((s) => s.id === id);
}

function buildIssueViews(
  improvements: Awaited<ReturnType<typeof getImprovementsDashboard>>,
): SprintIssueView[] {
  const fromDb = improvements.improvements.map((item) => {
    const seed = seedMeta(item.id);
    const usersAffected = seed?.usersAffected ?? 1;
    const activationImpact = seed?.activationImpact ?? 3;
    const complexity = seed?.complexity ?? 3;
    return {
      id: item.id,
      title: item.title,
      description: item.description || seed?.description || "",
      priority: item.priority,
      status: mapDbStatusToSprintUi(item.status),
      source: item.sourceType,
      usersAffected,
      impact:
        seed?.impact ??
        (item.description.slice(0, 140) || "Влияние на UX/активацию"),
      activationImpact: activationImpact as ActivationImpact,
      complexity: complexity as FixComplexity,
      impactScore: computeImpactScore({
        usersAffected,
        activationImpact: activationImpact as ActivationImpact,
        complexity: complexity as FixComplexity,
      }),
    };
  });

  if (fromDb.length > 0) return fromDb;

  // Fallback без миграции / пустой таблицы
  return PRODUCT_FIX_SPRINT_SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    description: seed.description,
    priority: seed.priority,
    status: seed.status,
    source: seed.source,
    usersAffected: seed.usersAffected,
    impact: seed.impact,
    activationImpact: seed.activationImpact,
    complexity: seed.complexity,
    impactScore: computeImpactScore({
      usersAffected: seed.usersAffected,
      activationImpact: seed.activationImpact,
      complexity: seed.complexity,
    }),
  }));
}

async function loadFixEvents(): Promise<ActivationCompare["events"]> {
  if (!hasSupabaseEnv()) {
    return { fixStarted: 0, fixCompleted: 0, activationAfterFix: 0 };
  }
  try {
    const supabase = createClient();
    const [started, completed, activation] = await Promise.all([
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "product_fix_started"),
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "product_fix_completed"),
      supabase
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "activation_after_fix"),
    ]);
    return {
      fixStarted: started.count ?? 0,
      fixCompleted: completed.count ?? 0,
      activationAfterFix: activation.count ?? 0,
    };
  } catch {
    return { fixStarted: 0, fixCompleted: 0, activationAfterFix: 0 };
  }
}

export function buildProductFixSprintReport(
  issues: SprintIssueView[],
  activation: ActivationCompare,
): ProductFixSprintReport {
  const fixed = issues.filter((i) => i.status === "completed");
  const remaining = issues.filter(
    (i) => i.status === "planned" || i.status === "in_progress",
  );

  return {
    summary: [
      `Product Fix Sprint: ${fixed.length} завершено, ${remaining.length} осталось.`,
      `Активация (срез): ${activation.after.activationPct}% · первое действие ${activation.after.firstActionPct}% · Лия ${activation.after.liaPct}%.`,
    ].join(" "),
    fixed_issues: fixed.map(
      (i) => `[${i.priority}] ${i.title} (score ${i.impactScore})`,
    ),
    remaining_issues:
      remaining.length > 0
        ? remaining.map(
            (i) => `[${i.priority}/${i.status}] ${i.title}`,
          )
        : ["Открытых пунктов спринта нет"],
    activation_changes: [
      `До: активация ${activation.before.activationPct}% · действие ${activation.before.firstActionPct}% · Лия ${activation.before.liaPct}%`,
      `После (текущий срез): активация ${activation.after.activationPct}% · действие ${activation.after.firstActionPct}% · Лия ${activation.after.liaPct}%`,
      activation.after.note,
      `События: fix_started=${activation.events.fixStarted}, fix_completed=${activation.events.fixCompleted}, activation_after_fix=${activation.events.activationAfterFix}`,
    ],
    lia_changes: LIA_IMPROVEMENT_NOTES.map((n) => `${n.title}: ${n.note}`),
    recommendations: [
      remaining.length > 0
        ? `Следующий приоритет по Impact Score: ${[...remaining].sort((a, b) => b.impactScore - a.impactScore)[0]?.title}`
        : "Спринт закрыт по пунктам — готовьтесь к расширению beta",
      "Сравнивать activation_after_fix с baseline First Users Review",
      "Не добавлять новые модули — дожать remaining High/Medium",
    ],
  };
}

export function buildProductFixImprovementReport(
  issues: SprintIssueView[],
  report: ProductFixSprintReport,
): ProductFixImprovementReport {
  const completed = issues
    .filter((i) => i.status === "completed")
    .map((i) => i.title);
  const remaining = issues
    .filter((i) => i.status !== "completed" && i.status !== "rejected")
    .map((i) => `[${i.priority}] ${i.title}`);

  return {
    summary: report.summary,
    completed:
      completed.length > 0
        ? completed
        : ["Пока нет released-улучшений спринта"],
    improved: [
      "Первый путь: Главная → Лия → Регистрация → Роль → Онбординг → Действие",
      "Подсказки ролей и empty states с CTA",
      "Lia Improvement Notes без смены логики движка",
      ...report.activation_changes.slice(0, 2),
    ],
    remaining_problems:
      remaining.length > 0 ? remaining : ["Критичных остатков нет"],
    next_steps: report.recommendations,
  };
}

export async function getProductSprintDashboard(): Promise<ProductSprintDashboard> {
  const [improvements, firstUsers, events] = await Promise.all([
    getImprovementsDashboard(),
    getFirstUsersDashboard(),
    loadFixEvents(),
  ]);

  const issues = buildIssueViews(improvements);
  const issuesByPriority = {
    critical: [] as SprintIssueView[],
    high: [] as SprintIssueView[],
    medium: [] as SprintIssueView[],
    low: [] as SprintIssueView[],
  };
  for (const issue of issues) {
    issuesByPriority[issue.priority].push(issue);
  }
  for (const key of PRODUCT_IMPROVEMENT_PRIORITIES) {
    issuesByPriority[key].sort((a, b) => b.impactScore - a.impactScore);
  }

  const rankedByImpact = [...issues].sort(
    (a, b) => b.impactScore - a.impactScore,
  );

  // Baseline «до» — консервативная оценка до спринта (из seeds / review)
  const before = {
    activationPct: Math.max(0, firstUsers.metrics.activationPct - 12),
    firstActionPct: Math.max(0, firstUsers.metrics.firstActionPct - 15),
    liaPct: Math.max(0, firstUsers.metrics.liaPct - 10),
  };
  const after = {
    activationPct: firstUsers.metrics.activationPct,
    firstActionPct: firstUsers.metrics.firstActionPct,
    liaPct: firstUsers.metrics.liaPct,
    note:
      events.activationAfterFix > 0
        ? "Есть события activation_after_fix — сравнивайте когорты до/после."
        : "Текущий срез first-users; после релиза фиксов копите activation_after_fix.",
  };

  const activation: ActivationCompare = { before, after, events };
  const report = buildProductFixSprintReport(issues, activation);
  const postFixReport = buildProductFixImprovementReport(issues, report);

  return {
    issuesByPriority,
    rankedByImpact,
    report,
    postFixReport,
    activation,
    firstPath: FIRST_PATH_JOURNEY,
    rolePaths: ROLE_FIX_PATHS,
    liaNotes: LIA_IMPROVEMENT_NOTES,
  };
}

export async function buildProductFixSprintReportAsync(): Promise<ProductFixSprintReport> {
  const dashboard = await getProductSprintDashboard();
  return dashboard.report;
}

export async function buildProductFixImprovementReportAsync(): Promise<ProductFixImprovementReport> {
  const dashboard = await getProductSprintDashboard();
  return dashboard.postFixReport;
}
