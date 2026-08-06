import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  OPEN_BETA_DECISIONS,
  openBetaDecisionLabels,
  readinessStatusLabels,
  type OpenBetaDecision,
  type ReadinessStatus,
} from "@/config/open-beta-readiness";
import { getOpenBetaReadinessDashboard } from "@/lib/launch/open-beta-readiness";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Open Beta Readiness — Админ" };

export const dynamic = "force-dynamic";

function statusTone(status: ReadinessStatus) {
  if (status === "ready") return "success" as const;
  if (status === "blocked") return "danger" as const;
  return "warning" as const;
}

function decisionTone(decision: OpenBetaDecision) {
  if (decision === "open_beta") return "success" as const;
  if (decision === "needs_improvement") return "danger" as const;
  return "accent" as const;
}

export default async function AdminOpenBetaReviewPage() {
  const data = await getOpenBetaReadinessDashboard();
  const { product, users, ecosystem, technical, business, decision, report } =
    data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Open Beta Readiness"
        title="Готовность к открытому запуску"
        description="Проверка продукта, UX, стабильности и экосистемы после Beta Expansion. Без новых крупных бизнес-модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/beta-expansion"
          className="text-accent hover:underline"
        >
          Beta Expansion
        </Link>
        <Link
          href="/admin/product-sprint"
          className="text-accent hover:underline"
        >
          Product Fix Sprint
        </Link>
        <Link href="/admin/improvements" className="text-accent hover:underline">
          Улучшения
        </Link>
        <Link
          href="/lia?scenario=open_beta_readiness"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: готов ли ЦКР к открытому запуску?
        </Link>
        <span className="text-muted">docs/open-beta-readiness.md</span>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Product Readiness
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {product.map((item) => (
            <Card key={item.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{item.label}</p>
                <StatusBadge
                  label={readinessStatusLabels[item.status]}
                  tone={statusTone(item.status)}
                />
              </div>
              <p className="text-sm text-muted">{item.detail}</p>
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-sm text-accent hover:underline"
                >
                  Открыть →
                </Link>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">User Readiness</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {users.map((role) => (
            <Card key={role.key} variant="surface" className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg text-foreground">
                  {role.label}
                </h3>
                <StatusBadge
                  label={readinessStatusLabels[role.status]}
                  tone={statusTone(role.status)}
                />
              </div>
              <p className="text-sm text-muted">{role.signal}</p>
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
          Ecosystem Readiness
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Проекты" value={ecosystem.projects} />
          <StatsCard label="Эксперты" value={ecosystem.experts} />
          <StatsCard label="Инвесторы" value={ecosystem.investors} />
          <StatsCard label="Организации" value={ecosystem.organizations} />
          <StatsCard label="Связи" value={ecosystem.connections} />
          <StatsCard label="Заявки" value={ecosystem.applications} />
          <StatsCard label="Сделки" value={ecosystem.deals} />
          <StatsCard
            label="Активация (Beta Expansion)"
            value={`${data.betaExpansion.registrationPct}%`}
            hint={`профиль ${data.betaExpansion.profilePct}% · Лия ${data.betaExpansion.liaPct}%`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          TechnicalChecklist
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {technical.map((item) => (
            <Card key={item.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{item.label}</p>
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
        <h2 className="font-display text-xl text-foreground">
          BusinessReadiness
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {business.map((item) => (
            <Card key={item.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{item.label}</p>
                <StatusBadge
                  label={readinessStatusLabels[item.status]}
                  tone={statusTone(item.status)}
                />
              </div>
              <p className="text-sm text-muted">{item.detail}</p>
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-sm text-accent hover:underline"
                >
                  Открыть →
                </Link>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          OpenBetaDecision
        </h2>
        <Card variant="surface" className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={decision.label}
              tone={decisionTone(decision.decision)}
            />
            <Badge variant="soft">готовность {decision.readiness}%</Badge>
            <Badge variant="soft">
              Critical {data.issues.openCritical} · High {data.issues.openHigh}
            </Badge>
          </div>
          <ProgressBar value={decision.readiness} />
          <p className="text-sm text-muted">{decision.hint}</p>
          <div className="flex flex-wrap gap-2">
            {OPEN_BETA_DECISIONS.map((item) => (
              <Badge
                key={item}
                variant={item === decision.decision ? "accent" : "soft"}
              >
                {openBetaDecisionLabels[item]}
              </Badge>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Причины
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                {decision.reasons.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
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
                Следующие шаги
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                {decision.nextSteps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </section>

      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            OpenBetaReadinessReport
          </h2>
          <Badge variant="soft">только анализ</Badge>
        </div>
        <p className="text-sm text-muted">{report.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Product", report.product_readiness],
              ["Users", report.user_readiness],
              ["Ecosystem", report.ecosystem_readiness],
              ["Risks", report.risks],
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
