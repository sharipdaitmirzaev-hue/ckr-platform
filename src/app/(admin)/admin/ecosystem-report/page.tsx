import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  launchGoalStatusLabels,
  type LaunchGoalStatus,
} from "@/config/launch-goals";
import {
  launchWaveStatusLabels,
  launchWaveTypeLabels,
  type LaunchWaveStatus,
  type LaunchWaveType,
} from "@/config/launch-waves";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getEcosystemDashboard } from "@/lib/launch/ecosystem";
import { syncLaunchGoalsForWave } from "@/lib/launch/goals";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ecosystem Report — Админ" };

export const dynamic = "force-dynamic";

export default async function AdminEcosystemReportPage() {
  const current = await getCurrentUser();
  let data = await getEcosystemDashboard();
  if (data.wave) {
    await syncLaunchGoalsForWave(data.wave, current?.user.id ?? null);
    data = await getEcosystemDashboard();
  }
  const { metrics, report } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Wave 2 — Ecosystem Beta"
        title="Экосистемная аналитика"
        description="Связи и сетевой эффект ЦКР: предприниматели, эксперты, инвесторы, организации. Без новых бизнес-модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/launch" className="text-accent hover:underline">
          Launch
        </Link>
        <Link
          href="/admin/launch-decision"
          className="text-accent hover:underline"
        >
          Decision Gate
        </Link>
        <Link
          href="/lia?scenario=ecosystem"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: как развивается экосистема?
        </Link>
        <span className="text-muted">docs/ecosystem-beta.md</span>
      </div>

      {/* Волна */}
      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">Волна</h2>
          {data.wave ? (
            <>
              <Badge variant="accent">
                {
                  launchWaveTypeLabels[
                    data.wave.wave_type as LaunchWaveType
                  ]
                }
              </Badge>
              <Badge variant="soft">
                {
                  launchWaveStatusLabels[
                    data.wave.status as LaunchWaveStatus
                  ]
                }
              </Badge>
            </>
          ) : (
            <Badge variant="default">примените миграцию 46</Badge>
          )}
        </div>
        <p className="font-medium text-foreground">
          {data.wave?.name ?? "Wave 2 — Ecosystem Beta"}
        </p>
        <p className="text-sm text-muted">
          {data.wave?.description ||
            "Проверка взаимодействия участников экосистемы ЦКР."}
        </p>
      </Card>

      {/* Связи */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Связи</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {data.connections.map((c) => (
            <Card key={c.key} variant="surface" className="space-y-2 p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {c.label}
              </p>
              <p className="font-display text-3xl text-foreground">{c.count}</p>
              <p className="text-xs text-muted">{c.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Метрики */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Метрики</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Связи (сумма сигналов)"
            value={metrics.connectionsTotal}
          />
          <StatsCard label="Заявки" value={metrics.applications} />
          <StatsCard
            label="Совпадения (accepted)"
            value={metrics.acceptedApplications}
          />
          <StatsCard label="Сделки" value={metrics.deals} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Предприниматели" value={metrics.entrepreneurs} />
          <StatsCard label="Эксперты" value={metrics.experts} />
          <StatsCard label="Инвесторы" value={metrics.investors} />
          <StatsCard label="Организации" value={metrics.organizations} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Проекты" value={metrics.projects} />
          <StatsCard label="Интересы" value={metrics.interests} />
          <StatsCard
            label="Экспертные заявки"
            value={metrics.expertApplications}
          />
          <StatsCard
            label="Партнёрства"
            value={metrics.partnerships}
          />
        </div>
      </section>

      {/* Роли */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Участники Wave 2
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {(
            Object.keys(data.rolePlaybooks) as Array<
              keyof typeof data.rolePlaybooks
            >
          ).map((key) => {
            const book = data.rolePlaybooks[key];
            return (
              <Card key={key} variant="surface" className="space-y-2 p-5">
                <p className="font-medium text-foreground">{book.label}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
                  {book.goals.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Сценарии */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Ключевые сценарии
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {(
            Object.keys(data.scenarios) as Array<keyof typeof data.scenarios>
          ).map((key) => {
            const scenario = data.scenarios[key];
            return (
              <Card key={key} variant="surface" className="space-y-3 p-5">
                <p className="font-medium text-foreground">{scenario.label}</p>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
                  {scenario.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Цели */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Launch Goals Wave 2
        </h2>
        {data.goals.length === 0 ? (
          <p className="text-sm text-muted">
            Целей нет — примените миграцию ecosystem_beta_wave2.
          </p>
        ) : (
          <ul className="space-y-3">
            {data.goals.map((goal) => (
              <li
                key={goal.id}
                className="rounded-sm border border-border px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{goal.title}</p>
                    <p className="text-xs text-muted">
                      План {goal.target_value} · факт {goal.current_value} ·{" "}
                      {goal.metricLabel}
                    </p>
                  </div>
                  <Badge variant="soft">
                    {
                      launchGoalStatusLabels[
                        goal.status as LaunchGoalStatus
                      ]
                    }
                  </Badge>
                </div>
                <div className="mt-3">
                  <ProgressBar value={goal.progress} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* EcosystemReport */}
      <Card variant="surface" className="space-y-4 p-5">
        <h2 className="font-display text-xl text-foreground">
          EcosystemReport
        </h2>
        <p className="text-sm text-muted">{report.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Active users
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.active_users.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Connections
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.connections.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Project / expert / investment
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {[
                ...report.project_activity,
                ...report.expert_activity,
                ...report.investment_activity,
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
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
        </div>
      </Card>

      {/* ТИНДА */}
      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            ТИНДА — production case
          </h2>
          <StatusBadge label="отдельный кейс" tone="accent" />
        </div>
        <p className="text-sm text-foreground">
          {data.tinda.organization} · {data.tinda.projectTitle}
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            Потребность в экспертах:{" "}
            {data.tinda.needsExperts ? "да" : "закрывается"}
          </li>
          <li>
            Потребность в партнёрах:{" "}
            {data.tinda.needsPartners ? "да" : "закрывается"}
          </li>
          <li>
            Ресурсы через ЦКР:{" "}
            {data.tinda.canFindResources ? "доступны" : "каталог пуст"}
          </li>
        </ul>
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
          {data.tinda.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
