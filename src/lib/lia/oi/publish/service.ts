/**
 * Stage 4C Controlled Publish service.
 * LIA FOUND → OWNER REVIEW → APPROVE → PUBLISHED marketplace opportunity.
 * No automatic mass publish. No Matching Engine / MATCHES.
 */

import { randomUUID } from "crypto";
import type { LiaOiCandidate } from "@/types/lia-oi";
import type {
  CriticalPublicField,
  LiaPublicationState,
  MarketplacePublishedOpportunity,
  PendingPublicChange,
  PublicOpportunityDraft,
  PublicationQueueItem,
  PublicationEvent,
} from "@/types/lia-controlled-publish";
import { CRITICAL_PUBLIC_FIELDS } from "@/types/lia-controlled-publish";
import { getCandidate, listCandidates } from "@/lib/lia/oi/store";
import { passesPublicationQualityGate } from "@/lib/lia/oi/publish/quality-gate";
import {
  applyOwnerOverrides,
  enforceSafeProjection,
  projectLiaOiToPublicDraft,
} from "@/lib/lia/oi/publish/safe-projection";
import {
  getMemoryPublishStore,
  type MemoryControlledPublishStore,
  type PublicationMeta,
} from "@/lib/lia/oi/publish/memory-store";

export type ControlledPublishMode = "memory" | "supabase";

function nowIso() {
  return new Date().toISOString();
}

function buildMergedDraft(
  candidate: LiaOiCandidate,
  meta: PublicationMeta,
): PublicOpportunityDraft {
  const projected = projectLiaOiToPublicDraft(candidate);
  const next = { ...projected, ...meta.draftOverrides };
  // Owner-locked fields must win over rediscovery projection
  for (const field of meta.lockedFields) {
    if (field in meta.draftOverrides) {
      (next as Record<string, unknown>)[field] =
        (meta.draftOverrides as Record<string, unknown>)[field];
    }
  }
  return next;
}

function diffCritical(
  previous: PublicOpportunityDraft,
  next: PublicOpportunityDraft,
): PendingPublicChange[] {
  const changes: PendingPublicChange[] = [];
  const at = nowIso();
  for (const field of CRITICAL_PUBLIC_FIELDS) {
    if (field === "statusHint") {
      if (previous.lifecycleHint !== next.lifecycleHint) {
        changes.push({
          field: "lifecycleHint",
          oldValue: previous.lifecycleHint,
          newValue: next.lifecycleHint,
          critical: true,
          detectedAt: at,
        });
      }
      continue;
    }
    const oldV = (previous as Record<string, unknown>)[field];
    const newV = (next as Record<string, unknown>)[field];
    if (JSON.stringify(oldV) !== JSON.stringify(newV)) {
      changes.push({
        field,
        oldValue: oldV,
        newValue: newV,
        critical: true,
        detectedAt: at,
      });
    }
  }
  return changes;
}

function draftToMarketplaceRow(
  draft: PublicOpportunityDraft,
  input: {
    id?: string;
    ownerId: string;
    status: MarketplacePublishedOpportunity["status"];
    lockedFields: string[];
    pending: PendingPublicChange[] | null;
    publishedBy: string | null;
    existing?: MarketplacePublishedOpportunity | null;
  },
): MarketplacePublishedOpportunity {
  const ts = nowIso();
  return {
    id: input.id || input.existing?.id || randomUUID(),
    ownerId: input.ownerId,
    title: draft.title,
    description: draft.description,
    type: draft.type,
    region: draft.region,
    city: draft.city,
    price: draft.price,
    currency: draft.currency,
    status: input.status,
    sourceType: "lia_oi",
    sourceId: draft.sourceId,
    sourceUrl: draft.officialUrl,
    canonicalUrl: draft.canonicalUrl,
    sourceLabel: draft.sourceLabel,
    sourcePublishedAt: draft.publishedAt,
    fingerprint: draft.fingerprint,
    amountKind: draft.amountKind,
    deadlineAt: draft.deadlineAt,
    dataQualityScore: draft.dataQualityScore,
    matchingReadiness: draft.matchingReadiness,
    ownerEditedFields: input.lockedFields,
    pendingSourceChanges: input.pending,
    publishedFromLiaAt:
      input.status === "published"
        ? input.existing?.publishedFromLiaAt || ts
        : input.existing?.publishedFromLiaAt || null,
    publishedBy:
      input.status === "published"
        ? input.publishedBy || input.existing?.publishedBy || null
        : input.existing?.publishedBy || null,
    createdAt: input.existing?.createdAt || ts,
    updatedAt: ts,
  };
}

export class ControlledPublishService {
  constructor(
    private mode: ControlledPublishMode,
    private store: MemoryControlledPublishStore = getMemoryPublishStore(),
  ) {}

  getMode() {
    return this.mode;
  }

  private audit(
    action: PublicationEvent["action"],
    input: {
      liaOiId: string;
      marketplaceOpportunityId?: string | null;
      actorUserId: string | null;
      reason?: string | null;
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
      projection?: Record<string, unknown>;
    },
  ) {
    return this.store.addEvent({
      liaOiId: input.liaOiId,
      marketplaceOpportunityId: input.marketplaceOpportunityId ?? null,
      actorUserId: input.actorUserId,
      action,
      reason: input.reason ?? null,
      beforeSnapshot: input.before || {},
      afterSnapshot: input.after || {},
      publicProjection: input.projection || {},
    });
  }

  async queueEligible(actorUserId: string): Promise<{
    queued: number;
    skipped: number;
    reasons: Record<string, string[]>;
  }> {
    const candidates = await listCandidates();
    let queued = 0;
    let skipped = 0;
    const reasons: Record<string, string[]> = {};

    for (const c of candidates) {
      const meta = this.store.getMeta(c.id);
      if (
        meta.publicationState === "published" ||
        meta.publicationState === "queued" ||
        meta.publicationState === "change_review" ||
        meta.publicationState === "rejected"
      ) {
        skipped += 1;
        continue;
      }
      const gate = passesPublicationQualityGate(c);
      if (!gate.ok) {
        skipped += 1;
        reasons[c.id] = gate.reasons;
        continue;
      }
      // FACT closed/expired should not enter publish queue
      const draft = projectLiaOiToPublicDraft(c);
      if (
        draft.lifecycleHint === "closed" ||
        draft.lifecycleHint === "cancelled" ||
        draft.lifecycleHint === "expired"
      ) {
        skipped += 1;
        reasons[c.id] = [`lifecycle=${draft.lifecycleHint}`];
        continue;
      }
      meta.publicationState = "queued";
      this.store.setMeta(meta);
      this.audit("queue", {
        liaOiId: c.id,
        actorUserId,
        after: { publicationState: "queued" },
        projection: enforceSafeProjection(draft),
      });
      queued += 1;
    }
    return { queued, skipped, reasons };
  }

  async listQueue(
    states: LiaPublicationState[] = ["queued", "change_review"],
  ): Promise<PublicationQueueItem[]> {
    const metas = this.store.listMetasByState(states);
    const items: PublicationQueueItem[] = [];
    for (const meta of metas) {
      const c = await getCandidate(meta.liaOiId);
      if (!c) continue;
      const draft = buildMergedDraft(c, meta);
      items.push({
        liaOiId: c.id,
        publicationState: meta.publicationState,
        marketplaceOpportunityId: meta.marketplaceOpportunityId,
        draft,
        lockedFields: meta.lockedFields,
        pendingChanges: meta.pendingChanges,
        opportunityType: c.opportunityType || null,
        status: c.status,
        firstSeenAt: c.firstSeenAt,
        lastSeenAt: c.lastSeenAt,
        sourcesSummary: (c.sources || [])
          .map((s) => s.name || s.url || "source")
          .slice(0, 5),
        officialUrl: draft.officialUrl,
      });
    }
    return items.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  }

  async getQueueItem(liaOiId: string): Promise<PublicationQueueItem | null> {
    const meta = this.store.getMeta(liaOiId);
    const c = await getCandidate(liaOiId);
    if (!c) return null;
    const draft = buildMergedDraft(c, meta);
    return {
      liaOiId: c.id,
      publicationState: meta.publicationState,
      marketplaceOpportunityId: meta.marketplaceOpportunityId,
      draft,
      lockedFields: meta.lockedFields,
      pendingChanges: meta.pendingChanges,
      opportunityType: c.opportunityType || null,
      status: c.status,
      firstSeenAt: c.firstSeenAt,
      lastSeenAt: c.lastSeenAt,
      sourcesSummary: (c.sources || [])
        .map((s) => s.name || s.url || "source")
        .slice(0, 5),
      officialUrl: draft.officialUrl,
    };
  }

  async editDraft(
    liaOiId: string,
    actorUserId: string,
    overrides: Partial<
      Pick<
        PublicOpportunityDraft,
        | "title"
        | "description"
        | "type"
        | "region"
        | "city"
        | "price"
        | "deadlineAt"
        | "industry"
      >
    >,
  ) {
    const c = await getCandidate(liaOiId);
    if (!c) throw new Error("LIA OI не найдена");
    const meta = this.store.getMeta(liaOiId);
    const before = { ...meta.draftOverrides };
    const { draft, lockedFields } = applyOwnerOverrides(
      buildMergedDraft(c, meta),
      overrides,
    );
    meta.draftOverrides = {
      ...meta.draftOverrides,
      ...overrides,
    };
    meta.lockedFields = Array.from(
      new Set([...meta.lockedFields, ...lockedFields]),
    );
    if (meta.publicationState === "none") {
      meta.publicationState = "queued";
    }
    this.store.setMeta(meta);

    // If already published — update marketplace but keep locks
    if (meta.marketplaceOpportunityId) {
      const existing = this.store.getOpportunity(meta.marketplaceOpportunityId);
      if (existing) {
        const row = draftToMarketplaceRow(draft, {
          id: existing.id,
          ownerId: existing.ownerId,
          status: existing.status,
          lockedFields: meta.lockedFields,
          pending: meta.pendingChanges,
          publishedBy: existing.publishedBy,
          existing,
        });
        this.store.upsertOpportunity(row);
      }
    }

    this.audit("edit_draft", {
      liaOiId,
      marketplaceOpportunityId: meta.marketplaceOpportunityId,
      actorUserId,
      before,
      after: { overrides, lockedFields: meta.lockedFields },
      projection: enforceSafeProjection(draft),
    });
    return this.getQueueItem(liaOiId);
  }

  async reject(liaOiId: string, actorUserId: string, reason?: string) {
    const meta = this.store.getMeta(liaOiId);
    const before = { publicationState: meta.publicationState };
    meta.publicationState = "rejected";
    meta.rejectReason = reason || null;
    this.store.setMeta(meta);
    this.audit("reject", {
      liaOiId,
      marketplaceOpportunityId: meta.marketplaceOpportunityId,
      actorUserId,
      reason: reason || null,
      before,
      after: { publicationState: "rejected" },
    });
    return meta;
  }

  async requestRecheck(liaOiId: string, actorUserId: string, reason?: string) {
    const meta = this.store.getMeta(liaOiId);
    // Keep queued / change_review; mark via audit for Lia recheck assignment
    if (meta.publicationState === "none" || meta.publicationState === "rejected") {
      meta.publicationState = "queued";
    }
    this.store.setMeta(meta);
    this.audit("request_recheck", {
      liaOiId,
      marketplaceOpportunityId: meta.marketplaceOpportunityId,
      actorUserId,
      reason: reason || "owner_requested_lia_recheck",
      after: { publicationState: meta.publicationState },
    });
    return meta;
  }

  async approve(
    liaOiId: string,
    actorUserId: string,
    overrides?: Partial<
      Pick<
        PublicOpportunityDraft,
        | "title"
        | "description"
        | "type"
        | "region"
        | "city"
        | "price"
        | "deadlineAt"
        | "industry"
      >
    >,
  ): Promise<{
    opportunity: MarketplacePublishedOpportunity;
    projection: Record<string, unknown>;
  }> {
    const c = await getCandidate(liaOiId);
    if (!c) throw new Error("LIA OI не найдена");
    if (c.status === "REJECTED" || c.status === "ARCHIVED") {
      throw new Error("Нельзя публиковать REJECTED/ARCHIVED");
    }

    const meta = this.store.getMeta(liaOiId);
    if (overrides && Object.keys(overrides).length) {
      await this.editDraft(liaOiId, actorUserId, overrides);
    }
    const freshMeta = this.store.getMeta(liaOiId);
    let draft = buildMergedDraft(c, freshMeta);

    if (
      draft.lifecycleHint === "closed" ||
      draft.lifecycleHint === "cancelled" ||
      draft.lifecycleHint === "expired"
    ) {
      throw new Error(
        `Источник сообщает ${draft.lifecycleHint} — публикация запрещена без ручного override архива`,
      );
    }

    draft = {
      ...draft,
      publishedAt: nowIso(),
    };

    // Dedup: source_id / fingerprint / canonical URL
    const existing =
      this.store.findBySourceId(liaOiId) ||
      this.store.findByFingerprint(draft.fingerprint) ||
      this.store.findByCanonicalUrl(draft.canonicalUrl || draft.officialUrl);

    const row = draftToMarketplaceRow(draft, {
      id: existing?.id,
      ownerId: existing?.ownerId || actorUserId,
      status: "published",
      lockedFields: freshMeta.lockedFields,
      pending: null,
      publishedBy: actorUserId,
      existing,
    });

    // Owner-lock: never overwrite locked fields from projection on re-approve
    if (existing) {
      for (const field of freshMeta.lockedFields) {
        if (field === "title") row.title = existing.title;
        if (field === "description") row.description = existing.description;
        if (field === "type") row.type = existing.type;
        if (field === "region") row.region = existing.region;
        if (field === "city") row.city = existing.city;
        if (field === "price") row.price = existing.price;
        if (field === "deadlineAt") row.deadlineAt = existing.deadlineAt;
        // But if overrides provided in this approve, locked fields already updated via editDraft
        if (overrides && field in overrides) {
          const v = (overrides as Record<string, unknown>)[field];
          if (field === "title" && typeof v === "string") row.title = v;
          if (field === "description" && typeof v === "string")
            row.description = v;
          if (field === "type" && typeof v === "string") row.type = v;
          if (field === "region" && typeof v === "string") row.region = v;
          if (field === "city" && typeof v === "string") row.city = v;
          if (field === "price") row.price = v as number | null;
          if (field === "deadlineAt") row.deadlineAt = v as string | null;
        } else if (field in freshMeta.draftOverrides) {
          const v = (freshMeta.draftOverrides as Record<string, unknown>)[field];
          if (field === "title" && typeof v === "string") row.title = v;
          if (field === "description" && typeof v === "string")
            row.description = v;
          if (field === "type" && typeof v === "string") row.type = v;
          if (field === "region" && typeof v === "string") row.region = v;
          if (field === "city" && typeof v === "string") row.city = v;
          if (field === "price") row.price = v as number | null;
          if (field === "deadlineAt") row.deadlineAt = v as string | null;
        }
      }
    }

    this.store.upsertOpportunity(row);
    freshMeta.publicationState = "published";
    freshMeta.marketplaceOpportunityId = row.id;
    freshMeta.lastPublicationAt = nowIso();
    freshMeta.lastPublicationBy = actorUserId;
    freshMeta.pendingChanges = [];
    this.store.setMeta(freshMeta);

    const projection = enforceSafeProjection({
      ...draft,
      title: row.title,
      description: row.description,
      type: row.type,
      region: row.region,
      city: row.city,
      price: row.price,
      deadlineAt: row.deadlineAt,
    });

    this.audit("approve_publish", {
      liaOiId,
      marketplaceOpportunityId: row.id,
      actorUserId,
      before: { publicationState: meta.publicationState },
      after: {
        publicationState: "published",
        marketplaceOpportunityId: row.id,
        status: "published",
      },
      projection,
    });

    return { opportunity: row, projection };
  }

  /**
   * Rediscovery hook: never silently overwrite owner-edited or critical public fields.
   * Creates change_review for critical deltas; safe non-critical may update if unlocked.
   */
  async onRediscovery(candidate: LiaOiCandidate): Promise<{
    action: "noop" | "updated_safe" | "change_review" | "archived";
    pending: PendingPublicChange[];
  }> {
    const meta = this.store.getMeta(candidate.id);
    if (meta.publicationState !== "published" || !meta.marketplaceOpportunityId) {
      return { action: "noop", pending: [] };
    }
    const existing = this.store.getOpportunity(meta.marketplaceOpportunityId);
    if (!existing) return { action: "noop", pending: [] };

    const previousDraft: PublicOpportunityDraft = {
      ...projectLiaOiToPublicDraft(candidate),
      title: existing.title,
      description: existing.description,
      type: existing.type,
      region: existing.region,
      city: existing.city,
      price: existing.price,
      deadlineAt: existing.deadlineAt,
      officialUrl: existing.sourceUrl,
      canonicalUrl: existing.canonicalUrl,
      sourceLabel: existing.sourceLabel,
      fingerprint: existing.fingerprint,
      publishedAt: existing.sourcePublishedAt,
      amountKind: existing.amountKind,
      lifecycleHint: "active",
    };
    const nextDraft = projectLiaOiToPublicDraft(candidate);

    // FACT expiry / closed → safe auto-hide (archive), no silent field rewrite
    if (
      nextDraft.lifecycleHint === "closed" ||
      nextDraft.lifecycleHint === "cancelled" ||
      nextDraft.lifecycleHint === "expired"
    ) {
      existing.status = "archived";
      existing.updatedAt = nowIso();
      this.store.upsertOpportunity(existing);
      meta.publicationState = "archived";
      this.store.setMeta(meta);
      this.audit("archive", {
        liaOiId: candidate.id,
        marketplaceOpportunityId: existing.id,
        actorUserId: null,
        reason: `fact_lifecycle_${nextDraft.lifecycleHint}`,
        after: { status: "archived", lifecycleHint: nextDraft.lifecycleHint },
      });
      return { action: "archived", pending: [] };
    }

    const pending = diffCritical(previousDraft, nextDraft).filter((ch) => {
      // Owner-locked fields always go to review, never auto-apply
      if (meta.lockedFields.includes(ch.field)) return true;
      return ch.critical;
    });

    if (pending.length) {
      meta.pendingChanges = pending;
      meta.publicationState = "change_review";
      existing.pendingSourceChanges = pending;
      existing.updatedAt = nowIso();
      this.store.upsertOpportunity(existing);
      this.store.setMeta(meta);
      this.audit("rediscovery_update", {
        liaOiId: candidate.id,
        marketplaceOpportunityId: existing.id,
        actorUserId: null,
        reason: "critical_change_detected",
        after: { pending },
      });
      return { action: "change_review", pending };
    }

    // Safe unlocked fields (e.g. sourceLabel / dataQuality) may refresh
    if (!meta.lockedFields.includes("sourceLabel")) {
      existing.sourceLabel = nextDraft.sourceLabel;
    }
    existing.dataQualityScore = nextDraft.dataQualityScore;
    existing.matchingReadiness = nextDraft.matchingReadiness;
    existing.updatedAt = nowIso();
    this.store.upsertOpportunity(existing);
    this.audit("rediscovery_update", {
      liaOiId: candidate.id,
      marketplaceOpportunityId: existing.id,
      actorUserId: null,
      reason: "safe_fields_refreshed",
    });
    return { action: "updated_safe", pending: [] };
  }

  async applyPendingChanges(liaOiId: string, actorUserId: string) {
    const meta = this.store.getMeta(liaOiId);
    if (!meta.marketplaceOpportunityId) {
      throw new Error("Нет опубликованной marketplace opportunity");
    }
    const existing = this.store.getOpportunity(meta.marketplaceOpportunityId);
    const c = await getCandidate(liaOiId);
    if (!existing || !c) throw new Error("Не найдено");

    const draft = projectLiaOiToPublicDraft(c);
    // Apply pending onto existing, respecting locks only if owner didn't lock AFTER pending
    for (const ch of meta.pendingChanges) {
      if (meta.lockedFields.includes(ch.field) && ch.field in meta.draftOverrides) {
        continue; // keep owner lock
      }
      if (ch.field === "title") existing.title = String(ch.newValue ?? "");
      if (ch.field === "description")
        existing.description = String(ch.newValue ?? "");
      if (ch.field === "type") existing.type = String(ch.newValue ?? existing.type);
      if (ch.field === "region")
        existing.region = String(ch.newValue ?? existing.region);
      if (ch.field === "price")
        existing.price =
          ch.newValue == null ? null : Number(ch.newValue);
      if (ch.field === "deadlineAt")
        existing.deadlineAt =
          ch.newValue == null ? null : String(ch.newValue);
      if (ch.field === "lifecycleHint") {
        const hint = String(ch.newValue);
        if (hint === "closed" || hint === "cancelled" || hint === "expired") {
          existing.status = "archived";
          meta.publicationState = "archived";
        }
      }
    }
    existing.pendingSourceChanges = null;
    existing.updatedAt = nowIso();
    // Refresh non-locked safe fields
    if (!meta.lockedFields.includes("title")) existing.title = existing.title;
    existing.sourceUrl = draft.officialUrl;
    existing.canonicalUrl = draft.canonicalUrl;
    this.store.upsertOpportunity(existing);

    const beforePending = meta.pendingChanges.slice();
    meta.pendingChanges = [];
    if (meta.publicationState === "change_review") {
      meta.publicationState =
        existing.status === "archived" ? "archived" : "published";
    }
    this.store.setMeta(meta);
    this.audit("apply_changes", {
      liaOiId,
      marketplaceOpportunityId: existing.id,
      actorUserId,
      before: { pending: beforePending },
      after: {
        publicationState: meta.publicationState,
        status: existing.status,
      },
    });
    return existing;
  }

  async rejectPendingChanges(liaOiId: string, actorUserId: string) {
    const meta = this.store.getMeta(liaOiId);
    if (!meta.marketplaceOpportunityId) {
      throw new Error("Нет опубликованной marketplace opportunity");
    }
    const existing = this.store.getOpportunity(meta.marketplaceOpportunityId);
    const before = meta.pendingChanges.slice();
    meta.pendingChanges = [];
    meta.publicationState = "published";
    if (existing) {
      existing.pendingSourceChanges = null;
      existing.updatedAt = nowIso();
      this.store.upsertOpportunity(existing);
    }
    this.store.setMeta(meta);
    this.audit("reject_changes", {
      liaOiId,
      marketplaceOpportunityId: meta.marketplaceOpportunityId,
      actorUserId,
      before: { pending: before },
      after: { publicationState: "published" },
    });
    return meta;
  }

  listPublished(): MarketplacePublishedOpportunity[] {
    return [...this.store.opportunities.values()].filter(
      (o) => o.status === "published",
    );
  }

  getPublishedBySource(liaOiId: string): MarketplacePublishedOpportunity | null {
    return this.store.findBySourceId(liaOiId);
  }

  listAudit(liaOiId?: string): PublicationEvent[] {
    return this.store.listEvents(liaOiId);
  }

  /** Feed helper: published support/procurement rows as plain marketplace shape. */
  listPublishedForFeed(types?: string[]): MarketplacePublishedOpportunity[] {
    return this.listPublished().filter((o) =>
      types?.length ? types.includes(o.type) : true,
    );
  }
}

let memorySvc: ControlledPublishService | null = null;

export function getControlledPublishService(
  mode: ControlledPublishMode = "memory",
): ControlledPublishService {
  if (mode === "memory") {
    if (!memorySvc) memorySvc = new ControlledPublishService("memory");
    return memorySvc;
  }
  // Supabase path reuses memory projection engine + persistence adapter (additive).
  // Until migration is applied in production, callers should use memory/dry-run.
  return new ControlledPublishService("supabase");
}

export function resetControlledPublishForTests() {
  getMemoryPublishStore().reset();
  memorySvc = new ControlledPublishService("memory");
}

export type { CriticalPublicField };
