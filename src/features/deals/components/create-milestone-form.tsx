"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createMilestoneAction,
  seedDefaultMilestonesAction,
  type DealActionState,
} from "@/features/deals/actions";
import { useState, useTransition } from "react";

type CreateMilestoneFormProps = {
  projectId: string;
  showSeed?: boolean;
};

export function CreateMilestoneForm({
  projectId,
  showSeed = false,
}: CreateMilestoneFormProps) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<DealActionState>({});

  return (
    <div className="space-y-4">
      {showSeed ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              setState(await seedDefaultMilestonesAction(projectId));
            });
          }}
        >
          Создать типовые этапы
        </Button>
      ) : null}

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await createMilestoneAction(projectId, formData);
            setState(result);
            if (result.success) event.currentTarget.reset();
          });
        }}
      >
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Новый этап
        </p>
        <Input name="title" placeholder="Название этапа" required />
        <textarea
          name="description"
          rows={2}
          placeholder="Описание"
          className="flex w-full rounded-sm border border-border bg-surface px-3.5 py-2.5 text-sm"
        />
        <Input name="deadline" type="date" />
        <Button type="submit" disabled={pending}>
          {pending ? "Сохранение…" : "Добавить этап"}
        </Button>
      </form>

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
    </div>
  );
}
