"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErrorState
        title="Сбой загрузки"
        description={
          error.message
            ? `Техническая деталь: ${error.message}`
            : "Не удалось отобразить страницу. Повторите попытку."
        }
        reset={reset}
      />
    </div>
  );
}
