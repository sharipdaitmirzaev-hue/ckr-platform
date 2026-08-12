import { StatsCard } from "@/components/admin/stats-card";
import { MetricCard } from "@/components/analytics/metric-card";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { LiaTodayWidget } from "@/components/lia/oi/today-widget";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  ensureLiaOiSeed,
  getRecommendedCandidates,
  getTodayStats,
} from "@/lib/lia/oi/pipeline";
import { getOwnerDashboard } from "@/lib/owner/dashboard";
import { getInboxStats } from "@/lib/ckr-inbox/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Кабинет владельца" };

function formatWhen(iso: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function OwnerCabinetPage() {
  const current = await requireAdmin();
  await ensureLiaOiSeed(current.user.id);
  const [data, oiStats, oiRecommended, inbox] = await Promise.all([
    getOwnerDashboard(),
    Promise.resolve(getTodayStats()),
    Promise.resolve(getRecommendedCandidates(3)),
    getInboxStats().catch(() => ({
      newCount: 0,
      inProgress: 0,
      waiting: 0,
      done: 0,
      recent: [],
    })),
  ]);

  const demandChart = [
    {
      label: "Проекты",
      value: data.market.demand.applicationsToProjects,
    },
    {
      label: "Возможности",
      value: data.market.demand.applicationsToOpportunities,
    },
    {
      label: "Инвестиции",
      value: data.market.demand.applicationsToInvestments,
    },
  ];

  const liaChart = [
    { label: "Сессии", value: data.lia.sessionsTotal },
    { label: "За 7 дней", value: data.lia.sessionsLast7d },
    { label: "Сообщения", value: data.lia.messagesTotal },
    { label: "Анализы", value: data.lia.analysesTotal },
    { label: "lia_started", value: data.lia.eventsStarted },
    { label: "lia_used", value: data.lia.eventsUsed },
  ];

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Владелец платформы"
        title="Кабинет владельца"
        description="Актуальная картина ЦКР: пользователи, заявки, предложения, CRM, очередь операций и мониторинг Лии."
      />

      <p className="text-xs text-muted">
        Версия {data.version.version} · канал {data.version.channel} · обновлено{" "}
        {formatWhen(data.generatedAt)}
      </p>

      <LiaTodayWidget stats={oiStats} recommended={oiRecommended} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-xl text-foreground">Заявки</h3>
          <Link
            href="/admin/owner/inbox"
            className="text-sm text-accent hover:underline"
          >
            Открыть inbox
            {inbox.newCount > 0 ? ` · ${inbox.newCount} новых` : ""}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <StatsCard label="Новые" value={inbox.newCount} />
          <StatsCard label="В работе" value={inbox.inProgress} />
          <StatsCard label="Ждём клиента" value={inbox.waiting} />
          <StatsCard label="Завершённые" value={inbox.done} />
        </div>
        <ul className="space-y-2 text-sm">
          {inbox.recent.slice(0, 5).map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/owner/inbox/${r.id}`}
                className="text-accent hover:underline"
              >
                {r.subject || "Без темы"}
              </Link>{" "}
              <span className="text-muted">· {r.status}</span>
            </li>
          ))}
          {!inbox.recent.length ? (
            <li className="text-muted">Пока нет обращений в inbox.</li>
          ) : null}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-display text-xl text-foreground">Feed v1</h3>
        <p className="text-sm text-muted">
          Диагностика персональной ленты «Для вас» (без Matching Engine).
        </p>
        <Link
          href="/admin/owner/feed"
          className="text-sm text-accent hover:underline"
        >
          Открыть диагностику Feed →
        </Link>
      </section>

      <section className="space-y-2">
        <h3 className="font-display text-xl text-foreground">
          Controlled Publish
        </h3>
        <p className="text-sm text-muted">
          Очередь «К публикации»: LIA OI → owner review → user-safe marketplace
          opportunity. Без автоматической публикации.
        </p>
        <Link
          href="/admin/owner/publishing"
          className="text-sm text-accent hover:underline"
        >
          Открыть очередь публикации →
        </Link>
        <p className="mt-2 text-sm">
          <Link href="/admin/owner/regional" className="text-accent hover:underline">
            Региональное покрытие (Дагестан / СКФО)
          </Link>
          {" · "}
          <Link href="/admin/owner/content-gap" className="text-accent hover:underline">
            Content Gap
          </Link>
          {" · "}
          <Link href="/admin/owner/companies" className="text-accent hover:underline">
            Companies
          </Link>
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-xl text-foreground">Платформа сейчас</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Пользователи"
            value={data.platform.users}
            href="/admin/users"
            hint={`+${data.period.users.newInPeriod} за 30 дней`}
          />
          <StatsCard
            label="Активные за 30 дней"
            value={data.period.users.activeInPeriod}
            href="/admin/analytics"
            hint="По событиям аналитики"
          />
          <StatsCard
            label="Проекты"
            value={data.platform.projects}
            href="/admin/projects"
            hint={`Опубликовано: ${data.period.projects.published}`}
          />
          <StatsCard
            label="Заявки"
            value={data.platform.applications}
            href="/dashboard/applications"
            hint={`Без ответа: ${data.operations.unansweredApplications}`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-xl text-foreground">
          Предложения и каталог
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Возможности"
            value={data.platform.opportunities}
            href="/admin/opportunities"
            hint={`Опубликовано: ${data.market.supply.opportunitiesPublished}`}
          />
          <StatsCard
            label="Инвестиционные предложения"
            value={data.platform.investments}
            href="/admin/investments"
            hint={`Опубликовано: ${data.market.supply.investmentsPublished}`}
          />
          <StatsCard
            label="Сделки активные"
            value={data.period.deals.active}
            href="/admin/results"
            hint={`Завершено: ${data.period.deals.completed}`}
          />
          <StatsCard
            label="Эксперты"
            value={data.period.experts.count}
            href="/admin/experts"
            hint="Профили в аналитике"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-display text-xl text-foreground">
            Заявки по направлению
          </h3>
          <Link
            href="/admin/analytics"
            className="text-sm text-accent hover:underline"
          >
            Открыть аналитику
          </Link>
        </div>
        <AnalyticsChart
          title="Спрос: заявки по типам объектов"
          items={demandChart}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-display text-xl text-foreground">CRM и операции</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/admin/crm" className="text-accent hover:underline">
              CRM
            </Link>
            <Link href="/operator" className="text-accent hover:underline">
              Операционный центр
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="CRM-контакты" value={data.crm.contacts} />
          <MetricCard label="Открытые лиды" value={data.crm.leadsOpen} />
          <MetricCard label="CRM-задачи" value={data.crm.tasksOpen} />
          <MetricCard
            label="Новые проекты в очереди"
            value={data.operations.newProjects}
          />
          <MetricCard
            label="Заявки без ответа"
            value={data.operations.unansweredApplications}
          />
          <MetricCard
            label="Сделки в ожидании"
            value={data.operations.pendingDeals}
          />
          <MetricCard
            label="Документы на проверке"
            value={data.operations.documentsPending}
          />
          <MetricCard
            label="Открытые операторские задачи"
            value={data.operations.openTasks}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-display text-xl text-foreground">
            Мониторинг Лии
          </h3>
          <Link href="/lia" className="text-sm text-accent hover:underline">
            Открыть Лию
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Диалоги"
            value={data.lia.sessionsTotal}
            hint={`За 7 дней: ${data.lia.sessionsLast7d}`}
          />
          <StatsCard
            label="Сообщения"
            value={data.lia.messagesTotal}
            hint="Все реплики пользователей и Лии"
          />
          <StatsCard
            label="Анализы"
            value={data.lia.analysesTotal}
            hint="Сохранённые отчёты Лии"
          />
          <StatsCard
            label="События использования"
            value={data.lia.eventsUsed}
            hint={`Старт диалогов: ${data.lia.eventsStarted}`}
          />
        </div>
        <AnalyticsChart
          title="Лия: сессии, сообщения, анализы и события"
          items={liaChart}
        />
        <div className="rounded-sm border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            Последние диалоги
          </p>
          {data.lia.recentSessions.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Пока нет сессий Лии.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {data.lia.recentSessions.map((session) => (
                <li
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <span className="text-foreground">{session.title}</span>
                  <span className="text-xs text-muted">
                    {formatWhen(session.updatedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-display text-xl text-foreground">
            Требует внимания
          </h3>
          <Link
            href="/admin/improvements"
            className="text-sm text-accent hover:underline"
          >
            Улучшения и feedback
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Открытые проблемы"
            value={data.product.openProblems}
          />
          <MetricCard label="Feedback" value={data.product.feedback} />
          <MetricCard
            label="Улучшения в работе"
            value={data.product.improvements}
          />
        </div>
        <div className="rounded-sm border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            Очередь операций
          </p>
          {data.queue.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Очередь пуста — всё обработано.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {data.queue.map((item) => (
                <li key={item.id} className="py-2.5">
                  <Link
                    href={item.href}
                    className="flex flex-wrap items-start justify-between gap-2 text-sm transition-colors hover:text-accent"
                  >
                    <span>
                      <span className="block text-foreground">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {item.subtitle}
                      </span>
                    </span>
                    {item.overdue ? (
                      <span className="text-xs font-medium text-accent">
                        Просрочено
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-xl text-foreground">Быстрые переходы</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/admin/owner/lia" className="text-accent hover:underline">
            Лия — Центр возможностей
          </Link>
          <Link href="/admin/owner/graph" className="text-accent hover:underline">
            Business Graph
          </Link>
          <Link href="/admin/project-acquisition" className="text-accent hover:underline">
            Привлечение проектов
          </Link>
          <Link href="/admin/growth" className="text-accent hover:underline">
            Рост
          </Link>
          <Link href="/admin/public-launch-operations" className="text-accent hover:underline">
            Launch Operations
          </Link>
          <Link href="/admin/verifications" className="text-accent hover:underline">
            Проверки
          </Link>
          <Link href="/admin/dashboard" className="text-accent hover:underline">
            Классический обзор
          </Link>
        </div>
      </section>
    </div>
  );
}
