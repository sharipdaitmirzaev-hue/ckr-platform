export const PILOT_METRIC_TYPES = [
  "registration_completed",
  "profile_completed",
  "project_created",
  "project_published",
  "application_sent",
  "deal_created",
  "lia_used",
] as const;

export type PilotMetricType = (typeof PILOT_METRIC_TYPES)[number];

export const pilotMetricLabels: Record<PilotMetricType, string> = {
  registration_completed: "Регистрация завершена",
  profile_completed: "Профиль заполнен",
  project_created: "Проект создан",
  project_published: "Проект опубликован",
  application_sent: "Заявка отправлена",
  deal_created: "Сделка создана",
  lia_used: "Использование Лии",
};

export const PILOT_ISSUE_SEVERITIES = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export type PilotIssueSeverity = (typeof PILOT_ISSUE_SEVERITIES)[number];

export const pilotIssueSeverityLabels: Record<PilotIssueSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const PILOT_ISSUE_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type PilotIssueStatus = (typeof PILOT_ISSUE_STATUSES)[number];

export const pilotIssueStatusLabels: Record<PilotIssueStatus, string> = {
  open: "Открыта",
  in_progress: "В работе",
  resolved: "Решена",
  closed: "Закрыта",
};

export function isPilotIssueSeverity(
  value: string,
): value is PilotIssueSeverity {
  return (PILOT_ISSUE_SEVERITIES as readonly string[]).includes(value);
}

export function isPilotIssueStatus(value: string): value is PilotIssueStatus {
  return (PILOT_ISSUE_STATUSES as readonly string[]).includes(value);
}

/** Выделить связанный объект из пути страницы. */
export function relatedFromPathname(pathname: string): {
  relatedType: string | null;
  relatedId: string | null;
} {
  const patterns: Array<{ re: RegExp; type: string }> = [
    { re: /^\/project\/([^/]+)/, type: "project" },
    { re: /^\/dashboard\/projects\/([^/]+)/, type: "project" },
    { re: /^\/opportunity\/([^/]+)/, type: "opportunity" },
    { re: /^\/dashboard\/opportunities\/([^/]+)/, type: "opportunity" },
    { re: /^\/investment\/([^/]+)/, type: "investment" },
    { re: /^\/dashboard\/investments\/([^/]+)/, type: "investment" },
    { re: /^\/expert\/([^/]+)/, type: "expert" },
    { re: /^\/profile\/([^/]+)/, type: "profile" },
  ];

  for (const { re, type } of patterns) {
    const match = pathname.match(re);
    if (match?.[1] && match[1] !== "create" && match[1] !== "edit") {
      return { relatedType: type, relatedId: match[1] };
    }
  }

  return { relatedType: null, relatedId: null };
}
