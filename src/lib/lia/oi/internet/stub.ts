import { oiHash } from "@/lib/lia/oi/id";
import type {
  InternetSearchHit,
  InternetSearchOptions,
  InternetSearchProvider,
} from "@/lib/lia/oi/internet/types";

/**
 * Демо-корпус для stub. Явно помечен isStub:true.
 * НЕ имитирует «живой» интернет — это синтетические учебные карточки.
 */
const STUB_CORPUS: Omit<InternetSearchHit, "id" | "isStub">[] = [
  {
    title: "[STUB] Производственная площадка под пищевое производство",
    snippet:
      "Демо-карточка: площадка ~1800 м², запрашиваемые инвестиции около 28 млн ₽. Регион: Юг России.",
    url: "https://stub.ckr-center.ru/demo/production-site-28m",
    sourceName: "CKR Stub Catalog",
    sourceCategory: "STUB_DEMO",
    region: "Краснодарский край",
    city: "Краснодар",
    industry: "производство",
    askingPrice: 28_000_000,
    investmentRequired: 28_000_000,
    tags: ["production", "investment", "under_30m"],
  },
  {
    title: "[STUB] Готовый бизнес: мини-гостиница 24 номера",
    snippet:
      "Демо-карточка: туристический объект, ориентир цены 45 млн ₽. Не live-объявление.",
    url: "https://stub.ckr-center.ru/demo/hotel-24",
    sourceName: "CKR Stub Catalog",
    sourceCategory: "STUB_DEMO",
    region: "Краснодарский край",
    city: "Анапа",
    industry: "туризм",
    askingPrice: 45_000_000,
    investmentRequired: 45_000_000,
    tags: ["hotel", "tourism"],
  },
  {
    title: "[STUB] Земельный участок 2.4 га под производство воды",
    snippet:
      "Демо-карточка: земля + коммуникации по границе. Инвестиции в проект оцениваются от 15 млн ₽.",
    url: "https://stub.ckr-center.ru/demo/land-water-plant",
    sourceName: "CKR Stub Catalog",
    sourceCategory: "STUB_DEMO",
    region: "Дагестан",
    city: "Махачкала",
    industry: "сельское хозяйство / производство",
    askingPrice: 12_000_000,
    investmentRequired: 25_000_000,
    tags: ["land", "water", "investment", "under_30m", "dagestan"],
  },
  {
    title: "[STUB] Инвестпроект: расширение пищевого производства",
    snippet:
      "Демо-карточка: требуется партнёр/инвестор до 30 млн ₽. Синтетический сигнал для сценария ЦКР.",
    url: "https://stub.ckr-center.ru/demo/food-expansion-30m",
    sourceName: "CKR Stub Signals",
    sourceCategory: "STUB_DEMO",
    region: "Ростовская область",
    industry: "производство",
    askingPrice: null,
    investmentRequired: 30_000_000,
    tags: ["investment", "under_30m", "production"],
  },
  {
    title: "[STUB] Складской комплекс class B, продажа",
    snippet:
      "Демо-карточка: склад 3200 м², цена ориентир 55 млн ₽. Stub, не реальный лот.",
    url: "https://stub.ckr-center.ru/demo/warehouse-b",
    sourceName: "CKR Stub Catalog",
    sourceCategory: "STUB_DEMO",
    region: "Москва",
    industry: "логистика",
    askingPrice: 55_000_000,
    investmentRequired: 55_000_000,
    tags: ["warehouse", "real_estate"],
  },
  {
    title: "[STUB] Покупатели фасованной муки — оптовый спрос (сигнал)",
    snippet:
      "Демо-сигнал спроса: сети и оптовики интересуются поставками. Не публичный тендер.",
    url: "https://stub.ckr-center.ru/demo/flour-buyers-signal",
    sourceName: "CKR Stub Market Signals",
    sourceCategory: "STUB_DEMO",
    region: "Россия",
    industry: "торговля / производство",
    askingPrice: null,
    investmentRequired: null,
    tags: ["buyers", "demand", "flour"],
  },
  {
    title: "[STUB] Дубликат площадки (для проверки dedup)",
    snippet:
      "Почти та же производственная площадка — должен схлопнуться с основным stub.",
    url: "https://stub.ckr-center.ru/demo/production-site-28m?utm=dup",
    sourceName: "CKR Stub Mirror",
    sourceCategory: "STUB_DEMO",
    region: "Краснодарский край",
    city: "Краснодар",
    industry: "производство",
    askingPrice: 28_000_000,
    investmentRequired: 28_000_000,
    tags: ["production", "investment", "under_30m", "duplicate"],
  },
  {
    title: "[STUB] Льготное финансирование МСП — сигнал программы",
    snippet:
      "Демо-сигнал господдержки рядом с производственными проектами. Не заявка.",
    url: "https://stub.ckr-center.ru/demo/msp-support-signal",
    sourceName: "CKR Stub Support",
    sourceCategory: "STUB_DEMO",
    region: "Россия",
    industry: "финансы / поддержка",
    tags: ["support", "grant_signal"],
  },
];

function scoreHit(hit: Omit<InternetSearchHit, "id" | "isStub">, query: string) {
  const q = query.toLowerCase();
  let score = 0;
  const blob = `${hit.title} ${hit.snippet} ${hit.region ?? ""} ${hit.industry ?? ""} ${(hit.tags ?? []).join(" ")}`.toLowerCase();
  for (const token of q.split(/[^a-zA-Zа-яА-Я0-9]+/).filter((t) => t.length > 2)) {
    if (blob.includes(token)) score += 2;
  }
  if (/30|инвест|проект|производ/.test(q) && hit.tags?.includes("under_30m")) {
    score += 5;
  }
  if (/дагестан/.test(q) && /дагестан/i.test(hit.region ?? "")) score += 4;
  if (/гостиниц|туризм/.test(q) && hit.tags?.includes("hotel")) score += 4;
  if (/мук/.test(q) && hit.tags?.includes("flour")) score += 5;
  if (/земл|вод/.test(q) && hit.tags?.includes("land")) score += 4;
  return score;
}

export class StubInternetSearchProvider implements InternetSearchProvider {
  id = "stub-internet";
  label = "Stub Internet Search (demo)";
  mode = "stub" as const;

  async search(
    query: string,
    options?: InternetSearchOptions,
  ): Promise<InternetSearchHit[]> {
    const limit = options?.limit ?? 8;
    const budgetMax = options?.budgetMax ?? null;

    const ranked = STUB_CORPUS.map((item) => ({
      item,
      score: scoreHit(item, query),
    }))
      .filter(({ item, score }) => {
        if (score <= 0 && !/росси/i.test(query)) return false;
        if (
          budgetMax != null &&
          item.investmentRequired != null &&
          item.investmentRequired > budgetMax * 1.15
        ) {
          // оставляем немного выше бюджета как «близкие», но понижаем
          return item.investmentRequired <= budgetMax * 1.6;
        }
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Если фильтр слишком жёсткий — вернём top stub с пометкой низкой релевантности
    const pool =
      ranked.length > 0
        ? ranked
        : STUB_CORPUS.slice(0, limit).map((item) => ({ item, score: 0 }));

    return pool.map(({ item }) => ({
      ...item,
      id: `stub_${oiHash(item.url)}`,
      isStub: true as const,
      title: item.title.startsWith("[STUB]")
        ? item.title
        : `[STUB] ${item.title}`,
    }));
  }
}
