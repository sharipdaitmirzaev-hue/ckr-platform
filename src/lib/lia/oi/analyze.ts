import { scoreCandidate } from "@/lib/lia/oi/score";
import type { LiaOiCandidate, LiaOiSearchPlan } from "@/types/lia-oi";

/**
 * Analyzer + provenance. Не выдумывает недостающие факты.
 */
export function analyzeCandidate(
  candidate: LiaOiCandidate,
  plan?: LiaOiSearchPlan,
): LiaOiCandidate {
  const price = candidate.investmentRequired ?? candidate.askingPrice;
  const whyInteresting: string[] = [];
  const risks: string[] = [
    "Данные из stub/demo — нельзя принимать инвестиционное решение без проверки первоисточника.",
  ];
  const unknowns: string[] = [];
  const toVerify: string[] = [
    "Актуальность предложения и статус объекта",
    "Правовой статус / обременения",
    "Реальные финансовые показатели",
  ];

  if (price != null) {
    whyInteresting.push(
      `Ориентир вложений ${price.toLocaleString("ru-RU")} ₽ (FACT из stub-карточки).`,
    );
  } else {
    unknowns.push("Цена / требуемые инвестиции");
  }

  if (candidate.region) {
    whyInteresting.push(`Локация: ${candidate.region}${candidate.city ? `, ${candidate.city}` : ""}.`);
  } else {
    unknowns.push("Точный регион / адрес");
  }

  if (candidate.industry) {
    whyInteresting.push(`Отраслевой контур: ${candidate.industry}.`);
  }

  if (plan?.intent === "investment_search") {
    whyInteresting.push(
      "Совпадает с инвест-запросом владельца (INFERENCE по Search Plan).",
    );
  }

  if (candidate.sources.length > 1) {
    whyInteresting.push(
      `Сигнал подтверждён в ${candidate.sources.length} stub-источниках после dedup.`,
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
      note: "Сравнение stub-цены с бюджетом Search Plan.",
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
  }

  const score = scoreCandidate(
    {
      ...candidate,
      whyInteresting,
      risks,
      unknowns,
      toVerify,
      claims,
    },
    plan,
  );

  const recommendation =
    score.priority === "HIGH_PRIORITY"
      ? "Стоит разобрать подробнее: потенциал заметный, но stub-данные требуют проверки."
      : score.overall >= 55
        ? "Можно оставить в шорт-листе и дать Лие поручение на углубление."
        : "Пока слабый приоритет — смотреть только если тема стратегически важна.";

  const nextStep =
    score.confidence < 50
      ? "Запросить дополнительные факты / дождаться live-источника (этап 2)."
      : "Открыть карточку, сохранить или поручить Лие глубокую проверку.";

  const summary = [
    `Предварительный анализ stub-сигнала «${candidate.title.replace(/^\[STUB\]\s*/, "")}».`,
    `Потенциал ${score.overall}/100, уверенность ${score.confidence}/100.`,
    score.confidence < 50
      ? "Возможность выглядит интересной, но данных недостаточно."
      : "Данных достаточно для первичного решения владельца (в рамках demo).",
  ].join(" ");

  const matchHints = [
    "Сопоставить с инвесторами ЦКР (matching — этап 3)",
    "Проверить проекты/заявки в каталоге ЦКР с похожим профилем",
  ];

  return {
    ...candidate,
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
