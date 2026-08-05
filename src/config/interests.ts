export const INVESTOR_INTEREST_TARGET_TYPES = [
  "project",
  "opportunity",
  "investment",
] as const;

export type InvestorInterestTargetType =
  (typeof INVESTOR_INTEREST_TARGET_TYPES)[number];

export const interestTargetTypeLabels: Record<
  InvestorInterestTargetType,
  string
> = {
  project: "Проект",
  opportunity: "Возможность",
  investment: "Инвестиции",
};

export function isInterestTargetType(
  value: string,
): value is InvestorInterestTargetType {
  return (INVESTOR_INTEREST_TARGET_TYPES as readonly string[]).includes(value);
}

export function interestTargetHref(
  type: InvestorInterestTargetType,
  id: string,
): string {
  if (type === "project") return `/project/${id}`;
  if (type === "opportunity") return `/opportunity/${id}`;
  return `/investment/${id}`;
}
