import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { PublicLaunchDecisionReportCard } from "@/components/lia/public-launch-decision-report";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  readinessStatusLabels,
  type ReadinessStatus,
} from "@/config/open-beta-readiness";
import {
  launchRiskCategoryLabels,
  publicLaunchDecisionLabels,
  type PublicLaunchDecision,
} from "@/config/public-launch-decision";
import { PublicLaunchDecisionForm } from "@/features/launch/components/public-launch-decision-form";
import { getPublicLaunchDecisionDashboard } from "@/lib/launch/public-launch-decision";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Public Launch Decision — Админ",
};

export const dynamic = "force-dynamic";

function statusTone(status: ReadinessStatus) {
  if (status === "ready") return "success" as const;
  if (status === "blocked") return "danger" as const;
  return "warning" as const;
}

function decisionTone(decision: PublicLaunchDecision) {
  if (decision === "public_launch") return "success" as const;
  if (decision === "improve_product") return "danger" as const;
  return "warning" as const;
}

function impactTone(impact: string) {
  if (impact === "critical" || impact === "high") return "danger" as const;
  if (impact === "medium") return "warning" as const;
  return "neutral" as const;
}

export default async function AdminPublicLaunchDecisionPage() {
  const data = await getPublicLaunchDecisionDashboard();
  const {
    product,
    productStatus,
    users,
    ecosystem,
    business,
    riskReview,
    decision,
    latestDecision,
    report,
    criteria,
    waveId,
  } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Public Launch Decision Gate"
        title="Готовность к публичному запуску"
        description="На основе Open Beta: продукт, пользователи, экосистема, бизнес и риски. Управленческое решение о выходе из beta — без новых бизнес-модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/open-beta" className="text-accent hover:underline">
          Open Beta
        </Link>
        <Link
          href="/admin/open-beta-growth"
          className="text-accent hover:underline"
        >
          Open Beta Growth
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
          href="/lia?scenario=public_launch_decision"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: готов ли ЦКР к публичному запуску?
        </Link>
        <span className="text-muted">docs/public-launch-decision.md</span>
      </div>

      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            Рекомендация системы
          </h2>
          <StatusBadge
            label={publicLaunchDecisionLabels[decision.suggested]}
            tone={decisionTone(decision.suggested)}
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
      </Card>

      {latestDecision ? (
        <Card variant="surface" className="space-y-2 p-5">
          <h2 className="font-display text-xl text-foreground">
            Зафиксированное решение
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={publicLaunchDecisionLabels[latestDecision.decision]}
              tone={decisionTone(latestDecision.decision)}
            />
            <Badge variant="soft">
              {new Date(latestDecision.date).toLocaleString("ru-RU")}
            </Badge>
          </div>
          <p className="text-sm text-muted">
            Ответственный: {latestDecision.responsible}
          </p>
          <p className="text-sm text-foreground">{latestDecision.comment}</p>
        </Card>
      ) : null}

      <Card variant="surface" className="space-y-3 p-5">
        <h2 className="font-display text-xl text-foreground">
          Зафиксировать PublicLaunchDecision
        </h2>
        <p className="text-sm text-muted">
          Поля: решение · комментарий · ответственный (текущий staff) · дата
          (автоматически). Лия не принимает решение автоматически.
        </p>
        <PublicLaunchDecisionForm
          waveId={waveId}
          suggested={decision.suggested}
          latest={latestDecision?.decision ?? null}
        />
      </Card>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            Product Readiness
          </h2>
          <StatusBadge
            label={readinessStatusLabels[productStatus]}
            tone={statusTone(productStatus)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {product.map((item) => (
            <Card key={item.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-foreground">{item.label}</h3>
                <StatusBadge
                  label={readinessStatusLabels[item.status]}
                  tone={statusTone(item.status)}
                />
              </div>
              <p className="text-sm text-muted">{item.detail}</p>
              {item.href ? (
                <Link href={item.href} className="text-xs text-accent hover:underline">
                  Открыть
                </Link>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">User Readiness</h2>
          <StatusBadge
            label={readinessStatusLabels[users.aggregateStatus]}
            tone={statusTone(users.aggregateStatus)}
          />
        </div>
        <h3 className="text-sm font-medium text-muted">Рост</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Регистрации" value={users.growth.registrations} />
          <StatsCard label="Активные" value={users.growth.activeUsers} />
          <StatsCard
            label="D7 retention"
            value={`${users.growth.retentionD7}%`}
          />
          <StatsCard
            label="D30 retention"
            value={`${users.growth.retentionD30}%`}
          />
        </div>
        <h3 className="text-sm font-medium text-muted">Активация</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Первый проект"
            value={users.activation.firstProject}
          />
          <StatsCard
            label="Первое взаимодействие"
            value={users.activation.firstInteraction}
          />
          <StatsCard label="Лия (кол-во)" value={users.activation.liaUsed} />
          <StatsCard
            label="Лия %"
            value={`${users.activation.liaPct}%`}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["Предприниматели", users.roles.entrepreneurs],
              ["Эксперты", users.roles.experts],
              ["Инвесторы", users.roles.investors],
              ["Организации", users.roles.organizations],
            ] as const
          ).map(([title, items]) => (
            <Card key={title} variant="surface" className="space-y-2 p-4">
              <h3 className="font-medium text-foreground">{title}</h3>
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
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            Ecosystem Readiness
          </h2>
          <StatusBadge
            label={readinessStatusLabels[ecosystem.aggregateStatus]}
            tone={statusTone(ecosystem.aggregateStatus)}
          />
          <Badge variant="soft">
            {ecosystem.createsRealInteractions
              ? "реальные взаимодействия"
              : "мало взаимодействий"}
          </Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Проекты" value={ecosystem.projects} />
          <StatsCard label="Эксперты" value={ecosystem.experts} />
          <StatsCard label="Инвесторы" value={ecosystem.investors} />
          <StatsCard label="Организации" value={ecosystem.organizations} />
          <StatsCard label="Связи" value={ecosystem.connections} />
          <StatsCard label="Заявки" value={ecosystem.applications} />
          <StatsCard label="Интересы" value={ecosystem.interests} />
          <StatsCard label="Сделки" value={ecosystem.deals} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            BusinessLaunchReadiness
          </h2>
          <StatusBadge
            label={readinessStatusLabels[business.aggregateStatus]}
            tone={statusTone(business.aggregateStatus)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {business.checks.map((item) => (
            <Card key={item.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-foreground">{item.label}</h3>
                <StatusBadge
                  label={readinessStatusLabels[item.status]}
                  tone={statusTone(item.status)}
                />
              </div>
              <p className="text-sm text-muted">{item.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            LaunchRiskReview
          </h2>
          <StatusBadge
            label={readinessStatusLabels[riskReview.aggregateStatus]}
            tone={statusTone(riskReview.aggregateStatus)}
          />
        </div>
        <div className="grid gap-3">
          {riskReview.items.map((risk) => (
            <Card key={risk.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="soft">
                  {launchRiskCategoryLabels[risk.category]}
                </Badge>
                <StatusBadge
                  label={`влияние ${risk.impact}`}
                  tone={impactTone(risk.impact)}
                />
                <Badge variant="soft">вероятность {risk.probability}</Badge>
              </div>
              <p className="text-sm font-medium text-foreground">
                {risk.problem}
              </p>
              <p className="text-sm text-muted">План: {risk.actionPlan}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          PublicLaunchDecisionReport
        </h2>
        <PublicLaunchDecisionReportCard report={report} />
      </section>

      <Card variant="surface" className="space-y-2 p-5">
        <h2 className="font-display text-xl text-foreground">
          Критерии запуска
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {criteria.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
