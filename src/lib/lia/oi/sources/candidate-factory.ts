/**
 * Build LiaOiCandidate from specialized source records / Serper hits.
 */

import { oiHash, oiId } from "@/lib/lia/oi/id";
import { emptyScore } from "@/lib/lia/oi/score";
import { buildOpportunityFingerprint } from "@/lib/lia/oi/fingerprint";
import {
  daysRemaining,
  extractDeadlineFromText,
  parseDeadline,
  priorityFromDeadline,
} from "@/lib/lia/oi/sources/deadline";
import type {
  LiaOiOpportunityType,
  LiaOiSourceAdapterId,
} from "@/lib/lia/oi/sources/types";
import type {
  LiaOiCandidate,
  LiaOiClaim,
  LiaOiSourceCategory,
  LiaOiSourceClass,
} from "@/types/lia-oi";
import type { ExternalSearchResult } from "@/lib/lia/search/types";

function claim(
  field: string,
  value: string,
  sourceName: string,
  sourceUrl: string,
): LiaOiClaim {
  return {
    field,
    value,
    kind: "FACT",
    sourceName,
    sourceUrl,
  };
}

export function applyDeadlineFields(
  candidate: LiaOiCandidate,
  deadlineRaw?: string | null,
): LiaOiCandidate {
  const deadlineAt =
    parseDeadline(deadlineRaw) ||
    extractDeadlineFromText(
      `${candidate.title}\n${candidate.description}\n${candidate.summary}`,
    );
  const days = daysRemaining(deadlineAt);
  const priority = priorityFromDeadline(candidate.score.priority, days);
  return {
    ...candidate,
    deadlineAt,
    daysRemaining: days,
    score: {
      ...candidate.score,
      priority,
      // sourceConfidence may already be set; do not touch opportunity score
    },
  };
}

export function buildSpecializedCandidate(input: {
  adapterId: LiaOiSourceAdapterId;
  opportunityType: LiaOiOpportunityType;
  sourceClass: LiaOiSourceClass;
  category: LiaOiSourceCategory;
  sourceName: string;
  official: boolean;
  sourceConfidence: number;
  title: string;
  description: string;
  url: string;
  region?: string | null;
  city?: string | null;
  industry?: string | null;
  askingPrice?: number | null;
  investmentRequired?: number | null;
  assetType?: string | null;
  objectId: string;
  deadlineRaw?: string | null;
  isStub: boolean;
  extraClaims?: LiaOiClaim[];
  whyInteresting?: string[];
}): LiaOiCandidate {
  const now = new Date().toISOString();
  const canonKey = oiHash(`${input.adapterId}|${input.objectId}|${input.url}`);
  const base: LiaOiCandidate = {
    id: oiId("cand"),
    type: input.opportunityType.toLowerCase(),
    title: input.title,
    description: input.description,
    summary: input.description.slice(0, 280),
    whyInteresting: input.whyInteresting ?? [
      `Источник: ${input.sourceName}`,
      input.official ? "Официальный источник" : "Публичный веб-источник",
    ],
    recommendation: "Изучить карточку и первичные документы источника",
    nextStep: "Проверить условия и сроки в первоисточнике",
    status: "NEW",
    country: "RU",
    region: input.region ?? undefined,
    city: input.city ?? undefined,
    industry: input.industry ?? undefined,
    askingPrice: input.askingPrice ?? null,
    investmentRequired: input.investmentRequired ?? null,
    assetType: input.assetType ?? undefined,
    sources: [
      {
        id: oiId("src"),
        category: input.category,
        name: input.sourceName,
        url: input.url,
        discoveredAt: now,
        isStub: input.isStub,
      },
    ],
    claims: [
      claim("title", input.title, input.sourceName, input.url),
      ...(input.askingPrice != null
        ? [
            claim(
              "askingPrice",
              String(input.askingPrice),
              input.sourceName,
              input.url,
            ),
          ]
        : []),
      ...(input.extraClaims ?? []),
    ],
    risks: ["Условия сделки/программы требуют проверки по первичным документам"],
    unknowns: [],
    toVerify: ["Актуальность на дату обращения", "Полный пакет документов"],
    score: {
      ...emptyScore(),
      overall: Math.min(85, 45 + Math.round(input.sourceConfidence * 0.35)),
      confidence: input.sourceConfidence,
      relevance: 70,
      quality: input.official ? 75 : 55,
      opportunity: 55,
      priority: "NORMAL",
      explanation: [
        input.official
          ? "Официальный источник повышает source confidence, но не равен хорошей возможности."
          : "Публичный источник — требуется дополнительная проверка.",
      ],
      whyTop: [],
      breakdown: emptyScore().breakdown,
    },
    matchHints: [],
    firstSeenAt: now,
    lastSeenAt: now,
    canonicalKey: canonKey,
    rawStubIds: input.isStub ? [input.objectId] : [],
    isStub: input.isStub,
    pageType: "DETAIL",
    isCatalogSource: false,
    contentIntent: "OPPORTUNITY",
    budgetFit: "UNKNOWN",
    priceStatus:
      input.askingPrice != null || input.investmentRequired != null
        ? "KNOWN"
        : "UNKNOWN",
    priceKind: input.askingPrice != null ? "ASKING" : "UNKNOWN",
    detailConfidence: input.official ? 70 : 45,
    detailSignals: [],
    missingFields: [],
    whyRecommend: [],
    sourceClass: input.sourceClass,
    sourceObjectId: input.objectId,
    canonicalUrl: input.url,
    sourceAdapterId: input.adapterId,
    opportunityType: input.opportunityType,
    isOfficialSource: input.official,
    sourceConfidence: input.sourceConfidence,
  };

  const withFp: LiaOiCandidate = {
    ...base,
    fingerprint: buildOpportunityFingerprint({
      ...base,
      canonicalUrl: input.url,
    }),
  };
  return applyDeadlineFields(withFp, input.deadlineRaw);
}

export function extractOfficialIdFromUrl(
  url: string,
  kind: "lot" | "procurement" | "program",
): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname + u.search;
    if (kind === "lot") {
      const m =
        path.match(/lot\/([A-Za-z0-9_-]+)/i) ||
        path.match(/lotId=([A-Za-z0-9_-]+)/i) ||
        path.match(/\/(\d{10,})(?:\/|$)/);
      return m?.[1] ?? null;
    }
    if (kind === "procurement") {
      const m =
        path.match(/regNumber=([0-9]+)/i) ||
        path.match(/noticeInfoId=([A-Za-z0-9_-]+)/i) ||
        path.match(/\/(\d{10,})(?:\/|$|\?)/);
      return m?.[1] ?? null;
    }
    const m =
      path.match(/detail\/([A-Za-z0-9_-]+)/i) ||
      path.match(/measures\/([A-Za-z0-9_-]+)/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export function extractPriceFromText(text: string): number | null {
  const m = text.match(
    /(\d{1,3}(?:[ \u00a0]\d{3})+|\d+)\s*(?:млн|million)?\s*(?:₽|руб)/i,
  );
  if (!m) return null;
  const digits = m[1].replace(/\s|\u00a0/g, "");
  let n = Number(digits);
  if (Number.isNaN(n)) return null;
  if (/млн|million/i.test(m[0])) n *= 1_000_000;
  return n > 0 ? n : null;
}

export function hitToSpecializedCandidate(
  hit: ExternalSearchResult,
  meta: {
    adapterId: LiaOiSourceAdapterId;
    opportunityType: LiaOiOpportunityType;
    sourceClass: LiaOiSourceClass;
    category: LiaOiSourceCategory;
    sourceName: string;
    idKind: "lot" | "procurement" | "program";
  },
): LiaOiCandidate {
  const objectId =
    extractOfficialIdFromUrl(hit.url, meta.idKind) ||
    oiHash(hit.url).slice(0, 16);
  const price = extractPriceFromText(`${hit.title} ${hit.snippet || ""}`);
  return buildSpecializedCandidate({
    adapterId: meta.adapterId,
    opportunityType: meta.opportunityType,
    sourceClass: meta.sourceClass,
    category: meta.category,
    sourceName: meta.sourceName,
    official: true,
    sourceConfidence: 82,
    title: hit.title,
    description: hit.snippet || hit.title,
    url: hit.url,
    askingPrice: meta.opportunityType === "SUPPORT_PROGRAM" ? null : price,
    investmentRequired:
      meta.opportunityType === "SUPPORT_PROGRAM" ? price : null,
    objectId,
    deadlineRaw: extractDeadlineFromText(`${hit.title}\n${hit.snippet || ""}`),
    isStub: false,
  });
}
