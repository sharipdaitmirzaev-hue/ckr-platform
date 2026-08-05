import {
  mapLiaMessageRow,
  mapLiaSessionRow,
  type LiaMessageRow,
  type LiaSessionRow,
} from "@/lib/lia/mappers";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { LiaMessage, LiaSession } from "@/types/lia";

export async function listLiaSessions(userId: string): Promise<LiaSession[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lia_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data.map((row) => mapLiaSessionRow(row as LiaSessionRow));
}

export async function getLiaSession(
  sessionId: string,
  userId: string,
): Promise<LiaSession | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lia_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapLiaSessionRow(data as LiaSessionRow);
}

export async function listLiaMessages(
  sessionId: string,
): Promise<LiaMessage[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lia_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error || !data) return [];
  return data.map((row) => mapLiaMessageRow(row as LiaMessageRow));
}

export async function createLiaSession(input: {
  userId: string;
  title: string;
}): Promise<LiaSession | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lia_sessions")
    .insert({
      user_id: input.userId,
      title: input.title,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapLiaSessionRow(data as LiaSessionRow);
}

export async function touchLiaSession(sessionId: string, title?: string) {
  if (!hasSupabaseEnv()) return;
  const supabase = createClient();
  await supabase
    .from("lia_sessions")
    .update({
      ...(title ? { title } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
}

export async function insertLiaMessage(input: {
  sessionId: string;
  role: LiaMessage["role"];
  content: string;
  metadata?: LiaMessage["metadata"];
}): Promise<LiaMessage | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lia_messages")
    .insert({
      session_id: input.sessionId,
      role: input.role,
      content: input.content,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapLiaMessageRow(data as LiaMessageRow);
}
