"use client";

import {
  expandExternalSearchForRequestAction,
  findInternalVariantsForRequestAction,
} from "@/features/opportunity-discovery/actions";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

function InternalSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-accent px-3 py-2 text-sm text-white disabled:opacity-60"
    >
      {pending ? "Ищем в ЦКР…" : "Поиск внутри ЦКР"}
    </button>
  );
}

function ExternalSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm border border-border px-3 py-2 text-sm hover:bg-surface disabled:opacity-60"
    >
      {pending ? "Расширяем…" : "Расширить поиск"}
    </button>
  );
}

export function OwnerRequestDiscoveryPanel(props: {
  requestId: string;
  needProfileId: string | null;
}) {
  const { requestId, needProfileId } = props;
  const [internalState, internalAction] = useFormState(
    findInternalVariantsForRequestAction,
    {},
  );
  const [externalState, externalAction] = useFormState(
    expandExternalSearchForRequestAction,
    {},
  );

  if (!needProfileId) {
    return (
      <section className="space-y-2 rounded-sm border border-border p-4">
        <h2 className="font-display text-lg">Найденные варианты</h2>
        <p className="text-sm text-muted">
          Сначала свяжите потребность обращения — без неё поиск не запустить.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-sm border border-border p-4">
      <div>
        <h2 className="font-display text-lg">Найденные варианты</h2>
        <p className="mt-1 text-sm text-muted">
          Сначала ищем внутри ЦКР. Интернет — только по явному действию.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <form action={internalAction} className="space-y-2">
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="needProfileId" value={needProfileId} />
          <InternalSubmit />
        </form>
        <form action={externalAction} className="space-y-2">
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="needProfileId" value={needProfileId} />
          <ExternalSubmit />
        </form>
      </div>

      {[internalState, externalState].map((state, idx) =>
        state.error || state.success || state.summary ? (
          <div key={idx} className="space-y-1 text-sm">
            {state.error ? (
              <p className="text-amber-800">{state.error}</p>
            ) : null}
            {state.success ? (
              <p className="text-foreground">{state.success}</p>
            ) : null}
            {typeof state.internalCount === "number" ? (
              <p className="text-muted">
                Внутри ЦКР: {state.internalCount}
                {typeof state.externalCount === "number"
                  ? ` · Внешних: ${state.externalCount}`
                  : ""}
                {state.internalSufficient != null
                  ? ` · Достаточно внутренних: ${state.internalSufficient ? "да" : "нет"}`
                  : ""}
              </p>
            ) : null}
            {state.summary ? (
              <pre className="overflow-auto whitespace-pre-wrap rounded-sm bg-surface p-2 text-xs text-muted">
                {state.summary}
              </pre>
            ) : null}
          </div>
        ) : null,
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/owner/discovery"
          className="text-accent hover:underline"
        >
          Расширенный поиск
        </Link>
        <Link
          href="/admin/owner/publishing"
          className="text-accent hover:underline"
        >
          К публикации
        </Link>
      </div>
    </section>
  );
}
