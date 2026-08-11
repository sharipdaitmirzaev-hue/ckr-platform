/**
 * Supabase persistence for Controlled Publish (additive Stage 4C columns).
 * Uses OI admin client (service role). Does NOT weaken lia_oi_* RLS for users.
 */

import { createOiAdminClient, canUseSupabaseOiStore } from "@/lib/lia/oi/store/supabase-client";
import type {
  LiaPublicationState,
  MarketplacePublishedOpportunity,
  PendingPublicChange,
  PublicationEvent,
  PublicOpportunityDraft,
} from "@/types/lia-controlled-publish";

export function canPersistControlledPublish(): boolean {
  return canUseSupabaseOiStore();
}

export async function persistOiPublicationMeta(input: {
  liaOiId: string;
  publicationState: LiaPublicationState;
  marketplaceOpportunityId: string | null;
  lockedFields: string[];
  pendingChanges: PendingPublicChange[];
  actorUserId: string | null;
}) {
  if (!canPersistControlledPublish()) return;
  const db = createOiAdminClient();
  const patch: Record<string, unknown> = {
    publication_state: input.publicationState,
    marketplace_opportunity_id: input.marketplaceOpportunityId,
    publication_locked_fields: input.lockedFields,
    pending_public_changes: input.pendingChanges,
    updated_at: new Date().toISOString(),
  };
  if (input.publicationState === "published") {
    patch.last_publication_at = new Date().toISOString();
    patch.last_publication_by = input.actorUserId;
  }
  const { error } = await db
    .from("lia_oi_opportunities")
    .update(patch)
    .eq("id", input.liaOiId);
  if (error) throw new Error(`persistOiPublicationMeta: ${error.message}`);
}

export async function persistMarketplaceOpportunity(
  row: MarketplacePublishedOpportunity,
): Promise<MarketplacePublishedOpportunity> {
  if (!canPersistControlledPublish()) return row;
  const db = createOiAdminClient();
  const payload = {
    id: row.id,
    owner_id: row.ownerId,
    title: row.title,
    description: row.description,
    type: row.type,
    region: row.region,
    city: row.city,
    price: row.price,
    currency: row.currency,
    status: row.status,
    source_type: row.sourceType,
    source_id: row.sourceId,
    source_url: row.sourceUrl,
    canonical_url: row.canonicalUrl,
    source_label: row.sourceLabel,
    source_published_at: row.sourcePublishedAt,
    fingerprint: row.fingerprint,
    amount_kind: row.amountKind,
    deadline_at: row.deadlineAt,
    data_quality_score: row.dataQualityScore,
    matching_readiness: row.matchingReadiness,
    owner_edited_fields: row.ownerEditedFields,
    pending_source_changes: row.pendingSourceChanges,
    published_from_lia_at: row.publishedFromLiaAt,
    published_by: row.publishedBy,
    updated_at: row.updatedAt,
  };
  const { data, error } = await db
    .from("opportunities")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw new Error(`persistMarketplaceOpportunity: ${error.message}`);
  return {
    ...row,
    id: data.id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function persistPublicationEvent(
  event: Omit<PublicationEvent, "id" | "createdAt"> & { id?: string },
) {
  if (!canPersistControlledPublish()) return;
  const db = createOiAdminClient();
  const { error } = await db.from("lia_oi_publication_events").insert({
    lia_oi_id: event.liaOiId,
    marketplace_opportunity_id: event.marketplaceOpportunityId,
    actor_user_id: event.actorUserId,
    action: event.action,
    reason: event.reason,
    before_snapshot: event.beforeSnapshot,
    after_snapshot: event.afterSnapshot,
    public_projection: event.publicProjection,
  });
  if (error) throw new Error(`persistPublicationEvent: ${error.message}`);
}

export async function loadPublicationQueueFromDb(
  states: LiaPublicationState[] = ["queued", "change_review"],
): Promise<
  Array<{
    liaOiId: string;
    publicationState: LiaPublicationState;
    marketplaceOpportunityId: string | null;
    lockedFields: string[];
    pendingChanges: PendingPublicChange[];
  }>
> {
  if (!canPersistControlledPublish()) return [];
  const db = createOiAdminClient();
  const { data, error } = await db
    .from("lia_oi_opportunities")
    .select(
      "id,publication_state,marketplace_opportunity_id,publication_locked_fields,pending_public_changes",
    )
    .in("publication_state", states);
  if (error) throw new Error(`loadPublicationQueueFromDb: ${error.message}`);
  return (data || []).map((row) => ({
    liaOiId: String(row.id),
    publicationState: row.publication_state as LiaPublicationState,
    marketplaceOpportunityId: row.marketplace_opportunity_id
      ? String(row.marketplace_opportunity_id)
      : null,
    lockedFields: (row.publication_locked_fields as string[]) || [],
    pendingChanges:
      (row.pending_public_changes as PendingPublicChange[] | null) || [],
  }));
}

export async function findMarketplaceBySourceId(
  sourceId: string,
): Promise<MarketplacePublishedOpportunity | null> {
  if (!canPersistControlledPublish()) return null;
  const db = createOiAdminClient();
  const { data, error } = await db
    .from("opportunities")
    .select("*")
    .eq("source_type", "lia_oi")
    .eq("source_id", sourceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapOppRow(data);
}

function mapOppRow(data: Record<string, unknown>): MarketplacePublishedOpportunity {
  return {
    id: String(data.id),
    ownerId: String(data.owner_id),
    title: String(data.title || ""),
    description: String(data.description || ""),
    type: String(data.type || ""),
    region: String(data.region || ""),
    city: String(data.city || ""),
    price: data.price == null ? null : Number(data.price),
    currency: String(data.currency || "RUB"),
    status: data.status as MarketplacePublishedOpportunity["status"],
    sourceType: "lia_oi",
    sourceId: String(data.source_id || ""),
    sourceUrl: data.source_url ? String(data.source_url) : null,
    canonicalUrl: data.canonical_url ? String(data.canonical_url) : null,
    sourceLabel: String(data.source_label || "Открытый источник"),
    sourcePublishedAt: data.source_published_at
      ? String(data.source_published_at)
      : null,
    fingerprint: data.fingerprint ? String(data.fingerprint) : null,
    amountKind: data.amount_kind ? String(data.amount_kind) : null,
    deadlineAt: data.deadline_at ? String(data.deadline_at) : null,
    dataQualityScore:
      data.data_quality_score == null ? null : Number(data.data_quality_score),
    matchingReadiness: data.matching_readiness
      ? String(data.matching_readiness)
      : null,
    ownerEditedFields: (data.owner_edited_fields as string[]) || [],
    pendingSourceChanges:
      (data.pending_source_changes as PendingPublicChange[] | null) || null,
    publishedFromLiaAt: data.published_from_lia_at
      ? String(data.published_from_lia_at)
      : null,
    publishedBy: data.published_by ? String(data.published_by) : null,
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

/** Best-effort sync after in-memory approve (used by API when DB available). */
export async function syncApproveToSupabase(input: {
  liaOiId: string;
  opportunity: MarketplacePublishedOpportunity;
  lockedFields: string[];
  actorUserId: string;
  projection: Record<string, unknown>;
  draft: PublicOpportunityDraft;
}) {
  if (!canPersistControlledPublish()) return input.opportunity;
  const saved = await persistMarketplaceOpportunity(input.opportunity);
  await persistOiPublicationMeta({
    liaOiId: input.liaOiId,
    publicationState: "published",
    marketplaceOpportunityId: saved.id,
    lockedFields: input.lockedFields,
    pendingChanges: [],
    actorUserId: input.actorUserId,
  });
  await persistPublicationEvent({
    liaOiId: input.liaOiId,
    marketplaceOpportunityId: saved.id,
    actorUserId: input.actorUserId,
    action: "approve_publish",
    reason: null,
    beforeSnapshot: {},
    afterSnapshot: { status: "published", id: saved.id },
    publicProjection: input.projection,
  });
  return saved;
}
