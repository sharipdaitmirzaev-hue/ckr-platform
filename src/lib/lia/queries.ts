import {
  mapLiaAnalysisRow,
  mapLiaMessageRow,
  mapLiaSessionRow,
  type LiaMessageRow,
  type LiaSessionRow,
} from "@/lib/lia/mappers";
import { flattenInternalMatches } from "@/lib/lia/analysis";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { LiaAnalysisRow } from "@/types/database";
import type {
  LiaAnalysis,
  LiaMessage,
  LiaSession,
  SolutionReport,
} from "@/types/lia";

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

export async function listLiaAnalyses(
  userId: string,
  limit = 20,
): Promise<LiaAnalysis[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lia_analyses")
    .select("*, projects:project_id ( title )")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const projects = row.projects as
      | { title: string | null }
      | { title: string | null }[]
      | null;
    const project = Array.isArray(projects) ? projects[0] : projects;
    const { projects: _p, ...rest } = row as typeof row & {
      projects?: unknown;
    };
    void _p;
    return mapLiaAnalysisRow(rest as LiaAnalysisRow, project?.title ?? null);
  });
}

export async function listLiaAnalysesForProject(
  projectId: string,
  userId: string,
  limit = 10,
): Promise<LiaAnalysis[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lia_analyses")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as LiaAnalysisRow[]).map((row) => mapLiaAnalysisRow(row));
}

export async function insertLiaAnalysis(input: {
  userId: string;
  projectId: string;
  report: SolutionReport;
}): Promise<LiaAnalysis | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = createClient();
  const draft = input.report.solutionDraft;
  const { data, error } = await supabase
    .from("lia_analyses")
    .insert({
      user_id: input.userId,
      project_id: input.projectId,
      summary: draft.summary,
      available_resources: draft.available_resources,
      missing_resources: draft.missing_resources,
      recommendations: draft.recommendations,
      risks: draft.risks,
      next_steps: draft.next_steps,
      internal_matches: flattenInternalMatches(input.report),
      external_results: input.report.external,
      report: input.report,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapLiaAnalysisRow(data as LiaAnalysisRow, input.report.project.title);
}
