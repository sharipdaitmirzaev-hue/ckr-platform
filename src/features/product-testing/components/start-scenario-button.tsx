"use client";

import { Button } from "@/components/ui/button";
import { startScenarioRunAction } from "@/features/product-testing/actions";
import { useTransition } from "react";

type StartScenarioButtonProps = {
  scenarioKey: string;
  label?: string;
};

export function StartScenarioButton({
  scenarioKey,
  label = "Начать прогон",
}: StartScenarioButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await startScenarioRunAction(scenarioKey);
        });
      }}
    >
      {pending ? "Создание…" : label}
    </Button>
  );
}
