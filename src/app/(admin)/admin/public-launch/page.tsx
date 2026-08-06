import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { PublicLaunchReportCard } from "@/components/lia/public-launch-report";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  publicLaunchDecisionLabels,
  type PublicLaunchDecision,
} from "@/config/public-launch-decision";
import {
  publicLaunchFeedbackCategoryLabels,
  type PublicLaunchFeedbackCategory,
} from "@/config/public-launch";
import {
  launchWaveStatusLabels,
  launchWaveTypeLabels,
  type LaunchWaveStatus,
  type LaunchWaveType,
} from "@/config/launch-waves";
import { ActivatePublicLaunchForm } from "@/features/launch/components/activate-public-launch-form";
import { getPublicLaunchDashboard } from "@/lib/launch/public-launch";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Public Launch — Админ" };

export const dynamic = "force-dynamic";

function gateTone(mode: string) {
  if (mode === "active" || mode === "ready") return "success" as const;
  if (mode === "improve_product" || mode === "no_decision") {
    return "danger" as const;
  }
  return "warning" as const;
}

function decisionTone(decision: PublicLaunchDecision | null) {
  if (decision === "public_launch") return "success" as const;
  if (decision === "improve_product") return "danger" as const;
  if (decision === "continue_beta") return "warning" as const;
  return "neutral" as const;
}

export default async function AdminPublicLaunchPage() {
  const data = await getPublicLaunchDashboard();
  const {
    gate,
    wave,
    metrics,
    channels,
    plan90,
    feedbackByCategory,
    report,
    goals,
  } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Public Launch Wave 1"
        title="Управление публичным запуском"
        description="Организованный выход ЦКР из beta: статус Decision Gate, волна, 90 дней, каналы и экосистема. Без новых крупных бизнес-модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/public-launch-decision"
          className="text-accent hover:underline"
        >
          Decision Gate
        </Link>
        <Link
          href="/admin/public-launch-kpi"
          className="text-accent hover:underline"
        >
          KPI
        </Link>
        <Link
          href="/admin/public-launch-operations"
          className="text-accent hover:underline"
        >
          Operations
        </Link>
        <Link href="/admin/open-beta" className="text-accent hover:underline">
          Open Beta
        </Link>
        <Link href="/admin/invites" className="text-accent hover:underline">
          Приглашения
        </Link>
        <Link href="/admin/improvements" className="text-accent hover:underline">
          Улучшения
        </Link>
        <Link
          href="/lia?scenario=public_launch"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: как проходит публичный запуск?
        </Link>
        <span className="text-muted">docs/public-launch-execution.md</span>
      </div>

      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            Статус запуска
          </h2>
          <StatusBadge label={gate.mode} tone={gateTone(gate.mode)} />
          {gate.decision ? (
            <StatusBadge
              label={
                publicLaunchDecisionLabels[
                  gate.decision as PublicLaunchDecision
                ] ?? gate.decision
              }
              tone={decisionTone(gate.decision as PublicLaunchDecision)}
            />
          ) : (
            <Badge variant="soft">решения нет</Badge>
          )}
        </div>
        <p className="text-sm text-muted">{gate.message}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Решение Decision Gate
            </p>
            <p className="mt-1 text-foreground">{gate.decision ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Текущая волна
            </p>
            <p className="mt-1 text-foreground">
              {wave?.name ?? "Public Launch Wave 1"}
              {wave ? (
                <>
                  {" · "}
                  {launchWaveStatusLabels[wave.status as LaunchWaveStatus] ??
                    wave.status}
                </>
              ) : null}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Дата запуска
            </p>
            <p className="mt-1 text-foreground">
              {wave?.start_date
                ? new Date(wave.start_date).toLocaleDateString("ru-RU")
                : "не активирована"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Ответственные
            </p>
            <p className="mt-1 text-foreground">
              {gate.responsible ?? "Команда ЦКР"}
            </p>
          </div>
        </div>
        {gate.decisionComment ? (
          <p className="text-sm text-muted">
            Комментарий решения: {gate.decisionComment}
          </p>
        ) : null}
        {wave ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="soft">
              {launchWaveTypeLabels[wave.wave_type as LaunchWaveType] ??
                wave.wave_type}
            </Badge>
            {plan90.dayOfLaunch ? (
              <Badge variant="accent">День {plan90.dayOfLaunch}</Badge>
            ) : null}
          </div>
        ) : null}
        {(gate.mode === "ready" || gate.mode === "no_decision") && (
          <ActivatePublicLaunchForm canActivate={gate.canActivate} />
        )}
        {gate.mode === "continue_beta" ? (
          <Link href="/admin/open-beta" className="text-sm text-accent hover:underline">
            Перейти к Open Beta
          </Link>
        ) : null}
        {gate.mode === "improve_product" ? (
          <Link
            href="/admin/improvements"
            className="text-sm text-accent hover:underline"
          >
            Перейти к улучшениям
          </Link>
        ) : null}
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Пользователи</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard label="Регистрации" value={metrics.registrations} />
          <StatsCard label="Активные" value={metrics.activeUsers} />
          <StatsCard
            label="Предприниматели"
            value={metrics.roles.entrepreneurs}
          />
          <StatsCard label="Эксперты (роли)" value={metrics.roles.experts} />
          <StatsCard label="Инвесторы" value={metrics.roles.investors} />
          <StatsCard
            label="Организации"
            value={metrics.roles.organizations}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Активность</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard label="Проекты" value={metrics.projects} />
          <StatsCard label="Эксперты" value={metrics.experts} />
          <StatsCard label="Инвестиции" value={metrics.investments} />
          <StatsCard label="Возможности" value={metrics.opportunities} />
          <StatsCard
            label="Лия"
            value={`${metrics.liaUsed} (${metrics.liaPct}%)`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Экосистема</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Связи" value={metrics.connections} />
          <StatsCard label="Заявки" value={metrics.applications} />
          <StatsCard label="Интересы" value={metrics.interests} />
          <StatsCard label="Сделки" value={metrics.deals} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          PublicLaunch90Days
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plan90.phases.map((phase) => (
            <Card key={phase.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-foreground">{phase.label}</h3>
                <Badge
                  variant={phase.status === "active" ? "accent" : "soft"}
                >
                  {phase.status}
                </Badge>
              </div>
              <p className="text-sm text-muted">Цель: {phase.goal}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {phase.metrics.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">LaunchChannels</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="surface" className="space-y-2 p-4">
            <h3 className="font-medium text-foreground">Приглашения</h3>
            <ul className="space-y-1 text-sm">
              {channels.totals.map((c) => (
                <li key={c.channel} className="flex justify-between gap-2">
                  <span>{c.label}</span>
                  <span className="text-muted">{c.count}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card variant="surface" className="space-y-2 p-4">
            <h3 className="font-medium text-foreground">Регистрации по каналам</h3>
            <ul className="space-y-1 text-sm">
              {channels.registrationsByChannel.map((c) => (
                <li key={c.channel} className="flex justify-between gap-2">
                  <span>{c.label}</span>
                  <span className="text-muted">{c.count}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Feedback → Issues → Improvements
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(
            Object.keys(feedbackByCategory) as PublicLaunchFeedbackCategory[]
          ).map((key) => (
            <StatsCard
              key={key}
              label={publicLaunchFeedbackCategoryLabels[key]}
              value={feedbackByCategory[key]}
            />
          ))}
        </div>
        <p className="text-sm text-muted">
          Public users → feedback (категория public_launch) → issues →
          improvements. Critical: {metrics.openCritical} · open issues:{" "}
          {metrics.openIssues} · improvements: {metrics.improvementsInProgress}.
        </p>
      </section>

      {goals.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-foreground">Цели волны</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((g) => (
              <Card key={g.id} variant="surface" className="space-y-1 p-4">
                <h3 className="font-medium text-foreground">{g.title}</h3>
                <p className="text-sm text-muted">
                  {g.current_value} / {g.target_value} · {g.progress}%
                </p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          PublicLaunchReport
        </h2>
        <PublicLaunchReportCard report={report} />
      </section>
    </div>
  );
}
