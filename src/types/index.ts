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

export type ProjectStage = "idea" | "mvp" | "operating" | "scaling";

export type PublishStatus = "draft" | "moderation" | "published" | "archived";

export type OpportunityType =
  | "land"
  | "premises"
  | "equipment"
  | "ready_business"
  | "technology";

export type SolutionType =
  | "find_investor"
  | "find_land"
  | "find_equipment"
  | "find_specialists"
  | "legal_support"
  | "marketing";

export type ApplicationStatus =
  | "new"
  | "in_review"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type InvestmentOfferStatus = PublishStatus;

/** Профиль пользователя платформы (расширяет auth.users). */
export type User = {
  id: string;
  email: string;
  fullName: string;
  companyName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  region?: string | null;
  phone?: string | null;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
};

/** Бизнес-проект / идея. */
export type Project = {
  id: string;
  ownerId: string;
  title: string;
  slug?: string;
  summary: string;
  description?: string;
  region: string;
  investmentRequired: number;
  currency: string;
  stage: ProjectStage;
  status: PublishStatus;
  seekingPartners: boolean;
  coverUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Возможность: актив / ресурс. */
export type Opportunity = {
  id: string;
  ownerId: string;
  title: string;
  summary: string;
  description?: string;
  type: OpportunityType;
  region: string;
  price?: number | null;
  currency?: string;
  dealType?: string | null;
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
  /** Связь с конкретным проектом, если предложение целевое */
  projectId?: string | null;
  status: InvestmentOfferStatus;
  createdAt?: string;
  updatedAt?: string;
};
