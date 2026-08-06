export const ANALYTICS_EVENT_TYPES = [
  "user_registered",
  "project_created",
  "project_viewed",
  "opportunity_created",
  "investment_created",
  "application_sent",
  "application_accepted",
  "deal_created",
  "deal_completed",
  "document_uploaded",
  "document_verified",
  "milestone_completed",
  "roadmap_created",
  "roadmap_item_completed",
  "metric_updated",
  "project_progress_checked",
  "result_created",
  "financial_metric_updated",
  "project_completed",
  "outcome_generated",
  "onboarding_started",
  "onboarding_completed",
  "profile_completed",
  "first_lia_use",
  "first_project_created",
  "first_application_sent",
  "first_interest_created",
  "public_registration",
  "role_selected",
  "first_project",
  "first_investment_interest",
  "first_expert_request",
  "launch_goal_created",
  "launch_goal_achieved",
  "launch_goal_failed",
  "launch_wave_completed",
  "public_page_view",
  "registration_started",
  "registration_completed",
  "lia_started",
  "first_object_created",
  "invite_sent",
  "invite_accepted",
  "first_login",
  "lia_first_used",
  "expert_profile_created",
  "investment_interest_created",
  "feedback_sent",
  "product_fix_started",
  "product_fix_completed",
  "activation_after_fix",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const analyticsEventLabels: Record<AnalyticsEventType, string> = {
  user_registered: "Регистрация",
  project_created: "Создание проекта",
  project_viewed: "Просмотр проекта",
  opportunity_created: "Создание возможности",
  investment_created: "Создание инвестиции",
  application_sent: "Отправка заявки",
  application_accepted: "Принятие заявки",
  deal_created: "Создание сделки",
  deal_completed: "Завершение сделки",
  document_uploaded: "Загрузка документа",
  document_verified: "Верификация документа",
  milestone_completed: "Завершение этапа",
  roadmap_created: "Создание roadmap",
  roadmap_item_completed: "Завершение этапа roadmap",
  metric_updated: "Обновление KPI",
  project_progress_checked: "Проверка прогресса проекта",
  result_created: "Фиксация результата проекта",
  financial_metric_updated: "Обновление финпоказателя",
  project_completed: "Завершение проекта",
  outcome_generated: "Генерация отчёта по результату",
  onboarding_started: "Онбординг начат",
  onboarding_completed: "Онбординг завершён",
  profile_completed: "Профиль заполнен",
  first_lia_use: "Первое использование Лии",
  first_project_created: "Первый проект",
  first_application_sent: "Первая заявка",
  first_interest_created: "Первый интерес",
  public_registration: "Публичная регистрация",
  role_selected: "Выбор роли",
  first_project: "Первый проект (launch)",
  first_investment_interest: "Первый интерес к инвестициям",
  first_expert_request: "Первый запрос эксперту",
  launch_goal_created: "Цель запуска создана",
  launch_goal_achieved: "Цель запуска достигнута",
  launch_goal_failed: "Цель запуска не достигнута",
  launch_wave_completed: "Волна запуска завершена",
  public_page_view: "Просмотр публичной страницы",
  registration_started: "Регистрация начата",
  registration_completed: "Регистрация завершена",
  lia_started: "Старт сценария с Лией",
  first_object_created: "Первый объект создан",
  invite_sent: "Приглашение отправлено",
  invite_accepted: "Приглашение принято",
  first_login: "Первый вход",
  lia_first_used: "Лия использована впервые",
  expert_profile_created: "Профиль эксперта создан",
  investment_interest_created: "Интерес к инвестиции/проекту",
  feedback_sent: "Обратная связь отправлена",
  product_fix_started: "Исправление продукта начато",
  product_fix_completed: "Исправление продукта завершено",
  activation_after_fix: "Активация после исправления",
};

export const ANALYTICS_PERIODS = ["7d", "30d", "90d"] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const analyticsPeriodLabels: Record<AnalyticsPeriod, string> = {
  "7d": "7 дней",
  "30d": "30 дней",
  "90d": "90 дней",
};

export function periodToDays(period: AnalyticsPeriod): number {
  if (period === "7d") return 7;
  if (period === "90d") return 90;
  return 30;
}

export function periodStartIso(period: AnalyticsPeriod): string {
  const days = periodToDays(period);
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}
