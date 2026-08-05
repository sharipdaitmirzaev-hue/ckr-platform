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

export type InvestmentOfferStatus = PublishStatus;

/** Профиль пользователя платформы (расширяет auth.users). */
export type User = {
  id: string;
  email: string;
  fullName: string;
  companyName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  city?: string | null;
  region?: string | null;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
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

/** Инвестиционное предложение или интерес к проекту. */
export type Investment = {
  id: string;
  investorId: string;
  title: string;
  summary: string;
  description?: string;
  ticketMin: number;
  ticketMax: number;
  currency: string;
  sectors?: string[];
  regions?: string[];
  projectId?: string | null;
  status: InvestmentOfferStatus;
  createdAt?: string;
  updatedAt?: string;
};
