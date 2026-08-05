/**
 * Базовые доменные типы ЦКР.
 * Без привязки к БД — контракт для UI и будущего Supabase.
 */

export type UserRole =
  | "entrepreneur"
  | "investor"
  | "expert"
  | "company"
  | "admin";

export type ProjectStage = "idea" | "startup" | "operating" | "expansion";

export type PublishStatus = "draft" | "moderation" | "published" | "archived";

export type OpportunityType =
  | "land"
  | "premises"
  | "equipment"
  | "ready_business"
  | "technology"
  | "service"
  | "partner";

export type SolutionType =
  | "find_investor"
  | "find_land"
  | "find_equipment"
  | "find_specialists"
  | "legal_support"
  | "marketing";

export type ApplicationTargetType =
  | "project"
  | "opportunity"
  | "investment"
  | "expert";

export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "closed";

export type InvestmentType = "equity" | "loan" | "partnership" | "purchase";

export type InvestmentOfferStatus =
  | "draft"
  | "moderation"
  | "published"
  | "closed";

export type ExpertSpecialization =
  | "lawyer"
  | "accountant"
  | "marketer"
  | "engineer"
  | "builder"
  | "consultant"
  | "other";

export type ExpertProfileStatus =
  | "draft"
  | "moderation"
  | "published"
  | "archived";

export type VerificationStatus = "unverified" | "pending" | "verified";

export type DocumentRelatedType =
  | "profile"
  | "project"
  | "opportunity"
  | "investment"
  | "expert";

export type DocumentType =
  | "business_plan"
  | "presentation"
  | "company_document"
  | "ownership_document"
  | "license"
  | "certificate"
  | "financial"
  | "other";

export type DocumentVisibility = "private" | "review" | "public";

export type DocumentStatus =
  | "uploaded"
  | "pending"
  | "verified"
  | "rejected";

export type VerificationRequestStatus = "pending" | "approved" | "rejected";

export type SocialLinks = {
  telegram?: string;
  linkedin?: string;
  vk?: string;
  other?: string;
};

/** Документ для системы доверия. */
export type Document = {
  id: string;
  ownerId: string;
  relatedType: DocumentRelatedType;
  relatedId: string;
  name: string;
  documentType: DocumentType;
  fileUrl: string;
  visibility: DocumentVisibility;
  status: DocumentStatus;
  createdAt?: string;
  updatedAt?: string;
};

/** Заявка на проверку сущности. */
export type VerificationRequest = {
  id: string;
  userId: string;
  targetType: DocumentRelatedType;
  targetId: string;
  status: VerificationRequestStatus;
  adminComment: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Универсальная заявка на взаимодействие. */
export type Application = {
  id: string;
  fromUserId: string;
  targetType: ApplicationTargetType;
  targetId: string;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

/** Профиль пользователя платформы (расширяет auth.users). */
export type User = {
  id: string;
  email: string;
  fullName: string;
  companyName?: string | null;
  website?: string | null;
  socialLinks?: SocialLinks | null;
  verificationStatus?: VerificationStatus;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  city?: string | null;
  region?: string | null;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
};

/** Профиль эксперта. */
export type ExpertProfile = {
  id: string;
  userId: string;
  specialization: ExpertSpecialization;
  headline: string;
  description: string;
  experienceYears: number;
  services: string;
  region: string;
  status: ExpertProfileStatus;
  verificationStatus?: VerificationStatus;
  createdAt?: string;
  updatedAt?: string;
};

/** Отраслевая категория проекта. */
export type Category = {
  id: string;
  name: string;
  icon?: string | null;
  slug: string;
};

/** Бизнес-проект — центральная сущность ЦКР. */
export type Project = {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  region: string;
  investmentRequired: number;
  currency: string;
  stage: ProjectStage;
  status: PublishStatus;
  verificationStatus?: VerificationStatus;
  coverUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Возможность: ресурс для реализации проектов. */
export type Opportunity = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  type: OpportunityType;
  region: string;
  city: string;
  price?: number | null;
  currency: string;
  status: PublishStatus;
  verificationStatus?: VerificationStatus;
  createdAt?: string;
  updatedAt?: string;
};

/** Комплексное решение (набор потребностей / услуг). */
export type Solution = {
  id: string;
  ownerId: string;
  title: string;
  summary: string;
  description?: string;
  types: SolutionType[];
  region?: string | null;
  status: PublishStatus;
  projectId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Инвестиционное предложение. */
export type InvestmentOffer = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  amountMin: number;
  amountMax: number;
  currency: string;
  regions: string[];
  categories: string[];
  investmentType: InvestmentType;
  status: InvestmentOfferStatus;
  verificationStatus?: VerificationStatus;
  createdAt?: string;
  updatedAt?: string;
};
