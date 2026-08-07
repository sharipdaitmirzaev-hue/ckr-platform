import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getBetaReviewDashboard } from "@/lib/beta/review";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Beta Review — Админ" };

export const dynamic = "force-dynamic";

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default async function AdminBetaReviewPage() {
  const data = await getBetaReviewDashboard();

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Beta review"
        title="Анализ закрытой beta"
        description="Данные controlled beta → решение о Public Launch. Новые бизнес-модули не добавляются."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/beta-report" className="text-accent hover:underline">
          Beta Report
        </Link>
        <Link href="/admin/improvements" className="text-accent hover:underline">
          Улучшения
        </Link>
        <Link
          href="/lia?scenario=beta_review"
          className="text-accent hover:underline"
        >
          Лия: обзор beta
        </Link>
        <Link
          href="/lia?scenario=launch_readiness"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: что исправить перед запуском
        </Link>
        <span className="text-muted">docs/beta-review.md</span>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Пользователи</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Приглашено" value={data.users.invited} />
          <StatsCard label="Зарегистрировано" value={data.users.registered} />
          <StatsCard label="Активировано" value={data.users.activated} />
          <StatsCard
            label="Завершили сценарий"
            value={data.users.completedScenario}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Роли</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="surface" className="space-y-2 p-5">
            <h3 className="font-display text-lg text-foreground">
              Предприниматели
            </h3>
            <p className="text-sm text-muted">
              Проекты: {data.roles.entrepreneurs.projects} · активные:{" "}
              {data.roles.entrepreneurs.activeUsers} · Лия:{" "}
              {data.roles.entrepreneurs.liaUsers}
            </p>
          </Card>
          <Card variant="surface" className="space-y-2 p-5">
            <h3 className="font-display text-lg text-foreground">Инвесторы</h3>
            <p className="text-sm text-muted">
              Интересы: {data.roles.investors.interests} · заявки:{" "}
              {data.roles.investors.applications}
            </p>
          </Card>
          <Card variant="surface" className="space-y-2 p-5">
            <h3 className="font-display text-lg text-foreground">Эксперты</h3>
            <p className="text-sm text-muted">
              Профили: {data.roles.experts.profiles} · верификация:{" "}
              {data.roles.experts.verified} · запросы:{" "}
              {data.roles.experts.requests}
            </p>
          </Card>
          <Card variant="surface" className="space-y-2 p-5">
            <h3 className="font-display text-lg text-foreground">
              Организации
            </h3>
            <p className="text-sm text-muted">
              Проекты: {data.roles.organizations.projects} · партнёрства:{" "}
              {data.roles.organizations.partnerships}
            </p>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-xl text-foreground">
          Пользовательская воронка
        </h2>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-2">
          {data.funnel.map((step, index) => (
            <div key={step.key} className="flex w-full flex-col items-center">
              <Card variant="surface" className="w-full max-w-xs p-4 text-center">
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {step.label}
                </p>
                <p className="mt-2 font-display text-3xl text-foreground">
                  {step.users}
                </p>
                {step.conversionFromPrev !== null ? (
                  <p className="mt-1 text-xs text-muted">
                    конверсия {step.conversionFromPrev}%
                    {step.dropOff !== null ? ` · потеря ${step.dropOff}%` : ""}
                  </p>
                ) : null}
                {step.avgHoursFromPrev !== null ? (
                  <p className="mt-1 text-xs text-muted">
                    ср. время от прошлого шага: {step.avgHoursFromPrev} ч
                  </p>
                ) : null}
              </Card>
              {index < data.funnel.length - 1 ? (
                <span className="py-1 text-muted" aria-hidden>
                  ↓
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Использование функций
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.modules.map((mod) => (
            <Card key={mod.key} variant="surface" className="space-y-2 p-4">
              <p className="font-display text-lg text-foreground">{mod.label}</p>
              <p className="text-sm text-muted">
                Использований: {mod.uses}
              </p>
              <p className="text-sm text-muted">
                Активных пользователей: {mod.activeUsers}
              </p>
              <p className="text-sm text-foreground">
                {mod.resultLabel}: {mod.resultValue}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Product-Market Fit сигналы
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard
            label="Возвращающиеся"
            value={data.pmf.returningUsers}
          />
          <StatsCard
            label="Повторные действия"
            value={data.pmf.repeatActionUsers}
          />
          <StatsCard
            label="Дошли до результата"
            value={data.pmf.reachedResultUsers}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {data.pmf.topScenarios.map((s) => (
            <Badge key={s.label} variant="soft">
              {s.label}: {s.count}
            </Badge>
          ))}
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          {data.pmf.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl text-foreground">
              BetaReviewReport
            </h2>
            <Badge variant="accent">по данным</Badge>
          </div>
          <p className="text-sm text-muted">{data.reviewReport.summary}</p>
          <ListBlock
            title="Успешные потоки"
            items={data.reviewReport.successful_flows}
          />
          <ListBlock
            title="Заблокированные потоки"
            items={data.reviewReport.blocked_flows}
          />
          <ListBlock
            title="Мало используемые функции"
            items={data.reviewReport.unused_features}
          />
          <ListBlock
            title="Проблемы пользователей"
            items={data.reviewReport.user_problems}
          />
          <ListBlock
            title="Сигналы ценности"
            items={data.reviewReport.business_value_signals}
          />
          <ListBlock
            title="Рекомендации"
            items={data.reviewReport.recommendations}
          />
        </Card>

        <Card variant="surface" className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl text-foreground">
              LaunchReadinessReport
            </h2>
            <Badge variant="soft">только анализ</Badge>
          </div>
          <p className="text-sm text-muted">{data.launchReport.summary}</p>
          <ListBlock
            title="Critical issues"
            items={data.launchReport.critical_issues}
          />
          <ListBlock
            title="Recommended actions"
            items={data.launchReport.recommended_actions}
          />
          <ListBlock
            title="Launch risks"
            items={data.launchReport.launch_risks}
          />
          <p className="text-xs text-muted">
            План: docs/public-launch-plan.md · ТИНДА: docs/tinda-beta-review.md
          </p>
        </Card>
      </section>
    </div>
  );
}
