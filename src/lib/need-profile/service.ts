/**
 * NeedProfileService — Stage 4A foundation.
 * memory (tests) | supabase (after migration apply).
 */

import { createBusinessGraphAdminClient } from "@/lib/business-graph/supabase-client";
import {
  getBusinessGraphService,
  type BusinessGraphService,
} from "@/lib/business-graph/service";
import { fingerprintFromCreate } from "@/lib/need-profile/fingerprint";
import { needProfileToNodeInput } from "@/lib/need-profile/graph-bridge";
import { needId } from "@/lib/need-profile/id";
import {
  eventToRow,
  needToRow,
  rowToEvent,
  rowToNeed,
  type NeedEventRow,
  type NeedProfileRow,
} from "@/lib/need-profile/mappers";
import {
  getNeedProfileMemoryStore,
  resetNeedProfileMemoryStore,
} from "@/lib/need-profile/memory-store";
import { resolveNeedProfileStoreMode } from "@/lib/need-profile/mode";
import {
  formatDraftConfirmation,
  parseNeedProfileDrafts,
} from "@/lib/need-profile/nl-parser";
import { hasSupabaseSecretEnv } from "@/lib/supabase/env";
import type {
  CreateNeedProfileInput,
  NeedOwnerType,
  NeedProfile,
  NeedProfileDraft,
  NeedProfileEvent,
  NeedStatus,
  ParseNeedDraftResult,
  UpdateNeedProfileInput,
} from "@/types/need-profile";
import type { SupabaseClient } from "@supabase/supabase-js";

function now(): string {
  return new Date().toISOString();
}

export class NeedProfileService {
  constructor(
    private readonly mode: "memory" | "supabase",
    private readonly db?: SupabaseClient,
  ) {}

  resetForTests(): void {
    if (this.mode === "memory") resetNeedProfileMemoryStore();
  }

  parseNaturalLanguage(text: string): ParseNeedDraftResult {
    return parseNeedProfileDrafts(text);
  }

  formatConfirmation(drafts: NeedProfileDraft[]): string {
    return formatDraftConfirmation(drafts);
  }

  async getById(id: string): Promise<NeedProfile | null> {
    if (this.mode === "memory") {
      return getNeedProfileMemoryStore().needs.get(id) ?? null;
    }
    const { data, error } = await this.db!
      .from("need_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToNeed(data as NeedProfileRow) : null;
  }

  /** Stable API for future Feed «Для вас». */
  async getActiveIntents(owner: {
    ownerType: NeedOwnerType;
    ownerId: string;
  }): Promise<NeedProfile[]> {
    return this.listByOwner(owner, { status: "ACTIVE" });
  }

  async listByOwner(
    owner: { ownerType: NeedOwnerType; ownerId: string },
    filter?: { status?: NeedStatus | NeedStatus[] },
  ): Promise<NeedProfile[]> {
    if (this.mode === "memory") {
      let list = Array.from(getNeedProfileMemoryStore().needs.values()).filter(
        (n) =>
          n.ownerType === owner.ownerType && n.ownerId === owner.ownerId,
      );
      if (filter?.status) {
        const statuses = Array.isArray(filter.status)
          ? filter.status
          : [filter.status];
        list = list.filter((n) => statuses.includes(n.status));
      }
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    let q = this.db!
      .from("need_profiles")
      .select("*")
      .eq("owner_type", owner.ownerType)
      .eq("owner_id", owner.ownerId)
      .order("created_at", { ascending: false });
    if (filter?.status) {
      const statuses = Array.isArray(filter.status)
        ? filter.status
        : [filter.status];
      q = q.in("status", statuses);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data as NeedProfileRow[] | null)?.map(rowToNeed) ?? [];
  }

  async create(
    input: CreateNeedProfileInput,
  ): Promise<{ need: NeedProfile; created: boolean }> {
    const fingerprint = input.fingerprint || fingerprintFromCreate(input);
    const existing = await this.findByFingerprint(fingerprint);
    if (existing && ["DRAFT", "ACTIVE", "PAUSED"].includes(existing.status)) {
      return { need: existing, created: false };
    }

    const ts = now();
    const need: NeedProfile = {
      id: needId(),
      intentType: input.intentType,
      title: input.title,
      description: input.description || "",
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      status: input.status || "DRAFT",
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      currency: input.currency || "RUB",
      regions: input.regions || [],
      industries: input.industries || [],
      keywords: input.keywords || [],
      criteria: input.criteria || {},
      visibility: input.visibility || "CKR_ONLY",
      priority: input.priority ?? "NORMAL",
      timeHorizon: input.timeHorizon ?? null,
      riskPreference: input.riskPreference ?? null,
      matchingEnabled: input.matchingEnabled ?? true,
      lastMatchedAt: null,
      contextGroupId: input.contextGroupId ?? null,
      fingerprint,
      source: input.source || "manual",
      createdBy: input.createdBy ?? null,
      createdAt: ts,
      updatedAt: ts,
    };

    await this.upsertNeed(need);
    await this.appendEvent({
      id: needId(),
      needProfileId: need.id,
      eventType: "CREATED",
      payload: { intentType: need.intentType, source: need.source },
      actorUserId: need.createdBy,
      createdAt: ts,
    });
    return { need, created: true };
  }

  async update(
    id: string,
    patch: UpdateNeedProfileInput,
    actorUserId?: string | null,
  ): Promise<NeedProfile> {
    const prev = await this.getById(id);
    if (!prev) throw new Error("need_profile_missing");
    const next: NeedProfile = {
      ...prev,
      title: patch.title ?? prev.title,
      description: patch.description ?? prev.description,
      status: patch.status ?? prev.status,
      budgetMin:
        patch.budgetMin !== undefined ? patch.budgetMin : prev.budgetMin,
      budgetMax:
        patch.budgetMax !== undefined ? patch.budgetMax : prev.budgetMax,
      currency: patch.currency ?? prev.currency,
      regions: patch.regions ?? prev.regions,
      industries: patch.industries ?? prev.industries,
      keywords: patch.keywords ?? prev.keywords,
      criteria: patch.criteria
        ? { ...prev.criteria, ...patch.criteria }
        : prev.criteria,
      visibility: patch.visibility ?? prev.visibility,
      priority: patch.priority !== undefined ? patch.priority : prev.priority,
      timeHorizon:
        patch.timeHorizon !== undefined ? patch.timeHorizon : prev.timeHorizon,
      riskPreference:
        patch.riskPreference !== undefined
          ? patch.riskPreference
          : prev.riskPreference,
      matchingEnabled: patch.matchingEnabled ?? prev.matchingEnabled,
      lastMatchedAt:
        patch.lastMatchedAt !== undefined
          ? patch.lastMatchedAt
          : prev.lastMatchedAt,
      contextGroupId:
        patch.contextGroupId !== undefined
          ? patch.contextGroupId
          : prev.contextGroupId,
      intentType: patch.intentType ?? prev.intentType,
      updatedAt: now(),
    };
    await this.upsertNeed(next);
    await this.appendEvent({
      id: needId(),
      needProfileId: next.id,
      eventType: patch.status && patch.status !== prev.status
        ? "STATUS_CHANGED"
        : "UPDATED",
      payload: { from: prev.status, to: next.status },
      actorUserId: actorUserId ?? null,
      createdAt: now(),
    });
    return next;
  }

  async setStatus(
    id: string,
    status: NeedStatus,
    actorUserId?: string | null,
  ): Promise<NeedProfile> {
    return this.update(id, { status }, actorUserId);
  }

  /**
   * Confirm NL drafts → create needs. Never auto-writes without this call.
   */
  async confirmDrafts(params: {
    drafts: NeedProfileDraft[];
    ownerType: NeedOwnerType;
    ownerId: string;
    createdBy?: string | null;
    activate?: boolean;
    contextGroupId?: string | null;
  }): Promise<NeedProfile[]> {
    const groupId =
      params.contextGroupId ||
      (params.drafts.length > 1 ? needId() : null);
    const created: NeedProfile[] = [];
    for (const d of params.drafts) {
      if (!d.requiresConfirmation) {
        // Still require explicit confirmDrafts call — safety net
      }
      const { need } = await this.create({
        intentType: d.intentType,
        title: d.title,
        description: d.description,
        ownerType: params.ownerType,
        ownerId: params.ownerId,
        status: params.activate === false ? "DRAFT" : "ACTIVE",
        budgetMin: d.budgetMin,
        budgetMax: d.budgetMax,
        currency: d.currency || "RUB",
        regions: d.regions,
        industries: d.industries,
        keywords: d.keywords,
        criteria: d.criteria,
        visibility: "CKR_ONLY",
        source: "lia_nl",
        createdBy: params.createdBy ?? null,
        contextGroupId: groupId,
      });
      await this.appendEvent({
        id: needId(),
        needProfileId: need.id,
        eventType: "CONFIRMED_FROM_NL",
        payload: {
          confidence: d.confidence,
          reasoning: d.reasoningSummary,
        },
        actorUserId: params.createdBy ?? null,
        createdAt: now(),
      });
      created.push(need);
    }
    return created;
  }

  /** Bridge to Business Graph — no MATCHES edges. */
  async bridgeToGraph(
    needIdValue: string,
    graph?: BusinessGraphService,
  ): Promise<{ nodeId: string }> {
    const need = await this.getById(needIdValue);
    if (!need) throw new Error("need_profile_missing");
    const g = graph ?? getBusinessGraphService();
    const { node } = await g.createOrUpdateNode(needProfileToNodeInput(need));
    // Explicitly do not create MATCHES
    await this.appendEvent({
      id: needId(),
      needProfileId: need.id,
      eventType: "GRAPH_BRIDGED",
      payload: { nodeId: node.id, nodeType: node.nodeType, noMatches: true },
      actorUserId: need.createdBy,
      createdAt: now(),
    });
    return { nodeId: node.id };
  }

  async getHistory(needProfileId: string): Promise<NeedProfileEvent[]> {
    if (this.mode === "memory") {
      return getNeedProfileMemoryStore()
        .events.filter((e) => e.needProfileId === needProfileId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    const { data, error } = await this.db!
      .from("need_profile_events")
      .select("*")
      .eq("need_profile_id", needProfileId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data as NeedEventRow[] | null)?.map(rowToEvent) ?? [];
  }

  private async findByFingerprint(
    fingerprint: string,
  ): Promise<NeedProfile | null> {
    if (this.mode === "memory") {
      return (
        Array.from(getNeedProfileMemoryStore().needs.values()).find(
          (n) => n.fingerprint === fingerprint,
        ) ?? null
      );
    }
    const { data, error } = await this.db!
      .from("need_profiles")
      .select("*")
      .eq("fingerprint", fingerprint)
      .in("status", ["DRAFT", "ACTIVE", "PAUSED"])
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToNeed(data as NeedProfileRow) : null;
  }

  private async upsertNeed(need: NeedProfile): Promise<void> {
    if (this.mode === "memory") {
      getNeedProfileMemoryStore().needs.set(need.id, need);
      return;
    }
    const { error } = await this.db!
      .from("need_profiles")
      .upsert(needToRow(need), { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  private async appendEvent(event: NeedProfileEvent): Promise<void> {
    if (this.mode === "memory") {
      getNeedProfileMemoryStore().events.push(event);
      return;
    }
    const { error } = await this.db!
      .from("need_profile_events")
      .insert(eventToRow(event));
    if (error) throw new Error(error.message);
  }
}

let singleton: NeedProfileService | null = null;

export function createMemoryNeedProfileService(): NeedProfileService {
  return new NeedProfileService("memory");
}

export function getNeedProfileService(
  modeOverride?: "memory" | "supabase",
): NeedProfileService {
  const mode = modeOverride ?? resolveNeedProfileStoreMode();
  if (mode === "supabase") {
    if (!hasSupabaseSecretEnv()) {
      throw new Error("supabase need profile store unavailable");
    }
    if (!singleton || (singleton as unknown as { mode: string }).mode !== "supabase") {
      singleton = new NeedProfileService(
        "supabase",
        createBusinessGraphAdminClient(),
      );
    }
    return singleton;
  }
  if (!singleton) singleton = new NeedProfileService("memory");
  return singleton;
}

export function setNeedProfileServiceForTests(
  svc: NeedProfileService | null,
): void {
  singleton = svc;
}
