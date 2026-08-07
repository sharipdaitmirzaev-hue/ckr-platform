import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { LiveLaunchReportCard } from "@/components/lia/live-launch-report";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { LaunchOpsTaskForm } from "@/features/launch/components/launch-ops-task-form";
import { LaunchOpsTaskStatusSelect } from "@/features/launch/components/launch-ops-task-status";
import { getPublicLaunchOperationsDashboard } from "@/lib/launch/public-launch-operations";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Launch Operations — Админ",
};

export const dynamic = "force-dynamic";

function healthTone(status: "healthy" | "attention" | "critical") {
  if (status === "healthy") return "success" as const;
  if (status === "critical") return "danger" as const;
  return "warning" as const;
}

function itemTone(status: "ok" | "warn" | "fail") {
  if (status === "ok") return "success" as const;
  if (status === "fail") return "danger" as const;
  return "warning" as const;
}

export default async function AdminPublicLaunchOperationsPage() {
  const data = await getPublicLaunchOperationsDashboard();
  const {
    gateMode,
    canOperate,
    wave,
    activation,
    goals,
    users,
    scenarios,
    daily,
    health,
    tasks,
    taskCounts,
    feedbackLoop,
    report,
  } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Launch Operations"
        title="Операционное управление публичным запуском"
        description="Активная волна, ежедневные метрики, health, задачи команды и feedback loop. ЦКР работает как публичная beta-платформа."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/public-launch" className="text-accent hover:underline">
          Public Launch
        </Link>
        <Link
          href="/admin/public-launch-kpi"
          className="text-accent hover:underline"
        >
          KPI
        </Link>
        <Link
          href="/admin/public-launch-decision"
          className="text-accent hover:underline"
        >
          Decision Gate
        </Link>
        <Link href="/admin/improvements" className="text-accent hover:underline">
          Улучшения
        </Link>
        <Link
          href="/lia?scenario=live_launch"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: как проходит запуск сейчас?
        </Link>
        <span className="text-muted">docs/public-launch-operations.md</span>
      </div>

      {!canOperate ? (
        <Card variant="surface" className="space-y-2 p-5">
          <StatusBadge label={gateMode} tone="warning" />
          <p className="text-sm text-muted">
            Операционный режим доступен после активации волны при решении
            public_launch. Сейчас: {gateMode}.
          </p>
          <Link href="/admin/public-launch" className="text-sm text-accent hover:underline">
            Перейти к активации / статусу запуска
          </Link>
        </Card>
      ) : null}

      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            Статус запуска
          </h2>
          <StatusBadge
            label={health.status}
            tone={healthTone(health.status)}
          />
          {wave.dayOfLaunch ? (
            <Badge variant="accent">День {wave.dayOfLaunch}</Badge>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Активная волна
            </p>
            <p className="mt-1">
              {wave.name} · {wave.status ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Дни с запуска
            </p>
            <p className="mt-1">{wave.dayOfLaunch ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Дата старта
            </p>
            <p className="mt-1">
              {wave.startDate
                ? new Date(wave.startDate).toLocaleDateString("ru-RU")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Ответственный
            </p>
            <p className="mt-1">{activation?.responsible ?? "—"}</p>
          </div>
        </div>
        {activation?.comment ? (
          <p className="text-sm text-muted">
            Комментарий запуска: {activation.comment}
          </p>
        ) : null}
        {goals.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {goals.slice(0, 6).map((g) => (
              <div
                key={g.id}
                className="rounded-sm border border-border px-3 py-2 text-sm"
              >
                <p className="font-medium">{g.title}</p>
                <p className="text-muted">
                  {g.current} / {g.target} · {g.progress}%
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Пользователи</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard label="Новые регистрации" value={users.newRegistrations} />
          <StatsCard label="Активированные" value={users.activated} />
          <StatsCard label="Активные" value={users.active} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Сценарии ролей</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["Предприниматель", scenarios.entrepreneurs],
              ["Эксперт", scenarios.experts],
              ["Инвестор", scenarios.investors],
              ["Организация", scenarios.organizations],
            ] as const
          ).map(([title, items]) => (
            <Card key={title} variant="surface" className="space-y-2 p-4">
              <h3 className="font-medium">{title}</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          LaunchDailyMetrics · {daily.date}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Регистрации за день" value={daily.registrations} />
          <StatsCard label="Активные пользователи" value={daily.activeUsers} />
          <StatsCard label="Новые проекты" value={daily.newProjects} />
          <StatsCard label="Новые эксперты" value={daily.newExperts} />
          <StatsCard label="Использование Лии" value={daily.liaUsed} />
          <StatsCard label="Заявки" value={daily.applications} />
          <StatsCard label="Сделки" value={daily.deals} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            LaunchHealthMonitor
          </h2>
          <StatusBadge
            label={health.status}
            tone={healthTone(health.status)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {health.items.map((item) => (
            <Card key={item.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="soft">{item.area}</Badge>
                <StatusBadge
                  label={item.status}
                  tone={itemTone(item.status)}
                />
              </div>
              <p className="font-medium text-sm">{item.label}</p>
              <p className="text-sm text-muted">{item.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            LaunchOperationsTasks
          </h2>
          <Badge variant="soft">new {taskCounts.new}</Badge>
          <Badge variant="soft">in_progress {taskCounts.in_progress}</Badge>
          <Badge variant="soft">completed {taskCounts.completed}</Badge>
        </div>
        <Card variant="surface" className="space-y-3 p-5">
          <LaunchOpsTaskForm />
        </Card>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted">
              Задач пока нет. Они создаются при активации волны или вручную.
            </p>
          ) : (
            tasks.map((task) => (
              <Card
                key={task.id}
                variant="surface"
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="soft">{task.taskTypeLabel}</Badge>
                    <span className="font-medium text-sm">{task.title}</span>
                  </div>
                  {task.description ? (
                    <p className="text-sm text-muted">{task.description}</p>
                  ) : null}
                </div>
                <LaunchOpsTaskStatusSelect
                  taskId={task.id}
                  status={task.status}
                />
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Feedback → Issue → Improvement
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Feedback public_launch"
            value={feedbackLoop.feedbackPublicLaunch}
          />
          <StatsCard label="Open issues" value={feedbackLoop.openIssues} />
          <StatsCard label="Improvements" value={feedbackLoop.improvements} />
          <StatsCard label="Critical" value={feedbackLoop.openCritical} />
        </div>
        <p className="text-sm text-muted">
          Источник цепочки: <code>public_launch</code> (feedback category /
          product_improvements.source_type).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">LiveLaunchReport</h2>
        <LiveLaunchReportCard report={report} />
      </section>
    </div>
  );
}
