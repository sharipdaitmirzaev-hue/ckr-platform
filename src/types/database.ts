export type DbUserRole =
  | "entrepreneur"
  | "investor"
  | "expert"
  | "company"
  | "admin";

export type DbProjectStatus =
  | "draft"
  | "moderation"
  | "published"
  | "active"
  | "completed"
  | "archived";

export type DbProjectStage = "idea" | "startup" | "operating" | "expansion";

export type DbOpportunityStatus =
  | "draft"
  | "moderation"
  | "published"
  | "archived";

export type DbOpportunityType =
  | "land"
  | "premises"
  | "equipment"
  | "ready_business"
  | "technology"
  | "service"
  | "partner";

export type DbApplicationTargetType =
  | "project"
  | "opportunity"
  | "investment"
  | "expert";

export type DbApplicationStatus =
  | "new"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "closed";

export type DbInvestmentType = "equity" | "loan" | "partnership" | "purchase";

export type DbInvestmentOfferStatus =
  | "draft"
  | "moderation"
  | "published"
  | "closed";

export type DbVerificationStatus = "unverified" | "pending" | "verified";

export type DbExpertSpecialization =
  | "lawyer"
  | "accountant"
  | "marketer"
  | "engineer"
  | "builder"
  | "consultant"
  | "other";

export type DbExpertProfileStatus =
  | "draft"
  | "moderation"
  | "published"
  | "archived";

export type DbDocumentRelatedType =
  | "profile"
  | "project"
  | "opportunity"
  | "investment"
  | "expert";

export type DbDocumentType =
  | "business_plan"
  | "presentation"
  | "company_document"
  | "ownership_document"
  | "license"
  | "certificate"
  | "financial"
  | "other";

export type DbDocumentVisibility = "private" | "review" | "public";

export type DbDocumentStatus =
  | "uploaded"
  | "pending"
  | "verified"
  | "rejected";

export type DbVerificationRequestStatus = "pending" | "approved" | "rejected";

export type DbDealType =
  | "investment"
  | "partnership"
  | "service"
  | "purchase"
  | "lease"
  | "other";

export type DbDealStatus =
  | "draft"
  | "negotiation"
  | "agreement"
  | "active"
  | "completed"
  | "cancelled";

export type DbDealParticipantRole =
  | "owner"
  | "investor"
  | "partner"
  | "expert";

export type DbSubscriptionPlanType =
  | "investor"
  | "company"
  | "expert"
  | "enterprise";

export type DbSubscriptionPlanStatus = "active" | "inactive";

export type DbSubscriptionStatus = "active" | "expired" | "cancelled";

export type DbServiceCategory =
  | "business_plan"
  | "legal"
  | "marketing"
  | "consulting"
  | "investment_search"
  | "project_support";

export type DbServiceStatus = "active" | "inactive";

export type DbCommissionType = "fixed" | "percent";

export type DbCommissionStatus = "pending" | "paid" | "cancelled";

export type AnalyticsEventRow = {
  id: string;
  user_id: string | null;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type DbProductTestKind = "scenario" | "task";

export type DbProductTestStatus =
  | "pending"
  | "in_progress"
  | "passed"
  | "failed"
  | "blocked";

export type ProductTestRow = {
  id: string;
  kind: DbProductTestKind;
  scenario_key: string | null;
  title: string;
  description: string;
  status: DbProductTestStatus;
  checklist: unknown;
  result_notes: string;
  issues: string;
  recommendations: string;
  created_by: string | null;
  updated_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbBetaInviteStatus =
  | "invited"
  | "registered"
  | "activated"
  | "active"
  | "completed"
  | "inactive"
  | "disabled"
  | "created"
  | "sent"
  | "used"
  | "expired";

export type BetaInviteRow = {
  id: string;
  email: string;
  code: string;
  role: string;
  status: DbBetaInviteStatus;
  source: string;
  channel: string;
  created_at: string;
  used_at: string | null;
  created_by: string | null;
  used_by: string | null;
};

export type DbFeedbackType =
  | "bug"
  | "ux"
  | "idea"
  | "business_value"
  | "lia_quality"
  | "question"
  | "review";

export type DbFeedbackPriority = "low" | "medium" | "high" | "critical";

export type FeedbackRow = {
  id: string;
  user_id: string | null;
  type: DbFeedbackType;
  message: string;
  rating: number | null;
  page: string;
  related_type: string | null;
  related_id: string | null;
  priority: DbFeedbackPriority;
  category: string | null;
  created_at: string;
};

export type DbPilotParticipantRole =
  | "entrepreneur"
  | "investor"
  | "expert"
  | "organization"
  | "operator";

export type DbPilotParticipantStatus =
  | "invited"
  | "active"
  | "inactive"
  | "completed";

export type DbPilotChecklistStatus = "pending" | "done" | "skipped";

export type PilotParticipantRow = {
  id: string;
  user_id: string | null;
  role: DbPilotParticipantRole;
  status: DbPilotParticipantStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type DbLaunchWaveStatus = "planned" | "active" | "completed";
export type DbLaunchWaveType = "internal" | "closed" | "beta" | "public";

export type DbLaunchDecisionKind =
  | "continue_closed"
  | "expand_beta"
  | "public_launch_ready"
  | "needs_improvement";

export type LaunchDecisionRow = {
  id: string;
  wave_id: string | null;
  decision: DbLaunchDecisionKind;
  notes: string;
  created_by: string | null;
  created_at: string;
};

/** Этап 57: решение перед Public Launch. */
export type DbPublicLaunchDecisionKind =
  | "public_launch"
  | "continue_beta"
  | "improve_product";

export type PublicLaunchDecisionRow = {
  id: string;
  wave_id: string | null;
  decision: DbPublicLaunchDecisionKind;
  notes: string;
  created_by: string | null;
  created_at: string;
};

export type DbLaunchWaveParticipantStatus =
  | "invited"
  | "joined"
  | "active"
  | "completed"
  | "left";

export type LaunchWaveRow = {
  id: string;
  name: string;
  description: string;
  status: DbLaunchWaveStatus;
  wave_type: DbLaunchWaveType;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export type LaunchWaveParticipantRow = {
  id: string;
  wave_id: string;
  user_id: string | null;
  status: DbLaunchWaveParticipantStatus;
  notes: string;
  created_at: string;
};

export type DbLaunchGoalStatus =
  | "active"
  | "achieved"
  | "failed"
  | "cancelled";

export type DbLaunchGoalMetricType =
  | "users"
  | "activation"
  | "projects"
  | "applications"
  | "deals"
  | "lia_usage"
  | "business_results";

export type LaunchGoalRow = {
  id: string;
  wave_id: string;
  title: string;
  description: string;
  metric_type: DbLaunchGoalMetricType;
  target_value: number;
  current_value: number;
  status: DbLaunchGoalStatus;
  created_at: string;
  updated_at: string;
};

export type PilotChecklistRow = {
  id: string;
  participant_id: string;
  item: string;
  status: DbPilotChecklistStatus;
  created_at: string;
  updated_at: string;
};

export type DbPilotIssueSeverity = "critical" | "high" | "medium" | "low";
export type DbPilotIssueStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export type PilotIssueRow = {
  id: string;
  title: string;
  description: string;
  severity: DbPilotIssueSeverity;
  status: DbPilotIssueStatus;
  created_by: string | null;
  source_type?: string | null;
  source_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type DbProductImprovementPriority =
  | "critical"
  | "high"
  | "medium"
  | "low";

export type DbProductImprovementStatus =
  | "planned"
  | "in_progress"
  | "released"
  | "rejected";

export type DbProductImprovementSource =
  | "feedback"
  | "pilot_issue"
  | "analytics"
  | "lia"
  | "manual";

export type ProductImprovementRow = {
  id: string;
  title: string;
  description: string;
  source_type: DbProductImprovementSource;
  source_id: string | null;
  priority: DbProductImprovementPriority;
  status: DbProductImprovementStatus;
  created_at: string;
  updated_at: string;
};

export type UserFeedbackEventRow = {
  id: string;
  user_id: string | null;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  rating: number | null;
  comment: string;
  created_at: string;
};

export type DbCrmContactType =
  | "entrepreneur"
  | "investor"
  | "expert"
  | "company"
  | "partner"
  | "other";

export type DbCrmContactStatus = "new" | "active" | "inactive";

export type DbCrmLeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "project_created"
  | "deal"
  | "closed";

export type DbCrmActivityType =
  | "call"
  | "meeting"
  | "email"
  | "comment"
  | "task";

export type DbCrmTaskStatus = "open" | "done" | "cancelled";

export type CrmContactRow = {
  id: string;
  name: string;
  company_name: string;
  phone: string;
  email: string;
  type: DbCrmContactType;
  source: string;
  assigned_to: string | null;
  status: DbCrmContactStatus;
  notes: string;
  linked_user_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadRow = {
  id: string;
  contact_id: string;
  title: string;
  description: string;
  category: string;
  assigned_to: string | null;
  stage: DbCrmLeadStage;
  converted_user_id: string | null;
  converted_project_id: string | null;
  converted_opportunity_id: string | null;
  converted_investment_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmActivityRow = {
  id: string;
  contact_id: string | null;
  lead_id: string | null;
  type: DbCrmActivityType;
  title: string;
  body: string;
  task_status: DbCrmTaskStatus | null;
  due_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type DbOperatorRole =
  | "manager"
  | "analyst"
  | "moderator"
  | "admin";

export type DbTaskStatus =
  | "new"
  | "in_progress"
  | "waiting"
  | "completed"
  | "cancelled";

export type DbTaskPriority = "low" | "medium" | "high" | "urgent";

export type DbTaskRelatedType =
  | "lead"
  | "project"
  | "deal"
  | "document"
  | "verification"
  | "roadmap_item";

export type DbRoadmapStatus =
  | "draft"
  | "active"
  | "completed"
  | "archived";

export type DbRoadmapItemStatus =
  | "planned"
  | "in_progress"
  | "blocked"
  | "completed"
  | "cancelled";

export type OperatorRoleRow = {
  id: string;
  user_id: string;
  role: DbOperatorRole;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  title: string;
  description: string;
  assigned_to: string | null;
  related_type: DbTaskRelatedType | null;
  related_id: string | null;
  roadmap_item_id?: string | null;
  priority: DbTaskPriority;
  status: DbTaskStatus;
  deadline: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectRoadmapRow = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: DbRoadmapStatus;
  created_at: string;
  updated_at: string;
};

export type RoadmapItemRow = {
  id: string;
  roadmap_id: string;
  title: string;
  description: string;
  order_number: number;
  responsible_user_id: string | null;
  deadline: string | null;
  status: DbRoadmapItemStatus;
  milestone_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectMetricRow = {
  id: string;
  project_id: string;
  name: string;
  description: string;
  target_value: number | string;
  current_value: number | string;
  unit: string;
  period: string;
  created_at: string;
  updated_at: string;
};

export type DbProjectResultType =
  | "revenue"
  | "investment"
  | "partnership"
  | "launch"
  | "growth"
  | "cost_reduction"
  | "other";

export type DbFinancialMetricType =
  | "revenue"
  | "investment"
  | "expenses"
  | "profit"
  | "valuation";

export type ProjectResultRow = {
  id: string;
  project_id: string;
  result_type: DbProjectResultType;
  title: string;
  description: string;
  value: number | string | null;
  unit: string;
  achieved_at: string | null;
  metric_id: string | null;
  created_at: string;
};

export type ProjectFinancialMetricRow = {
  id: string;
  project_id: string;
  metric_type: DbFinancialMetricType;
  value: number | string;
  currency: string;
  period: string;
  created_at: string;
  updated_at: string;
};

export type SlaRuleRow = {
  id: string;
  entity_type: string;
  time_limit_hours: number;
  active: boolean;
  label: string;
  created_at: string;
  updated_at: string;
};

export type DbOrganizationType =
  | "company"
  | "bank"
  | "fund"
  | "supplier"
  | "university"
  | "association"
  | "government"
  | "other";

export type DbOrganizationVerificationStatus =
  | "unverified"
  | "pending"
  | "verified";

export type DbOrganizationMemberRole = "owner" | "manager" | "employee";

export type DbPartnershipType =
  | "strategic"
  | "supplier"
  | "investment"
  | "technology"
  | "expert";

export type DbPartnershipStatus = "pending" | "active" | "inactive";

export type OrganizationRow = {
  id: string;
  name: string;
  type: DbOrganizationType;
  description: string;
  website: string;
  region: string;
  city: string;
  verification_status: DbOrganizationVerificationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationMemberRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: DbOrganizationMemberRole;
  created_at: string;
};

export type PartnershipRow = {
  id: string;
  organization_id: string;
  type: DbPartnershipType;
  status: DbPartnershipStatus;
  description: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DbReputationEntityType = "user" | "organization";

export type DbReputationVerificationLevel = "basic" | "verified" | "trusted";

export type DbReviewTargetType =
  | "project"
  | "organization"
  | "expert"
  | "investor"
  | "service";

export type DbEntityHistoryKind = "project" | "deal" | "partnership" | "task";

export type DbTrustBadgeKey =
  | "verified"
  | "trusted_partner"
  | "experienced_investor"
  | "ckr_expert";

export type ReputationProfileRow = {
  id: string;
  entity_type: DbReputationEntityType;
  entity_id: string;
  score: number | string;
  verification_level: DbReputationVerificationLevel;
  completed_projects: number;
  completed_deals: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
};

export type ReviewRow = {
  id: string;
  author_id: string;
  target_type: DbReviewTargetType;
  target_id: string;
  deal_id: string | null;
  rating: number;
  comment: string;
  created_at: string;
};

export type EntityHistoryRow = {
  id: string;
  entity_type: DbReputationEntityType;
  entity_id: string;
  kind: DbEntityHistoryKind;
  title: string;
  related_type: string | null;
  related_id: string | null;
  meta: unknown;
  created_at: string;
};

export type TrustBadgeRow = {
  id: string;
  entity_type: DbReputationEntityType;
  entity_id: string;
  badge: DbTrustBadgeKey;
  created_at: string;
};

export type DbSystemLogLevel = "info" | "warning" | "error";

export type SystemLogRow = {
  id: string;
  level: DbSystemLogLevel;
  source: string;
  message: string;
  metadata: unknown;
  created_at: string;
};

export type DbMilestoneStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "blocked";

export type DbProjectActivityType =
  | "status_change"
  | "participant_added"
  | "document_uploaded"
  | "milestone_completed"
  | "milestone_created"
  | "milestone_updated"
  | "deal_created"
  | "deal_updated"
  | "note"
  | "roadmap_created"
  | "roadmap_item_completed"
  | "metric_updated"
  | "project_progress_checked"
  | "result_created"
  | "financial_metric_updated"
  | "project_completed"
  | "outcome_generated";

export type DealRow = {
  id: string;
  project_id: string;
  initiator_id: string;
  partner_id: string | null;
  application_id: string | null;
  deal_type: DbDealType;
  amount: number | string | null;
  currency: string;
  status: DbDealStatus;
  description: string;
  commission_type?: DbCommissionType | null;
  commission_amount?: number | string | null;
  commission_status?: DbCommissionStatus | null;
  created_at: string;
  updated_at: string;
};

export type DbInvestorInterestTargetType =
  | "project"
  | "opportunity"
  | "investment";

export type InvestorInterestRow = {
  id: string;
  user_id: string;
  target_type: DbInvestorInterestTargetType;
  target_id: string;
  created_at: string;
};

export type SubscriptionPlanRow = {
  id: string;
  name: string;
  type: DbSubscriptionPlanType;
  description: string;
  price: number | string;
  period: string;
  features: unknown;
  status: DbSubscriptionPlanStatus;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_id: string;
  status: DbSubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ServiceRow = {
  id: string;
  title: string;
  description: string;
  category: DbServiceCategory;
  price: number | string;
  status: DbServiceStatus;
  created_at: string;
  updated_at: string;
};

export type DealParticipantRow = {
  id: string;
  deal_id: string;
  user_id: string;
  role: DbDealParticipantRole;
  created_at: string;
};

export type ProjectMilestoneRow = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: DbMilestoneStatus;
  deadline: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectActivityRow = {
  id: string;
  project_id: string;
  actor_id: string | null;
  activity_type: DbProjectActivityType;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type LiaAnalysisRow = {
  id: string;
  user_id: string;
  project_id: string;
  summary: string;
  available_resources: unknown;
  missing_resources: unknown;
  recommendations: unknown;
  risks: unknown;
  next_steps: unknown;
  internal_matches: unknown;
  external_results: unknown;
  report: unknown;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  company_name: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
  verification_status: DbVerificationStatus;
  is_blocked?: boolean;
  is_public?: boolean;
  show_contact?: boolean;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  created_at: string;
  updated_at: string;
};

export type ExpertProfileRow = {
  id: string;
  user_id: string;
  specialization: DbExpertSpecialization;
  headline: string;
  description: string;
  experience_years: number;
  services: string;
  region: string;
  status: DbExpertProfileStatus;
  verification_status: DbVerificationStatus;
  created_at: string;
  updated_at: string;
};

export type DocumentRow = {
  id: string;
  owner_id: string;
  related_type: DbDocumentRelatedType;
  related_id: string;
  name: string;
  document_type: DbDocumentType;
  file_url: string;
  visibility: DbDocumentVisibility;
  status: DbDocumentStatus;
  created_at: string;
  updated_at: string;
};

export type VerificationRequestRow = {
  id: string;
  user_id: string;
  target_type: DbDocumentRelatedType;
  target_id: string;
  status: DbVerificationRequestStatus;
  admin_comment: string;
  created_at: string;
  updated_at: string;
};

export type UserRoleRow = {
  id: string;
  user_id: string;
  role: DbUserRole;
  created_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: string;
  region: string;
  investment_required: number | string;
  currency: string;
  stage: DbProjectStage;
  status: DbProjectStatus;
  verification_status: DbVerificationStatus;
  cover_url: string | null;
  organization_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityCategoryRow = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type OpportunityRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  type: DbOpportunityType;
  region: string;
  city: string;
  price: number | string | null;
  currency: string;
  status: DbOpportunityStatus;
  verification_status: DbVerificationStatus;
  organization_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationRow = {
  id: string;
  from_user_id: string;
  target_type: DbApplicationTargetType;
  target_id: string;
  message: string;
  status: DbApplicationStatus;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  message?: string;
  link: string | null;
  application_id: string | null;
  related_type?: string | null;
  related_id?: string | null;
  is_read?: boolean;
  read_at: string | null;
  created_at: string;
};

export type ActivityFeedRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  action_type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type ConversationRow = {
  id: string;
  application_id: string | null;
  project_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ConversationMemberRow = {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
};

export type ChatMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type InvestmentOfferRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  amount_min: number | string;
  amount_max: number | string;
  currency: string;
  regions: string[];
  categories: string[];
  investment_type: DbInvestmentType;
  status: DbInvestmentOfferStatus;
  verification_status: DbVerificationStatus;
  organization_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          full_name?: string;
          company_name?: string | null;
          website?: string | null;
          social_links?: Record<string, string> | null;
          verification_status?: DbVerificationStatus;
          is_blocked?: boolean;
          is_public?: boolean;
          show_contact?: boolean;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          city?: string | null;
          region?: string | null;
        };
        Update: Partial<Omit<ProfileRow, "id" | "created_at">>;
      };
      expert_profiles: {
        Row: ExpertProfileRow;
        Insert: {
          id?: string;
          user_id: string;
          specialization?: DbExpertSpecialization;
          headline?: string;
          description?: string;
          experience_years?: number;
          services?: string;
          region?: string;
          status?: DbExpertProfileStatus;
          verification_status?: DbVerificationStatus;
        };
        Update: Partial<Omit<ExpertProfileRow, "id" | "user_id" | "created_at">>;
      };
      documents: {
        Row: DocumentRow;
        Insert: {
          id?: string;
          owner_id: string;
          related_type: DbDocumentRelatedType;
          related_id: string;
          name: string;
          document_type?: DbDocumentType;
          file_url: string;
          visibility?: DbDocumentVisibility;
          status?: DbDocumentStatus;
        };
        Update: Partial<Omit<DocumentRow, "id" | "owner_id" | "created_at">>;
      };
      verification_requests: {
        Row: VerificationRequestRow;
        Insert: {
          id?: string;
          user_id: string;
          target_type: DbDocumentRelatedType;
          target_id: string;
          status?: DbVerificationRequestStatus;
          admin_comment?: string;
        };
        Update: Partial<
          Omit<VerificationRequestRow, "id" | "user_id" | "created_at">
        >;
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: {
          id?: string;
          user_id: string;
          role: DbUserRole;
          created_at?: string;
        };
        Update: Partial<Omit<UserRoleRow, "id">>;
      };
      categories: {
        Row: CategoryRow;
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          slug: string;
          created_at?: string;
        };
        Update: Partial<Omit<CategoryRow, "id" | "created_at">>;
      };
      projects: {
        Row: ProjectRow;
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          slug: string;
          summary?: string;
          description?: string;
          category: string;
          region?: string;
          investment_required?: number;
          currency?: string;
          stage?: DbProjectStage;
          status?: DbProjectStatus;
          verification_status?: DbVerificationStatus;
          cover_url?: string | null;
          organization_id?: string | null;
        };
        Update: Partial<Omit<ProjectRow, "id" | "owner_id" | "created_at">>;
      };
      opportunity_categories: {
        Row: OpportunityCategoryRow;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: Partial<Omit<OpportunityCategoryRow, "id" | "created_at">>;
      };
      opportunities: {
        Row: OpportunityRow;
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string;
          type: DbOpportunityType;
          region?: string;
          city?: string;
          price?: number | null;
          currency?: string;
          status?: DbOpportunityStatus;
          verification_status?: DbVerificationStatus;
          organization_id?: string | null;
        };
        Update: Partial<Omit<OpportunityRow, "id" | "owner_id" | "created_at">>;
      };
      applications: {
        Row: ApplicationRow;
        Insert: {
          id?: string;
          from_user_id: string;
          target_type: DbApplicationTargetType;
          target_id: string;
          message?: string;
          status?: DbApplicationStatus;
        };
        Update: Partial<
          Omit<ApplicationRow, "id" | "from_user_id" | "target_type" | "target_id" | "created_at">
        >;
      };
      notifications: {
        Row: NotificationRow;
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string;
          message?: string;
          link?: string | null;
          application_id?: string | null;
          related_type?: string | null;
          related_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
        };
        Update: Partial<Omit<NotificationRow, "id" | "user_id" | "created_at">>;
      };
      activity_feed: {
        Row: ActivityFeedRow;
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          action_type: string;
          description?: string;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<{
          description: string;
          metadata: Record<string, unknown>;
        }>;
      };
      conversations: {
        Row: ConversationRow;
        Insert: {
          id?: string;
          application_id?: string | null;
          project_id?: string | null;
          title?: string;
        };
        Update: Partial<{
          project_id: string | null;
          title: string;
          updated_at: string;
        }>;
      };
      conversation_members: {
        Row: ConversationMemberRow;
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
        };
        Update: Partial<{ user_id: string }>;
      };
      messages: {
        Row: ChatMessageRow;
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
        };
        Update: Partial<{ body: string }>;
      };
      investment_offers: {
        Row: InvestmentOfferRow;
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string;
          amount_min?: number;
          amount_max?: number;
          currency?: string;
          regions?: string[];
          categories?: string[];
          investment_type?: DbInvestmentType;
          status?: DbInvestmentOfferStatus;
          verification_status?: DbVerificationStatus;
          organization_id?: string | null;
        };
        Update: Partial<
          Omit<InvestmentOfferRow, "id" | "owner_id" | "created_at">
        >;
      };
      lia_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          context_type: string | null;
          context_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          context_type?: string | null;
          context_id?: string | null;
        };
        Update: Partial<{
          title: string;
          context_type: string | null;
          context_id: string | null;
          updated_at: string;
        }>;
      };
      lia_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant" | "system" | "tool";
          content: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant" | "system" | "tool";
          content?: string;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<{
          content: string;
          metadata: Record<string, unknown>;
        }>;
      };
      lia_analyses: {
        Row: LiaAnalysisRow;
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          summary?: string;
          available_resources?: unknown;
          missing_resources?: unknown;
          recommendations?: unknown;
          risks?: unknown;
          next_steps?: unknown;
          internal_matches?: unknown;
          external_results?: unknown;
          report?: unknown;
        };
        Update: Partial<{
          summary: string;
          available_resources: unknown;
          missing_resources: unknown;
          recommendations: unknown;
          risks: unknown;
          next_steps: unknown;
          internal_matches: unknown;
          external_results: unknown;
          report: unknown;
        }>;
      };
      analytics_events: {
        Row: AnalyticsEventRow;
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<{
          metadata: Record<string, unknown>;
        }>;
      };
      product_tests: {
        Row: ProductTestRow;
        Insert: {
          id?: string;
          kind?: DbProductTestKind;
          scenario_key?: string | null;
          title: string;
          description?: string;
          status?: DbProductTestStatus;
          checklist?: unknown;
          result_notes?: string;
          issues?: string;
          recommendations?: string;
          created_by?: string | null;
          updated_by?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<{
          title: string;
          description: string;
          status: DbProductTestStatus;
          checklist: unknown;
          result_notes: string;
          issues: string;
          recommendations: string;
          updated_by: string | null;
          completed_at: string | null;
        }>;
      };
      beta_invites: {
        Row: BetaInviteRow;
        Insert: {
          id?: string;
          email: string;
          code: string;
          role?: string;
          status?: DbBetaInviteStatus;
          source?: string;
          channel?: string;
          created_by?: string | null;
          used_by?: string | null;
          used_at?: string | null;
        };
        Update: Partial<{
          status: DbBetaInviteStatus;
          source: string;
          channel: string;
          used_at: string | null;
          used_by: string | null;
        }>;
      };
      feedback: {
        Row: FeedbackRow;
        Insert: {
          id?: string;
          user_id?: string | null;
          type: DbFeedbackType;
          message: string;
          rating?: number | null;
          page?: string;
          related_type?: string | null;
          related_id?: string | null;
          priority?: DbFeedbackPriority;
          category?: string | null;
        };
        Update: Partial<{
          message: string;
          rating: number | null;
          related_type: string | null;
          related_id: string | null;
          priority: DbFeedbackPriority;
          type: DbFeedbackType;
          category: string | null;
        }>;
      };
      pilot_participants: {
        Row: PilotParticipantRow;
        Insert: {
          id?: string;
          user_id?: string | null;
          role?: DbPilotParticipantRole;
          status?: DbPilotParticipantStatus;
          notes?: string;
        };
        Update: Partial<
          Omit<PilotParticipantRow, "id" | "created_at">
        >;
      };
      launch_waves: {
        Row: LaunchWaveRow;
        Insert: {
          id?: string;
          name: string;
          description?: string;
          status?: DbLaunchWaveStatus;
          wave_type?: DbLaunchWaveType;
          start_date?: string | null;
          end_date?: string | null;
        };
        Update: Partial<{
          name: string;
          description: string;
          status: DbLaunchWaveStatus;
          wave_type: DbLaunchWaveType;
          start_date: string | null;
          end_date: string | null;
        }>;
      };
      launch_wave_participants: {
        Row: LaunchWaveParticipantRow;
        Insert: {
          id?: string;
          wave_id: string;
          user_id?: string | null;
          status?: DbLaunchWaveParticipantStatus;
          notes?: string;
        };
        Update: Partial<{
          wave_id: string;
          user_id: string | null;
          status: DbLaunchWaveParticipantStatus;
          notes: string;
        }>;
      };
      launch_goals: {
        Row: LaunchGoalRow;
        Insert: {
          id?: string;
          wave_id: string;
          title: string;
          description?: string;
          metric_type?: DbLaunchGoalMetricType;
          target_value?: number;
          current_value?: number;
          status?: DbLaunchGoalStatus;
        };
        Update: Partial<{
          wave_id: string;
          title: string;
          description: string;
          metric_type: DbLaunchGoalMetricType;
          target_value: number;
          current_value: number;
          status: DbLaunchGoalStatus;
          updated_at: string;
        }>;
      };
      launch_decisions: {
        Row: LaunchDecisionRow;
        Insert: {
          id?: string;
          wave_id?: string | null;
          decision: DbLaunchDecisionKind;
          notes?: string;
          created_by?: string | null;
        };
        Update: Partial<{
          wave_id: string | null;
          decision: DbLaunchDecisionKind;
          notes: string;
          created_by: string | null;
        }>;
      };
      public_launch_decisions: {
        Row: PublicLaunchDecisionRow;
        Insert: {
          id?: string;
          wave_id?: string | null;
          decision: DbPublicLaunchDecisionKind;
          notes?: string;
          created_by?: string | null;
        };
        Update: Partial<{
          wave_id: string | null;
          decision: DbPublicLaunchDecisionKind;
          notes: string;
          created_by: string | null;
        }>;
      };
      pilot_checklists: {
        Row: PilotChecklistRow;
        Insert: {
          id?: string;
          participant_id: string;
          item: string;
          status?: DbPilotChecklistStatus;
        };
        Update: Partial<
          Omit<PilotChecklistRow, "id" | "created_at" | "participant_id">
        >;
      };
      pilot_issues: {
        Row: PilotIssueRow;
        Insert: {
          id?: string;
          title: string;
          description?: string;
          severity?: DbPilotIssueSeverity;
          status?: DbPilotIssueStatus;
          created_by?: string | null;
          source_type?: string | null;
          source_id?: string | null;
        };
        Update: Partial<{
          title: string;
          description: string;
          severity: DbPilotIssueSeverity;
          status: DbPilotIssueStatus;
          source_type: string | null;
          source_id: string | null;
          updated_at: string;
        }>;
      };
      product_improvements: {
        Row: ProductImprovementRow;
        Insert: {
          id?: string;
          title: string;
          description?: string;
          source_type?: DbProductImprovementSource;
          source_id?: string | null;
          priority?: DbProductImprovementPriority;
          status?: DbProductImprovementStatus;
        };
        Update: Partial<{
          title: string;
          description: string;
          source_type: DbProductImprovementSource;
          source_id: string | null;
          priority: DbProductImprovementPriority;
          status: DbProductImprovementStatus;
          updated_at: string;
        }>;
      };
      user_feedback_events: {
        Row: UserFeedbackEventRow;
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          rating?: number | null;
          comment?: string;
        };
        Update: Partial<{
          rating: number | null;
          comment: string;
        }>;
      };
      crm_contacts: {
        Row: CrmContactRow;
        Insert: {
          id?: string;
          name: string;
          company_name?: string;
          phone?: string;
          email?: string;
          type?: DbCrmContactType;
          source?: string;
          assigned_to?: string | null;
          status?: DbCrmContactStatus;
          notes?: string;
          linked_user_id?: string | null;
          created_by?: string | null;
        };
        Update: Partial<
          Omit<CrmContactRow, "id" | "created_at" | "created_by">
        >;
      };
      leads: {
        Row: LeadRow;
        Insert: {
          id?: string;
          contact_id: string;
          title: string;
          description?: string;
          category?: string;
          assigned_to?: string | null;
          stage?: DbCrmLeadStage;
          converted_user_id?: string | null;
          converted_project_id?: string | null;
          converted_opportunity_id?: string | null;
          converted_investment_id?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Omit<LeadRow, "id" | "created_at" | "created_by">>;
      };
      crm_activities: {
        Row: CrmActivityRow;
        Insert: {
          id?: string;
          contact_id?: string | null;
          lead_id?: string | null;
          type: DbCrmActivityType;
          title?: string;
          body?: string;
          task_status?: DbCrmTaskStatus | null;
          due_at?: string | null;
          completed_at?: string | null;
          created_by?: string | null;
        };
        Update: Partial<
          Omit<CrmActivityRow, "id" | "created_at" | "created_by">
        >;
      };
      operator_roles: {
        Row: OperatorRoleRow;
        Insert: {
          id?: string;
          user_id: string;
          role?: DbOperatorRole;
          active?: boolean;
        };
        Update: Partial<
          Omit<OperatorRoleRow, "id" | "created_at" | "user_id">
        >;
      };
      tasks: {
        Row: TaskRow;
        Insert: {
          id?: string;
          title: string;
          description?: string;
          assigned_to?: string | null;
          related_type?: DbTaskRelatedType | null;
          related_id?: string | null;
          roadmap_item_id?: string | null;
          priority?: DbTaskPriority;
          status?: DbTaskStatus;
          deadline?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Omit<TaskRow, "id" | "created_at" | "created_by">>;
      };
      project_roadmaps: {
        Row: ProjectRoadmapRow;
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          status?: DbRoadmapStatus;
        };
        Update: Partial<
          Omit<ProjectRoadmapRow, "id" | "created_at" | "project_id">
        >;
      };
      roadmap_items: {
        Row: RoadmapItemRow;
        Insert: {
          id?: string;
          roadmap_id: string;
          title: string;
          description?: string;
          order_number?: number;
          responsible_user_id?: string | null;
          deadline?: string | null;
          status?: DbRoadmapItemStatus;
          milestone_id?: string | null;
        };
        Update: Partial<
          Omit<RoadmapItemRow, "id" | "created_at" | "roadmap_id">
        >;
      };
      project_metrics: {
        Row: ProjectMetricRow;
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string;
          target_value?: number;
          current_value?: number;
          unit?: string;
          period?: string;
        };
        Update: Partial<
          Omit<ProjectMetricRow, "id" | "created_at" | "project_id">
        >;
      };
      project_results: {
        Row: ProjectResultRow;
        Insert: {
          id?: string;
          project_id: string;
          result_type?: DbProjectResultType;
          title: string;
          description?: string;
          value?: number | null;
          unit?: string;
          achieved_at?: string | null;
          metric_id?: string | null;
        };
        Update: Partial<
          Omit<ProjectResultRow, "id" | "created_at" | "project_id">
        >;
      };
      project_financial_metrics: {
        Row: ProjectFinancialMetricRow;
        Insert: {
          id?: string;
          project_id: string;
          metric_type: DbFinancialMetricType;
          value?: number;
          currency?: string;
          period?: string;
        };
        Update: Partial<
          Omit<ProjectFinancialMetricRow, "id" | "created_at" | "project_id">
        >;
      };
      sla_rules: {
        Row: SlaRuleRow;
        Insert: {
          id?: string;
          entity_type: string;
          time_limit_hours: number;
          active?: boolean;
          label?: string;
        };
        Update: Partial<Omit<SlaRuleRow, "id" | "created_at">>;
      };
      organizations: {
        Row: OrganizationRow;
        Insert: {
          id?: string;
          name: string;
          type?: DbOrganizationType;
          description?: string;
          website?: string;
          region?: string;
          city?: string;
          verification_status?: DbOrganizationVerificationStatus;
          created_by?: string | null;
        };
        Update: Partial<
          Omit<OrganizationRow, "id" | "created_at" | "created_by">
        >;
      };
      organization_members: {
        Row: OrganizationMemberRow;
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: DbOrganizationMemberRole;
        };
        Update: Partial<
          Omit<OrganizationMemberRow, "id" | "created_at" | "organization_id" | "user_id">
        >;
      };
      partnerships: {
        Row: PartnershipRow;
        Insert: {
          id?: string;
          organization_id: string;
          type?: DbPartnershipType;
          status?: DbPartnershipStatus;
          description?: string;
          created_by?: string | null;
        };
        Update: Partial<
          Omit<PartnershipRow, "id" | "created_at" | "created_by" | "organization_id">
        >;
      };
      reputation_profiles: {
        Row: ReputationProfileRow;
        Insert: {
          id?: string;
          entity_type: DbReputationEntityType;
          entity_id: string;
          score?: number;
          verification_level?: DbReputationVerificationLevel;
          completed_projects?: number;
          completed_deals?: number;
          reviews_count?: number;
        };
        Update: Partial<
          Omit<ReputationProfileRow, "id" | "created_at" | "entity_type" | "entity_id">
        >;
      };
      reviews: {
        Row: ReviewRow;
        Insert: {
          id?: string;
          author_id: string;
          target_type: DbReviewTargetType;
          target_id: string;
          deal_id?: string | null;
          rating: number;
          comment?: string;
        };
        Update: Partial<
          Omit<ReviewRow, "id" | "created_at" | "author_id">
        >;
      };
      entity_history: {
        Row: EntityHistoryRow;
        Insert: {
          id?: string;
          entity_type: DbReputationEntityType;
          entity_id: string;
          kind: DbEntityHistoryKind;
          title?: string;
          related_type?: string | null;
          related_id?: string | null;
          meta?: unknown;
        };
        Update: Partial<Omit<EntityHistoryRow, "id" | "created_at">>;
      };
      trust_badges: {
        Row: TrustBadgeRow;
        Insert: {
          id?: string;
          entity_type: DbReputationEntityType;
          entity_id: string;
          badge: DbTrustBadgeKey;
        };
        Update: Partial<Omit<TrustBadgeRow, "id" | "created_at">>;
      };
      system_logs: {
        Row: SystemLogRow;
        Insert: {
          id?: string;
          level?: DbSystemLogLevel;
          source?: string;
          message?: string;
          metadata?: unknown;
        };
        Update: Partial<Omit<SystemLogRow, "id" | "created_at">>;
      };
      subscription_plans: {
        Row: SubscriptionPlanRow;
        Insert: {
          id?: string;
          name: string;
          type: DbSubscriptionPlanType;
          description?: string;
          price?: number;
          period?: string;
          features?: unknown;
          status?: DbSubscriptionPlanStatus;
        };
        Update: Partial<
          Omit<SubscriptionPlanRow, "id" | "created_at">
        >;
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          status?: DbSubscriptionStatus;
          started_at?: string;
          expires_at?: string | null;
        };
        Update: Partial<{
          status: DbSubscriptionStatus;
          expires_at: string | null;
          plan_id: string;
        }>;
      };
      services: {
        Row: ServiceRow;
        Insert: {
          id?: string;
          title: string;
          description?: string;
          category: DbServiceCategory;
          price?: number;
          status?: DbServiceStatus;
        };
        Update: Partial<Omit<ServiceRow, "id" | "created_at">>;
      };
      deals: {
        Row: DealRow;
        Insert: {
          id?: string;
          project_id: string;
          initiator_id: string;
          partner_id?: string | null;
          application_id?: string | null;
          deal_type?: DbDealType;
          amount?: number | null;
          currency?: string;
          status?: DbDealStatus;
          description?: string;
          commission_type?: DbCommissionType | null;
          commission_amount?: number | null;
          commission_status?: DbCommissionStatus | null;
        };
        Update: Partial<{
          partner_id: string | null;
          application_id: string | null;
          deal_type: DbDealType;
          amount: number | null;
          currency: string;
          status: DbDealStatus;
          description: string;
          commission_type: DbCommissionType | null;
          commission_amount: number | null;
          commission_status: DbCommissionStatus | null;
        }>;
      };
      investor_interests: {
        Row: InvestorInterestRow;
        Insert: {
          id?: string;
          user_id: string;
          target_type: DbInvestorInterestTargetType;
          target_id: string;
        };
        Update: Partial<Omit<InvestorInterestRow, "id" | "created_at">>;
      };
      deal_participants: {
        Row: DealParticipantRow;
        Insert: {
          id?: string;
          deal_id: string;
          user_id: string;
          role?: DbDealParticipantRole;
        };
        Update: Partial<{
          role: DbDealParticipantRole;
        }>;
      };
      project_milestones: {
        Row: ProjectMilestoneRow;
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          status?: DbMilestoneStatus;
          deadline?: string | null;
          sort_order?: number;
        };
        Update: Partial<{
          title: string;
          description: string;
          status: DbMilestoneStatus;
          deadline: string | null;
          sort_order: number;
        }>;
      };
      project_activity: {
        Row: ProjectActivityRow;
        Insert: {
          id?: string;
          project_id: string;
          actor_id?: string | null;
          activity_type?: DbProjectActivityType;
          title: string;
          body?: string;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<{
          title: string;
          body: string;
          metadata: Record<string, unknown>;
        }>;
      };
    };
    Enums: {
      user_role: DbUserRole;
      project_status: DbProjectStatus;
      project_stage: DbProjectStage;
      opportunity_status: DbOpportunityStatus;
      application_target_type: DbApplicationTargetType;
      application_status: DbApplicationStatus;
      investment_type: DbInvestmentType;
      investment_offer_status: DbInvestmentOfferStatus;
      verification_status: DbVerificationStatus;
      expert_specialization: DbExpertSpecialization;
      expert_profile_status: DbExpertProfileStatus;
      document_related_type: DbDocumentRelatedType;
      document_type: DbDocumentType;
      document_visibility: DbDocumentVisibility;
      document_status: DbDocumentStatus;
      verification_request_status: DbVerificationRequestStatus;
      lia_message_role: "user" | "assistant" | "system" | "tool";
      deal_type: DbDealType;
      deal_status: DbDealStatus;
      deal_participant_role: DbDealParticipantRole;
      milestone_status: DbMilestoneStatus;
      project_activity_type: DbProjectActivityType;
      subscription_plan_type: DbSubscriptionPlanType;
      subscription_plan_status: DbSubscriptionPlanStatus;
      subscription_status: DbSubscriptionStatus;
      service_category: DbServiceCategory;
      service_status: DbServiceStatus;
      commission_type: DbCommissionType;
      commission_status: DbCommissionStatus;
      product_test_kind: DbProductTestKind;
      product_test_status: DbProductTestStatus;
      beta_invite_status: DbBetaInviteStatus;
      feedback_type: DbFeedbackType;
      feedback_priority: DbFeedbackPriority;
      pilot_participant_role: DbPilotParticipantRole;
      pilot_participant_status: DbPilotParticipantStatus;
      pilot_checklist_status: DbPilotChecklistStatus;
      crm_contact_type: DbCrmContactType;
      crm_contact_status: DbCrmContactStatus;
      crm_lead_stage: DbCrmLeadStage;
      crm_activity_type: DbCrmActivityType;
      crm_task_status: DbCrmTaskStatus;
      operator_role: DbOperatorRole;
      task_status: DbTaskStatus;
      task_priority: DbTaskPriority;
      task_related_type: DbTaskRelatedType;
      roadmap_status: DbRoadmapStatus;
      roadmap_item_status: DbRoadmapItemStatus;
      project_result_type: DbProjectResultType;
      project_financial_metric_type: DbFinancialMetricType;
      organization_type: DbOrganizationType;
      organization_verification_status: DbOrganizationVerificationStatus;
      organization_member_role: DbOrganizationMemberRole;
      partnership_type: DbPartnershipType;
      partnership_status: DbPartnershipStatus;
      reputation_entity_type: DbReputationEntityType;
      reputation_verification_level: DbReputationVerificationLevel;
      review_target_type: DbReviewTargetType;
      entity_history_kind: DbEntityHistoryKind;
      trust_badge_key: DbTrustBadgeKey;
      system_log_level: DbSystemLogLevel;
      investor_interest_target_type: DbInvestorInterestTargetType;
      pilot_issue_severity: DbPilotIssueSeverity;
      pilot_issue_status: DbPilotIssueStatus;
      product_improvement_priority: DbProductImprovementPriority;
      product_improvement_status: DbProductImprovementStatus;
      product_improvement_source: DbProductImprovementSource;
      launch_wave_status: DbLaunchWaveStatus;
      launch_wave_type: DbLaunchWaveType;
      launch_wave_participant_status: DbLaunchWaveParticipantStatus;
      launch_goal_status: DbLaunchGoalStatus;
      launch_goal_metric_type: DbLaunchGoalMetricType;
      launch_decision_kind: DbLaunchDecisionKind;
      public_launch_decision_kind: DbPublicLaunchDecisionKind;
    };
  };
};
