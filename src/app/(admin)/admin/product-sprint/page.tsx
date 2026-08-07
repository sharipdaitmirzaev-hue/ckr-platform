import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard } from "@/components/analytics/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  PRODUCT_IMPROVEMENT_PRIORITIES,
  productImprovementPriorityLabels,
  type ProductImprovementPriority,
} from "@/config/improvements";
import {
  mapSprintUiToDbStatus,
  sprintUiStatusLabels,
  type SprintUiStatus,
} from "@/config/product-fix-sprint";
import { ImprovementStatusForm } from "@/features/improvements/components/improvement-status-form";
import { getProductSprintDashboard } from "@/lib/product/fix-sprint";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Product Fix Sprint — Админ" };

export const dynamic = "force-dynamic";

function statusTone(status: SprintUiStatus) {
  if (status === "completed") return "success" as const;
  if (status === "in_progress") return "accent" as const;
  if (status === "rejected") return "danger" as const;
  return "warning" as const;
}

function priorityTone(priority: ProductImprovementPriority) {
  if (priority === "critical") return "danger" as const;
  if (priority === "high") return "warning" as const;
  if (priority === "low") return "neutral" as const;
  return "accent" as const;
}

export default async function AdminProductSprintPage() {
  const data = await getProductSprintDashboard();
  const { report, postFixReport, activation, issuesByPriority, rankedByImpact } =
    data;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Product Fix Sprint"
        title="Исправления по First Users Review"
        description="Critical/High проблемы первой когорты: активация, первый опыт, Лия и UX. Без новых бизнес-модулей."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/first-users-review"
          className="text-accent hover:underline"
        >
          First Users Review
        </Link>
        <Link href="/admin/beta-expansion" className="text-accent hover:underline">
          Beta Expansion
        </Link>
        <Link href="/admin/improvements" className="text-accent hover:underline">
          Улучшения
        </Link>
        <Link
          href="/lia?scenario=product_fix_review"
          className="rounded-sm border border-accent/40 bg-accent-muted/40 px-3 py-1.5 text-accent hover:bg-accent-muted"
        >
          Лия: что улучшилось после исправлений?
        </Link>
        <span className="text-muted">docs/product-fix-sprint.md</span>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-foreground">
          Первый путь (проверка)
        </h2>
        <p className="text-sm text-muted">{data.firstPath.join(" → ")}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.values(data.rolePaths).map((role) => (
            <Card key={role.label} variant="surface" className="space-y-2 p-4">
              <p className="font-medium text-foreground">{role.label}</p>
              <p className="text-xs uppercase tracking-[0.12em] text-accent">
                {role.path.join(" → ")}
              </p>
              <p className="text-sm text-muted">{role.hint}</p>
              <Link href={role.href} className="text-sm text-accent hover:underline">
                Открыть →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">Проблемы</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {PRODUCT_IMPROVEMENT_PRIORITIES.map((priority) => (
            <StatsCard
              key={priority}
              label={productImprovementPriorityLabels[priority]}
              value={issuesByPriority[priority].length}
            />
          ))}
        </div>

        {PRODUCT_IMPROVEMENT_PRIORITIES.map((priority) => {
          const items = issuesByPriority[priority];
          if (items.length === 0) return null;
          return (
            <Card key={priority} variant="surface" className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg text-foreground">
                  {productImprovementPriorityLabels[priority]}
                </h3>
                <StatusBadge
                  label={String(items.length)}
                  tone={priorityTone(priority)}
                />
              </div>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-sm border border-border px-3 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <StatusBadge
                        label={sprintUiStatusLabels[item.status]}
                        tone={statusTone(item.status)}
                      />
                      <Badge variant="soft">score {item.impactScore}</Badge>
                      <ImprovementStatusForm
                        id={item.id}
                        status={mapSprintUiToDbStatus(item.status)}
                      />
                    </div>
                    <p className="mt-2 text-muted">{item.description}</p>
                    <p className="mt-1 text-muted">
                      Источник: {item.source} · Пользователей:{" "}
                      {item.usersAffected} · Влияние: {item.impact}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Impact Score (рекомендация)
        </h2>
        <p className="text-sm text-muted">
          users × влияние на активацию × (6 − сложность). Решение принимает
          команда.
        </p>
        <ol className="space-y-2">
          {rankedByImpact.slice(0, 8).map((item, index) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-border px-3 py-2 text-sm"
            >
              <span className="text-foreground">
                {index + 1}. {item.title}
              </span>
              <span className="text-muted">
                {item.impactScore} · {sprintUiStatusLabels[item.status]}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Активация: до / после
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard
            label="Активация сейчас"
            value={`${activation.after.activationPct}%`}
            hint={`было ~${activation.before.activationPct}%`}
          />
          <StatsCard
            label="Первое действие"
            value={`${activation.after.firstActionPct}%`}
            hint={`было ~${activation.before.firstActionPct}%`}
          />
          <StatsCard
            label="Лия"
            value={`${activation.after.liaPct}%`}
            hint={`было ~${activation.before.liaPct}%`}
          />
        </div>
        <p className="text-sm text-muted">{activation.after.note}</p>
        <p className="text-xs text-muted">
          События: started {activation.events.fixStarted} · completed{" "}
          {activation.events.fixCompleted} · activation_after_fix{" "}
          {activation.events.activationAfterFix}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl text-foreground">
          Lia Improvement Notes
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.liaNotes.map((note) => (
            <Card key={note.id} variant="surface" className="space-y-2 p-4">
              <p className="font-medium text-foreground">{note.title}</p>
              <p className="text-sm text-muted">{note.note}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            ProductFixSprintReport
          </h2>
          <Badge variant="soft">спринт</Badge>
        </div>
        <p className="text-sm text-muted">{report.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Исправлено", report.fixed_issues],
              ["Осталось", report.remaining_issues],
              ["Активация", report.activation_changes],
              ["Лия", report.lia_changes],
              ["Рекомендации", report.recommendations],
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

      <Card variant="surface" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-xl text-foreground">
            ProductFixImprovementReport
          </h2>
          <Badge variant="soft">только анализ</Badge>
        </div>
        <p className="text-sm text-muted">{postFixReport.summary}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Completed", postFixReport.completed],
              ["Improved", postFixReport.improved],
              ["Remaining", postFixReport.remaining_problems],
              ["Next steps", postFixReport.next_steps],
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
