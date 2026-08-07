import { StatsCard } from "@/components/analytics/stats-card";
import { RevenueOpportunityReportCard } from "@/components/lia/revenue-opportunity-report";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  REVENUE_PERIODS,
  isRevenuePeriod,
  revenuePeriodLabels,
  type RevenuePeriod,
} from "@/config/revenue";
import { UpdateDealRevenueStatusForm } from "@/features/revenue/components/update-deal-revenue-status";
import { getRevenueDashboard } from "@/lib/revenue/dashboard";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Revenue — Админ" };

export const dynamic = "force-dynamic";

function formatMoney(n: number) {
  return `${new Intl.NumberFormat("ru-RU").format(n)} ₽`;
}

type Props = { searchParams?: { period?: string } };

export default async function AdminRevenuePage({ searchParams }: Props) {
  const period: RevenuePeriod = isRevenuePeriod(searchParams?.period ?? "")
    ? (searchParams!.period as RevenuePeriod)
    : "30d";
  const data = await getRevenueDashboard(period);
  const {
    overview,
    sources,
    pipeline,
    deals,
    starterServices,
    partnerMetrics,
    report,
  } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="First Deals & Revenue"
        title="Коммерческие результаты ЦКР"
        description="Потенциал, договорённости и оплата на базе deals / services / subscriptions. Без фиктивной выручки и без реальных платежей на этом этапе."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        {REVENUE_PERIODS.map((p) => (
          <Link
            key={p}
            href={`/admin/revenue?period=${p}`}
            className={
              p === period
                ? "rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent"
                : "text-accent hover:underline"
            }
          >
            {revenuePeriodLabels[p]}
          </Link>
        ))}
        <Link href="/admin/revenue-kpi" className="text-accent hover:underline">
          Revenue KPI
        </Link>
        <Link
          href="/lia?scenario=revenue_opportunity"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: на чём заработать?
        </Link>
        <span className="text-muted">docs/first-deals-and-revenue.md</span>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Общая коммерческая картина
        </h2>
        <p className="text-sm text-muted">Период: {data.periodLabel}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            label="Потенциальная выручка"
            value={formatMoney(overview.potential)}
          />
          <StatsCard
            label="Подтверждённая выручка"
            value={formatMoney(overview.confirmed)}
          />
          <StatsCard
            label="Оплаченная выручка"
            value={formatMoney(overview.paid)}
          />
          <StatsCard
            label="Комиссии"
            value={formatMoney(overview.commissions)}
          />
          <StatsCard
            label="Услуги ЦКР (потенциал)"
            value={formatMoney(overview.services)}
          />
          <StatsCard
            label="Активные коммерческие сделки"
            value={overview.activeCommercialDeals}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">RevenueSources</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Источник</th>
                <th className="py-2 pr-3 font-medium">Потенциал</th>
                <th className="py-2 pr-3 font-medium">Подтверждено</th>
                <th className="py-2 pr-3 font-medium">Оплачено</th>
                <th className="py-2 font-medium">Записей</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.source} className="border-b border-border/60">
                  <td className="py-2.5 pr-3 font-medium">{s.label}</td>
                  <td className="py-2.5 pr-3">{formatMoney(s.potential)}</td>
                  <td className="py-2.5 pr-3">{formatMoney(s.confirmed)}</td>
                  <td className="py-2.5 pr-3">{formatMoney(s.paid)}</td>
                  <td className="py-2.5">{s.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">RevenuePipeline</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {pipeline.stages.map((stage) => (
            <Card key={stage.id} variant="surface" className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {stage.label}
              </p>
              <p className="font-display text-2xl text-foreground">
                {stage.count}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Услуги ЦКР (стартовый набор)
        </h2>
        <p className="text-sm text-muted">
          Цены не фиксируем без решения администратора. Поддержаны фиксированная
          цена и цена по запросу.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {starterServices.map((s) => (
            <Card key={s.id} variant="surface" className="space-y-2 p-4">
              <Badge variant="soft">{s.category}</Badge>
              <p className="font-medium text-sm">{s.title}</p>
              <p className="text-sm text-muted">{s.priceLabel}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Сделки · коммерческий статус
        </h2>
        <div className="space-y-2">
          {deals.length === 0 ? (
            <p className="text-sm text-muted">
              Сделок за период нет. Комиссия и revenue_status задаются вручную.
            </p>
          ) : (
            deals.map((deal) => (
              <Card
                key={deal.id}
                variant="surface"
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="space-y-1 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="accent">{deal.dealType}</Badge>
                    <Badge variant="soft">{deal.revenueStatusLabel}</Badge>
                  </div>
                  <p>
                    Сумма:{" "}
                    {deal.amount != null
                      ? formatMoney(deal.amount)
                      : "не указана"}
                    {deal.commissionAmount != null
                      ? ` · комиссия ${deal.commissionType ?? ""} ${deal.commissionAmount}`
                      : " · комиссия не задана"}
                  </p>
                  <Link
                    href={`/dashboard/projects/${deal.projectId}/workspace`}
                    className="text-accent hover:underline"
                  >
                    Workspace проекта
                  </Link>
                </div>
                <UpdateDealRevenueStatusForm
                  dealId={deal.id}
                  projectId={deal.projectId}
                  status={deal.revenueStatus}
                />
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          PartnerRevenueMetrics
        </h2>
        <p className="text-sm text-muted">
          Только аналитика. Автовыплаты партнёрам не реализуются.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Партнёр</th>
                <th className="py-2 pr-3 font-medium">Проекты</th>
                <th className="py-2 pr-3 font-medium">Сделки</th>
                <th className="py-2 font-medium">Выручка ЦКР</th>
              </tr>
            </thead>
            <tbody>
              {partnerMetrics.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-muted">
                    Нет партнёрской атрибуции за период
                  </td>
                </tr>
              ) : (
                partnerMetrics.map((p) => (
                  <tr
                    key={p.organizationId}
                    className="border-b border-border/60"
                  >
                    <td className="py-2.5 pr-3 font-medium">{p.partnerName}</td>
                    <td className="py-2.5 pr-3">{p.projects}</td>
                    <td className="py-2.5 pr-3">{p.deals}</td>
                    <td className="py-2.5">{formatMoney(p.ckrRevenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          RevenueOpportunityReport
        </h2>
        <RevenueOpportunityReportCard report={report} />
      </section>
    </div>
  );
}
