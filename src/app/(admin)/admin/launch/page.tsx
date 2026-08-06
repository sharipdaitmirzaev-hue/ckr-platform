import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  launchAnalyticsEventLabels,
  launchCheckStatusLabels,
  type LaunchAnalyticsEvent,
  type LaunchCheckItem,
  type LaunchCheckStatus,
} from "@/config/launch";
import { getLaunchChecklist } from "@/lib/launch/checklist";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Launch Checklist — Админ" };

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
  const data = await getLaunchChecklist();

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Public launch"
        title="Launch Checklist"
        description="Подготовка к Public Launch после Conditional Go. Без новых бизнес-модулей — закрытие замечаний и качество."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/beta-review" className="text-accent hover:underline">
          Beta Review
        </Link>
        <Link
          href="/admin/improvements"
          className="text-accent hover:underline"
        >
          Улучшения
        </Link>
        <Link
          href="/lia?scenario=launch_guide"
          className="text-accent hover:underline"
        >
          Лия: как начать
        </Link>
        <Link
          href="/lia?scenario=launch_readiness"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: готовность к запуску
        </Link>
        <span className="text-muted">docs/public-launch-checklist.md</span>
      </div>

      <Card variant="surface" className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            Отчёт готовности
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
        <p className="text-sm text-muted">
          Интеграция product_improvements · pilot_issues · feedback
        </p>
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
                  <li key={`${item.source}-${item.id}`} className="text-foreground">
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
            Object.entries(data.analytics) as Array<[LaunchAnalyticsEvent, number]>
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
