/**
 * Stage 2C.1 — structured enrichment orchestrator.
 * Uses safe-fetch + source-specific extractors. No CAPTCHA/auth bypass.
 */

import { LIA_OI_BUDGETS } from "@/config/lia-oi";
import { resolveBudgetFit, resolvePriceStatus } from "@/lib/lia/oi/constraints";
import { classifyContentIntent } from "@/lib/lia/oi/content-intent";
import { validateDetailOpportunity } from "@/lib/lia/oi/detail-validate";
import { normalizeAnyDate } from "@/lib/lia/oi/enrichment/dates";
import { auctionAssetExtractor } from "@/lib/lia/oi/enrichment/extractors/auction";
import { procurementExtractor } from "@/lib/lia/oi/enrichment/extractors/procurement";
import { supportProgramExtractor } from "@/lib/lia/oi/enrichment/extractors/support";
import { extractTitleTag, stripHtml } from "@/lib/lia/oi/enrichment/html";
import {
  isEnrichableDetail,
  refinePageKind,
} from "@/lib/lia/oi/enrichment/page-kind";
import type { OpportunityExtractor } from "@/lib/lia/oi/enrichment/types";
import { field } from "@/lib/lia/oi/enrichment/types";
import { isCatalogPageType } from "@/lib/lia/oi/page-type";
import {
  applyResolvedDetailToCandidatePatch,
  extractNoticeIdFromText,
  extractNoticeIdFromUrl,
  resolveProcurementDetail,
  type ProcurementConfidence,
} from "@/lib/lia/oi/procurement";
import { computeDataQualityV2 } from "@/lib/lia/oi/quality-v2";
import { safeFetch } from "@/lib/http/safe-fetch";
import type { LiaOiCandidate, LiaOiSearchPlan, LiaOiStructuredField } from "@/types/lia-oi";

const EXTRACTORS: OpportunityExtractor[] = [
  auctionAssetExtractor,
  procurementExtractor,
  supportProgramExtractor,
];

export type StructuredEnrichStats = {
  pagesFetched: number;
  pagesFetchFailed: number;
  detailConsidered: number;
  enriched: number;
  skippedNonDetail: number;
  /** Stage 4N — multi-source resolver attempts / successes */
  detailResolverAttempts?: number;
  detailResolverSuccess?: number;
};

function confidenceToLabel(c: ProcurementConfidence): string {
  switch (c) {
    case "OFFICIAL_CONFIRMED":
      return "официальный источник";
    case "MULTI_SOURCE_CONFIRMED":
      return "несколько источников";
    case "TRUSTED_SECONDARY":
      return "вторичный источник";
    case "SEARCH_ONLY":
      return "только поиск";
    default:
      return "не проверено";
  }
}

async function enrichProcurementViaResolver(
  candidate: LiaOiCandidate,
  plan?: LiaOiSearchPlan,
  primaryFetchError?: string,
): Promise<{ candidate: LiaOiCandidate; fetched: boolean; error?: string }> {
  const url = candidate.sources[0]?.url || candidate.canonicalUrl || "";
  const noticeId =
    candidate.sourceObjectId ||
    extractNoticeIdFromUrl(url) ||
    extractNoticeIdFromText(candidate.title) ||
    extractNoticeIdFromText(candidate.description);

  const mirrorUrls = [
    url,
    ...candidate.sources.map((s) => s.url).filter(Boolean),
  ].filter((u, i, arr) => u && arr.indexOf(u) === i);

  const detail = await resolveProcurementDetail({
    noticeId,
    title: candidate.title,
    url,
    mirrorUrls,
    allowLiveFetch: true,
  });

  const ok = Boolean(
    detail.sourcesUsed.length &&
      (detail.customer || detail.amount != null || detail.deadlineAt),
  );

  if (!ok) {
    const failed = scoreWithoutFetch({
      ...candidate,
      claims: [
        ...candidate.claims,
        {
          field: "page_fetch",
          value: "failed",
          kind: "UNKNOWN",
          sourceUrl: url || null,
          note: `safe-fetch: ${primaryFetchError || "fail"}; resolver: no DETAIL`,
        },
        {
          field: "detail_confidence",
          value: detail.confidence,
          kind: "INFERENCE",
          sourceUrl: url || null,
          note: detail.attempts
            .slice(0, 4)
            .map((a) => `${a.sourceId}:${a.reason || (a.ok ? "ok" : "fail")}`)
            .join("; "),
        },
      ],
    });
    return {
      candidate: failed,
      fetched: false,
      error: primaryFetchError || "resolver_unresolved",
    };
  }

  const patch = applyResolvedDetailToCandidatePatch(detail);
  const structured: LiaOiStructuredField[] = [];
  const push = (
    name: string,
    value: string | number | null | undefined,
    conf: number,
  ) => {
    if (value == null || value === "") return;
    const f = field(name, value, {
      source:
        detail.confidence === "OFFICIAL_CONFIRMED"
          ? "official_page"
          : detail.confidence === "SEARCH_ONLY"
            ? "search_snippet"
            : "trusted_secondary",
      confidence: conf,
      sourceUrl: detail.canonicalUrl || url || undefined,
      kind: "FACT",
      note: `resolver:${detail.confidence}`,
    });
    if (f) structured.push(f);
  };
  push("procurement_id", detail.noticeId, 92);
  push("customer", detail.customer, 80);
  push("nmck", detail.amount, 78);
  push("deadline_at", detail.deadlineAt, 78);
  push("region", detail.region, 70);
  push("procurement_subject", detail.subject, 75);
  push("official_url", detail.canonicalUrl, 70);

  let next: LiaOiCandidate = {
    ...candidate,
    ...(patch as Partial<LiaOiCandidate>),
    pageType: "DETAIL",
    isCatalogSource: false,
    enrichedFromFetch: true,
    isOfficialSource:
      detail.confidence === "OFFICIAL_CONFIRMED"
        ? true
        : candidate.isOfficialSource,
    lastSeenAt: new Date().toISOString(),
    structuredFields: mergeStructured(candidate.structuredFields, structured),
    claims: [
      ...candidate.claims,
      {
        field: "page_fetch",
        value: "ok_via_resolver",
        kind: "FACT",
        sourceUrl: detail.canonicalUrl,
        note: `Multi-source resolver (${confidenceToLabel(detail.confidence)}); primary: ${primaryFetchError || "n/a"}`,
      },
      {
        field: "detail_confidence",
        value: detail.confidence,
        kind: "FACT",
        sourceUrl: detail.canonicalUrl,
        note: detail.sourcesUsed.join(", "),
      },
      {
        field: "verification_label",
        value: confidenceToLabel(detail.confidence),
        kind: "FACT",
        sourceUrl: detail.canonicalUrl,
      },
    ],
    sources: candidate.sources.length
      ? candidate.sources.map((s, idx) =>
          idx === 0 && detail.canonicalUrl
            ? {
                ...s,
                url: detail.canonicalUrl!,
                name:
                  detail.confidence === "OFFICIAL_CONFIRMED"
                    ? s.name
                    : `Зеркало закупки (${detail.sourcesUsed[0] || "secondary"})`,
              }
            : s,
        )
      : candidate.sources,
  };

  const priceAmt =
    next.nmck ??
    next.currentPrice ??
    next.startingPrice ??
    next.askingPrice ??
    null;
  next.priceStatus = resolvePriceStatus(priceAmt);
  next.budgetFit = resolveBudgetFit(priceAmt, plan?.budgetMax);
  next.contentIntent = classifyContentIntent({
    url: detail.canonicalUrl || url,
    title: next.title,
    snippet: (next.description || "").slice(0, 400),
    pageType: "DETAIL",
  });

  const detailVal = validateDetailOpportunity(next);
  next = {
    ...next,
    pageType:
      detailVal.effectivePageType === "DETAIL"
        ? "DETAIL"
        : detailVal.effectivePageType,
    isCatalogSource:
      isCatalogPageType(detailVal.effectivePageType) ||
      next.contentIntent === "CATALOG",
    detailConfidence: detailVal.detailConfidence,
    detailSignals: detailVal.signals,
    missingFields: detailVal.missing,
  };
  next = applyQuality(next);
  return { candidate: next, fetched: true };
}

function pickExtractor(c: LiaOiCandidate): OpportunityExtractor | null {
  return EXTRACTORS.find((e) => e.matches(c)) ?? null;
}

function mergeStructured(
  prev: LiaOiStructuredField[] | undefined,
  next: LiaOiStructuredField[],
): LiaOiStructuredField[] {
  const map = new Map<string, LiaOiStructuredField>();
  for (const f of prev || []) map.set(f.field, f);
  for (const f of next) {
    const old = map.get(f.field);
    if (!old || f.confidence >= old.confidence) map.set(f.field, f);
  }
  return [...map.values()];
}

function applyQuality(c: LiaOiCandidate): LiaOiCandidate {
  const q = computeDataQualityV2({
    candidate: c,
    structuredFields: c.structuredFields || [],
  });
  return {
    ...c,
    dataQualityScore: q.dataQualityScore,
    matchingReadiness: q.matchingReadiness,
    confirmedFields: q.confirmedFields,
    unknownFields: q.unknownFields,
    publishabilityScore: q.publishabilityScore,
    publishabilityTier: q.publishabilityTier as LiaOiCandidate["publishabilityTier"],
    score: {
      ...c.score,
      quality: Math.max(c.score.quality, q.dataQualityScore),
      breakdown: {
        ...c.score.breakdown,
        dataCompleteness: q.dataQualityScore,
      },
    },
  };
}

/** Score quality from snippet-only fields when fetch is skipped/fails. */
export function scoreWithoutFetch(c: LiaOiCandidate): LiaOiCandidate {
  const url = c.sources[0]?.url || c.canonicalUrl || "";
  const kind = refinePageKind({
    url,
    title: c.title,
    snippet: c.description,
    adapterId: c.sourceAdapterId,
  });
  const snippetFields: LiaOiStructuredField[] = [];
  if (url) {
    const f = field("official_url", url, {
      source: c.isOfficialSource ? "search_snippet" : "unknown",
      confidence: c.isOfficialSource ? 70 : 40,
      sourceUrl: url,
      kind: c.isOfficialSource ? "FACT" : "INFERENCE",
    });
    if (f) snippetFields.push(f);
  }
  if (c.sourceObjectId) {
    const idField =
      c.opportunityType === "PROCUREMENT"
        ? "procurement_id"
        : c.opportunityType === "SUPPORT_PROGRAM"
          ? "program_id"
          : c.opportunityType === "AUCTION_ASSET"
            ? "lot_id"
            : "source_object_id";
    const f = field(idField, c.sourceObjectId, {
      source: c.isStub ? "fixture" : "search_snippet",
      confidence: c.isStub ? 90 : 65,
      sourceUrl: url,
    });
    if (f) snippetFields.push(f);
  }
  const moneyAmount =
    c.nmck ??
    c.startingPrice ??
    c.currentPrice ??
    c.supportAmount ??
    c.askingPrice ??
    (c.opportunityType === "SUPPORT_PROGRAM" ? c.investmentRequired : null);
  if (moneyAmount != null) {
    const name =
      c.priceKind === "NMCK" || c.nmck != null
        ? "nmck"
        : c.priceKind === "STARTING_AUCTION_PRICE" || c.startingPrice != null
          ? "starting_price"
          : c.priceKind === "SUPPORT_AMOUNT" ||
              c.opportunityType === "SUPPORT_PROGRAM"
            ? "support_amount"
            : "asking_price";
    const f = field(name, moneyAmount, {
      source: c.isStub ? "fixture" : "search_snippet",
      confidence: c.isStub ? 88 : 55,
      sourceUrl: url,
    });
    if (f) snippetFields.push(f);
  }
  if (c.deadlineAt) {
    const f = field("deadline_at", c.deadlineAt, {
      source: c.isStub ? "fixture" : "search_snippet",
      confidence: c.isStub ? 88 : 50,
      sourceUrl: url,
    });
    if (f) snippetFields.push(f);
  }
  if (c.region) {
    const f = field("region", c.region, {
      source: c.isStub ? "fixture" : "search_snippet",
      confidence: c.isStub ? 85 : 50,
      sourceUrl: url,
    });
    if (f) snippetFields.push(f);
  }

  const next: LiaOiCandidate = {
    ...c,
    pageType: kind.pageType,
    isCatalogSource: isCatalogPageType(kind.pageType) || c.isCatalogSource,
    structuredFields: mergeStructured(c.structuredFields, snippetFields),
    sourcePublishedAt:
      c.sourcePublishedAt ||
      normalizeAnyDate(c.sources[0]?.publishedAt) ||
      null,
  };
  return applyQuality(next);
}

export async function enrichOneCandidate(
  candidate: LiaOiCandidate,
  plan?: LiaOiSearchPlan,
): Promise<{ candidate: LiaOiCandidate; fetched: boolean; error?: string }> {
  const url = candidate.sources[0]?.url || candidate.canonicalUrl;
  if (!url) {
    return { candidate: scoreWithoutFetch(candidate), fetched: false, error: "no_url" };
  }

  const preKind = refinePageKind({
    url,
    title: candidate.title,
    snippet: candidate.description,
    adapterId: candidate.sourceAdapterId,
  });

  if (!isEnrichableDetail(preKind.pageType)) {
    return {
      candidate: scoreWithoutFetch({
        ...candidate,
        pageType: preKind.pageType,
        isCatalogSource: true,
      }),
      fetched: false,
      error: `skip_${preKind.reason}`,
    };
  }

  const fetched = await safeFetch(url, {
    timeoutMs: 8_000,
    maxBytes: 400_000,
    maxRedirects: 3,
    allowedContentTypes: ["text/html", "application/xhtml+xml", "text/plain"],
  });

  if (!fetched.ok) {
    // Stage 4N: procurement DETAIL via multi-source resolver when primary URL fails
    // (typical: zakupki.gov.ru TCP timeout from VPS).
    const isProcurement =
      candidate.opportunityType === "PROCUREMENT" ||
      candidate.sourceAdapterId === "procurement" ||
      /zakupki\.gov\.ru|star-pro\.ru|zakupki360\.ru|tektorg\.ru/i.test(url);
    if (isProcurement) {
      return enrichProcurementViaResolver(candidate, plan, fetched.code);
    }
    const failed = scoreWithoutFetch({
      ...candidate,
      claims: [
        ...candidate.claims,
        {
          field: "page_fetch",
          value: "failed",
          kind: "UNKNOWN",
          sourceUrl: url,
          note: `safe-fetch: ${fetched.code}`,
        },
      ],
    });
    return {
      candidate: failed,
      fetched: false,
      error: fetched.code,
    };
  }

  const finalUrl = fetched.finalUrl || url;
  const text = stripHtml(fetched.bodyText);
  const titleTag = extractTitleTag(fetched.bodyText);
  const postKind = refinePageKind({
    url: finalUrl,
    title: titleTag || candidate.title,
    snippet: text.slice(0, 400),
    adapterId: candidate.sourceAdapterId,
  });

  if (!isEnrichableDetail(postKind.pageType)) {
    return {
      candidate: scoreWithoutFetch({
        ...candidate,
        pageType: postKind.pageType,
        isCatalogSource: true,
        enrichedFromFetch: true,
        claims: [
          ...candidate.claims,
          {
            field: "page_fetch",
            value: "ok_non_detail",
            kind: "FACT",
            sourceUrl: finalUrl,
            note: `Fetched but classified as ${postKind.pageType}`,
          },
        ],
      }),
      fetched: true,
      error: `demoted_${postKind.reason}`,
    };
  }

  const extractor = pickExtractor(candidate);
  let structured: LiaOiStructuredField[] = [];
  let patch: Partial<LiaOiCandidate> = {};
  let claimsExtra: LiaOiCandidate["claims"] = [];

  if (extractor) {
    const result = extractor.extract({
      candidate,
      html: fetched.bodyText,
      text,
      finalUrl,
      titleTag,
    });
    structured = result.structuredFields;
    patch = result.patch;
    claimsExtra = result.claimsExtra;
  } else {
    // Generic official/detail: URL + title only, no invented money
    const uf = field("official_url", finalUrl, {
      source: "official_page",
      confidence: 70,
      sourceUrl: finalUrl,
    });
    if (uf) structured.push(uf);
    if (titleTag) {
      const tf = field("title", titleTag, {
        source: "official_page",
        confidence: 75,
        sourceUrl: finalUrl,
      });
      if (tf) {
        structured.push(tf);
        patch.title = titleTag;
      }
    }
  }

  const published =
    normalizeAnyDate(candidate.sources[0]?.publishedAt) ||
    candidate.sourcePublishedAt ||
    null;

  let next: LiaOiCandidate = {
    ...candidate,
    ...patch,
    pageType: "DETAIL",
    isCatalogSource: false,
    enrichedFromFetch: true,
    lastSeenAt: new Date().toISOString(),
    sourcePublishedAt: published,
    structuredFields: mergeStructured(candidate.structuredFields, structured),
    claims: [
      ...candidate.claims,
      {
        field: "page_fetch",
        value: "ok",
        kind: "FACT",
        sourceUrl: finalUrl,
        note: extractor
          ? `HTML via safe-fetch + ${extractor.id}`
          : "HTML via safe-fetch (generic)",
      },
      ...claimsExtra,
    ],
    sources: candidate.sources.map((s, idx) =>
      idx === 0 ? { ...s, url: finalUrl } : s,
    ),
    description:
      text.length > (candidate.description?.length || 0)
        ? text.slice(0, 600)
        : candidate.description,
  };

  const priceAmt =
    next.nmck ??
    next.currentPrice ??
    next.startingPrice ??
    next.supportAmount ??
    next.askingPrice ??
    next.investmentRequired ??
    null;
  next.priceStatus = resolvePriceStatus(priceAmt);
  next.budgetFit = resolveBudgetFit(priceAmt, plan?.budgetMax);
  next.contentIntent = classifyContentIntent({
    url: finalUrl,
    title: next.title,
    snippet: next.description.slice(0, 400),
    pageType: "DETAIL",
  });

  const detail = validateDetailOpportunity(next);
  next = {
    ...next,
    pageType: detail.effectivePageType === "DETAIL" ? "DETAIL" : detail.effectivePageType,
    isCatalogSource:
      isCatalogPageType(detail.effectivePageType) ||
      next.contentIntent === "CATALOG",
    detailConfidence: detail.detailConfidence,
    detailSignals: detail.signals,
    missingFields: detail.missing,
  };

  next = applyQuality(next);
  return { candidate: next, fetched: true };
}

/**
 * Enrich DETAIL candidates (Serper + specialized), with fetch budget.
 */
export async function enrichStructuredCandidates(
  candidates: LiaOiCandidate[],
  plan?: LiaOiSearchPlan,
): Promise<{ candidates: LiaOiCandidate[]; stats: StructuredEnrichStats }> {
  const max = LIA_OI_BUDGETS.maxFetchesPerRun;
  const stats: StructuredEnrichStats = {
    pagesFetched: 0,
    pagesFetchFailed: 0,
    detailConsidered: 0,
    enriched: 0,
    skippedNonDetail: 0,
    detailResolverAttempts: 0,
    detailResolverSuccess: 0,
  };

  // Always score everyone from available fields first
  const working = candidates.map(scoreWithoutFetch);

  const detailIdx = working
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => {
      const k = refinePageKind({
        url: c.sources[0]?.url || c.canonicalUrl || "",
        title: c.title,
        snippet: c.description,
        adapterId: c.sourceAdapterId,
      });
      return k.isDetail && !c.isStub;
    })
    .sort((a, b) => {
      // Prefer official specialized adapters
      const ao = a.c.isOfficialSource ? 1 : 0;
      const bo = b.c.isOfficialSource ? 1 : 0;
      if (ao !== bo) return bo - ao;
      return (b.c.score.overall || 0) - (a.c.score.overall || 0);
    })
    .slice(0, max);

  stats.detailConsidered = detailIdx.length;
  stats.skippedNonDetail = working.length - detailIdx.length;

  for (const { c, i } of detailIdx) {
    const result = await enrichOneCandidate(c, plan);
    working[i] = result.candidate;
    const viaResolver = result.candidate.claims?.some(
      (cl) =>
        cl.field === "page_fetch" &&
        String(cl.value).includes("resolver"),
    );
    if (viaResolver) stats.detailResolverAttempts = (stats.detailResolverAttempts || 0) + 1;
    if (result.fetched) {
      stats.pagesFetched += 1;
      if (result.candidate.enrichedFromFetch) stats.enriched += 1;
      if (viaResolver) {
        stats.detailResolverSuccess = (stats.detailResolverSuccess || 0) + 1;
      }
    } else if (result.error && result.error.startsWith("skip_")) {
      /* already counted as non-detail-ish */
    } else {
      stats.pagesFetchFailed += 1;
    }
  }

  return { candidates: working, stats };
}
