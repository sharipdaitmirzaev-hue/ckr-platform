import { StatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  IMPROVEMENT_PRIORITY_ORDER,
  launchDecisionHints,
  launchDecisionLabels,
  type ImprovementPriorityBucket,
  type LaunchDecision,
} from "@/config/launch-decision";
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
import { LaunchDecisionForm } from "@/features/launch/components/launch-decision-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getLaunchDecisionDashboard } from "@/lib/launch/decision";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Launch Decision — Админ" };

export const dynamic = "force-dynamic";

function decisionTone(decision: LaunchDecision) {
  if (decision === "public_launch_ready") return "success" as const;
  if (decision === "expand_beta") return "accent" as const;
  if (decision === "needs_improvement") return "danger" as const;
  return "warning" as const;
}

function priorityTone(priority: ImprovementPriorityBucket) {
  if (priority === "critical") return "danger" as const;
  if (priority === "high") return "warning" as const;
  if (priority === "medium") return "accent" as const;
  return "neutral" as const;
}

const priorityLabels: Record<ImprovementPriorityBucket, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default async function AdminLaunchDecisionPage() {
  const current = await getCurrentUser();
  const data = await getLaunchDecisionDashboard(current?.user.id ?? null);
  const { report } = data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Decision Gate"
        title="Решение о запуске"
        description="После Closed Wave 1 — анализ результатов, готовность продукта и решение о следующей волне. Без новых бизнес-модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/wave-review" className="text-accent hover:underline">
          Wave Review
        </Link>
        <Link href="/admin/launch" className="text-accent hover:underline">
          Launch
        </Link>
        <Link
          href="/admin/improvements"
          className="text-accent hover:underline"
        >
          Улучшения
        </Link>
        <Link
          href="/lia?scenario=launch_decision"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: готов ли ЦКР к следующей волне?
        </Link>
        <span className="text-muted">docs/launch-decision-gate.md</span>
      </div>

      {/* LaunchDecisionReport */}
      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            LaunchDecisionReport
          </h2>
          <StatusBadge
            label={launchDecisionLabels[report.recommendation]}
            tone={decisionTone(report.recommendation)}
          />
        </div>
        <p className="text-sm text-muted">{report.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Wave results
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.wave_results.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Goal completion
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.goal_completion.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Business value
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.business_value.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Product readiness
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.product_readiness.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Critical risks
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.critical_risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Next step
            </p>
            <p className="mt-2 text-sm text-foreground">{report.next_step}</p>
            <p className="mt-2 text-xs text-muted">
              {launchDecisionHints[report.recommendation]}
            </p>
          </div>
        </div>
      </Card>

      {/* Результаты волны */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Результаты волны
        </h2>
        <Card variant="surface" className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">
              {data.wave1?.name ?? "Closed Wave 1 — ТИНДА"}
            </p>
            {data.wave1 ? (
              <>
                <Badge variant="accent">
                  {
                    launchWaveTypeLabels[
                      data.wave1.wave_type as LaunchWaveType
                    ]
                  }
                </Badge>
                <Badge variant="soft">
                  {
                    launchWaveStatusLabels[
                      data.wave1.status as LaunchWaveStatus
                    ]
                  }
                </Badge>
              </>
            ) : null}
          </div>
          <p className="text-sm text-muted">
            Цели / факт / прогресс — по данным Wave Review.
          </p>
          <ul className="space-y-2 text-sm">
            {report.goal_completion.map((item) => (
              <li
                key={item}
                className="rounded-sm border border-border px-3 py-2 text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Состояние продукта */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Состояние продукта
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card variant="surface" className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Проблемы
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {report.critical_risks.slice(0, 6).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card variant="surface" className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Улучшения
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {report.product_readiness.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card variant="surface" className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Готовность
            </p>
            <p className="text-sm text-foreground">
              Рекомендация: {launchDecisionLabels[report.recommendation]}
            </p>
            <p className="text-xs text-muted">{report.next_step}</p>
          </Card>
        </div>
      </section>

      {/* Обязательные улучшения */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Что исправить до следующей волны
        </h2>
        <p className="text-sm text-muted">
          Источники: product_improvements, pilot_issues, feedback (medium+).
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {IMPROVEMENT_PRIORITY_ORDER.map((bucket) => {
            const items = data.requiredFixes[bucket];
            return (
              <Card key={bucket} variant="surface" className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <StatusBadge
                    label={priorityLabels[bucket]}
                    tone={priorityTone(bucket)}
                  />
                  <Badge variant="soft">{items.length}</Badge>
                </div>
                {items.length === 0 ? (
                  <p className="text-sm text-muted">Нет пунктов.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {items.slice(0, 8).map((item) => (
                      <li
                        key={item.id}
                        className="rounded-sm border border-border px-3 py-2"
                      >
                        <p className="font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted">
                          {item.source} · {item.status}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
        <Link
          href="/admin/improvements"
          className="text-sm text-accent hover:underline"
        >
          Открыть цикл улучшений →
        </Link>
      </section>

      {/* Решение */}
      <Card variant="surface" className="space-y-4 p-5">
        <h2 className="font-display text-xl text-foreground">Решение</h2>
        <p className="text-sm text-muted">
          Оставить closed · расширить beta · готовить public. Рекомендация
          системы не заменяет решение оператора.
        </p>
        {data.latestDecision ? (
          <p className="text-sm text-foreground">
            Последнее решение:{" "}
            <StatusBadge
              label={
                launchDecisionLabels[
                  data.latestDecision.decision as LaunchDecision
                ]
              }
              tone={decisionTone(
                data.latestDecision.decision as LaunchDecision,
              )}
            />{" "}
            <span className="text-xs text-muted">
              {new Date(data.latestDecision.created_at).toLocaleString("ru-RU")}
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted">Решение ещё не зафиксировано.</p>
        )}
        <LaunchDecisionForm
          waveId={data.wave1?.id ?? null}
          suggested={data.suggestedDecision}
          latest={
            (data.latestDecision?.decision as LaunchDecision | undefined) ??
            null
          }
        />
      </Card>

      {/* Launch Wave 2 */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Следующая волна — Launch Wave 2
        </h2>
        <Card variant="surface" className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">
              {data.wave2?.name ?? "Launch Wave 2"}
            </p>
            {data.wave2 ? (
              <>
                <Badge variant="accent">
                  {
                    launchWaveTypeLabels[
                      data.wave2.wave_type as LaunchWaveType
                    ]
                  }
                </Badge>
                <Badge variant="soft">
                  {
                    launchWaveStatusLabels[
                      data.wave2.status as LaunchWaveStatus
                    ]
                  }
                </Badge>
              </>
            ) : (
              <Badge variant="default">примените миграцию 45</Badge>
            )}
          </div>
          <p className="text-sm text-muted">
            {data.wave2?.description ||
              "Тип closed или beta. Участники: предприниматели, инвесторы, эксперты. Цель — проверить взаимодействие экосистемы, не один проект."}
          </p>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card variant="surface" className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Пользователи
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>20 предпринимателей</li>
              <li>5 экспертов</li>
              <li>3 инвестора</li>
            </ul>
          </Card>
          <Card variant="surface" className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Активность
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>заполненные профили</li>
              <li>проекты</li>
              <li>интересы</li>
              <li>заявки</li>
            </ul>
          </Card>
          <Card variant="surface" className="space-y-2 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Результаты
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>первые связи</li>
              <li>первые сделки</li>
              <li>первые партнёрства</li>
            </ul>
          </Card>
        </div>

        {data.wave2Goals.length > 0 ? (
          <ul className="space-y-3">
            {data.wave2Goals.map((goal) => (
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
        ) : null}
      </section>
    </div>
  );
}
