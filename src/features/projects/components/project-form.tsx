"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CURRENCIES,
  PROJECT_STAGES,
  PROJECT_STATUSES,
  projectStageLabels,
  projectStatusDescriptions,
  projectStatusLabels,
} from "@/config/projects";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectActionState,
} from "@/features/projects/actions";
import type { CategoryRow } from "@/types/database";
import type { Project } from "@/types";
import { useFormState, useFormStatus } from "react-dom";

const initialState: ProjectActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохранение..." : label}
    </Button>
  );
}

type ProjectFormProps = {
  mode: "create" | "edit";
  categories: CategoryRow[];
  project?: Project;
  /** Prefill из Лии / query params (только create). */
  defaults?: Partial<Project> | null;
};

export function ProjectForm({
  mode,
  categories,
  project,
  defaults,
}: ProjectFormProps) {
  const action = mode === "create" ? createProjectAction : updateProjectAction;
  const [state, formAction] = useFormState(action, initialState);
  const seed = mode === "create" ? defaults : null;

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && project ? (
        <input type="hidden" name="projectId" value={project.id} />
      ) : null}

      {seed ? (
        <p className="rounded-sm border border-accent/30 bg-accent-muted px-3 py-2 text-sm text-accent">
          Форма заполнена черновиком от Лии. Проверьте поля перед сохранением.
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-sm border border-danger/40 bg-danger-muted px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          role="status"
          className="rounded-sm border border-accent/30 bg-accent-muted px-3 py-2 text-sm text-accent"
        >
          {state.success}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm text-muted">
          Название проекта
        </label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={project?.title ?? seed?.title ?? ""}
          placeholder="Например: Производственная линия в регионе"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="summary" className="text-sm text-muted">
          Краткое описание
        </label>
        <textarea
          id="summary"
          name="summary"
          required
          rows={3}
          defaultValue={project?.summary ?? seed?.summary ?? ""}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Суть проекта в 1–3 предложениях для каталога"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm text-muted">
          Полное описание
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={8}
          defaultValue={project?.description ?? seed?.description ?? ""}
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
          placeholder="Модель, рынок, команда, что требуется для реализации"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm text-muted">
            Категория
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue={project?.category ?? seed?.category ?? ""}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            <option value="" disabled>
              Выберите категорию
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="region" className="text-sm text-muted">
            Регион
          </label>
          <Input
            id="region"
            name="region"
            required
            defaultValue={project?.region ?? seed?.region ?? ""}
            placeholder="Москва / Центральный ФО"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="investmentRequired" className="text-sm text-muted">
            Требуемые инвестиции
          </label>
          <Input
            id="investmentRequired"
            name="investmentRequired"
            type="number"
            min={0}
            step="1000"
            required
            defaultValue={
              project?.investmentRequired ?? seed?.investmentRequired ?? ""
            }
            placeholder="25000000"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="currency" className="text-sm text-muted">
            Валюта
          </label>
          <select
            id="currency"
            name="currency"
            required
            defaultValue={project?.currency ?? seed?.currency ?? "RUB"}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="stage" className="text-sm text-muted">
            Стадия
          </label>
          <select
            id="stage"
            name="stage"
            required
            defaultValue={
              project?.stage ??
              (seed?.stage &&
              PROJECT_STAGES.includes(seed.stage as (typeof PROJECT_STAGES)[number])
                ? seed.stage
                : "idea")
            }
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {PROJECT_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {projectStageLabels[stage]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm text-muted">
            Статус публикации
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={project?.status ?? "draft"}
            className="flex h-11 w-full rounded-sm border border-border bg-surface px-3.5 text-sm text-foreground"
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {projectStatusLabels[status]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted">
            {projectStatusDescriptions[project?.status ?? "draft"]}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-5">
        <SubmitButton
          label={mode === "create" ? "Создать проект" : "Сохранить изменения"}
        />
      </div>
    </form>
  );
}
