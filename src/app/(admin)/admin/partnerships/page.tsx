import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { PartnershipReportCard } from "@/components/lia/partnership-report";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { PartnershipPipelineSelect } from "@/features/partnership-network/components/partnership-pipeline-select";
import { PartnershipTaskForm } from "@/features/partnership-network/components/partnership-task-form";
import { PartnershipTaskStatusSelect } from "@/features/partnership-network/components/partnership-task-status";
import { getPartnershipNetworkDashboard } from "@/lib/partnership-network/dashboard";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partnerships — Админ",
};

export const dynamic = "force-dynamic";

function bucketTone(bucket: "active" | "potential" | "completed") {
  if (bucket === "active") return "success" as const;
  if (bucket === "completed") return "neutral" as const;
  return "warning" as const;
}

export default async function AdminPartnershipsPage() {
  const data = await getPartnershipNetworkDashboard();
  const {
    buckets,
    categories,
    pipeline,
    partners,
    outcomes,
    attribution,
    tasks,
    taskCounts,
    report,
  } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Partnership Network"
        title="Партнёрская сеть ЦКР"
        description="Привлечение, развитие и оценка партнёров на базе organizations и partnerships. Сеть, которая приводит проекты, людей и ресурсы."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/partner" className="text-accent hover:underline">
          Кабинет партнёра
        </Link>
        <Link href="/admin/crm" className="text-accent hover:underline">
          CRM
        </Link>
        <Link href="/admin/growth" className="text-accent hover:underline">
          Growth
        </Link>
        <Link
          href="/lia?scenario=partnership_network"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: партнёрская сеть
        </Link>
        <span className="text-muted">docs/partnership-network.md</span>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Партнёры</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard label="Активные" value={buckets.active} />
          <StatsCard label="Потенциальные" value={buckets.potential} />
          <StatsCard label="Завершённые" value={buckets.completed} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Типы партнёров
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Card key={c.type} variant="surface" className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {c.label}
              </p>
              <p className="font-display text-2xl text-foreground">{c.count}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          PartnershipPipeline
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          Карточки партнёров
        </h2>
        <div className="space-y-3">
          {partners.length === 0 ? (
            <p className="text-sm text-muted">
              Партнёров пока нет. Создайте организацию в /partner или CRM.
            </p>
          ) : (
            partners.map((p) => (
              <Card
                key={`${p.partnershipId}-${p.organizationId}`}
                variant="surface"
                className="space-y-3 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg text-foreground">
                        {p.name}
                      </h3>
                      <StatusBadge
                        label={p.bucket}
                        tone={bucketTone(p.bucket)}
                      />
                      <Badge variant="soft">{p.categoryLabel}</Badge>
                    </div>
                    <p className="text-sm text-muted">{p.description}</p>
                  </div>
                  <PartnershipPipelineSelect
                    partnershipId={p.partnershipId}
                    stage={p.pipelineStage}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      Направление
                    </p>
                    <p className="mt-1">{p.direction}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      Контакт
                    </p>
                    <p className="mt-1 break-all">{p.contact}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      Статус / ответственный
                    </p>
                    <p className="mt-1">
                      {p.statusLabel} · {p.responsible}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      Дата начала
                    </p>
                    <p className="mt-1">
                      {p.startedAt
                        ? new Date(p.startedAt).toLocaleDateString("ru-RU")
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  <Badge variant="soft">
                    пользователи {p.outcomes.referredUsers}
                  </Badge>
                  <Badge variant="soft">проекты {p.outcomes.projects}</Badge>
                  <Badge variant="soft">заявки {p.outcomes.applications}</Badge>
                  <Badge variant="soft">сделки {p.outcomes.deals}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          PartnershipOutcomes
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            label="Приведённые пользователи"
            value={outcomes.referredUsers}
          />
          <StatsCard label="Проекты" value={outcomes.projects} />
          <StatsCard label="Эксперты" value={outcomes.experts} />
          <StatsCard label="Инвесторы" value={outcomes.investors} />
          <StatsCard label="Заявки" value={outcomes.applications} />
          <StatsCard label="Сделки" value={outcomes.deals} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Partnership Attribution
        </h2>
        <p className="text-sm text-muted">
          Источник <code>partner</code>: регистрации, проекты, заявки, сделки.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Партнёр</th>
                <th className="py-2 pr-3 font-medium">Регистрации</th>
                <th className="py-2 pr-3 font-medium">Проекты</th>
                <th className="py-2 pr-3 font-medium">Заявки</th>
                <th className="py-2 font-medium">Сделки</th>
              </tr>
            </thead>
            <tbody>
              {attribution.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-muted">
                    Пока нет атрибуции source=partner
                  </td>
                </tr>
              ) : (
                attribution.map((a) => (
                  <tr
                    key={a.organizationId || a.partnerName}
                    className="border-b border-border/60"
                  >
                    <td className="py-2.5 pr-3 font-medium">{a.partnerName}</td>
                    <td className="py-2.5 pr-3">{a.registrations}</td>
                    <td className="py-2.5 pr-3">{a.projects}</td>
                    <td className="py-2.5 pr-3">{a.applications}</td>
                    <td className="py-2.5">{a.deals}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            PartnershipTasks
          </h2>
          <Badge variant="soft">new {taskCounts.new}</Badge>
          <Badge variant="soft">in_progress {taskCounts.in_progress}</Badge>
          <Badge variant="soft">completed {taskCounts.completed}</Badge>
        </div>
        <Card variant="surface" className="space-y-3 p-5">
          <PartnershipTaskForm />
        </Card>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted">
              Задач пока нет. Seed создаётся миграцией или добавьте вручную.
            </p>
          ) : (
            tasks.map((task) => (
              <Card
                key={task.id}
                variant="surface"
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="soft">{task.taskTypeLabel}</Badge>
                    <span className="font-medium text-sm">{task.title}</span>
                  </div>
                  {task.description ? (
                    <p className="text-sm text-muted">{task.description}</p>
                  ) : null}
                </div>
                <PartnershipTaskStatusSelect
                  taskId={task.id}
                  status={task.status}
                />
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          PartnershipReport
        </h2>
        <PartnershipReportCard report={report} />
      </section>
    </div>
  );
}
