/**
 * PersonalizedFeedService — Stage 4B «Для вас».
 * On-demand ranking. Feedback persisted. No MATCHES / Synthesis / Scheduler.
 */

import { createClient as createBrowserlessAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, hasSupabaseSecretEnv } from "@/lib/supabase/env";
import { needId } from "@/lib/need-profile/id";
import { rowToNeed, type NeedProfileRow } from "@/lib/need-profile/mappers";
import type { NeedProfile } from "@/types/need-profile";
import type {
  FeedAction,
  FeedCandidate,
  FeedDiagnostics,
  FeedFeedbackEvent,
  FeedItemType,
  FeedRecommendation,
  FeedResult,
  IntentCoverage,
} from "@/types/personalized-feed";
import {
  allIntentMappings,
  coverageByIntent,
  getIntentMapping,
} from "@/lib/personalized-feed/mapping";
import { dedupeCandidates } from "@/lib/personalized-feed/dedup";
import { explainRecommendation } from "@/lib/personalized-feed/explain";
import { rankCandidate } from "@/lib/personalized-feed/scoring";
import { labelForMarketplaceSource } from "@/lib/personalized-feed/source-labels";
import {
  getPersonalizedFeedMemoryStore,
  resetPersonalizedFeedMemoryStore,
  setMemoryCandidates,
} from "@/lib/personalized-feed/memory-store";
import type { SupabaseClient } from "@supabase/supabase-js";

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function now(): string {
  return new Date().toISOString();
}

function buildDiagnostics(
  need: NeedProfile | null,
  coverage: IntentCoverage,
  stats: {
    candidateCount: number;
    filteredCount: number;
    recommended: FeedRecommendation[];
    dedupCount: number;
  },
): FeedDiagnostics {
  const rec = stats.recommended;
  const scores = rec.map((r) => r.score);
  const buckets: Record<string, number> = {
    "0-20": 0,
    "21-40": 0,
    "41-60": 0,
    "61-80": 0,
    "81-100": 0,
  };
  for (const s of scores) {
    if (s <= 20) buckets["0-20"]! += 1;
    else if (s <= 40) buckets["21-40"]! += 1;
    else if (s <= 60) buckets["41-60"]! += 1;
    else if (s <= 80) buckets["61-80"]! += 1;
    else buckets["81-100"]! += 1;
  }
  return {
    needProfileId: need?.id ?? null,
    intentType: need?.intentType ?? null,
    coverage,
    candidateCount: stats.candidateCount,
    filteredCount: stats.filteredCount,
    recommendedCount: rec.length,
    unknownPriceCount: rec.filter((r) => !r.candidate.priceKnown).length,
    unknownRegionCount: rec.filter(
      (r) => r.candidate.unknownFields.includes("region"),
    ).length,
    internalCount: rec.filter((r) => r.candidate.sourceChannel === "internal")
      .length,
    externalCount: rec.filter((r) => r.candidate.sourceChannel === "external")
      .length,
    dedupCount: stats.dedupCount,
    scoreDistribution: {
      min: scores.length ? Math.min(...scores) : 0,
      max: scores.length ? Math.max(...scores) : 0,
      avg: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
      buckets,
    },
    top: rec.slice(0, 10).map((r) => ({
      title: r.candidate.title,
      score: r.score,
      breakdown: r.breakdown,
      explanation: r.explanation,
      itemType: r.candidate.itemType,
      sourceLabel: r.candidate.sourceLabel,
    })),
  };
}

export class PersonalizedFeedService {
  constructor(
    private readonly mode: "memory" | "supabase",
    private readonly db?: SupabaseClient,
    /** Test/memory active needs injected by suite. */
    private memoryNeeds: NeedProfile[] = [],
  ) {}

  resetForTests(): void {
    if (this.mode === "memory") {
      resetPersonalizedFeedMemoryStore();
      this.memoryNeeds = [];
    }
  }

  setTestCandidates(candidates: FeedCandidate[]): void {
    if (this.mode !== "memory") throw new Error("memory_only");
    setMemoryCandidates(candidates);
  }

  setTestNeeds(needs: NeedProfile[]): void {
    if (this.mode !== "memory") throw new Error("memory_only");
    this.memoryNeeds = needs.slice();
  }

  getCoverageMap(): Record<string, IntentCoverage> {
    return coverageByIntent();
  }

  getMappings() {
    return allIntentMappings();
  }

  private async listActiveNeeds(ownerId: string): Promise<NeedProfile[]> {
    if (this.mode === "memory") {
      return this.memoryNeeds.filter(
        (n) =>
          n.ownerType === "user" &&
          n.ownerId === ownerId &&
          n.status === "ACTIVE",
      );
    }
    const { data, error } = await this.db!
      .from("need_profiles")
      .select("*")
      .eq("owner_type", "user")
      .eq("owner_id", ownerId)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data as NeedProfileRow[] | null) || []).map(rowToNeed);
  }

  async getFeedForOwner(params: {
    ownerId: string;
    needProfileId?: string | null;
    limit?: number;
  }): Promise<FeedResult> {
    const needs = await this.listActiveNeeds(params.ownerId);
    const selected =
      (params.needProfileId &&
        needs.find((n) => n.id === params.needProfileId)) ||
      null;

    if (!needs.length) {
      return {
        ownerId: params.ownerId,
        needs: [],
        selectedNeedId: null,
        recommendations: [],
        diagnostics: buildDiagnostics(null, "UNSUPPORTED", {
          candidateCount: 0,
          filteredCount: 0,
          recommended: [],
          dedupCount: 0,
        }),
        coverageByIntent: coverageByIntent(),
      };
    }

    if (selected || params.needProfileId) {
      const need = selected || needs[0]!;
      const one = await this.getFeedForNeedProfile({
        need,
        ownerId: params.ownerId,
        limit: params.limit,
      });
      return {
        ownerId: params.ownerId,
        needs,
        selectedNeedId: need.id,
        recommendations: one.recommendations,
        diagnostics: one.diagnostics,
        coverageByIntent: coverageByIntent(),
      };
    }

    // All active needs — tag each recommendation with need id, don't opaque-merge
    const all: FeedRecommendation[] = [];
    let lastDiag = buildDiagnostics(null, "PARTIAL", {
      candidateCount: 0,
      filteredCount: 0,
      recommended: [],
      dedupCount: 0,
    });
    for (const need of needs) {
      const part = await this.getFeedForNeedProfile({
        need,
        ownerId: params.ownerId,
        limit: params.limit ?? 8,
      });
      all.push(...part.recommendations);
      lastDiag = {
        ...part.diagnostics,
        candidateCount: lastDiag.candidateCount + part.diagnostics.candidateCount,
        filteredCount: lastDiag.filteredCount + part.diagnostics.filteredCount,
        dedupCount: lastDiag.dedupCount + part.diagnostics.dedupCount,
      };
    }
    all.sort((a, b) => b.score - a.score);
    const limited = all.slice(0, params.limit ?? 20);
    return {
      ownerId: params.ownerId,
      needs,
      selectedNeedId: null,
      recommendations: limited,
      diagnostics: {
        ...lastDiag,
        recommendedCount: limited.length,
        top: limited.slice(0, 10).map((r) => ({
          title: r.candidate.title,
          score: r.score,
          breakdown: r.breakdown,
          explanation: r.explanation,
          itemType: r.candidate.itemType,
          sourceLabel: r.candidate.sourceLabel,
        })),
      },
      coverageByIntent: coverageByIntent(),
    };
  }

  async getFeedForNeedProfile(params: {
    need: NeedProfile;
    ownerId: string;
    limit?: number;
  }): Promise<{
    recommendations: FeedRecommendation[];
    diagnostics: FeedDiagnostics;
  }> {
    const mapping = getIntentMapping(params.need.intentType);
    if (mapping.coverage === "UNSUPPORTED") {
      return {
        recommendations: [],
        diagnostics: buildDiagnostics(params.need, mapping.coverage, {
          candidateCount: 0,
          filteredCount: 0,
          recommended: [],
          dedupCount: 0,
        }),
      };
    }

    const raw = await this.collectCandidates(params.need);
    const { unique, removed } = dedupeCandidates(raw);
    const hidden = await this.hiddenItemKeys(params.ownerId);
    let filtered = 0;
    const ranked: FeedRecommendation[] = [];

    for (const candidate of unique) {
      const key = `${candidate.itemType}:${candidate.id}`;
      if (hidden.has(key)) {
        filtered += 1;
        continue;
      }
      const { breakdown, hardReject, budgetNote } = rankCandidate(
        params.need,
        candidate,
      );
      if (hardReject || breakdown.total < 25) {
        filtered += 1;
        continue;
      }
      ranked.push({
        recommendationId: `${params.need.id}:${candidate.itemType}:${candidate.id}`,
        recommendationForNeedProfileId: params.need.id,
        needIntentType: params.need.intentType,
        candidate,
        score: breakdown.total,
        breakdown,
        explanation: explainRecommendation(
          params.need,
          candidate,
          breakdown,
          budgetNote,
        ),
      });
    }

    ranked.sort((a, b) => b.score - a.score);
    const recommendations = ranked.slice(0, params.limit ?? 20);
    return {
      recommendations,
      diagnostics: buildDiagnostics(params.need, mapping.coverage, {
        candidateCount: raw.length,
        filteredCount: filtered,
        recommended: recommendations,
        dedupCount: removed,
      }),
    };
  }

  async recordFeedback(input: {
    userId: string;
    needProfileId?: string | null;
    itemType: FeedItemType;
    itemId: string;
    action: FeedAction;
    score?: number | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<FeedFeedbackEvent> {
    const event: FeedFeedbackEvent = {
      id: needId(),
      userId: input.userId,
      needProfileId: input.needProfileId ?? null,
      itemType: input.itemType,
      itemId: input.itemId,
      action: input.action,
      score: input.score ?? null,
      reason: input.reason ?? null,
      metadata: input.metadata || {},
      createdAt: now(),
    };

    if (this.mode === "memory") {
      const st = getPersonalizedFeedMemoryStore();
      if (event.action === "not_interested") {
        st.feedback = st.feedback.filter(
          (f) =>
            !(
              f.userId === event.userId &&
              f.itemType === event.itemType &&
              f.itemId === event.itemId &&
              f.action === "not_interested"
            ),
        );
      }
      st.feedback.push(event);

      // Mirror SAVE/INTERESTED into investor_interests-like memory metadata only
      return event;
    }

    const db = this.db!;
    const { error } = await db.from("feed_feedback_events").insert({
      id: event.id,
      user_id: event.userId,
      need_profile_id: event.needProfileId,
      item_type: event.itemType,
      item_id: event.itemId,
      action: event.action,
      score: event.score,
      reason: event.reason,
      metadata: event.metadata,
      created_at: event.createdAt,
    });
    if (error) {
      // unique not_interested — treat as ok
      if (!error.message.includes("duplicate") && error.code !== "23505") {
        throw new Error(error.message);
      }
    }

    // Best-effort: reuse investor_interests for saved/interested marketplace items
    if (
      (event.action === "saved" || event.action === "interested") &&
      (event.itemType === "project" ||
        event.itemType === "opportunity" ||
        event.itemType === "investment_offer")
    ) {
      const targetType =
        event.itemType === "investment_offer" ? "investment" : event.itemType;
      const { error: interestError } = await db.from("investor_interests").insert({
        user_id: event.userId,
        target_type: targetType,
        target_id: event.itemId,
      });
      if (
        interestError &&
        interestError.code !== "23505" &&
        !interestError.message.includes("duplicate")
      ) {
        // non-fatal for feed feedback
      }
    }

    return event;
  }

  /**
   * «Поручить Лии проверить» — records feedback + optional operator task.
   * No auto outreach. Does not contact sellers.
   */
  async assignLiaReview(input: {
    userId: string;
    needProfileId?: string | null;
    itemType: FeedItemType;
    itemId: string;
    title: string;
  }): Promise<{ feedback: FeedFeedbackEvent; taskCreated: boolean }> {
    const feedback = await this.recordFeedback({
      userId: input.userId,
      needProfileId: input.needProfileId,
      itemType: input.itemType,
      itemId: input.itemId,
      action: "assigned_to_lia",
      metadata: { title: input.title, autoOutreach: false },
    });

    if (this.mode === "memory") {
      return { feedback, taskCreated: true };
    }

    let taskCreated = false;
    try {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          input.itemId,
        );
      const { error } = await this.db!.from("tasks").insert({
        title: `Лия: проверить «${input.title.slice(0, 80)}»`,
        description: [
          "Запрос из ленты «Для вас». Только проверка/исследование. Без auto outreach.",
          `item_type=${input.itemType}`,
          `item_id=${input.itemId}`,
          input.needProfileId ? `need_profile_id=${input.needProfileId}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        // tasks.related_type enum is narrow (lead/project/deal/…)
        related_type: input.itemType === "project" ? "project" : null,
        related_id: input.itemType === "project" && isUuid ? input.itemId : null,
        priority: "medium",
        status: "new",
        created_by: input.userId,
      });
      taskCreated = !error;
    } catch {
      taskCreated = false;
    }
    return { feedback, taskCreated };
  }

  async getOwnerDiagnostics(params: {
    ownerId: string;
    needProfileId?: string | null;
  }): Promise<FeedDiagnostics & { mappings: ReturnType<typeof allIntentMappings> }> {
    const feed = await this.getFeedForOwner({
      ownerId: params.ownerId,
      needProfileId: params.needProfileId,
      limit: 20,
    });
    return { ...feed.diagnostics, mappings: allIntentMappings() };
  }

  private async hiddenItemKeys(userId: string): Promise<Set<string>> {
    if (this.mode === "memory") {
      return new Set(
        getPersonalizedFeedMemoryStore()
          .feedback.filter(
            (f) => f.userId === userId && f.action === "not_interested",
          )
          .map((f) => `${f.itemType}:${f.itemId}`),
      );
    }
    const { data } = await this.db!
      .from("feed_feedback_events")
      .select("item_type,item_id")
      .eq("user_id", userId)
      .eq("action", "not_interested");
    return new Set(
      (data || []).map((r) => `${r.item_type}:${r.item_id}`),
    );
  }

  private async collectCandidates(need: NeedProfile): Promise<FeedCandidate[]> {
    if (this.mode === "memory") {
      const mapping = getIntentMapping(need.intentType);
      return getPersonalizedFeedMemoryStore().candidates.filter((c) =>
        mapping.itemTypes.includes(c.itemType),
      );
    }
    return collectMarketplaceCandidates(this.db!, need);
  }
}

async function collectMarketplaceCandidates(
  db: SupabaseClient,
  need: NeedProfile,
): Promise<FeedCandidate[]> {
  const mapping = getIntentMapping(need.intentType);
  const out: FeedCandidate[] = [];

  if (mapping.itemTypes.includes("project")) {
    const { data } = await db
      .from("projects")
      .select(
        "id,title,summary,region,category,investment_required,currency,status,created_at,updated_at,verification_status",
      )
      .in("status", ["published", "active", "completed"])
      .limit(80);
    for (const row of data || []) {
      const price = num(row.investment_required);
      const src = labelForMarketplaceSource("project");
      const unknown: string[] = [];
      if (!row.region) unknown.push("region");
      if (!row.category) unknown.push("industry");
      if (price == null) unknown.push("price");
      unknown.push("profit", "payback");
      out.push({
        id: row.id,
        itemType: "project",
        title: row.title,
        summary: row.summary || "",
        region: row.region,
        industry: row.category,
        industries: row.category ? [row.category] : [],
        price,
        priceKnown: price != null,
        currency: row.currency || "RUB",
        status: row.status,
        ...src,
        href: `/project/${row.id}`,
        dataQuality: row.verification_status === "verified" ? 8 : 5,
        sourceConfidence: 5,
        updatedAt: row.updated_at,
        createdAt: row.created_at,
        rawType: row.category,
        unknownFields: unknown,
        confirmedFields: [
          "title",
          ...(row.region ? ["region"] : []),
          ...(price != null ? ["price"] : []),
          ...(row.category ? ["industry"] : []),
        ],
      });
    }
  }

  if (mapping.itemTypes.includes("opportunity")) {
    let q = db
      .from("opportunities")
      .select(
        "id,title,description,region,type,price,currency,status,created_at,updated_at,verification_status",
      )
      .eq("status", "published")
      .limit(80);
    if (mapping.opportunityTypes?.length) {
      q = q.in("type", mapping.opportunityTypes);
    }
    const { data } = await q;
    for (const row of data || []) {
      const price = num(row.price);
      const src = labelForMarketplaceSource("opportunity");
      const unknown: string[] = [];
      if (!row.region) unknown.push("region");
      if (!row.type) unknown.push("industry");
      if (price == null) unknown.push("price");
      out.push({
        id: row.id,
        itemType: "opportunity",
        title: row.title,
        summary: row.description || "",
        region: row.region,
        industry: row.type,
        industries: row.type ? [row.type] : [],
        price,
        priceKnown: price != null,
        currency: row.currency || "RUB",
        status: row.status,
        ...src,
        href: `/opportunity/${row.id}`,
        dataQuality: row.verification_status === "verified" ? 8 : 5,
        sourceConfidence: 5,
        updatedAt: row.updated_at,
        createdAt: row.created_at,
        rawType: row.type,
        unknownFields: unknown,
        confirmedFields: [
          "title",
          ...(row.region ? ["region"] : []),
          ...(price != null ? ["price"] : []),
        ],
      });
    }
  }

  if (mapping.itemTypes.includes("investment_offer")) {
    const { data } = await db
      .from("investment_offers")
      .select(
        "id,title,description,regions,categories,amount_min,amount_max,currency,status,created_at,updated_at,verification_status",
      )
      .eq("status", "published")
      .limit(80);
    for (const row of data || []) {
      const priceMin = num(row.amount_min);
      const priceMax = num(row.amount_max);
      const src = labelForMarketplaceSource("investment_offer");
      const unknown: string[] = [];
      if (!row.regions?.length) unknown.push("region");
      if (!row.categories?.length) unknown.push("industry");
      if (priceMin == null && priceMax == null) unknown.push("price");
      out.push({
        id: row.id,
        itemType: "investment_offer",
        title: row.title,
        summary: row.description || "",
        region: row.regions?.[0] || null,
        regions: row.regions || [],
        industry: row.categories?.[0] || null,
        industries: row.categories || [],
        price: priceMax ?? priceMin,
        priceMin,
        priceMax,
        priceKnown: priceMin != null || priceMax != null,
        currency: row.currency || "RUB",
        status: row.status,
        ...src,
        href: `/investment/${row.id}`,
        dataQuality: row.verification_status === "verified" ? 8 : 5,
        sourceConfidence: 5,
        updatedAt: row.updated_at,
        createdAt: row.created_at,
        unknownFields: unknown,
        confirmedFields: ["title"],
      });
    }
  }

  if (mapping.itemTypes.includes("expert")) {
    const { data } = await db
      .from("expert_profiles")
      .select(
        "id,headline,description,specialization,region,status,created_at,updated_at,verification_status",
      )
      .eq("status", "published")
      .limit(80);
    for (const row of data || []) {
      const src = labelForMarketplaceSource("expert");
      const unknown = ["price"];
      if (!row.region) unknown.push("region");
      out.push({
        id: row.id,
        itemType: "expert",
        title: row.headline || "Эксперт",
        summary: row.description || "",
        region: row.region,
        industry: row.specialization,
        industries: row.specialization ? [row.specialization] : [],
        price: null,
        priceKnown: false,
        currency: "RUB",
        status: row.status,
        ...src,
        href: `/expert/${row.id}`,
        dataQuality: row.verification_status === "verified" ? 8 : 5,
        sourceConfidence: 4,
        updatedAt: row.updated_at,
        createdAt: row.created_at,
        rawType: row.specialization,
        unknownFields: unknown,
        confirmedFields: ["title", ...(row.region ? ["region"] : [])],
      });
    }
  }

  if (mapping.itemTypes.includes("need_profile")) {
    // Only PUBLIC needs — never PRIVATE/CKR_ONLY of others
    const { data } = await db
      .from("need_profiles")
      .select(
        "id,title,description,intent_type,regions,industries,budget_min,budget_max,currency,status,visibility,created_at,updated_at",
      )
      .eq("status", "ACTIVE")
      .eq("visibility", "PUBLIC")
      .neq("id", need.id)
      .limit(80);
    for (const row of data || []) {
      const price = num(row.budget_max) ?? num(row.budget_min);
      const src = labelForMarketplaceSource("need_profile");
      const unknown: string[] = [];
      if (!row.regions?.length) unknown.push("region");
      if (!row.industries?.length) unknown.push("industry");
      if (price == null) unknown.push("price");
      out.push({
        id: row.id,
        itemType: "need_profile",
        title: row.title,
        summary: row.description || "",
        region: row.regions?.[0] || null,
        regions: row.regions || [],
        industry: row.industries?.[0] || null,
        industries: row.industries || [],
        price,
        priceKnown: price != null,
        currency: row.currency || "RUB",
        status: row.status,
        ...src,
        href: `/dashboard/needs/${row.id}`,
        dataQuality: 4,
        sourceConfidence: 3,
        updatedAt: row.updated_at,
        createdAt: row.created_at,
        rawType: row.intent_type,
        visibility: row.visibility,
        unknownFields: unknown,
        confirmedFields: ["title", "intent_type"],
      });
    }
  }

  return out;
}

let singleton: PersonalizedFeedService | null = null;

export function createMemoryPersonalizedFeedService(): PersonalizedFeedService {
  return new PersonalizedFeedService("memory");
}

export function getPersonalizedFeedService(
  modeOverride?: "memory" | "supabase",
): PersonalizedFeedService {
  const mode =
    modeOverride ??
    (hasSupabaseEnv() ? "supabase" : "memory");
  if (mode === "memory") {
    return new PersonalizedFeedService("memory");
  }
  // Prefer request-scoped user client for RLS; fall back to admin only if secret available for owner tools
  try {
    const db = createClient();
    return new PersonalizedFeedService("supabase", db);
  } catch {
    if (!hasSupabaseSecretEnv()) {
      return new PersonalizedFeedService("memory");
    }
    if (!singleton) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_SECRET_KEY!;
      singleton = new PersonalizedFeedService(
        "supabase",
        createBrowserlessAdmin(url, key, { auth: { persistSession: false } }),
      );
    }
    return singleton;
  }
}
