import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { LiaProductionReportCard } from "@/components/lia/lia-production-report";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  productionLaunchDecisionLabels,
  type ChecklistItemStatus,
  type ProductionLaunchDecision,
  type ServiceHealthStatus,
} from "@/config/production-go-live";
import { ProductionLaunchDecisionForm } from "@/features/production/components/production-launch-decision-form";
import { getSystemHealthDashboard } from "@/lib/production/system-health";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "System Health — Админ",
};

export const dynamic = "force-dynamic";

function healthTone(status: ServiceHealthStatus) {
  if (status === "healthy") return "success" as const;
  if (status === "error") return "danger" as const;
  return "warning" as const;
}

function itemTone(status: ChecklistItemStatus | ServiceHealthStatus) {
  if (status === "pass" || status === "healthy") return "success" as const;
  if (status === "fail" || status === "error") return "danger" as const;
  return "warning" as const;
}

function decisionTone(decision: ProductionLaunchDecision) {
  if (decision === "go_live") return "success" as const;
  if (decision === "rollback") return "danger" as const;
  return "warning" as const;
}

export default async function AdminSystemHealthPage() {
  const data = await getSystemHealthDashboard();
  const {
    environment,
    services,
    servicesAggregate,
    deploymentChecklist,
    smokeTests,
    accessAudit,
    analytics,
    analyticsFlowing,
    recovery,
    liaReport,
    decision,
    latestDecision,
    criteria,
  } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Production Deployment & Go-Live"
        title="System Health"
        description="Инфраструктура, безопасность, smoke-сценарии, доступы и решение о переходе ЦКР в production. Без новых бизнес-модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/revenue" className="text-accent hover:underline">
          Revenue
        </Link>
        <Link
          href="/admin/public-launch-operations"
          className="text-accent hover:underline"
        >
          Launch Ops
        </Link>
        <Link href="/admin/analytics" className="text-accent hover:underline">
          Analytics
        </Link>
        <Link
          href="/lia?scenario=lia_production"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: production check
        </Link>
        <span className="text-muted">docs/go-live.md</span>
      </div>

      {/* Environment */}
      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">Environment</h2>
          <StatusBadge
            label={environment.productionStatus}
            tone={
              environment.isProductionReady
                ? "success"
                : environment.productionStatus === "production"
                  ? "warning"
                  : "neutral"
            }
          />
          <Badge variant="soft">{environment.version}</Badge>
          <Badge variant="soft">{environment.channel}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Production status
            </p>
            <p className="mt-1">{environment.productionStatus}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Version
            </p>
            <p className="mt-1">{environment.version}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Build status
            </p>
            <p className="mt-1">{environment.buildStatus}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Last deployment
            </p>
            <p className="mt-1">{environment.lastDeployment ?? "—"}</p>
          </div>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          {environment.signals.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="text-xs text-muted">
          SITE_URL: {environment.siteUrl ?? "—"} · demo=
          {String(environment.demoMode)} · NODE_ENV={environment.nodeEnv}
        </p>
      </Card>

      {/* Services */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">Services</h2>
          <StatusBadge
            label={servicesAggregate}
            tone={healthTone(servicesAggregate)}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Card key={svc.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{svc.label}</h3>
                <StatusBadge
                  label={svc.status}
                  tone={healthTone(svc.status)}
                />
              </div>
              <p className="text-sm text-muted">{svc.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Decision recommendation */}
      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            Рекомендация Go-Live
          </h2>
          <StatusBadge
            label={productionLaunchDecisionLabels[decision.suggested]}
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
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Критерии
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {criteria.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </Card>

      {latestDecision ? (
        <Card variant="surface" className="space-y-2 p-5">
          <h2 className="font-display text-xl text-foreground">
            Зафиксированное решение
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={productionLaunchDecisionLabels[latestDecision.decision]}
              tone={decisionTone(latestDecision.decision)}
            />
            <Badge variant="soft">
              {new Date(latestDecision.date).toLocaleString("ru-RU")}
            </Badge>
          </div>
          <p className="text-sm">
            Ответственный: {latestDecision.responsible || "—"}
          </p>
          <p className="text-sm text-muted">{latestDecision.comment}</p>
        </Card>
      ) : null}

      <Card variant="surface" className="p-5">
        <ProductionLaunchDecisionForm
          suggested={decision.suggested}
          latest={latestDecision?.decision ?? null}
        />
      </Card>

      {/* ProductionDeploymentChecklist */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          ProductionDeploymentChecklist
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {deploymentChecklist.map((section) => (
            <Card key={section.id} variant="surface" className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{section.label}</h3>
                <StatusBadge
                  label={section.aggregate}
                  tone={healthTone(section.aggregate)}
                />
              </div>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-sm border border-border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      <StatusBadge
                        label={item.status}
                        tone={itemTone(item.status)}
                      />
                    </div>
                    <p className="mt-1 text-muted">{item.detail}</p>
                    <p className="mt-0.5 text-xs text-muted">{item.note}</p>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="mt-1 inline-block text-xs text-accent hover:underline"
                      >
                        Открыть
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* ProductionSmokeTest */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          ProductionSmokeTest
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {smokeTests.map((flow) => (
            <Card key={flow.id} variant="surface" className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{flow.label}</h3>
                <StatusBadge
                  label={flow.aggregate}
                  tone={healthTone(flow.aggregate)}
                />
              </div>
              <ol className="space-y-2">
                {flow.steps.map((step, idx) => (
                  <li
                    key={step.id}
                    className="rounded-sm border border-border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-muted">{idx + 1}.</span>
                      <span className="font-medium">{step.label}</span>
                      <StatusBadge
                        label={step.status}
                        tone={itemTone(step.status)}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">{step.note}</p>
                    <Link
                      href={step.href}
                      className="mt-1 inline-block text-xs text-accent hover:underline"
                    >
                      {step.href}
                    </Link>
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </section>

      {/* AccessAudit */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">AccessAudit</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {accessAudit.map((item) => (
            <Card key={item.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{item.label}</h3>
                <StatusBadge
                  label={item.status}
                  tone={itemTone(item.status)}
                />
                <Badge variant="soft">
                  RLS {item.rlsOk ? "ok" : "check"}
                </Badge>
              </div>
              <p className="text-sm text-muted">{item.expectation}</p>
              <p className="text-xs text-muted">{item.note}</p>
              <ul className="list-disc pl-5 text-xs text-muted">
                {item.checks.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Analytics */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            Production Analytics
          </h2>
          <StatusBadge
            label={analyticsFlowing ? "flowing" : "sparse"}
            tone={analyticsFlowing ? "success" : "warning"}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {analytics.map((ev) => (
            <StatsCard
              key={ev.id}
              label={ev.label}
              value={ev.count}
              hint={ev.flowing ? "данные поступают" : "нет событий"}
            />
          ))}
        </div>
      </section>

      {/* RecoveryChecklist */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          RecoveryChecklist
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {recovery.map((item) => (
            <Card key={item.id} variant="surface" className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{item.label}</h3>
                <StatusBadge
                  label={item.status}
                  tone={itemTone(item.status)}
                />
              </div>
              <p className="text-sm text-muted">{item.detail}</p>
              <p className="text-xs text-muted">{item.note}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Lia report */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          LiaProductionReport
        </h2>
        <LiaProductionReportCard report={liaReport} />
      </section>
    </div>
  );
}
