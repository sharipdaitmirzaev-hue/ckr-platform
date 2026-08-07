import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { feedbackTypeLabels, type FeedbackType } from "@/config/beta";
import {
  productImprovementPriorityLabels,
  productImprovementSourceLabels,
  productImprovementStatusLabels,
  type ProductImprovementPriority,
} from "@/config/improvements";
import {
  pilotIssueSeverityLabels,
  pilotMetricLabels,
  type PilotIssueSeverity,
  type PilotMetricType,
} from "@/config/pilot";
import { feedbackPriorityLabels } from "@/config/pilot-operations";
import { CreateImprovementForm } from "@/features/improvements/components/create-improvement-form";
import { ImprovementPriorityForm } from "@/features/improvements/components/improvement-priority-form";
import { ImprovementStatusForm } from "@/features/improvements/components/improvement-status-form";
import {
  promoteFeedbackToImprovementAction,
  promoteFeedbackToIssueAction,
  promoteIssueToImprovementAction,
} from "@/features/improvements/actions";
import { getImprovementsDashboard } from "@/lib/improvements/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Улучшения продукта — Админ" };

export const dynamic = "force-dynamic";

function priorityTone(priority: ProductImprovementPriority | PilotIssueSeverity) {
  if (priority === "critical") return "danger" as const;
  if (priority === "high") return "warning" as const;
  if (priority === "medium") return "accent" as const;
  return "neutral" as const;
}

export default async function AdminImprovementsPage() {
  const data = await getImprovementsDashboard();

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Product loop"
        title="Центр улучшений"
        description="Проблемы и предложения пилота → product_improvements. Цикл без новых бизнес-модулей: feedback → pilot_issues → улучшения."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/pilot" className="text-accent hover:underline">
          Pilot Operations
        </Link>
        <Link
          href="/admin/pilot/report"
          className="text-accent hover:underline"
        >
          Отчёт пилота
        </Link>
        <Link
          href="/lia?scenario=product_improvement"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: что улучшить в ЦКР
        </Link>
        <span className="text-muted">docs/product-improvement-loop.md</span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Улучшения" value={data.counts.improvements} />
        <StatsCard label="Открытые проблемы" value={data.counts.problemsOpen} />
        <StatsCard label="Предложения (feedback)" value={data.counts.proposals} />
        <StatsCard
          label="В работе"
          value={data.counts.byStatus.in_progress ?? 0}
        />
      </section>

      <Card variant="surface" className="space-y-2 p-5">
        <h2 className="font-display text-lg text-foreground">Цепочка</h2>
        <p className="font-mono text-sm text-muted">
          feedback → pilot_issues → product_improvements
        </p>
        <p className="text-sm text-muted">
          Продвигайте предложения в проблемы, проблемы — в улучшения. Метрики
          пилота (analytics_events) подсказывают слабые места воронки.
        </p>
        {data.metricHints.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {data.metricHints.map((hint) => (
              <Badge key={hint.eventType} variant="soft">
                {pilotMetricLabels[hint.eventType as PilotMetricType] ??
                  hint.eventType}
                : {hint.count}
              </Badge>
            ))}
          </div>
        ) : null}
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Улучшения (product_improvements)
          </h2>
          {data.improvements.length === 0 ? (
            <p className="text-sm text-muted">
              Пока нет записей — добавьте вручную или продвиньте из issue /
              feedback.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.improvements.map((item) => (
                <li
                  key={item.id}
                  className="rounded-sm border border-border px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={productImprovementPriorityLabels[item.priority]}
                      tone={priorityTone(item.priority)}
                    />
                    <Badge variant="soft">
                      {productImprovementStatusLabels[item.status]}
                    </Badge>
                    <Badge variant="default">
                      {productImprovementSourceLabels[item.sourceType]}
                    </Badge>
                  </div>
                  <p className="mt-2 font-medium text-foreground">
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="mt-1 text-sm text-muted whitespace-pre-wrap">
                      {item.description}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ImprovementStatusForm
                      id={item.id}
                      status={item.status}
                    />
                    <ImprovementPriorityForm
                      id={item.id}
                      priority={item.priority}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {item.sourceId
                      ? `source ${item.sourceId.slice(0, 8)}… · `
                      : ""}
                    {new Date(item.createdAt ?? "").toLocaleString("ru-RU")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card variant="surface" className="p-5">
          <CreateImprovementForm />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">Проблемы</h2>
          {data.problems.length === 0 ? (
            <p className="text-sm text-muted">Проблем пилота пока нет.</p>
          ) : (
            <ul className="max-h-[32rem] space-y-3 overflow-auto">
              {data.problems.map((issue) => (
                <li
                  key={issue.id}
                  className="rounded-sm border border-border px-3 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={pilotIssueSeverityLabels[issue.severity]}
                      tone={priorityTone(issue.severity)}
                    />
                    <Badge variant="soft">{issue.status}</Badge>
                    {issue.sourceType ? (
                      <Badge variant="default">
                        from {issue.sourceType}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 font-medium text-foreground">
                    {issue.title}
                  </p>
                  {issue.description ? (
                    <p className="mt-1 text-sm text-muted line-clamp-3">
                      {issue.description}
                    </p>
                  ) : null}
                  <form
                    action={promoteIssueToImprovementAction}
                    className="mt-3"
                  >
                    <input type="hidden" name="issueId" value={issue.id} />
                    <button
                      type="submit"
                      className="text-sm text-accent hover:underline"
                    >
                      → В улучшения
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">
            Предложения (feedback)
          </h2>
          {data.proposals.length === 0 ? (
            <p className="text-sm text-muted">Обратной связи пока нет.</p>
          ) : (
            <ul className="max-h-[32rem] space-y-3 overflow-auto">
              {data.proposals.map((item) => (
                <li
                  key={item.id}
                  className="rounded-sm border border-border px-3 py-3"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="accent">
                      {feedbackTypeLabels[item.type as FeedbackType] ??
                        item.type}
                    </Badge>
                    <Badge variant="soft">
                      {feedbackPriorityLabels[item.priority] ?? item.priority}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{item.message}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.page || "/"} ·{" "}
                    {new Date(item.createdAt ?? "").toLocaleString("ru-RU")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <form action={promoteFeedbackToIssueAction}>
                      <input
                        type="hidden"
                        name="feedbackId"
                        value={item.id}
                      />
                      <button
                        type="submit"
                        className="text-accent hover:underline"
                      >
                        → В проблему
                      </button>
                    </form>
                    <form action={promoteFeedbackToImprovementAction}>
                      <input
                        type="hidden"
                        name="feedbackId"
                        value={item.id}
                      />
                      <button
                        type="submit"
                        className="text-accent hover:underline"
                      >
                        → В улучшения
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
