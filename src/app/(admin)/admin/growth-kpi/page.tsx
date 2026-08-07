import { StatsCard } from "@/components/analytics/stats-card";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getGrowthKpiDashboard } from "@/lib/growth/dashboard";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Growth KPI — Админ" };

export const dynamic = "force-dynamic";

export default async function AdminGrowthKpiPage() {
  const data = await getGrowthKpiDashboard();
  const { kpi, users, channels, partnerTracking } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Growth KPI"
        title="Контрольные показатели роста ЦКР"
        description="User · Marketplace · Ecosystem · Partnership. Качество роста после Public Launch."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/growth" className="text-accent hover:underline">
          Growth Dashboard
        </Link>
        <Link
          href="/admin/public-launch-kpi"
          className="text-accent hover:underline"
        >
          Public Launch KPI
        </Link>
        <Link
          href="/lia?scenario=growth"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: как растёт ЦКР?
        </Link>
      </div>

      <Card variant="surface" className="space-y-2 p-5 text-sm text-muted">
        <p>
          Регистрации {users.registrations} · активные {users.activeUsers} ·
          конверсия {users.conversionPct}% · D7 {users.retentionD7}% · D30{" "}
          {users.retentionD30}%.
        </p>
        <p>
          Каналы: source→reg {channels.conversionOverall.sourceToReg}% ·
          партнёры {partnerTracking.partners} · привлечённые{" "}
          {partnerTracking.referredUsers}.
        </p>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">User KPI</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpi.user.map((item) => (
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
        <h2 className="font-display text-xl text-foreground">Marketplace KPI</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpi.marketplace.map((item) => (
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
        <h2 className="font-display text-xl text-foreground">Partnership KPI</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpi.partnership.map((item) => (
            <StatsCard
              key={item.label}
              label={item.label}
              value={item.value}
              hint={item.hint}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
