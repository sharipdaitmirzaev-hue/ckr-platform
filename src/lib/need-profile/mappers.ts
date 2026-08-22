import type {
  NeedOwnerType,
  NeedProfile,
  NeedProfileEvent,
  NeedSource,
  NeedStatus,
  NeedVisibility,
} from "@/types/need-profile";

export type NeedProfileRow = {
  id: string;
  intent_type: string;
  title: string;
  description: string;
  owner_type: string;
  owner_id: string;
  status: string;
  budget_min: number | string | null;
  budget_max: number | string | null;
  currency: string;
  regions: string[] | null;
  industries: string[] | null;
  keywords: string[] | null;
  criteria: Record<string, unknown> | null;
  visibility: string;
  priority: string | null;
  time_horizon: string | null;
  risk_preference: string | null;
  matching_enabled: boolean;
  last_matched_at: string | null;
  context_group_id: string | null;
  fingerprint: string | null;
  source: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function rowToNeed(row: NeedProfileRow): NeedProfile {
  return {
    id: row.id,
    intentType: row.intent_type,
    title: row.title,
    description: row.description || "",
    ownerType: row.owner_type as NeedOwnerType,
    ownerId: row.owner_id,
    status: row.status as NeedStatus,
    budgetMin: num(row.budget_min),
    budgetMax: num(row.budget_max),
    currency: row.currency || "RUB",
    regions: row.regions || [],
    industries: row.industries || [],
    keywords: row.keywords || [],
    criteria: row.criteria || {},
    visibility: row.visibility as NeedVisibility,
    priority: row.priority,
    timeHorizon: row.time_horizon,
    riskPreference: row.risk_preference,
    matchingEnabled: Boolean(row.matching_enabled),
    lastMatchedAt: row.last_matched_at,
    contextGroupId: row.context_group_id,
    fingerprint: row.fingerprint,
    source: row.source as NeedSource,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function needToRow(n: NeedProfile): NeedProfileRow {
  return {
    id: n.id,
    intent_type: String(n.intentType),
    title: n.title,
    description: n.description,
    owner_type: n.ownerType,
    owner_id: n.ownerId,
    status: n.status,
    budget_min: n.budgetMin,
    budget_max: n.budgetMax,
    currency: n.currency,
    regions: n.regions,
    industries: n.industries,
    keywords: n.keywords,
    criteria: n.criteria,
    visibility: n.visibility,
    priority: n.priority,
    time_horizon: n.timeHorizon,
    risk_preference: n.riskPreference,
    matching_enabled: n.matchingEnabled,
    last_matched_at: n.lastMatchedAt,
    context_group_id: n.contextGroupId,
    fingerprint: n.fingerprint,
    source: n.source,
    created_by: n.createdBy,
    created_at: n.createdAt,
    updated_at: n.updatedAt,
  };
}

export type NeedEventRow = {
  id: string;
  need_profile_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  actor_user_id: string | null;
  created_at: string;
};

export function rowToEvent(row: NeedEventRow): NeedProfileEvent {
  return {
    id: row.id,
    needProfileId: row.need_profile_id,
    eventType: row.event_type as NeedProfileEvent["eventType"],
    payload: row.payload || {},
    actorUserId: row.actor_user_id,
    createdAt: row.created_at,
  };
}

export function eventToRow(e: NeedProfileEvent): NeedEventRow {
  return {
    id: e.id,
    need_profile_id: e.needProfileId,
    event_type: e.eventType,
    payload: e.payload,
    actor_user_id: e.actorUserId,
    created_at: e.createdAt,
  };
}
