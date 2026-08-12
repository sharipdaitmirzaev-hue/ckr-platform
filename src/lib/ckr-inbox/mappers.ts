import type {
  CkrCommentVisibility,
  CkrRequestPriority,
  CkrRequestSource,
  CkrRequestStatus,
  CkrRequestType,
} from "@/config/ckr-inbox";
import type {
  CkrRequest,
  CkrRequestComment,
  CkrRequestEvent,
  CkrRequestRow,
} from "@/types/ckr-inbox";

export function mapCkrRequestRow(row: CkrRequestRow): CkrRequest {
  return {
    id: row.id,
    subject: row.subject || "",
    body: row.body || "",
    requestType: row.request_type as CkrRequestType,
    status: row.status as CkrRequestStatus,
    priority: row.priority as CkrRequestPriority,
    source: row.source as CkrRequestSource,
    sourceTable: row.source_table || "",
    sourceId: row.source_id,
    organizationId: row.organization_id,
    fromUserId: row.from_user_id,
    assignedTo: row.assigned_to,
    assignedAt: row.assigned_at,
    needProfileId: row.need_profile_id,
    dealId: row.deal_id,
    linkedTaskId: row.linked_task_id,
    nextStepPublic: row.next_step_public || "",
    nextStepInternal: row.next_step_internal || "",
    region: row.region || "",
    liaBrief: row.lia_brief,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCkrCommentRow(row: {
  id: string;
  request_id: string;
  author_id: string;
  body: string;
  visibility: string;
  created_at: string;
  profiles?: { full_name?: string | null } | null;
}): CkrRequestComment {
  return {
    id: row.id,
    requestId: row.request_id,
    authorId: row.author_id,
    body: row.body || "",
    visibility: row.visibility as CkrCommentVisibility,
    createdAt: row.created_at,
    authorName: row.profiles?.full_name ?? null,
  };
}

export function mapCkrEventRow(row: {
  id: string;
  request_id: string;
  event_type: string;
  title: string;
  detail: string;
  visibility: string;
  actor_user_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}): CkrRequestEvent {
  return {
    id: row.id,
    requestId: row.request_id,
    eventType: row.event_type,
    title: row.title || "",
    detail: row.detail || "",
    visibility: row.visibility as CkrCommentVisibility,
    actorUserId: row.actor_user_id,
    meta: row.meta || {},
    createdAt: row.created_at,
  };
}

export function buildLiaBriefDraft(input: {
  organizationName: string;
  requestBody: string;
  region: string;
  hasNeed: boolean;
  needTitle?: string;
  feedHints?: string[];
}): Record<string, unknown> {
  return {
    autoPublish: false,
    client: input.organizationName,
    request: input.requestBody.slice(0, 500),
    region: input.region || "UNKNOWN",
    alreadyHave: [
      input.organizationName ? "Company profile" : null,
      input.hasNeed
        ? `Need Profile: ${input.needTitle || "ACTIVE"}`
        : "Need Profile: not linked",
    ].filter(Boolean),
    found: input.feedHints?.length
      ? input.feedHints
      : ["Проверить Feed v1 / published opportunities вручную"],
    missing: [
      "Подтверждённый объём/ассортимент",
      "География поставок",
      "Юридические реквизиты (если нужны для сделки)",
    ],
    recommendedNextStep:
      "Связать/создать SEEK_BUYER Need Profile и ответить клиенту публичным сообщением",
    generatedAt: new Date().toISOString(),
  };
}
