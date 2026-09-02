/**
 * Stage 4Q.4 — bounded DETAIL FACT acquisition.
 * Search snippet is a discovery candidate, not a FACT.
 * Reuses LIA OI resolvers/extractors + safeFetch. No general-purpose scrape stack.
 * Each resolution consumes the shared own-ideas run budget.
 */
import { CKR_OWN_IDEAS_BUDGETS } from "@/config/ckr-own-ideas";
import {
  canConsumeExternal,
  canConsumeResolution,
  consumeExternal,
  getActiveOwnIdeaBudget,
  requestTimeoutMs,
  runWithOwnIdeaBudget,
  type OwnIdeaRunBudget,
} from "@/lib/ckr-own-ideas/run-budget";
import {
  classifyOwnIdeaPageType,
  extractOfficialFromAggregator,
  isExpiredOpportunity,
  isIdeaFactPageType,
  normalizeOwnIdeaGeo,
} from "@/lib/ckr-own-ideas/quality-gate";
import { isGenericFinancingPage } from "@/lib/ckr-own-ideas/live-catalog-guards";
import { auctionAssetExtractor } from "@/lib/lia/oi/enrichment/extractors/auction";
import { supportProgramExtractor } from "@/lib/lia/oi/enrichment/extractors/support";
import { extractTitleTag, stripHtml } from "@/lib/lia/oi/enrichment/html";
import { isEnrichableDetail, refinePageKind } from "@/lib/lia/oi/enrichment/page-kind";
import { safeFetch, type SafeFetchResult } from "@/lib/http/safe-fetch";
import {
  applyResolvedDetailToCandidatePatch,
  extractNoticeIdFromText,
  extractNoticeIdFromUrl,
  resolveProcurementDetail,
  type ResolvedProcurementDetail,
} from "@/lib/lia/oi/procurement";
import type { LiaOiCandidate, LiaOiStructuredField } from "@/types/lia-oi";
import type {
  OwnIdeaCandidateDiagnostic,
  OwnIdeaClaimKind,
  OwnIdeaFactField,
  OwnIdeaVerificationStatus,
} from "@/types/ckr-own-ideas";

const AGGREGATOR_HOST =
  /(^|\.)(star-pro\.ru|zakupki360\.ru|tektorg\.ru|rts-tender\.ru|sberbank-ast\.ru)(\/|$)/i;

const OFFICIAL_DETAIL =
  /zakupki\.gov\.ru\/epz\/order\/notice\/.+\/view|torgi\.gov\.ru\/new\/public\/lots\/lot\/|bankrot\.fedresurs\.ru\/Trade\/|fedresurs\.ru\/.+\/.+/i;

export type OwnIdeaAcquireStats = {
  discoveryCandidates: number;
  detailResolutionAttempts: number;
  officialDetailsResolved: number;
  aggregatorCandidates: number;
  aggregatorToOfficialResolved: number;
  detailValidationRejected: number;
  liveFacts: number;
  budgetExhausted: boolean;
};

export function sanitizeDiagnosticUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.hash = "";
    u.username = "";
    u.password = "";
    for (const key of [...u.searchParams.keys()]) {
      if (/key|token|secret|auth|password|api/i.test(key)) u.searchParams.delete(key);
    }
    return u.toString();
  } catch {
    return url.slice(0, 240);
  }
}

export function isResolvableDiscoveryCandidate(candidate: LiaOiCandidate): boolean {
  if (isExpiredOpportunity({ deadlineAt: candidate.deadlineAt, status: candidate.auctionStatus || candidate.procurementStage })) {
    return false;
  }
  const url = candidate.canonicalUrl || candidate.sources?.[0]?.url || "";
  const pageType = classifyOwnIdeaPageType({
    url,
    title: candidate.title,
    snippet: candidate.description || candidate.summary,
    liaPageType: candidate.pageType,
    isCatalogSource: candidate.isCatalogSource,
  });
  if (isIdeaFactPageType(pageType)) return true;
  return Boolean(
    extractOfficialFromAggregator({
      url,
      title: candidate.title,
      snippet: candidate.description,
      officialId: candidate.sourceObjectId,
    }),
  );
}

function diagnosticOf(input: {
  candidate: LiaOiCandidate;
  pageType?: string | null;
  attempted: boolean;
  officialUrl?: string | null;
  finalState: OwnIdeaCandidateDiagnostic["finalState"];
  reason: string | null;
}): OwnIdeaCandidateDiagnostic {
  const url = input.candidate.canonicalUrl || input.candidate.sources?.[0]?.url || null;
  return {
    sourceDomain: hostOfUrl(url),
    candidateUrl: sanitizeDiagnosticUrl(url),
    pageType: input.pageType ?? input.candidate.pageType ?? null,
    region: input.candidate.region || input.candidate.city || null,
    resolutionAttempted: input.attempted,
    officialUrl: sanitizeDiagnosticUrl(input.officialUrl ?? null),
    finalState: input.finalState,
    reason: input.reason,
  };
}

export type OwnIdeaResolveDetailHook = (candidate: LiaOiCandidate) => Promise<LiaOiCandidate | null>;

export function emptyAcquireStats(): OwnIdeaAcquireStats {
  return {
    discoveryCandidates: 0,
    detailResolutionAttempts: 0,
    officialDetailsResolved: 0,
    aggregatorCandidates: 0,
    aggregatorToOfficialResolved: 0,
    detailValidationRejected: 0,
    liveFacts: 0,
    budgetExhausted: false,
  };
}

export function hostOfUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function isAggregatorHost(url?: string | null): boolean {
  const host = hostOfUrl(url);
  return Boolean(host && AGGREGATOR_HOST.test(host));
}

export function isOfficialDetailUrl(url?: string | null): boolean {
  return Boolean(url && OFFICIAL_DETAIL.test(url));
}

export function isDiscoverySnippet(c: LiaOiCandidate): boolean {
  if (c.enrichedFromFetch) return false;
  if (c.dataChannel === "OFFICIAL_API") return false;
  if (c.dataChannel === "SERPER_DISCOVERY") return true;
  if (c.dataChannel === "FIXTURE_DEMO") return false;
  return false;
}

export function alreadyResolvedOfficial(c: LiaOiCandidate): boolean {
  if (c.isStub || c.isCatalogSource) return false;
  if (isDiscoverySnippet(c)) return false;
  const url = c.canonicalUrl || c.sources?.[0]?.url || "";
  if (c.dataChannel === "OFFICIAL_API" && url) return true;
  if (!c.isOfficialSource && !isOfficialDetailUrl(url)) return false;
  const page = classifyOwnIdeaPageType({
    url,
    title: c.title,
    snippet: c.description || c.summary,
    liaPageType: c.pageType,
    isCatalogSource: c.isCatalogSource,
  });
  return page === "DETAIL";
}

export function discoveryRegionRank(region?: string | null): number {
  const geo = normalizeOwnIdeaGeo(region);
  if (geo.subject === "dagestan" || geo.city === "dagestan") return 0;
  if (geo.federalDistrict === "skfo") return 1;
  if (geo.subject || geo.city) return 2;
  if (geo.country === "ru") return 3;
  return 4;
}

export function isGenericRussiaRegion(region?: string | null): boolean {
  const geo = normalizeOwnIdeaGeo(region);
  return geo.country === "ru" && !geo.subject && !geo.city && !geo.federalDistrict;
}

export function rankDiscoveryCandidates(candidates: LiaOiCandidate[]): LiaOiCandidate[] {
  return [...candidates].sort((a, b) => {
    const ra = discoveryRegionRank(a.region || a.city || a.address);
    const rb = discoveryRegionRank(b.region || b.city || b.address);
    if (ra !== rb) return ra - rb;
    const aOff = isOfficialDetailUrl(a.canonicalUrl || a.sources?.[0]?.url) ? 0 : 1;
    const bOff = isOfficialDetailUrl(b.canonicalUrl || b.sources?.[0]?.url) ? 0 : 1;
    return aOff - bOff;
  });
}

export function factField(input: {
  field: string;
  value: string | number | null | undefined;
  sourceUrl?: string | null;
  canonicalUrl?: string | null;
  fetchedAt?: string | null;
  publishedAt?: string | null;
  sourceType: string;
  confidence: number;
  verificationStatus: OwnIdeaVerificationStatus;
  kind?: OwnIdeaClaimKind;
}): OwnIdeaFactField | null {
  if (input.value == null || input.value === "") return null;
  const sourceUrl = input.sourceUrl ?? null;
  return {
    field: input.field,
    value: input.value,
    sourceUrl,
    canonicalUrl: input.canonicalUrl ?? sourceUrl,
    sourceDomain: hostOfUrl(sourceUrl),
    fetchedAt: input.fetchedAt ?? null,
    publishedAt: input.publishedAt ?? null,
    sourceType: input.sourceType,
    confidence: input.confidence,
    verificationStatus: input.verificationStatus,
    kind: input.kind ?? "FACT",
  };
}

export function structuredToFactFields(
  fields: LiaOiStructuredField[] | undefined,
  canonicalUrl: string | null,
  fetchedAt: string | null,
  publishedAt: string | null,
): OwnIdeaFactField[] {
  const out: OwnIdeaFactField[] = [];
  for (const f of fields || []) {
    const snippet = f.source === "search_snippet";
    const mapped = factField({
      field: f.field,
      value: f.value,
      sourceUrl: f.sourceUrl || canonicalUrl,
      canonicalUrl,
      fetchedAt,
      publishedAt,
      sourceType: f.source,
      confidence: f.confidence,
      verificationStatus: snippet ? "UNVERIFIED" : "VERIFIED",
      kind: snippet ? "INFERENCE" : f.kind === "UNKNOWN" ? "UNKNOWN" : f.kind === "INFERENCE" ? "INFERENCE" : "FACT",
    });
    if (mapped) out.push(mapped);
  }
  return out;
}

export function hasVerifiedFactFields(fields?: OwnIdeaFactField[] | null): boolean {
  return Boolean(fields?.some((f) => f.kind === "FACT" && f.verificationStatus === "VERIFIED"));
}

function mergeCandidate(base: LiaOiCandidate, patch: Partial<LiaOiCandidate>): LiaOiCandidate {
  return { ...base, ...patch };
}

function applyProcurementDetail(base: LiaOiCandidate, detail: ResolvedProcurementDetail): LiaOiCandidate {
  const patch = applyResolvedDetailToCandidatePatch(detail) as Partial<LiaOiCandidate>;
  const fetchedAt = detail.fetchedAt;
  const structured: LiaOiStructuredField[] = (detail.facts || []).map((f) => ({
    field: f.field,
    value: f.value,
    source: f.trust === "official_eis" ? "official_api" : f.trust === "trusted_secondary" ? "official_page" : "search_snippet",
    confidence: f.trust === "official_eis" ? 95 : f.trust === "trusted_secondary" ? 80 : 45,
    kind: f.kind,
    sourceUrl: f.sourceUrl || undefined,
  }));
  return mergeCandidate(base, {
    ...patch,
    structuredFields: [...(base.structuredFields || []), ...structured],
    isOfficialSource: detail.confidence === "OFFICIAL_CONFIRMED" || base.isOfficialSource,
    canonicalUrl: detail.officialUrl || detail.canonicalUrl || base.canonicalUrl,
    enrichedFromFetch: Boolean(detail.sourcesUsed.length) || base.enrichedFromFetch,
    lastSeenAt: fetchedAt,
  });
}

async function fetchOfficialPage(
  url: string,
  budget: OwnIdeaRunBudget,
): Promise<SafeFetchResult | null> {
  if (!canConsumeResolution(budget) && !canConsumeExternal(budget)) return null;
  const als = getActiveOwnIdeaBudget();
  if (!als) {
    if (!consumeExternal(budget, "catalog")) return null;
  }
  const res = await safeFetch(url, {
    timeoutMs: als ? requestTimeoutMs(als, 8_000, "resolution") : 8_000,
    maxBytes: 400_000,
    maxRedirects: 3,
    allowedContentTypes: ["text/html", "application/xhtml+xml", "text/plain"],
  });
  return res.ok ? res : null;
}

function extractWithExisting(
  candidate: LiaOiCandidate,
  html: string,
  finalUrl: string,
): LiaOiCandidate {
  const text = stripHtml(html);
  const titleTag = extractTitleTag(html);
  const extractor = [auctionAssetExtractor, supportProgramExtractor].find((e) => e.matches(candidate));
  if (!extractor) {
    return mergeCandidate(candidate, {
      canonicalUrl: finalUrl,
      enrichedFromFetch: true,
      pageType: "DETAIL",
    });
  }
  const result = extractor.extract({
    candidate,
    html,
    text,
    finalUrl,
    titleTag,
  });
  return mergeCandidate(candidate, {
    ...result.patch,
    canonicalUrl: finalUrl,
    enrichedFromFetch: true,
    pageType: "DETAIL",
    structuredFields: [...(candidate.structuredFields || []), ...result.structuredFields],
    claims: [...(candidate.claims || []), ...result.claimsExtra],
  });
}

export async function resolveDiscoveryCandidate(
  candidate: LiaOiCandidate,
  budget: OwnIdeaRunBudget,
  hooks?: { resolveDetail?: OwnIdeaResolveDetailHook },
): Promise<{
  candidate: LiaOiCandidate | null;
  stats: Partial<OwnIdeaAcquireStats>;
  diagnostic: OwnIdeaCandidateDiagnostic;
}> {
  const stats: Partial<OwnIdeaAcquireStats> = {};
  const url = candidate.canonicalUrl || candidate.sources?.[0]?.url || "";
  const pageType = classifyOwnIdeaPageType({
    url,
    title: candidate.title,
    snippet: candidate.description || candidate.summary,
    liaPageType: candidate.pageType,
    isCatalogSource: candidate.isCatalogSource,
  });

  if (isAggregatorHost(url) || (pageType === "MIRROR" && !isOfficialDetailUrl(url))) {
    stats.aggregatorCandidates = 1;
  }

  if (
    !isIdeaFactPageType(pageType) &&
    !extractOfficialFromAggregator({
      url,
      title: candidate.title,
      snippet: candidate.description,
      officialId: candidate.sourceObjectId,
    })
  ) {
    stats.detailValidationRejected = 1;
    const reason = !url ? "NO_DETAIL_URL" : pageType === "LISTING" || pageType === "SEARCH_RESULTS" ? "NO_DETAIL_URL" : "VALIDATION_FAILED";
    return {
      candidate: null,
      stats,
      diagnostic: diagnosticOf({ candidate, pageType, attempted: false, finalState: "REJECT", reason }),
    };
  }

  if (alreadyResolvedOfficial(candidate)) {
    stats.officialDetailsResolved = isOfficialDetailUrl(url) || candidate.dataChannel === "OFFICIAL_API" ? 1 : 0;
    return {
      candidate,
      stats,
      diagnostic: diagnosticOf({
        candidate,
        pageType,
        attempted: false,
        officialUrl: url,
        finalState: "INFERENCE",
        reason: null,
      }),
    };
  }

  if (!canConsumeExternal(budget) && !canConsumeResolution(budget)) {
    stats.budgetExhausted = true;
    return {
      candidate: null,
      stats,
      diagnostic: diagnosticOf({ candidate, pageType, attempted: false, finalState: "REJECT", reason: "BUDGET_EXHAUSTED" }),
    };
  }

  if (hooks?.resolveDetail) {
    if (!consumeExternal(budget, "catalog")) {
      stats.budgetExhausted = true;
      return {
        candidate: null,
        stats,
        diagnostic: diagnosticOf({ candidate, pageType, attempted: false, finalState: "REJECT", reason: "BUDGET_EXHAUSTED" }),
      };
    }
    stats.detailResolutionAttempts = 1;
    const resolved = await hooks.resolveDetail(candidate);
    if (!resolved) {
      stats.detailValidationRejected = 1;
      return {
        candidate: null,
        stats,
        diagnostic: diagnosticOf({ candidate, pageType, attempted: true, finalState: "REJECT", reason: "VALIDATION_FAILED" }),
      };
    }
    const resolvedUrl = resolved.canonicalUrl || resolved.sources?.[0]?.url;
    if (isAggregatorHost(url) && isOfficialDetailUrl(resolvedUrl)) {
      stats.aggregatorToOfficialResolved = 1;
    }
    if (isOfficialDetailUrl(resolvedUrl) || resolved.dataChannel === "OFFICIAL_API") {
      stats.officialDetailsResolved = 1;
    }
    return {
      candidate: { ...resolved, enrichedFromFetch: true },
      stats,
      diagnostic: diagnosticOf({
        candidate: resolved,
        pageType: "DETAIL",
        attempted: true,
        officialUrl: resolvedUrl,
        finalState: "INFERENCE",
        reason: null,
      }),
    };
  }

  const extracted = extractOfficialFromAggregator({
    url,
    title: candidate.title,
    snippet: candidate.description,
    officialId: candidate.sourceObjectId,
  });
  const officialUrl = extracted?.url || (isOfficialDetailUrl(url) ? url : null);
  const isProcurement =
    candidate.opportunityType === "PROCUREMENT" ||
    candidate.sourceAdapterId === "procurement" ||
    /zakupki\.gov\.ru|star-pro\.ru|zakupki360\.ru|tektorg\.ru/i.test(url);

  if (isProcurement && (extracted?.id || extractNoticeIdFromUrl(url) || extractNoticeIdFromText(candidate.title))) {
    const als = getActiveOwnIdeaBudget();
    if (!als && !consumeExternal(budget, "catalog")) {
      stats.budgetExhausted = true;
      return {
        candidate: null,
        stats,
        diagnostic: diagnosticOf({ candidate, pageType, attempted: false, finalState: "REJECT", reason: "BUDGET_EXHAUSTED" }),
      };
    }
    stats.detailResolutionAttempts = 1;
    let fetches = 0;
    const detail = await resolveProcurementDetail({
      noticeId: extracted?.id || candidate.sourceObjectId,
      title: candidate.title,
      url: officialUrl || url,
      mirrorUrls: [url, officialUrl].filter(Boolean) as string[],
      allowLiveFetch: true,
      fetchImpl: async (target, opts) => {
        fetches += 1;
        if (fetches > 2) {
          return { ok: false, error: "budget_external", code: "network" };
        }
        return safeFetch(target, {
          ...opts,
          timeoutMs: als ? requestTimeoutMs(als, opts?.timeoutMs ?? 8_000, "resolution") : opts?.timeoutMs,
        });
      },
    });
    const ok = Boolean(detail.sourcesUsed.length && (detail.customer || detail.amount != null || detail.deadlineAt || detail.officialUrl));
    if (!ok) {
      stats.detailValidationRejected = 1;
      const reason = detail.sourcesUsed.length ? "INSUFFICIENT_FIELDS" : "OFFICIAL_SOURCE_UNREACHABLE";
      return {
        candidate: null,
        stats,
        diagnostic: diagnosticOf({ candidate, pageType, attempted: true, officialUrl, finalState: "REJECT", reason }),
      };
    }
    if (isAggregatorHost(url) && (detail.officialUrl || isOfficialDetailUrl(detail.canonicalUrl))) {
      stats.aggregatorToOfficialResolved = 1;
    }
    if (detail.confidence === "OFFICIAL_CONFIRMED" || detail.officialUrl) {
      stats.officialDetailsResolved = 1;
    }
    return {
      candidate: applyProcurementDetail(candidate, detail),
      stats,
      diagnostic: diagnosticOf({
        candidate,
        pageType: "DETAIL",
        attempted: true,
        officialUrl: detail.officialUrl || detail.canonicalUrl,
        finalState: "INFERENCE",
        reason: null,
      }),
    };
  }

  const targetUrl = officialUrl || url;
  if (!targetUrl) {
    stats.detailValidationRejected = 1;
    return {
      candidate: null,
      stats,
      diagnostic: diagnosticOf({ candidate, pageType, attempted: false, finalState: "REJECT", reason: "NO_DETAIL_URL" }),
    };
  }

  const preKind = refinePageKind({
    url: targetUrl,
    title: candidate.title,
    snippet: candidate.description,
    adapterId: candidate.sourceAdapterId,
  });
  if (!isEnrichableDetail(preKind.pageType) && !isOfficialDetailUrl(targetUrl)) {
    stats.detailValidationRejected = 1;
    return {
      candidate: null,
      stats,
      diagnostic: diagnosticOf({ candidate, pageType, attempted: false, finalState: "REJECT", reason: "VALIDATION_FAILED" }),
    };
  }

  stats.detailResolutionAttempts = 1;
  const fetched = await fetchOfficialPage(targetUrl, budget);
  if (!fetched) {
    stats.detailValidationRejected = 1;
    stats.budgetExhausted = !canConsumeExternal(budget);
    const reason = stats.budgetExhausted ? "BUDGET_EXHAUSTED" : "HTTP_ERROR";
    return {
      candidate: null,
      stats,
      diagnostic: diagnosticOf({ candidate, pageType, attempted: true, officialUrl: targetUrl, finalState: "REJECT", reason }),
    };
  }

  const finalUrl = fetched.finalUrl || targetUrl;
  const postKind = refinePageKind({
    url: finalUrl,
    title: extractTitleTag(fetched.bodyText) || candidate.title,
    snippet: stripHtml(fetched.bodyText).slice(0, 400),
    adapterId: candidate.sourceAdapterId,
  });
  if (!isEnrichableDetail(postKind.pageType) && !isOfficialDetailUrl(finalUrl)) {
    stats.detailValidationRejected = 1;
    return {
      candidate: null,
      stats,
      diagnostic: diagnosticOf({ candidate, pageType, attempted: true, officialUrl: finalUrl, finalState: "REJECT", reason: "VALIDATION_FAILED" }),
    };
  }

  if (candidate.opportunityType === "SUPPORT_PROGRAM" && isGenericFinancingPage({ url: finalUrl, title: candidate.title })) {
    stats.detailValidationRejected = 1;
    return {
      candidate: null,
      stats,
      diagnostic: diagnosticOf({ candidate, pageType, attempted: true, officialUrl: finalUrl, finalState: "REJECT", reason: "INSUFFICIENT_FIELDS" }),
    };
  }

  const enriched = extractWithExisting(candidate, fetched.bodyText, finalUrl);
  if (isOfficialDetailUrl(finalUrl)) stats.officialDetailsResolved = 1;
  if (isAggregatorHost(url) && isOfficialDetailUrl(finalUrl)) stats.aggregatorToOfficialResolved = 1;
  return {
    candidate: enriched,
    stats,
    diagnostic: diagnosticOf({
      candidate: enriched,
      pageType: "DETAIL",
      attempted: true,
      officialUrl: finalUrl,
      finalState: "INFERENCE",
      reason: null,
    }),
  };
}

export async function acquireOwnIdeaDetails(
  candidates: LiaOiCandidate[],
  budget: OwnIdeaRunBudget,
  hooks?: { resolveDetail?: OwnIdeaResolveDetailHook },
): Promise<{
  candidates: LiaOiCandidate[];
  stats: OwnIdeaAcquireStats;
  diagnostics: OwnIdeaCandidateDiagnostic[];
}> {
  const run = async () => {
    const stats = emptyAcquireStats();
    stats.discoveryCandidates = candidates.length;
    const ranked = rankDiscoveryCandidates(candidates);
    const kept: LiaOiCandidate[] = [];
    const diagnostics: OwnIdeaCandidateDiagnostic[] = [];

    for (const c of ranked) {
      if (isExpiredOpportunity({ deadlineAt: c.deadlineAt, status: c.auctionStatus || c.procurementStage })) {
        stats.detailValidationRejected += 1;
        diagnostics.push(
          diagnosticOf({
            candidate: c,
            pageType: classifyOwnIdeaPageType({
              url: c.canonicalUrl || c.sources?.[0]?.url,
              title: c.title,
              snippet: c.description || c.summary,
              liaPageType: c.pageType,
              isCatalogSource: c.isCatalogSource,
            }),
            attempted: false,
            finalState: "REJECT",
            reason: "EXPIRED",
          }),
        );
        continue;
      }
      const { candidate, stats: step, diagnostic } = await resolveDiscoveryCandidate(c, budget, hooks);
      stats.detailResolutionAttempts += step.detailResolutionAttempts ?? 0;
      stats.officialDetailsResolved += step.officialDetailsResolved ?? 0;
      stats.aggregatorCandidates += step.aggregatorCandidates ?? 0;
      stats.aggregatorToOfficialResolved += step.aggregatorToOfficialResolved ?? 0;
      stats.detailValidationRejected += step.detailValidationRejected ?? 0;
      if (step.budgetExhausted) stats.budgetExhausted = true;
      diagnostics.push(diagnostic);
      if (candidate) kept.push(candidate);
    }

    return {
      candidates: kept,
      stats,
      diagnostics: diagnostics.slice(0, CKR_OWN_IDEAS_BUDGETS.maxCandidateDiagnostics),
    };
  };
  if (getActiveOwnIdeaBudget()) return run();
  return runWithOwnIdeaBudget(budget, run);
}

export function addStats(a: OwnIdeaAcquireStats, b: OwnIdeaAcquireStats): OwnIdeaAcquireStats {
  return {
    discoveryCandidates: a.discoveryCandidates + b.discoveryCandidates,
    detailResolutionAttempts: a.detailResolutionAttempts + b.detailResolutionAttempts,
    officialDetailsResolved: a.officialDetailsResolved + b.officialDetailsResolved,
    aggregatorCandidates: a.aggregatorCandidates + b.aggregatorCandidates,
    aggregatorToOfficialResolved: a.aggregatorToOfficialResolved + b.aggregatorToOfficialResolved,
    detailValidationRejected: a.detailValidationRejected + b.detailValidationRejected,
    liveFacts: a.liveFacts + b.liveFacts,
    budgetExhausted: a.budgetExhausted || b.budgetExhausted,
  };
}
