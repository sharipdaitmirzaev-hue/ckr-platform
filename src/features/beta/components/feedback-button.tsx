"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { submitFeedbackAction } from "@/features/beta/actions";
import { FEEDBACK_TYPES, feedbackTypeLabels, type FeedbackType } from "@/config/beta";
import { relatedFromPathname } from "@/config/pilot";
import {
  FEEDBACK_PRIORITIES,
  feedbackPriorityLabels,
  type FeedbackPriority,
} from "@/config/pilot-operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FeedbackButton() {
  const pathname = usePathname();
  const related = useMemo(() => relatedFromPathname(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("idea");
  const [priority, setPriority] = useState<FeedbackPriority>("medium");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState("4");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setError(null);
      setDone(false);
    }
  }, [open]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitFeedbackAction({
        type,
        priority,
        message,
        rating: Number(rating),
        page: pathname,
        relatedType: related.relatedType,
        relatedId: related.relatedId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      setMessage("");
      setTimeout(() => setOpen(false), 1200);
    });
  }

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 rounded-full border border-accent/40 bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-accent shadow-lg transition hover:bg-accent-muted"
      >
        Обратная связь
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 sm:items-center">
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-md rounded-sm border border-border bg-surface p-5 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                  Closed beta
                </p>
                <h2 className="mt-1 font-display text-xl text-foreground">
                  Обратная связь
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted hover:text-foreground"
              >
                Закрыть
              </button>
            </div>

            {done ? (
              <p className="text-sm text-accent">Спасибо! Сообщение отправлено.</p>
            ) : (
              <form className="space-y-3" onSubmit={onSubmit}>
                {error ? (
                  <p className="text-sm text-danger">{error}</p>
                ) : null}
                <div className="space-y-2">
                  <label htmlFor="feedback-type" className="text-sm text-muted">
                    Категория
                  </label>
                  <select
                    id="feedback-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as FeedbackType)}
                    className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm text-foreground"
                  >
                    {FEEDBACK_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {feedbackTypeLabels[item]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="feedback-priority"
                    className="text-sm text-muted"
                  >
                    Приоритет
                  </label>
                  <select
                    id="feedback-priority"
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as FeedbackPriority)
                    }
                    className="h-11 w-full rounded-sm border border-border bg-surface px-3 text-sm text-foreground"
                  >
                    {FEEDBACK_PRIORITIES.map((item) => (
                      <option key={item} value={item}>
                        {feedbackPriorityLabels[item]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="feedback-message" className="text-sm text-muted">
                    Сообщение
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    required
                    placeholder="Что можно улучшить?"
                    className="flex w-full rounded-sm border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="feedback-rating" className="text-sm text-muted">
                    Оценка (1–5)
                  </label>
                  <Input
                    id="feedback-rating"
                    type="number"
                    min={1}
                    max={5}
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted">
                  Страница: {pathname}
                  {related.relatedType
                    ? ` · объект: ${related.relatedType}${
                        related.relatedId
                          ? ` (${related.relatedId.slice(0, 8)}…)`
                          : ""
                      }`
                    : ""}
                </p>
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Отправка…" : "Отправить"}
                </Button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
