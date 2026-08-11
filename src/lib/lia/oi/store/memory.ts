/**
 * InMemoryLiaOiStore — default persistence for Stage 1–2A and Stage 2B when
 * LIA_OI_STORE=memory (or supabase not configured).
 */

import {
  buildOpportunityFingerprint,
  diffTrackedFields,
  mergeRediscovery,
  OWNER_LOCKED_STATUSES,
} from "@/lib/lia/oi/fingerprint";
import { oiId } from "@/lib/lia/oi/id";
import { canonicalUrl } from "@/lib/lia/oi/normalize";
import {
  paginate,
  type LiaOiStore,
  type LiaOiUpsertResult,
} from "@/lib/lia/oi/store-types";
import type {
  LiaOiAssignment,
  LiaOiCandidate,
  LiaOiCandidateListFilter,
  LiaOiFeedback,
  LiaOiHypothesis,
  LiaOiOpportunityChange,
  LiaOiOpportunityEvent,
  LiaOiReport,
  LiaOiSearchRequest,
} from "@/types/lia-oi";

type MemoryState = {
  candidates: Map<string, LiaOiCandidate>;
  byFingerprint: Map<string, string>;
  searchRequests: Map<string, LiaOiSearchRequest>;
  runLinks: Map<string, string[]>;
  feedback: LiaOiFeedback[];
  assignments: LiaOiAssignment[];
  reports: LiaOiReport[];
  hypotheses: LiaOiHypothesis[];
  changes: LiaOiOpportunityChange[];
  events: LiaOiOpportunityEvent[];
  seeded: boolean;
};

const globalForOi = globalThis as unknown as {
  __ckrLiaOiMemoryStore?: MemoryState;
};

function createState(): MemoryState {
  return {
    candidates: new Map(),
    byFingerprint: new Map(),
    searchRequests: new Map(),
    runLinks: new Map(),
    feedback: [],
    assignments: [],
    reports: [],
    hypotheses: [],
    changes: [],
    events: [],
    seeded: false,
  };
}

export function getMemoryState(): MemoryState {
  if (!globalForOi.__ckrLiaOiMemoryStore) {
    globalForOi.__ckrLiaOiMemoryStore = createState();
  }
  return globalForOi.__ckrLiaOiMemoryStore;
}

export function resetMemoryStoreForTests() {
  globalForOi.__ckrLiaOiMemoryStore = createState();
}

function ensureIdentity(item: LiaOiCandidate): LiaOiCandidate {
  const canon = item.canonicalUrl || (item.sources[0]?.url
    ? canonicalUrl(item.sources[0].url)
    : "");
  const fingerprint =
    item.fingerprint ||
    buildOpportunityFingerprint({ ...item, canonicalUrl: canon });
  return {
    ...item,
    canonicalUrl: canon || item.canonicalUrl,
    fingerprint,
    ownerLocked:
      item.ownerLocked || OWNER_LOCKED_STATUSES.has(item.status) || false,
  };
}

function filterCandidates(
  items: LiaOiCandidate[],
  filter?: LiaOiCandidateListFilter,
): LiaOiCandidate[] {
  let out = items;
  if (filter?.status) out = out.filter((c) => c.status === filter.status);
  if (filter?.bucket) {
    out = out.filter((c) => c.resultBucket === filter.bucket);
  }
  if (filter?.region) {
    out = out.filter((c) =>
      (c.region || "").toLowerCase().includes(filter.region!.toLowerCase()),
    );
  }
  if (filter?.industry) {
    out = out.filter((c) =>
      (c.industry || "").toLowerCase().includes(filter.industry!.toLowerCase()),
    );
  }
  if (filter?.budgetFit) {
    out = out.filter((c) => c.budgetFit === filter.budgetFit);
  }
  if (filter?.savedOnly) {
    out = out.filter((c) =>
      ["SAVED", "INTERESTING", "DEEP_RESEARCH", "PROJECT_CREATED"].includes(
        c.status,
      ),
    );
  }
  if (filter?.rejectedOnly) {
    out = out.filter((c) => c.status === "REJECTED");
  }
  if (filter?.minOverall != null) {
    out = out.filter((c) => c.score.overall >= filter.minOverall!);
  }
  if (filter?.minConfidence != null) {
    out = out.filter((c) => c.score.confidence >= filter.minConfidence!);
  }
  if (filter?.source) {
    const s = filter.source.toLowerCase();
    out = out.filter((c) =>
      c.sources.some(
        (x) =>
          x.name.toLowerCase().includes(s) || x.url.toLowerCase().includes(s),
      ),
    );
  }
  if (filter?.q) {
    const q = filter.q.toLowerCase();
    out = out.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }
  if (filter?.dateFrom) {
    out = out.filter((c) => c.firstSeenAt >= filter.dateFrom!);
  }
  if (filter?.dateTo) {
    out = out.filter((c) => c.firstSeenAt <= filter.dateTo!);
  }
  return out.sort((a, b) => b.score.overall - a.score.overall);
}

export class InMemoryLiaOiStore implements LiaOiStore {
  readonly kind = "memory" as const;

  async upsertCandidates(
    items: LiaOiCandidate[],
    options?: {
      searchRunId?: string;
      reason?: "rediscovery" | "owner_update";
    },
  ): Promise<LiaOiUpsertResult> {
    const state = getMemoryState();
    const createdIds: string[] = [];
    const updatedIds: string[] = [];
    const changes: LiaOiOpportunityChange[] = [];
    const out: LiaOiCandidate[] = [];
    const isOwnerUpdate = options?.reason === "owner_update";

    for (const raw of items) {
      const incoming = ensureIdentity(raw);
      const existingId = incoming.fingerprint
        ? state.byFingerprint.get(incoming.fingerprint)
        : undefined;
      const existing = existingId
        ? state.candidates.get(existingId)
        : state.candidates.get(incoming.id);

      if (existing) {
        const merged = mergeRediscovery(existing, {
          ...incoming,
          id: existing.id,
        });
        const diffs = diffTrackedFields(existing, merged);
        for (const d of diffs) {
          const change: LiaOiOpportunityChange = {
            id: oiId("chg"),
            opportunityId: existing.id,
            fieldName: d.field,
            oldValue: d.oldValue,
            newValue: d.newValue,
            changeKind:
              d.field === "status"
                ? isOwnerUpdate
                  ? "OWNER_DECISION"
                  : "STATUS_CHANGE"
                : "FIELD_UPDATE",
            sourceRunId: options?.searchRunId ?? null,
            createdAt: new Date().toISOString(),
          };
          state.changes.unshift(change);
          changes.push(change);
        }
        if (!isOwnerUpdate) {
          state.events.unshift({
            id: oiId("evt"),
            opportunityId: existing.id,
            eventType: "REDISCOVERY",
            title: "Найдена повторно",
            detail:
              diffs.length > 0
                ? `Изменения: ${diffs.map((d) => d.field).join(", ")}`
                : "Без существенных изменений полей",
            searchRunId: options?.searchRunId ?? null,
            createdAt: new Date().toISOString(),
          });
        }
        state.candidates.set(existing.id, merged);
        if (merged.fingerprint) {
          state.byFingerprint.set(merged.fingerprint, existing.id);
        }
        updatedIds.push(existing.id);
        out.push(merged);
      } else {
        const created = {
          ...incoming,
          firstSeenAt: incoming.firstSeenAt || new Date().toISOString(),
        };
        state.candidates.set(created.id, created);
        if (created.fingerprint) {
          state.byFingerprint.set(created.fingerprint, created.id);
        }
        state.events.unshift({
          id: oiId("evt"),
          opportunityId: created.id,
          eventType: "FIRST_SEEN",
          title: "Впервые найдена",
          detail: created.title,
          searchRunId: options?.searchRunId ?? null,
          createdAt: created.firstSeenAt,
        });
        createdIds.push(created.id);
        out.push(created);
      }
    }

    if (options?.searchRunId) {
      const prev = state.runLinks.get(options.searchRunId) ?? [];
      state.runLinks.set(
        options.searchRunId,
        Array.from(new Set([...prev, ...out.map((c) => c.id)])),
      );
    }

    return { candidates: out, createdIds, updatedIds, changes };
  }

  async listCandidates(
    filter?: LiaOiCandidateListFilter,
  ) {
    const items = filterCandidates(
      Array.from(getMemoryState().candidates.values()),
      filter,
    );
    return paginate(items, filter?.page ?? 1, filter?.pageSize ?? 50);
  }

  async getCandidate(id: string) {
    return getMemoryState().candidates.get(id) ?? null;
  }

  async getCandidateByFingerprint(fingerprint: string) {
    const id = getMemoryState().byFingerprint.get(fingerprint);
    if (!id) return null;
    return getMemoryState().candidates.get(id) ?? null;
  }

  async saveSearchRequest(req: LiaOiSearchRequest) {
    getMemoryState().searchRequests.set(req.id, req);
  }

  async listSearchRequests(options?: { page?: number; pageSize?: number }) {
    const items = Array.from(getMemoryState().searchRequests.values()).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    );
    return paginate(items, options?.page ?? 1, options?.pageSize ?? 20);
  }

  async getSearchRequest(id: string) {
    return getMemoryState().searchRequests.get(id) ?? null;
  }

  async listCandidatesForSearchRun(searchRunId: string) {
    const state = getMemoryState();
    const ids = state.runLinks.get(searchRunId) ?? [];
    const fromReq = state.searchRequests.get(searchRunId)?.candidateIds ?? [];
    const all = Array.from(new Set([...ids, ...fromReq]));
    return all
      .map((id) => state.candidates.get(id))
      .filter((c): c is LiaOiCandidate => Boolean(c));
  }

  async addFeedback(item: LiaOiFeedback) {
    const state = getMemoryState();
    state.feedback.unshift(item);
    const cand = state.candidates.get(item.candidateId);
    if (cand) {
      state.events.unshift({
        id: oiId("evt"),
        opportunityId: item.candidateId,
        eventType: "OWNER_FEEDBACK",
        title: `Владелец: ${item.event}`,
        detail: item.reason ?? null,
        actorUserId: item.createdBy,
        createdAt: item.createdAt,
      });
      if (OWNER_LOCKED_STATUSES.has(cand.status)) {
        state.candidates.set(item.candidateId, {
          ...cand,
          ownerLocked: true,
          ownerStatusSetAt: item.createdAt,
          ownerStatusSetBy: item.createdBy,
        });
      }
    }
  }

  async listFeedback(options?: {
    candidateId?: string;
    page?: number;
    pageSize?: number;
  }) {
    let items = getMemoryState().feedback;
    if (options?.candidateId) {
      items = items.filter((f) => f.candidateId === options.candidateId);
    }
    return paginate(items, options?.page ?? 1, options?.pageSize ?? 50);
  }

  async addAssignment(item: LiaOiAssignment) {
    const state = getMemoryState();
    state.assignments.unshift(item);
    state.events.unshift({
      id: oiId("evt"),
      opportunityId: item.candidateId,
      eventType: "ASSIGNMENT",
      title: `Поручение: ${item.kind}`,
      detail: item.instruction,
      actorUserId: item.createdBy,
      createdAt: item.createdAt,
    });
  }

  async updateAssignment(item: LiaOiAssignment) {
    const state = getMemoryState();
    const idx = state.assignments.findIndex((a) => a.id === item.id);
    if (idx >= 0) state.assignments[idx] = item;
    else state.assignments.unshift(item);
  }

  async listAssignments(options?: { page?: number; pageSize?: number }) {
    return paginate(
      getMemoryState().assignments,
      options?.page ?? 1,
      options?.pageSize ?? 50,
    );
  }

  async addReport(item: LiaOiReport) {
    getMemoryState().reports.unshift(item);
  }

  async listReports(options?: { page?: number; pageSize?: number }) {
    return paginate(
      getMemoryState().reports,
      options?.page ?? 1,
      options?.pageSize ?? 50,
    );
  }

  async setHypotheses(items: LiaOiHypothesis[]) {
    getMemoryState().hypotheses = items;
  }

  async listHypotheses() {
    return getMemoryState().hypotheses;
  }

  async listOpportunityEvents(opportunityId: string) {
    return getMemoryState().events.filter(
      (e) => e.opportunityId === opportunityId,
    );
  }

  async listOpportunityChanges(opportunityId: string) {
    return getMemoryState().changes.filter(
      (c) => c.opportunityId === opportunityId,
    );
  }
}

export function isMemorySeeded(): boolean {
  return getMemoryState().seeded;
}

export function markMemorySeeded() {
  getMemoryState().seeded = true;
}
