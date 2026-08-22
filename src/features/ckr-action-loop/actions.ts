"use server";

import {
  ACTION_EVENT,
  CKR_ACTION_TYPES,
  CKR_ACTION_STATUSES,
  CKR_OUTCOME_CODES,
  CKR_CLIENT_CTAS,
  isCkrActionParty,
  isCkrActionStatus,
  isCkrActionType,
  isCkrClientCta,
  isCkrOutcomeCode,
  ckrActionStatusLabels,
  ckrActionTypeLabels,
  ckrClientCtaLabels,
  ckrOutcomeLabels,
  type CkrActionType,
  type CkrActionStatus,
  type CkrOutcomeCode,
  type CkrClientCta,
} from "@/config/ckr-action-loop";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  actionCreatedTitle,
  appendActionLoopEvent,
  buildCreateMeta,
  deriveActionsFromEvents,
} from "@/lib/ckr-action-loop";
import { listCkrEvents } from "@/lib/ckr-inbox/queries";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

function revalidateActionPaths(requestId: string) {
  revalidatePath("/admin/owner/inbox");
  revalidatePath(`/admin/owner/inbox/${requestId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ckr-requests");
  revalidatePath(`/dashboard/ckr-requests/${requestId}`);
}

export type ActionLoopFormState = {
  error?: string;
  success?: string;
  actionId?: string;
};

async function assertClientOwnsRequest(
  requestId: string,
  userId: string,
): Promise<boolean> {
  const supabase = createClient();
  const { data: req } = await supabase
    .from("ckr_requests")
    .select("id, from_user_id, organization_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!req) return false;
  if (req.from_user_id === userId) return true;
  if (req.organization_id) {
    const { data: mem } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", req.organization_id)
      .eq("user_id", userId)
      .maybeSingle();
    return Boolean(mem);
  }
  return false;
}

/**
 * Staff: create action for a (usually shared) opportunity.
 */
export async function createRequestActionAction(
  _prev: ActionLoopFormState,
  formData: FormData,
): Promise<ActionLoopFormState> {
  const staff = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const actionTypeRaw = String(formData.get("actionType") ?? "").trim();
  const responsibleRaw = String(formData.get("responsible") ?? "CKR").trim();
  const noteInternal = String(formData.get("noteInternal") ?? "").trim();
  const notePublic = String(formData.get("notePublic") ?? "").trim();
  const dueAt = String(formData.get("dueAt") ?? "").trim() || null;
  const itemType = String(formData.get("itemType") ?? "").trim() || null;
  const itemId = String(formData.get("itemId") ?? "").trim() || null;
  const itemTitle = String(formData.get("itemTitle") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "TODO").trim();

  if (!requestId) return { error: "Нет requestId" };
  if (!isCkrActionType(actionTypeRaw)) {
    return { error: "Неизвестный тип действия" };
  }
  if (!isCkrActionParty(responsibleRaw)) {
    return { error: "Неизвестная сторона" };
  }
  if (!isCkrActionStatus(statusRaw)) {
    return { error: "Неизвестный статус" };
  }

  const actionId = randomUUID();
  const meta = buildCreateMeta({
    actionId,
    actionType: actionTypeRaw,
    status: statusRaw,
    responsible: responsibleRaw,
    noteInternal: noteInternal || undefined,
    notePublic: notePublic || undefined,
    itemType,
    itemId,
    itemTitle: itemTitle || undefined,
    dueAt,
  });

  const supabase = createClient();
  try {
    await appendActionLoopEvent({
      supabase,
      requestId,
      eventType: ACTION_EVENT.created,
      title: actionCreatedTitle(actionTypeRaw),
      detail: itemTitle
        ? `${ckrActionTypeLabels[actionTypeRaw]} · ${itemTitle}`
        : ckrActionTypeLabels[actionTypeRaw],
      meta,
      actorUserId: staff.user.id,
      mirrorToClient: true,
      clientTitle: itemTitle
        ? `ЦКР начал работу по варианту «${itemTitle}»`
        : "ЦКР начал следующий шаг",
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось создать действие" };
  }

  revalidateActionPaths(requestId);
  return {
    success: `Действие «${ckrActionTypeLabels[actionTypeRaw]}» создано`,
    actionId,
  };
}

/**
 * Staff: change action status (TODO → IN_PROGRESS → …).
 */
export async function updateRequestActionStatusAction(
  _prev: ActionLoopFormState,
  formData: FormData,
): Promise<ActionLoopFormState> {
  const staff = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const actionId = String(formData.get("actionId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  const noteInternal = String(formData.get("noteInternal") ?? "").trim();
  const notePublic = String(formData.get("notePublic") ?? "").trim();

  if (!requestId || !actionId) return { error: "Нужны requestId и actionId" };
  if (!isCkrActionStatus(statusRaw)) return { error: "Неизвестный статус" };

  const events = await listCkrEvents(requestId);
  const actions = deriveActionsFromEvents(
    events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      meta: e.meta,
      createdAt: e.createdAt,
      visibility: e.visibility,
    })),
    { requestId, includeInternalNotes: true },
  );
  if (!actions.some((a) => a.id === actionId)) {
    return { error: "Действие не найдено" };
  }

  const supabase = createClient();
  try {
    await appendActionLoopEvent({
      supabase,
      requestId,
      eventType: ACTION_EVENT.status,
      title: `Статус действия: ${ckrActionStatusLabels[statusRaw]}`,
      detail: actionId.slice(0, 8),
      meta: {
        stage4p: true,
        action_id: actionId,
        status: statusRaw,
        note_internal: noteInternal || undefined,
        note_public: notePublic || undefined,
      },
      actorUserId: staff.user.id,
      mirrorToClient: true,
      clientTitle:
        statusRaw === "IN_PROGRESS"
          ? "ЦКР выполняет следующий шаг"
          : statusRaw === "WAITING"
            ? "ЦКР ждёт ответа"
            : "ЦКР обновил статус работы",
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось обновить статус" };
  }

  revalidateActionPaths(requestId);
  return { success: `Статус: ${ckrActionStatusLabels[statusRaw]}`, actionId };
}

/**
 * Staff: record outcome on DONE (SUCCESS ≠ automatic).
 * Optionally spawn next action in the same request.
 */
export async function recordRequestActionOutcomeAction(
  _prev: ActionLoopFormState,
  formData: FormData,
): Promise<ActionLoopFormState> {
  const staff = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const actionId = String(formData.get("actionId") ?? "").trim();
  const outcomeRaw = String(formData.get("outcome") ?? "").trim();
  const outcomeComment = String(formData.get("outcomeComment") ?? "").trim();
  const nextActionTypeRaw = String(formData.get("nextActionType") ?? "").trim();
  const createNext = String(formData.get("createNext") ?? "") === "on";

  if (!requestId || !actionId) return { error: "Нужны requestId и actionId" };
  if (!isCkrOutcomeCode(outcomeRaw)) return { error: "Неизвестный результат" };

  const nextActionType: CkrActionType | null =
    nextActionTypeRaw && isCkrActionType(nextActionTypeRaw)
      ? nextActionTypeRaw
      : null;

  const events = await listCkrEvents(requestId);
  const actions = deriveActionsFromEvents(
    events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      meta: e.meta,
      createdAt: e.createdAt,
    })),
    { requestId, includeInternalNotes: true },
  );
  const current = actions.find((a) => a.id === actionId);
  if (!current) return { error: "Действие не найдено" };

  const supabase = createClient();
  try {
    await appendActionLoopEvent({
      supabase,
      requestId,
      eventType: ACTION_EVENT.outcome,
      title: `Результат: ${ckrOutcomeLabels[outcomeRaw]}`,
      detail: outcomeComment.slice(0, 400),
      meta: {
        stage4p: true,
        action_id: actionId,
        outcome: outcomeRaw,
        outcome_comment: outcomeComment || undefined,
        status: "DONE",
        next_action_type: nextActionType,
        note_public: outcomeComment
          ? outcomeComment.slice(0, 280)
          : undefined,
      },
      actorUserId: staff.user.id,
      mirrorToClient: true,
      clientTitle:
        outcomeRaw === "SUCCESS" || outcomeRaw === "PARTIAL"
          ? outcomeComment || "Есть результат по варианту"
          : outcomeRaw === "NOT_RELEVANT" || outcomeRaw === "REJECTED"
            ? "Вариант не подошёл. ЦКР продолжает поиск"
            : outcomeComment || "ЦКР зафиксировал результат",
    });

    if (createNext && nextActionType) {
      const nextId = randomUUID();
      await appendActionLoopEvent({
        supabase,
        requestId,
        eventType: ACTION_EVENT.created,
        title: actionCreatedTitle(nextActionType),
        detail: `Следующий шаг после ${actionId.slice(0, 8)}`,
        meta: buildCreateMeta({
          actionId: nextId,
          actionType: nextActionType,
          status: "TODO",
          responsible: "CKR",
          itemType: current.itemType,
          itemId: current.itemId,
          itemTitle: current.itemTitle,
          notePublic: outcomeComment
            ? `Продолжение: ${outcomeComment.slice(0, 120)}`
            : undefined,
        }),
        actorUserId: staff.user.id,
        mirrorToClient: true,
        clientTitle: `Следующий шаг: ${ckrActionTypeLabels[nextActionType].toLowerCase()}`,
      });
    }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Не удалось зафиксировать результат",
    };
  }

  revalidateActionPaths(requestId);
  return {
    success: `Результат: ${ckrOutcomeLabels[outcomeRaw]}`,
    actionId,
  };
}

/**
 * Client CTA — never accepts outcome/internal notes.
 */
export async function submitClientActionCtaAction(
  _prev: ActionLoopFormState,
  formData: FormData,
): Promise<ActionLoopFormState> {
  const current = await getCurrentUser();
  if (!current) return { error: "Войдите в аккаунт" };

  const requestId = String(formData.get("requestId") ?? "").trim();
  const actionId = String(formData.get("actionId") ?? "").trim();
  const ctaRaw = String(formData.get("cta") ?? "").trim();

  if (!requestId || !actionId) return { error: "Нет данных действия" };
  if (!isCkrClientCta(ctaRaw)) return { error: "Неизвестная команда" };

  // Reject any attempt to set outcome / internal fields from client form.
  if (
    formData.get("outcome") ||
    formData.get("noteInternal") ||
    formData.get("status")
  ) {
    return { error: "Недостаточно прав" };
  }

  const owns = await assertClientOwnsRequest(requestId, current.user.id);
  if (!owns && !current.roles.includes("admin")) {
    return { error: "Нет доступа к обращению" };
  }

  // BASIC client: still allowed CTA on own request; no admin fields returned.
  const events = await listCkrEvents(requestId);
  const clientEvents = events.filter((e) => e.visibility === "CLIENT");
  const actions = deriveActionsFromEvents(
    clientEvents.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      meta: e.meta,
      createdAt: e.createdAt,
    })),
    { requestId, includeInternalNotes: false },
  );
  const action = actions.find((a) => a.id === actionId);
  if (!action) return { error: "Действие недоступно" };
  if (action.noteInternal) {
    // Defense: public derive must never expose internal
    return { error: "Ошибка представления" };
  }

  let nextStatus: CkrActionStatus = "WAITING";
  let notePublic = ckrClientCtaLabels[ctaRaw];
  if (ctaRaw === "NOT_SUITABLE") {
    nextStatus = "CANCELLED";
    notePublic = "Клиент отметил: не подходит";
  } else if (ctaRaw === "WANT_CONTACT" || ctaRaw === "INTERESTED") {
    nextStatus = "IN_PROGRESS";
    notePublic = `Клиент: ${ckrClientCtaLabels[ctaRaw]}`;
  } else if (ctaRaw === "NEED_CKR_HELP") {
    nextStatus = "WAITING";
    notePublic = "Клиент просит помощь ЦКР";
  }

  const supabase = createClient();
  try {
    await appendActionLoopEvent({
      supabase,
      requestId,
      eventType: ACTION_EVENT.clientCta,
      title: `Клиент: ${ckrClientCtaLabels[ctaRaw]}`,
      detail: actionId.slice(0, 8),
      meta: {
        stage4p: true,
        action_id: actionId,
        client_cta: ctaRaw as CkrClientCta,
        status: nextStatus,
        note_public: notePublic,
        // never set outcome / note_internal from client path
      },
      actorUserId: current.user.id,
      mirrorToClient: true,
      clientTitle: `Вы ответили: ${ckrClientCtaLabels[ctaRaw]}`,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось отправить ответ" };
  }

  revalidateActionPaths(requestId);
  return { success: "Ответ принят. ЦКР продолжит работу.", actionId };
}

/** Exported for tests / UI option lists. */
export const ACTION_LOOP_OPTION_LISTS = {
  types: CKR_ACTION_TYPES,
  statuses: CKR_ACTION_STATUSES,
  outcomes: CKR_OUTCOME_CODES,
  ctas: CKR_CLIENT_CTAS,
} as const;
