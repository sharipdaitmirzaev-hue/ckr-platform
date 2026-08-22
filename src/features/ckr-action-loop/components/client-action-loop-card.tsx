"use client";

import {
  submitClientActionCtaAction,
  type ActionLoopFormState,
} from "@/features/ckr-action-loop/actions";
import { clientCtaButtonLabel } from "@/lib/ckr-action-loop";
import type { ClientActionLoopView } from "@/types/ckr-action-loop";
import { useFormState, useFormStatus } from "react-dom";

function CtaButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground hover:border-accent/50 disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

/**
 * Client-facing Action Loop card — human copy only, no enums.
 */
export function ClientActionLoopCard(props: {
  requestId: string;
  view: ClientActionLoopView;
}) {
  const { requestId, view } = props;
  const [state, formAction] = useFormState(
    submitClientActionCtaAction,
    {} as ActionLoopFormState,
  );

  return (
    <section className="space-y-4 rounded-sm border border-accent/30 bg-accent-muted/20 p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          Вариант найден
        </p>
        <p className="mt-1 font-display text-lg text-foreground">
          {view.foundLabel}
        </p>
        {view.opportunityTitle ? (
          <p className="mt-1 text-sm text-muted">{view.opportunityTitle}</p>
        ) : null}
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          Что происходит сейчас
        </p>
        <p className="mt-1 text-sm text-foreground">{view.nowLabel}</p>
      </div>

      <div
        className={
          view.needsClientDecision
            ? "rounded-sm border border-accent/40 bg-background/80 p-3"
            : undefined
        }
      >
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          Что нужно от вас
        </p>
        <p className="mt-1 text-sm text-foreground">{view.fromYouLabel}</p>
      </div>

      {view.resultLabel ? (
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            Результат
          </p>
          <p className="mt-1 text-sm text-foreground">{view.resultLabel}</p>
        </div>
      ) : null}

      {view.needsClientDecision &&
      view.actionId &&
      view.allowedCtas.length ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {view.allowedCtas.map((cta) => (
            <form key={cta} action={formAction}>
              <input type="hidden" name="requestId" value={requestId} />
              <input type="hidden" name="actionId" value={view.actionId} />
              <input type="hidden" name="cta" value={cta} />
              <CtaButton label={clientCtaButtonLabel(cta)} />
            </form>
          ))}
        </div>
      ) : null}

      {state.error ? (
        <p className="text-sm text-amber-800">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-foreground">{state.success}</p>
      ) : null}
    </section>
  );
}
