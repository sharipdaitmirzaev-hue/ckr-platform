"use client";

import { Button } from "@/components/ui/button";
import { markProgressCheckedAction } from "@/features/execution/actions";
import { useTransition } from "react";

type MarkProgressCheckedButtonProps = {
  projectId: string;
};

export function MarkProgressCheckedButton({
  projectId,
}: MarkProgressCheckedButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await markProgressCheckedAction(projectId);
        });
      }}
    >
      {pending ? "Сохранение…" : "Зафиксировать проверку"}
    </Button>
  );
}
