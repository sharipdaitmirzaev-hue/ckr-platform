/**
 * Контракт хранилища OI.
 *
 * Stage 2A: активен только InMemoryLiaOiStore (см. store.ts).
 * Stage 2B: SupabaseLiaOiStore — НЕ активировать до отдельного подтверждения.
 * SQL migrations Stage 1 не применять в 2A.
 */

import type {
  LiaOiAssignment,
  LiaOiCandidate,
  LiaOiFeedback,
  LiaOiHypothesis,
  LiaOiReport,
  LiaOiSearchRequest,
} from "@/types/lia-oi";

export type LiaOiStore = {
  upsertCandidates(items: LiaOiCandidate[]): void;
  listCandidates(filter?: {
    status?: string;
    savedOnly?: boolean;
    minOverall?: number;
  }): LiaOiCandidate[];
  getCandidate(id: string): LiaOiCandidate | null;
  saveSearchRequest(req: LiaOiSearchRequest): void;
  listSearchRequests(): LiaOiSearchRequest[];
  addFeedback(item: LiaOiFeedback): void;
  listFeedback(): LiaOiFeedback[];
  addAssignment(item: LiaOiAssignment): void;
  updateAssignment(item: LiaOiAssignment): void;
  listAssignments(): LiaOiAssignment[];
  addReport(item: LiaOiReport): void;
  listReports(): LiaOiReport[];
  setHypotheses(items: LiaOiHypothesis[]): void;
  listHypotheses(): LiaOiHypothesis[];
};

/**
 * Заготовка под Stage 2B. Не использовать в runtime.
 * @deprecated not implemented — stage 2B
 */
export type SupabaseLiaOiStore = LiaOiStore;
