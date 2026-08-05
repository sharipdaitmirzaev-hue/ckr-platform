import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { OperatorInsightsResult } from "@/lib/operator/insights";
import type { SlaRule } from "@/types";
import Link from "next/link";

type OperatorInsightsProps = {
  insights: OperatorInsightsResult;
  slaRules: SlaRule[];
};

function InsightList({
  title,
  items,
  empty,
}: {
  title: string;
  items: OperatorInsightsResult["recommendations"];
  empty: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Card variant="surface" className="space-y-1 p-3">
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                )}
                <p className="text-xs text-muted">{item.detail}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function OperatorInsights({
  insights,
  slaRules,
}: OperatorInsightsProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          Лия · оператор
        </p>
        <h2 className="mt-1 font-display text-xl text-foreground">
          OperatorInsights
        </h2>
        <p className="mt-1 text-sm text-muted">
          Рекомендации без автодействий. Решения принимает команда ЦКР.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {slaRules
          .filter((rule) => rule.active)
          .map((rule) => (
            <Badge key={rule.id} variant="soft">
              SLA {rule.entityType}: {rule.timeLimitHours}ч
            </Badge>
          ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <InsightList
          title="Просроченные задачи"
          items={insights.overdueTasks}
          empty="Просроченных задач нет."
        />
        <InsightList
          title="Зависшие проекты"
          items={insights.stuckProjects}
          empty="Зависших проектов не видно."
        />
        <InsightList
          title="Рекомендации"
          items={insights.recommendations}
          empty="Рекомендаций пока нет."
        />
      </div>
    </section>
  );
}
