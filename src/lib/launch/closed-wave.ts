import { LAUNCH_WAVE_IDS } from "@/config/launch-waves";
import { getLaunchGoalsBundle } from "@/lib/launch/goals";
import { getLaunchWaveDashboard } from "@/lib/launch/waves";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { ClosedWaveReport } from "@/types/lia";

/**
 * Анализ первой закрытой волны ЦКР (ТИНДА). Только чтение данных.
 */
export async function buildClosedWaveReport(
  actorUserId?: string | null,
): Promise<ClosedWaveReport> {
  if (!hasSupabaseEnv()) {
    return {
      summary:
        "Нет подключения к Supabase — ClosedWaveReport недоступен в этом окружении.",
      completed_goals: [],
      failed_goals: [],
      user_experience: [],
      business_results: [],
      recommendations: [
        "Настройте env и примените миграции wave_launch + launch_goals + closed_wave_tinda.",
      ],
    };
  }

  const dashboard = await getLaunchWaveDashboard();
  const wave =
    dashboard.waves.find((w) => w.id === LAUNCH_WAVE_IDS.closed) ??
    dashboard.currentWave;
  const goals = await getLaunchGoalsBundle(wave, actorUserId);

  const completed = goals.goals
    .filter((g) => g.status === "achieved")
    .map((g) => `${g.title} (${g.current_value}/${g.target_value})`);
  const failed = goals.goals
    .filter((g) => g.status === "failed")
    .map((g) => `${g.title} (${g.current_value}/${g.target_value})`);
  const inProgress = goals.goals.filter((g) => g.status === "active");

  const user_experience: string[] = [
    `Волна: ${wave?.name ?? "Closed Wave 1 — ТИНДА"} (${wave?.status ?? "—"})`,
    `Участники волны: ${dashboard.activation.invited} · joined+: ${dashboard.activation.joinedOrActive}`,
    `Активация: ${dashboard.activation.rate}%`,
    `Онбординг / профиль (события): ${goals.metrics.activation.profile_completed}`,
    `Использование Лии: ${goals.metrics.activation.lia_used}`,
    inProgress.length > 0
      ? `В работе целей: ${inProgress.length} (средний прогресс ${goals.summary.overallProgress}%)`
      : "Активных целей не осталось — все закрыты или отменены.",
  ];

  if (dashboard.problems.length > 0) {
    user_experience.push(
      `Открытые проблемы: ${dashboard.problems
        .slice(0, 3)
        .map((p) => p.title)
        .join("; ")}`,
    );
  }

  const business_results: string[] = [
    `Проект ТИНДА: ${goals.metrics.tinda.project ? "есть" : "нет"}`,
    `Roadmap: ${goals.metrics.tinda.roadmap ? "создан" : "нет"}`,
    `Завершённые задачи: ${goals.metrics.tinda.tasks_done}`,
    `KPI обновлены: ${goals.metrics.tinda.kpi_updated ? "да" : "нет"}`,
    `Клиенты CRM: ${goals.metrics.tinda.client_contacts}`,
    `Партнёры: ${goals.metrics.tinda.partners}`,
    `Сделки: ${goals.metrics.tinda.deals}`,
    `Заявки (волна): ${goals.metrics.business.applications}`,
  ];

  const recommendations: string[] = [
    "Довести этап «Продажи»: первые заявки и переговоры до фиксации в workspace.",
    "Пройти сценарии Лии: аудит → стратегия → прогресс → результат — и сравнить с roadmap.",
    "Перед следующей волной закрыть critical/high на /admin/launch.",
  ];
  if (goals.summary.achieved >= 6) {
    recommendations.unshift(
      "Большинство целей Closed Wave 1 достигнуто — можно готовить критерии перехода к public wave.",
    );
  } else if (goals.summary.overallProgress < 50) {
    recommendations.unshift(
      "Прогресс целей ниже 50% — усилить сопровождение команды ТИНДА и онбординг.",
    );
  }

  const summary = [
    `Анализ «${wave?.name ?? "Closed Wave 1 — ТИНДА"}».`,
    `Достигнуто целей: ${completed.length}, failed: ${failed.length}, в работе: ${inProgress.length}.`,
    `Средний прогресс ${goals.summary.overallProgress}%.`,
    "Лия только анализирует — статусы целей и данные проекта не меняет.",
  ].join(" ");

  return {
    summary,
    completed_goals:
      completed.length > 0 ? completed : ["Пока нет achieved — волна в работе."],
    failed_goals:
      failed.length > 0
        ? failed
        : inProgress.map(
            (g) => `Ещё в работе: ${g.title} (${g.progress}%)`,
          ),
    user_experience,
    business_results,
    recommendations,
  };
}
