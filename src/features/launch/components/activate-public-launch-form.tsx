"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  activatePublicLaunchWaveAction,
  type LaunchActionState,
} from "@/features/launch/actions";
import { useFormState, useFormStatus } from "react-dom";

const initialState: LaunchActionState = {};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? "Активация…" : "Активировать Public Launch Wave 1"}
    </Button>
  );
}

type Props = {
  canActivate: boolean;
  defaultResponsible?: string;
};

export function ActivatePublicLaunchForm({
  canActivate,
  defaultResponsible = "",
}: Props) {
  const [state, formAction] = useFormState(
    activatePublicLaunchWaveAction,
    initialState,
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-muted">
        Реальный запуск выполняется только при зафиксированном решении{" "}
        <span className="text-foreground">public_launch</span>. Иначе
        continue_beta / improve_product блокируют активацию.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="startDate" className="text-sm text-muted">
            Дата старта
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={today}
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="responsible" className="text-sm text-muted">
            Ответственный
          </label>
          <Input
            id="responsible"
            name="responsible"
            defaultValue={defaultResponsible}
            placeholder="Имя ответственного"
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor="launchComment" className="text-sm text-muted">
          Комментарий запуска
        </label>
        <textarea
          id="launchComment"
          name="comment"
          rows={3}
          required
          placeholder="Краткий комментарий к активации Public Launch"
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? (
        <p className="text-sm text-accent">{state.success}</p>
      ) : null}
      <SubmitButton disabled={!canActivate} />
    </form>
  );
}
