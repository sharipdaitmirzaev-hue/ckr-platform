import type {
  LiaOiAssignment,
  LiaOiCandidate,
  LiaOiFeedback,
  LiaOiHypothesis,
  LiaOiReport,
  LiaOiSearchRequest,
} from "@/types/lia-oi";

/**
 * In-memory store этапа 1 (без production DB).
 * Когда миграции будут применены — можно заменить на Supabase-репозиторий
 * с тем же интерфейсом.
 */
type LiaOiStoreState = {
  candidates: Map<string, LiaOiCandidate>;
  searchRequests: Map<string, LiaOiSearchRequest>;
  feedback: LiaOiFeedback[];
  assignments: LiaOiAssignment[];
  reports: LiaOiReport[];
  hypotheses: LiaOiHypothesis[];
  seeded: boolean;
};

const globalForOi = globalThis as unknown as {
  __ckrLiaOiStore?: LiaOiStoreState;
};

function createState(): LiaOiStoreState {
  return {
    candidates: new Map(),
    searchRequests: new Map(),
    feedback: [],
    assignments: [],
    reports: [],
    hypotheses: [],
    seeded: false,
  };
}

export function getLiaOiStore(): LiaOiStoreState {
  if (!globalForOi.__ckrLiaOiStore) {
    globalForOi.__ckrLiaOiStore = createState();
  }
  return globalForOi.__ckrLiaOiStore;
}

/** Только для тестов. */
export function resetLiaOiStoreForTests() {
  globalForOi.__ckrLiaOiStore = createState();
}

export function upsertCandidates(items: LiaOiCandidate[]) {
  const store = getLiaOiStore();
  for (const item of items) {
    const prev = store.candidates.get(item.id);
    store.candidates.set(item.id, prev ? { ...prev, ...item } : item);
  }
}

export function listCandidates(filter?: {
  status?: string;
  savedOnly?: boolean;
  minOverall?: number;
}): LiaOiCandidate[] {
  const store = getLiaOiStore();
  let items = Array.from(store.candidates.values());
  if (filter?.status) {
    items = items.filter((c) => c.status === filter.status);
  }
  if (filter?.savedOnly) {
    items = items.filter((c) =>
      ["SAVED", "INTERESTING", "DEEP_RESEARCH", "PROJECT_CREATED"].includes(
        c.status,
      ),
    );
  }
  if (filter?.minOverall != null) {
    items = items.filter((c) => c.score.overall >= filter.minOverall!);
  }
  return items.sort((a, b) => b.score.overall - a.score.overall);
}

export function getCandidate(id: string): LiaOiCandidate | null {
  return getLiaOiStore().candidates.get(id) ?? null;
}

export function saveSearchRequest(req: LiaOiSearchRequest) {
  getLiaOiStore().searchRequests.set(req.id, req);
}

export function listSearchRequests(): LiaOiSearchRequest[] {
  return Array.from(getLiaOiStore().searchRequests.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function addFeedback(item: LiaOiFeedback) {
  getLiaOiStore().feedback.unshift(item);
}

export function listFeedback(): LiaOiFeedback[] {
  return getLiaOiStore().feedback;
}

export function addAssignment(item: LiaOiAssignment) {
  getLiaOiStore().assignments.unshift(item);
}

export function updateAssignment(item: LiaOiAssignment) {
  const store = getLiaOiStore();
  const idx = store.assignments.findIndex((a) => a.id === item.id);
  if (idx >= 0) store.assignments[idx] = item;
  else store.assignments.unshift(item);
}

export function listAssignments(): LiaOiAssignment[] {
  return getLiaOiStore().assignments;
}

export function addReport(item: LiaOiReport) {
  getLiaOiStore().reports.unshift(item);
}

export function listReports(): LiaOiReport[] {
  return getLiaOiStore().reports;
}

export function setHypotheses(items: LiaOiHypothesis[]) {
  getLiaOiStore().hypotheses = items;
}

export function listHypotheses(): LiaOiHypothesis[] {
  return getLiaOiStore().hypotheses;
}
