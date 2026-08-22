/**
 * Stage 4F — Company Intelligence types (organizations as SoT).
 */

import type { Organization } from "@/types";
import type { NeedProfile } from "@/types/need-profile";

export type CompanyVisibilityTier = "PUBLIC" | "CKR_ONLY" | "OWNER_ONLY";

export type CompanyViewerRole = "anon" | "member" | "owner_manager" | "admin";

export type CompanyQualityFlags = {
  legalIdentityKnown: boolean;
  regionKnown: boolean;
  industryKnown: boolean;
  websiteKnown: boolean;
  verifiedSource: boolean;
  hasActiveNeeds: boolean;
  hasPublicOffers: boolean;
  hasGraphLinks: boolean;
  score: number;
  labelsRu: string[];
};

export type CompanyTimelineItem = {
  id: string;
  at: string;
  eventType: string;
  title: string;
  detail: string;
  visibility: CompanyVisibilityTier;
};

export type CompanyLinkedBundle = {
  projects: Array<{ id: string; title: string; region?: string | null }>;
  opportunities: Array<{ id: string; title: string; type?: string | null }>;
  investments: Array<{ id: string; title: string }>;
  needs: NeedProfile[];
  members: Array<{ userId: string; role: string; fullName?: string }>;
  graphNodeId?: string | null;
  graphEdges: Array<{
    id: string;
    relationshipType: string;
    direction: "out" | "in";
    otherTitle: string;
  }>;
};

export type CompanyDemandSignalSummary = {
  confirmedDemand: number;
  potentialBuyer: number;
  noteRu: string;
};

export type LiaCompanyEnrichmentDraft = {
  generatedAt: string;
  queries: string[];
  findings: Array<{
    field: string;
    value: string;
    provenance: "FACT" | "INFERENCE" | "UNKNOWN";
    sourceUrl?: string;
    note?: string;
  }>;
  autoPublish: false;
  status: "DRAFT";
};

export type CompanyIntelligenceCard = {
  organization: Organization;
  viewerRole: CompanyViewerRole;
  publicView: {
    name: string;
    legalName: string | null;
    inn: string | null;
    ogrn: string | null;
    legalForm: string | null;
    status: string;
    industry: string | null;
    subindustry: string | null;
    region: string | null;
    city: string | null;
    website: string | null;
    publicEmail: string | null;
    publicPhone: string | null;
    description: string | null;
    productsServices: string | null;
    offersSummary: string | null;
    seeksSummary: string | null;
    sourceLabel: string | null;
    sourceUrl: string | null;
    verificationStatus: string;
  };
  /** CKR_ONLY / OWNER_ONLY — omitted for anon */
  internal?: {
    ownerNotes?: string;
    liaDraft?: LiaCompanyEnrichmentDraft | null;
    quality: CompanyQualityFlags;
    demandSignals: CompanyDemandSignalSummary;
  };
  linked: CompanyLinkedBundle;
  timeline: CompanyTimelineItem[];
  sections: string[];
};

export type CompanyCatalogFilter = {
  region?: string;
  industry?: string;
  offers?: string;
  seeks?: string;
  verification?: string;
  q?: string;
  listedOnly?: boolean;
};
