import { isCatalogPageType, isSeoArticlePage } from "@/lib/lia/oi/page-type";
import type {
  LiaOiCandidate,
  LiaOiPriority,
  LiaOiScore,
  LiaOiScoreBreakdown,
  LiaOiSearchPlan,
} from "@/types/lia-oi";

function clamp(n: number, min = 0, max = 10) {
  return Math.max(min, Math.min(max, n));
}

function clamp100(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function emptyScore(): LiaOiScore {
  return {
    overall: 0,
    confidence: 0,
    relevance: 0,
    quality: 0,
    opportunity: 0,
    breakdown: {
      market: 0,
      economics: 0,
      location: 0,
      demand: 0,
      competition: 0,
      execution: 0,
      legal: 0,
      sourceConfidence: 0,
      dataCompleteness: 0,
      strategicFit: 0,
    },
    explanation: ["Оценка ещё не выполнена."],
    whyTop: [],
    priority: "NORMAL",
  };
}

function priorityFrom(overall: number, confidence: number): LiaOiPriority {
  if (overall >= 75 && confidence >= 55) return "HIGH_PRIORITY";
  if (overall >= 60) return "INTERESTING";
  return "NORMAL";
}

/** Explainable multi-score: relevance / quality / opportunity / confidence. */
export function scoreCandidate(
  candidate: LiaOiCandidate,
  plan?: LiaOiSearchPlan,
): LiaOiScore {
  const explanation: string[] = [];
  const whyTop: string[] = [];
  const b: LiaOiScoreBreakdown = {
    market: 5,
    economics: 5,
    location: 5,
    demand: 5,
    competition: 5,
    execution: 5,
    legal: 4,
    sourceConfidence: 3,
    dataCompleteness: 4,
    strategicFit: 5,
  };

  const isStub = candidate.isStub || candidate.sources.every((s) => s.isStub);
  const pageType = candidate.pageType || "UNKNOWN";
  const isCatalog =
    candidate.isCatalogSource || isCatalogPageType(pageType);
  const price = candidate.investmentRequired ?? candidate.askingPrice;
  const descLen = (candidate.description || "").trim().length;
  const budgetFit = candidate.budgetFit ?? "UNKNOWN";
  const priceStatus = candidate.priceStatus ?? (price != null ? "KNOWN" : "UNKNOWN");
  const contentIntent = candidate.contentIntent ?? "UNKNOWN";
  const detailConf = candidate.detailConfidence ?? 0;

  // --- relevance ---
  let relevance = 45;
  if (plan?.intent === "business_opportunities" || plan?.intent === "investment_opportunities") {
    relevance += 8;
  }
  if (plan?.intent === "business_for_sale" && /бизнес|франшиз|прода/i.test(candidate.title)) {
    relevance += 10;
  }
  if (budgetFit === "FIT") {
    relevance += 15;
    whyTop.push("budget FIT");
  } else if (budgetFit === "OVER_BUDGET") {
    relevance -= 35;
    explanation.push("OVER_BUDGET: достоверно выше hard max_budget.");
  } else if (plan?.budgetMax) {
    relevance -= 8;
    explanation.push(
      "Цена UNKNOWN — отсутствие цены не считается соответствием бюджету.",
    );
  }
  if (candidate.region) relevance += 8;
  else relevance -= 5;
  if (isCatalog) relevance -= 12;
  if (contentIntent === "OPPORTUNITY") relevance += 10;
  if (
    contentIntent === "GUIDE" ||
    contentIntent === "ARTICLE" ||
    contentIntent === "NEWS" ||
    contentIntent === "SOCIAL"
  ) {
    relevance -= 25;
  }

  const sourceUrl = candidate.sources[0]?.url ?? "";
  const isSeoArticle = isSeoArticlePage({
    url: sourceUrl,
    title: candidate.title,
    snippet: candidate.description,
  });
  if (isSeoArticle) relevance -= 18;

  // --- quality ---
  let quality = 30;
  if (pageType === "DETAIL") {
    quality += 25;
    whyTop.push("конкретный объект (DETAIL)");
    explanation.push("Тип страницы DETAIL — приоритет над каталогами.");
  } else if (pageType === "LIST" || pageType === "CATEGORY") {
    quality -= 15;
    explanation.push(
      `Тип страницы ${pageType}: это источник для дальнейшего поиска, а не конкретная возможность.`,
    );
  } else if (pageType === "HOMEPAGE") {
    quality -= 20;
    explanation.push("Homepage каталога — низкое качество сигнала.");
  }

  if (isSeoArticle) {
    quality -= 20;
    explanation.push("SEO-статья без конкретного предложения — quality снижен.");
  }

  if (detailConf >= 55) {
    quality += 12;
    whyTop.push(`detail_confidence ${detailConf}`);
  } else if (detailConf > 0 && detailConf < 40 && pageType === "DETAIL") {
    quality -= 10;
    explanation.push("URL похож на DETAIL, но мало сигналов конкретного объекта.");
  }

  // Цена на каталоге/статье часто «от N млн» — слабый сигнал
  if (priceStatus === "KNOWN" && !isCatalog && !isSeoArticle) {
    quality += 15;
    whyTop.push("есть цена");
  } else if (priceStatus === "KNOWN" && (isCatalog || isSeoArticle)) {
    quality += 4;
    explanation.push("Цена найдена в тексте, но страница не DETAIL.");
  } else {
    quality -= 8;
    explanation.push("Цена/инвестиции не указаны (price_status=UNKNOWN).");
  }
  if (candidate.region) {
    quality += 10;
    whyTop.push("подтверждён регион");
  } else {
    explanation.push("География неизвестна — quality снижен.");
  }
  if (descLen >= 120) quality += 10;
  else if (descLen < 40) quality -= 10;
  if (candidate.sources[0]?.publishedAt || candidate.sources[0]?.discoveredAt) {
    quality += 5;
  }
  if (candidate.sources.length > 1) {
    quality += 8;
    whyTop.push(`${candidate.sources.length} источника`);
  }
  if (candidate.contactPhone || candidate.contactEmail) {
    quality += 8;
    whyTop.push("есть публичный контакт");
  }
  if (candidate.revenue != null || candidate.profit != null || candidate.paybackPeriod) {
    quality += 10;
    whyTop.push("есть финансовые показатели");
  }
  if (candidate.enrichedFromFetch) {
    quality += 8;
    explanation.push("Карточка обогащена safe-fetch detail-страницы.");
  }
  if (isStub) {
    quality -= 10;
    explanation.push("Stub/demo источник.");
  }

  // --- opportunity / breakdown ---
  if (isStub) {
    b.sourceConfidence = 3;
  } else if (candidate.enrichedFromFetch) {
    b.sourceConfidence = 7;
  } else {
    b.sourceConfidence = 5;
  }

  if (price != null) {
    b.dataCompleteness = clamp(b.dataCompleteness + 2);
    b.economics = clamp(6 + (price >= 100_000 && price <= 100_000_000 ? 2 : 0));
    explanation.push(
      `Ориентир цены/инвестиций: ${price.toLocaleString("ru-RU")} ₽.`,
    );
  } else {
    b.economics = 4;
    b.dataCompleteness = clamp(b.dataCompleteness - 1);
  }

  if (plan?.budgetMax && price != null) {
    if (price <= plan.budgetMax) {
      b.strategicFit = clamp(b.strategicFit + 3);
      explanation.push("Вписывается в бюджет запроса владельца.");
    } else if (price <= plan.budgetMax * 1.25) {
      b.strategicFit = clamp(b.strategicFit + 1);
    } else {
      b.strategicFit = clamp(b.strategicFit - 2);
      explanation.push("Существенно выше бюджета запроса.");
    }
  }

  if (candidate.region) {
    b.location = isCatalog ? 6 : 8;
  } else {
    b.location = 3;
  }

  if (pageType === "DETAIL") {
    b.execution = 7;
    b.market = 6;
  } else if (isCatalog) {
    b.execution = 3;
    b.market = 4;
    b.strategicFit = clamp(b.strategicFit - 2);
  }

  if (candidate.sources.length > 1) {
    b.sourceConfidence = clamp(b.sourceConfidence + 1);
  }

  b.legal = 4;
  explanation.push(
    "Юридическая чистота не проверена — требуется due diligence (UNKNOWN).",
  );

  const weights: Array<keyof LiaOiScoreBreakdown> = [
    "market",
    "economics",
    "location",
    "demand",
    "competition",
    "execution",
    "legal",
    "sourceConfidence",
    "dataCompleteness",
    "strategicFit",
  ];
  const avg =
    weights.reduce((sum, key) => sum + b[key], 0) / weights.length;

  let opportunity = avg * 10;
  if (pageType === "DETAIL" && detailConf >= 40) opportunity += 8;
  if (isCatalog) opportunity -= 18;
  if (isSeoArticle) opportunity -= 22;
  if (contentIntent === "GUIDE" || contentIntent === "ARTICLE") opportunity -= 25;
  if (budgetFit === "OVER_BUDGET") opportunity -= 40;
  if (budgetFit === "FIT" && !isCatalog && !isSeoArticle) opportunity += 8;
  if (priceStatus === "UNKNOWN") opportunity -= 6;

  const confidence = clamp100(
    ((b.sourceConfidence + b.dataCompleteness + (isCatalog ? 2 : b.legal)) /
      3) *
      10 +
      (candidate.enrichedFromFetch ? 8 : 0) +
      Math.round(detailConf * 0.15) -
      (isCatalog ? 15 : 0) -
      (priceStatus === "UNKNOWN" ? 12 : 0) -
      (budgetFit === "OVER_BUDGET" ? 20 : 0),
  );

  relevance = clamp100(relevance);
  quality = clamp100(quality);
  opportunity = clamp100(opportunity);

  // overall = weighted blend, DETAIL-first
  const overall = clamp100(
    opportunity * 0.45 + quality * 0.3 + relevance * 0.25,
  );

  if (isCatalog && whyTop.length === 0) {
    whyTop.push("каталог — только как источник для поиска");
  }

  explanation.push(
    `relevance=${relevance}, quality=${quality}, opportunity=${opportunity}, confidence=${confidence}.`,
  );

  return {
    overall,
    confidence,
    relevance,
    quality,
    opportunity,
    breakdown: b,
    explanation,
    whyTop: whyTop.slice(0, 5),
    priority: priorityFrom(overall, confidence),
  };
}
