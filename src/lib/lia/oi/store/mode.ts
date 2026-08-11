/**
 * LIA_OI_STORE=memory|supabase
 *
 * Default: memory.
 * supabase: only when explicitly selected AND secret key present.
 * If supabase selected but not configured → throw (no silent fallback).
 */

import { canUseSupabaseOiStore } from "@/lib/lia/oi/store/supabase-client";

export type LiaOiStoreMode = "memory" | "supabase";

export function resolveOiStoreMode(): LiaOiStoreMode {
  const raw = (process.env.LIA_OI_STORE || "memory").trim().toLowerCase();
  if (raw === "supabase") {
    if (!canUseSupabaseOiStore()) {
      throw new Error(
        "LIA_OI_STORE=supabase, но не задан серверный ключ Supabase (SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY). Persistence не активирован — исправьте env или верните LIA_OI_STORE=memory.",
      );
    }
    return "supabase";
  }
  return "memory";
}

export function describeOiStoreMode(): {
  mode: LiaOiStoreMode | "misconfigured";
  label: string;
} {
  const raw = (process.env.LIA_OI_STORE || "memory").trim().toLowerCase();
  if (raw === "supabase") {
    if (!canUseSupabaseOiStore()) {
      return {
        mode: "misconfigured",
        label: "SUPABASE (не настроен — запись невозможна)",
      };
    }
    return { mode: "supabase", label: "SUPABASE" };
  }
  return { mode: "memory", label: "MEMORY" };
}
