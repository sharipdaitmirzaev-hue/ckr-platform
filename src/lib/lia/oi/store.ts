/**
 * Compatibility facade over store/ (Stage 2B).
 * Prefer: `import { getOiStore } from "@/lib/lia/oi/store"` then await methods.
 */

import {
  getOiStore,
  isMemorySeeded,
  markMemorySeeded,
  resetMemoryStoreForTests,
  setOiStoreForTests,
} from "@/lib/lia/oi/store/index";
import type {
  LiaOiAssignment,
  LiaOiCandidate,
  LiaOiCandidateListFilter,
  LiaOiFeedback,
  LiaOiHypothesis,
  LiaOiReport,
  LiaOiSearchRequest,
} from "@/types/lia-oi";

export {
  getOiStore,
  setOiStoreForTests,
  resetMemoryStoreForTests,
  InMemoryLiaOiStore,
  SupabaseLiaOiStore,
  resolveOiStoreMode,
  describeOiStoreMode,
  LiaOiStoreWriteError,
} from "@/lib/lia/oi/store/index";

/** @deprecated use getOiStore(); kept for seed flag in pipeline */
export function getLiaOiStore(): { seeded: boolean } {
  return {
    get seeded() {
      return isMemorySeeded();
    },
    set seeded(v: boolean) {
      if (v) markMemorySeeded();
    },
  };
}

export function resetLiaOiStoreForTests() {
  resetMemoryStoreForTests();
  setOiStoreForTests(null);
}

export async function upsertCandidates(
  items: LiaOiCandidate[],
  options?: {
    searchRunId?: string;
    reason?: "rediscovery" | "owner_update";
  },
) {
  return getOiStore().upsertCandidates(items, options);
}

export async function listCandidates(filter?: LiaOiCandidateListFilter) {
  const page = await getOiStore().listCandidates(filter);
  return page.items;
}

export async function listCandidatesPage(filter?: LiaOiCandidateListFilter) {
  return getOiStore().listCandidates(filter);
}

export async function getCandidate(id: string) {
  return getOiStore().getCandidate(id);
}

export async function saveSearchRequest(req: LiaOiSearchRequest) {
  return getOiStore().saveSearchRequest(req);
}

export async function listSearchRequests() {
  const page = await getOiStore().listSearchRequests({ pageSize: 100 });
  return page.items;
}

export async function getSearchRequest(id: string) {
  return getOiStore().getSearchRequest(id);
}

export async function listCandidatesForSearchRun(searchRunId: string) {
  return getOiStore().listCandidatesForSearchRun(searchRunId);
}

export async function addFeedback(item: LiaOiFeedback) {
  return getOiStore().addFeedback(item);
}

export async function listFeedback() {
  const page = await getOiStore().listFeedback({ pageSize: 200 });
  return page.items;
}

export async function addAssignment(item: LiaOiAssignment) {
  return getOiStore().addAssignment(item);
}

export async function updateAssignment(item: LiaOiAssignment) {
  return getOiStore().updateAssignment(item);
}

export async function listAssignments() {
  const page = await getOiStore().listAssignments({ pageSize: 200 });
  return page.items;
}

export async function addReport(item: LiaOiReport) {
  return getOiStore().addReport(item);
}

export async function listReports() {
  const page = await getOiStore().listReports({ pageSize: 200 });
  return page.items;
}

export async function setHypotheses(items: LiaOiHypothesis[]) {
  return getOiStore().setHypotheses(items);
}

export async function listHypotheses() {
  return getOiStore().listHypotheses();
}

export async function listOpportunityEvents(opportunityId: string) {
  return getOiStore().listOpportunityEvents(opportunityId);
}

export async function listOpportunityChanges(opportunityId: string) {
  return getOiStore().listOpportunityChanges(opportunityId);
}

export type { LiaOiStore } from "@/lib/lia/oi/store-types";
