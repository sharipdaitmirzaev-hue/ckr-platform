import type {
  LiaOiAssignmentKind,
  LiaOiFeedbackEvent,
  LiaOiPriority,
  LiaOiStatus,
} from "@/types/lia-oi";

/**
 * Лимиты OI (cost / quota control).
 * Stage 2A: применяются к LIVE Serper и к stub одинаково.
 */
export const LIA_OI_BUDGETS = {
  /** max_queries_per_search — поисковых гипотез на один запрос владельца */
  maxQueriesPerPlan: 6,
  /** max_results_per_query — результатов Serper на один query */
  maxResultsPerQuery: 8,
  /** max_candidates_per_request — карточек в ленту за один run */
  maxCandidatesPerRun: 12,
  /** max analyses (cheap) */
  maxAiAnalysesPerRun: 8,
  /** max_deep_analysis */
  maxDeepAnalysesPerRun: 3,
  /**
   * Page fetches к первоисточникам (safe-fetch).
   * Stage 2A: 0 по умолчанию — достаточно Serper snippet; fetch готов, но выключен.
   */
  maxFetchesPerSource: 0,
  maxFetchesPerRun: 0,
} as const;

export const LIA_OI_STUB_BANNER =
  "Внешний поиск работает в demo/stub режиме. Результаты не являются живыми данными из интернета.";

export const LIA_OI_LIVE_UNAVAILABLE =
  "Внешний поиск временно недоступен. Показан безопасный stub/пустой результат; техническая ошибка записана в server log.";

export const liaOiStatusLabels: Record<LiaOiStatus, string> = {
  NEW: "Новая",
  REVIEWING: "На изучении",
  INTERESTING: "Интересно",
  DEEP_RESEARCH: "Глубокая проверка",
  SAVED: "Сохранена",
  PROJECT_CREATED: "Проект ЦКР",
  PUBLISHED: "Опубликована",
  REJECTED: "Отклонена",
  ARCHIVED: "Архив",
};

export const liaOiPriorityLabels: Record<LiaOiPriority, string> = {
  NORMAL: "Обычный",
  INTERESTING: "Интересно",
  HIGH_PRIORITY: "Высокий приоритет",
  URGENT: "Срочно",
};

export const liaOiFeedbackLabels: Record<LiaOiFeedbackEvent, string> = {
  INTERESTED: "Интересно",
  SAVE: "Сохранить",
  REJECT: "Отклонить",
  DEEP_RESEARCH: "Изучить глубже",
  CREATE_PROJECT: "Создать проект",
  PUBLISH: "Опубликовать",
};

export const liaOiAssignmentLabels: Record<LiaOiAssignmentKind, string> = {
  DEEP_CHECK: "Проверить подробнее",
  FIND_OWNER: "Найти собственника",
  CHECK_MARKET: "Проверить рынок",
  FIND_COMPETITORS: "Найти конкурентов",
  FIND_BUYERS: "Найти покупателей",
  FIND_SUPPLIERS: "Найти поставщиков",
  FIND_INVESTOR: "Найти инвестора",
  FIND_SIMILAR: "Найти похожие",
  CHECK_SUPPORT: "Проверить господдержку",
  BUILD_PROJECT: "Собрать инвестпроект",
  PREPARE_OFFER: "Подготовить предложение",
  CKR_ANGLE: "Что здесь может заработать ЦКР?",
  CUSTOM: "Своё поручение",
};

export const liaOiOwnerNav = [
  { href: "/admin/owner/lia", label: "Обзор" },
  { href: "/admin/owner/lia/opportunities", label: "Возможности" },
  { href: "/admin/owner/lia/hypotheses", label: "Гипотезы" },
  { href: "/admin/owner/lia/search", label: "Поиск" },
  { href: "/admin/owner/lia/digest", label: "Дайджест" },
  { href: "/admin/owner/lia/assignments", label: "Поручения" },
  { href: "/admin/owner/lia/saved", label: "Сохранённые" },
  { href: "/admin/owner/lia/reports", label: "Отчёты" },
  { href: "/admin/owner/lia/sources", label: "Источники" },
  { href: "/admin/owner/lia/status", label: "Состояние" },
] as const;
