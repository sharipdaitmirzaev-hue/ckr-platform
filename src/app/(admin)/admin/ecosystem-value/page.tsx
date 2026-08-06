import { StatusBadge } from "@/components/admin/status-badge";
import { ConnectionTable } from "@/components/ecosystem/connection-table";
import { EcosystemValueCard } from "@/components/ecosystem/ecosystem-value-card";
import { MatchingChart } from "@/components/ecosystem/matching-chart";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  launchWaveStatusLabels,
  launchWaveTypeLabels,
  type LaunchWaveStatus,
  type LaunchWaveType,
} from "@/config/launch-waves";
import { matchQualityTierLabels } from "@/config/ecosystem-value";
import { getEcosystemValueDashboard } from "@/lib/launch/ecosystem-value";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ecosystem Value — Админ" };

export const dynamic = "force-dynamic";

export default async function AdminEcosystemValuePage() {
  const data = await getEcosystemValueDashboard();
  const { overview, matching, quality, results, report } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Matching Analysis"
        title="Ценность экосистемы"
        description="Анализ связей и качества совпадений ЦКР. Только аналитика — без автоматических решений и новых каталогов."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/ecosystem-report"
          className="text-accent hover:underline"
        >
          Ecosystem Report
        </Link>
        <Link
          href="/admin/launch-decision"
          className="text-accent hover:underline"
        >
          Decision Gate
        </Link>
        <Link href="/admin/launch" className="text-accent hover:underline">
          Launch / Wave 2
        </Link>
        <Link
          href="/lia?scenario=ecosystem_value"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: какая польза от экосистемы?
        </Link>
        <span className="text-muted">docs/ecosystem-value.md</span>
      </div>

      {/* Цепочка Wave 2 */}
      <Card variant="surface" className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Связь с Wave 2
        </p>
        <ol className="flex flex-wrap items-center gap-2 text-sm text-foreground">
          <li>
            <Badge variant="soft">Wave 2</Badge>
          </li>
          <li className="text-muted">↓</li>
          <li>
            <Link
              href="/admin/ecosystem-report"
              className="text-accent hover:underline"
            >
              Ecosystem Report
            </Link>
          </li>
          <li className="text-muted">↓</li>
          <li>
            <Badge variant="accent">Matching Analysis</Badge>
          </li>
          <li className="text-muted">↓</li>
          <li>
            <Link
              href="/admin/launch-decision"
              className="text-accent hover:underline"
            >
              Decision Gate
            </Link>
          </li>
        </ol>
        {data.wave ? (
          <p className="text-xs text-muted">
            {data.wave.name} ·{" "}
            {launchWaveTypeLabels[data.wave.wave_type as LaunchWaveType]} ·{" "}
            {launchWaveStatusLabels[data.wave.status as LaunchWaveStatus]}
          </p>
        ) : null}
      </Card>

      {/* Общие показатели */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Общие показатели
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <EcosystemValueCard
            label="Активные пользователи"
            value={overview.active_users}
          />
          <EcosystemValueCard label="Проекты" value={overview.projects} />
          <EcosystemValueCard label="Эксперты" value={overview.experts} />
          <EcosystemValueCard label="Инвесторы" value={overview.investors} />
          <EcosystemValueCard
            label="Организации"
            value={overview.organizations}
          />
        </div>
      </section>

      {/* Связи */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Связи</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <EcosystemValueCard
            label="Созданные"
            value={matching.totals.created}
          />
          <EcosystemValueCard
            label="Активные"
            value={matching.totals.active}
          />
          <EcosystemValueCard
            label="Завершённые"
            value={matching.totals.completed}
          />
          <EcosystemValueCard
            label="Принятые заявки"
            value={matching.totals.accepted}
            hint={`отправлено ${matching.totals.applications_sent}`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {matching.by_type.map((row) => (
            <Card key={row.type} variant="surface" className="space-y-3 p-5">
              <p className="font-medium text-foreground">{row.label}</p>
              <ul className="grid grid-cols-2 gap-2 text-sm text-foreground sm:grid-cols-3">
                <li>создано: {row.created}</li>
                <li>заявки: {row.applications_sent}</li>
                <li>принято: {row.accepted}</li>
                <li>активных: {row.active}</li>
                <li>завершено: {row.completed}</li>
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Match quality */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Качество совпадений
        </h2>
        <MatchingChart quality={quality} />
        <div className="grid gap-4 lg:grid-cols-3">
          {(
            Object.keys(quality.tiers) as Array<keyof typeof quality.tiers>
          ).map((tier) => (
            <Card key={tier} variant="surface" className="space-y-2 p-5">
              <StatusBadge
                label={matchQualityTierLabels[tier]}
                tone={
                  tier === "successful"
                    ? "success"
                    : tier === "strong"
                      ? "accent"
                      : "warning"
                }
              />
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {quality.tiers[tier].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Результаты */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Результаты</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <EcosystemValueCard label="Заявки" value={results.applications} />
          <EcosystemValueCard label="Сделки" value={results.deals} />
          <EcosystemValueCard
            label="Партнёрства"
            value={results.partnerships}
          />
        </div>
      </section>

      <ConnectionTable rows={data.connections} />

      {/* EcosystemValueReport */}
      <Card variant="surface" className="space-y-4 p-5">
        <h2 className="font-display text-xl text-foreground">
          EcosystemValueReport
        </h2>
        <p className="text-sm text-muted">{report.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Strong connections
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.strong_connections.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Weak connections
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.weak_connections.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Successful matches
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.successful_matches.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Blocked matches
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.blocked_matches.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Recommendations
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {report.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
