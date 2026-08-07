import { StatsCard } from "@/components/analytics/stats-card";
import { GrowthReportCard } from "@/components/lia/growth-report";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { GrowthTaskForm } from "@/features/growth/components/growth-task-form";
import { GrowthTaskStatusSelect } from "@/features/growth/components/growth-task-status";
import { getGrowthDashboard } from "@/lib/growth/dashboard";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Growth — Админ",
};

export const dynamic = "force-dynamic";

export default async function AdminGrowthPage() {
  const data = await getGrowthDashboard();
  const {
    users,
    channels,
    projectPipeline,
    expertPipeline,
    partnerTracking,
    tasks,
    taskCounts,
    report,
  } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Growth Engine"
        title="Рост ЦКР после Public Beta"
        description="Аудитория, проекты, эксперты, партнёры и каналы привлечения. Управляемый механизм роста без новых крупных модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/growth-kpi" className="text-accent hover:underline">
          Growth KPI
        </Link>
        <Link
          href="/admin/public-launch-operations"
          className="text-accent hover:underline"
        >
          Launch Operations
        </Link>
        <Link href="/admin/crm" className="text-accent hover:underline">
          CRM
        </Link>
        <Link
          href="/admin/open-beta-growth"
          className="text-accent hover:underline"
        >
          Retention
        </Link>
        <Link
          href="/lia?scenario=growth"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: как растёт ЦКР?
        </Link>
        <span className="text-muted">docs/growth-engine.md</span>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Рост пользователей</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Новые регистрации" value={users.registrations} />
          <StatsCard label="Активные пользователи" value={users.activeUsers} />
          <StatsCard
            label="Конверсия"
            value={`${users.conversionPct}%`}
            hint="Активные / регистрации"
          />
          <StatsCard
            label="Retention D7 / D30"
            value={`${users.retentionD7}% / ${users.retentionD30}%`}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Предприниматели"
            value={users.roles.entrepreneurs}
          />
          <StatsCard label="Эксперты" value={users.roles.experts} />
          <StatsCard label="Инвесторы" value={users.roles.investors} />
          <StatsCard label="Организации" value={users.roles.organizations} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">GrowthChannels</h2>
        <p className="text-sm text-muted">
          Источник → регистрации → активация → первое действие → результат.
          Конверсия source→reg {channels.conversionOverall.sourceToReg}% ·
          reg→act {channels.conversionOverall.regToActivation}% · act→action{" "}
          {channels.conversionOverall.activationToFirstAction}% · action→result{" "}
          {channels.conversionOverall.firstActionToResult}%.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Источник</th>
                <th className="py-2 pr-3 font-medium">Регистрации</th>
                <th className="py-2 pr-3 font-medium">Активация</th>
                <th className="py-2 pr-3 font-medium">Первое действие</th>
                <th className="py-2 font-medium">Результат</th>
              </tr>
            </thead>
            <tbody>
              {channels.funnels.map((f) => (
                <tr key={f.channel} className="border-b border-border/60">
                  <td className="py-2.5 pr-3">
                    <span className="font-medium">{f.label}</span>
                    <span className="ml-2 text-muted">({f.source})</span>
                  </td>
                  <td className="py-2.5 pr-3">{f.registrations}</td>
                  <td className="py-2.5 pr-3">{f.activation}</td>
                  <td className="py-2.5 pr-3">{f.firstAction}</td>
                  <td className="py-2.5">{f.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          ProjectGrowthPipeline
        </h2>
        <p className="text-sm text-muted">
          CRM-лиды: {projectPipeline.totalLeads} · конвертировано в проекты:{" "}
          {projectPipeline.convertedProjects}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projectPipeline.stages.map((stage) => (
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
          ExpertGrowthPipeline
        </h2>
        <p className="text-sm text-muted">
          Эксперты: {expertPipeline.totalExperts} · верификация (сигнал):{" "}
          {expertPipeline.verified}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {expertPipeline.stages.map((stage) => (
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
          PartnerGrowthTracking
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="Партнёры"
            value={partnerTracking.partners}
            hint="organizations"
          />
          <StatsCard
            label="Приведённые пользователи"
            value={partnerTracking.referredUsers}
            hint="канал partner"
          />
          <StatsCard label="Проекты" value={partnerTracking.projects} />
          <StatsCard label="Результаты" value={partnerTracking.results} />
        </div>
        {partnerTracking.signals.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {partnerTracking.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">GrowthTasks</h2>
          <Badge variant="soft">new {taskCounts.new}</Badge>
          <Badge variant="soft">in_progress {taskCounts.in_progress}</Badge>
          <Badge variant="soft">completed {taskCounts.completed}</Badge>
        </div>
        <Card variant="surface" className="space-y-3 p-5">
          <GrowthTaskForm />
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
                <GrowthTaskStatusSelect
                  taskId={task.id}
                  status={task.status}
                />
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">GrowthReport</h2>
        <GrowthReportCard report={report} />
      </section>
    </div>
  );
}
