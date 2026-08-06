import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPilotDashboard } from "@/lib/pilot/queries";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Отчёт пилота — Админ" };

export const dynamic = "force-dynamic";

function FunnelStep({
  label,
  value,
  prev,
}: {
  label: string;
  value: number;
  prev: number | null;
}) {
  const rate =
    prev !== null && prev > 0 ? Math.round((value / prev) * 100) : null;
  return (
    <div className="relative flex flex-col items-center gap-2">
      <Card variant="surface" className="w-full max-w-xs p-4 text-center">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        <p className="mt-2 font-display text-3xl text-foreground">{value}</p>
        {rate !== null ? (
          <p className="mt-1 text-xs text-muted">конверсия {rate}%</p>
        ) : null}
      </Card>
    </div>
  );
}

export default async function AdminPilotReportPage() {
  const data = await getPilotDashboard();
  const { funnel, usage, tinda, checklistProgress, projects } = data.ops;

  const steps: Array<{ label: string; value: number }> = [
    { label: "Регистрация", value: funnel.registration },
    { label: "Профиль", value: funnel.profile },
    { label: "Проект", value: funnel.project },
    { label: "Активность", value: funnel.activity },
    { label: "Заявка", value: funnel.application },
    { label: "Сделка", value: funnel.deal },
  ];

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Pilot analytics"
        title="Отчёт закрытого пилота"
        description="Конверсия воронки и использование модулей ЦКР. Только наблюдение за уже созданной платформой."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/pilot" className="text-accent hover:underline">
          ← Pilot Operations
        </Link>
        <Link
          href="/lia?scenario=pilot_insight"
          className="text-accent hover:underline"
        >
          Лия: что мешает проекту
        </Link>
      </div>

      <section className="space-y-6">
        <h2 className="font-display text-xl text-foreground">Конверсия</h2>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-2">
          {steps.map((step, index) => (
            <div key={step.label} className="flex w-full flex-col items-center">
              <FunnelStep
                label={step.label}
                value={step.value}
                prev={index === 0 ? null : steps[index - 1].value}
              />
              {index < steps.length - 1 ? (
                <span className="py-1 text-muted" aria-hidden>
                  ↓
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Использование</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard label="Лия (сессии)" value={usage.lia} href="/lia" />
          <StatsCard
            label="Проекты"
            value={usage.projects}
            href="/admin/projects"
          />
          <StatsCard
            label="CRM — заявки"
            value={usage.crmApplications}
            href="/admin/crm"
          />
          <StatsCard label="CRM — сделки" value={usage.crmDeals} />
          <StatsCard label="Workspace (события)" value={usage.workspace} />
          <StatsCard label="Сообщения" value={usage.messages} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card variant="surface" className="space-y-3 p-5">
          <h2 className="font-display text-lg text-foreground">
            Состояние проектов
          </h2>
          <p className="text-sm text-muted">
            Создано {projects.created}, активных {projects.active}, без
            активности {projects.inactive}.
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(projects.byStage).map(([stage, count]) => (
              <Badge key={stage} variant="soft">
                {stage}: {count}
              </Badge>
            ))}
          </div>
        </Card>

        <Card variant="surface" className="space-y-3 p-5">
          <h2 className="font-display text-lg text-foreground">
            Чеклист и ТИНДА
          </h2>
          <p className="text-sm text-muted">
            Чеклист: {checklistProgress.done}/{checklistProgress.total} (
            {checklistProgress.percent}%).
          </p>
          {tinda ? (
            <p className="text-sm text-foreground">
              {tinda.title} · {tinda.status} · этап {tinda.stage}
            </p>
          ) : (
            <p className="text-sm text-muted">ТИНДА ещё не в данных.</p>
          )}
          <Link
            href="/admin/results"
            className="inline-block text-sm text-accent hover:underline"
          >
            Смотреть результаты ЦКР →
          </Link>
        </Card>
      </section>
    </div>
  );
}
