export const REPUTATION_ENTITY_TYPES = ["user", "organization"] as const;

export type ReputationEntityType = (typeof REPUTATION_ENTITY_TYPES)[number];

export const REPUTATION_VERIFICATION_LEVELS = [
  "basic",
  "verified",
  "trusted",
] as const;

export type ReputationVerificationLevel =
  (typeof REPUTATION_VERIFICATION_LEVELS)[number];

export const reputationVerificationLevelLabels: Record<
  ReputationVerificationLevel,
  string
> = {
  basic: "Базовый",
  verified: "Проверенный",
  trusted: "Доверенный",
};

export const REVIEW_TARGET_TYPES = [
  "project",
  "organization",
  "expert",
  "investor",
  "service",
] as const;

export type ReviewTargetType = (typeof REVIEW_TARGET_TYPES)[number];

export const reviewTargetTypeLabels: Record<ReviewTargetType, string> = {
  project: "Проект",
  organization: "Организация",
  expert: "Эксперт",
  investor: "Инвестор",
  service: "Услуга",
};

export const ENTITY_HISTORY_KINDS = [
  "project",
  "deal",
  "partnership",
  "task",
] as const;

export type EntityHistoryKind = (typeof ENTITY_HISTORY_KINDS)[number];

export const entityHistoryKindLabels: Record<EntityHistoryKind, string> = {
  project: "Проект",
  deal: "Сделка",
  partnership: "Партнёрство",
  task: "Задача",
};

export const TRUST_BADGE_KEYS = [
  "verified",
  "trusted_partner",
  "experienced_investor",
  "ckr_expert",
] as const;

export type TrustBadgeKey = (typeof TRUST_BADGE_KEYS)[number];

export const trustBadgeLabels: Record<TrustBadgeKey, string> = {
  verified: "Verified",
  trusted_partner: "Trusted Partner",
  experienced_investor: "Experienced Investor",
  ckr_expert: "CKR Expert",
};

export const trustBadgeDescriptions: Record<TrustBadgeKey, string> = {
  verified: "Профиль и документы проверены ЦКР",
  trusted_partner: "Надёжный партнёр экосистемы",
  experienced_investor: "Инвестор с завершёнными сделками",
  ckr_expert: "Эксперт ЦКР с подтверждённой практикой",
};

export function isReviewTargetType(value: string): value is ReviewTargetType {
  return (REVIEW_TARGET_TYPES as readonly string[]).includes(value);
}

export function isTrustBadgeKey(value: string): value is TrustBadgeKey {
  return (TRUST_BADGE_KEYS as readonly string[]).includes(value);
}

/** Уровень доверия по фактам верификации и активности. */
export function deriveVerificationLevel(input: {
  platformVerified: boolean;
  completedDeals: number;
  completedProjects: number;
  score: number;
}): ReputationVerificationLevel {
  if (
    input.platformVerified &&
    input.completedDeals >= 3 &&
    input.score >= 4
  ) {
    return "trusted";
  }
  if (input.platformVerified || input.completedDeals >= 1) {
    return "verified";
  }
  return "basic";
}
