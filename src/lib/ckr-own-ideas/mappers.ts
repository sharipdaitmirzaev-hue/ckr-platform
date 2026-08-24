import { assertOwnerOnly } from "@/lib/ckr-own-ideas/guards";
import type { CkrOwnIdea, OwnIdeaRunMetrics } from "@/types/ckr-own-ideas";

export type OwnIdeaRow = {
  id: string;
  title: string;
  essence: string;
  why_noticed: string;
  rating: CkrOwnIdea["rating"];
  owner_state: CkrOwnIdea["ownerState"];
  visibility: "OWNER_ONLY";
  components: CkrOwnIdea["components"];
  missing: CkrOwnIdea["missing"];
  economics: CkrOwnIdea["economics"];
  risks: CkrOwnIdea["risks"];
  next_checks: CkrOwnIdea["nextChecks"];
  fingerprint: string;
  owner_locked_fields: string[];
  project_id: string | null;
  run_id: string;
  marker: string | null;
  created_at: string;
  updated_at: string;
  events: CkrOwnIdea["events"];
};

export type OwnIdeaRunRow = {
  id: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  metrics: OwnIdeaRunMetrics;
};

export function ideaToRow(idea: CkrOwnIdea): OwnIdeaRow {
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

export function rowToIdea(row: OwnIdeaRow): CkrOwnIdea {
  const idea: CkrOwnIdea = {
    id: row.id,
    title: row.title,
    essence: row.essence,
    whyNoticed: row.why_noticed,
    rating: row.rating,
    ownerState: row.owner_state,
    visibility: "OWNER_ONLY",
    components: row.components ?? [],
    missing: row.missing ?? [],
    economics: row.economics,
    risks: row.risks ?? [],
    nextChecks: row.next_checks ?? [],
    fingerprint: row.fingerprint,
    ownerLockedFields: row.owner_locked_fields ?? [],
    projectId: row.project_id,
    runId: row.run_id,
    marker: row.marker,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    events: row.events ?? [],
  };
  assertOwnerOnly(idea);
  return idea;
}

export function runToRow(metrics: OwnIdeaRunMetrics): OwnIdeaRunRow {
  return {
    id: metrics.runId,
    started_at: metrics.startedAt,
    finished_at: metrics.finishedAt,
    duration_ms: metrics.durationMs,
    metrics,
  };
}

export function rowToRun(row: OwnIdeaRunRow): OwnIdeaRunMetrics {
  const metrics = row.metrics ?? ({} as OwnIdeaRunMetrics);
  return {
    ...metrics,
    runId: row.id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationMs: row.duration_ms,
    autoPublish: false,
    autoOutreach: false,
    matchingEdges: false,
    scheduler: false,
    clientRequestUsed: false,
  };
}
