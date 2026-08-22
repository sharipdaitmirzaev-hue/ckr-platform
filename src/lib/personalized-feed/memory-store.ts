import type { FeedCandidate, FeedFeedbackEvent } from "@/types/personalized-feed";

type Store = {
  candidates: FeedCandidate[];
  feedback: FeedFeedbackEvent[];
};

const g = globalThis as unknown as { __ckrFeedStore?: Store };

function store(): Store {
  if (!g.__ckrFeedStore) {
    g.__ckrFeedStore = { candidates: [], feedback: [] };
  }
  return g.__ckrFeedStore;
}

export function resetPersonalizedFeedMemoryStore(): void {
  g.__ckrFeedStore = { candidates: [], feedback: [] };
}

export function getPersonalizedFeedMemoryStore(): Store {
  return store();
}

export function setMemoryCandidates(candidates: FeedCandidate[]): void {
  store().candidates = candidates.slice();
}
