import type { NeedProfile, NeedProfileEvent } from "@/types/need-profile";

export type NeedProfileMemoryStore = {
  needs: Map<string, NeedProfile>;
  events: NeedProfileEvent[];
};

const g = globalThis as unknown as {
  __ckrNeedProfileStore?: NeedProfileMemoryStore;
};

function empty(): NeedProfileMemoryStore {
  return { needs: new Map(), events: [] };
}

export function getNeedProfileMemoryStore(): NeedProfileMemoryStore {
  if (!g.__ckrNeedProfileStore) g.__ckrNeedProfileStore = empty();
  return g.__ckrNeedProfileStore;
}

export function resetNeedProfileMemoryStore(): void {
  g.__ckrNeedProfileStore = empty();
}
