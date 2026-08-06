/** Launch Decision Gate (этап 45). */

export const LAUNCH_DECISIONS = [
  "continue_closed",
  "expand_beta",
  "public_launch_ready",
  "needs_improvement",
] as const;

export type LaunchDecision = (typeof LAUNCH_DECISIONS)[number];

export const launchDecisionLabels: Record<LaunchDecision, string> = {
  continue_closed: "Оставить closed",
  expand_beta: "Расширить beta",
  public_launch_ready: "Готовить public",
  needs_improvement: "Нужны улучшения",
};

export const launchDecisionHints: Record<LaunchDecision, string> = {
  continue_closed:
    "Closed Wave 1 остаётся основной: донастроить сценарии ТИНДА и закрыть блокеры.",
  expand_beta:
    "Активировать Launch Wave 2 (beta): предприниматели + инвесторы + эксперты.",
  public_launch_ready:
    "Готовить public-контур (Wave 3) после стабилизации Wave 2.",
  needs_improvement:
    "Не расширять доступ — сначала Critical/High improvements.",
};

/** UI-варианты выбора на странице решения (без needs_improvement как кнопки — он вычисляется). */
export const LAUNCH_DECISION_CHOICES = [
  "continue_closed",
  "expand_beta",
  "public_launch_ready",
] as const;

export type LaunchDecisionChoice = (typeof LAUNCH_DECISION_CHOICES)[number];

export const IMPROVEMENT_PRIORITY_ORDER = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export type ImprovementPriorityBucket =
  (typeof IMPROVEMENT_PRIORITY_ORDER)[number];

export function isLaunchDecision(value: string): value is LaunchDecision {
  return (LAUNCH_DECISIONS as readonly string[]).includes(value);
}

/** Маппинг из решения Wave Review (этап 44). */
export function mapReviewDecisionToLaunch(
  value: string,
): LaunchDecision {
  if (value === "public_ready") return "public_launch_ready";
  if (isLaunchDecision(value)) return value;
  return "needs_improvement";
}
