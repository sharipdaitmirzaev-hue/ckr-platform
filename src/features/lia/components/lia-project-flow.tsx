"use client";

import { ProjectCreationWizard } from "@/components/lia/project-creation-wizard";
import { ProjectDraftPreview } from "@/components/lia/project-draft-preview";
import { Button } from "@/components/ui/button";
import {
  createProjectFromLiaDraftAction,
  type LiaProjectActionState,
} from "@/features/lia/actions";
import { normalizeProjectDraft } from "@/lib/lia/project-draft";
import type { ProjectDraft } from "@/types/lia";
import type { CategoryRow } from "@/types/database";
import { useState, useTransition } from "react";

type LiaProjectFlowProps = {
  draft: ProjectDraft;
  categories: CategoryRow[];
};

export function LiaProjectFlow({ draft, categories }: LiaProjectFlowProps) {
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [currentDraft, setCurrentDraft] = useState(() =>
    normalizeProjectDraft(draft),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const categoryName =
    categories.find((item) => item.slug === currentDraft.category)?.name ??
    null;

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result: LiaProjectActionState =
        await createProjectFromLiaDraftAction(currentDraft);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mt-4 space-y-4">
      {mode === "preview" ? (
        <>
          <ProjectDraftPreview
            draft={currentDraft}
            categoryName={categoryName}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMode("edit")}
              disabled={pending}
            >
              Редактировать
            </Button>
            <Button type="button" onClick={handleCreate} disabled={pending}>
              {pending ? "Создание…" : "Создать проект"}
            </Button>
          </div>
          <p className="text-xs text-muted">
            Проект будет создан со статусом draft. Лия не сохраняет данные без
            вашего подтверждения.
          </p>
        </>
      ) : (
        <ProjectCreationWizard
          draft={currentDraft}
          categories={categories}
          onCancel={() => setMode("preview")}
          onSave={(next) => {
            setCurrentDraft(normalizeProjectDraft(next));
            setMode("preview");
          }}
        />
      )}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
