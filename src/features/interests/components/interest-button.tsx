"use client";

import { Button } from "@/components/ui/button";
import type { InvestorInterestTargetType } from "@/config/interests";
import {
  toggleInterestAction,
  type InterestActionState,
} from "@/features/interests/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: InterestActionState = {};

function SubmitButton({ interested }: { interested: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? "…" : interested ? "В интересах" : "Интересно"}
    </Button>
  );
}

type InterestButtonProps = {
  targetType: InvestorInterestTargetType;
  targetId: string;
  initiallyInterested?: boolean;
};

export function InterestButton({
  targetType,
  targetId,
  initiallyInterested = false,
}: InterestButtonProps) {
  const [state, action] = useFormState(toggleInterestAction, {
    ...initialState,
    interested: initiallyInterested,
  });
  const interested = state.interested ?? initiallyInterested;

  return (
    <form action={action} className="inline-flex flex-col gap-1">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <SubmitButton interested={interested} />
      {state.error ? (
        <span className="text-xs text-red-400">{state.error}</span>
      ) : null}
    </form>
  );
}
