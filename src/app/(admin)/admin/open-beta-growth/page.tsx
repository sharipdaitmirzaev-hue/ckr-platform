import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { RetentionReportCard } from "@/components/lia/retention-report";
import { RoleGrowthReportCard } from "@/components/lia/role-growth-report";
import { UserValueFeedbackReportCard } from "@/components/lia/user-value-feedback-report";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  GROWTH_ROLE_LABELS,
  RETENTION_DAYS,
  openBetaGrowthDecisionLabels,
  type GrowthRoleKey,
  type OpenBetaGrowthDecision,
} from "@/config/open-beta-growth";
import { getOpenBetaGrowthDashboard } from "@/lib/launch/open-beta-growth";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Open Beta Growth — Админ" };

export const dynamic = "force-dynamic";

function decisionTone(decision: OpenBetaGrowthDecision) {
  if (decision === "scale_public") return "success" as const;
  if (decision === "continue_growth") return "warning" as const;
  return "danger" as const;
}

export default async function AdminOpenBetaGrowthPage() {
  const data = await getOpenBetaGrowthDashboard();
  const {
    growth,
    retention,
    valuableActions,
    roleGrowth,
    ecosystem,
    feedbackValue,
    decision,
    retentionReport,
    scaleCriteria,
  } = data;

  const roleKeys = Object.keys(GROWTH_ROLE_LABELS) as GrowthRoleKey[];

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Open Beta Growth"
        title="Рост и удержание после Open Beta"
        description="Аналитика возврата пользователей, ценности действий и ролей. Без новых бизнес-модулей — только понимание постоянной ценности ЦКР."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/open-beta" className="text-accent hover:underline">
          Open Beta
        </Link>
        <Link
          href="/admin/open-beta-review"
          className="text-accent hover:underline"
        >
          Open Beta Readiness
        </Link>
        <Link href="/admin/improvements" className="text-accent hover:underline">
          Улучшения
        </Link>
        <Link
          href="/lia?scenario=open_beta_growth"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: почему пользователи возвращаются?
        </Link>
        <span className="text-muted">docs/open-beta-growth.md</span>
      </div>

      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            OpenBetaGrowthDecision
          </h2>
          <StatusBadge
            label={openBetaGrowthDecisionLabels[decision.decision]}
            tone={decisionTone(decision.decision)}
          />
          <Badge variant="soft">readiness {decision.readiness}%</Badge>
        </div>
        <p className="text-sm text-muted">{decision.hint}</p>
        <ProgressBar value={decision.readiness} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Показатели
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {decision.indicators.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              Проблемы
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {decision.problems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Рекомендации
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {decision.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Рост пользователей</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Новые регистрации"
            value={String(growth.newRegistrations)}
          />
          <StatsCard
            label="Активные пользователи"
            value={String(growth.activeUsers)}
          />
          <StatsCard
            label="Когорта retention"
            value={String(retention.cohortSize)}
          />
          <StatsCard
            label="Вернулись"
            value={String(retention.returningUsers)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roleKeys.map((key) => (
            <StatsCard
              key={key}
              label={`Активные: ${GROWTH_ROLE_LABELS[key]}`}
              value={String(growth.activeRoles[key])}
            />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="surface" className="space-y-2 p-4">
            <h3 className="font-medium text-foreground">Источники привлечения</h3>
            {growth.sources.length === 0 ? (
              <p className="text-sm text-muted">Нет данных по источникам</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {growth.sources.map((s) => (
                  <li key={s.source} className="flex justify-between gap-2">
                    <span>{s.source}</span>
                    <span className="text-muted">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card variant="surface" className="space-y-2 p-4">
            <h3 className="font-medium text-foreground">Каналы</h3>
            {growth.channels.length === 0 ? (
              <p className="text-sm text-muted">Нет данных по каналам</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {growth.channels.map((c) => (
                  <li key={c.channel} className="flex justify-between gap-2">
                    <span>{c.channel}</span>
                    <span className="text-muted">{c.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          RetentionMetrics — возврат пользователей
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RETENTION_DAYS.map((day) => (
            <StatsCard
              key={day}
              label={`Day ${day}`}
              value={`${retention.overall[day]}%`}
            />
          ))}
        </div>
        <div className="overflow-x-auto rounded-sm border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface/80 text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Роль</th>
                {RETENTION_DAYS.map((day) => (
                  <th key={day} className="px-3 py-2 font-medium">
                    D{day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roleKeys.map((role) => (
                <tr key={role} className="border-t border-border">
                  <td className="px-3 py-2">{GROWTH_ROLE_LABELS[role]}</td>
                  {RETENTION_DAYS.map((day) => (
                    <td key={day} className="px-3 py-2 text-muted">
                      {retention.byRole[role][day]}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Ценность действий
        </h2>
        <p className="text-sm text-muted">
          Какие цепочки чаще встречаются у вернувшихся (lift vs one-time). Только
          аналитика.
        </p>
        {valuableActions.length === 0 ? (
          <Card variant="surface" className="p-4 text-sm text-muted">
            Недостаточно analytics_events для корреляции.
          </Card>
        ) : (
          <div className="grid gap-3">
            {valuableActions.map((action) => (
              <Card key={action.id} variant="surface" className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-foreground">{action.label}</h3>
                  <Badge variant={action.liftPct > 0 ? "accent" : "soft"}>
                    lift {action.liftPct}%
                  </Badge>
                </div>
                <p className="text-sm text-muted">{action.note}</p>
                <p className="text-xs text-muted">
                  Returning {action.returningCoveragePct}% · One-time{" "}
                  {action.oneTimeCoveragePct}%
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          GrowthEcosystemMetrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            label="Новые связи"
            value={String(ecosystem.newConnections)}
          />
          <StatsCard
            label="Активные взаимодействия"
            value={String(ecosystem.activeInteractions)}
          />
          <StatsCard
            label="Заявки"
            value={String(ecosystem.applications)}
          />
          <StatsCard label="Интересы" value={String(ecosystem.interests)} />
          <StatsCard label="Сделки" value={String(ecosystem.deals)} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">RoleGrowthReport</h2>
        <RoleGrowthReportCard report={roleGrowth} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          UserValueFeedbackReport
        </h2>
        <UserValueFeedbackReportCard report={feedbackValue} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">RetentionReport</h2>
        <RetentionReportCard report={retentionReport} />
      </section>

      <Card variant="surface" className="space-y-2 p-5">
        <h2 className="font-display text-xl text-foreground">
          Критерии масштабирования
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {scaleCriteria.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
