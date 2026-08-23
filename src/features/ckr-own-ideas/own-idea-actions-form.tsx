"use client";

import { ownIdeaOwnerAction } from "@/features/ckr-own-ideas/actions";
import { useState } from "react";

export function OwnIdeaActionsForm({
  ideaId,
  variant = "detail",
}: {
  ideaId: string;
  variant?: "detail" | "card";
}) {
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: Parameters<typeof ownIdeaOwnerAction>[1]) {
    const res = await ownIdeaOwnerAction(ideaId, action);
    setMessage(res.error || res.success || null);
  }

  const btn = "rounded-sm border border-border px-3 py-1.5 text-sm";

  if (variant === "card") {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" className={btn} onClick={() => run("refine")}>
          Уточнить расчёт
        </button>
        <button type="button" className={btn} onClick={() => run("reject")}>
          Отклонить
        </button>
        {message ? <span className="text-muted">{message}</span> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => run("accept")}>
          Принять в работу
        </button>
        <button type="button" className={btn} onClick={() => run("research")}>
          Продолжить поиск
        </button>
        <button type="button" className={btn} onClick={() => run("refine")}>
          Уточнить расчёт
        </button>
        <button type="button" className={btn} onClick={() => run("defer")}>
          Отложить
        </button>
        <button type="button" className={btn} onClick={() => run("reject")}>
          Отклонить
        </button>
        <button type="button" className={btn} onClick={() => run("create_project")}>
          Создать проект
        </button>
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
