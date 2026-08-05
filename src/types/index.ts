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

export type DealType =
  | "investment"
  | "partnership"
  | "service"
  | "purchase"
  | "lease"
  | "other";

export type DealStatus =
  | "draft"
  | "negotiation"
  | "agreement"
  | "active"
  | "completed"
  | "cancelled";

export type DealParticipantRole = "owner" | "investor" | "partner" | "expert";

export type SubscriptionPlanType =
  | "investor"
  | "company"
  | "expert"
  | "enterprise";

export type SubscriptionPlanStatus = "active" | "inactive";

export type SubscriptionStatus = "active" | "expired" | "cancelled";

export type ServiceCategory =
  | "business_plan"
  | "legal"
  | "marketing"
  | "consulting"
  | "investment_search"
  | "project_support";

export type ServiceStatus = "active" | "inactive";

export type CommissionType = "fixed" | "percent";

export type CommissionStatus = "pending" | "paid" | "cancelled";

export type AnalyticsEvent = {
  id: string;
  userId: string | null;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type MilestoneStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "blocked";

export type ProjectActivityType =
  | "status_change"
  | "participant_added"
  | "document_uploaded"
  | "milestone_completed"
  | "milestone_created"
  | "milestone_updated"
  | "deal_created"
  | "deal_updated"
  | "note";

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

/** Сделка — переход от решения к реализации. */
export type Deal = {
  id: string;
  projectId: string;
  initiatorId: string;
  partnerId: string | null;
  dealType: DealType;
  amount: number | null;
  currency: string;
  status: DealStatus;
  description: string;
  commissionType: CommissionType | null;
  commissionAmount: number | null;
  commissionStatus: CommissionStatus | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Тариф подписки ЦКР. */
export type SubscriptionPlan = {
  id: string;
  name: string;
  type: SubscriptionPlanType;
  description: string;
  price: number;
  period: string;
  features: string[];
  status: SubscriptionPlanStatus;
  createdAt?: string;
  updatedAt?: string;
};

/** Подписка пользователя. */
export type Subscription = {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Платная услуга ЦКР. */
export type Service = {
  id: string;
  title: string;
  description: string;
  category: ServiceCategory;
  price: number;
  status: ServiceStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type DealParticipant = {
  id: string;
  dealId: string;
  userId: string;
  role: DealParticipantRole;
  createdAt?: string;
};

/** Этап реализации проекта. */
export type ProjectMilestone = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  deadline: string | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

/** Событие истории проекта. */
export type ProjectActivity = {
  id: string;
  projectId: string;
  actorId: string | null;
  activityType: ProjectActivityType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};
