/**
 * In-memory Controlled Publish store for tests / dry-run.
 */

import { randomUUID } from "crypto";
import type {
  LiaPublicationAction,
  LiaPublicationState,
  MarketplacePublishedOpportunity,
  PendingPublicChange,
  PublicationEvent,
  PublicOpportunityDraft,
} from "@/types/lia-controlled-publish";

export type PublicationMeta = {
  liaOiId: string;
  publicationState: LiaPublicationState;
  marketplaceOpportunityId: string | null;
  lockedFields: string[];
  pendingChanges: PendingPublicChange[];
  draftOverrides: Partial<PublicOpportunityDraft>;
  lastPublicationAt: string | null;
  lastPublicationBy: string | null;
  rejectReason: string | null;
};

function emptyMeta(liaOiId: string): PublicationMeta {
  return {
    liaOiId,
    publicationState: "none",
    marketplaceOpportunityId: null,
    lockedFields: [],
    pendingChanges: [],
    draftOverrides: {},
    lastPublicationAt: null,
    lastPublicationBy: null,
    rejectReason: null,
  };
}

export class MemoryControlledPublishStore {
  metas = new Map<string, PublicationMeta>();
  opportunities = new Map<string, MarketplacePublishedOpportunity>();
  events: PublicationEvent[] = [];

  reset() {
    this.metas.clear();
    this.opportunities.clear();
    this.events = [];
  }

  getMeta(liaOiId: string): PublicationMeta {
    const existing = this.metas.get(liaOiId);
    if (existing) return existing;
    const meta = emptyMeta(liaOiId);
    this.metas.set(liaOiId, meta);
    return meta;
  }

  setMeta(meta: PublicationMeta) {
    this.metas.set(meta.liaOiId, meta);
  }

  findBySourceId(sourceId: string): MarketplacePublishedOpportunity | null {
    for (const opp of this.opportunities.values()) {
      if (opp.sourceType === "lia_oi" && opp.sourceId === sourceId) return opp;
    }
    return null;
  }

  findByFingerprint(
    fingerprint: string | null | undefined,
  ): MarketplacePublishedOpportunity | null {
    if (!fingerprint) return null;
    for (const opp of this.opportunities.values()) {
      if (opp.fingerprint === fingerprint) return opp;
    }
    return null;
  }

  findByCanonicalUrl(
    url: string | null | undefined,
  ): MarketplacePublishedOpportunity | null {
    if (!url) return null;
    const norm = url.trim().toLowerCase();
    for (const opp of this.opportunities.values()) {
      if ((opp.canonicalUrl || "").trim().toLowerCase() === norm) return opp;
      if ((opp.sourceUrl || "").trim().toLowerCase() === norm) return opp;
    }
    return null;
  }

  upsertOpportunity(
    row: MarketplacePublishedOpportunity,
  ): MarketplacePublishedOpportunity {
    this.opportunities.set(row.id, row);
    return row;
  }

  getOpportunity(id: string): MarketplacePublishedOpportunity | null {
    return this.opportunities.get(id) || null;
  }

  addEvent(input: Omit<PublicationEvent, "id" | "createdAt">): PublicationEvent {
    const event: PublicationEvent = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.events.push(event);
    return event;
  }

  listEvents(liaOiId?: string): PublicationEvent[] {
    const rows = liaOiId
      ? this.events.filter((e) => e.liaOiId === liaOiId)
      : this.events.slice();
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listMetasByState(states: LiaPublicationState[]): PublicationMeta[] {
    return [...this.metas.values()].filter((m) =>
      states.includes(m.publicationState),
    );
  }
}

let singleton: MemoryControlledPublishStore | null = null;

export function getMemoryPublishStore(): MemoryControlledPublishStore {
  if (!singleton) singleton = new MemoryControlledPublishStore();
  return singleton;
}

export function resetMemoryPublishStore() {
  getMemoryPublishStore().reset();
}

export function recordActionLabel(action: LiaPublicationAction): string {
  return action;
}
