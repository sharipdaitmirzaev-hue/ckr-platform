/**
 * Row mappers + exact-ID helpers for ckr_own_ideas / ckr_own_idea_runs.
 * No new tables. Used by the Supabase store and staging E2E.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertNoAutoActions, assertOwnerOnly } from "@/lib/ckr-own-ideas/guards";
import type { CkrOwnIdea, OwnIdeaRunMetrics } from "@/types/ckr-own-ideas";

export type OwnIdeaAdmin = Pick<SupabaseClient, "from">;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function ideaToRow(idea: CkrOwnIdea): Record<string, unknown> {
  assertOwnerOnly(idea);
  return {
    id: idea.id,
    title: idea.title,
    essence: idea.essence,
    why_noticed: idea.whyNoticed,
    rating: idea.rating,
    owner_state: idea.ownerState,
    visibility: "OWNER_ONLY",
    components: idea.components,
    missing: idea.missing,
    economics: idea.economics,
    risks: idea.risks,
    next_checks: idea.nextChecks,
    fingerprint: idea.fingerprint,
    owner_locked_fields: idea.ownerLockedFields,
    project_id: idea.projectId,
    run_id: idea.runId,
    marker: idea.marker,
    created_at: idea.createdAt,
    updated_at: idea.updatedAt,
    events: idea.events,
  };
}

export function rowToIdea(row: Record<string, unknown>): CkrOwnIdea {
  const idea: CkrOwnIdea = {
    id: String(row.id),
    title: String(row.title ?? ""),
    essence: String(row.essence ?? ""),
    whyNoticed: String(row.why_noticed ?? ""),
    rating: row.rating as CkrOwnIdea["rating"],
    ownerState: row.owner_state as CkrOwnIdea["ownerState"],
    visibility: "OWNER_ONLY",
    components: (row.components as CkrOwnIdea["components"]) || [],
    missing: (row.missing as CkrOwnIdea["missing"]) || [],
    economics: row.economics as CkrOwnIdea["economics"],
    risks: (row.risks as string[]) || [],
    nextChecks: (row.next_checks as string[]) || [],
    fingerprint: String(row.fingerprint ?? ""),
    ownerLockedFields: (row.owner_locked_fields as string[]) || [],
    projectId: (row.project_id as string | null) ?? null,
    runId: String(row.run_id ?? ""),
    marker: (row.marker as string | null) ?? null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    events: (row.events as CkrOwnIdea["events"]) || [],
  };
  assertOwnerOnly(idea);
  return idea;
}

export function runToRow(metrics: OwnIdeaRunMetrics): Record<string, unknown> {
  assertNoAutoActions(metrics);
  return {
    id: metrics.runId,
    started_at: metrics.startedAt,
    finished_at: metrics.finishedAt,
    duration_ms: metrics.durationMs,
    metrics,
  };
}

export function rowToRun(row: Record<string, unknown>): OwnIdeaRunMetrics {
  const nested = asRecord(row.metrics);
  const metrics: OwnIdeaRunMetrics = {
    runId: String(nested.runId || row.id || ""),
    startedAt: String(nested.startedAt || row.started_at || ""),
    finishedAt: String(nested.finishedAt || row.finished_at || ""),
    durationMs: Number(nested.durationMs ?? row.duration_ms ?? 0),
    queries: Number(nested.queries ?? 0),
    results: Number(nested.results ?? 0),
    enrichments: Number(nested.enrichments ?? 0),
    sources: (nested.sources as string[]) || [],
    ideasGenerated: Number(nested.ideasGenerated ?? 0),
    ideasRejected: Number(nested.ideasRejected ?? 0),
    ideasUpdated: Number(nested.ideasUpdated ?? 0),
    internalSearches: Number(nested.internalSearches ?? 0),
    externalCalls: Number(nested.externalCalls ?? 0),
    depthReached: Number(nested.depthReached ?? 0),
    stopReason: String(nested.stopReason ?? ""),
    costEstimate: (nested.costEstimate as number | null) ?? null,
    clientRequestUsed: false,
    autoPublish: false,
    autoOutreach: false,
    matchingEdges: false,
    scheduler: false,
    persistStatus: nested.persistStatus as OwnIdeaRunMetrics["persistStatus"],
    ideasPersisted: nested.ideasPersisted as number | undefined,
  };
  assertNoAutoActions(metrics);
  return metrics;
}

export function ownIdeasAdminClient(): OwnIdeaAdmin {
  const url =
    process.env.CKR_STAGING_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.CKR_STAGING_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Missing staging Supabase URL/key");
  if (url.includes("qsnbkhzewqlutdznrppl") || url.includes("ckr-center.ru")) {
    throw new Error("ownIdeasAdminClient refused production Supabase URL");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function ideasTable(admin: OwnIdeaAdmin) {
  return admin.from("ckr_own_ideas");
}

function runsTable(admin: OwnIdeaAdmin) {
  return admin.from("ckr_own_idea_runs");
}

export async function persistOwnIdea(admin: OwnIdeaAdmin, idea: CkrOwnIdea) {
  const { error } = await ideasTable(admin).upsert(ideaToRow(idea) as never);
  if (error) throw error;
}

export async function persistOwnIdeaRun(admin: OwnIdeaAdmin, metrics: OwnIdeaRunMetrics) {
  const { error } = await runsTable(admin).upsert(runToRow(metrics) as never);
  if (error) throw error;
}

export async function deleteOwnIdeaExact(admin: OwnIdeaAdmin, id: string) {
  const { error } = await ideasTable(admin).delete().eq("id", id);
  if (error) throw error;
}

export async function deleteOwnIdeaRunExact(admin: OwnIdeaAdmin, id: string) {
  const { error } = await runsTable(admin).delete().eq("id", id);
  if (error) throw error;
}
