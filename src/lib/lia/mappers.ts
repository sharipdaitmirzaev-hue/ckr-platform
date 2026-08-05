import { coerceExternalResult } from "@/lib/lia/search/normalize";
import type { LiaAnalysisRow } from "@/types/database";
import type {
  ExternalSearchResult,
  InternalMatch,
  LiaAnalysis,
  LiaMessage,
  LiaMessageMetadata,
  LiaMessageRole,
  LiaSession,
  SolutionReport,
} from "@/types/lia";

export type LiaSessionRow = {
  id: string;
  user_id: string;
  title: string;
  context_type: string | null;
  context_id: string | null;
  created_at: string;
  updated_at: string;
};

export type LiaMessageRow = {
  id: string;
  session_id: string;
  role: LiaMessageRole;
  content: string;
  metadata: LiaMessageMetadata | null;
  created_at: string;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asInternalMatches(value: unknown): InternalMatch[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is InternalMatch =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as InternalMatch).title === "string" &&
      typeof (item as InternalMatch).href === "string",
  );
}

function asExternalResults(value: unknown): ExternalSearchResult[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => coerceExternalResult(item))
    .filter((item): item is ExternalSearchResult => item !== null);
}

export function mapLiaSessionRow(row: LiaSessionRow): LiaSession {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    contextType: row.context_type,
    contextId: row.context_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLiaMessageRow(row: LiaMessageRow): LiaMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    metadata: (row.metadata as LiaMessageMetadata) || {},
    createdAt: row.created_at,
  };
}

export function mapLiaAnalysisRow(
  row: LiaAnalysisRow,
  projectTitle?: string | null,
): LiaAnalysis {
  const raw = (row.report || {}) as Partial<SolutionReport>;
  const external = asExternalResults(
    raw.external ?? row.external_results,
  );
  const report: SolutionReport = {
    project: raw.project ?? {
      id: row.project_id,
      title: projectTitle || "Проект",
      summary: "",
      region: "",
      category: "",
      stage: "idea",
      investment_required: 0,
    },
    available: raw.available ?? asStringArray(row.available_resources),
    missing: raw.missing ?? asStringArray(row.missing_resources),
    searchQueries: raw.searchQueries ?? [],
    externalProvider: raw.externalProvider ?? "unknown",
    internal: raw.internal ?? {
      projects: [],
      opportunities: [],
      investments: [],
      experts: [],
    },
    external,
    recommendations: raw.recommendations ?? asStringArray(row.recommendations),
    risks: raw.risks ?? asStringArray(row.risks),
    next_steps: raw.next_steps ?? asStringArray(row.next_steps),
    solutionDraft: raw.solutionDraft ?? {
      project_id: row.project_id,
      summary: row.summary,
      available_resources: asStringArray(row.available_resources),
      missing_resources: asStringArray(row.missing_resources),
      recommendations: asStringArray(row.recommendations),
      risks: asStringArray(row.risks),
      next_steps: asStringArray(row.next_steps),
    },
    disclaimer: raw.disclaimer ?? "",
  };

  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    projectTitle: projectTitle ?? report.project?.title ?? null,
    summary: row.summary,
    availableResources: asStringArray(row.available_resources),
    missingResources: asStringArray(row.missing_resources),
    recommendations: asStringArray(row.recommendations),
    risks: asStringArray(row.risks),
    nextSteps: asStringArray(row.next_steps),
    internalMatches: asInternalMatches(row.internal_matches),
    externalResults: external,
    report,
    createdAt: row.created_at,
  };
}
