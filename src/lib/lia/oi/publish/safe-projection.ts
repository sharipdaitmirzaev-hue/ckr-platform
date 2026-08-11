/**
 * Explicit allowlist mapper: LiaOiOpportunity → PublicOpportunityDraft.
 * Blocks internal notes, scores, contacts, raw payloads, secrets.
 */

import type { LiaOiCandidate } from "@/types/lia-oi";
import type {
  LiaPublishOpportunityType,
  PublicOpportunityDraft,
  PublicOpportunitySafeField,
} from "@/types/lia-controlled-publish";
import { PUBLIC_OPPORTUNITY_SAFE_FIELDS } from "@/types/lia-controlled-publish";
import {
  discoveryBadgeForCandidate,
  userSourceLabelForCandidate,
} from "@/lib/lia/oi/publish/source-display";

const INTERNAL_FIELD_BLOCKLIST = [
  "contactName",
  "contactPhone",
  "contactEmail",
  "contactsPublic",
  "score",
  "scoreOverall",
  "scoreBreakdown",
  "scoreExplanation",
  "whyTop",
  "claims",
  "risks",
  "unknowns",
  "toVerify",
  "matchHints",
  "rawStubIds",
  "discovery_json",
  "normalized_json",
  "ownerStatusSetBy",
  "ownerLocked",
  "recommendation",
  "nextStep",
  "whyInteresting",
  "structuredFields",
  "officialApiStatus",
  "officialApiProvider",
  "sourceAdapterId",
  "assignments",
  "feedback",
  "secrets",
  "adminNotes",
  "ownerComments",
] as const;

export function mapOiTypeToMarketplaceType(
  opportunityType?: string | null,
): LiaPublishOpportunityType | "ready_business" | "land" | "equipment" {
  switch ((opportunityType || "").toUpperCase()) {
    case "SUPPORT_PROGRAM":
      return "support_program";
    case "PROCUREMENT":
      return "procurement";
    case "AUCTION_ASSET":
    case "GOVERNMENT_ASSET":
      return "auction_asset";
    case "REGIONAL_INVESTMENT":
      return "ready_business";
    case "WEB_LISTING":
      return "ready_business";
    default:
      return "ready_business";
  }
}

export function pickPublicAmount(candidate: LiaOiCandidate): {
  price: number | null;
  amountKind: string | null;
} {
  if (candidate.nmck != null && Number.isFinite(candidate.nmck)) {
    return { price: Number(candidate.nmck), amountKind: "NMCK" };
  }
  if (
    candidate.supportAmount != null &&
    Number.isFinite(candidate.supportAmount)
  ) {
    return {
      price: Number(candidate.supportAmount),
      amountKind: "SUPPORT_AMOUNT",
    };
  }
  if (
    candidate.currentPrice != null &&
    Number.isFinite(candidate.currentPrice)
  ) {
    return {
      price: Number(candidate.currentPrice),
      amountKind: "CURRENT_AUCTION_PRICE",
    };
  }
  if (
    candidate.startingPrice != null &&
    Number.isFinite(candidate.startingPrice)
  ) {
    return {
      price: Number(candidate.startingPrice),
      amountKind: "STARTING_AUCTION_PRICE",
    };
  }
  if (candidate.askingPrice != null && Number.isFinite(candidate.askingPrice)) {
    return { price: Number(candidate.askingPrice), amountKind: "ASKING_PRICE" };
  }
  if (
    candidate.investmentRequired != null &&
    Number.isFinite(candidate.investmentRequired)
  ) {
    return {
      price: Number(candidate.investmentRequired),
      amountKind: "INVESTMENT_REQUIRED",
    };
  }
  return { price: null, amountKind: candidate.priceKind || null };
}

export function detectLifecycleHint(
  candidate: LiaOiCandidate,
): PublicOpportunityDraft["lifecycleHint"] {
  const stage = `${candidate.procurementStage || ""} ${candidate.auctionStatus || ""}`.toUpperCase();
  if (/\b(CANCEL|CANCELLED|ОТМЕН)/.test(stage)) return "cancelled";
  if (/\b(CLOSED|COMPLETE|ЗАВЕРШ|ЗАКРЫТ)/.test(stage)) return "closed";
  if (/\b(EXPIRED|ИСТЕК)/.test(stage)) return "expired";
  if (candidate.deadlineAt) {
    const ms = Date.parse(candidate.deadlineAt);
    if (!Number.isNaN(ms) && ms < Date.now()) return "expired";
  }
  if (stage.trim()) return "active";
  return "unknown";
}

function officialUrl(candidate: LiaOiCandidate): string | null {
  const fromSources =
    candidate.sources?.find((s) => s.url && /^https?:\/\//i.test(s.url))?.url ||
    null;
  const canon = candidate.canonicalUrl || null;
  return canon || fromSources;
}

function ownerWhyUseful(candidate: LiaOiCandidate): string[] {
  const why = [
    ...(candidate.whyRecommend || []),
    ...(candidate.score?.whyTop || []),
  ]
    .map((s) => String(s).trim())
    .filter(Boolean);
  if (why.length) return why.slice(0, 6);
  if (candidate.summary) return [candidate.summary.slice(0, 280)];
  return ["Лия считает объект полезным по данным внешнего источника."];
}

/** Build user-safe draft. Never copies blocklisted internal fields. */
export function projectLiaOiToPublicDraft(
  candidate: LiaOiCandidate,
): PublicOpportunityDraft {
  const { price, amountKind } = pickPublicAmount(candidate);
  const url = officialUrl(candidate);
  const description = (
    candidate.summary ||
    candidate.description ||
    ""
  ).trim();

  return {
    title: (candidate.title || "Без названия").trim().slice(0, 160),
    description: description.slice(0, 12000) || "Описание уточняется.",
    type: mapOiTypeToMarketplaceType(candidate.opportunityType),
    industry: candidate.industry || candidate.subindustry || null,
    region: (candidate.region || "").trim() || "Регион не указан",
    city: (candidate.city || "").trim() || "—",
    price,
    amountKind,
    currency: "RUB",
    deadlineAt: candidate.deadlineAt || null,
    officialUrl: url,
    canonicalUrl: candidate.canonicalUrl || url,
    sourceLabel: userSourceLabelForCandidate(candidate),
    fingerprint: candidate.fingerprint || candidate.canonicalKey || null,
    publishedAt: null,
    sourceType: "lia_oi",
    sourceId: candidate.id,
    discoveryBadge: discoveryBadgeForCandidate(candidate),
    ownerWhyUseful: ownerWhyUseful(candidate),
    dataQualityScore:
      candidate.dataQualityScore ?? candidate.score?.quality ?? null,
    matchingReadiness: candidate.matchingReadiness ?? null,
    confirmedFields: candidate.confirmedFields || [],
    unknownFields: candidate.unknownFields || [],
    lifecycleHint: detectLifecycleHint(candidate),
  };
}

/** Strip any accidental non-allowlisted keys from a projection object. */
export function enforceSafeProjection(
  draft: PublicOpportunityDraft,
): Record<PublicOpportunitySafeField, unknown> & {
  sourceType: "lia_oi";
  sourceId: string;
  discoveryBadge: string;
  lifecycleHint: string;
} {
  const out: Record<string, unknown> = {};
  for (const key of PUBLIC_OPPORTUNITY_SAFE_FIELDS) {
    out[key] = draft[key];
  }
  out.sourceType = "lia_oi";
  out.sourceId = draft.sourceId;
  out.discoveryBadge = draft.discoveryBadge;
  out.lifecycleHint = draft.lifecycleHint;
  return out as Record<PublicOpportunitySafeField, unknown> & {
    sourceType: "lia_oi";
    sourceId: string;
    discoveryBadge: string;
    lifecycleHint: string;
  };
}

/** Test helper: ensure blocklisted keys are absent from a public payload. */
export function assertNoInternalLeak(payload: Record<string, unknown>): string[] {
  const leaks: string[] = [];
  for (const key of INTERNAL_FIELD_BLOCKLIST) {
    if (key in payload) leaks.push(key);
  }
  const json = JSON.stringify(payload).toLowerCase();
  for (const needle of [
    "serper_general",
    "service_role",
    "contactphone",
    "contact_email",
    "rawstub",
    "apikey",
    "api_key",
  ]) {
    if (json.includes(needle)) leaks.push(`content:${needle}`);
  }
  return leaks;
}

export function applyOwnerOverrides(
  draft: PublicOpportunityDraft,
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
): { draft: PublicOpportunityDraft; lockedFields: string[] } {
  const locked: string[] = [];
  const next = { ...draft };
  for (const [field, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    (next as Record<string, unknown>)[field] = value;
    locked.push(field);
  }
  return { draft: next, lockedFields: locked };
}
