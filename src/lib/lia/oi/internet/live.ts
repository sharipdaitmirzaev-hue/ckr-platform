/**
 * Тонкий адаптер: существующий WebSearchProvider → InternetSearchHit для OI.
 * Не дублирует Serper client — использует getWebSearchProvider() / WebApiSearchProvider.
 */

import {
  classifySourceCategory,
  extractIndustryHint,
  extractLocationFromText,
  extractMoneyFromText,
  extractPublicContacts,
} from "@/lib/lia/oi/extract";
import { oiHash } from "@/lib/lia/oi/id";
import type {
  InternetSearchHit,
  InternetSearchOptions,
  InternetSearchProvider,
} from "@/lib/lia/oi/internet/types";
import type { WebSearchProvider } from "@/lib/lia/search/types";
import type { ExternalSearchResult } from "@/types/lia";

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

export function mapExternalResultToHit(
  result: ExternalSearchResult,
): InternetSearchHit {
  const text = `${result.title} ${result.description}`;
  const money = extractMoneyFromText(text);
  const location = extractLocationFromText(text);
  const industry = extractIndustryHint(text);
  const contacts = extractPublicContacts(text);
  const category = classifySourceCategory(result.url, text);
  const isInvest = money?.priceKind === "INVESTMENT_REQUIRED";

  return {
    id: `live_${oiHash(result.url || result.id)}`,
    title: result.title?.trim() || "Без названия",
    snippet: result.description?.trim() || "",
    url: result.url,
    sourceName: domainOf(result.url) || result.source || "web",
    sourceCategory: category,
    region: location?.region,
    city: location?.city,
    industry,
    askingPrice: money && !isInvest ? money.amount : null,
    investmentRequired: money && isInvest ? money.amount : money?.amount ?? null,
    publishedAt: result.published_at || undefined,
    discoveredAt: new Date().toISOString(),
    isStub: false,
    tags: ["live", result.source].filter(Boolean) as string[],
    contactPhone: contacts.phone,
    contactEmail: contacts.email,
  };
}

export class LiveInternetSearchProvider implements InternetSearchProvider {
  id = "live-web";
  label: string;
  mode = "live" as const;

  constructor(
    private readonly web: WebSearchProvider,
    engineLabel = "Serper",
  ) {
    this.label = `LIVE — ${engineLabel} (via WebSearchProvider)`;
  }

  async search(
    query: string,
    options?: InternetSearchOptions,
  ): Promise<InternetSearchHit[]> {
    const limit = options?.limit ?? 8;
    const results = await this.web.search(query, {
      limit,
      region: options?.region,
    });
    return results.map(mapExternalResultToHit);
  }
}
