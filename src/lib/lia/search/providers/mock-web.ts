import { normalizeExternalResults } from "@/lib/lia/search/normalize";
import type { WebSearchOptions, WebSearchProvider } from "@/lib/lia/search/types";
import type { ExternalSearchResult } from "@/types/lia";

/** Fallback без ключа API — детерминированный mock для локальной разработки. */
export class MockWebSearchProvider implements WebSearchProvider {
  id = "web-mock";
  label = "Внешний поиск (mock)";
  kind = "external" as const;

  async search(
    query: string,
    options?: WebSearchOptions,
  ): Promise<ExternalSearchResult[]> {
    const limit = options?.limit ?? 5;
    const region = options?.region || "Россия";
    const category = options?.category || "бизнес";
    const q = query.trim() || "оборудование и поставщики";
    const today = new Date().toISOString().slice(0, 10);

    const raw = [
      {
        title: `Поставщик оборудования · ${category}`,
        source: "mock-equipment.directory",
        url: `https://example.com/equipment?q=${encodeURIComponent(q)}`,
        published_at: today,
        description: `Каталог оборудования для «${q}» (mock). Проверьте актуальность самостоятельно.`,
        trust_score: 0.35,
      },
      {
        title: "Производители тары и упаковки",
        source: "mock-packaging.market",
        url: "https://example.com/packaging",
        published_at: today,
        description:
          "Список производителей тары (mock). Внешние данные не верифицированы ЦКР.",
        trust_score: 0.32,
      },
      {
        title: `Коммерческая недвижимость · ${region}`,
        source: "mock-realty.index",
        url: "https://example.com/realty",
        published_at: today,
        description: `Объявления о помещениях в регионе ${region} (mock).`,
        trust_score: 0.3,
      },
      {
        title: "Поставщики сырья и комплектующих",
        source: "mock-suppliers.b2b",
        url: "https://example.com/suppliers",
        published_at: today,
        description: `B2B-поставщики по запросу «${q}» (mock).`,
        trust_score: 0.28,
      },
      {
        title: "Отраслевые требования и меры поддержки",
        source: "mock-support.gov",
        url: "https://example.com/support",
        published_at: today,
        description:
          "Публичные ориентиры (mock). Уточняйте условия на официальных сайтах.",
        trust_score: 0.4,
      },
    ];

    return normalizeExternalResults(raw, {
      query: q,
      source: "mock",
      trustScore: 0.3,
    }).slice(0, limit);
  }
}
