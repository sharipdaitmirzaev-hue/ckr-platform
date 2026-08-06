import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { ProjectAcquisitionReportCard } from "@/components/lia/project-acquisition-report";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProjectAcquisitionDashboard } from "@/lib/project-acquisition/dashboard";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Project Acquisition — Админ",
};

export const dynamic = "force-dynamic";

function qualityTone(level: "low" | "medium" | "high") {
  if (level === "high") return "success" as const;
  if (level === "low") return "danger" as const;
  return "warning" as const;
}

export default async function AdminProjectAcquisitionPage() {
  const data = await getProjectAcquisitionDashboard();
  const {
    funnel,
    pipeline,
    sources,
    quality,
    developmentPath,
    metrics,
    report,
  } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Project Acquisition"
        title="Поток бизнес-проектов ЦКР"
        description="Поиск → контакт → интерес → черновик → модерация → публикация → взаимодействия. Без нового каталога — existing projects + CRM."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/crm" className="text-accent hover:underline">
          CRM
        </Link>
        <Link href="/admin/projects" className="text-accent hover:underline">
          Проекты
        </Link>
        <Link href="/admin/growth" className="text-accent hover:underline">
          Growth
        </Link>
        <Link
          href="/lia?scenario=business_audit"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: аудит моего бизнеса
        </Link>
        <Link
          href="/lia?scenario=project_acquisition"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: поток проектов
        </Link>
        <span className="text-muted">docs/project-acquisition-engine.md</span>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Метрики</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard label="Лиды" value={metrics.leads} />
          <StatsCard label="Черновики" value={metrics.drafts} />
          <StatsCard label="На модерации" value={metrics.moderation} />
          <StatsCard label="Опубликовано" value={metrics.published} />
          <StatsCard label="Активные" value={metrics.active} />
          <StatsCard
            label="Взаимодействия"
            value={metrics.interactions}
            hint="applications"
          />
        </div>
        <p className="text-sm text-muted">
          Конверсия лид → публикация/active: {pipeline.overallConversionPct}% ·
          проектов в системе: {pipeline.totalProjects}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Воронка проектов
        </h2>
        <p className="text-sm text-muted">
          Количество · конверсия от предыдущего этапа · среднее время
          прохождения (дни).
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {funnel.map((stage) => (
            <Card key={stage.id} variant="surface" className="space-y-2 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {stage.label}
              </p>
              <p className="font-display text-2xl text-foreground">
                {stage.count}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted">
                <Badge variant="soft">
                  конверсия {stage.conversionFromPrevPct}%
                </Badge>
                {stage.avgDaysFromPrev != null ? (
                  <Badge variant="soft">~{stage.avgDaysFromPrev} дн.</Badge>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">ProjectSources</h2>
        <p className="text-sm text-muted">
          Источник → лид → проект → результат.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="py-2 pr-3 font-medium">Источник</th>
                <th className="py-2 pr-3 font-medium">Лид</th>
                <th className="py-2 pr-3 font-medium">Проект</th>
                <th className="py-2 font-medium">Результат</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.source} className="border-b border-border/60">
                  <td className="py-2.5 pr-3 font-medium">{s.label}</td>
                  <td className="py-2.5 pr-3">{s.leads}</td>
                  <td className="py-2.5 pr-3">{s.projects}</td>
                  <td className="py-2.5">{s.results}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Шаблон развития бизнеса
        </h2>
        <p className="text-sm text-muted">
          business_development · BusinessAuditReport · StrategyReport
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {developmentPath.map((step, index) => (
            <Card key={step.id} variant="surface" className="space-y-2 p-4">
              <Badge variant="soft">
                {index + 1}. {step.label}
              </Badge>
              <p className="text-sm text-muted">{step.hint}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            ProjectQualityScore
          </h2>
          <Badge variant="accent">среднее {quality.averagePct}%</Badge>
          <Badge variant="soft">high {quality.distribution.high}</Badge>
          <Badge variant="soft">medium {quality.distribution.medium}</Badge>
          <Badge variant="soft">low {quality.distribution.low}</Badge>
        </div>
        <p className="text-sm text-muted">
          Только рекомендация. Не блокирует публикацию автоматически.
        </p>
        <div className="space-y-2">
          {quality.samples.length === 0 ? (
            <p className="text-sm text-muted">Пока нет проектов для оценки.</p>
          ) : (
            quality.samples.map((q) => (
              <Card
                key={q.projectId}
                variant="surface"
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{q.title}</span>
                    <StatusBadge
                      label={`${q.pct}% · ${q.level}`}
                      tone={qualityTone(q.level)}
                    />
                  </div>
                  <p className="text-sm text-muted">
                    {q.recommendations[0]}
                  </p>
                </div>
                <Link
                  href={`/project/${q.projectId}`}
                  className="text-sm text-accent hover:underline"
                >
                  Карточка
                </Link>
              </Card>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          ProjectAcquisitionReport
        </h2>
        <ProjectAcquisitionReportCard report={report} />
      </section>
    </div>
  );
}
