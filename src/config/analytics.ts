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
