import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  launchGoalStatusLabels,
  type LaunchGoalStatus,
} from "@/config/launch-goals";
import {
  launchWaveStatusLabels,
  launchWaveTypeLabels,
  type LaunchWaveStatus,
  type LaunchWaveType,
} from "@/config/launch-waves";
import { roleLabels } from "@/config/roles";
import type { UserRole } from "@/types";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getFirstUsersDashboard } from "@/lib/launch/first-users";
import { syncLaunchGoalsForWave } from "@/lib/launch/goals";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "First Users — Админ" };

export const dynamic = "force-dynamic";

export default async function AdminFirstUsersPage() {
  const current = await getCurrentUser();
  let data = await getFirstUsersDashboard();
  if (data.wave) {
    await syncLaunchGoalsForWave(data.wave, current?.user.id ?? null);
    data = await getFirstUsersDashboard();
  }
  const { metrics, report, users, scenarios, problems, lia, journeys } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="First Users Wave"
        title="Первый запуск на реальных пользователях"
        description="Ограниченная когорта: приглашения, сценарии по ролям, feedback loop и анализ поведения. Без массового запуска."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/invites" className="text-accent hover:underline">
          Приглашения
        </Link>
        <Link href="/admin/launch" className="text-accent hover:underline">
          Launch
        </Link>
        <Link href="/admin/improvements" className="text-accent hover:underline">
          Улучшения
        </Link>
        <Link href="/admin/pilot" className="text-accent hover:underline">
          Pilot
        </Link>
        <Link
          href="/lia?scenario=first_users"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: как прошёл первый запуск?
        </Link>
        <span className="text-muted">docs/first-users-wave.md</span>
      </div>

      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">Волна</h2>
          {data.wave ? (
            <>
              <Badge variant="accent">
                {
                  launchWaveTypeLabels[
                    data.wave.wave_type as LaunchWaveType
                  ]
                }
              </Badge>
              <Badge variant="soft">
                {
                  launchWaveStatusLabels[
                    data.wave.status as LaunchWaveStatus
                  ]
                }
              </Badge>
            </>
          ) : (
            <Badge variant="default">примените миграцию 48</Badge>
          )}
        </div>
        <p className="font-medium text-foreground">
          {data.wave?.name ?? "First Users Wave"}
        </p>
        <p className="text-sm text-muted">
          {data.wave?.description ||
            "Проверить первые реальные пользовательские сценарии ЦКР."}
        </p>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Пользователи</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard label="Приглашено" value={users.invited} />
          <StatsCard label="Зарегистрировано" value={users.registered} />
          <StatsCard label="Активно" value={users.active} />
        </div>
        <p className="text-sm text-muted">
          Завершили сценарий: {users.completed} · Отключены: {users.disabled} ·
          Активация: {metrics.activationPct}%
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Сценарии</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {scenarios.map((scenario) => (
            <Card key={scenario.key} variant="surface" className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg text-foreground">
                  {scenario.label}
                </h3>
                <Badge variant="soft">
                  цель {scenario.targetMin}–{scenario.targetMax}
                </Badge>
              </div>
              <p className="text-sm text-muted">
                Приглашено {scenario.invited} · Зарегистрировано{" "}
                {scenario.registered} · Активно {scenario.active}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {scenario.checks.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {data.goals.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-foreground">Цели волны</h2>
          <div className="space-y-3">
            {data.goals.map((goal) => (
              <Card key={goal.id} variant="surface" className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{goal.title}</p>
                  <StatusBadge
                    label={
                      launchGoalStatusLabels[
                        goal.status as LaunchGoalStatus
                      ] ?? goal.status
                    }
                    tone={
                      goal.status === "achieved"
                        ? "success"
                        : goal.status === "failed"
                          ? "danger"
                          : "neutral"
                    }
                  />
                </div>
                <ProgressBar value={goal.progress} />
                <p className="text-xs text-muted">
                  {goal.current_value} / {goal.target_value} · {goal.metricLabel}
                </p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Проблемы</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard label="Всего открытых" value={data.problemSummary.total} />
          <StatsCard
            label="High / Critical"
            value={
              (data.problemSummary.byPriority.high ?? 0) +
              (data.problemSummary.byPriority.critical ?? 0)
            }
          />
          <StatsCard
            label="Feedback"
            value={metrics.feedbackSent}
            hint="feedback → issues → improvements"
          />
        </div>
        {problems.length === 0 ? (
          <p className="text-sm text-muted">Открытых pilot_issues нет.</p>
        ) : (
          <ul className="space-y-2">
            {problems.slice(0, 10).map((problem) => (
              <li
                key={problem.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border px-4 py-3 text-sm"
              >
                <span className="text-foreground">{problem.title}</span>
                <span className="flex gap-2">
                  <Badge variant="soft">{problem.priority}</Badge>
                  <Badge variant="default">{problem.status}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/admin/improvements"
          className="text-sm text-accent hover:underline"
        >
          Цикл улучшений →
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Активность Лии</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatsCard label="Диалогов" value={lia.dialogues} />
          <Card variant="surface" className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Сценарии
            </p>
            {lia.scenarios.length === 0 ? (
              <p className="text-sm text-muted">Пока нет размеченных сценариев.</p>
            ) : (
              <ul className="space-y-1 text-sm text-foreground">
                {lia.scenarios.map((item) => (
                  <li key={item.scenario} className="flex justify-between gap-3">
                    <span>{item.scenario}</span>
                    <span className="text-muted">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Путь участников
        </h2>
        <p className="text-sm text-muted">
          Регистрация → Роль → Профиль → Первое действие → Лия → Создание
          объекта. Фиксируем остановку, время и вопросы из feedback.
        </p>
        {journeys.length === 0 ? (
          <p className="text-sm text-muted">
            Приглашений волны пока нет — создайте в{" "}
            <Link href="/admin/invites" className="text-accent hover:underline">
              /admin/invites
            </Link>{" "}
            с источником First Users Wave.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Роль</th>
                  <th className="px-3 py-2">Статус</th>
                  <th className="px-3 py-2">Остановка</th>
                  <th className="px-3 py-2">Часы</th>
                  <th className="px-3 py-2">Вопросы</th>
                </tr>
              </thead>
              <tbody>
                {journeys.slice(0, 40).map((row) => (
                  <tr key={row.inviteId} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{row.email}</td>
                    <td className="px-3 py-2 text-muted">
                      {roleLabels[row.role as UserRole] ?? row.role}
                    </td>
                    <td className="px-3 py-2 text-muted">{row.inviteStatus}</td>
                    <td className="px-3 py-2 text-foreground">{row.stoppedAt}</td>
                    <td className="px-3 py-2 text-muted">
                      {row.durationHours ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {row.questions[0]
                        ? `${row.questions[0].slice(0, 60)}…`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            FirstUsersReport
          </h2>
          <Badge variant="soft">только анализ</Badge>
        </div>
        <p className="text-sm text-muted">{report.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Активация", report.activation],
              ["Поведение", report.user_behavior],
              ["Проблемы", report.problems],
              ["Успехи", report.success_cases],
              ["Рекомендации", report.recommendations],
            ] as const
          ).map(([title, items]) => (
            <div key={title}>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {title}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
