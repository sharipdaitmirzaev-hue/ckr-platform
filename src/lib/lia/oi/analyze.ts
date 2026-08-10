import { scoreCandidate } from "@/lib/lia/oi/score";
import type { LiaOiCandidate, LiaOiSearchPlan } from "@/types/lia-oi";

/**
 * Analyzer + provenance. Не выдумывает недостающие факты.
 */
export function analyzeCandidate(
  candidate: LiaOiCandidate,
  plan?: LiaOiSearchPlan,
): LiaOiCandidate {
  const isStub = candidate.isStub || candidate.sources.every((s) => s.isStub);
  const isCatalog = candidate.isCatalogSource;
  const price = candidate.investmentRequired ?? candidate.askingPrice;
  const whyInteresting: string[] = [];
  const risks: string[] = [
    isStub
      ? "Данные из stub/demo — нельзя принимать инвестиционное решение без проверки первоисточника."
      : candidate.enrichedFromFetch
        ? "Данные частично с detail-страницы (safe-fetch). HTML untrusted — проверьте первоисточник."
        : "Данные из поискового сниппета — не due diligence. Обязательно откройте URL первоисточника.",
  ];
  const unknowns: string[] = [];
  const toVerify: string[] = [
    "Актуальность предложения и статус объекта",
    "Правовой статус / обременения",
    "Реальные финансовые показатели",
  ];

  if (isCatalog) {
    whyInteresting.push(
      "Это источник для дальнейшего поиска, а не конкретная возможность (LIST/CATEGORY/HOMEPAGE).",
    );
    risks.push("Каталожная страница — нет одного проверяемого объекта.");
  } else if (candidate.pageType === "DETAIL") {
    whyInteresting.push("Конкретная detail-страница объекта (INFERENCE по URL/title).");
  }

  if (price != null) {
    whyInteresting.push(
      isStub
        ? `Ориентир вложений ${price.toLocaleString("ru-RU")} ₽ (FACT из stub-карточки).`
        : `В тексте встречается сумма ${price.toLocaleString("ru-RU")} ₽ (FACT относительно доступного текста).`,
    );
  } else {
    unknowns.push("Цена / требуемые инвестиции");
  }

  if (candidate.region) {
    whyInteresting.push(
      `Локация: ${candidate.region}${candidate.city ? `, ${candidate.city}` : ""}.`,
    );
  } else {
    unknowns.push("Точный регион / адрес");
  }

  if (candidate.industry) {
    whyInteresting.push(
      `Отраслевой контур: ${candidate.industry} (INFERENCE по ключевым словам).`,
    );
  }

  if (
    plan?.intent === "investment_search" ||
    plan?.intent === "investment_opportunities" ||
    plan?.intent === "business_opportunities"
  ) {
    whyInteresting.push(
      `Совпадает с запросом владельца (intent=${plan.intent}, INFERENCE по Search Plan).`,
    );
  }

  if (candidate.sources.length > 1) {
    whyInteresting.push(
      `Сигнал собран из ${candidate.sources.length} источников после dedup.`,
    );
  }

  const claims = [...candidate.claims];
  if (price != null && plan?.budgetMax) {
    claims.push({
      field: "budget_fit",
      value:
        price <= plan.budgetMax
          ? "в пределах бюджета запроса"
          : "выше бюджета запроса",
      kind: "INFERENCE",
      note: "Сравнение извлечённой суммы с бюджетом Search Plan.",
    });
  }

  claims.push({
    field: "market_potential",
    value: "требует проверки спроса на месте",
    kind: "ESTIMATE",
    note: "Без полевых данных оценка рынка предварительная.",
  });

  if (!candidate.contactPhone && !candidate.contactEmail) {
    unknowns.push("Публичные контакты собственника");
    toVerify.push("Найти и верифицировать контакт");
  } else {
    whyInteresting.push(
      "В тексте найден публичный контакт (FACT относительно доступного текста).",
    );
  }

  const score = scoreCandidate(
    {
      ...candidate,
      whyInteresting,
      risks,
      unknowns,
      toVerify,
      claims,
      isStub,
    },
    plan,
  );

  const recommendation = isCatalog
    ? "Каталог: используйте как точку входа для ручного поиска конкретных лотов, не как сделку."
    : score.priority === "HIGH_PRIORITY"
      ? "Высокий приоритет — откройте первоисточник и решите, давать ли поручение Лие."
      : score.overall >= 55
        ? "Можно оставить в шорт-листе и дать Лие поручение на углубление."
        : "Пока слабый приоритет — смотреть только если тема стратегически важна.";

  const nextStep = isCatalog
    ? "Открыть каталог и выбрать 1–2 конкретных объекта для повторного анализа."
    : score.confidence < 50
      ? "Откройте URL источника, подтвердите цену/статус, затем сохраните или поручите глубокую проверку."
      : "Открыть карточку, сохранить или поручить Лие глубокую проверку.";

  const cleanTitle = candidate.title.replace(/^\[STUB\]\s*/, "");
  const summary = [
    isCatalog
      ? `Каталог/листинг «${cleanTitle}» — не конкретная возможность.`
      : isStub
        ? `Предварительный анализ stub-сигнала «${cleanTitle}».`
        : `Предварительный анализ live-сигнала «${cleanTitle}».`,
    `quality ${score.quality}% · opportunity ${score.opportunity}/100 · confidence ${score.confidence}/100.`,
  ].join(" ");

  return {
    ...candidate,
    isStub,
    summary,
    whyInteresting,
    recommendation,
    nextStep,
    risks,
    unknowns,
    toVerify,
    claims,
    score,
    matchHints: [
      "Сопоставить с инвесторами ЦКР (matching — отдельный этап)",
      "Проверить проекты/заявки в каталоге ЦКР с похожим профилем",
    ],
  };
}
