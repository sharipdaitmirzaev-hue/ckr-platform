/**
 * Optional batch bridge: internal CKR entities + OI candidates → graph nodes.
 * No Matching Engine. Safe to call repeatedly (identity upsert).
 */

import type { BusinessGraphService } from "@/lib/business-graph/service";
import type { LiaOiCandidate } from "@/types/lia-oi";

export type GraphSyncSummary = {
  projectsUpserted: number;
  investmentsUpserted: number;
  oiUpserted: number;
  organizationsUpserted: number;
  errors: string[];
};

export async function syncProjectsToGraph(
  service: BusinessGraphService,
  projects: Array<{
    id: string;
    title: string;
    summary?: string | null;
    description?: string | null;
    region?: string | null;
    city?: string | null;
    status?: string | null;
  }>,
): Promise<number> {
  let n = 0;
  for (const p of projects) {
    await service.bridgeFromProject(p);
    n += 1;
  }
  return n;
}

export async function syncInvestmentOffersToGraph(
  service: BusinessGraphService,
  offers: Array<{
    id: string;
    title: string;
    description?: string | null;
    budgetMax?: number | null;
    regions?: string[] | null;
  }>,
): Promise<number> {
  let n = 0;
  for (const o of offers) {
    await service.bridgeFromInvestmentOffer(o);
    n += 1;
  }
  return n;
}

export async function syncOiCandidatesToGraph(
  service: BusinessGraphService,
  candidates: LiaOiCandidate[],
): Promise<number> {
  let n = 0;
  for (const c of candidates) {
    await service.bridgeFromOiCandidate(c);
    n += 1;
  }
  return n;
}

export async function syncOrganizationsToGraph(
  service: BusinessGraphService,
  orgs: Array<{
    id: string;
    name: string;
    description?: string | null;
    region?: string | null;
    city?: string | null;
    website?: string | null;
    inn?: string | null;
    ogrn?: string | null;
    industry?: string | null;
    verificationStatus?: string | null;
  }>,
): Promise<number> {
  let n = 0;
  for (const o of orgs) {
    await service.bridgeFromOrganization(o);
    n += 1;
  }
  return n;
}

/** Owner-triggered sync helper (no scheduler). */
export async function runOwnerGraphSync(params: {
  service: BusinessGraphService;
  projects?: Parameters<typeof syncProjectsToGraph>[1];
  investments?: Parameters<typeof syncInvestmentOffersToGraph>[1];
  oiCandidates?: LiaOiCandidate[];
  organizations?: Parameters<typeof syncOrganizationsToGraph>[1];
}): Promise<GraphSyncSummary> {
  const errors: string[] = [];
  let projectsUpserted = 0;
  let investmentsUpserted = 0;
  let oiUpserted = 0;
  let organizationsUpserted = 0;
  try {
    if (params.projects?.length) {
      projectsUpserted = await syncProjectsToGraph(
        params.service,
        params.projects,
      );
    }
  } catch (e) {
    errors.push(`projects:${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    if (params.investments?.length) {
      investmentsUpserted = await syncInvestmentOffersToGraph(
        params.service,
        params.investments,
      );
    }
  } catch (e) {
    errors.push(`investments:${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    if (params.oiCandidates?.length) {
      oiUpserted = await syncOiCandidatesToGraph(
        params.service,
        params.oiCandidates,
      );
    }
  } catch (e) {
    errors.push(`oi:${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    if (params.organizations?.length) {
      organizationsUpserted = await syncOrganizationsToGraph(
        params.service,
        params.organizations,
      );
    }
  } catch (e) {
    errors.push(
      `organizations:${e instanceof Error ? e.message : String(e)}`,
    );
  }
  return {
    projectsUpserted,
    investmentsUpserted,
    oiUpserted,
    organizationsUpserted,
    errors,
  };
}
