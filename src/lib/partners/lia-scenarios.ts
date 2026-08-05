/**
 * Подготовка сценариев Лии для партнёрской сети ЦКР (Этап 23).
 * Полная интеграция в чат-движок — постепенно; здесь — контракт и ответы-заготовки.
 */

export const LIA_PARTNER_DISCLAIMER =
  "Рекомендации Лии для организации — ориентир ЦКР, не оферта и не юридическая консультация.";

export type LiaPartnerScenarioId =
  | "org_find_projects"
  | "org_offer_opportunities";

export type LiaPartnerScenario = {
  id: LiaPartnerScenarioId;
  label: string;
  examplePrompt: string;
  description: string;
};

export const LIA_PARTNER_SCENARIOS: LiaPartnerScenario[] = [
  {
    id: "org_find_projects",
    label: "Проекты для организации",
    examplePrompt: "Найди подходящие проекты для нашей организации",
    description:
      "Подбор проектов по региону, отрасли и типу партнёрства организации.",
  },
  {
    id: "org_offer_opportunities",
    label: "Возможности организации",
    examplePrompt: "Какие возможности мы можем предложить",
    description:
      "Подсказки по типам возможностей, услуг и инвестиционных предложений.",
  },
];

export type LiaPartnerInsight = {
  scenarioId: LiaPartnerScenarioId;
  summary: string;
  suggestions: string[];
  nextStep: string;
  disclaimer: string;
};

export function resolveLiaPartnerScenario(
  prompt: string,
): LiaPartnerScenarioId | null {
  const value = prompt.trim().toLowerCase();
  if (!value) return null;
  if (
    value.includes("проект") &&
    (value.includes("организац") || value.includes("наш"))
  ) {
    return "org_find_projects";
  }
  if (
    value.includes("возможност") ||
    (value.includes("предложить") && value.includes("мы"))
  ) {
    return "org_offer_opportunities";
  }
  return null;
}

export function buildPartnerLiaInsight(input: {
  scenarioId: LiaPartnerScenarioId;
  organizationName: string;
  organizationType: string;
  region?: string;
  activePartnerships?: number;
  publishedOffers?: number;
}): LiaPartnerInsight {
  if (input.scenarioId === "org_find_projects") {
    return {
      scenarioId: input.scenarioId,
      summary: `Для «${input.organizationName}» подберём проекты с учётом типа «${input.organizationType}»${
        input.region ? ` и региона «${input.region}»` : ""
      }.`,
      suggestions: [
        "Откройте каталог /projects и отфильтруйте по отрасли и региону",
        "Отправьте заявку на релевантный проект из кабинета организации",
        "Зафиксируйте интерес через партнёрство типа investment или strategic",
      ],
      nextStep:
        "Лия не создаёт заявки автоматически — подтвердите интерес в интерфейсе ЦКР.",
      disclaimer: LIA_PARTNER_DISCLAIMER,
    };
  }

  return {
    scenarioId: input.scenarioId,
    summary: `Организация «${input.organizationName}» может предложить рынку возможности, услуги и капитал.`,
    suggestions: [
      "Создайте возможность в /partner/offers (земля, оборудование, услуги, партнёрство)",
      "Опубликуйте инвестиционное предложение, если тип партнёрства — investment",
      input.publishedOffers
        ? `Сейчас связанных предложений: ${input.publishedOffers}`
        : "Пока нет опубликованных предложений — начните с черновика",
      input.activePartnerships
        ? `Активных партнёрств с ЦКР: ${input.activePartnerships}`
        : "Оформите партнёрство со статусом pending → active",
    ],
    nextStep:
      "Сформируйте черновик предложения и при необходимости запросите верификацию организации.",
    disclaimer: LIA_PARTNER_DISCLAIMER,
  };
}
