import type {
  CkrCommentVisibility,
  CkrRequestPriority,
  CkrRequestSource,
  CkrRequestStatus,
  CkrRequestType,
} from "@/config/ckr-inbox";

export type CkrRequest = {
  id: string;
  subject: string;
  body: string;
  requestType: CkrRequestType;
  status: CkrRequestStatus;
  priority: CkrRequestPriority;
  source: CkrRequestSource;
  sourceTable: string;
  sourceId: string | null;
  organizationId: string | null;
  fromUserId: string | null;
  assignedTo: string | null;
  assignedAt: string | null;
  needProfileId: string | null;
  dealId: string | null;
  linkedTaskId: string | null;
  nextStepPublic: string;
  nextStepInternal: string;
  /** CUSTOM «Сейчас ЦКР»; empty = AUTO Stage 4J text. */
  publicActivityText: string;
  region: string;
  liaBrief: Record<string, unknown> | null;
  idempotencyKey: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactTelegram: string;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CkrRequestComment = {
  id: string;
  requestId: string;
  authorId: string;
  body: string;
  visibility: CkrCommentVisibility;
  createdAt: string;
  authorName?: string | null;
};

export type CkrRequestEvent = {
  id: string;
  requestId: string;
  eventType: string;
  title: string;
  detail: string;
  visibility: CkrCommentVisibility;
  actorUserId: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
};

export type CkrRequestRow = {
  id: string;
  subject: string;
  body: string;
  request_type: string;
  status: string;
  priority: string;
  source: string;
  source_table: string;
  source_id: string | null;
  organization_id: string | null;
  from_user_id: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
  need_profile_id: string | null;
  deal_id: string | null;
  linked_task_id: string | null;
  next_step_public: string;
  next_step_internal: string;
  public_activity_text?: string | null;
  region: string;
  lia_brief: Record<string, unknown> | null;
  idempotency_key: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_telegram?: string | null;
  claimed_at?: string | null;
  created_at: string;
  updated_at: string;
};
