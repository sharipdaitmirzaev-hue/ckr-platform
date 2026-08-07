import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublicLaunchKpiDashboard } from "@/lib/launch/public-launch";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Public Launch KPI — Админ" };

export const dynamic = "force-dynamic";

function gateTone(mode: string) {
  if (mode === "active" || mode === "ready") return "success" as const;
  if (mode === "improve_product" || mode === "no_decision") {
    return "danger" as const;
  }
  return "warning" as const;
}

export default async function AdminPublicLaunchKpiPage() {
  const data = await getPublicLaunchKpiDashboard();
  const { gate, wave, kpi, metrics, plan90 } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Public Launch KPI"
        title="Контрольные показатели публичного запуска"
        description="Product · Ecosystem · Business KPI поверх существующих сущностей. Без новых модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/public-launch"
          className="text-accent hover:underline"
        >
          Public Launch
        </Link>
        <Link
          href="/admin/public-launch-decision"
          className="text-accent hover:underline"
        >
          Decision Gate
        </Link>
        <Link
          href="/admin/open-beta-growth"
          className="text-accent hover:underline"
        >
          Retention
        </Link>
        <Link
          href="/lia?scenario=public_launch"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: публичный запуск
        </Link>
      </div>

      <Card variant="surface" className="space-y-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={gate.mode} tone={gateTone(gate.mode)} />
          {wave ? <Badge variant="soft">{wave.name}</Badge> : null}
          {plan90.dayOfLaunch ? (
            <Badge variant="accent">День {plan90.dayOfLaunch}</Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted">{gate.message}</p>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Product KPI</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpi.product.map((item) => (
            <StatsCard
              key={item.label}
              label={item.label}
              value={item.value}
              hint={item.hint}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Ecosystem KPI</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpi.ecosystem.map((item) => (
            <StatsCard
              key={item.label}
              label={item.label}
              value={item.value}
              hint={item.hint}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Business KPI</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpi.business.map((item) => (
            <StatsCard
              key={item.label}
              label={item.label}
              value={item.value}
              hint={item.hint}
            />
          ))}
        </div>
      </section>

      <Card variant="surface" className="space-y-2 p-5">
        <h2 className="font-display text-xl text-foreground">Сводка</h2>
        <p className="text-sm text-muted">
          D7 {metrics.retentionD7}% · D30 {metrics.retentionD30}% · Лия{" "}
          {metrics.liaPct}% · Critical {metrics.openCritical} · Feedback
          public_launch {metrics.feedbackPublicLaunch}.
        </p>
      </Card>
    </div>
  );
}
