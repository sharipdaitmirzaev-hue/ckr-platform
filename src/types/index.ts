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

/** Статус публикации возможностей / офферов. */
export type PublishStatus = "draft" | "moderation" | "published" | "archived";

/** Жизненный цикл проекта ЦКР. */
export type ProjectStatus =
  | "draft"
  | "moderation"
  | "published"
  | "active"
  | "completed"
  | "archived";

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
  status: ProjectStatus;
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
  applicationId: string | null;
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

/** Интерес инвестора (closed pilot). */
export type InvestorInterest = {
  id: string;
  userId: string;
  targetType: "project" | "opportunity" | "investment";
  targetId: string;
  createdAt?: string;
  title?: string;
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

export type ProductTestKind = "scenario" | "task";

export type ProductTestStatus =
  | "pending"
  | "in_progress"
  | "passed"
  | "failed"
  | "blocked";

export type ProductTestChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  note?: string;
};

export type BetaInviteStatus = "created" | "sent" | "used" | "expired";

export type BetaInvite = {
  id: string;
  email: string;
  code: string;
  role: string;
  status: BetaInviteStatus;
  createdAt?: string;
  usedAt: string | null;
  createdBy: string | null;
  usedBy: string | null;
};

export type FeedbackType = "bug" | "idea" | "question" | "review";

export type Feedback = {
  id: string;
  userId: string | null;
  type: FeedbackType;
  message: string;
  rating: number | null;
  page: string;
  relatedType: string | null;
  relatedId: string | null;
  createdAt?: string;
};

/** Проблема closed pilot (этап 29). */
export type PilotIssue = {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UserFeedbackEvent = {
  id: string;
  userId: string | null;
  eventType: string;
  entityType: string | null;
  entityId: string | null;
  rating: number | null;
  comment: string;
  createdAt?: string;
};

/** CRM ЦКР — контакт (Этап 21). */
export type CrmContactType =
  | "entrepreneur"
  | "investor"
  | "expert"
  | "company"
  | "partner"
  | "other";

export type CrmContactStatus = "new" | "active" | "inactive";

export type CrmLeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "project_created"
  | "deal"
  | "closed";

export type CrmActivityType =
  | "call"
  | "meeting"
  | "email"
  | "comment"
  | "task";

export type CrmTaskStatus = "open" | "done" | "cancelled";

export type CrmContact = {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  type: CrmContactType;
  source: string;
  assignedTo: string | null;
  status: CrmContactStatus;
  notes: string;
  linkedUserId: string | null;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** CRM ЦКР — лид. */
export type CrmLead = {
  id: string;
  contactId: string;
  title: string;
  description: string;
  category: string;
  assignedTo: string | null;
  stage: CrmLeadStage;
  convertedUserId: string | null;
  convertedProjectId: string | null;
  convertedOpportunityId: string | null;
  convertedInvestmentId: string | null;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
  contactName?: string;
  contactEmail?: string;
};

/** CRM ЦКР — активность / задача. */
export type CrmActivity = {
  id: string;
  contactId: string | null;
  leadId: string | null;
  type: CrmActivityType;
  title: string;
  body: string;
  taskStatus: CrmTaskStatus | null;
  dueAt: string | null;
  completedAt: string | null;
  createdBy: string | null;
  createdAt?: string;
  contactName?: string;
  leadTitle?: string;
};

/** Операционный центр — задача (Этап 22). */
export type OperatorTaskStatus =
  | "new"
  | "in_progress"
  | "waiting"
  | "completed"
  | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskRelatedType =
  | "lead"
  | "project"
  | "deal"
  | "document"
  | "verification";

export type OperatorRoleName =
  | "manager"
  | "analyst"
  | "moderator"
  | "admin";

export type OperatorTask = {
  id: string;
  title: string;
  description: string;
  assignedTo: string | null;
  relatedType: TaskRelatedType | null;
  relatedId: string | null;
  priority: TaskPriority;
  status: OperatorTaskStatus;
  deadline: string | null;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
  assigneeName?: string;
};

export type OperatorRoleRecord = {
  id: string;
  userId: string;
  role: OperatorRoleName;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SlaRule = {
  id: string;
  entityType: string;
  timeLimitHours: number;
  active: boolean;
  label: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OperatorQueueItem = {
  id: string;
  kind:
    | "lead"
    | "project"
    | "application"
    | "deal"
    | "document"
    | "verification"
    | "task";
  title: string;
  subtitle?: string;
  status: string;
  href: string;
  createdAt?: string;
  overdue?: boolean;
};

export type OperatorActivityItem = {
  id: string;
  label: string;
  detail?: string;
  href?: string;
  at?: string;
};

/** Партнёрская сеть — организация (Этап 23). */
export type OrganizationType =
  | "company"
  | "bank"
  | "fund"
  | "supplier"
  | "university"
  | "association"
  | "government"
  | "other";

export type OrganizationVerificationStatus =
  | "unverified"
  | "pending"
  | "verified";

export type OrganizationMemberRole = "owner" | "manager" | "employee";

export type PartnershipType =
  | "strategic"
  | "supplier"
  | "investment"
  | "technology"
  | "expert";

export type PartnershipStatus = "pending" | "active" | "inactive";

export type Organization = {
  id: string;
  name: string;
  type: OrganizationType;
  description: string;
  website: string;
  region: string;
  city: string;
  verificationStatus: OrganizationVerificationStatus;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationMemberRole;
  createdAt?: string;
  fullName?: string;
  email?: string;
};

export type Partnership = {
  id: string;
  organizationId: string;
  type: PartnershipType;
  status: PartnershipStatus;
  description: string;
  createdBy: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Репутация и доверие (Этап 24). */
export type ReputationEntityType = "user" | "organization";

export type ReputationVerificationLevel = "basic" | "verified" | "trusted";

export type ReviewTargetType =
  | "project"
  | "organization"
  | "expert"
  | "investor"
  | "service";

export type EntityHistoryKind = "project" | "deal" | "partnership" | "task";

export type TrustBadgeKey =
  | "verified"
  | "trusted_partner"
  | "experienced_investor"
  | "ckr_expert";

export type ReputationProfile = {
  id: string;
  entityType: ReputationEntityType;
  entityId: string;
  score: number;
  verificationLevel: ReputationVerificationLevel;
  completedProjects: number;
  completedDeals: number;
  reviewsCount: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Review = {
  id: string;
  authorId: string;
  targetType: ReviewTargetType;
  targetId: string;
  dealId: string | null;
  rating: number;
  comment: string;
  createdAt?: string;
  authorName?: string;
};

export type EntityHistoryItem = {
  id: string;
  entityType: ReputationEntityType;
  entityId: string;
  kind: EntityHistoryKind;
  title: string;
  relatedType: string | null;
  relatedId: string | null;
  meta: Record<string, unknown>;
  createdAt?: string;
};

export type TrustBadgeAward = {
  id: string;
  entityType: ReputationEntityType;
  entityId: string;
  badge: TrustBadgeKey;
  createdAt?: string;
};

/** Прогон сценария или тестовая задача (Этап 19). */
export type ProductTest = {
  id: string;
  kind: ProductTestKind;
  scenarioKey: string | null;
  title: string;
  description: string;
  status: ProductTestStatus;
  checklist: ProductTestChecklistItem[];
  resultNotes: string;
  issues: string;
  recommendations: string;
  createdBy: string | null;
  updatedBy: string | null;
  completedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};
