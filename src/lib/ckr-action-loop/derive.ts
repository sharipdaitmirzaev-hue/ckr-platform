/**
 * Stage 4P — fold ckr_request_events into Action Loop state.
 * Pure / deterministic (safe for unit tests without DB).
 */

import {
  ACTION_EVENT,
  ckrActionStatusPublic,
  ckrActionTypeLabels,
  ckrClientCtaLabels,
  ckrOutcomePublic,
  isCkrActionParty,
  isCkrActionStatus,
  isCkrActionType,
  isCkrClientCta,
  isCkrOutcomeCode,
  type CkrClientCta,
} from "@/config/ckr-action-loop";
import type {
  ClientActionLoopView,
  CkrActionEventMeta,
  CkrRequestAction,
} from "@/types/ckr-action-loop";

export type ActionLoopEventRow = {
  id: string;
  eventType: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
  visibility?: string;
};

function asMeta(raw: unknown): CkrActionEventMeta | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const m = raw as Record<string, unknown>;
  if (m.stage4p !== true) return null;
  if (typeof m.action_id !== "string" || !m.action_id.trim()) return null;
  return m as CkrActionEventMeta;
}

function stripInternal(meta: CkrActionEventMeta): CkrActionEventMeta {
  const copy = { ...meta };
  delete copy.note_internal;
  return copy;
}

/**
 * Build current actions from chronological event log.
 * Later events override earlier fields for the same action_id.
 */
export function deriveActionsFromEvents(
  events: ActionLoopEventRow[],
  options?: { includeInternalNotes?: boolean; requestId?: string },
): CkrRequestAction[] {
  const includeInternal = options?.includeInternalNotes !== false;
  const requestId = options?.requestId ?? "";
  const map = new Map<string, CkrRequestAction>();

  const sorted = [...events].sort((a, b) => {
    const t = a.createdAt.localeCompare(b.createdAt);
    return t !== 0 ? t : a.id.localeCompare(b.id);
  });

  for (const ev of sorted) {
    const meta = asMeta(ev.meta);
    if (!meta) continue;
    const id = meta.action_id.trim();

    if (ev.eventType === ACTION_EVENT.created) {
      const type = meta.action_type;
      const status = meta.status;
      const responsible = meta.responsible;
      if (!type || !isCkrActionType(type)) continue;
      if (!status || !isCkrActionStatus(status)) continue;
      if (!responsible || !isCkrActionParty(responsible)) continue;
      map.set(id, {
        id,
        requestId,
        actionType: type,
        status,
        responsible,
        noteInternal:
          includeInternal && typeof meta.note_internal === "string"
            ? meta.note_internal
            : "",
        notePublic:
          typeof meta.note_public === "string" ? meta.note_public : "",
        outcome: isCkrOutcomeCode(meta.outcome ?? "") ? meta.outcome! : null,
        outcomeComment:
          typeof meta.outcome_comment === "string" ? meta.outcome_comment : "",
        itemType: meta.item_type ?? null,
        itemId: meta.item_id ?? null,
        itemTitle: typeof meta.item_title === "string" ? meta.item_title : "",
        dueAt: typeof meta.due_at === "string" ? meta.due_at : null,
        nextActionType:
          meta.next_action_type && isCkrActionType(meta.next_action_type)
            ? meta.next_action_type
            : null,
        clientCta:
          meta.client_cta && isCkrClientCta(meta.client_cta)
            ? meta.client_cta
            : null,
        createdAt: ev.createdAt,
        updatedAt: ev.createdAt,
        createdBy: null,
      });
      continue;
    }

    const existing = map.get(id);
    if (!existing) continue;

    if (ev.eventType === ACTION_EVENT.status) {
      if (meta.status && isCkrActionStatus(meta.status)) {
        existing.status = meta.status;
      }
      if (typeof meta.note_public === "string") {
        existing.notePublic = meta.note_public;
      }
      if (includeInternal && typeof meta.note_internal === "string") {
        existing.noteInternal = meta.note_internal;
      }
      if (meta.responsible && isCkrActionParty(meta.responsible)) {
        existing.responsible = meta.responsible;
      }
      existing.updatedAt = ev.createdAt;
      continue;
    }

    if (ev.eventType === ACTION_EVENT.outcome) {
      if (meta.outcome && isCkrOutcomeCode(meta.outcome)) {
        existing.outcome = meta.outcome;
      }
      if (typeof meta.outcome_comment === "string") {
        existing.outcomeComment = meta.outcome_comment;
      }
      if (meta.next_action_type && isCkrActionType(meta.next_action_type)) {
        existing.nextActionType = meta.next_action_type;
      } else if (meta.next_action_type === null) {
        existing.nextActionType = null;
      }
      if (meta.status && isCkrActionStatus(meta.status)) {
        existing.status = meta.status;
      } else {
        existing.status = "DONE";
      }
      if (typeof meta.note_public === "string") {
        existing.notePublic = meta.note_public;
      }
      existing.updatedAt = ev.createdAt;
      continue;
    }

    if (ev.eventType === ACTION_EVENT.clientCta) {
      if (meta.client_cta && isCkrClientCta(meta.client_cta)) {
        existing.clientCta = meta.client_cta;
      }
      if (meta.status && isCkrActionStatus(meta.status)) {
        existing.status = meta.status;
      }
      if (typeof meta.note_public === "string") {
        existing.notePublic = meta.note_public;
      }
      existing.updatedAt = ev.createdAt;
    }
  }

  return [...map.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

/** Strip internal fields for BASIC client payloads. */
export function toPublicAction(action: CkrRequestAction): CkrRequestAction {
  return {
    ...action,
    noteInternal: "",
  };
}

export function sanitizeMetaForClient(
  meta: CkrActionEventMeta,
): CkrActionEventMeta {
  return stripInternal(meta);
}

/**
 * Client-facing story for one request (human copy only — no enums).
 */
export function toClientActionLoopView(
  actions: CkrRequestAction[],
  options?: {
    hasSharedOpportunity?: boolean;
  },
): ClientActionLoopView | null {
  const publicActions = actions.map(toPublicAction);
  const open = publicActions.find(
    (a) =>
      a.status === "TODO" ||
      a.status === "IN_PROGRESS" ||
      a.status === "WAITING",
  );
  const latestDone = publicActions.find(
    (a) => a.status === "DONE" || a.status === "CANCELLED",
  );
  const focus = open ?? latestDone ?? publicActions[0] ?? null;
  const hasShared = options?.hasSharedOpportunity === true;

  if (!focus && !hasShared) return null;

  if (!focus && hasShared) {
    return {
      actionId: "",
      opportunityTitle: "Потенциальный вариант",
      foundLabel: "ЦКР нашёл потенциальный вариант",
      nowLabel: "ЦКР готовит следующий шаг",
      fromYouLabel: "Ничего не требуется — следите за обновлениями здесь",
      resultLabel: null,
      needsClientDecision: false,
      allowedCtas: ["INTERESTED", "NOT_SUITABLE", "NEED_CKR_HELP"],
    };
  }

  const a = focus!;
  const title =
    a.itemTitle.trim() ||
    latestDone?.itemTitle.trim() ||
    "Потенциальный вариант";
  const typeLabel = ckrActionTypeLabels[a.actionType];

  let nowLabel = ckrActionStatusPublic[a.status];
  if (a.status === "TODO" || a.status === "IN_PROGRESS") {
    nowLabel = `Сейчас: ${typeLabel.toLowerCase()}`;
  } else if (a.status === "WAITING" && a.responsible === "CLIENT") {
    nowLabel = "Сейчас: ждём вашего решения";
  }

  let fromYouLabel = "Ничего не требуется";
  let allowedCtas: CkrClientCta[] = [];
  let needsClientDecision = false;

  if (
    a.responsible === "CLIENT" &&
    (a.status === "WAITING" || a.status === "TODO")
  ) {
    needsClientDecision = true;
    fromYouLabel = a.notePublic.trim()
      ? a.notePublic.trim()
      : "Подтвердите, как хотите продолжить";
    allowedCtas = [
      "WANT_CONTACT",
      "INTERESTED",
      "NOT_SUITABLE",
      "NEED_CKR_HELP",
    ];
  } else if (a.notePublic.trim()) {
    fromYouLabel = a.notePublic.trim();
  }

  // Prefer outcome from latest completed action (even if a next step is open).
  const outcomeSource =
    latestDone && latestDone.outcome
      ? latestDone
      : a.status === "DONE" || a.status === "CANCELLED"
        ? a
        : null;

  let resultLabel: string | null = null;
  if (outcomeSource?.status === "DONE" && outcomeSource.outcome) {
    const base = ckrOutcomePublic[outcomeSource.outcome];
    resultLabel = outcomeSource.outcomeComment.trim()
      ? `${base}. ${outcomeSource.outcomeComment.trim()}`
      : base;
    if (outcomeSource.nextActionType) {
      const next = ckrActionTypeLabels[outcomeSource.nextActionType];
      resultLabel = `${resultLabel} Далее: ${next.toLowerCase()}.`;
    }
  } else if (outcomeSource?.status === "CANCELLED") {
    resultLabel = "Вариант закрыт. ЦКР продолжает поиск.";
  }

  return {
    actionId: a.id,
    opportunityTitle: title,
    foundLabel: title !== "Потенциальный вариант"
      ? `ЦКР нашёл потенциальный вариант: ${title}`
      : "ЦКР нашёл потенциальный вариант",
    nowLabel,
    fromYouLabel,
    resultLabel,
    needsClientDecision,
    allowedCtas,
  };
}

export function clientCtaButtonLabel(cta: CkrClientCta): string {
  return ckrClientCtaLabels[cta];
}

/** True if event log contains a client-shared candidate. */
export function hasSharedCandidateInEvents(
  events: ActionLoopEventRow[],
): boolean {
  return events.some(
    (e) =>
      e.eventType === "CANDIDATE_SHARED" ||
      (e.meta &&
        typeof e.meta === "object" &&
        (e.meta as { shared?: unknown }).shared === true),
  );
}
