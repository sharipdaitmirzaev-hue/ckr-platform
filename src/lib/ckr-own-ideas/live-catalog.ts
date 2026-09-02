/**
 * Stage 4Q.2 / 4Q.3 / 4Q.4.1 — live OwnIdeaCatalog from LIA OI adapters.
 * No fixture fallback in owner/production. 0 signals is valid.
 * MANUAL RUN only. No Scheduler.
 * Stage 4Q.3: page-type / detail / expired gates before pairing.
 * Stage 4Q.4.1: interleaved discovery → DETAIL with reserved budget.
 */
import { randomUUID } from "node:crypto";
import { CKR_OWN_IDEAS_BUDGETS } from "@/config/ckr-own-ideas";
import { isOwnIdeasProductionEnv } from "@/lib/ckr-own-ideas/store";
import {
  isGenericFinancingPage,
  isPlaceholderSource,
} from "@/lib/ckr-own-ideas/live-catalog-guards";
import {
  candidateToGateFields,
  classifyFinanceKind,
  classifyOwnIdeaPageType,
  extractOfficialFromAggregator,
  isExpiredOpportunity,
  isIdeaFactPageType,
  normalizeOwnIdeaGeo,
  sourceQualityOf,
  validateDetailFields,
} from "@/lib/ckr-own-ideas/quality-gate";
import {
  canConsumeSearch,
  consumeActualHttp,
  consumeSearch,
  createOwnIdeaRunBudget,
  markResolvableCandidate,
  runWithOwnIdeaBudget,
  setOwnIdeaBudgetPhase,
  shouldStopDiscoveryForReserve,
  snapshotBudget,
  type OwnIdeaRunBudget,
} from "@/lib/ckr-own-ideas/run-budget";
import { isOiLiveConfigured, resolveOiSearchMode } from "@/lib/lia/oi/mode";
import { listSourceAdapters } from "@/lib/lia/oi/sources/registry";
import type {
  LiaOiSearchIntent,
  LiaOiSearchPlan,
  LiaOiCandidate,
  LiaOiSourceClass,
} from "@/types/lia-oi";
import type { LiaOiSourceAdapterQuery } from "@/lib/lia/oi/sources/types";
import {
  acquireOwnIdeaDetails,
  alreadyResolvedOfficial,
  emptyAcquireStats,
  factField,
  hasVerifiedFactFields,
  hostOfUrl,
  isDiscoverySnippet,
  isResolvableDiscoveryCandidate,
  rankDiscoveryCandidates,
  structuredToFactFields,
  type OwnIdeaAcquireStats,
  type OwnIdeaResolveDetailHook,
} from "@/lib/ckr-own-ideas/detail-acquire";
import type {
  OwnIdeaCandidateDiagnostic,
  OwnIdeaCatalog,
  OwnIdeaElementKind,
  OwnIdeaFactField,
  OwnIdeaSignal,
  OwnIdeaTrust,
} from "@/types/ckr-own-ideas";

export { isGenericFinancingPage, isPlaceholderSource };

export type OwnIdeaCatalogMode = "live" | "empty" | "injected";

export type LiveCatalogHooks = {
  /** Tests: inject discovery candidates (search snippets), no network. */
  search?: (query: LiaOiSourceAdapterQuery) => Promise<LiaOiCandidate[]>;
  /** Tests: discovery → DETAIL resolution without live HTTP. */
  resolveDetail?: OwnIdeaResolveDetailHook;
};

export type LiveCatalogResult = {
  catalog: OwnIdeaCatalog;
  mode: OwnIdeaCatalogMode;
  queries: number;
  externalCalls: number;
  catalogSearches: number;
  catalogExternalCalls: number;
  totalExternalCalls: number;
  sources: string[];
  rejectedSignals: number;
  realSignals: number;
  liveAvailable: boolean;
  reason: string;
  budget: OwnIdeaRunBudget;
  discoveryCandidates: number;
  detailResolutionAttempts: number;
  officialDetailsResolved: number;
  aggregatorCandidates: number;
  aggregatorToOfficialResolved: number;
  detailValidationRejected: number;
  liveFacts: number;
  budgetExhausted: boolean;
  actualExternalHttpCalls: number;
  discoveryExternalCalls: number;
  resolutionExternalCalls: number;
  discoveryTimeMs: number;
  resolutionTimeMs: number;
  runWallTimeMs: number;
  discoveryStoppedForResolutionReserve: boolean;
  budgetRemainingAtFirstResolution: number | null;
  budgetExhaustedPhase: OwnIdeaRunBudget["budgetExhaustedPhase"];
  candidateDiagnostics: OwnIdeaCandidateDiagnostic[];
};

function kindFromCandidate(c: LiaOiCandidate): OwnIdeaElementKind {
  if (c.opportunityType === "AUCTION_ASSET" || c.opportunityType === "GOVERNMENT_ASSET") {
    if (/земл|участ|площадк|турбаз|гостиниц/i.test(`${c.title} ${c.assetType || ""}`)) {
      return "LOCATION";
    }
    return "ASSET";
  }
  if (c.opportunityType === "PROCUREMENT") return "DEMAND";
  if (c.opportunityType === "SUPPORT_PROGRAM") return "CAPITAL";
  if (c.sourceClass === "TENDERS") return "DEMAND";
  if (c.sourceClass === "AUCTIONS_ASSETS") return "ASSET";
  if (c.sourceClass === "SUPPORT_PROGRAMS") return "CAPITAL";
  return "OTHER";
}

function trustFromCandidate(c: LiaOiCandidate): OwnIdeaTrust {
  if (c.isOfficialSource) return "official";
  if (c.sourceClass === "SUPPORT_PROGRAMS") return "government_open";
  if (/zakupki\.gov|torgi\.gov|fedresurs/i.test(c.canonicalUrl || "")) return "official";
  if (c.dataChannel === "SERPER_DISCOVERY") return "search_snippet";
  return "trusted_secondary";
}

export function oiCandidateToSignal(c: LiaOiCandidate): OwnIdeaSignal | null {
  if (c.isStub) return null;
  if (c.isCatalogSource) return null;
  const fields = candidateToGateFields(c);
  if (
    isExpiredOpportunity({
      deadlineAt: fields.deadlineAt,
      status: fields.status,
    })
  ) {
    return null;
  }

  let url = fields.url;
  const extracted = extractOfficialFromAggregator({
    url,
    title: c.title,
    officialId: fields.officialId,
  });
  if (extracted && url && !/zakupki\.gov\.ru|torgi\.gov\.ru/i.test(url)) {
    url = extracted.url;
  }

  if (
    isPlaceholderSource({
      url,
      sourceType: c.sourceAdapterId,
      sourceLabel: c.sources?.[0]?.name,
      id: c.id,
    })
  ) {
    return null;
  }

  const pageType = classifyOwnIdeaPageType({
    url,
    title: c.title,
    snippet: c.description || c.summary,
    liaPageType: c.pageType,
    isCatalogSource: c.isCatalogSource,
  });
  if (!isIdeaFactPageType(pageType)) {
    return null;
  }

  const kind = kindFromCandidate(c);
  if (kind === "OTHER") return null;

  const genericCap = kind === "CAPITAL" && isGenericFinancingPage({ url, title: c.title });
  const amount = c.nmck ?? c.askingPrice ?? c.investmentRequired ?? null;
  const officialId = fields.officialId || extracted?.id || null;
  const geo = normalizeOwnIdeaGeo(c.region || c.city || c.address || null);
  const validation = validateDetailFields({
    kind,
    pageType,
    officialId,
    title: c.title,
    customer: fields.customer,
    region: c.region || c.city,
    location: fields.location,
    publishedAt: fields.publishedAt,
    deadlineAt: fields.deadlineAt,
    status: fields.status,
    sourceUrl: url,
    amount,
    priceUnknown: amount == null,
    provider: fields.provider,
    applicability: fields.applicability,
    freshness: fields.freshness,
    objectTitle: c.assetType || c.title,
  });
  if (validation.reject) return null;

  let claimKind = validation.claimKind;
  if (genericCap) claimKind = "UNKNOWN";
  if (kind === "DEMAND" && !fields.deadlineAt && !fields.status && claimKind === "FACT") {
    claimKind = "INFERENCE";
  }

  const fetchedAt = c.enrichedFromFetch ? c.lastSeenAt || new Date().toISOString() : null;
  const factFields: OwnIdeaFactField[] = structuredToFactFields(
    c.structuredFields,
    url,
    fetchedAt,
    fields.publishedAt,
  );
  for (const extra of [
    factField({
      field: "official_id",
      value: officialId,
      sourceUrl: url,
      canonicalUrl: url,
      fetchedAt,
      publishedAt: fields.publishedAt,
      sourceType: alreadyResolvedOfficial(c) || c.enrichedFromFetch ? "official_page" : "search_snippet",
      confidence: officialId ? 90 : 0,
      verificationStatus: alreadyResolvedOfficial(c) || c.enrichedFromFetch ? "VERIFIED" : "UNVERIFIED",
      kind: officialId && (alreadyResolvedOfficial(c) || c.enrichedFromFetch) ? "FACT" : "INFERENCE",
    }),
    factField({
      field: "customer",
      value: fields.customer,
      sourceUrl: url,
      canonicalUrl: url,
      fetchedAt,
      publishedAt: fields.publishedAt,
      sourceType: alreadyResolvedOfficial(c) || c.enrichedFromFetch ? "official_page" : "search_snippet",
      confidence: fields.customer ? 85 : 0,
      verificationStatus: alreadyResolvedOfficial(c) || c.enrichedFromFetch ? "VERIFIED" : "UNVERIFIED",
    }),
  ]) {
    if (extra && !factFields.some((f) => f.field === extra.field)) factFields.push(extra);
  }

  const resolved = alreadyResolvedOfficial(c) || Boolean(c.enrichedFromFetch);
  if (isDiscoverySnippet(c) && !resolved) {
    if (claimKind === "FACT") claimKind = "INFERENCE";
  }
  if (claimKind === "FACT" && !resolved && !hasVerifiedFactFields(factFields)) {
    claimKind = "INFERENCE";
  }

  const financeKind = kind === "CAPITAL" ? classifyFinanceKind({ title: c.title, url }) : null;
  const financeAvailability =
    kind === "CAPITAL" ? (genericCap || claimKind === "UNKNOWN" ? "UNKNOWN" : "KNOWN") : undefined;

  const trust = genericCap
    ? "general_web"
    : isDiscoverySnippet(c) && !resolved
      ? "search_snippet"
      : trustFromCandidate(c);

  return {
    id: c.id || randomUUID(),
    kind,
    title: c.title,
    origin: "EXTERNAL",
    identityKey: c.fingerprint || c.canonicalKey || c.id,
    officialId,
    canonicalUrl: url,
    amount,
    priceUnknown: amount == null,
    claimKind,
    sourceType: c.opportunityType || c.sourceAdapterId || "lia_oi",
    sourceLabel: c.sources?.[0]?.name || c.sourceAdapterId || "LIA OI",
    sourceUrl: url,
    trustLevel: trust,
    region: c.region || c.city || null,
    industry: c.industry || c.subindustry || c.assetType || null,
    tags: [c.opportunityType, c.sourceClass].filter(Boolean) as string[],
    pageType,
    customer: fields.customer,
    publishedAt: fields.publishedAt,
    deadlineAt: fields.deadlineAt,
    status: fields.status,
    objectTitle: c.assetType || c.title,
    location: fields.location,
    provider: fields.provider,
    applicability: fields.applicability,
    freshness: fields.freshness,
    sourceQuality: sourceQualityOf({
      url,
      pageType,
      isOfficialSource: resolved && Boolean(c.isOfficialSource || /zakupki\.gov|torgi\.gov|fedresurs/i.test(url || "")),
    }),
    financeKind,
    financeAvailability,
    geo,
    factFields,
    sourceDomain: hostOfUrl(url),
    fetchedAt,
    verificationStatus: resolved && claimKind === "FACT" ? "VERIFIED" : "UNVERIFIED",
    confidence: claimKind === "FACT" ? 85 : claimKind === "INFERENCE" ? 50 : 20,
    detailResolved: resolved,
  };
}

function emptyCatalog(): OwnIdeaCatalog {
  return { signals: [], internalResources: [], externalResources: [] };
}

function makePlan(input: {
  rawQuery: string;
  intent: LiaOiSearchIntent;
  sourceClasses: LiaOiSourceClass[];
}): LiaOiSearchPlan {
  return {
    id: randomUUID(),
    rawQuery: input.rawQuery,
    intent: input.intent,
    country: "Россия",
    regions: ["Республика Дагестан", "СКФО"],
    industries: [],
    assetTypes: [],
    hypotheses: [],
    queries: [input.rawQuery],
    createdAt: new Date().toISOString(),
    sourceClasses: input.sourceClasses,
  };
}

const LIVE_QUERIES: Array<{
  rawQuery: string;
  intent: LiaOiSearchIntent;
  sourceClasses: LiaOiSourceClass[];
}> = [
  {
    rawQuery: "торги спецтехника земля имущество Республика Дагестан",
    intent: "assets",
    sourceClasses: ["AUCTIONS_ASSETS"],
  },
  {
    rawQuery: "закупка тендер 44-ФЗ Республика Дагестан",
    intent: "tenders",
    sourceClasses: ["TENDERS"],
  },
  {
    rawQuery: "лизинг кредит грант поддержка МСП Республика Дагестан",
    intent: "support_programs",
    sourceClasses: ["SUPPORT_PROGRAMS"],
  },
];

export function resolveOwnIdeaCatalogMode(): "live" | "fixture" {
  const raw = (process.env.CKR_OWN_IDEAS_CATALOG || "").trim().toLowerCase();
  if (raw === "fixture") {
    if (isOwnIdeasProductionEnv()) {
      throw new Error(
        "CKR_OWN_IDEAS_CATALOG=fixture запрещён в production. SoT поиска — live LIA OI adapters.",
      );
    }
    return "fixture";
  }
  return "live";
}

function candidateId(c: LiaOiCandidate): string {
  return c.id || c.canonicalUrl || c.sources?.[0]?.url || c.title;
}

export async function buildOwnIdeaCatalog(opts?: {
  userId?: string;
  hooks?: LiveCatalogHooks;
  budget?: OwnIdeaRunBudget;
}): Promise<LiveCatalogResult> {
  const budget = opts?.budget ?? createOwnIdeaRunBudget();
  return runWithOwnIdeaBudget(budget, () => buildOwnIdeaCatalogInner(opts, budget));
}

async function buildOwnIdeaCatalogInner(
  opts: { userId?: string; hooks?: LiveCatalogHooks } | undefined,
  budget: OwnIdeaRunBudget,
): Promise<LiveCatalogResult> {
  let rejectedSignals = 0;
  const collected: LiaOiCandidate[] = [];
  const resolvedIds = new Set<string>();
  const resolved: LiaOiCandidate[] = [];
  const sourceLabels: string[] = [];
  let acquire = emptyAcquireStats();
  const diagnostics: OwnIdeaCandidateDiagnostic[] = [];
  const discoveryStarted = Date.now();

  const runResolution = async (pool: LiaOiCandidate[]) => {
    const pending = rankDiscoveryCandidates(
      pool.filter((c) => !resolvedIds.has(candidateId(c))),
    );
    if (!pending.length) return;
    if (pending.some(isResolvableDiscoveryCandidate)) markResolvableCandidate(budget);
    setOwnIdeaBudgetPhase(budget, "resolution");
    const resStarted = Date.now();
    const acquired = await acquireOwnIdeaDetails(pending, budget, {
      resolveDetail: opts?.hooks?.resolveDetail,
    });
    budget.resolutionTimeMs += Date.now() - resStarted;
    acquire = {
      ...acquire,
      detailResolutionAttempts: acquire.detailResolutionAttempts + acquired.stats.detailResolutionAttempts,
      officialDetailsResolved: acquire.officialDetailsResolved + acquired.stats.officialDetailsResolved,
      aggregatorCandidates: acquire.aggregatorCandidates + acquired.stats.aggregatorCandidates,
      aggregatorToOfficialResolved:
        acquire.aggregatorToOfficialResolved + acquired.stats.aggregatorToOfficialResolved,
      detailValidationRejected: acquire.detailValidationRejected + acquired.stats.detailValidationRejected,
      liveFacts: acquire.liveFacts + acquired.stats.liveFacts,
      budgetExhausted: acquire.budgetExhausted || acquired.stats.budgetExhausted,
    };
    diagnostics.push(...acquired.diagnostics);
    for (const c of pending) resolvedIds.add(candidateId(c));
    resolved.push(...acquired.candidates);
    setOwnIdeaBudgetPhase(budget, "discovery");
  };

  const afterDiscoveryBatch = async () => {
    if (collected.some((c) => !resolvedIds.has(candidateId(c)) && isResolvableDiscoveryCandidate(c))) {
      markResolvableCandidate(budget);
      await runResolution(collected);
    }
  };

  if (opts?.hooks?.search) {
    for (const q of LIVE_QUERIES) {
      if (shouldStopDiscoveryForReserve(budget)) {
        budget.discoveryStoppedForResolutionReserve = true;
        break;
      }
      if (!canConsumeSearch(budget)) break;
      if (!consumeSearch(budget, "catalog")) break;
      if (!consumeActualHttp(budget, "discovery")) {
        budget.discoveryStoppedForResolutionReserve = true;
        break;
      }
      const adapterQuery: LiaOiSourceAdapterQuery = {
        rawQuery: q.rawQuery,
        userId: opts.userId || "owner",
        mode: "live",
        plan: makePlan(q),
      };
      const found = await opts.hooks.search(adapterQuery);
      collected.push(...found);
      sourceLabels.push(q.intent);
      await afterDiscoveryBatch();
    }
    budget.discoveryTimeMs = Math.max(0, Date.now() - discoveryStarted - budget.resolutionTimeMs);
    await runResolution(collected);
    acquire.discoveryCandidates = collected.length;
    return packSignals(resolved, {
      mode: "injected",
      rejectedSignals,
      liveAvailable: true,
      reason: "injected hooks",
      sourceLabels,
      budget,
      acquire,
      diagnostics,
    });
  }

  if (resolveOwnIdeaCatalogMode() === "fixture") {
    throw new Error("fixture catalog must be passed explicitly to the builder, not via live factory");
  }

  const modeInfo = resolveOiSearchMode();
  if (modeInfo.mode !== "live" || !isOiLiveConfigured()) {
    return packSignals([], {
      mode: "empty",
      rejectedSignals: 0,
      liveAvailable: false,
      reason: modeInfo.reason,
      sourceLabels: [],
      budget,
      acquire: emptyAcquireStats(),
      diagnostics: [],
    });
  }

  for (const q of LIVE_QUERIES) {
    if (shouldStopDiscoveryForReserve(budget)) {
      budget.discoveryStoppedForResolutionReserve = true;
      break;
    }
    if (!canConsumeSearch(budget)) break;
    const adapterQuery: LiaOiSourceAdapterQuery = {
      rawQuery: q.rawQuery,
      userId: opts?.userId || "owner",
      mode: "live",
      plan: makePlan(q),
    };
    const adapters = listSourceAdapters().filter((a) => a.matches(adapterQuery));
    if (!adapters.length) continue;
    if (!consumeSearch(budget, "catalog")) break;
    for (const adapter of adapters) {
      if (shouldStopDiscoveryForReserve(budget)) {
        budget.discoveryStoppedForResolutionReserve = true;
        break;
      }
      try {
        const ran = await adapter.search(adapterQuery);
        collected.push(...ran.candidates);
        if (ran.label) sourceLabels.push(ran.label);
        if (ran.transport === "fixture") {
          rejectedSignals += ran.rawCount;
        }
      } catch {
        rejectedSignals += 1;
      }
      await afterDiscoveryBatch();
    }
  }

  budget.discoveryTimeMs = Math.max(0, Date.now() - discoveryStarted - budget.resolutionTimeMs);
  const liveOnly = collected.filter((c) => !c.isStub);
  rejectedSignals += collected.length - liveOnly.length;
  await runResolution(liveOnly);
  acquire.discoveryCandidates = collected.length;

  return packSignals(resolved, {
    mode: liveOnly.length || resolved.length ? "live" : "empty",
    rejectedSignals,
    liveAvailable: true,
    reason: modeInfo.reason,
    sourceLabels,
    budget,
    acquire,
    diagnostics,
  });
}

function packSignals(
  candidates: LiaOiCandidate[],
  meta: {
    mode: OwnIdeaCatalogMode;
    rejectedSignals: number;
    liveAvailable: boolean;
    reason: string;
    sourceLabels: string[];
    budget: OwnIdeaRunBudget;
    acquire?: OwnIdeaAcquireStats;
    diagnostics?: OwnIdeaCandidateDiagnostic[];
  },
): LiveCatalogResult {
  const signals: OwnIdeaSignal[] = [];
  let rejected = meta.rejectedSignals;
  for (const c of candidates) {
    const mapped = oiCandidateToSignal(c);
    if (!mapped) {
      rejected += 1;
      continue;
    }
    signals.push(mapped);
  }
  const sliced = signals.slice(0, CKR_OWN_IDEAS_BUDGETS.maxSignalsPerRun);
  const capital = sliced.filter((s) => s.kind === "CAPITAL");
  const rest = sliced.filter((s) => s.kind !== "CAPITAL");
  const snap = snapshotBudget(meta.budget);
  const acquire = meta.acquire ?? emptyAcquireStats();
  const liveFacts = sliced.filter(
    (s) =>
      s.claimKind === "FACT" &&
      s.pageType === "DETAIL" &&
      s.detailResolved &&
      s.trustLevel !== "search_snippet" &&
      s.trustLevel !== "general_web",
  ).length;
  const diagnostics = (meta.diagnostics ?? []).slice(0, CKR_OWN_IDEAS_BUDGETS.maxCandidateDiagnostics).map((d) => {
    const match = sliced.find(
      (s) => s.canonicalUrl === d.officialUrl || s.canonicalUrl === d.candidateUrl || s.sourceUrl === d.candidateUrl,
    );
    if (!match) return d;
    const state = match.claimKind === "FACT" ? "FACT" : match.claimKind === "UNKNOWN" ? "REJECT" : "INFERENCE";
    return { ...d, finalState: state };
  });
  const mode = rest.length || capital.length ? meta.mode : meta.mode === "injected" ? "injected" : "empty";
  return {
    catalog: {
      signals: rest,
      internalResources: [],
      externalResources: capital,
    },
    mode,
    queries: snap.catalogSearches,
    externalCalls: snap.actualExternalHttpCalls,
    catalogSearches: snap.catalogSearches,
    catalogExternalCalls: snap.catalogExternalCalls,
    totalExternalCalls: snap.actualExternalHttpCalls,
    sources: [...new Set(meta.sourceLabels.filter(Boolean))],
    rejectedSignals: rejected,
    realSignals: rest.length + capital.length,
    liveAvailable: meta.liveAvailable,
    reason: meta.reason,
    budget: meta.budget,
    discoveryCandidates: acquire.discoveryCandidates,
    detailResolutionAttempts: acquire.detailResolutionAttempts,
    officialDetailsResolved: acquire.officialDetailsResolved,
    aggregatorCandidates: acquire.aggregatorCandidates,
    aggregatorToOfficialResolved: acquire.aggregatorToOfficialResolved,
    detailValidationRejected: acquire.detailValidationRejected,
    liveFacts,
    budgetExhausted: acquire.budgetExhausted || Boolean(snap.budgetExhaustedPhase),
    actualExternalHttpCalls: snap.actualExternalHttpCalls,
    discoveryExternalCalls: snap.discoveryExternalCalls,
    resolutionExternalCalls: snap.resolutionExternalCalls,
    discoveryTimeMs: snap.discoveryTimeMs,
    resolutionTimeMs: snap.resolutionTimeMs,
    runWallTimeMs: snap.runWallTimeMs,
    discoveryStoppedForResolutionReserve: snap.discoveryStoppedForResolutionReserve,
    budgetRemainingAtFirstResolution: snap.budgetRemainingAtFirstResolution,
    budgetExhaustedPhase: snap.budgetExhaustedPhase,
    candidateDiagnostics: diagnostics,
  };
}
