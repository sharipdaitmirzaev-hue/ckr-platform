import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  betaOnboardingEventLabels,
  type BetaOnboardingEvent,
} from "@/config/controlled-beta";
import { betaInviteStatusLabels, type BetaInviteStatus } from "@/config/beta";
import { roleLabels, type AssignableRole } from "@/config/roles";
import { getBetaReport } from "@/lib/beta/report";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Beta Report — Админ" };

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
    <Card variant="surface" className="w-full max-w-xs p-4 text-center">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl text-foreground">{value}</p>
      {rate !== null ? (
        <p className="mt-1 text-xs text-muted">конверсия {rate}%</p>
      ) : null}
    </Card>
  );
}

export default async function AdminBetaReportPage() {
  const data = await getBetaReport();

  const funnelSteps = [
    { label: "Регистрация", value: data.funnel.registration },
    { label: "Профиль", value: data.funnel.profile },
    { label: "Первое действие", value: data.funnel.firstAction },
    { label: "Использование Лии", value: data.funnel.lia },
    { label: "Создание объекта", value: data.funnel.objectCreated },
  ];

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Controlled beta"
        title="Beta Report"
        description="Пользователи, воронка активации и активность controlled beta. Без новых бизнес-направлений."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/pilot" className="text-accent hover:underline">
          ← Pilot Operations
        </Link>
        <Link href="/admin/invites" className="text-accent hover:underline">
          Приглашения
        </Link>
        <Link
          href="/lia?scenario=beta_analysis"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: как проходит запуск
        </Link>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Пользователи</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Приглашено" value={data.users.invited} />
          <StatsCard label="Активировано" value={data.users.activated} />
          <StatsCard label="Активно (14 дн.)" value={data.users.active} />
          <StatsCard
            label="Завершили сценарий"
            value={data.users.completed}
          />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-xl text-foreground">Воронка</h2>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-2">
          {funnelSteps.map((step, index) => (
            <div key={step.label} className="flex w-full flex-col items-center">
              <FunnelStep
                label={step.label}
                value={step.value}
                prev={index === 0 ? null : funnelSteps[index - 1].value}
              />
              {index < funnelSteps.length - 1 ? (
                <span className="py-1 text-muted" aria-hidden>
                  ↓
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Активность</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Проекты" value={data.activity.projects} />
          <StatsCard label="Заявки" value={data.activity.applications} />
          <StatsCard label="Интересы" value={data.activity.interests} />
          <StatsCard label="Сделки" value={data.activity.deals} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Онбординг-события
        </h2>
        <div className="flex flex-wrap gap-2">
          {(
            Object.entries(data.onboardingEvents) as Array<[string, number]>
          ).map(([key, count]) => (
            <Badge key={key} variant="soft">
              {betaOnboardingEventLabels[key as BetaOnboardingEvent] ?? key}:{" "}
              {count}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Сценарии ролей
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {data.scenarios.map((scenario) => (
            <Card key={scenario.role} variant="surface" className="space-y-3 p-5">
              <h3 className="font-display text-lg text-foreground">
                {scenario.title}
              </h3>
              <ol className="space-y-2 text-sm">
                {scenario.steps.map((step, index) => (
                  <li key={step.key} className="flex items-center gap-2">
                    <span className="text-muted">{index + 1}.</span>
                    <span className="text-foreground">{step.label}</span>
                    <Badge variant="soft">{step.doneCount}</Badge>
                    {index < scenario.steps.length - 1 ? (
                      <span className="ml-auto text-xs text-muted">↓</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </section>

      <Card variant="surface" className="space-y-4 p-5">
        <h2 className="font-display text-xl text-foreground">
          Участники beta
        </h2>
        {data.participants.length === 0 ? (
          <p className="text-sm text-muted">Приглашений пока нет.</p>
        ) : (
          <ul className="max-h-[36rem] space-y-2 overflow-auto text-sm">
            {data.participants.slice(0, 60).map((p) => (
              <li
                key={p.inviteId}
                className="rounded-sm border border-border px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-foreground">
                    {p.fullName || p.email}
                  </span>
                  <Badge variant="soft">
                    {roleLabels[p.role as AssignableRole] ?? p.role}
                  </Badge>
                  <Badge variant="default">
                    {betaInviteStatusLabels[
                      p.participationStatus as BetaInviteStatus
                    ] ?? p.participationStatus}
                  </Badge>
                  {p.scenarioComplete ? (
                    <Badge variant="accent">сценарий ✓</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted">
                  вход:{" "}
                  {p.activatedAt
                    ? new Date(p.activatedAt).toLocaleString("ru-RU")
                    : "—"}{" "}
                  · последнее:{" "}
                  {p.lastActionAt
                    ? `${p.lastActionType} · ${new Date(p.lastActionAt).toLocaleString("ru-RU")}`
                    : "—"}
                </p>
                {p.modules.length > 0 ? (
                  <p className="mt-1 text-xs text-muted">
                    модули: {p.modules.join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
