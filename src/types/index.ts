/**
 * Базовые доменные типы ЦКР.
 * Расширяются по мере подключения Supabase.
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

export type Project = {
  id: string;
  title: string;
  summary: string;
  region: string;
  investmentRequired: number;
  currency: string;
  stage: ProjectStage;
  status: PublishStatus;
  seekingPartners: boolean;
};

export type Opportunity = {
  id: string;
  title: string;
  summary: string;
  type: OpportunityType;
  region: string;
  status: PublishStatus;
};

export type Solution = {
  id: string;
  title: string;
  summary: string;
  types: SolutionType[];
  status: PublishStatus;
};
