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
import {
  feedbackPriorityLabels,
  pilotChecklistStatusLabels,
  pilotParticipantRoleLabels,
  pilotParticipantStatusLabels,
  type FeedbackPriority,
  type PilotParticipantRole,
  type PilotParticipantStatus,
} from "@/config/pilot-operations";
import { feedbackTypeLabels, type FeedbackType } from "@/config/beta";
import { CreatePilotIssueForm } from "@/features/pilot/components/create-pilot-issue-form";
import { CreatePilotParticipantForm } from "@/features/pilot/components/create-pilot-participant-form";
import { PilotChecklistStatusForm } from "@/features/pilot/components/pilot-checklist-status-form";
import { PilotIssueStatusForm } from "@/features/pilot/components/pilot-issue-status-form";
import { PilotParticipantStatusForm } from "@/features/pilot/components/pilot-participant-status-form";
import {
  getPilotDashboard,
  listPilotChecklists,
} from "@/lib/pilot/queries";
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

const stageLabels: Record<string, string> = {
  idea: "Идея",
  startup: "Стартап",
  operating: "Операции",
  expansion: "Масштаб",
};

export default async function AdminPilotPage() {
  const data = await getPilotDashboard();
  const checklists = await listPilotChecklists();
  const { ops } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Closed pilot"
        title="Pilot Operations"
        description="Управление закрытым пилотом: участники, проекты, активность, обратная связь и контроль результатов. Без новых бизнес-направлений."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/pilot/report"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Отчёт пилота
        </Link>
        <Link
          href="/admin/improvements"
          className="text-accent hover:underline"
        >
          Центр улучшений
        </Link>
        <Link href="/admin/results" className="text-accent hover:underline">
          Результаты ЦКР
        </Link>
        <Link
          href="/lia?scenario=pilot_insight"
          className="text-accent hover:underline"
        >
          Лия: что мешает проекту
        </Link>
        <span className="text-muted">docs/pilot-operations.md</span>
      </div>

      <Card variant="surface" className="space-y-2 p-5">
        <h2 className="font-display text-lg text-foreground">
          Пилот ООО ТИНДА
        </h2>
        <p className="text-sm text-muted">
          Первый пилотный проект: контроль активности команды, roadmap, KPI и
          результатов. Документация прогресса —{" "}
          <code className="text-foreground">docs/tinda-pilot-progress.md</code>.
        </p>
        {ops.tinda ? (
          <p className="text-sm text-foreground">
            {ops.tinda.title} · {ops.tinda.status} · {ops.tinda.stage}
          </p>
        ) : (
          <p className="text-sm text-muted">
            Проект ТИНДА ещё не засеян. Запустите{" "}
            <code className="text-foreground">npm run seed:tinda</code>.
          </p>
        )}
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/partner" className="text-accent hover:underline">
            Кабинет организации
          </Link>
          {ops.tinda ? (
            <Link
              href={`/dashboard/projects/${ops.tinda.projectId}/workspace`}
              className="text-accent hover:underline"
            >
              Workspace
            </Link>
          ) : null}
          <Link href="/admin/crm" className="text-accent hover:underline">
            CRM
          </Link>
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Участники</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Приглашённых" value={ops.participants.invited} />
          <StatsCard
            label="Зарегистрированных"
            value={ops.participants.registered}
            href="/admin/users"
          />
          <StatsCard
            label="Завершивших профиль"
            value={ops.participants.profileComplete}
          />
          <StatsCard label="Активных" value={ops.participants.active} />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          {(
            Object.entries(ops.participants.byRole) as Array<
              [PilotParticipantRole, number]
            >
          ).map(([role, count]) => (
            <Badge key={role} variant="soft">
              {pilotParticipantRoleLabels[role]}: {count}
            </Badge>
          ))}
          {(
            Object.entries(ops.participants.byStatus) as Array<
              [PilotParticipantStatus, number]
            >
          ).map(([status, count]) => (
            <Badge key={status} variant="default">
              {pilotParticipantStatusLabels[status]}: {count}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Проекты</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Созданные"
            value={ops.projects.created}
            href="/admin/projects"
          />
          <StatsCard label="Активные" value={ops.projects.active} />
          <StatsCard
            label="Без активности (14 дн.)"
            value={ops.projects.inactive}
          />
          <StatsCard
            label="Чеклист пилота"
            value={`${ops.checklistProgress.percent}%`}
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          {Object.entries(ops.projects.byStage).map(([stage, count]) => (
            <Badge key={stage} variant="soft">
              {stageLabels[stage] ?? stage}: {count}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Активность</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatsCard label="Лия" value={ops.activity.lia} href="/lia" />
          <StatsCard
            label="Заявки"
            value={ops.activity.applications}
            href="/dashboard/applications"
          />
          <StatsCard label="Сделки" value={ops.activity.deals} />
          <StatsCard label="Сообщения" value={ops.activity.messages} />
          <StatsCard
            label="Действия workspace"
            value={ops.activity.workspaceActions}
          />
        </div>
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

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Участники pilot_participants
          </h2>
          {ops.participants.records.length === 0 ? (
            <p className="text-sm text-muted">
              Записей пока нет — добавьте участника справа или примените seed
              ТИНДА.
            </p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-auto text-sm">
              {ops.participants.records.map((user) => (
                <li
                  key={user.id}
                  className="rounded-sm border border-border px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-foreground">
                      {user.fullName || user.userId?.slice(0, 8) || "Участник"}
                    </span>
                    <Badge variant="soft">
                      {pilotParticipantRoleLabels[user.role]}
                    </Badge>
                    <Badge variant="default">
                      {pilotParticipantStatusLabels[user.status]}
                    </Badge>
                  </div>
                  {user.notes ? (
                    <p className="mt-1 text-xs text-muted">{user.notes}</p>
                  ) : null}
                  <div className="mt-2">
                    <PilotParticipantStatusForm
                      id={user.id}
                      status={user.status}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card variant="surface" className="p-5">
          <CreatePilotParticipantForm />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Чеклист пилота
          </h2>
          {checklists.length === 0 ? (
            <p className="text-sm text-muted">
              Пункты появятся при создании участника.
            </p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-auto text-sm">
              {checklists.slice(0, 40).map((item) => (
                <li
                  key={item.id}
                  className="rounded-sm border border-border px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-foreground">{item.item}</span>
                    <Badge variant="soft">
                      {pilotChecklistStatusLabels[item.status]}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <PilotChecklistStatusForm
                      id={item.id}
                      status={item.status}
                    />
                  </div>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl text-foreground">Feedback</h2>
            <div className="flex flex-wrap gap-1">
              {(
                Object.entries(ops.feedbackByPriority) as Array<
                  [FeedbackPriority, number]
                >
              ).map(([priority, count]) => (
                <Badge key={priority} variant="soft">
                  {feedbackPriorityLabels[priority] ?? priority}: {count}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 text-xs">
            {(
              Object.entries(ops.feedbackByType) as Array<[string, number]>
            ).map(([type, count]) => (
              <Badge key={type} variant="default">
                {feedbackTypeLabels[type as FeedbackType] ?? type}: {count}
              </Badge>
            ))}
          </div>
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
                    <Badge variant="accent">
                      {feedbackTypeLabels[item.type] ?? item.type}
                    </Badge>
                    <Badge variant="soft">
                      {feedbackPriorityLabels[item.priority] ?? item.priority}
                    </Badge>
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
