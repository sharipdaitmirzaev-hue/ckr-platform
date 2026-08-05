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
  return value.filter(
    (item): item is ExternalSearchResult =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as ExternalSearchResult).title === "string" &&
      typeof (item as ExternalSearchResult).url === "string",
  );
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
  const report = (row.report || {}) as SolutionReport;
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
    externalResults: asExternalResults(row.external_results),
    report,
    createdAt: row.created_at,
  };
}
