"use client";

import { findNewOwnIdeasAction } from "@/features/ckr-own-ideas/actions";
import { useState } from "react";

export function OwnIdeasRunForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setMessage(null);
        const res = await findNewOwnIdeasAction();
        setMessage(res.error || res.success || null);
        setPending(false);
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "Ищем…" : "Найти новые идеи"}
      </button>
      {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
      <p className="mt-2 text-xs text-muted">
        Ручной запуск. Планировщик не используется. Идеи не публикуются и не
        уходят во внешние заявки.
      </p>
    </form>
  );
}
