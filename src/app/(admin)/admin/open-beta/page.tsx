import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  OPEN_BETA_FEEDBACK_CATEGORIES,
  OPEN_BETA_WAVE_NAME,
  openBetaFeedbackCategoryLabels,
} from "@/config/open-beta";
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
import { getOpenBetaDashboard } from "@/lib/launch/open-beta";
import { syncLaunchGoalsForWave } from "@/lib/launch/goals";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Open Beta — Админ" };

export const dynamic = "force-dynamic";

function healthTone(status: "healthy" | "attention" | "critical") {
  if (status === "healthy") return "success" as const;
  if (status === "critical") return "danger" as const;
  return "warning" as const;
}

export default async function AdminOpenBetaPage() {
  const data = await getOpenBetaDashboard();
  if (data.wave) {
    try {
      await syncLaunchGoalsForWave(data.wave);
    } catch {
      // мягкий сбой
    }
  }

  const { users, roles, metrics, funnel, health, report, feedbackByCategory } =
    data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Open Beta Wave 1"
        title="Контролируемый публичный запуск"
        description="Доступ по приглашениям, мониторинг активности, feedback loop и анализ первых публичных результатов. Без новых бизнес-направлений."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/invites" className="text-accent hover:underline">
          Приглашения
        </Link>
        <Link
          href="/admin/open-beta-review"
          className="text-accent hover:underline"
        >
          Open Beta Readiness
        </Link>
        <Link
          href="/admin/open-beta-growth"
          className="text-accent hover:underline"
        >
          Open Beta Growth
        </Link>
        <Link
          href="/admin/beta-expansion"
          className="text-accent hover:underline"
        >
          Beta Expansion
        </Link>
        <Link href="/admin/improvements" className="text-accent hover:underline">
          Улучшения
        </Link>
        <Link
          href="/lia?scenario=open_beta"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: как проходит открытый запуск?
        </Link>
        <span className="text-muted">docs/open-beta-launch-control.md</span>
      </div>

      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            {data.wave?.name ?? OPEN_BETA_WAVE_NAME}
          </h2>
          {data.wave ? (
            <>
              <StatusBadge
                label={
                  launchWaveStatusLabels[data.wave.status as LaunchWaveStatus] ??
                  data.wave.status
                }
                tone={data.wave.status === "active" ? "success" : "neutral"}
              />
              <Badge variant="soft">
                {launchWaveTypeLabels[data.wave.wave_type as LaunchWaveType] ??
                  data.wave.wave_type}
              </Badge>
            </>
          ) : (
            <Badge variant="soft">миграция не применена</Badge>
          )}
          <StatusBadge
            label={`Health: ${health.status}`}
            tone={healthTone(health.status)}
          />
        </div>
        <p className="text-sm text-muted">
          {data.wave?.description ??
            "Примените миграцию 20260325510000_open_beta_wave.sql"}
        </p>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Пользователи</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Приглашено" value={users.invited} />
          <StatsCard label="Зарегистрировано" value={users.registered} />
          <StatsCard label="Активировано" value={users.activated} />
          <StatsCard label="Активно" value={users.active} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Роли</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.key} variant="surface" className="space-y-3 p-5">
              <h3 className="font-display text-lg text-foreground">
                {role.label}
              </h3>
              <p className="text-sm text-muted">
                Приглашено {role.invited} · Зарегистрировано {role.registered} ·
                Активно {role.active}
              </p>
              <p className="text-sm text-foreground">{role.signal}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {role.checks.map((check) => (
                  <li key={check}>{check}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          OpenBetaMetrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Новые пользователи" value={metrics.newUsers} />
          <StatsCard label="Активные" value={metrics.activeUsers} />
          <StatsCard
            label="Проекты"
            value={metrics.projectsCreated}
            hint={`опубликовано ${metrics.projectsPublished}`}
          />
          <StatsCard label="Заявки" value={metrics.applications} />
          <StatsCard label="Интересы" value={metrics.interests} />
          <StatsCard
            label="Экспертные взаимодействия"
            value={metrics.expertInteractions}
          />
          <StatsCard label="Сделки" value={metrics.deals} />
          <StatsCard
            label="Лия"
            value={`${metrics.liaPct}%`}
            hint={`${metrics.liaUsed} чел.`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Пользовательский путь
        </h2>
        <p className="text-sm text-muted">
          Вход → Регистрация → Роль → Профиль → Лия → Первое действие → Результат
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {funnel.map((step) => (
            <Card key={step.key} variant="surface" className="space-y-2 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted">
                {step.label}
              </p>
              <p className="font-display text-2xl text-foreground">
                {step.count}
              </p>
              {step.conversionFromPrevPct != null ? (
                <p className="text-xs text-muted">
                  переход {step.conversionFromPrevPct}%
                  {step.dropOffCount != null && step.dropOffCount > 0
                    ? ` · −${step.dropOffCount}`
                    : ""}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Feedback → Issue → Improvement
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {OPEN_BETA_FEEDBACK_CATEGORIES.map((cat) => (
            <StatsCard
              key={cat}
              label={openBetaFeedbackCategoryLabels[cat]}
              value={feedbackByCategory[cat]}
            />
          ))}
        </div>
        <p className="text-sm text-muted">
          Категории UX · Lia · Project · Expert · Investment · Other. Цикл:{" "}
          <Link href="/admin/improvements" className="text-accent hover:underline">
            /admin/improvements
          </Link>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          OpenBetaHealthCheck
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {health.items.map((item) => (
            <Card key={item.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{item.label}</p>
                <Badge
                  variant={
                    item.status === "ok"
                      ? "accent"
                      : item.status === "fail"
                        ? "soft"
                        : "soft"
                  }
                >
                  {item.status}
                </Badge>
              </div>
              <p className="text-sm text-muted">{item.detail}</p>
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

      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            OpenBetaReport
          </h2>
          <Badge variant="soft">только анализ</Badge>
        </div>
        <p className="text-sm text-muted">{report.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Users", report.users],
              ["Activation", report.activation],
              ["Lia", report.lia_usage],
              ["Ecosystem", report.ecosystem_activity],
              ["Problems", report.problems],
              ["Recommendations", report.recommendations],
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
