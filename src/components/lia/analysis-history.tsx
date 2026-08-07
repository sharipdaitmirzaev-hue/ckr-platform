import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LiaAnalysis } from "@/types/lia";

type AnalysisHistoryProps = {
  analyses: LiaAnalysis[];
};

export function AnalysisHistory({ analyses }: AnalysisHistoryProps) {
  if (analyses.length === 0) {
    return (
      <Card variant="surface" className="p-4">
        <p className="text-sm text-muted">
          История анализов пока пуста. Откройте проект и нажмите «Анализ Лией»
          или «Найти решения».
        </p>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {analyses.map((item) => (
        <li key={item.id}>
          <Card variant="surface" className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">Анализ</Badge>
              <Badge variant="soft">
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </Badge>
            </div>
            <a
              href={`/project/${item.projectId}`}
              className="font-display text-lg text-foreground hover:text-accent"
            >
              {item.projectTitle || "Проект"}
            </a>
            <p className="text-sm leading-relaxed text-muted">{item.summary}</p>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              <span>ЦКР: {item.internalMatches.length}</span>
              <span>·</span>
              <span>Внешние: {item.externalResults.length}</span>
              <span>·</span>
              <span>Рекомендаций: {item.recommendations.length}</span>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
