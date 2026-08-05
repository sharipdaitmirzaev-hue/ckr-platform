"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PROJECT_STAGES,
  projectStageLabels,
} from "@/config/projects";
import type { ProjectDraft } from "@/types/lia";
import type { CategoryRow } from "@/types/database";
import { useState } from "react";

type ProjectCreationWizardProps = {
  draft: ProjectDraft;
  categories: CategoryRow[];
  onCancel: () => void;
  onSave: (draft: ProjectDraft) => void;
};

export function ProjectCreationWizard({
  draft,
  categories,
  onCancel,
  onSave,
}: ProjectCreationWizardProps) {
  const [form, setForm] = useState<ProjectDraft>(draft);

  function update<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-4 rounded-sm border border-border bg-background/40 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        Редактирование черновика
      </p>

      <div className="space-y-2">
        <label className="text-sm text-muted" htmlFor="lia-draft-title">
          Название
        </label>
        <Input
          id="lia-draft-title"
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted" htmlFor="lia-draft-summary">
          Краткое описание
        </label>
        <textarea
          id="lia-draft-summary"
          rows={3}
          value={form.summary}
          onChange={(event) => update("summary", event.target.value)}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-muted" htmlFor="lia-draft-description">
          Описание
        </label>
        <textarea
          id="lia-draft-description"
          rows={5}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-muted" htmlFor="lia-draft-category">
            Отрасль
          </label>
          <select
            id="lia-draft-category"
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
            {categories.every((item) => item.slug !== form.category) ? (
              <option value={form.category}>{form.category}</option>
            ) : null}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted" htmlFor="lia-draft-region">
            Регион
          </label>
          <Input
            id="lia-draft-region"
            value={form.region}
            onChange={(event) => update("region", event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm text-muted" htmlFor="lia-draft-investment">
            Сумма инвестиций
          </label>
          <Input
            id="lia-draft-investment"
            type="number"
            min={0}
            value={form.investment_required}
            onChange={(event) =>
              update("investment_required", Number(event.target.value) || 0)
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted" htmlFor="lia-draft-stage">
            Стадия
          </label>
          <select
            id="lia-draft-stage"
            value={form.stage}
            onChange={(event) => update("stage", event.target.value)}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {PROJECT_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {projectStageLabels[stage]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm text-muted"
            htmlFor="lia-draft-existing"
          >
            Что уже есть
          </label>
          <textarea
            id="lia-draft-existing"
            rows={3}
            value={form.existing_resources || ""}
            onChange={(event) =>
              update("existing_resources", event.target.value)
            }
            className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm text-muted"
            htmlFor="lia-draft-required"
          >
            Что требуется
          </label>
          <textarea
            id="lia-draft-required"
            rows={3}
            value={form.required_resources || ""}
            onChange={(event) =>
              update("required_resources", event.target.value)
            }
            className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Button type="button" onClick={() => onSave(form)}>
          Сохранить изменения
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
