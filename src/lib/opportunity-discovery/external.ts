/**
 * Stage 4O — external discovery (PASS 2–4), owner-controlled.
 * Reuses LIA OI pipeline. Never auto-publish. Never auto-outreach.
 */

import {
  externalProvenance,
  rowToBaseCandidate,
  isNoiseRealness,
} from "@/lib/opportunity-discovery/candidate";
import type {
  DiscoveryCandidate,
  InternalCatalogRow,
  OpportunitySearchContext,
  ProvenanceTrust,
} from "@/lib/opportunity-discovery/types";
import { scoreInternalRow } from "@/lib/opportunity-discovery/scoring";
import type { LiaOiCandidate } from "@/types/lia-oi";

export type ExternalSearchHooks = {
  /** Injected for tests — returns OI-like candidates without network. */
  search?: (query: string, ctx: OpportunitySearchContext) => Promise<LiaOiCandidate[]>;
};

function mapOiTrust(c: LiaOiCandidate): ProvenanceTrust {
  if (c.isOfficialSource) return "official";
  const src = `${c.sourceAdapterId || ""} ${c.opportunityType || ""} ${c.pageType || ""} ${c.canonicalUrl || ""}`.toLowerCase();
  if (/official|eis|gov|zakupki\.gov/.test(src)) return "official";
  if (/open.?data|opendata/.test(src)) return "government_open";
  if (/region|минэк|инвестпортал|regional/.test(src)) return "regional_portal";
  if (/trusted|mirror|aggregat|zakupki360|star-pro|procurement/.test(src))
    return "trusted_secondary";
  if (/snippet|serper|web/.test(src)) return "search_snippet";
  return "general_web";
}

function mapOiPass(
  trust: ProvenanceTrust,
): DiscoveryCandidate["pass"] {
  if (trust === "official" || trust === "government_open") return "OFFICIAL";
  if (
    trust === "trusted_secondary" ||
    trust === "regional_portal" ||
    trust === "company_website"
  ) {
    return "TRUSTED_SECONDARY";
  }
  return "GENERAL_WEB";
}

export function oiCandidateToDiscovery(
  c: LiaOiCandidate,
  ctx: OpportunitySearchContext,
): DiscoveryCandidate {
  const row: InternalCatalogRow = {
    entityType: "lia_oi",
    id: c.id,
    title: c.title,
    summary: c.description || "",
    region: c.region || null,
    amount: c.nmck ?? c.askingPrice ?? null,
    deadline: c.deadlineAt || null,
    organization: c.customer || null,
    url: c.canonicalUrl || null,
    href: `/admin/owner/lia/opportunities/${c.id}`,
    sourceType: c.opportunityType || c.pageType || "",
    noticeId: c.sourceObjectId || null,
    fingerprint: c.fingerprint || null,
    isStub: Boolean(c.isStub),
    status: "owner_only",
  };
  const score = scoreInternalRow(row, ctx);
  const trust = mapOiTrust(c);
  return rowToBaseCandidate(row, {
    suitability: score.suitability,
    whyRelevant: score.why.length
      ? score.why
      : ["Внешний сигнал — требует проверки владельцем"],
    confidence: Math.min(score.confidence, 7),
    quality: score.quality,
    pass: mapOiPass(trust),
    provenance: externalProvenance({
      trust,
      kind: c.isStub ? "UNKNOWN" : "INFERENCE",
      url: c.canonicalUrl,
      adapterId: c.sourceAdapterId || "lia_oi",
    }),
    visibility: "OWNER_ONLY",
  });
}

/**
 * Run external search only when explicitly requested.
 * Live path uses demand discovery / OI pipeline.
 */
export async function runExternalSearch(
  ctx: OpportunitySearchContext,
  opts: {
    primaryQuery: string;
    userId: string;
    hooks?: ExternalSearchHooks;
    maxCandidates?: number;
  },
): Promise<{
  candidates: DiscoveryCandidate[];
  externalQueries: number;
  newFromPipeline: number;
}> {
  if (opts.hooks?.search) {
    const found = await opts.hooks.search(opts.primaryQuery, ctx);
    const candidates = found
      .map((c) => oiCandidateToDiscovery(c, ctx))
      .filter((c) => !isNoiseRealness(c.realness))
      .slice(0, opts.maxCandidates ?? 40);
    return {
      candidates,
      externalQueries: 1,
      newFromPipeline: candidates.length,
    };
  }

  // Live: reuse Stage 4M demand discovery wrapper when need-like context exists.
  const { runOwnerSearchPipeline } = await import("@/lib/lia/oi/pipeline");
  const { listCandidates } = await import("@/lib/lia/oi/store");

  const before = await listCandidates();
  const beforeIds = new Set(before.map((c) => c.id));

  await runOwnerSearchPipeline({
    query: opts.primaryQuery,
    userId: opts.userId,
    need: {
      intentType: (ctx.intent || "OTHER") as import("@/types/need-profile").NeedIntentType,
      regions: ctx.region ? [ctx.region] : [],
      industries: ctx.industry ? [ctx.industry] : [],
      budgetMax: ctx.budgetMax,
      budgetMin: ctx.budgetMin,
      title: ctx.freeText || ctx.intent || "discovery",
    },
    regionalFirst: true,
  });

  const after = await listCandidates();
  const fresh = after.filter((c) => !beforeIds.has(c.id));
  const pool = fresh.length ? fresh : after;
  const candidates = pool
    .map((c) => oiCandidateToDiscovery(c, ctx))
    .filter((c) => !isNoiseRealness(c.realness))
    .slice(0, opts.maxCandidates ?? 40);

  return {
    candidates,
    externalQueries: 1,
    newFromPipeline: fresh.length,
  };
}
