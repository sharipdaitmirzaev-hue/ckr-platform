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
  | "note";

export type DealRow = {
  id: string;
  project_id: string;
  initiator_id: string;
  partner_id: string | null;
  deal_type: DbDealType;
  amount: number | string | null;
  currency: string;
  status: DbDealStatus;
  description: string;
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
      deals: {
        Row: DealRow;
        Insert: {
          id?: string;
          project_id: string;
          initiator_id: string;
          partner_id?: string | null;
          deal_type?: DbDealType;
          amount?: number | null;
          currency?: string;
          status?: DbDealStatus;
          description?: string;
        };
        Update: Partial<{
          partner_id: string | null;
          deal_type: DbDealType;
          amount: number | null;
          currency: string;
          status: DbDealStatus;
          description: string;
        }>;
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
    };
  };
};
