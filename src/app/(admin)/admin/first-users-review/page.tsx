import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  FIRST_USERS_DECISIONS,
  ISSUE_PRIORITY_ORDER,
  firstUsersDecisionLabels,
  type FirstUsersDecision,
  type IssuePriorityBucket,
} from "@/config/first-users-review";
import { getFirstUsersReviewDashboard } from "@/lib/launch/first-users-review";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "First Users Review — Админ" };

export const dynamic = "force-dynamic";

function decisionTone(decision: FirstUsersDecision) {
  if (decision === "prepare_public") return "success" as const;
  if (decision === "expand_beta") return "accent" as const;
  return "warning" as const;
}

function priorityTone(priority: IssuePriorityBucket) {
  if (priority === "critical") return "danger" as const;
  if (priority === "high") return "warning" as const;
  if (priority === "low") return "neutral" as const;
  return "accent" as const;
}

export default async function AdminFirstUsersReviewPage() {
  const data = await getFirstUsersReviewDashboard();
  const { funnel, roles, liaReport, productIssues, reviewReport, decision, tinda } =
    data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="First Users Review"
        title="Анализ первого запуска"
        description="Поведение, активация, проблемы и решение по следующей волне на данных First Users Wave. Без новых бизнес-модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/first-users" className="text-accent hover:underline">
          First Users
        </Link>
        <Link href="/admin/improvements" className="text-accent hover:underline">
          Улучшения
        </Link>
        <Link href="/admin/invites" className="text-accent hover:underline">
          Приглашения
        </Link>
        <Link
          href="/lia?scenario=first_users_review"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: что показал первый запуск?
        </Link>
        <span className="text-muted">docs/first-users-review.md</span>
      </div>

      <Card variant="surface" className="space-y-2 p-5">
        <h2 className="font-display text-xl text-foreground">{data.waveName}</h2>
        <p className="text-sm text-muted">
          Решение принимается по реальным метрикам когорты, feedback и
          pilot_issues — не по демо-данным.
        </p>
      </Card>

      {/* Воронка */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Воронка пользователей
        </h2>
        <p className="text-sm text-muted">
          Приглашено → Регистрация → Роль → Профиль → Первое действие → Лия →
          Создание объекта
        </p>
        <div className="grid gap-3 lg:grid-cols-7 sm:grid-cols-2">
          {funnel.map((step) => (
            <Card key={step.key} variant="surface" className="space-y-2 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-muted">
                {step.label}
              </p>
              <p className="font-display text-2xl text-foreground">
                {step.count}
              </p>
              {step.conversionFromPrevPct != null ? (
                <p className="text-xs text-muted">
                  переход {step.conversionFromPrevPct}%
                  {step.dropOffCount != null && step.dropOffCount > 0
                    ? ` · −${step.dropOffCount}`
                    : ""}
                </p>
              ) : (
                <p className="text-xs text-muted">старт воронки</p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Роли */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Анализ ролей</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {roles.map((role) => (
            <Card key={role.key} variant="surface" className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg text-foreground">
                  {role.label}
                </h3>
                <Badge variant="soft">reg {role.registered}</Badge>
              </div>
              <ul className="space-y-1 text-sm text-foreground">
                {role.metrics.map((m) => (
                  <li key={m.label} className="flex justify-between gap-3">
                    <span className="text-muted">{m.label}</span>
                    <span>{m.value}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">
                Проверяем: {role.checks.join(" · ")}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Лия */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          FirstUsersLiaReport
        </h2>
        <Card variant="surface" className="space-y-4 p-5">
          <p className="text-sm text-muted">{liaReport.summary}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["Сценарии", liaReport.used_scenarios],
                ["Успешные потоки", liaReport.successful_flows],
                ["Проблемные места", liaReport.blocked_flows],
                ["Рекомендации", liaReport.recommendations],
              ] as const
            ).map(([title, items]) => (
              <div key={title}>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {title}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Product Issues */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Product Issues Review
        </h2>
        <p className="text-sm text-muted">
          feedback → pilot_issues → product_improvements
        </p>
        <div className="grid gap-4 sm:grid-cols-4">
          {ISSUE_PRIORITY_ORDER.map((priority) => (
            <StatsCard
              key={priority}
              label={priority}
              value={productIssues[priority].length}
            />
          ))}
        </div>
        {ISSUE_PRIORITY_ORDER.map((priority) => {
          const items = productIssues[priority];
          if (items.length === 0) return null;
          return (
            <Card key={priority} variant="surface" className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg text-foreground">
                  {priority}
                </h3>
                <StatusBadge
                  label={String(items.length)}
                  tone={priorityTone(priority)}
                />
              </div>
              <ul className="space-y-3">
                {items.slice(0, 8).map((item) => (
                  <li
                    key={item.id}
                    className="rounded-sm border border-border px-3 py-3 text-sm"
                  >
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 text-muted">
                      Пользователей: {item.usersAffected} · Источник:{" "}
                      {item.source} · {item.status}
                    </p>
                    <p className="mt-1 text-muted">Влияние: {item.impact}</p>
                    <p className="mt-1 text-muted">Решение: {item.resolution}</p>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </section>

      {/* ТИНДА */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Кейс ТИНДА и первые пользователи
        </h2>
        <Card variant="surface" className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{tinda.caseTitle}</p>
            <Link href={tinda.caseHref} className="text-sm text-accent hover:underline">
              /cases
            </Link>
          </div>
          <p className="text-sm text-muted">
            <span className="text-foreground">Понятность: </span>
            {tinda.descriptionClear}
          </p>
          <p className="text-sm text-muted">
            <span className="text-foreground">Интерес: </span>
            {tinda.interestSignal}
          </p>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted">
              Вопросы
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
              {tinda.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            {tinda.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </Card>
      </section>

      {/* Decision */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          FirstUsersDecision
        </h2>
        <Card variant="surface" className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={firstUsersDecisionLabels[decision.decision]}
              tone={decisionTone(decision.decision)}
            />
            <Badge variant="soft">готовность {decision.readiness}%</Badge>
          </div>
          <ProgressBar value={decision.readiness} />
          <p className="text-sm text-muted">{decision.hint}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Готовность продукта
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                {decision.productReadiness.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Риски
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                {decision.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Необходимые улучшения
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                {decision.requiredImprovements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {FIRST_USERS_DECISIONS.map((item) => (
              <Badge
                key={item}
                variant={item === decision.decision ? "accent" : "soft"}
              >
                {firstUsersDecisionLabels[item]}
              </Badge>
            ))}
          </div>
        </Card>
      </section>

      {/* Review report */}
      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            FirstUsersReviewReport
          </h2>
          <Badge variant="soft">только анализ</Badge>
        </div>
        <p className="text-sm text-muted">{reviewReport.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Активация", reviewReport.activation],
              ["Поведение", reviewReport.user_behavior],
              ["Успехи", reviewReport.successful_cases],
              ["Проблемы", reviewReport.main_problems],
              ["Рекомендации", reviewReport.recommendations],
            ] as const
          ).map(([title, items]) => (
            <div key={title}>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                {title}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
