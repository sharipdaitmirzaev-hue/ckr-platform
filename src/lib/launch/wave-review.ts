import {
  nextWaveDecisionHints,
  type NextWaveDecision,
} from "@/config/wave-review";
import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";
import { getLaunchGoalsBundle, type LaunchGoalView } from "@/lib/launch/goals";
import { getLaunchMetrics, type LaunchMetrics } from "@/lib/launch/metrics";
import { getLaunchWaveDashboard } from "@/lib/launch/waves";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { LaunchWaveRow } from "@/types/database";
import type { WaveReviewReport } from "@/types/lia";

export type ClosedWaveReviewReport = {
  summary: string;
  completed_goals: string[];
  failed_goals: string[];
  user_activity: string[];
  business_results: string[];
  product_issues: string[];
  recommendations: string[];
  next_wave_decision: NextWaveDecision;
};

export type WaveUxPathStep = {
  key: string;
  label: string;
  passed: boolean;
  detail: string;
};

export type WaveUxProblem = {
  id: string;
  title: string;
  category:
    | "unclear_ui"
    | "missing_info"
    | "no_action"
    | "technical"
    | "other";
  source: "feedback" | "pilot_issues" | "analytics_events" | "goals";
  severity: string;
};

export type NextWaveDecisionBlock = {
  decision: NextWaveDecision;
  readiness: number;
  risks: string[];
  recommendations: string[];
  hint: string;
};

export type WaveReviewDashboard = {
  wave: LaunchWaveRow | null;
  participants: number;
  goals: LaunchGoalView[];
  metrics: LaunchMetrics;
  activity: {
    lia: number;
    projects: number;
    tasks: number;
    crm: number;
    applications: number;
    deals: number;
  };
  uxPath: WaveUxPathStep[];
  uxProblems: WaveUxProblem[];
  reviewReport: ClosedWaveReviewReport;
  liaReport: WaveReviewReport;
  nextWave: NextWaveDecisionBlock;
  improvementLinks: Array<{
    issueId: string;
    issueTitle: string;
    improvementId: string | null;
    improvementTitle: string | null;
  }>;
};

function emptyDashboard(): WaveReviewDashboard {
  const emptyMetrics: LaunchMetrics = {
    users: { invited: 0, registered: 0, active: 0 },
    activation: { profile_completed: 0, first_action: 0, lia_used: 0 },
    business: { projects: 0, applications: 0, deals: 0, results: 0 },
    tinda: {
      org_profile: 0,
      project: 0,
      onboarding: 0,
      roadmap: 0,
      tasks_done: 0,
      kpi_updated: 0,
      client_contacts: 0,
      negotiations: 0,
      partners: 0,
      deals: 0,
    },
    period_label: "—",
  };

  return {
    wave: null,
    participants: 0,
    goals: [],
    metrics: emptyMetrics,
    activity: {
      lia: 0,
      projects: 0,
      tasks: 0,
      crm: 0,
      applications: 0,
      deals: 0,
    },
    uxPath: [],
    uxProblems: [],
    reviewReport: {
      summary: "Нет данных для ClosedWaveReviewReport.",
      completed_goals: [],
      failed_goals: [],
      user_activity: [],
      business_results: [],
      product_issues: [],
      recommendations: [],
      next_wave_decision: "needs_improvement",
    },
    liaReport: {
      summary: "Нет данных.",
      success_factors: [],
      problems: [],
      patterns: [],
      recommendations: [],
    },
    nextWave: {
      decision: "needs_improvement",
      readiness: 0,
      risks: ["Нет активной волны для анализа."],
      recommendations: ["Настройте Closed Wave 1 — ТИНДА на /admin/launch."],
      hint: nextWaveDecisionHints.needs_improvement,
    },
    improvementLinks: [],
  };
}

export function decideNextWave(input: {
  overallProgress: number;
  achieved: number;
  failed: number;
  active: number;
  openCritical: number;
  liaUsed: number;
  deals: number;
}): NextWaveDecision {
  if (input.openCritical > 0 || input.overallProgress < 40) {
    return "needs_improvement";
  }
  if (
    input.overallProgress >= 80 &&
    input.failed === 0 &&
    input.openCritical === 0 &&
    input.deals > 0 &&
    input.liaUsed > 0
  ) {
    return "public_ready";
  }
  if (input.overallProgress >= 60 && input.openCritical === 0) {
    return "expand_beta";
  }
  return "continue_closed";
}

function categorizeProblem(text: string): WaveUxProblem["category"] {
  const t = text.toLowerCase();
  if (/баг|ошибк|error|500|crash|паден|не работ/.test(t)) return "technical";
  if (/непонят|ui|интерфейс|куда нажат|сложн/.test(t)) return "unclear_ui";
  if (/не хват|мало инф|неясн|объясн|подсказ/.test(t)) return "missing_info";
  if (/не знаю что делать|нет действи|застрял|дроп|уш[её]л/.test(t)) {
    return "no_action";
  }
  return "other";
}

/**
 * Связывает выводы волны с pilot_issues → product_improvements.
 * Идемпотентно по заголовку `[wave] …`.
 */
export async function syncWaveProblemsToImprovementLoop(input: {
  failedGoals: LaunchGoalView[];
  uxProblems: WaveUxProblem[];
  actorUserId?: string | null;
}): Promise<
  Array<{
    issueId: string;
    issueTitle: string;
    improvementId: string | null;
    improvementTitle: string | null;
  }>
> {
  if (!hasSupabaseEnv()) return [];

  try {
    const supabase = createClient();
    const links: Array<{
      issueId: string;
      issueTitle: string;
      improvementId: string | null;
      improvementTitle: string | null;
    }> = [];

    const candidates = [
      ...input.failedGoals.map((g) => ({
        title: `[wave] Цель не достигнута: ${g.title}`,
        description: `Closed Wave Review. План ${g.target_value}, факт ${g.current_value} (${g.progress}%).\n${g.description}`,
        severity: g.progress < 30 ? "high" : "medium",
      })),
      ...input.uxProblems
        .filter((p) => p.source !== "goals")
        .slice(0, 8)
        .map((p) => ({
          title: `[wave] ${p.title}`.slice(0, 120),
          description: `UX/продукт волны. Категория: ${p.category}. Источник: ${p.source}.`,
          severity: p.severity === "critical" || p.severity === "high" ? p.severity : "medium",
        })),
    ];

    for (const item of candidates) {
      const { data: existing } = await supabase
        .from("pilot_issues")
        .select("id, title")
        .eq("title", item.title)
        .maybeSingle();

      let issueId = existing?.id as string | undefined;
      if (!issueId) {
        const { data: created } = await supabase
          .from("pilot_issues")
          .insert({
            title: item.title,
            description: item.description,
            severity: item.severity,
            status: "open",
            created_by: input.actorUserId ?? null,
            source_type: "analytics",
            source_id: null,
          })
          .select("id, title")
          .maybeSingle();
        issueId = created?.id as string | undefined;
      }
      if (!issueId) continue;

      const { data: improvement } = await supabase
        .from("product_improvements")
        .select("id, title")
        .eq("source_type", "pilot_issue")
        .eq("source_id", issueId)
        .maybeSingle();

      let improvementId = improvement?.id as string | null;
      let improvementTitle = (improvement?.title as string) ?? null;

      if (!improvementId) {
        const { data: createdImp } = await supabase
          .from("product_improvements")
          .insert({
            title: item.title.replace(/^\[wave\]\s*/, ""),
            description: item.description,
            source_type: "pilot_issue",
            source_id: issueId,
            priority:
              item.severity === "critical"
                ? "critical"
                : item.severity === "high"
                  ? "high"
                  : "medium",
            status: "planned",
          })
          .select("id, title")
          .maybeSingle();
        improvementId = (createdImp?.id as string) ?? null;
        improvementTitle = (createdImp?.title as string) ?? null;
      }

      links.push({
        issueId,
        issueTitle: item.title,
        improvementId,
        improvementTitle,
      });
    }

    return links;
  } catch {
    return [];
  }
}

export async function getWaveReviewDashboard(
  actorUserId?: string | null,
): Promise<WaveReviewDashboard> {
  if (!hasSupabaseEnv()) return emptyDashboard();

  try {
    const supabase = createClient();
    const launch = await getLaunchWaveDashboard();
    const wave =
      launch.waves.find((w) => w.id === LAUNCH_WAVE_IDS.closed) ??
      launch.currentWave;
    const goalsBundle = await getLaunchGoalsBundle(wave, actorUserId);
    const m = goalsBundle.metrics ?? (await getLaunchMetrics(wave));

    const waveStart =
      wave?.start_date != null
        ? `${wave.start_date}T00:00:00.000Z`
        : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

    const [feedbackRes, issuesRes, eventsRes] = await Promise.all([
      supabase
        .from("feedback")
        .select("id, type, message, priority, page, created_at")
        .gte("created_at", waveStart)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("pilot_issues")
        .select("id, title, description, severity, status")
        .in("status", ["open", "in_progress"])
        .order("updated_at", { ascending: false })
        .limit(40),
      supabase
        .from("analytics_events")
        .select("event_type, user_id")
        .gte("created_at", waveStart)
        .limit(5000),
    ]);

    const events = (eventsRes.data ?? []) as Array<{
      event_type: string;
      user_id: string | null;
    }>;
    const hasEvent = (...types: string[]) =>
      events.some((e) => types.includes(e.event_type));

    const uxPath: WaveUxPathStep[] = [
      {
        key: "registration",
        label: "Регистрация",
        passed: hasEvent(
          "public_registration",
          "user_registered",
          "registration_completed",
        ),
        detail: "analytics: registration / public_registration",
      },
      {
        key: "profile",
        label: "Профиль",
        passed:
          hasEvent("profile_completed", "onboarding_completed", "role_selected") ||
          m.tinda.org_profile > 0,
        detail: "профиль пользователя / организации",
      },
      {
        key: "lia",
        label: "Лия",
        passed: m.activation.lia_used > 0 || hasEvent("lia_used", "first_lia_use"),
        detail: `использований: ${m.activation.lia_used}`,
      },
      {
        key: "project",
        label: "Проект",
        passed: m.tinda.project > 0 || m.business.projects > 0,
        detail: `проекты волны: ${m.business.projects}`,
      },
      {
        key: "actions",
        label: "Действия",
        passed:
          m.tinda.tasks_done > 0 ||
          m.business.applications > 0 ||
          m.business.deals > 0 ||
          m.tinda.deals > 0,
        detail: "задачи / заявки / сделки",
      },
    ];

    const uxProblems: WaveUxProblem[] = [];

    for (const f of feedbackRes.data ?? []) {
      const message = String(f.message ?? "");
      uxProblems.push({
        id: `feedback:${f.id}`,
        title: message.slice(0, 100) || "Feedback без текста",
        category: categorizeProblem(`${f.type} ${message}`),
        source: "feedback",
        severity: String(f.priority ?? "medium"),
      });
    }

    for (const issue of issuesRes.data ?? []) {
      uxProblems.push({
        id: `issue:${issue.id}`,
        title: String(issue.title),
        category: categorizeProblem(
          `${issue.title} ${issue.description ?? ""}`,
        ),
        source: "pilot_issues",
        severity: String(issue.severity ?? "medium"),
      });
    }

    const failedGoals = goalsBundle.goals.filter(
      (g) => g.status === "failed" || (g.status === "active" && g.progress < 50),
    );
    for (const g of failedGoals) {
      uxProblems.push({
        id: `goal:${g.id}`,
        title: `Слабый прогресс цели: ${g.title}`,
        category: "no_action",
        source: "goals",
        severity: g.progress < 30 ? "high" : "medium",
      });
    }

    if (
      uxPath.find((s) => s.key === "profile")?.passed &&
      !uxPath.find((s) => s.key === "lia")?.passed
    ) {
      uxProblems.push({
        id: "analytics:drop-lia",
        title: "Обрыв пути: профиль есть, Лия не использовалась",
        category: "no_action",
        source: "analytics_events",
        severity: "high",
      });
    }

    const openCritical = uxProblems.filter(
      (p) => p.severity === "critical" || p.severity === "high",
    ).length;

    const decision = decideNextWave({
      overallProgress: goalsBundle.summary.overallProgress,
      achieved: goalsBundle.summary.achieved,
      failed: goalsBundle.summary.failed,
      active: goalsBundle.summary.active,
      openCritical,
      liaUsed: m.activation.lia_used,
      deals: Math.max(m.business.deals, m.tinda.deals),
    });

    const completed = goalsBundle.goals
      .filter((g) => g.status === "achieved")
      .map((g) => `${g.title}: ${g.current_value}/${g.target_value}`);
    const failed = goalsBundle.goals
      .filter((g) => g.status === "failed")
      .map((g) => `${g.title}: ${g.current_value}/${g.target_value}`);

    const user_activity = [
      `Путь: ${uxPath.filter((s) => s.passed).length}/${uxPath.length} шагов`,
      ...uxPath.map(
        (s) => `${s.passed ? "✓" : "✗"} ${s.label} — ${s.detail}`,
      ),
      `Лия: ${m.activation.lia_used}`,
      `Задачи (completed): ${m.tinda.tasks_done}`,
    ];

    const business_results = [
      `Проект ТИНДА: ${m.tinda.project ? "да" : "нет"}`,
      `Roadmap: ${m.tinda.roadmap ? "да" : "нет"}`,
      `CRM клиенты: ${m.tinda.client_contacts}`,
      `Партнёры: ${m.tinda.partners}`,
      `Сделки: ${m.tinda.deals}`,
      `Заявки волны: ${m.business.applications}`,
      `Project results: ${m.business.results}`,
    ];

    const product_issues = uxProblems
      .slice(0, 12)
      .map((p) => `[${p.category}/${p.source}] ${p.title}`);

    const recommendations: string[] = [
      "Сверяйте цели и UX-путь еженедельно на /admin/wave-review.",
      "Каждую проблему волны прогоняйте в pilot_issue → product_improvement.",
      "Держите сценарии Лии на проекте ТИНДА как обязательный чеклист волны.",
    ];
    if (decision === "needs_improvement") {
      recommendations.unshift(
        "Не расширяйте доступ: закройте high/critical и failed-цели.",
      );
    } else if (decision === "public_ready") {
      recommendations.unshift(
        "Можно готовить план Wave 2 / public — зафиксируйте решение оператора.",
      );
    } else if (decision === "expand_beta") {
      recommendations.unshift(
        "Можно точечно расширять closed-когорту при контроле метрик.",
      );
    }

    const reviewReport: ClosedWaveReviewReport = {
      summary: [
        `Closed Wave Review: ${wave?.name ?? "Closed Wave 1 — ТИНДА"}.`,
        `Прогресс целей ${goalsBundle.summary.overallProgress}%.`,
        `Решение: ${decision}.`,
        "Только анализ — статусы волны Лия/отчёт не меняют автоматически (кроме improvement loop sync).",
      ].join(" "),
      completed_goals:
        completed.length > 0 ? completed : ["Нет achieved целей."],
      failed_goals:
        failed.length > 0
          ? failed
          : failedGoals
              .filter((g) => g.status === "active")
              .map((g) => `В работе <50%: ${g.title} (${g.progress}%)`),
      user_activity,
      business_results,
      product_issues:
        product_issues.length > 0
          ? product_issues
          : ["Критических UX/product сигналов не собрано."],
      recommendations,
      next_wave_decision: decision,
    };

    const success_factors: string[] = [];
    if (m.tinda.project) success_factors.push("Проект ТИНДА создан в ЦКР");
    if (m.tinda.roadmap) success_factors.push("Roadmap зафиксирован");
    if (m.tinda.tasks_done > 0) {
      success_factors.push(`Выполнены задачи (${m.tinda.tasks_done})`);
    }
    if (m.tinda.deals > 0) success_factors.push("Есть сделка по проекту");
    if (m.activation.lia_used > 0) {
      success_factors.push("Лия использовалась в волне");
    }
    if (completed.length > 0) {
      success_factors.push(`Достигнуто целей: ${completed.length}`);
    }
    if (success_factors.length === 0) {
      success_factors.push("Пока мало устойчивых success factors — волна в начале.");
    }

    const patterns: string[] = [];
    const byCat = new Map<string, number>();
    for (const p of uxProblems) {
      byCat.set(p.category, (byCat.get(p.category) ?? 0) + 1);
    }
    for (const [cat, count] of Array.from(byCat.entries())) {
      if (count >= 2) patterns.push(`Паттерн «${cat}»: ${count} сигналов`);
    }
    const dropIndex = uxPath.findIndex((s) => !s.passed);
    if (dropIndex > 0) {
      patterns.push(
        `Обрыв воронки после «${uxPath[dropIndex - 1]?.label}» → «${uxPath[dropIndex]?.label}»`,
      );
    }
    if (patterns.length === 0) {
      patterns.push("Явных повторяющихся паттернов пока недостаточно.");
    }

    const liaReport: WaveReviewReport = {
      summary: reviewReport.summary,
      success_factors,
      problems: product_issues.slice(0, 8),
      patterns,
      recommendations: recommendations.slice(0, 6),
    };

    const risks: string[] = [];
    if (openCritical > 0) {
      risks.push(`${openCritical} high/critical сигналов UX/issues`);
    }
    if (goalsBundle.summary.overallProgress < 70) {
      risks.push("Прогресс целей ниже 70%");
    }
    if (m.activation.lia_used === 0) {
      risks.push("Лия не используется участниками волны");
    }
    if (m.tinda.deals === 0) {
      risks.push("Нет сделок по кейсу ТИНДА");
    }
    if (risks.length === 0) {
      risks.push("Существенных блокеров по текущим данным не видно");
    }

    const improvementLinks = await syncWaveProblemsToImprovementLoop({
      failedGoals: goalsBundle.goals.filter((g) => g.status === "failed"),
      uxProblems,
      actorUserId,
    });

    return {
      wave,
      participants: launch.activation.invited,
      goals: goalsBundle.goals,
      metrics: m,
      activity: {
        lia: m.activation.lia_used,
        projects: Math.max(m.business.projects, m.tinda.project),
        tasks: m.tinda.tasks_done,
        crm: m.tinda.client_contacts + m.tinda.partners,
        applications: m.business.applications,
        deals: Math.max(m.business.deals, m.tinda.deals),
      },
      uxPath,
      uxProblems: uxProblems.slice(0, 20),
      reviewReport,
      liaReport,
      nextWave: {
        decision,
        readiness: goalsBundle.summary.overallProgress,
        risks,
        recommendations: recommendations.slice(0, 5),
        hint: nextWaveDecisionHints[decision],
      },
      improvementLinks,
    };
  } catch {
    return emptyDashboard();
  }
}

export async function buildWaveReviewReport(
  actorUserId?: string | null,
): Promise<WaveReviewReport> {
  const dashboard = await getWaveReviewDashboard(actorUserId);
  return dashboard.liaReport;
}
