import {
  launchDecisionHints,
  mapReviewDecisionToLaunch,
  type ImprovementPriorityBucket,
  type LaunchDecision,
} from "@/config/launch-decision";
import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";
import { listLaunchGoals, type LaunchGoalView } from "@/lib/launch/goals";
import { getWaveReviewDashboard } from "@/lib/launch/wave-review";
import { listLaunchWaves } from "@/lib/launch/waves";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { LaunchDecisionRow, LaunchWaveRow } from "@/types/database";
import type { LaunchDecisionAIReport } from "@/types/lia";
import {
  goalProgressPercent,
  launchGoalMetricLabels,
  type LaunchGoalMetricType,
} from "@/config/launch-goals";

export type LaunchDecisionReport = {
  summary: string;
  wave_results: string[];
  goal_completion: string[];
  business_value: string[];
  product_readiness: string[];
  critical_risks: string[];
  recommendation: LaunchDecision;
  next_step: string;
};

export type RequiredFixItem = {
  id: string;
  title: string;
  priority: ImprovementPriorityBucket;
  source: "product_improvements" | "pilot_issues" | "feedback";
  status: string;
};

export type LaunchDecisionDashboard = {
  wave1: LaunchWaveRow | null;
  wave2: LaunchWaveRow | null;
  wave2Goals: LaunchGoalView[];
  report: LaunchDecisionReport;
  aiReport: LaunchDecisionAIReport;
  requiredFixes: Record<ImprovementPriorityBucket, RequiredFixItem[]>;
  latestDecision: LaunchDecisionRow | null;
  suggestedDecision: LaunchDecision;
};

function empty(): LaunchDecisionDashboard {
  return {
    wave1: null,
    wave2: null,
    wave2Goals: [],
    report: {
      summary: "Нет данных для LaunchDecisionReport.",
      wave_results: [],
      goal_completion: [],
      business_value: [],
      product_readiness: [],
      critical_risks: ["Нет данных волны."],
      recommendation: "needs_improvement",
      next_step: "Откройте /admin/wave-review и примените миграции launch.",
    },
    aiReport: {
      summary: "Нет данных.",
      strengths: [],
      weaknesses: [],
      risks: [],
      recommendation: "Соберите данные Closed Wave 1 перед Decision Gate.",
    },
    requiredFixes: { critical: [], high: [], medium: [], low: [] },
    latestDecision: null,
    suggestedDecision: "needs_improvement",
  };
}

function toPriority(raw: string): ImprovementPriorityBucket {
  const v = raw.toLowerCase();
  if (v === "critical") return "critical";
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  return "low";
}

export async function getLaunchDecisionDashboard(
  actorUserId?: string | null,
): Promise<LaunchDecisionDashboard> {
  if (!hasSupabaseEnv()) return empty();

  try {
    const supabase = createClient();
    const [waves, review] = await Promise.all([
      listLaunchWaves(),
      getWaveReviewDashboard(actorUserId),
    ]);

    const wave1 =
      waves.find((w) => w.id === LAUNCH_WAVE_IDS.closed) ?? review.wave;
    const wave2 =
      waves.find((w) => w.id === LAUNCH_WAVE_IDS.wave2) ??
      waves.find((w) => w.name === "Launch Wave 2") ??
      null;

    const wave2GoalRows = wave2 ? await listLaunchGoals(wave2.id) : [];
    const wave2Goals: LaunchGoalView[] = wave2GoalRows.map((g) => ({
      ...g,
      target_value: Number(g.target_value),
      current_value: Number(g.current_value),
      progress: goalProgressPercent(
        Number(g.current_value),
        Number(g.target_value),
      ),
      metricLabel:
        launchGoalMetricLabels[g.metric_type as LaunchGoalMetricType] ??
        g.metric_type,
    }));

    const [
      improvementsRes,
      issuesRes,
      feedbackRes,
      decisionsRes,
    ] = await Promise.all([
      supabase
        .from("product_improvements")
        .select("id, title, priority, status")
        .in("status", ["planned", "in_progress"])
        .limit(50),
      supabase
        .from("pilot_issues")
        .select("id, title, severity, status")
        .in("status", ["open", "in_progress"])
        .limit(50),
      supabase
        .from("feedback")
        .select("id, message, priority, type")
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("launch_decisions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const requiredFixes: Record<ImprovementPriorityBucket, RequiredFixItem[]> =
      {
        critical: [],
        high: [],
        medium: [],
        low: [],
      };

    for (const row of improvementsRes.data ?? []) {
      const priority = toPriority(String(row.priority));
      requiredFixes[priority].push({
        id: row.id as string,
        title: String(row.title),
        priority,
        source: "product_improvements",
        status: String(row.status),
      });
    }
    for (const row of issuesRes.data ?? []) {
      const priority = toPriority(String(row.severity));
      requiredFixes[priority].push({
        id: row.id as string,
        title: String(row.title),
        priority,
        source: "pilot_issues",
        status: String(row.status),
      });
    }
    for (const row of feedbackRes.data ?? []) {
      const priority = toPriority(String(row.priority ?? "medium"));
      // feedback: только medium+ как обязательные улучшения
      if (priority === "low") continue;
      requiredFixes[priority].push({
        id: row.id as string,
        title: String(row.message).slice(0, 100),
        priority,
        source: "feedback",
        status: String(row.type),
      });
    }

    const criticalCount =
      requiredFixes.critical.length + requiredFixes.high.length;
    const suggested = mapReviewDecisionToLaunch(
      criticalCount > 0 && review.nextWave.readiness < 50
        ? "needs_improvement"
        : review.nextWave.decision,
    );

    const completedGoals = review.goals.filter((g) => g.status === "achieved");
    const failedGoals = review.goals.filter((g) => g.status === "failed");

    const wave_results = [
      `Волна: ${wave1?.name ?? "Closed Wave 1 — ТИНДА"} (${wave1?.status ?? "—"})`,
      `Участники: ${review.participants}`,
      `Прогресс целей: ${review.nextWave.readiness}%`,
      `Активность: Лия ${review.activity.lia}, проекты ${review.activity.projects}, сделки ${review.activity.deals}`,
    ];

    const goal_completion = review.goals.map(
      (g) =>
        `${g.title}: ${g.current_value}/${g.target_value} (${g.progress}%) — ${g.status}`,
    );

    const business_value = [
      ...review.reviewReport.business_results,
      `Success factors: ${review.liaReport.success_factors.slice(0, 3).join("; ") || "—"}`,
    ];

    const product_readiness = [
      `Critical к исправлению: ${requiredFixes.critical.length}`,
      `High к исправлению: ${requiredFixes.high.length}`,
      `Improvements in progress/planned: ${(improvementsRes.data ?? []).length}`,
      `Open pilot issues: ${(issuesRes.data ?? []).length}`,
      review.nextWave.hint,
    ];

    const critical_risks = [
      ...review.nextWave.risks,
      ...requiredFixes.critical
        .slice(0, 3)
        .map((i) => `Critical: ${i.title}`),
      ...requiredFixes.high.slice(0, 3).map((i) => `High: ${i.title}`),
    ];

    const next_step =
      suggested === "expand_beta"
        ? "Активировать Launch Wave 2 и набрать когорту предпринимателей / экспертов / инвесторов."
        : suggested === "public_launch_ready"
          ? "Зафиксировать решение и готовить Wave 3 — Public по чеклисту."
          : suggested === "continue_closed"
            ? "Оставить Closed Wave 1 active; закрыть пробелы целей ТИНДА."
            : "Закрыть Critical/High в /admin/improvements до любого расширения.";

    const report: LaunchDecisionReport = {
      summary: [
        `Decision Gate после ${wave1?.name ?? "Closed Wave 1"}.`,
        `Рекомендация: ${suggested}.`,
        `Цели achieved ${completedGoals.length}, failed ${failedGoals.length}.`,
        `Critical/High backlog: ${criticalCount}.`,
      ].join(" "),
      wave_results,
      goal_completion:
        goal_completion.length > 0
          ? goal_completion
          : ["Цели волны не загружены."],
      business_value,
      product_readiness,
      critical_risks:
        critical_risks.length > 0
          ? critical_risks
          : ["Критических рисков не выявлено."],
      recommendation: suggested,
      next_step,
    };

    const strengths: string[] = [...review.liaReport.success_factors];
    if (completedGoals.length > 0) {
      strengths.push(`Достигнуто целей волны: ${completedGoals.length}`);
    }
    if (review.activity.deals > 0) {
      strengths.push("Есть сделки в контуре волны");
    }

    const weaknesses: string[] = [];
    if (failedGoals.length > 0) {
      weaknesses.push(`Failed-цели: ${failedGoals.length}`);
    }
    if (requiredFixes.critical.length > 0) {
      weaknesses.push(`Critical improvements: ${requiredFixes.critical.length}`);
    }
    if (review.activity.lia === 0) {
      weaknesses.push("Лия слабо используется");
    }
    for (const step of review.uxPath.filter((s) => !s.passed)) {
      weaknesses.push(`UX-путь не пройден: ${step.label}`);
    }
    if (weaknesses.length === 0) {
      weaknesses.push("Существенных слабостей по данным не видно");
    }

    const aiReport: LaunchDecisionAIReport = {
      summary: report.summary,
      strengths:
        strengths.length > 0
          ? strengths
          : ["Недостаточно данных о сильных сторонах"],
      weaknesses,
      risks: report.critical_risks.slice(0, 8),
      recommendation: `${launchDecisionHints[suggested]} Следующий шаг: ${next_step}`,
    };

    return {
      wave1,
      wave2,
      wave2Goals,
      report,
      aiReport,
      requiredFixes,
      latestDecision: (decisionsRes.data as LaunchDecisionRow) ?? null,
      suggestedDecision: suggested,
    };
  } catch {
    return empty();
  }
}

export async function buildLaunchDecisionAIReport(
  actorUserId?: string | null,
): Promise<LaunchDecisionAIReport> {
  const dashboard = await getLaunchDecisionDashboard(actorUserId);
  return dashboard.aiReport;
}
