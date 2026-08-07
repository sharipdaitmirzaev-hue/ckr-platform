"use client";

import { Button } from "@/components/ui/button";
import { createRoadmapAction } from "@/features/execution/actions";
import { useState, useTransition } from "react";

type CreateRoadmapFormProps = {
  projectId: string;
};

export function CreateRoadmapForm({ projectId }: CreateRoadmapFormProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      action={(formData) => {
        startTransition(async () => {
          const result = await createRoadmapAction(projectId, formData);
          setMessage(result.error || result.success || null);
        });
      }}
    >
      <div>
        <label className="text-xs text-muted" htmlFor="roadmap-title">
          Название дорожной карты
        </label>
        <input
          id="roadmap-title"
          name="title"
          required
          defaultValue="Дорожная карта реализации"
          className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-muted" htmlFor="roadmap-description">
          Описание
        </label>
        <textarea
          id="roadmap-description"
          name="description"
          rows={2}
          className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
          placeholder="От стратегии к фактическому результату"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Создание…" : "Создать roadmap"}
      </Button>
      {message ? <p className="text-xs text-muted">{message}</p> : null}
    </form>
  );
}
