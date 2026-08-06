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
import {
  nextWaveDecisionLabels,
  type NextWaveDecision,
} from "@/config/wave-review";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getWaveReviewDashboard } from "@/lib/launch/wave-review";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Wave Review — Админ" };

export const dynamic = "force-dynamic";

function decisionTone(decision: NextWaveDecision) {
  if (decision === "public_ready") return "success" as const;
  if (decision === "expand_beta") return "accent" as const;
  if (decision === "needs_improvement") return "danger" as const;
  return "warning" as const;
}

export default async function AdminWaveReviewPage() {
  const current = await getCurrentUser();
  const data = await getWaveReviewDashboard(current?.user.id ?? null);

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Closed wave review"
        title="Анализ первой волны"
        description="Результаты Closed Wave 1 — ТИНДА: цели, UX, ценность и решение по следующей волне. Без новых бизнес-модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
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
          href="/lia?scenario=wave_review"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: результаты волны
        </Link>
        <span className="text-muted">docs/closed-wave-review.md</span>
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
            <Badge variant="default">нет волны</Badge>
          )}
        </div>
        <p className="font-medium text-foreground">
          {data.wave?.name ?? "Closed Wave 1 — ТИНДА"}
        </p>
        <p className="text-sm text-muted">
          {data.wave?.description || "Первая закрытая волна на кейсе ТИНДА."}
        </p>
        <p className="text-xs text-muted">
          Период: {data.wave?.start_date ?? "—"}
          {data.wave?.end_date ? ` → ${data.wave.end_date}` : " · открыта"} ·
          участников: {data.participants}
        </p>
      </Card>

      {/* Next Wave Decision */}
      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            Next Wave Decision
          </h2>
          <StatusBadge
            label={nextWaveDecisionLabels[data.nextWave.decision]}
            tone={decisionTone(data.nextWave.decision)}
          />
          <Badge variant="soft">готовность {data.nextWave.readiness}%</Badge>
        </div>
        <p className="text-sm text-muted">{data.nextWave.hint}</p>
        <ProgressBar value={data.nextWave.readiness} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Риски
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
              {data.nextWave.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Рекомендации
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
              {data.nextWave.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Цели */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Цели</h2>
        {data.goals.length === 0 ? (
          <p className="text-sm text-muted">
            Целей нет — примените миграции closed wave / launch_goals.
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

      {/* Активность */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Активность</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard label="Лия" value={data.activity.lia} />
          <StatsCard label="Проекты" value={data.activity.projects} />
          <StatsCard label="Задачи" value={data.activity.tasks} />
          <StatsCard label="CRM" value={data.activity.crm} />
          <StatsCard label="Заявки" value={data.activity.applications} />
          <StatsCard label="Сделки" value={data.activity.deals} />
        </div>
      </section>

      {/* UX путь */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card variant="surface" className="space-y-3 p-5">
          <h2 className="font-display text-xl text-foreground">
            Путь пользователя
          </h2>
          <ul className="space-y-2">
            {data.uxPath.map((step) => (
              <li
                key={step.key}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="text-accent">{step.passed ? "✓" : "○"}</span>
                <span>
                  <span className="font-medium">{step.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {step.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card variant="surface" className="space-y-3 p-5">
          <h2 className="font-display text-xl text-foreground">
            Проблемы UX / продукта
          </h2>
          {data.uxProblems.length === 0 ? (
            <p className="text-sm text-muted">Сигналов пока нет.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.uxProblems.map((p) => (
                <li key={p.id} className="text-foreground">
                  <span className="text-xs uppercase text-muted">
                    {p.category} · {p.source}
                  </span>
                  <span className="mt-0.5 block">{p.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* ClosedWaveReviewReport */}
      <Card variant="surface" className="space-y-4 p-5">
        <h2 className="font-display text-xl text-foreground">
          ClosedWaveReviewReport
        </h2>
        <p className="text-sm text-muted">{data.reviewReport.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Completed goals
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {data.reviewReport.completed_goals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Failed goals
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {data.reviewReport.failed_goals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Business results
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {data.reviewReport.business_results.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Product issues
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {data.reviewReport.product_issues.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Improvement loop */}
      <Card variant="surface" className="space-y-3 p-5">
        <h2 className="font-display text-xl text-foreground">
          Product Improvement Loop
        </h2>
        <p className="text-sm text-muted">
          Проблема волны → pilot_issue → product_improvement (автосвязка при
          открытии review).
        </p>
        {data.improvementLinks.length === 0 ? (
          <p className="text-sm text-muted">
            Пока нечего продвигать — нет failed-целей и UX-сигналов.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.improvementLinks.map((link) => (
              <li
                key={link.issueId}
                className="rounded-sm border border-border px-3 py-2"
              >
                <p className="font-medium text-foreground">
                  {link.issueTitle}
                </p>
                <p className="text-xs text-muted">
                  improvement:{" "}
                  {link.improvementTitle ?? "не создано"} ·{" "}
                  <Link
                    href="/admin/improvements"
                    className="text-accent hover:underline"
                  >
                    открыть цикл
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
