/**
 * Stage 4P — append Action Loop events to ckr_request_events.
 * No new table. Dual-write: INTERNAL (full) + CLIENT (sanitized).
 */

import { ACTION_EVENT, type CkrActionType } from "@/config/ckr-action-loop";
import { sanitizeMetaForClient } from "@/lib/ckr-action-loop/derive";
import type { CkrActionEventMeta } from "@/types/ckr-action-loop";
import { createClient } from "@/lib/supabase/server";
import { ckrActionTypeLabels } from "@/config/ckr-action-loop";

type Supabase = ReturnType<typeof createClient>;

export async function appendActionLoopEvent(input: {
  supabase: Supabase;
  requestId: string;
  eventType: (typeof ACTION_EVENT)[keyof typeof ACTION_EVENT];
  title: string;
  detail?: string;
  meta: CkrActionEventMeta;
  actorUserId: string;
  /** Also write CLIENT-visible sanitized event (default true for client UX). */
  mirrorToClient?: boolean;
  clientTitle?: string;
}): Promise<void> {
  const {
    supabase,
    requestId,
    eventType,
    title,
    detail = "",
    meta,
    actorUserId,
    mirrorToClient = true,
    clientTitle,
  } = input;

  const { error } = await supabase.from("ckr_request_events").insert({
    request_id: requestId,
    event_type: eventType,
    title,
    detail: detail.slice(0, 400),
    visibility: "INTERNAL",
    actor_user_id: actorUserId,
    meta,
  });
  if (error) throw new Error(error.message);

  if (!mirrorToClient) return;

  const publicMeta = sanitizeMetaForClient(meta);
  const { error: clientErr } = await supabase.from("ckr_request_events").insert({
    request_id: requestId,
    event_type: eventType,
    title: clientTitle || title,
    detail: detail.slice(0, 400),
    visibility: "CLIENT",
    actor_user_id: actorUserId,
    meta: publicMeta,
  });
  if (clientErr) throw new Error(clientErr.message);
}

export function buildCreateMeta(input: {
  actionId: string;
  actionType: CkrActionType;
  status?: CkrActionEventMeta["status"];
  responsible?: CkrActionEventMeta["responsible"];
  noteInternal?: string;
  notePublic?: string;
  itemType?: string | null;
  itemId?: string | null;
  itemTitle?: string;
  dueAt?: string | null;
}): CkrActionEventMeta {
  return {
    stage4p: true,
    action_id: input.actionId,
    action_type: input.actionType,
    status: input.status ?? "TODO",
    responsible: input.responsible ?? "CKR",
    note_internal: input.noteInternal || undefined,
    note_public: input.notePublic || undefined,
    item_type: input.itemType ?? null,
    item_id: input.itemId ?? null,
    item_title: input.itemTitle || undefined,
    due_at: input.dueAt ?? null,
  };
}

export function actionCreatedTitle(type: CkrActionType): string {
  return `Действие: ${ckrActionTypeLabels[type]}`;
}
