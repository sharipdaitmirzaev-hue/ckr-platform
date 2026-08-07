"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { submitScenarioRatingAction } from "@/features/beta/actions";
import { userFeedbackEventLabels } from "@/config/beta";
import { Button } from "@/components/ui/button";

export function ScenarioFeedbackPrompt() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const scenario = searchParams.get("feedback");
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const label =
    scenario && scenario in userFeedbackEventLabels
      ? userFeedbackEventLabels[
          scenario as keyof typeof userFeedbackEventLabels
        ]
      : null;

  useEffect(() => {
    if (scenario && label) {
      setVisible(true);
      setDone(false);
      setError(null);
    } else {
      setVisible(false);
    }
  }, [scenario, label]);

  function close() {
    setVisible(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("feedback");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  function rate(rating: number) {
    if (!scenario) return;
    setError(null);
    startTransition(async () => {
      const result = await submitScenarioRatingAction({
        eventType: scenario,
        rating,
        page: pathname,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      setTimeout(close, 900);
    });
  }

  if (!visible || !scenario || !label) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-5 z-40 w-full max-w-sm rounded-sm border border-border bg-surface p-4 shadow-xl">
      {done ? (
        <p className="text-sm text-accent">Спасибо за оценку сценария.</p>
      ) : (
        <>
          <p className="text-sm font-semibold text-foreground">
            Оцените: {label.toLowerCase()}
          </p>
          <p className="mt-1 text-xs text-muted">
            Короткая оценка помогает закрытому beta-запуску ЦКР.
          </p>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={value >= 4 ? "primary" : "secondary"}
                disabled={pending}
                onClick={() => rate(value)}
              >
                {value}
              </Button>
            ))}
            <Button type="button" size="sm" variant="ghost" onClick={close}>
              Позже
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
