/** Ecosystem Value & Matching Analysis (этап 47). */

export const ECOSYSTEM_CONNECTION_TYPES = [
  "project_expert",
  "project_investor",
  "project_partner",
  "organization_project",
] as const;

export type EcosystemConnectionType =
  (typeof ECOSYSTEM_CONNECTION_TYPES)[number];

export const ecosystemConnectionTypeLabels: Record<
  EcosystemConnectionType,
  string
> = {
  project_expert: "Проект → Эксперт",
  project_investor: "Проект → Инвестор",
  project_partner: "Проект → Партнёр",
  organization_project: "Организация → Проект",
};

export const MATCH_QUALITY_TIERS = [
  "weak",
  "strong",
  "successful",
] as const;

export type MatchQualityTier = (typeof MATCH_QUALITY_TIERS)[number];

export const matchQualityTierLabels: Record<MatchQualityTier, string> = {
  weak: "Слабые связи",
  strong: "Сильные связи",
  successful: "Успешные сценарии",
};

export const MATCH_FUNNEL_STAGES = [
  "created",
  "accepted",
  "interaction",
  "result",
] as const;

export type MatchFunnelStage = (typeof MATCH_FUNNEL_STAGES)[number];

export const matchFunnelStageLabels: Record<MatchFunnelStage, string> = {
  created: "Создано совпадений",
  accepted: "Принято участниками",
  interaction: "Началось взаимодействие",
  result: "Получен результат",
};
