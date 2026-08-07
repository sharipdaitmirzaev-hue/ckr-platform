export const PILOT_PARTICIPANT_ROLES = [
  "entrepreneur",
  "investor",
  "expert",
  "organization",
  "operator",
] as const;

export type PilotParticipantRole = (typeof PILOT_PARTICIPANT_ROLES)[number];

export const pilotParticipantRoleLabels: Record<PilotParticipantRole, string> =
  {
    entrepreneur: "Предприниматель",
    investor: "Инвестор",
    expert: "Эксперт",
    organization: "Организация",
    operator: "Оператор",
  };

export const PILOT_PARTICIPANT_STATUSES = [
  "invited",
  "active",
  "inactive",
  "completed",
] as const;

export type PilotParticipantStatus =
  (typeof PILOT_PARTICIPANT_STATUSES)[number];

export const pilotParticipantStatusLabels: Record<
  PilotParticipantStatus,
  string
> = {
  invited: "Приглашён",
  active: "Активен",
  inactive: "Неактивен",
  completed: "Завершил",
};

export const PILOT_CHECKLIST_STATUSES = [
  "pending",
  "done",
  "skipped",
] as const;

export type PilotChecklistStatus = (typeof PILOT_CHECKLIST_STATUSES)[number];

export const pilotChecklistStatusLabels: Record<PilotChecklistStatus, string> =
  {
    pending: "Ожидает",
    done: "Сделано",
    skipped: "Пропущено",
  };

/** Типовые пункты чеклиста пилота. */
export const DEFAULT_PILOT_CHECKLIST_ITEMS = [
  "Создал профиль",
  "Прошёл онбординг",
  "Создал проект",
  "Использовал Лию",
  "Отправил заявку",
  "Получил результат",
] as const;

export const FEEDBACK_PRIORITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type FeedbackPriority = (typeof FEEDBACK_PRIORITIES)[number];

export const feedbackPriorityLabels: Record<FeedbackPriority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критичный",
};
