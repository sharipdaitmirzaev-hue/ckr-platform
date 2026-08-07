import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { projectStageLabels } from "@/config/projects";
import type { ProjectDraft } from "@/types/lia";
import type { ProjectStage } from "@/types";

type ProjectDraftPreviewProps = {
  draft: ProjectDraft;
  categoryName?: string | null;
};

function stageLabel(stage: string) {
  if (stage in projectStageLabels) {
    return projectStageLabels[stage as ProjectStage];
  }
  return stage;
}

export function ProjectDraftPreview({
  draft,
  categoryName,
}: ProjectDraftPreviewProps) {
  return (
    <Card variant="surface" className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">Предварительный проект</Badge>
        <Badge variant="soft">Черновик</Badge>
      </div>

      <div>
        <h3 className="font-display text-xl text-foreground">{draft.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{draft.summary}</p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">
            Отрасль
          </dt>
          <dd className="mt-1 text-foreground">
            {categoryName || draft.category}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">
            Регион
          </dt>
          <dd className="mt-1 text-foreground">{draft.region}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">
            Инвестиции
          </dt>
          <dd className="mt-1 text-foreground">
            {new Intl.NumberFormat("ru-RU").format(draft.investment_required)}{" "}
            {draft.currency === "USD"
              ? "$"
              : draft.currency === "EUR"
                ? "€"
                : "₽"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">
            Стадия
          </dt>
          <dd className="mt-1 text-foreground">{stageLabel(draft.stage)}</dd>
        </div>
      </dl>

      <div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          Описание
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {draft.description}
        </p>
      </div>

      {(draft.existing_resources || draft.required_resources) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {draft.existing_resources ? (
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Что уже есть
              </p>
              <p className="mt-2 text-sm text-foreground">
                {draft.existing_resources}
              </p>
            </div>
          ) : null}
          {draft.required_resources ? (
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">
                Что требуется
              </p>
              <p className="mt-2 text-sm text-foreground">
                {draft.required_resources}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
