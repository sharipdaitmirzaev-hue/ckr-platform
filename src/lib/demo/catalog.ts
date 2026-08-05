import { demoOwnerLabel } from "@/lib/demo/mode";
import {
  DEMO_OWNER_ID,
  demoExpertsSeed,
  demoInvestmentsSeed,
  demoOpportunitiesSeed,
  demoProjectsSeed,
} from "@/lib/demo/seed-data";
import type { ExpertWithUser } from "@/lib/experts/queries";
import type { InvestmentOfferWithOwner } from "@/lib/investments/queries";
import type { OpportunityWithOwner } from "@/lib/opportunities/queries";
import type { ProjectWithOwner } from "@/lib/projects/queries";

const now = "2026-03-01T10:00:00.000Z";

export function getDemoProjects(): ProjectWithOwner[] {
  return demoProjectsSeed.map((item) => ({
    id: item.id,
    ownerId: DEMO_OWNER_ID,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    description: item.description,
    category: item.category,
    region: item.region,
    investmentRequired: item.investmentRequired,
    currency: item.currency,
    stage: item.stage,
    status: "published",
    verificationStatus: "verified",
    coverUrl: null,
    createdAt: now,
    updatedAt: now,
    ownerName: demoOwnerLabel(),
    categoryName: item.categoryName,
  }));
}

export function getDemoOpportunities(): OpportunityWithOwner[] {
  return demoOpportunitiesSeed.map((item) => ({
    id: item.id,
    ownerId: DEMO_OWNER_ID,
    type: item.type,
    title: item.title,
    description: item.description,
    region: item.region,
    city: item.city,
    price: item.price,
    currency: item.currency,
    status: "published",
    verificationStatus: "verified",
    createdAt: now,
    updatedAt: now,
    ownerName: demoOwnerLabel(),
    typeName: item.typeName,
  }));
}

export function getDemoInvestments(): InvestmentOfferWithOwner[] {
  return demoInvestmentsSeed.map((item) => ({
    id: item.id,
    ownerId: DEMO_OWNER_ID,
    title: item.title,
    description: item.description,
    amountMin: item.amountMin,
    amountMax: item.amountMax,
    currency: item.currency,
    regions: [...item.regions],
    categories: [...item.categories],
    investmentType: item.investmentType,
    status: "published",
    verificationStatus: "verified",
    createdAt: now,
    updatedAt: now,
    ownerName: demoOwnerLabel(),
  }));
}

export function getDemoExperts(): ExpertWithUser[] {
  return demoExpertsSeed.map((item) => ({
    id: item.id,
    userId: item.userId,
    specialization: item.specialization,
    headline: item.headline,
    description: item.description,
    experienceYears: item.experienceYears,
    services: item.services,
    region: item.region,
    status: "published",
    verificationStatus: "verified",
    createdAt: now,
    updatedAt: now,
    fullName: item.fullName,
    companyName: "Демо-эксперт ЦКР",
  }));
}

export function getDemoProjectById(id: string): ProjectWithOwner | null {
  return getDemoProjects().find((item) => item.id === id) ?? null;
}

export function getDemoOpportunityById(
  id: string,
): OpportunityWithOwner | null {
  return getDemoOpportunities().find((item) => item.id === id) ?? null;
}

export function getDemoInvestmentById(
  id: string,
): InvestmentOfferWithOwner | null {
  return getDemoInvestments().find((item) => item.id === id) ?? null;
}

export function getDemoExpertById(id: string): ExpertWithUser | null {
  return getDemoExperts().find((item) => item.id === id) ?? null;
}
