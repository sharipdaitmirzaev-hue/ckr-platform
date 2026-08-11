/**
 * OI store facade — единственная точка выбора memory | supabase.
 */

import { InMemoryLiaOiStore } from "@/lib/lia/oi/store/memory";
import { resolveOiStoreMode } from "@/lib/lia/oi/store/mode";
import { SupabaseLiaOiStore } from "@/lib/lia/oi/store/supabase";
import type { LiaOiStore } from "@/lib/lia/oi/store-types";

let cached: LiaOiStore | null = null;
let cachedMode: string | null = null;

export function getOiStore(): LiaOiStore {
  const mode = resolveOiStoreMode();
  if (!cached || cachedMode !== mode) {
    cached =
      mode === "supabase" ? new SupabaseLiaOiStore() : new InMemoryLiaOiStore();
    cachedMode = mode;
  }
  return cached;
}

/** Tests: inject store instance. */
export function setOiStoreForTests(store: LiaOiStore | null) {
  cached = store;
  cachedMode = store?.kind ?? null;
}

export {
  InMemoryLiaOiStore,
  resetMemoryStoreForTests,
  isMemorySeeded,
  markMemorySeeded,
} from "@/lib/lia/oi/store/memory";
export { SupabaseLiaOiStore } from "@/lib/lia/oi/store/supabase";
export { resolveOiStoreMode, describeOiStoreMode } from "@/lib/lia/oi/store/mode";
export type { LiaOiStore, LiaOiUpsertResult } from "@/lib/lia/oi/store-types";
export { LiaOiStoreWriteError, paginate } from "@/lib/lia/oi/store-types";
