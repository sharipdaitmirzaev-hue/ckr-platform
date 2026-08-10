import type {
  LiaOiAssignmentKind,
  LiaOiFeedbackEvent,
  LiaOiPriority,
  LiaOiStatus,
} from "@/types/lia-oi";

/** Бюджеты этапа 1 (stub / demo). */
export const LIA_OI_BUDGETS = {
  maxCandidatesPerRun: 12,
  maxAiAnalysesPerRun: 8,
  maxDeepAnalysesPerRun: 3,
  maxFetchesPerSource: 10,
  maxQueriesPerPlan: 6,
} as const;

export const LIA_OI_STUB_BANNER =
  "Внешний поиск работает в demo/stub режиме. Результаты не являются живыми данными из интернета.";

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
