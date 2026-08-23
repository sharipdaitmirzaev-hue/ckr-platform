/**
 * Stage 4Q — Собственные идеи ЦКР (Proactive Opportunity Builder).
 * Owner-facing labels only. No Matching / Synthesis / Scheduler.
 */

export const CKR_OWN_IDEAS_NAV_LABEL = "Собственные идеи ЦКР";
export const CKR_OWN_IDEAS_PATH = "/admin/owner/own-ideas";
export const CKR_OWN_IDEAS_DIAGNOSTICS_PATH =
  "/admin/owner/own-ideas/diagnostics";

export const CKR_OWN_IDEAS_SEED_MARKER = "E2E_CKR_OWN_IDEA";

/** Hard stop — never flipped true by the engine. */
export const CKR_OWN_IDEAS_FORBIDDEN = {
  autoPublish: false,
  autoOutreach: false,
  autoApplication: false,
  autoTender: false,
  autoCredit: false,
  autoContract: false,
  autoOffer: false,
  autoPayment: false,
  autoNegotiation: false,
  matchingEdges: false,
  scheduler: false,
} as const;

export const CKR_OWN_IDEAS_BUDGETS = {
  maxDepth: 3,
  maxSearches: 12,
  maxExternalCalls: 8,
  maxSignalsPerRun: 40,
  maxInitialIdeas: 8,
  maxQueries: 12,
  maxEnrich: 6,
  maxCandidatesPerElement: 5,
  timeoutMs: 15_000,
} as const;

export const OWN_IDEA_RATING_LABELS = {
  promising: "Перспективная",
  needs_check: "Нужно проверить",
  missing_data: "Не хватает данных",
  weak: "Слабая",
} as const;

export const OWN_IDEA_OWNER_STATE_LABELS = {
  DRAFT: "Черновик",
  REVIEW: "На проверке",
  ACCEPTED: "Принята в работу",
  RESEARCH: "Доработка",
  DEFERRED: "Отложена",
  REJECTED: "Отклонена",
  PROJECT_CREATED: "Создан проект",
} as const;

export const OWN_IDEA_ELEMENT_LABELS = {
  ASSET: "Актив",
  DEMAND: "Спрос",
  SUPPLY: "Поставка / исполнитель",
  CAPITAL: "Финансирование",
  LOCATION: "Площадка",
  TEAM: "Команда",
  MARKET: "Канал сбыта",
  PERMIT: "Разрешение / поддержка",
  OTHER: "Другое",
} as const;
