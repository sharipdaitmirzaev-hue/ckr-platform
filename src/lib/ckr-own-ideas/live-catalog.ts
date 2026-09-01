/**
 * Stage 4Q.2 — live OwnIdeaCatalog from LIA OI adapters.
 * No fixture fallback in owner/production. 0 signals is valid.
 * MANUAL RUN only. No Scheduler.
 */
import { randomUUID } from "node:crypto";
import {
  CKR_OWN_IDEAS_BUDGETS,
} from "@/config/ckr-own-ideas";
import { isOwnIdeasProductionEnv } from "@/lib/ckr-own-ideas/store";
import { isOiLiveConfigured, resolveOiSearchMode } from "@/lib/lia/oi/mode";
import { runMatchingSourceAdapters } from "@/lib/lia/oi/sources/registry";
import type {
  LiaOiSearchIntent,
  LiaOiSearchPlan,
  LiaOiCandidate,
  LiaOiSourceClass,
} from "@/types/lia-oi";
import type { LiaOiSourceAdapterQuery } from "@/lib/lia/oi/sources/types";
import type {
  OwnIdeaCatalog,
  OwnIdeaElementKind,
  OwnIdeaSignal,
  OwnIdeaTrust,
} from "@/types/ckr-own-ideas";

export type OwnIdeaCatalogMode = "live" | "empty" | "injected";

export type LiveCatalogHooks = {
  /** Tests: inject OI-like candidates, no network. */
  search?: (query: LiaOiSourceAdapterQuery) => Promise<LiaOiCandidate[]>;
};

export type LiveCatalogResult = {
  catalog: OwnIdeaCatalog;
  mode: OwnIdeaCatalogMode;
  queries: number;
  externalCalls: number;
  sources: string[];
  rejectedSignals: number;
  realSignals: number;
  liveAvailable: boolean;
  reason: string;
};

const PLACEHOLDER_RE =
  /example\.com|example\.org|\.example(?:[./:]|$)|localhost|127\.0\.0\.1|\bfixture\b|e2e_ckr|\bsmoke\b/i;

export function isPlaceholderSource(input: {
  url?: string | null;
  sourceType?: string | null;
  sourceLabel?: string | null;
  id?: string | null;
}): boolean {
  const blob = [input.url, input.sourceType, input.sourceLabel, input.id]
    .filter(Boolean)
    .join(" ");
  return PLACEHOLDER_RE.test(blob);
}

export function isGenericFinancingPage(input: {
  url?: string | null;
  title?: string | null;
}): boolean {
  const blob = `${input.url || ""} ${input.title || ""}`.toLowerCase();
  const bank =
    /sberbank|sber\.ru|vtb\.ru|alfabank|tinkoff|банки\.ру|banki\.ru|\bcredits?\b|\bкредит/;
  const confirmed = /оферта|одобрен|договор лизинг|ключевая ставка сделки/;
  return bank.test(blob) && !confirmed.test(blob);
}

function isExpired(deadlineAt?: string | null): boolean {
  if (!deadlineAt) return false;
  const t = Date.parse(deadlineAt);
  if (Number.isNaN(t)) return false;
  return t < Date.now() - 24 * 60 * 60 * 1000;
}

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
  if (isExpired(c.deadlineAt)) return null;
  const url = c.canonicalUrl || c.sources?.[0]?.url || null;
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
  const kind = kindFromCandidate(c);
  if (kind === "OTHER") return null;
  const genericCap = kind === "CAPITAL" && isGenericFinancingPage({ url, title: c.title });
  const amount = c.nmck ?? c.askingPrice ?? c.investmentRequired ?? null;
  return {
    id: c.id || randomUUID(),
    kind,
    title: c.title,
    origin: "EXTERNAL",
    identityKey: c.fingerprint || c.canonicalKey || c.id,
    officialId: c.sourceObjectId ?? null,
    canonicalUrl: url,
    amount,
    claimKind: genericCap || kind === "CAPITAL" ? "INFERENCE" : amount != null ? "FACT" : "INFERENCE",
    sourceType: c.opportunityType || c.sourceAdapterId || "lia_oi",
    sourceLabel: c.sources?.[0]?.name || c.sourceAdapterId || "LIA OI",
    sourceUrl: url,
    trustLevel: genericCap ? "general_web" : trustFromCandidate(c),
    region: c.region || c.city || null,
    industry: c.industry || c.subindustry || null,
    tags: [c.opportunityType, c.sourceClass].filter(Boolean) as string[],
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
    regions: ["Дагестан"],
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
    rawQuery: "торги спецтехника земля имущество Дагестан",
    intent: "assets",
    sourceClasses: ["AUCTIONS_ASSETS"],
  },
  {
    rawQuery: "закупка тендер 44-ФЗ Дагестан СКФО",
    intent: "tenders",
    sourceClasses: ["TENDERS"],
  },
  {
    rawQuery: "лизинг кредит грант поддержка МСП Дагестан",
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

export async function buildOwnIdeaCatalog(opts?: {
  userId?: string;
  hooks?: LiveCatalogHooks;
}): Promise<LiveCatalogResult> {
  const started = Date.now();
  const timeoutMs = CKR_OWN_IDEAS_BUDGETS.timeoutMs;
  let queries = 0;
  let externalCalls = 0;
  let rejectedSignals = 0;
  const collected: LiaOiCandidate[] = [];
  const sourceLabels: string[] = [];

  if (opts?.hooks?.search) {
    for (const q of LIVE_QUERIES) {
      if (Date.now() - started > timeoutMs) break;
      if (queries >= CKR_OWN_IDEAS_BUDGETS.maxQueries) break;
      if (externalCalls >= CKR_OWN_IDEAS_BUDGETS.maxExternalCalls) break;
      queries += 1;
      externalCalls += 1;
      const adapterQuery: LiaOiSourceAdapterQuery = {
        rawQuery: q.rawQuery,
        userId: opts.userId || "owner",
        mode: "live",
        plan: makePlan(q),
      };
      const found = await opts.hooks.search(adapterQuery);
      collected.push(...found);
      sourceLabels.push(q.intent);
    }
    return packSignals(collected, {
      mode: "injected",
      queries,
      externalCalls,
      rejectedSignals,
      liveAvailable: true,
      reason: "injected hooks",
      sourceLabels,
    });
  }

  if (resolveOwnIdeaCatalogMode() === "fixture") {
    throw new Error("fixture catalog must be passed explicitly to the builder, not via live factory");
  }

  const modeInfo = resolveOiSearchMode();
  if (modeInfo.mode !== "live" || !isOiLiveConfigured()) {
    return {
      catalog: emptyCatalog(),
      mode: "empty",
      queries: 0,
      externalCalls: 0,
      sources: [],
      rejectedSignals: 0,
      realSignals: 0,
      liveAvailable: false,
      reason: modeInfo.reason,
    };
  }

  for (const q of LIVE_QUERIES) {
    if (Date.now() - started > timeoutMs) break;
    if (queries >= CKR_OWN_IDEAS_BUDGETS.maxQueries) break;
    if (externalCalls >= CKR_OWN_IDEAS_BUDGETS.maxExternalCalls) break;
    queries += 1;
    const adapterQuery: LiaOiSourceAdapterQuery = {
      rawQuery: q.rawQuery,
      userId: opts?.userId || "owner",
      mode: "live",
      plan: makePlan(q),
    };
    try {
      const ran = await runMatchingSourceAdapters(adapterQuery);
      externalCalls += Math.max(1, ran.stats.length);
      collected.push(...ran.candidates);
      for (const s of ran.stats) {
        if (s.label) sourceLabels.push(s.label);
        if (s.transport === "fixture") {
          rejectedSignals += s.rawCount;
        }
      }
    } catch {
      rejectedSignals += 1;
    }
  }

  const liveOnly = collected.filter((c) => !c.isStub);
  rejectedSignals += collected.length - liveOnly.length;

  return packSignals(liveOnly, {
    mode: liveOnly.length ? "live" : "empty",
    queries,
    externalCalls,
    rejectedSignals,
    liveAvailable: true,
    reason: modeInfo.reason,
    sourceLabels,
  });
}

function packSignals(
  candidates: LiaOiCandidate[],
  meta: {
    mode: OwnIdeaCatalogMode;
    queries: number;
    externalCalls: number;
    rejectedSignals: number;
    liveAvailable: boolean;
    reason: string;
    sourceLabels: string[];
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
  return {
    catalog: {
      signals: rest,
      internalResources: [],
      externalResources: capital,
    },
    mode: rest.length || capital.length ? meta.mode : "empty",
    queries: meta.queries,
    externalCalls: meta.externalCalls,
    sources: [...new Set(meta.sourceLabels.filter(Boolean))],
    rejectedSignals: rejected,
    realSignals: rest.length + capital.length,
    liveAvailable: meta.liveAvailable,
    reason: meta.reason,
  };
}
