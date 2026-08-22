import type {
  CkrActionParty,
  CkrActionStatus,
  CkrActionType,
  CkrClientCta,
  CkrOutcomeCode,
} from "@/config/ckr-action-loop";

/** Stage 4P — derived Action Loop item (from ckr_request_events). */
export type CkrRequestAction = {
  id: string;
  requestId: string;
  actionType: CkrActionType;
  status: CkrActionStatus;
  responsible: CkrActionParty;
  noteInternal: string;
  notePublic: string;
  outcome: CkrOutcomeCode | null;
  outcomeComment: string;
  itemType: string | null;
  itemId: string | null;
  itemTitle: string;
  dueAt: string | null;
  nextActionType: CkrActionType | null;
  clientCta: CkrClientCta | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type CkrActionEventMeta = {
  stage4p: true;
  action_id: string;
  action_type?: CkrActionType;
  status?: CkrActionStatus;
  responsible?: CkrActionParty;
  note_internal?: string;
  note_public?: string;
  outcome?: CkrOutcomeCode;
  outcome_comment?: string;
  item_type?: string | null;
  item_id?: string | null;
  item_title?: string;
  due_at?: string | null;
  next_action_type?: CkrActionType | null;
  client_cta?: CkrClientCta;
};

/** Client-safe card for one shared opportunity / action thread. */
export type ClientActionLoopView = {
  actionId: string;
  opportunityTitle: string;
  foundLabel: string;
  nowLabel: string;
  fromYouLabel: string;
  resultLabel: string | null;
  needsClientDecision: boolean;
  allowedCtas: CkrClientCta[];
};
