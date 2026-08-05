import type {
  DealParticipantRole,
  DealStatus,
  DealType,
  MilestoneStatus,
  ProjectActivityType,
} from "@/types";

export const DEAL_TYPES: DealType[] = [
  "investment",
  "partnership",
  "service",
  "purchase",
  "lease",
  "other",
];

export const dealTypeLabels: Record<DealType, string> = {
  investment: "Инвестиции",
  partnership: "Партнёрство",
  service: "Услуга",
  purchase: "Покупка",
  lease: "Аренда",
  other: "Другое",
};

export const DEAL_STATUSES: DealStatus[] = [
  "draft",
  "negotiation",
  "agreement",
  "active",
  "completed",
  "cancelled",
];

export const dealStatusLabels: Record<DealStatus, string> = {
  draft: "Черновик",
  negotiation: "Переговоры",
  agreement: "Соглашение",
  active: "Активна",
  completed: "Завершена",
  cancelled: "Отменена",
};

export const DEAL_PARTICIPANT_ROLES: DealParticipantRole[] = [
  "owner",
  "investor",
  "partner",
  "expert",
];

export const dealParticipantRoleLabels: Record<DealParticipantRole, string> = {
  owner: "Владелец",
  investor: "Инвестор",
  partner: "Партнёр",
  expert: "Эксперт",
};

export const MILESTONE_STATUSES: MilestoneStatus[] = [
  "planned",
  "in_progress",
  "completed",
  "blocked",
];

export const milestoneStatusLabels: Record<MilestoneStatus, string> = {
  planned: "Запланирован",
  in_progress: "В работе",
  completed: "Завершён",
  blocked: "Заблокирован",
};

export const projectActivityTypeLabels: Record<ProjectActivityType, string> = {
  status_change: "Статус",
  participant_added: "Участник",
  document_uploaded: "Документ",
  milestone_completed: "Этап завершён",
  milestone_created: "Этап создан",
  milestone_updated: "Этап обновлён",
  deal_created: "Сделка создана",
  deal_updated: "Сделка обновлена",
  note: "Заметка",
};

/** Типовые этапы для кабинета проекта (пример: завод воды). */
export const DEFAULT_PROJECT_MILESTONES = [
  {
    title: "Найти землю",
    description: "Подобрать участок или помещение под реализацию.",
  },
  {
    title: "Получить финансирование",
    description: "Закрыть потребность в инвестициях или кредите.",
  },
  {
    title: "Купить оборудование",
    description: "Выбрать поставщиков и заключить договоры поставки.",
  },
  {
    title: "Запустить производство",
    description: "Выйти на операционный запуск и первые продажи.",
  },
] as const;
