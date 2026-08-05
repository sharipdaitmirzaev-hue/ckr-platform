import type { ExternalSearchResult } from "@/types/lia";
import type { WebSearchProvider } from "@/lib/lia/search/types";

/**
 * Внешний поиск. Сейчас — mock.
 * Архитектура готова к подключению Web Search API и специализированных сервисов
 * через LIA_WEB_SEARCH_PROVIDER / LIA_WEB_SEARCH_API_KEY.
 *
 * Важно: результаты всегда trusted: false — не доверять автоматически.
 */
export class MockWebSearchProvider implements WebSearchProvider {
  id = "web-mock";
  label = "Внешний поиск (mock)";
  kind = "external" as const;

  async search(
    query: string,
    options?: { limit?: number; region?: string; category?: string },
  ): Promise<ExternalSearchResult[]> {
    const limit = options?.limit ?? 5;
    const region = options?.region || "Россия";
    const category = options?.category || "бизнес";
    const q = query.trim() || "оборудование и поставщики";
    const today = new Date().toISOString().slice(0, 10);

    const catalog: ExternalSearchResult[] = [
      {
        title: `Поставщик оборудования · ${category}`,
        source: "mock-equipment.directory",
        url: "https://example.com/equipment",
        date: today,
        description: `Каталог оборудования для «${q}» (mock). Проверьте актуальность и условия поставки самостоятельно.`,
        confidence: 0.55,
        trusted: false,
      },
      {
        title: "Производители тары и упаковки",
        source: "mock-packaging.market",
        url: "https://example.com/packaging",
        date: today,
        description:
          "Список производителей тары (mock). Внешние данные не верифицированы ЦКР.",
        confidence: 0.48,
        trusted: false,
      },
      {
        title: `Коммерческая недвижимость · ${region}`,
        source: "mock-realty.index",
        url: "https://example.com/realty",
        date: today,
        description: `Объявления о помещениях в регионе ${region} (mock).`,
        confidence: 0.42,
        trusted: false,
      },
      {
        title: "Поставщики сырья и комплектующих",
        source: "mock-suppliers.b2b",
        url: "https://example.com/suppliers",
        date: today,
        description: `B2B-поставщики по запросу «${q}» (mock).`,
        confidence: 0.4,
        trusted: false,
      },
      {
        title: "Отраслевые гранты и меры поддержки",
        source: "mock-support.gov",
        url: "https://example.com/support",
        date: today,
        description:
          "Публичные меры поддержки (mock). Уточняйте условия на официальных сайтах.",
        confidence: 0.35,
        trusted: false,
      },
      {
        title: "Оборудование б/у и лизинг",
        source: "mock-leasing.hub",
        url: "https://example.com/leasing",
        date: today,
        description: "Лизинговые предложения и б/у оборудование (mock).",
        confidence: 0.38,
        trusted: false,
      },
      {
        title: "Логистические операторы",
        source: "mock-logistics.net",
        url: "https://example.com/logistics",
        date: today,
        description: `Логистика для проекта в ${region} (mock).`,
        confidence: 0.33,
        trusted: false,
      },
      {
        title: "Производители тары ПЭТ / стекло",
        source: "mock-packaging.market",
        url: "https://example.com/pet-glass",
        date: today,
        description: "Производители тары (mock). Сверьте сертификаты.",
        confidence: 0.45,
        trusted: false,
      },
    ];

    return catalog.slice(0, limit).map((item) => ({ ...item, trusted: false }));
  }
}

/**
 * Фабрика внешнего провайдера.
 * Позже: web_api | serper | custom — без смены контракта.
 */
export function getWebSearchProvider(): WebSearchProvider {
  const name = (process.env.LIA_WEB_SEARCH_PROVIDER || "mock").toLowerCase();
  // Пока только mock; ключи внешних API не используются.
  if (name === "mock" || !process.env.LIA_WEB_SEARCH_API_KEY) {
    return new MockWebSearchProvider();
  }
  // Заглушка на будущее подключение реального API.
  return new MockWebSearchProvider();
}

export const webSearchProvider = getWebSearchProvider();
