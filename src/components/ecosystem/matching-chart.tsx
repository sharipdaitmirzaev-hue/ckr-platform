import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { MatchQualityScore } from "@/lib/launch/ecosystem-value";
import { matchFunnelChartItems } from "@/lib/launch/ecosystem-value";

type Props = {
  quality: MatchQualityScore;
};

export function MatchingChart({ quality }: Props) {
  const items = matchFunnelChartItems(quality);

  return (
    <Card variant="surface" className="space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg text-foreground">
            MatchQualityScore
          </h3>
          <p className="text-xs text-muted">
            Воронка: создано → принято → взаимодействие → результат. Только
            аналитика.
          </p>
        </div>
        <Badge variant="accent">{quality.score}/100</Badge>
      </div>
      <ProgressBar value={quality.score} />
      <AnalyticsChart items={items} emptyText="Нет совпадений для воронки" />
      <div className="grid gap-3 sm:grid-cols-3 text-xs text-muted">
        <p>Создано→принято: {quality.conversion.created_to_accepted}%</p>
        <p>
          Принято→взаимодействие:{" "}
          {quality.conversion.accepted_to_interaction}%
        </p>
        <p>
          Взаимодействие→результат:{" "}
          {quality.conversion.interaction_to_result}%
        </p>
      </div>
    </Card>
  );
}
