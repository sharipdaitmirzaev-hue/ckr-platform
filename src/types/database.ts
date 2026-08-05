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

export type ProfileRow = {
  id: string;
  full_name: string;
  company_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
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
  link: string | null;
  application_id: string | null;
  read_at: string | null;
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
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          city?: string | null;
          region?: string | null;
        };
        Update: Partial<Omit<ProfileRow, "id" | "created_at">>;
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
          link?: string | null;
          application_id?: string | null;
          read_at?: string | null;
        };
        Update: Partial<Omit<NotificationRow, "id" | "user_id" | "created_at">>;
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
        };
        Update: Partial<
          Omit<InvestmentOfferRow, "id" | "owner_id" | "created_at">
        >;
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
    };
  };
};
