import { mapBetaInviteRow, mapFeedbackRow } from "@/lib/beta/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { BetaInvite, Feedback } from "@/types";
import type { BetaInviteRow, FeedbackRow } from "@/types/database";

export async function listBetaInvites(): Promise<BetaInvite[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("beta_invites")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error || !data) return [];
    return (data as BetaInviteRow[]).map(mapBetaInviteRow);
  } catch {
    return [];
  }
}

export async function getInviteByCode(
  code: string,
): Promise<BetaInvite | null> {
  if (!hasSupabaseEnv() || !code.trim()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("beta_invites")
      .select("*")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();
    if (error || !data) return null;
    return mapBetaInviteRow(data as BetaInviteRow);
  } catch {
    return null;
  }
}

export async function listFeedback(limit = 50): Promise<Feedback[]> {
  if (!hasSupabaseEnv()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as FeedbackRow[]).map(mapFeedbackRow);
  } catch {
    return [];
  }
}
