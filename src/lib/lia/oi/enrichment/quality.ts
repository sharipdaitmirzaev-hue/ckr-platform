/**
 * data_quality_score + matching_readiness for Stage 2C.1.
 */

import type {
  LiaOiCandidate,
  LiaOiMatchingReadiness,
  LiaOiStructuredField,
} from "@/types/lia-oi";

const KEY_FIELDS_BY_TYPE: Record<string, string[]> = {
  AUCTION_ASSET: [
    "official_url",
    "lot_id",
    "region",
    "starting_price",
    "deadline_at",
    "auction_status",
    "organizer",
  ],
  PROCUREMENT: [
    "official_url",
    "procurement_id",
    "region",
    "nmck",
    "deadline_at",
    "procurement_stage",
    "customer",
  ],
  SUPPORT_PROGRAM: [
    "official_url",
    "program_id",
    "region",
    "support_amount",
    "deadline_at",
    "support_type",
    "operator",
  ],
  WEB_LISTING: [
    "official_url",
    "region",
    "asking_price",
    "deadline_at",
  ],
  OTHER: ["official_url", "region", "asking_price"],
};

function hasConfirmed(
  fields: LiaOiStructuredField[],
  name: string,
  minConf = 70,
): boolean {
  return fields.some(
    (f) =>
      f.field === name &&
      f.value != null &&
      f.value !== "" &&
      f.kind === "FACT" &&
      f.confidence >= minConf,
  );
}

export function computeDataQuality(input: {
  candidate: LiaOiCandidate;
  structuredFields: LiaOiStructuredField[];
}): {
  dataQualityScore: number;
  matchingReadiness: LiaOiMatchingReadiness;
  confirmedFields: string[];
  unknownFields: string[];
} {
  const c = input.candidate;
  const fields = input.structuredFields;
  const type = c.opportunityType || "WEB_LISTING";
  const keys = KEY_FIELDS_BY_TYPE[type] || KEY_FIELDS_BY_TYPE.OTHER!;

  let score = 0;
  const confirmed: string[] = [];
  const unknown: string[] = [];

  const checks: Array<{ field: string; points: number; ok: boolean }> = [
    {
      field: "official_url",
      points: 15,
      ok: Boolean(c.isOfficialSource || c.canonicalUrl || c.sources[0]?.url),
    },
    {
      field: "lot_id",
      points: 15,
      ok:
        hasConfirmed(fields, "lot_id") ||
        (type === "AUCTION_ASSET" && Boolean(c.sourceObjectId)),
    },
    {
      field: "procurement_id",
      points: 15,
      ok:
        hasConfirmed(fields, "procurement_id") ||
        (type === "PROCUREMENT" && Boolean(c.sourceObjectId)),
    },
    {
      field: "program_id",
      points: 10,
      ok:
        hasConfirmed(fields, "program_id") ||
        (type === "SUPPORT_PROGRAM" && Boolean(c.sourceObjectId)),
    },
    {
      field: "starting_price",
      points: 15,
      ok:
        hasConfirmed(fields, "starting_price") ||
        hasConfirmed(fields, "current_price") ||
        (c.startingPrice != null && c.priceStatus === "KNOWN"),
    },
    {
      field: "nmck",
      points: 15,
      ok: hasConfirmed(fields, "nmck") || c.nmck != null,
    },
    {
      field: "support_amount",
      points: 12,
      ok: hasConfirmed(fields, "support_amount") || c.supportAmount != null,
    },
    {
      field: "asking_price",
      points: 12,
      ok:
        hasConfirmed(fields, "asking_price") ||
        (c.askingPrice != null && c.priceStatus === "KNOWN"),
    },
    {
      field: "deadline_at",
      points: 15,
      ok: hasConfirmed(fields, "deadline_at") || Boolean(c.deadlineAt),
    },
    {
      field: "region",
      points: 10,
      ok: hasConfirmed(fields, "region") || Boolean(c.region),
    },
    {
      field: "auction_status",
      points: 8,
      ok: hasConfirmed(fields, "auction_status") || Boolean(c.auctionStatus),
    },
    {
      field: "procurement_stage",
      points: 8,
      ok:
        hasConfirmed(fields, "procurement_stage") || Boolean(c.procurementStage),
    },
    {
      field: "organizer",
      points: 8,
      ok: hasConfirmed(fields, "organizer") || Boolean(c.organizer),
    },
    {
      field: "customer",
      points: 8,
      ok: hasConfirmed(fields, "customer") || Boolean(c.customer),
    },
    {
      field: "operator",
      points: 8,
      ok: hasConfirmed(fields, "operator"),
    },
    {
      field: "support_type",
      points: 8,
      ok: hasConfirmed(fields, "support_type") || Boolean(c.supportType),
    },
  ];

  for (const ch of checks) {
    if (!keys.includes(ch.field) && !["official_url", "region"].includes(ch.field)) {
      // still count universal official_url/region; skip type-irrelevant
      if (!["official_url", "region", "asking_price"].includes(ch.field)) continue;
    }
    if (ch.ok) {
      score += ch.points;
      if (!confirmed.includes(ch.field)) confirmed.push(ch.field);
    } else if (keys.includes(ch.field)) {
      unknown.push(ch.field);
    }
  }

  // DETAIL bonus / LIST penalty
  if (c.pageType === "DETAIL" && !c.isCatalogSource) score += 10;
  if (c.pageType === "LIST" || c.pageType === "NEWS" || c.pageType === "GUIDE") {
    score = Math.min(score, 35);
  }
  if (c.enrichedFromFetch) score += 5;

  score = Math.max(0, Math.min(100, score));

  const hasType = Boolean(c.opportunityType && c.opportunityType !== "OTHER");
  const hasRegion = confirmed.includes("region") || Boolean(c.region);
  const hasMoney =
    confirmed.includes("starting_price") ||
    confirmed.includes("nmck") ||
    confirmed.includes("support_amount") ||
    confirmed.includes("asking_price") ||
    confirmed.includes("current_price");
  const hasStatus =
    confirmed.includes("auction_status") ||
    confirmed.includes("procurement_stage") ||
    confirmed.includes("support_type");
  const hasSource = confirmed.includes("official_url") || Boolean(c.isOfficialSource);
  const hasId =
    confirmed.includes("lot_id") ||
    confirmed.includes("procurement_id") ||
    confirmed.includes("program_id") ||
    Boolean(c.sourceObjectId);

  let matchingReadiness: LiaOiMatchingReadiness = "NOT_READY";
  if (c.pageType !== "DETAIL" || c.isCatalogSource) {
    matchingReadiness = "NOT_READY";
  } else if (hasType && hasRegion && hasMoney && hasSource && (hasStatus || hasId)) {
    matchingReadiness = "READY";
  } else if (hasSource && (hasMoney || hasId || hasRegion)) {
    matchingReadiness = "PARTIAL";
  } else {
    matchingReadiness = "NOT_READY";
  }

  // Never mark READY on weak quality
  if (matchingReadiness === "READY" && score < 55) {
    matchingReadiness = "PARTIAL";
  }

  return {
    dataQualityScore: score,
    matchingReadiness,
    confirmedFields: confirmed,
    unknownFields: unknown.slice(0, 12),
  };
}
