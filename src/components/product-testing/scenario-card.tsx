import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  productTestStatusLabels,
  type ProductTestScenario,
} from "@/config/product-testing";
import { StartScenarioButton } from "@/features/product-testing/components/start-scenario-button";
import { UpdateTestForm } from "@/features/product-testing/components/update-test-form";
import type { ProductTest } from "@/types";

type ScenarioCardProps = {
  scenario: ProductTestScenario;
  latest: ProductTest | null;
};

export function ScenarioCard({ scenario, latest }: ScenarioCardProps) {
  const status = latest?.status ?? "pending";

  return (
    <Card variant="surface" className="space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl text-foreground">
              {scenario.title}
            </h3>
            <Badge variant={status === "passed" ? "accent" : "soft"}>
              {productTestStatusLabels[status]}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted">{scenario.summary}</p>
        </div>
        <StartScenarioButton scenarioKey={scenario.key} />
      </div>

      <ol className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em] text-muted">
        {scenario.flow.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden>→</span> : null}
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {latest ? (
        <div className="border-t border-border pt-5">
          <p className="mb-4 text-xs uppercase tracking-[0.14em] text-muted">
            Текущий прогон · обновлён{" "}
            {latest.updatedAt
              ? new Intl.DateTimeFormat("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(latest.updatedAt))
              : "—"}
          </p>
          <UpdateTestForm test={latest} />
        </div>
      ) : (
        <p className="border-t border-border pt-4 text-sm text-muted">
          Прогон ещё не создан. Нажмите «Начать прогон», чтобы зафиксировать
          проверки, проблемы и рекомендации.
        </p>
      )}
    </Card>
  );
}
