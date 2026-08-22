/**
 * Контракт хранилища OI (Stage 2B).
 *
 * InMemoryLiaOiStore — default (LIA_OI_STORE=memory).
 * SupabaseLiaOiStore — LIA_OI_STORE=supabase (требует применённых migrations + secret key).
 */

import type {
  LiaOiAssignment,
  LiaOiCandidate,
  LiaOiCandidateListFilter,
  LiaOiFeedback,
  LiaOiHypothesis,
  LiaOiOpportunityChange,
  LiaOiOpportunityEvent,
  LiaOiPaginated,
  LiaOiReport,
  LiaOiSearchRequest,
} from "@/types/lia-oi";

export type LiaOiUpsertResult = {
  candidates: LiaOiCandidate[];
  createdIds: string[];
  updatedIds: string[];
  changes: LiaOiOpportunityChange[];
};

export type LiaOiStore = {
  readonly kind: "memory" | "supabase";

  upsertCandidates(
    items: LiaOiCandidate[],
    options?: {
      searchRunId?: string;
      /** owner_update — не писать REDISCOVERY в timeline */
      reason?: "rediscovery" | "owner_update";
    },
  ): Promise<LiaOiUpsertResult>;

  listCandidates(
    filter?: LiaOiCandidateListFilter,
  ): Promise<LiaOiPaginated<LiaOiCandidate>>;

  getCandidate(id: string): Promise<LiaOiCandidate | null>;

  getCandidateByFingerprint(
    fingerprint: string,
  ): Promise<LiaOiCandidate | null>;

  saveSearchRequest(req: LiaOiSearchRequest): Promise<void>;

  listSearchRequests(options?: {
    page?: number;
    pageSize?: number;
  }): Promise<LiaOiPaginated<LiaOiSearchRequest>>;

  getSearchRequest(id: string): Promise<LiaOiSearchRequest | null>;

  listCandidatesForSearchRun(searchRunId: string): Promise<LiaOiCandidate[]>;

  addFeedback(item: LiaOiFeedback): Promise<void>;

  listFeedback(options?: {
    candidateId?: string;
    page?: number;
    pageSize?: number;
  }): Promise<LiaOiPaginated<LiaOiFeedback>>;

  addAssignment(item: LiaOiAssignment): Promise<void>;

  updateAssignment(item: LiaOiAssignment): Promise<void>;

  listAssignments(options?: {
    page?: number;
    pageSize?: number;
  }): Promise<LiaOiPaginated<LiaOiAssignment>>;

  addReport(item: LiaOiReport): Promise<void>;

  listReports(options?: {
    page?: number;
    pageSize?: number;
  }): Promise<LiaOiPaginated<LiaOiReport>>;

  setHypotheses(items: LiaOiHypothesis[]): Promise<void>;

  listHypotheses(): Promise<LiaOiHypothesis[]>;

  listOpportunityEvents(
    opportunityId: string,
  ): Promise<LiaOiOpportunityEvent[]>;

  listOpportunityChanges(
    opportunityId: string,
  ): Promise<LiaOiOpportunityChange[]>;
};

export class LiaOiStoreWriteError extends Error {
  readonly code = "LIA_OI_STORE_WRITE_FAILED";
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "LiaOiStoreWriteError";
  }
}

export function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 20,
): LiaOiPaginated<T> {
  const p = Math.max(1, page);
  const size = Math.min(100, Math.max(1, pageSize));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const start = (p - 1) * size;
  return {
    items: items.slice(start, start + size),
    total,
    page: p,
    pageSize: size,
    totalPages,
  };
}
