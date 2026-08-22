"use client";

import {
  CKR_ACTION_STATUSES,
  CKR_ACTION_TYPES,
  CKR_OUTCOME_CODES,
  ckrActionPartyLabels,
  ckrActionStatusLabels,
  ckrActionTypeLabels,
  ckrOutcomeLabels,
} from "@/config/ckr-action-loop";
import {
  createRequestActionAction,
  recordRequestActionOutcomeAction,
  updateRequestActionStatusAction,
  type ActionLoopFormState,
} from "@/features/ckr-action-loop/actions";
import type { CkrRequestAction } from "@/types/ckr-action-loop";
import { useFormState, useFormStatus } from "react-dom";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-accent px-3 py-2 text-sm text-white disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

function StatusForm({
  requestId,
  action,
}: {
  requestId: string;
  action: CkrRequestAction;
}) {
  const [state, formAction] = useFormState(
    updateRequestActionStatusAction,
    {} as ActionLoopFormState,
  );
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="actionId" value={action.id} />
      <label className="text-xs text-muted">
        Статус
        <select
          name="status"
          defaultValue={action.status}
          className="mt-1 block h-9 rounded-sm border border-border bg-surface px-2 text-sm"
        >
          {CKR_ACTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ckrActionStatusLabels[s]}
            </option>
          ))}
        </select>
      </label>
      <Submit label="Обновить" />
      {state.error ? (
        <p className="w-full text-xs text-amber-800">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="w-full text-xs text-foreground">{state.success}</p>
      ) : null}
    </form>
  );
}

function OutcomeForm({
  requestId,
  action,
}: {
  requestId: string;
  action: CkrRequestAction;
}) {
  const [state, formAction] = useFormState(
    recordRequestActionOutcomeAction,
    {} as ActionLoopFormState,
  );
  return (
    <form action={formAction} className="space-y-2 rounded-sm border border-border p-3">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="actionId" value={action.id} />
      <p className="text-xs font-medium text-foreground">Зафиксировать результат</p>
      <label className="block text-xs text-muted">
        Результат (DONE ≠ успех)
        <select
          name="outcome"
          defaultValue="SUCCESS"
          className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-2 text-sm"
        >
          {CKR_OUTCOME_CODES.map((o) => (
            <option key={o} value={o}>
              {ckrOutcomeLabels[o]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-muted">
        Комментарий (клиенту видно кратко)
        <input
          name="outcomeComment"
          placeholder="Закупщик запросил коммерческое предложение"
          className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-2 text-sm"
        />
      </label>
      <label className="block text-xs text-muted">
        Следующее действие
        <select
          name="nextActionType"
          defaultValue="SEND_OFFER"
          className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-2 text-sm"
        >
          <option value="">— не создавать —</option>
          {CKR_ACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {ckrActionTypeLabels[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" name="createNext" defaultChecked />
        Сразу создать следующее действие
      </label>
      <Submit label="Сохранить результат" />
      {state.error ? (
        <p className="text-xs text-amber-800">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-xs text-foreground">{state.success}</p>
      ) : null}
    </form>
  );
}

function CreateActionForm({
  requestId,
  defaultItemType,
  defaultItemId,
  defaultItemTitle,
}: {
  requestId: string;
  defaultItemType?: string;
  defaultItemId?: string;
  defaultItemTitle?: string;
}) {
  const [state, formAction] = useFormState(
    createRequestActionAction,
    {} as ActionLoopFormState,
  );
  return (
    <form action={formAction} className="space-y-2 rounded-sm border border-border p-3">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="itemType" value={defaultItemType || ""} />
      <input type="hidden" name="itemId" value={defaultItemId || ""} />
      <p className="text-sm font-medium text-foreground">Создать действие</p>
      <label className="block text-xs text-muted">
        Тип
        <select
          name="actionType"
          defaultValue="CONTACT"
          className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-2 text-sm"
        >
          {CKR_ACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {ckrActionTypeLabels[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-muted">
        Статус
        <select
          name="status"
          defaultValue="TODO"
          className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-2 text-sm"
        >
          {CKR_ACTION_STATUSES.filter((s) => s !== "DONE" && s !== "CANCELLED").map(
            (s) => (
              <option key={s} value={s}>
                {ckrActionStatusLabels[s]}
              </option>
            ),
          )}
        </select>
      </label>
      <label className="block text-xs text-muted">
        Кто действует
        <select
          name="responsible"
          defaultValue="CKR"
          className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-2 text-sm"
        >
          <option value="CKR">{ckrActionPartyLabels.CKR}</option>
          <option value="CLIENT">{ckrActionPartyLabels.CLIENT}</option>
          <option value="EXTERNAL">{ckrActionPartyLabels.EXTERNAL}</option>
        </select>
      </label>
      <label className="block text-xs text-muted">
        Вариант (заголовок)
        <input
          name="itemTitle"
          defaultValue={defaultItemTitle || ""}
          placeholder="Компания / закупка"
          className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-2 text-sm"
        />
      </label>
      <label className="block text-xs text-muted">
        Внутренняя заметка (клиенту не видна)
        <input
          name="noteInternal"
          placeholder="Кому звонить, детали"
          className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-2 text-sm"
        />
      </label>
      <label className="block text-xs text-muted">
        Сообщение клиенту (опционально)
        <input
          name="notePublic"
          placeholder="От вас: ничего не требуется"
          className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-2 text-sm"
        />
      </label>
      <label className="block text-xs text-muted">
        Срок (опционально)
        <input
          type="date"
          name="dueAt"
          className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-2 text-sm"
        />
      </label>
      <Submit label="Создать действие" />
      {state.error ? (
        <p className="text-xs text-amber-800">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-xs text-foreground">{state.success}</p>
      ) : null}
    </form>
  );
}

export function OwnerActionLoopPanel(props: {
  requestId: string;
  actions: CkrRequestAction[];
  suggestedItem?: {
    itemType: string;
    itemId: string;
    itemTitle: string;
  } | null;
}) {
  const { requestId, actions, suggestedItem } = props;
  const open = actions.filter(
    (a) =>
      a.status === "TODO" ||
      a.status === "IN_PROGRESS" ||
      a.status === "WAITING",
  );
  const done = actions.filter(
    (a) => a.status === "DONE" || a.status === "CANCELLED",
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-base text-foreground">
          Действия и результат
        </h3>
        <p className="mt-1 text-sm text-muted">
          Что делать сейчас → зафиксировать результат → следующий шаг. Без CRM.
        </p>
      </div>

      <CreateActionForm
        requestId={requestId}
        defaultItemType={suggestedItem?.itemType}
        defaultItemId={suggestedItem?.itemId}
        defaultItemTitle={suggestedItem?.itemTitle}
      />

      {open.length ? (
        <ul className="space-y-4">
          {open.map((a) => (
            <li
              key={a.id}
              className="space-y-3 border-b border-border pb-4 last:border-0"
            >
              <div>
                <p className="font-medium text-foreground">
                  {ckrActionTypeLabels[a.actionType]}
                  {a.itemTitle ? ` · ${a.itemTitle}` : ""}
                </p>
                <p className="text-xs text-muted">
                  {ckrActionStatusLabels[a.status]} ·{" "}
                  {ckrActionPartyLabels[a.responsible]}
                  {a.dueAt ? ` · до ${a.dueAt}` : ""}
                </p>
                {a.noteInternal ? (
                  <p className="mt-1 text-xs text-muted">
                    Внутри: {a.noteInternal}
                  </p>
                ) : null}
              </div>
              <StatusForm requestId={requestId} action={a} />
              <OutcomeForm requestId={requestId} action={a} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">
          Нет открытых действий. После «Показать клиенту» создайте действие
          (например «Связаться»).
        </p>
      )}

      {done.length ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-muted">
            Завершённые ({done.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {done.map((a) => (
              <li key={a.id} className="text-xs text-muted">
                {ckrActionTypeLabels[a.actionType]}
                {a.outcome ? ` → ${ckrOutcomeLabels[a.outcome]}` : ""}
                {a.outcomeComment ? `: ${a.outcomeComment}` : ""}
                {a.nextActionType
                  ? ` · далее ${ckrActionTypeLabels[a.nextActionType]}`
                  : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
