/** События онбординга / первых действий controlled beta (этап 38). */
export const BETA_ONBOARDING_EVENTS = [
  "onboarding_started",
  "onboarding_completed",
  "profile_completed",
  "first_lia_use",
  "first_project_created",
  "first_application_sent",
  "first_interest_created",
] as const;

export type BetaOnboardingEvent = (typeof BETA_ONBOARDING_EVENTS)[number];

export const betaOnboardingEventLabels: Record<BetaOnboardingEvent, string> = {
  onboarding_started: "Онбординг начат",
  onboarding_completed: "Онбординг завершён",
  profile_completed: "Профиль заполнен",
  first_lia_use: "Первое использование Лии",
  first_project_created: "Первый проект",
  first_application_sent: "Первая заявка",
  first_interest_created: "Первый интерес",
};

export type BetaScenarioRole =
  | "entrepreneur"
  | "investor"
  | "expert"
  | "organization";

export type BetaScenarioStep = {
  key: string;
  label: string;
  /** Событие analytics_events, подтверждающее шаг (если есть). */
  event?: string;
};

export const BETA_SCENARIO_CHECKLISTS: Record<
  BetaScenarioRole,
  { title: string; steps: BetaScenarioStep[] }
> = {
  entrepreneur: {
    title: "Предприниматель",
    steps: [
      { key: "registration", label: "Регистрация", event: "registration_completed" },
      { key: "profile", label: "Профиль", event: "profile_completed" },
      { key: "lia", label: "Лия", event: "first_lia_use" },
      {
        key: "project",
        label: "Создание проекта",
        event: "first_project_created",
      },
      { key: "analysis", label: "Анализ", event: "lia_used" },
      { key: "publish", label: "Публикация", event: "project_published" },
    ],
  },
  investor: {
    title: "Инвестор",
    steps: [
      { key: "registration", label: "Регистрация", event: "registration_completed" },
      { key: "profile", label: "Профиль", event: "profile_completed" },
      { key: "search", label: "Поиск проекта", event: "project_viewed" },
      {
        key: "interest",
        label: "Интерес",
        event: "first_interest_created",
      },
    ],
  },
  expert: {
    title: "Эксперт",
    steps: [
      { key: "profile", label: "Профиль", event: "profile_completed" },
      { key: "verification", label: "Верификация", event: "document_verified" },
      {
        key: "request",
        label: "Получение запроса",
        event: "application_sent",
      },
    ],
  },
  organization: {
    title: "Организация",
    steps: [
      { key: "profile", label: "Профиль", event: "profile_completed" },
      { key: "members", label: "Сотрудники", event: "onboarding_completed" },
      {
        key: "project",
        label: "Проект",
        event: "first_project_created",
      },
    ],
  },
};

/** Нормализация legacy-статусов beta_invites → participation. */
export function normalizeBetaParticipationStatus(
  status: string,
): "invited" | "activated" | "active" | "completed" | "disabled" | string {
  if (status === "created" || status === "sent") return "invited";
  if (status === "used") return "activated";
  if (status === "expired") return "disabled";
  return status;
}

export function isOpenInviteStatus(status: string): boolean {
  return status === "invited" || status === "created" || status === "sent";
}

export function isActivatedInviteStatus(status: string): boolean {
  return (
    status === "activated" ||
    status === "active" ||
    status === "used" ||
    status === "completed"
  );
}

export function isActiveInviteStatus(status: string): boolean {
  return status === "active" || status === "activated" || status === "used";
}
