/**
 * Stage 2A.2 — result buckets after pipeline.
 */

import { isNegativeContentIntent } from "@/lib/lia/oi/content-intent";
import type {
  LiaOiBucketCounts,
  LiaOiCandidate,
  LiaOiResultBucket,
} from "@/types/lia-oi";

const TOP_MIN_DETAIL_CONF = 40;
const TOP_MIN_OVERALL = 42;

export function assignResultBucket(
  candidate: LiaOiCandidate,
): Pick<
  LiaOiCandidate,
  "resultBucket" | "rejectReason" | "whyRecommend" | "missingFields"
> {
  const intent = candidate.contentIntent ?? "UNKNOWN";
  const budgetFit = candidate.budgetFit ?? "UNKNOWN";
  const priceStatus = candidate.priceStatus ?? "UNKNOWN";
  const detailConf = candidate.detailConfidence ?? 0;
  const missingFields = Array.from(new Set([...(candidate.unknowns || [])]));

  if (budgetFit === "OVER_BUDGET") {
    return {
      resultBucket: "REJECTED",
      rejectReason: "OVER_BUDGET: цена достоверно выше hard max_budget",
      whyRecommend: [],
      missingFields,
    };
  }

  if (isNegativeContentIntent(intent)) {
    return {
      resultBucket: "REJECTED",
      rejectReason: `Негативный content_intent=${intent} (guide/article/news/social)`,
      whyRecommend: [],
      missingFields,
    };
  }

  if (intent === "CATALOG" || candidate.isCatalogSource) {
    return {
      resultBucket: "SOURCE_CATALOGS",
      rejectReason: undefined,
      whyRecommend: [
        "Каталог/листинг — источник для дальнейшего поиска, не конкретная возможность",
      ],
      missingFields: ["конкретный объект"],
    };
  }

  const whyRecommend: string[] = [];
  if (candidate.pageType === "DETAIL") whyRecommend.push("конкретный объект");
  if (priceStatus === "KNOWN") whyRecommend.push("есть подтверждённая цена");
  if (candidate.region) whyRecommend.push("подтверждён регион");
  if ((candidate.detailConfidence ?? 0) >= 50) {
    whyRecommend.push(`detail_confidence ${detailConf}`);
  }
  if (candidate.score.whyTop?.length) {
    whyRecommend.push(...candidate.score.whyTop.slice(0, 2));
  }

  // TOP: конкретное предложение + FIT + достаточная уверенность detail
  const isOpportunity = intent === "OPPORTUNITY" || intent === "UNKNOWN";
  if (
    isOpportunity &&
    budgetFit === "FIT" &&
    priceStatus === "KNOWN" &&
    detailConf >= TOP_MIN_DETAIL_CONF &&
    candidate.score.overall >= TOP_MIN_OVERALL &&
    !candidate.isCatalogSource
  ) {
    return {
      resultBucket: "TOP_OPPORTUNITIES",
      rejectReason: undefined,
      whyRecommend: whyRecommend.slice(0, 5),
      missingFields,
    };
  }

  // NEEDS_RESEARCH: интересно, но цена/критичные данные UNKNOWN
  // (OVER_BUDGET уже возвращён выше)
  if (
    isOpportunity &&
    (budgetFit === "FIT" || budgetFit === "UNKNOWN") &&
    !candidate.isCatalogSource &&
    (priceStatus === "UNKNOWN" ||
      detailConf >= 25 ||
      candidate.score.overall >= 40)
  ) {
    if (priceStatus === "UNKNOWN") {
      missingFields.push("подтверждённая цена");
    }
    return {
      resultBucket: "NEEDS_RESEARCH",
      rejectReason: undefined,
      whyRecommend:
        whyRecommend.length > 0
          ? whyRecommend.slice(0, 5)
          : ["интересный сигнал, данных недостаточно"],
      missingFields: Array.from(new Set(missingFields)),
    };
  }

  return {
    resultBucket: "REJECTED",
    rejectReason: "Низкая релевантность / недостаточно сигналов возможности",
    whyRecommend: [],
    missingFields,
  };
}

export function applyBuckets(candidates: LiaOiCandidate[]): {
  candidates: LiaOiCandidate[];
  counts: LiaOiBucketCounts;
  top: LiaOiCandidate[];
  needsResearch: LiaOiCandidate[];
  catalogs: LiaOiCandidate[];
  rejected: LiaOiCandidate[];
} {
  const withBuckets = candidates.map((c) => {
    const assigned = assignResultBucket(c);
    return { ...c, ...assigned };
  });

  const top = withBuckets
    .filter((c) => c.resultBucket === "TOP_OPPORTUNITIES")
    .sort((a, b) => b.score.overall - a.score.overall);
  const needsResearch = withBuckets
    .filter((c) => c.resultBucket === "NEEDS_RESEARCH")
    .sort((a, b) => b.score.overall - a.score.overall);
  const catalogs = withBuckets
    .filter((c) => c.resultBucket === "SOURCE_CATALOGS")
    .sort((a, b) => b.score.overall - a.score.overall);
  const rejected = withBuckets.filter((c) => c.resultBucket === "REJECTED");

  const order: LiaOiResultBucket[] = [
    "TOP_OPPORTUNITIES",
    "NEEDS_RESEARCH",
    "SOURCE_CATALOGS",
    "REJECTED",
  ];
  const ranked = [...top, ...needsResearch, ...catalogs, ...rejected];
  // preserve bucket order; within already sorted
  ranked.sort((a, b) => {
    const ai = order.indexOf(a.resultBucket!);
    const bi = order.indexOf(b.resultBucket!);
    if (ai !== bi) return ai - bi;
    return b.score.overall - a.score.overall;
  });

  return {
    candidates: ranked,
    counts: {
      TOP_OPPORTUNITIES: top.length,
      NEEDS_RESEARCH: needsResearch.length,
      SOURCE_CATALOGS: catalogs.length,
      REJECTED: rejected.length,
    },
    top,
    needsResearch,
    catalogs,
    rejected,
  };
}
