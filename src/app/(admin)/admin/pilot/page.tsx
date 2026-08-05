import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  pilotIssueSeverityLabels,
  pilotMetricLabels,
  type PilotIssueSeverity,
} from "@/config/pilot";
import { CreatePilotIssueForm } from "@/features/pilot/components/create-pilot-issue-form";
import { PilotIssueStatusForm } from "@/features/pilot/components/pilot-issue-status-form";
import { getPilotDashboard } from "@/lib/pilot/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Closed Pilot — Админ" };

export const dynamic = "force-dynamic";

function severityTone(severity: PilotIssueSeverity) {
  if (severity === "critical") return "danger" as const;
  if (severity === "high") return "warning" as const;
  if (severity === "medium") return "accent" as const;
  return "neutral" as const;
}

export default async function AdminPilotPage() {
  const data = await getPilotDashboard();

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Closed pilot"
        title="Pilot Dashboard"
        description="Участники, активность, метрики и проблемы закрытого пилота ЦКР. Без новых бизнес-модулей — только наблюдение."
      />

      <Card variant="surface" className="space-y-2 p-5">
        <h2 className="font-display text-lg text-foreground">
          Пилот ООО ТИНДА
        </h2>
        <p className="text-sm text-muted">
          Первый организационный пилот: оптовая платформа, анализ Лии, workspace,
          CRM-сегменты. Документация и seed — этап 30.
        </p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/partner" className="text-accent hover:underline">
            Кабинет организации
          </Link>
          <Link
            href="/dashboard/projects/b0000003-0000-4000-8000-000000000001/workspace"
            className="text-accent hover:underline"
          >
            Workspace проекта
          </Link>
          <Link href="/admin/crm" className="text-accent hover:underline">
            CRM
          </Link>
        </div>
        <p className="text-xs text-muted">
          Seed: <code className="text-foreground">npm run seed:tinda</code> ·
          отчёт: <code className="text-foreground">docs/tinda-pilot.md</code>
        </p>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Участники"
          value={data.participantCount}
          href="/admin/users"
        />
        <StatsCard
          label="Активные проекты"
          value={data.activeProjects.length}
          href="/admin/projects"
        />
        <StatsCard
          label="Заявки"
          value={data.applicationsCount}
          href="/dashboard/applications"
        />
        <StatsCard label="Сделки" value={data.dealsCount} />
        <StatsCard label="Сессии Лии" value={data.liaSessionsCount} href="/lia" />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Метрики пилота</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.metrics.map((metric) => (
            <Card key={metric.key} variant="surface" className="p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {metric.label}
              </p>
              <p className="mt-2 font-display text-2xl text-foreground">
                {metric.value}
              </p>
              <p className="mt-1 font-mono text-[11px] text-muted">
                {metric.key}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Участники пилота
          </h2>
          {data.participants.length === 0 ? (
            <p className="text-sm text-muted">Пока нет участников.</p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-auto text-sm">
              {data.participants.map((user) => (
                <li
                  key={user.id}
                  className="rounded-sm border border-border px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-foreground hover:text-accent"
                    >
                      {user.fullName || "Участник"}
                    </Link>
                    {user.inviteUsed ? (
                      <Badge variant="soft">invite</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {user.email || "email скрыт"} ·{" "}
                    {user.roles.join(", ") || "без роли"} ·{" "}
                    {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Активные проекты
          </h2>
          {data.activeProjects.length === 0 ? (
            <p className="text-sm text-muted">Нет активных проектов.</p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-auto text-sm">
              {data.activeProjects.map((project) => (
                <li
                  key={project.id}
                  className="rounded-sm border border-border px-3 py-2"
                >
                  <Link
                    href={`/project/${project.id}`}
                    className="text-foreground hover:text-accent"
                  >
                    {project.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {project.status} · {project.ownerName || "—"} ·{" "}
                    {new Date(project.updatedAt).toLocaleString("ru-RU")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">Активность</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-muted">
              Событий пилотных метрик пока нет.
            </p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-auto text-sm">
              {data.recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="rounded-sm border border-border px-3 py-2"
                >
                  <span className="text-foreground">
                    {pilotMetricLabels[
                      item.eventType as keyof typeof pilotMetricLabels
                    ] || item.eventType}
                  </span>
                  <p className="mt-1 text-xs text-muted">
                    {item.entityType || "—"}{" "}
                    {item.entityId ? `· ${item.entityId.slice(0, 8)}…` : ""} ·{" "}
                    {new Date(item.createdAt).toLocaleString("ru-RU")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">Feedback</h2>
          {data.recentFeedback.length === 0 ? (
            <p className="text-sm text-muted">Обратной связи пока нет.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-auto text-sm">
              {data.recentFeedback.map((item) => (
                <li
                  key={item.id}
                  className="rounded-sm border border-border px-3 py-2"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="accent">{item.type}</Badge>
                    {item.relatedType ? (
                      <Badge variant="soft">
                        {item.relatedType}
                        {item.relatedId
                          ? `:${item.relatedId.slice(0, 8)}`
                          : ""}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-foreground">{item.message}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.page || "/"} ·{" "}
                    {item.userId
                      ? `user ${item.userId.slice(0, 8)}…`
                      : "аноним"}{" "}
                    · {new Date(item.createdAt ?? "").toLocaleString("ru-RU")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Pilot issues
          </h2>
          {data.issues.length === 0 ? (
            <p className="text-sm text-muted">Проблем пока нет.</p>
          ) : (
            <ul className="space-y-3">
              {data.issues.map((issue) => (
                <li
                  key={issue.id}
                  className="rounded-sm border border-border px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={pilotIssueSeverityLabels[issue.severity]}
                      tone={severityTone(issue.severity)}
                    />
                    <PilotIssueStatusForm
                      id={issue.id}
                      status={issue.status}
                    />
                  </div>
                  <p className="mt-2 font-medium text-foreground">
                    {issue.title}
                  </p>
                  {issue.description ? (
                    <p className="mt-1 text-sm text-muted">
                      {issue.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted">
                    {new Date(issue.createdAt ?? "").toLocaleString("ru-RU")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card variant="surface" className="p-5">
          <CreatePilotIssueForm />
        </Card>
      </section>
    </div>
  );
}
