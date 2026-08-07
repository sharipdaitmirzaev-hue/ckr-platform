"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { submitFirstUsersFeedbackAction } from "@/features/beta/actions";
import { useState, useTransition } from "react";

/**
 * Structured feedback First Users Wave:
 * что понравилось / что непонятно / что мешает.
 */
export function FirstUsersFeedbackPrompt() {
  const [liked, setLiked] = useState("");
  const [unclear, setUnclear] = useState("");
  const [blocker, setBlocker] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitFirstUsersFeedbackAction({
        liked,
        unclear,
        blocker,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      setLiked("");
      setUnclear("");
      setBlocker("");
    });
  }

  if (done) {
    return (
      <Card variant="surface" className="space-y-2 border-accent/30 p-5">
        <p className="text-sm text-accent">
          Спасибо! Обратная связь передана в цикл улучшений ЦКР.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="surface" className="space-y-4 border-accent/30 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-accent">
          First Users Wave
        </p>
        <h2 className="mt-2 font-display text-xl text-foreground">
          Как вам платформа?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Три коротких ответа помогут улучшить ЦКР: feedback → issues →
          improvements.
        </p>
      </div>
      <form className="space-y-3" onSubmit={onSubmit}>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Что понравилось</span>
          <textarea
            value={liked}
            onChange={(e) => setLiked(e.target.value)}
            rows={2}
            required
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-foreground"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Что непонятно</span>
          <textarea
            value={unclear}
            onChange={(e) => setUnclear(e.target.value)}
            rows={2}
            required
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-foreground"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-muted">Что мешает</span>
          <textarea
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            rows={2}
            required
            className="w-full rounded-sm border border-border bg-background px-3 py-2 text-foreground"
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Отправка…" : "Отправить отзыв"}
        </Button>
      </form>
    </Card>
  );
}
