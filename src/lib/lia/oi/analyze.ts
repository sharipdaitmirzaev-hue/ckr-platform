import { scoreCandidate } from "@/lib/lia/oi/score";
import type { LiaOiCandidate, LiaOiSearchPlan } from "@/types/lia-oi";

/**
 * Analyzer + provenance. Не выдумывает недостающие факты.
 * Snippet поисковика ≠ подтверждённый факт об объекте без маркировки.
 */
export function analyzeCandidate(
  candidate: LiaOiCandidate,
  plan?: LiaOiSearchPlan,
): LiaOiCandidate {
  const isStub = candidate.isStub || candidate.sources.every((s) => s.isStub);
  const price = candidate.investmentRequired ?? candidate.askingPrice;
  const whyInteresting: string[] = [];
  const risks: string[] = [
    isStub
      ? "Данные из stub/demo — нельзя принимать инвестиционное решение без проверки первоисточника."
      : "Данные из поискового сниппета — не due diligence. Обязательно откройте URL первоисточника.",
  ];
  const unknowns: string[] = [];
  const toVerify: string[] = [
    "Актуальность предложения и статус объекта",
    "Правовой статус / обременения",
    "Реальные финансовые показатели",
  ];

  if (price != null) {
    whyInteresting.push(
      isStub
        ? `Ориентир вложений ${price.toLocaleString("ru-RU")} ₽ (FACT из stub-карточки).`
        : `В тексте источника встречается сумма ${price.toLocaleString("ru-RU")} ₽ (FACT относительно сниппета; подтвердите на странице).`,
    );
  } else {
    unknowns.push("Цена / требуемые инвестиции");
  }

  if (candidate.region) {
    whyInteresting.push(
      `Локация: ${candidate.region}${candidate.city ? `, ${candidate.city}` : ""} (из текста результата).`,
    );
  } else {
    unknowns.push("Точный регион / адрес");
  }

  if (candidate.industry) {
    whyInteresting.push(`Отраслевой контур: ${candidate.industry} (INFERENCE по ключевым словам).`);
  }

  if (plan?.intent === "investment_search") {
    whyInteresting.push(
      "Совпадает с инвест-запросом владельца (INFERENCE по Search Plan).",
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
      "В тексте найден публичный контакт (FACT относительно сниппета).",
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

  const recommendation =
    score.priority === "HIGH_PRIORITY"
      ? isStub
        ? "Стоит разобрать подробнее: потенциал заметный, но stub-данные требуют проверки."
        : "Высокий приоритет по эвристике — откройте первоисточник и решите, давать ли поручение Лие."
      : score.overall >= 55
        ? "Можно оставить в шорт-листе и дать Лие поручение на углубление."
        : "Пока слабый приоритет — смотреть только если тема стратегически важна.";

  const nextStep =
    score.confidence < 50
      ? isStub
        ? "Для live-данных настройте Serper (LIA_WEB_SEARCH_*) или откройте карточку для stub-разбора."
        : "Откройте URL источника, подтвердите цену/статус, затем сохраните или поручите глубокую проверку."
      : "Открыть карточку, сохранить или поручить Лие глубокую проверку.";

  const cleanTitle = candidate.title.replace(/^\[STUB\]\s*/, "");
  const summary = [
    isStub
      ? `Предварительный анализ stub-сигнала «${cleanTitle}».`
      : `Предварительный анализ live-сигнала «${cleanTitle}».`,
    `Потенциал ${score.overall}/100, уверенность ${score.confidence}/100.`,
    score.confidence < 50
      ? "Возможность выглядит интересной, но данных недостаточно (UNKNOWN/ESTIMATE)."
      : "Данных достаточно для первичного решения владельца — с проверкой первоисточника.",
  ].join(" ");

  const matchHints = [
    "Сопоставить с инвесторами ЦКР (matching — отдельный этап)",
    "Проверить проекты/заявки в каталоге ЦКР с похожим профилем",
  ];

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
    matchHints,
  };
}
