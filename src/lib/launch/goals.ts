import {
  goalProgressPercent,
  type LaunchGoalMetricType,
  type LaunchGoalStatus,
} from "@/config/launch-goals";
import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";
import {
  getLaunchMetrics,
  metricValueForGoal,
  type LaunchMetrics,
} from "@/lib/launch/metrics";
import { emitLaunchGoalEvent } from "@/lib/launch/events";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { LaunchGoalRow, LaunchWaveRow } from "@/types/database";
import type { LaunchGoalReport } from "@/types/lia";

export type LaunchGoalView = LaunchGoalRow & {
  progress: number;
  metricLabel: string;
};

export type LaunchGoalsBundle = {
  goals: LaunchGoalView[];
  metrics: LaunchMetrics;
  wave: LaunchWaveRow | null;
  summary: {
    total: number;
    active: number;
    achieved: number;
    failed: number;
    overallProgress: number;
  };
  goalReport: LaunchGoalReport;
};

function emptyBundle(): LaunchGoalsBundle {
  return {
    goals: [],
    metrics: {
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
    },
    wave: null,
    summary: {
      total: 0,
      active: 0,
      achieved: 0,
      failed: 0,
      overallProgress: 0,
    },
    goalReport: {
      summary: "Нет данных по целям запуска.",
      achieved_goals: [],
      failed_goals: [],
      risks: [],
      recommendations: [],
      next_actions: [],
    },
  };
}

export async function listLaunchGoals(
  waveId: string,
): Promise<LaunchGoalRow[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("launch_goals")
      .select("*")
      .eq("wave_id", waveId)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data ?? []) as LaunchGoalRow[];
  } catch {
    return [];
  }
}

/**
 * Пересчитывает current_value целей волны и при необходимости
 * переводит active → achieved (когда current >= target).
 * Не переводит в failed автоматически, кроме evaluateWaveCompletion.
 */
export async function syncLaunchGoalsForWave(
  wave: LaunchWaveRow,
  actorUserId?: string | null,
): Promise<LaunchGoalRow[]> {
  if (!hasSupabaseEnv()) return [];

  const metrics = await getLaunchMetrics(wave);
  let ecosystemMetrics: Awaited<
    ReturnType<
      typeof import("@/lib/launch/ecosystem").getEcosystemMetrics
    >
  > | null = null;
  let ecosystemMetricValueForGoal: typeof import("@/lib/launch/ecosystem").ecosystemMetricValueForGoal | null =
    null;
  if (wave.id === LAUNCH_WAVE_IDS.wave2) {
    const ecosystem = await import("@/lib/launch/ecosystem");
    ecosystemMetrics = await ecosystem.getEcosystemMetrics();
    ecosystemMetricValueForGoal = ecosystem.ecosystemMetricValueForGoal;
  }
  const goals = await listLaunchGoals(wave.id);
  const supabase = createClient();
  const updated: LaunchGoalRow[] = [];

  for (const goal of goals) {
    if (goal.status === "cancelled" || goal.status === "failed") {
      updated.push(goal);
      continue;
    }

    const ecosystemValue =
      ecosystemMetrics && ecosystemMetricValueForGoal
        ? ecosystemMetricValueForGoal(goal.title, ecosystemMetrics)
        : null;
    const current =
      ecosystemValue != null
        ? ecosystemValue
        : metricValueForGoal(goal.metric_type, goal.title, metrics);
    let status = goal.status as LaunchGoalStatus;
    const becameAchieved =
      status === "active" &&
      Number(goal.target_value) > 0 &&
      current >= Number(goal.target_value);

    if (becameAchieved) {
      status = "achieved";
    }

    if (
      current !== Number(goal.current_value) ||
      status !== goal.status
    ) {
      const { data } = await supabase
        .from("launch_goals")
        .update({
          current_value: current,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id)
        .select("*")
        .maybeSingle();
      updated.push(
        (data as LaunchGoalRow) ?? {
          ...goal,
          current_value: current,
          status,
        },
      );

      if (becameAchieved) {
        await emitLaunchGoalEvent({
          eventType: "launch_goal_achieved",
          userId: actorUserId,
          entityId: goal.id,
          title: `Цель достигнута: ${goal.title}`,
          body: `${goal.title}: ${current} / ${goal.target_value}`,
          metadata: { waveId: wave.id, metricType: goal.metric_type },
        });
      }
    } else {
      updated.push(goal);
    }
  }

  return updated;
}

export async function evaluateWaveCompletion(
  wave: LaunchWaveRow,
  actorUserId?: string | null,
): Promise<void> {
  if (!hasSupabaseEnv()) return;
  const supabase = createClient();
  const goals = await syncLaunchGoalsForWave(wave, actorUserId);

  for (const goal of goals) {
    if (goal.status !== "active") continue;
    if (Number(goal.current_value) >= Number(goal.target_value)) continue;

    await supabase
      .from("launch_goals")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", goal.id);

    await emitLaunchGoalEvent({
      eventType: "launch_goal_failed",
      userId: actorUserId,
      entityId: goal.id,
      title: `Цель не достигнута: ${goal.title}`,
      body: `${goal.title}: ${goal.current_value} / ${goal.target_value}`,
      metadata: { waveId: wave.id },
    });
  }

  await emitLaunchGoalEvent({
    eventType: "launch_wave_completed",
    userId: actorUserId,
    entityId: wave.id,
    title: `Волна завершена: ${wave.name}`,
    body: `Волна «${wave.name}» переведена в completed. Цели переоценены.`,
    metadata: { waveType: wave.wave_type },
  });
}

export function buildLaunchGoalReport(
  wave: LaunchWaveRow | null,
  goals: LaunchGoalView[],
  metrics: LaunchMetrics,
): LaunchGoalReport {
  const achieved = goals.filter((g) => g.status === "achieved");
  const failed = goals.filter((g) => g.status === "failed");
  const active = goals.filter((g) => g.status === "active");
  const atRisk = active.filter((g) => g.progress < 50);

  const risks: string[] = [];
  if (!wave) risks.push("Нет активной волны — цели не к чему привязать.");
  if (atRisk.length > 0) {
    risks.push(
      `${atRisk.length} активных целей ниже 50% прогресса.`,
    );
  }
  if (metrics.activation.lia_used === 0 && metrics.users.registered > 0) {
    risks.push("Есть пользователи, но нет использования Лии.");
  }
  if (metrics.business.deals === 0 && metrics.business.projects > 0) {
    risks.push("Проекты есть, сделок пока нет.");
  }
  if (risks.length === 0) {
    risks.push("Критических рисков по текущим данным не видно.");
  }

  const recommendations: string[] = [
    "Синхронизируйте показатели на /admin/launch перед решениемвью с когортой.",
    "Закрывайте цели activation и projects раньше deals — это воронка ценности.",
    "Для ТИНДА держите в фокусе CRM-контакты, переговоры и партнёрства.",
  ];
  if (failed.length > 0) {
    recommendations.push(
      "Разберите failed-цели: снизить target следующей волны или усилить онбординг.",
    );
  }

  const next_actions: string[] = [
    "Обновить current_value целей (автосинхронизация при открытии дашборда).",
    "Прогнать Лию: «Достигнуты ли цели запуска?»",
  ];
  if (active.some((g) => g.metric_type === "users" && g.progress < 100)) {
    next_actions.push("Добавить участников в текущую волну.");
  }
  if (active.some((g) => g.metric_type === "projects" && g.progress < 100)) {
    next_actions.push("Довести участников до создания первого проекта.");
  }

  const waveName = wave?.name ?? "без волны";
  const overall =
    goals.length > 0
      ? Math.round(
          goals.reduce((sum, g) => sum + g.progress, 0) / goals.length,
        )
      : 0;

  return {
    summary: `Цели «${waveName}»: ${achieved.length} достигнуто, ${failed.length} провалено, ${active.length} в работе. Средний прогресс ${overall}%. Только анализ — показатели Лия не меняет.`,
    achieved_goals: achieved.map(
      (g) => `${g.title} (${g.current_value}/${g.target_value})`,
    ),
    failed_goals:
      failed.length > 0
        ? failed.map((g) => `${g.title} (${g.current_value}/${g.target_value})`)
        : active.length > 0
          ? ["Пока нет failed — волна ещё активна."]
          : ["Нет целей для оценки."],
    risks,
    recommendations,
    next_actions,
  };
}

export async function getLaunchGoalsBundle(
  wave: LaunchWaveRow | null,
  actorUserId?: string | null,
): Promise<LaunchGoalsBundle> {
  if (!wave) return emptyBundle();

  try {
    const { launchGoalMetricLabels } = await import("@/config/launch-goals");
    const rows = await syncLaunchGoalsForWave(wave, actorUserId);
    const metrics = await getLaunchMetrics(wave);

    const goals: LaunchGoalView[] = rows.map((g) => ({
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

    const achieved = goals.filter((g) => g.status === "achieved").length;
    const failed = goals.filter((g) => g.status === "failed").length;
    const active = goals.filter((g) => g.status === "active").length;
    const overallProgress =
      goals.length > 0
        ? Math.round(
            goals.reduce((sum, g) => sum + g.progress, 0) / goals.length,
          )
        : 0;

    return {
      goals,
      metrics,
      wave,
      summary: {
        total: goals.length,
        active,
        achieved,
        failed,
        overallProgress,
      },
      goalReport: buildLaunchGoalReport(wave, goals, metrics),
    };
  } catch {
    return emptyBundle();
  }
}
