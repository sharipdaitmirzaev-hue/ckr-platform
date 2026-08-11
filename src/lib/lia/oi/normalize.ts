import {
  resolveBudgetFit,
  resolvePriceStatus,
} from "@/lib/lia/oi/constraints";
import { classifyContentIntent } from "@/lib/lia/oi/content-intent";
import { validateDetailOpportunity } from "@/lib/lia/oi/detail-validate";
import {
  extractFinancialMetrics,
  extractMoneyFromText,
} from "@/lib/lia/oi/extract";
import { oiHash, oiId } from "@/lib/lia/oi/id";
import type { InternetSearchHit } from "@/lib/lia/oi/internet/types";
import { classifyPageType, isCatalogPageType } from "@/lib/lia/oi/page-type";
import { emptyScore } from "@/lib/lia/oi/score";
import type {
  LiaOiCandidate,
  LiaOiClaim,
  LiaOiPriceKind,
  LiaOiSearchPlan,
  LiaOiSourceRef,
} from "@/types/lia-oi";

export function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    u.hostname = u.hostname.replace(/^www\./, "");
    return u.toString().replace(/\/$/, "");
  } catch {
    return url.split("?")[0] ?? url;
  }
}

/** Hit → черновик OpportunityCandidate (без финального анализа/score). */
export function normalizeHit(
  hit: InternetSearchHit,
  plan: LiaOiSearchPlan | null = null,
): LiaOiCandidate {
  const now = new Date().toISOString();
  const discoveredAt = hit.discoveredAt || now;
  const canonical = canonicalUrl(hit.url);
  const isStub = hit.isStub === true;
  const blob = `${hit.title} ${hit.snippet}`;

  let pageType = isStub
    ? ("DETAIL" as const)
    : classifyPageType({
        url: hit.url,
        title: hit.title,
        snippet: hit.snippet,
      });

  const contentIntent = isStub
    ? ("OPPORTUNITY" as const)
    : classifyContentIntent({
        url: hit.url,
        title: hit.title,
        snippet: hit.snippet,
        pageType,
      });

  const money =
    hit.askingPrice != null
      ? {
          amount: hit.askingPrice,
          priceKind: "ASKING_PRICE" as LiaOiPriceKind,
        }
      : extractMoneyFromText(blob);
  const metrics = extractFinancialMetrics(blob);
  const priceAmount = money?.amount ?? hit.investmentRequired ?? null;
  const priceKind: LiaOiPriceKind = money?.priceKind ?? "UNKNOWN";
  const priceStatus = resolvePriceStatus(priceAmount);
  const budgetFit = resolveBudgetFit(priceAmount, plan?.budgetMax);

  const askingPrice =
    priceKind === "INVESTMENT_REQUIRED" ? null : priceAmount;
  const investmentRequired =
    priceKind === "INVESTMENT_REQUIRED" || priceKind === "UNKNOWN"
      ? priceAmount
      : priceKind === "ASKING_PRICE"
        ? null
        : priceAmount;

  let draft: LiaOiCandidate = {
    id: oiId("cand"),
    type: hit.tags?.[0] ?? (isStub ? "opportunity_signal" : "web_opportunity"),
    title: hit.title,
    description: hit.snippet,
    summary: "",
    whyInteresting: [],
    recommendation: "",
    nextStep: "",
    status: "NEW",
    country: "RU",
    region: hit.region,
    city: hit.city,
    industry: hit.industry,
    askingPrice: askingPrice ?? hit.askingPrice ?? null,
    investmentRequired: investmentRequired ?? hit.investmentRequired ?? null,
    revenue: metrics.revenue,
    profit: metrics.profit,
    contactPhone: hit.contactPhone,
    contactEmail: hit.contactEmail,
    sources: [
      {
        id: oiId("src"),
        category: hit.sourceCategory,
        name: hit.sourceName,
        url: hit.url,
        publishedAt: hit.publishedAt,
        discoveredAt,
        isStub,
      } satisfies LiaOiSourceRef,
    ],
    claims: [],
    risks: [],
    unknowns: [],
    toVerify: [],
    score: emptyScore(),
    matchHints: [],
    firstSeenAt: discoveredAt,
    lastSeenAt: now,
    canonicalKey: oiHash(canonical.toLowerCase()),
    rawStubIds: isStub ? [hit.id] : [],
    isStub,
    pageType,
    isCatalogSource: !isStub && isCatalogPageType(pageType),
    contentIntent,
    budgetFit,
    priceStatus,
    priceKind,
  };

  const detail = validateDetailOpportunity(draft);
  pageType = isStub ? "DETAIL" : detail.effectivePageType;
  draft = {
    ...draft,
    pageType,
    isCatalogSource:
      !isStub &&
      (isCatalogPageType(pageType) || contentIntent === "CATALOG"),
    detailConfidence: isStub ? 80 : detail.detailConfidence,
    detailSignals: detail.signals,
    missingFields: detail.missing,
  };

  const claims: LiaOiClaim[] = [
    {
      field: "title",
      value: hit.title,
      kind: "FACT",
      sourceName: hit.sourceName,
      sourceUrl: hit.url,
      note: isStub
        ? "Заголовок из stub-источника (demo)."
        : "Заголовок из выдачи поисковика.",
    },
    {
      field: "source_url",
      value: hit.url,
      kind: "FACT",
      sourceName: hit.sourceName,
      sourceUrl: hit.url,
      note: "URL первоисточника.",
    },
    {
      field: "page_type",
      value: pageType,
      kind: "INFERENCE",
      sourceUrl: hit.url,
      note: `Эвристика + detail_confidence=${draft.detailConfidence}.`,
    },
    {
      field: "content_intent",
      value: contentIntent,
      kind: "INFERENCE",
      sourceUrl: hit.url,
    },
    {
      field: "budget_fit",
      value: budgetFit,
      kind: priceStatus === "KNOWN" ? "INFERENCE" : "UNKNOWN",
      note:
        priceStatus === "UNKNOWN"
          ? "Цена не подтверждена — отсутствие цены ≠ соответствие бюджету."
          : `Сравнение с hard max_budget=${plan?.budgetMax ?? "—"}.`,
    },
    {
      field: "price_status",
      value: priceStatus,
      kind: priceStatus === "KNOWN" ? "FACT" : "UNKNOWN",
    },
  ];

  if (priceAmount != null) {
    claims.push({
      field:
        priceKind === "INVESTMENT_REQUIRED"
          ? "investment_required"
          : "asking_price",
      value: String(priceAmount),
      kind: "FACT",
      sourceName: hit.sourceName,
      sourceUrl: hit.url,
      note: `priceKind=${priceKind}; извлечено из текста. Проверьте на странице.`,
    });
  } else {
    claims.push({
      field: "asking_price",
      value: "не указано",
      kind: "UNKNOWN",
      note: "Цена/инвестиции не найдены в доступном тексте.",
    });
  }

  if (hit.region) {
    claims.push({
      field: "region",
      value: hit.region,
      kind: "FACT",
      sourceName: hit.sourceName,
      sourceUrl: hit.url,
    });
  } else {
    claims.push({
      field: "region",
      value: "не указано",
      kind: "UNKNOWN",
      note: "Регион не извлечён из сниппета.",
    });
  }

  return { ...draft, claims };
}
