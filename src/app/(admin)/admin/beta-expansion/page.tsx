import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  BETA_EXPANSION_DECISIONS,
  BETA_EXPANSION_JOURNEY_STEPS,
  BETA_EXPANSION_WAVE_NAME,
  betaExpansionDecisionLabels,
} from "@/config/beta-expansion";
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
import { getBetaExpansionDashboard } from "@/lib/launch/beta-expansion";
import { syncLaunchGoalsForWave } from "@/lib/launch/goals";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Beta Expansion — Админ" };

export const dynamic = "force-dynamic";

export default async function AdminBetaExpansionPage() {
  const data = await getBetaExpansionDashboard();
  if (data.wave) {
    try {
      await syncLaunchGoalsForWave(data.wave);
    } catch {
      // мягкий сбой синхронизации целей
    }
  }

  const { metrics, users, roles, ecosystem, decision, report, compare } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Beta Expansion Wave"
        title="Расширенная закрытая beta"
        description="Масштабирование сценариев после Product Fix Sprint: аудитория, активация, связи. Без новых крупных бизнес-модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/invites" className="text-accent hover:underline">
          Приглашения
        </Link>
        <Link href="/admin/first-users" className="text-accent hover:underline">
          First Users
        </Link>
        <Link
          href="/admin/product-sprint"
          className="text-accent hover:underline"
        >
          Product Fix Sprint
        </Link>
        <Link
          href="/admin/open-beta-review"
          className="text-accent hover:underline"
        >
          Open Beta Review
        </Link>
        <Link href="/admin/improvements" className="text-accent hover:underline">
          Улучшения
        </Link>
        <Link
          href="/lia?scenario=beta_expansion"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: как проходит расширенная beta?
        </Link>
        <span className="text-muted">docs/beta-expansion.md</span>
      </div>

      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            {data.wave?.name ?? BETA_EXPANSION_WAVE_NAME}
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
        </div>
        <p className="text-sm text-muted">
          {data.wave?.description ??
            "Примените миграцию 20260325500000_beta_expansion_wave.sql"}
        </p>
        <p className="text-xs text-muted">
          Путь: {BETA_EXPANSION_JOURNEY_STEPS.map((s) => s.label).join(" → ")}
        </p>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Пользователи</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard label="Приглашено" value={users.invited} />
          <StatsCard label="Зарегистрировано" value={users.registered} />
          <StatsCard label="Активно" value={users.active} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Роли</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.key} variant="surface" className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg text-foreground">
                  {role.label}
                </h3>
                <Badge variant="soft">
                  цель {role.targetMin}–{role.targetMax}
                </Badge>
              </div>
              <p className="text-sm text-muted">
                Приглашено {role.invited} · Зарегистрировано {role.registered} ·
                Активно {role.active}
              </p>
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
        <h2 className="font-display text-xl text-foreground">Активация</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Профили"
            value={`${metrics.profilePct}%`}
            hint={`${metrics.profileCompleted} чел. · цель 70%`}
          />
          <StatsCard
            label="Лия"
            value={`${metrics.liaPct}%`}
            hint={`${metrics.liaUsed} чел. · цель 50%`}
          />
          <StatsCard
            label="Проекты / объекты"
            value={metrics.projects}
            hint={`первый объект ${metrics.firstObjectPct}% · цель 30%`}
          />
          <StatsCard
            label="Заявки"
            value={metrics.applications}
            hint={`интерес ${metrics.interests}`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Экосистема</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard label="Связи / проекты" value={ecosystem.projects} />
          <StatsCard
            label="Взаимодействия"
            value={ecosystem.expertInteractions}
            hint="экспертные"
          />
          <StatsCard label="Интересы" value={ecosystem.interests} />
          <StatsCard label="Заявки" value={ecosystem.applications} />
          <StatsCard label="Результаты" value={ecosystem.deals} hint="сделки" />
        </div>
        <p className="text-sm text-muted">{ecosystem.connectionsHint}</p>
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
        <h2 className="font-display text-xl text-foreground">
          Сравнение волн
        </h2>
        <div className="overflow-x-auto rounded-sm border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-3 py-2">Метрика</th>
                <th className="px-3 py-2">{compare.firstUsers.name}</th>
                <th className="px-3 py-2">{compare.betaExpansion.name}</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Приглашено", compare.firstUsers.invited, compare.betaExpansion.invited],
                  ["Зарегистрировано", compare.firstUsers.registered, compare.betaExpansion.registered],
                  ["Активно", compare.firstUsers.active, compare.betaExpansion.active],
                  ["Регистрация %", compare.firstUsers.registrationPct, compare.betaExpansion.registrationPct],
                  ["Лия %", compare.firstUsers.liaPct, compare.betaExpansion.liaPct],
                  ["Первое действие %", compare.firstUsers.firstActionPct, compare.betaExpansion.firstActionPct],
                  ["Проекты", compare.firstUsers.projects, compare.betaExpansion.projects],
                ] as const
              ).map(([label, a, b]) => (
                <tr key={label} className="border-t border-border">
                  <td className="px-3 py-2 text-muted">{label}</td>
                  <td className="px-3 py-2 text-foreground">{a}</td>
                  <td className="px-3 py-2 text-foreground">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Feedback loop: до / после Product Fix
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card variant="surface" className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              До Product Fix
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {data.feedbackLoop.beforeFix.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card variant="surface" className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              После Product Fix
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
              {data.feedbackLoop.afterFix.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-xs text-muted">
              Open issues: {data.feedbackLoop.openIssues} · Released:{" "}
              {data.feedbackLoop.releasedImprovements} · Planned:{" "}
              {data.feedbackLoop.plannedImprovements}
            </p>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          BetaExpansionDecision
        </h2>
        <Card variant="surface" className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={decision.label}
              tone={
                decision.decision === "open_beta_ready"
                  ? "success"
                  : decision.decision === "needs_improvement"
                    ? "danger"
                    : "accent"
              }
            />
            <Badge variant="soft">готовность {decision.readiness}%</Badge>
          </div>
          <ProgressBar value={decision.readiness} />
          <p className="text-sm text-muted">{decision.hint}</p>
          <div className="flex flex-wrap gap-2">
            {BETA_EXPANSION_DECISIONS.map((item) => (
              <Badge
                key={item}
                variant={item === decision.decision ? "accent" : "soft"}
              >
                {betaExpansionDecisionLabels[item]}
              </Badge>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Риски
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                {decision.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Рекомендации
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                {decision.recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Путь участников
        </h2>
        {data.journey.length === 0 ? (
          <p className="text-sm text-muted">
            Приглашений Beta Expansion пока нет — создайте в{" "}
            <Link href="/admin/invites" className="text-accent hover:underline">
              /admin/invites
            </Link>{" "}
            с источником Beta Expansion Wave.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Роль</th>
                  <th className="px-3 py-2">Статус</th>
                  <th className="px-3 py-2">Шаги</th>
                  <th className="px-3 py-2">Остановка</th>
                </tr>
              </thead>
              <tbody>
                {data.journey.slice(0, 40).map((row) => (
                  <tr key={row.inviteId} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{row.email}</td>
                    <td className="px-3 py-2 text-muted">{row.role}</td>
                    <td className="px-3 py-2 text-muted">{row.inviteStatus}</td>
                    <td className="px-3 py-2 text-muted">
                      {row.completedSteps.length}/
                      {BETA_EXPANSION_JOURNEY_STEPS.length}
                    </td>
                    <td className="px-3 py-2 text-muted">{row.stoppedAt}</td>
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
            BetaExpansionReport
          </h2>
          <Badge variant="soft">только анализ</Badge>
        </div>
        <p className="text-sm text-muted">{report.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Activation", report.activation],
              ["Role analysis", report.role_analysis],
              ["Lia usage", report.lia_usage],
              ["Ecosystem", report.ecosystem_growth],
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
