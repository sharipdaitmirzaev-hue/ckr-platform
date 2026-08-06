import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  launchAnalyticsEventLabels,
  launchCheckStatusLabels,
  type LaunchAnalyticsEvent,
  type LaunchCheckItem,
  type LaunchCheckStatus,
} from "@/config/launch";
import {
  launchGoalStatusLabels,
  type LaunchGoalStatus,
} from "@/config/launch-goals";
import {
  launchWaveParticipantStatusLabels,
  launchWaveStatusLabels,
  launchWaveTypeLabels,
  type LaunchWaveParticipantStatus,
  type LaunchWaveStatus,
  type LaunchWaveType,
} from "@/config/launch-waves";
import { AddWaveParticipantForm } from "@/features/launch/components/add-wave-participant-form";
import { CreateLaunchGoalForm } from "@/features/launch/components/create-launch-goal-form";
import { CreateLaunchWaveForm } from "@/features/launch/components/create-launch-wave-form";
import { LaunchGoalStatusForm } from "@/features/launch/components/launch-goal-status-form";
import { LaunchWaveStatusForm } from "@/features/launch/components/launch-wave-status-form";
import { WaveParticipantStatusForm } from "@/features/launch/components/wave-participant-status-form";
import { getLaunchChecklist } from "@/lib/launch/checklist";
import { getLaunchGoalsBundle } from "@/lib/launch/goals";
import { getLaunchWaveDashboard } from "@/lib/launch/waves";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Launch — Админ" };

export const dynamic = "force-dynamic";

function tone(status: LaunchCheckStatus) {
  if (status === "ready") return "success" as const;
  if (status === "blocked") return "danger" as const;
  if (status === "attention") return "warning" as const;
  return "neutral" as const;
}

function CheckList({ title, items }: { title: string; items: LaunchCheckItem[] }) {
  return (
    <Card variant="surface" className="space-y-3 p-5">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-sm border border-border px-3 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                label={launchCheckStatusLabels[item.status]}
                tone={tone(item.status)}
              />
              <span className="font-medium text-foreground">{item.label}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{item.detail}</p>
            {item.href ? (
              <Link
                href={item.href}
                className="mt-2 inline-block text-sm text-accent hover:underline"
              >
                Открыть →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default async function AdminLaunchPage() {
  const current = await getCurrentUser();
  const [data, waves] = await Promise.all([
    getLaunchChecklist(),
    getLaunchWaveDashboard(),
  ]);
  const goalsBundle = await getLaunchGoalsBundle(
    waves.currentWave,
    current?.user.id ?? null,
  );

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Closed Wave 1 — ТИНДА"
        title="Launch Dashboard"
        description="Контроль первой закрытой волны: статус, цели, прогресс и проблемы. Используются существующие модули ЦКР."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/wave-review" className="text-accent hover:underline">
          Wave Review
        </Link>
        <Link
          href="/admin/launch-decision"
          className="text-accent hover:underline"
        >
          Decision Gate
        </Link>
        <Link
          href="/admin/improvements"
          className="text-accent hover:underline"
        >
          Улучшения
        </Link>
        <Link
          href="/lia?scenario=closed_wave"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: первая волна
        </Link>
        <Link
          href="/lia?scenario=launch_goals"
          className="text-accent hover:underline"
        >
          Лия: цели запуска
        </Link>
        <span className="text-muted">docs/closed-wave-tinda-report.md</span>
      </div>

      {/* Текущая волна */}
      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            Текущая волна
          </h2>
          {waves.currentWave ? (
            <>
              <Badge variant="accent">
                {launchWaveTypeLabels[waves.currentWave.wave_type as LaunchWaveType]}
              </Badge>
              <Badge variant="soft">
                {launchWaveStatusLabels[waves.currentWave.status as LaunchWaveStatus]}
              </Badge>
            </>
          ) : (
            <Badge variant="default">нет active</Badge>
          )}
        </div>
        {waves.currentWave ? (
          <>
            <p className="font-medium text-foreground">
              {waves.currentWave.name}
            </p>
            <p className="text-sm text-muted">
              {waves.currentWave.description}
            </p>
            <p className="text-xs text-muted">
              {waves.currentWave.start_date ?? "без даты старта"}
              {waves.currentWave.end_date
                ? ` → ${waves.currentWave.end_date}`
                : " · открыта"}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            Активируйте волну ниже (одна active одновременно).
          </p>
        )}
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Активация"
          value={`${waves.activation.rate}%`}
        />
        <StatsCard
          label="Участники (joined+)"
          value={waves.activation.joinedOrActive}
        />
        <StatsCard
          label="Активность 7д (users)"
          value={waves.activity.activeUsers7d}
        />
        <StatsCard label="Проблемы open" value={waves.problems.length} />
      </section>

      {/* LaunchMetrics */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">LaunchMetrics</h2>
        <p className="text-sm text-muted">{goalsBundle.metrics.period_label}</p>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card variant="surface" className="space-y-3 p-5">
            <h3 className="font-display text-lg text-foreground">Пользователи</h3>
            <div className="grid grid-cols-3 gap-2">
              <StatsCard
                label="Приглашено"
                value={goalsBundle.metrics.users.invited}
              />
              <StatsCard
                label="Зарегистрировано"
                value={goalsBundle.metrics.users.registered}
              />
              <StatsCard
                label="Активно"
                value={goalsBundle.metrics.users.active}
              />
            </div>
          </Card>
          <Card variant="surface" className="space-y-3 p-5">
            <h3 className="font-display text-lg text-foreground">Активация</h3>
            <div className="grid grid-cols-3 gap-2">
              <StatsCard
                label="Профиль"
                value={goalsBundle.metrics.activation.profile_completed}
              />
              <StatsCard
                label="Первое действие"
                value={goalsBundle.metrics.activation.first_action}
              />
              <StatsCard
                label="Лия"
                value={goalsBundle.metrics.activation.lia_used}
              />
            </div>
          </Card>
          <Card variant="surface" className="space-y-3 p-5">
            <h3 className="font-display text-lg text-foreground">Бизнес</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatsCard
                label="Проекты"
                value={goalsBundle.metrics.business.projects}
              />
              <StatsCard
                label="Заявки"
                value={goalsBundle.metrics.business.applications}
              />
              <StatsCard
                label="Сделки"
                value={goalsBundle.metrics.business.deals}
              />
              <StatsCard
                label="Результаты"
                value={goalsBundle.metrics.business.results}
              />
            </div>
          </Card>
        </div>
      </section>

      {/* Цели волны */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-foreground">
              Цели волны
            </h2>
            <p className="text-sm text-muted">
              Прогресс {goalsBundle.summary.overallProgress}% · достигнуто{" "}
              {goalsBundle.summary.achieved} · в работе{" "}
              {goalsBundle.summary.active} · failed {goalsBundle.summary.failed}
            </p>
          </div>
          <ProgressBar
            value={goalsBundle.summary.overallProgress}
            className="w-full max-w-xs"
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card variant="surface" className="space-y-4 p-5 lg:col-span-2">
            {goalsBundle.goals.length === 0 ? (
              <p className="text-sm text-muted">
                У активной волны пока нет целей. Добавьте цель или примените
                миграцию launch_goals.
              </p>
            ) : (
              <ul className="space-y-4">
                {goalsBundle.goals.map((goal) => (
                  <li
                    key={goal.id}
                    className="rounded-sm border border-border px-3 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {goal.title}
                        </p>
                        <p className="text-xs text-muted">
                          {goal.metricLabel} · {goal.current_value} /{" "}
                          {goal.target_value}
                        </p>
                        {goal.description ? (
                          <p className="mt-1 text-sm text-muted">
                            {goal.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="soft">
                          {
                            launchGoalStatusLabels[
                              goal.status as LaunchGoalStatus
                            ]
                          }
                        </Badge>
                        <LaunchGoalStatusForm
                          id={goal.id}
                          status={goal.status as LaunchGoalStatus}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={goal.progress} showLabel />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card variant="surface" className="p-5">
            {waves.currentWave ? (
              <CreateLaunchGoalForm
                waveId={waves.currentWave.id}
                waveName={waves.currentWave.name}
              />
            ) : (
              <p className="text-sm text-muted">
                Активируйте волну, чтобы добавлять цели.
              </p>
            )}
          </Card>
        </div>
      </section>

      {/* LaunchReport */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">LaunchReport</h2>
        <p className="text-sm text-muted">{waves.report.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatsCard label="Новые пользователи" value={waves.report.new_users} />
          <StatsCard
            label="Онбординг завершён"
            value={waves.report.onboarding_completed}
          />
          <StatsCard
            label="Создание проектов"
            value={waves.report.projects_created}
          />
          <StatsCard label="Использование Лии" value={waves.report.lia_used} />
          <StatsCard label="Заявки" value={waves.report.applications} />
          <StatsCard label="Сделки" value={waves.report.deals} />
        </div>
      </section>

      {/* Волны + формы */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">Все волны</h2>
          {waves.waves.length === 0 ? (
            <p className="text-sm text-muted">
              Волн нет — примените миграцию wave_launch или создайте вручную.
            </p>
          ) : (
            <ul className="space-y-3">
              {waves.waves.map((wave) => (
                <li
                  key={wave.id}
                  className="rounded-sm border border-border px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{wave.name}</p>
                      <p className="text-xs text-muted">
                        {launchWaveTypeLabels[wave.wave_type as LaunchWaveType]} ·{" "}
                        {wave.start_date ?? "—"}
                      </p>
                    </div>
                    <LaunchWaveStatusForm
                      id={wave.id}
                      status={wave.status as LaunchWaveStatus}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card variant="surface" className="p-5">
          <CreateLaunchWaveForm />
        </Card>
      </section>

      {/* Участники */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card variant="surface" className="space-y-4 p-5 lg:col-span-2">
          <h2 className="font-display text-xl text-foreground">Участники</h2>
          <div className="flex flex-wrap gap-2 text-xs text-muted">
            {(
              Object.entries(waves.participantCounts) as Array<
                [LaunchWaveParticipantStatus, number]
              >
            ).map(([status, count]) => (
              <span
                key={status}
                className="rounded-sm border border-border px-2 py-1"
              >
                {launchWaveParticipantStatusLabels[status]}: {count}
              </span>
            ))}
          </div>
          {waves.participants.length === 0 ? (
            <p className="text-sm text-muted">
              В текущей волне пока нет участников.
            </p>
          ) : (
            <ul className="space-y-2">
              {waves.participants.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {p.full_name || p.user_id || "без user_id"}
                    </p>
                    {p.notes ? (
                      <p className="text-xs text-muted">{p.notes}</p>
                    ) : null}
                  </div>
                  <WaveParticipantStatusForm
                    id={p.id}
                    status={p.status as LaunchWaveParticipantStatus}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card variant="surface" className="p-5">
          {waves.currentWave ? (
            <AddWaveParticipantForm
              waveId={waves.currentWave.id}
              waveName={waves.currentWave.name}
            />
          ) : (
            <p className="text-sm text-muted">
              Сначала активируйте волну, чтобы добавлять участников.
            </p>
          )}
        </Card>
      </section>

      {/* Проблемы и результаты */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card variant="surface" className="space-y-3 p-5">
          <h2 className="font-display text-xl text-foreground">Проблемы</h2>
          {waves.problems.length === 0 ? (
            <p className="text-sm text-muted">Нет open critical/high.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {waves.problems.map((p) => (
                <li key={`${p.source}-${p.id}`} className="text-foreground">
                  <span className="text-xs uppercase text-muted">
                    {p.severity}
                  </span>{" "}
                  {p.title}
                  <span className="mt-0.5 block text-xs text-muted">
                    {p.source}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card variant="surface" className="space-y-3 p-5">
          <h2 className="font-display text-xl text-foreground">Результаты</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatsCard label="Проекты" value={waves.results.projects} />
            <StatsCard label="Заявки" value={waves.results.applications} />
            <StatsCard label="Сделки" value={waves.results.deals} />
            <StatsCard
              label="Завершили волну"
              value={waves.results.completedParticipants}
            />
          </div>
        </Card>
      </section>

      {/* ТИНДА production pilot */}
      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            ТИНДА — production pilot case
          </h2>
          <Badge variant="accent">{waves.tinda.status}</Badge>
        </div>
        <p className="text-sm text-muted">
          {waves.tinda.organization} · {waves.tinda.projectTitle}
        </p>
        <p className="text-sm text-foreground">
          Активная волна:{" "}
          {waves.tinda.waveName ?? "—"}
          {waves.tinda.waveStatus
            ? ` (${launchWaveStatusLabels[waves.tinda.waveStatus]})`
            : ""}
        </p>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Пользователи: команда ТИНДА
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          <StatsCard
            label="Контакты клиентов"
            value={goalsBundle.metrics.tinda.client_contacts}
          />
          <StatsCard
            label="Переговоры"
            value={goalsBundle.metrics.tinda.negotiations}
          />
          <StatsCard
            label="Партнёры"
            value={goalsBundle.metrics.tinda.partners}
          />
          <StatsCard label="Сделки" value={goalsBundle.metrics.tinda.deals} />
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
          {waves.tinda.results.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <span className="text-sm text-muted">
          docs/tinda-production-case.md · цели closed wave
        </span>
      </Card>

      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            Отчёт готовности (чеклист)
          </h2>
          <Badge
            variant={
              data.readiness.verdict === "ready"
                ? "accent"
                : data.readiness.verdict === "blocked"
                  ? "default"
                  : "soft"
            }
          >
            {data.readiness.verdict}
          </Badge>
          <Badge variant="soft">{data.readiness.score}%</Badge>
        </div>
        <p className="text-sm text-muted">{data.readiness.summary}</p>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <CheckList title="Product" items={data.product} />
        <CheckList title="Users" items={data.users} />
        <CheckList title="Technical" items={data.technical} />
        <CheckList title="Business" items={data.business} />
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Закрытие beta issues
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card variant="surface" className="space-y-3 p-5">
            <h3 className="font-display text-lg text-foreground">Исправлено</h3>
            {data.issues.fixed.length === 0 ? (
              <p className="text-sm text-muted">Пока нет released/resolved.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.issues.fixed.map((item) => (
                  <li key={item.id} className="text-foreground">
                    {item.title}
                    <span className="mt-0.5 block text-xs text-muted">
                      {item.source}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card variant="surface" className="space-y-3 p-5">
            <h3 className="font-display text-lg text-foreground">
              Запланировано
            </h3>
            {data.issues.planned.length === 0 ? (
              <p className="text-sm text-muted">Очередь пуста.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.issues.planned.map((item) => (
                  <li
                    key={`${item.source}-${item.id}`}
                    className="text-foreground"
                  >
                    {item.title}
                    <span className="mt-0.5 block text-xs text-muted">
                      {item.source}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card variant="surface" className="space-y-3 p-5">
            <h3 className="font-display text-lg text-foreground">Отклонено</h3>
            {data.issues.rejected.length === 0 ? (
              <p className="text-sm text-muted">Нет rejected.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.issues.rejected.map((item) => (
                  <li key={item.id} className="text-foreground">
                    {item.title}
                    <span className="mt-0.5 block text-xs text-muted">
                      {item.source}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Launch Analytics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {(
            Object.entries(data.analytics) as Array<
              [LaunchAnalyticsEvent, number]
            >
          ).map(([key, value]) => (
            <StatsCard
              key={key}
              label={launchAnalyticsEventLabels[key] ?? key}
              value={value}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
