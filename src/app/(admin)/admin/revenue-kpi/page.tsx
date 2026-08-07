import { StatsCard } from "@/components/analytics/stats-card";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  REVENUE_PERIODS,
  isRevenuePeriod,
  revenuePeriodLabels,
  type RevenuePeriod,
} from "@/config/revenue";
import { getRevenueKpiDashboard } from "@/lib/revenue/dashboard";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Revenue KPI — Админ" };

export const dynamic = "force-dynamic";

function formatMoney(n: number) {
  return `${new Intl.NumberFormat("ru-RU").format(n)} ₽`;
}

type Props = { searchParams?: { period?: string } };

export default async function AdminRevenueKpiPage({ searchParams }: Props) {
  const period: RevenuePeriod = isRevenuePeriod(searchParams?.period ?? "")
    ? (searchParams!.period as RevenuePeriod)
    : "30d";
  const data = await getRevenueKpiDashboard(period);

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Revenue KPI"
        title="Контрольные показатели выручки ЦКР"
        description="Pipeline · Revenue · Efficiency. Без бухгалтерии — фиксация первых источников дохода."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        {REVENUE_PERIODS.map((p) => (
          <Link
            key={p}
            href={`/admin/revenue-kpi?period=${p}`}
            className={
              p === period
                ? "rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent"
                : "text-accent hover:underline"
            }
          >
            {revenuePeriodLabels[p]}
          </Link>
        ))}
        <Link href="/admin/revenue" className="text-accent hover:underline">
          Revenue Dashboard
        </Link>
      </div>

      <Card variant="surface" className="p-5 text-sm text-muted">
        Период: {revenuePeriodLabels[data.period]}. Оплаченные суммы только при
        явном revenue_status=paid / активных подписках. Фиктивная выручка не
        создаётся.
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Pipeline</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Коммерческие лиды"
            value={data.pipeline.commercialLeads}
          />
          <StatsCard label="Предложения" value={data.pipeline.proposals} />
          <StatsCard
            label="Договорённости"
            value={data.pipeline.agreements}
          />
          <StatsCard
            label="Оплаченные сделки"
            value={data.pipeline.paidDeals}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Revenue</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Services revenue"
            value={formatMoney(data.revenue.services)}
          />
          <StatsCard
            label="Commission revenue"
            value={formatMoney(data.revenue.commission)}
          />
          <StatsCard
            label="Subscription revenue"
            value={formatMoney(data.revenue.subscription)}
          />
          <StatsCard
            label="Total revenue"
            value={formatMoney(data.revenue.total)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Efficiency</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            label="Conversion lead → paid"
            value={`${data.efficiency.conversionLeadToPaidPct}%`}
          />
          <StatsCard
            label="Avg revenue per paid case"
            value={formatMoney(data.efficiency.averageRevenuePerPaidCase)}
          />
          <StatsCard
            label="Time to first revenue"
            value={
              data.efficiency.timeToFirstRevenueDays == null
                ? "—"
                : `${data.efficiency.timeToFirstRevenueDays} дн.`
            }
            hint="При отсутствии оплат — пусто"
          />
        </div>
      </section>
    </div>
  );
}
