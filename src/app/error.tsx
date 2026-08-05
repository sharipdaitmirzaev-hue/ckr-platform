"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Не показываем сырой error.message пользователю (утечка внутренних деталей).
  if (process.env.NODE_ENV !== "production" && error?.message) {
    console.error("[app.error]", error.message, error.digest);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErrorState
        title="Сбой загрузки"
        description="Не удалось отобразить страницу. Повторите попытку или вернитесь на главную."
        reset={reset}
      />
    </div>
  );
}
