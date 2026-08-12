export const ORGANIZATION_TYPES = [
  "company",
  "bank",
  "fund",
  "supplier",
  "university",
  "association",
  "government",
  "other",
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const organizationTypeLabels: Record<OrganizationType, string> = {
  company: "Компания",
  bank: "Банк",
  fund: "Фонд",
  supplier: "Поставщик",
  university: "Университет",
  association: "Ассоциация",
  government: "Государственная структура",
  other: "Другое",
};

export const ORGANIZATION_VERIFICATION_STATUSES = [
  "unverified",
  "pending",
  "verified",
] as const;

export type OrganizationVerificationStatus =
  (typeof ORGANIZATION_VERIFICATION_STATUSES)[number];

export const organizationVerificationLabels: Record<
  OrganizationVerificationStatus,
  string
> = {
  unverified: "Не проверено",
  pending: "На проверке",
  verified: "Проверено",
};

export const ORGANIZATION_MEMBER_ROLES = [
  "owner",
  "manager",
  "employee",
] as const;

export type OrganizationMemberRole =
  (typeof ORGANIZATION_MEMBER_ROLES)[number];

export const organizationMemberRoleLabels: Record<
  OrganizationMemberRole,
  string
> = {
  owner: "Владелец",
  manager: "Менеджер",
  employee: "Сотрудник",
};

export const PARTNERSHIP_TYPES = [
  "strategic",
  "supplier",
  "investment",
  "technology",
  "expert",
] as const;

export type PartnershipType = (typeof PARTNERSHIP_TYPES)[number];

export const partnershipTypeLabels: Record<PartnershipType, string> = {
  strategic: "Стратегическое",
  supplier: "Поставщик",
  investment: "Инвестиционное",
  technology: "Технологическое",
  expert: "Экспертное",
};

export const PARTNERSHIP_STATUSES = [
  "pending",
  "active",
  "inactive",
] as const;

export type PartnershipStatus = (typeof PARTNERSHIP_STATUSES)[number];

export const partnershipStatusLabels: Record<PartnershipStatus, string> = {
  pending: "На рассмотрении",
  active: "Активно",
  inactive: "Неактивно",
};

export const partnerNav = [
  { label: "Обзор", href: "/partner" },
  { label: "Профиль", href: "/partner/profile" },
  { label: "Возможности", href: "/partner/feed" },
  { label: "Сотрудники", href: "/partner/members" },
  { label: "Проекты", href: "/partner/projects" },
  { label: "Предложения", href: "/partner/offers" },
  { label: "Заявки", href: "/partner/applications" },
] as const;

export function isOrganizationType(value: string): value is OrganizationType {
  return (ORGANIZATION_TYPES as readonly string[]).includes(value);
}

export function isOrganizationMemberRole(
  value: string,
): value is OrganizationMemberRole {
  return (ORGANIZATION_MEMBER_ROLES as readonly string[]).includes(value);
}

export function isPartnershipType(value: string): value is PartnershipType {
  return (PARTNERSHIP_TYPES as readonly string[]).includes(value);
}

export function isPartnershipStatus(value: string): value is PartnershipStatus {
  return (PARTNERSHIP_STATUSES as readonly string[]).includes(value);
}

export function canManageOrganization(role: OrganizationMemberRole | null) {
  return role === "owner" || role === "manager";
}
