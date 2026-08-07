import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SolutionDraft } from "@/types/lia";

type ProjectAnalysisProps = {
  draft: SolutionDraft;
  projectTitle?: string;
};

export function ProjectAnalysis({ draft, projectTitle }: ProjectAnalysisProps) {
  return (
    <Card variant="surface" className="space-y-5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">Анализ Лией</Badge>
        <Badge variant="soft">Рекомендация</Badge>
      </div>

      {projectTitle ? (
        <h3 className="font-display text-xl text-foreground">{projectTitle}</h3>
      ) : null}

      <p className="text-sm leading-relaxed text-muted">{draft.summary}</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Что уже есть
          </p>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {draft.available_resources.length > 0 ? (
              draft.available_resources.map((item) => (
                <li key={item}>• {item}</li>
              ))
            ) : (
              <li className="text-muted">Пока не определено</li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">
            Чего не хватает
          </p>
          <ul className="mt-2 space-y-1 text-sm text-foreground">
            {draft.missing_resources.length > 0 ? (
              draft.missing_resources.map((item) => (
                <li key={item}>• {item}</li>
              ))
            ) : (
              <li className="text-muted">Критичных пробелов не видно</li>
            )}
          </ul>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Риски</p>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {draft.risks.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
