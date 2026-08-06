/** События Public Launch (этап 40). */
export const LAUNCH_ANALYTICS_EVENTS = [
  "public_registration",
  "role_selected",
  "first_project",
  "first_investment_interest",
  "first_expert_request",
] as const;

export type LaunchAnalyticsEvent = (typeof LAUNCH_ANALYTICS_EVENTS)[number];

export const launchAnalyticsEventLabels: Record<LaunchAnalyticsEvent, string> =
  {
    public_registration: "Публичная регистрация",
    role_selected: "Выбор роли",
    first_project: "Первый проект (launch)",
    first_investment_interest: "Первый интерес к инвестициям",
    first_expert_request: "Первый запрос эксперту",
  };

export type LaunchCheckStatus = "ready" | "attention" | "blocked" | "info";

export type LaunchCheckItem = {
  id: string;
  label: string;
  status: LaunchCheckStatus;
  detail: string;
  href?: string;
};

export const launchCheckStatusLabels: Record<LaunchCheckStatus, string> = {
  ready: "Готово",
  attention: "Внимание",
  blocked: "Блокер",
  info: "Инфо",
};
