import { AnalyticsChart } from "../../../../components/analytics/analytics-chart";
import { MetricCard } from "../../../../components/analytics/metric-card";
import { StatsCard } from "@/components/analytics/stats-card";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  ANALYTICS_PERIODS,
  analyticsEventLabels,
  analyticsPeriodLabels,
  type AnalyticsEventType,
  type AnalyticsPeriod,
} from "@/config/analytics";
import { getPlatformAnalytics } from "@/lib/analytics/queries";
import { getLiaMarketSnapshot } from "@/lib/analytics/lia-context";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Админ — Аналитика" };

export const dynamic = "force-dynamic";

type AdminAnalyticsPageProps = {
  searchParams?: { period?: string };
};

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(value)} ₽`;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: AdminAnalyticsPageProps) {
  const period = ANALYTICS_PERIODS.includes(
    searchParams?.period as AnalyticsPeriod,
  )
    ? (searchParams?.period as AnalyticsPeriod)
    : "30d";

  const [analytics, market] = await Promise.all([
    getPlatformAnalytics(period),
    getLiaMarketSnapshot(),
  ]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow="Аналитика ЦКР"
          title="Показатели платформы"
          description="Данные для управления и решений. Пользователи видят только аналитику своих проектов."
        />
        <div className="flex flex-wrap gap-2">
          {ANALYTICS_PERIODS.map((item) => (
            <Link
              key={item}
              href={`/admin/analytics?period=${item}`}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-sm transition-colors",
                period === item
                  ? "border-accent/50 bg-accent-muted text-accent"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              {analyticsPeriodLabels[item]}
            </Link>
          ))}
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Пользователи</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard label="Всего" value={analytics.users.total} href="/admin/users" />
          <StatsCard
            label="Новые за период"
            value={analytics.users.newInPeriod}
            hint={analyticsPeriodLabels[period]}
          />
          <StatsCard
            label="Активные"
            value={analytics.users.activeInPeriod}
            hint="С событиями аналитики за период"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Проекты</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatsCard
            label="Всего"
            value={analytics.projects.total}
            href="/admin/projects"
          />
          <StatsCard
            label="Опубликованные"
            value={analytics.projects.published}
          />
        </div>
        <Card variant="surface" className="p-5">
          <AnalyticsChart
            title="По категориям"
            items={analytics.projects.byCategory.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
          />
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Инвестиции</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatsCard
            label="Количество"
            value={analytics.investments.count}
            href="/admin/investments"
            hint="Опубликованные предложения"
          />
          <StatsCard
            label="Общий объём"
            value={formatMoney(analytics.investments.totalVolume)}
            hint="Среднее по диапазону amount_min…max"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Сделки</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <MetricCard label="Активные" value={analytics.deals.active} />
          <MetricCard label="Завершённые" value={analytics.deals.completed} />
          <MetricCard
            label="Сумма завершённых"
            value={formatMoney(analytics.deals.amountSum)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Эксперты</h2>
        <StatsCard
          label="Опубликовано"
          value={analytics.experts.count}
          href="/admin/experts"
        />
        <Card variant="surface" className="p-5">
          <AnalyticsChart
            title="По специализациям"
            items={analytics.experts.byCategory.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
          />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card variant="surface" className="p-5">
          <AnalyticsChart
            title={`События за ${analyticsPeriodLabels[period]}`}
            items={analytics.eventsByType.map((item) => ({
              label:
                analyticsEventLabels[item.key as AnalyticsEventType] ??
                item.label,
              value: item.value,
            }))}
          />
        </Card>
        <Card variant="surface" className="space-y-4 p-5">
          <h3 className="font-display text-lg text-foreground">
            Снимок для Лии
          </h3>
          <p className="text-sm text-muted">
            Подготовленные факты рынка без автоматических выводов.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label="Проекты (опубл.)"
              value={market.projectsPublished}
            />
            <MetricCard
              label="Заявки (спрос)"
              value={market.demand.applicationsTotal}
            />
            <MetricCard
              label="Возможности"
              value={market.supply.opportunitiesPublished}
            />
            <MetricCard
              label="Инвест. предложения"
              value={market.supply.investmentsPublished}
            />
          </div>
        </Card>
      </section>
    </div>
  );
}
