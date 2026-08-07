import type {
  DocumentRelatedType,
  DocumentStatus,
  DocumentType,
  DocumentVisibility,
  VerificationRequestStatus,
  VerificationStatus,
} from "@/types";

export const VERIFICATION_STATUSES = [
  "unverified",
  "pending",
  "verified",
] as const satisfies readonly VerificationStatus[];

export const DOCUMENT_RELATED_TYPES = [
  "profile",
  "project",
  "opportunity",
  "investment",
  "expert",
] as const satisfies readonly DocumentRelatedType[];

export const DOCUMENT_TYPES = [
  "business_plan",
  "presentation",
  "company_document",
  "ownership_document",
  "license",
  "certificate",
  "financial",
  "other",
] as const satisfies readonly DocumentType[];

export const DOCUMENT_VISIBILITIES = [
  "private",
  "review",
  "public",
] as const satisfies readonly DocumentVisibility[];

export const DOCUMENT_STATUSES = [
  "uploaded",
  "pending",
  "verified",
  "rejected",
] as const satisfies readonly DocumentStatus[];

export const VERIFICATION_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const satisfies readonly VerificationRequestStatus[];

export const verificationStatusLabels: Record<VerificationStatus, string> = {
  unverified: "Не проверен",
  pending: "На проверке",
  verified: "Проверен",
};

export const documentRelatedTypeLabels: Record<DocumentRelatedType, string> = {
  profile: "Профиль",
  project: "Проект",
  opportunity: "Возможность",
  investment: "Инвестиции",
  expert: "Эксперт",
};

export const documentTypeLabels: Record<DocumentType, string> = {
  business_plan: "Бизнес-план",
  presentation: "Презентация",
  company_document: "Документ компании",
  ownership_document: "Документ собственности",
  license: "Лицензия",
  certificate: "Сертификат",
  financial: "Финансовый документ",
  other: "Другое",
};

export const documentVisibilityLabels: Record<DocumentVisibility, string> = {
  private: "Приватный",
  review: "На проверку",
  public: "Публичный",
};

export const documentStatusLabels: Record<DocumentStatus, string> = {
  uploaded: "Загружен",
  pending: "Ожидает проверки",
  verified: "Проверен",
  rejected: "Отклонён",
};

export const verificationRequestStatusLabels: Record<
  VerificationRequestStatus,
  string
> = {
  pending: "Ожидает",
  approved: "Одобрена",
  rejected: "Отклонена",
};

export const DOCUMENTS_BUCKET = "documents";
