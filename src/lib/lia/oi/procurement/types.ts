/**
 * Stage 4N — procurement DETAIL resolution types (compute-only).
 * No new DB enums. Provenance per FACT. Inference ≠ FACT.
 */

export type ProcurementFactKind = "FACT" | "INFERENCE" | "UNKNOWN";

export type ProcurementConfidence =
  | "OFFICIAL_CONFIRMED"
  | "MULTI_SOURCE_CONFIRMED"
  | "TRUSTED_SECONDARY"
  | "SEARCH_ONLY"
  | "UNVERIFIED";

export type ProcurementSourceTrust =
  | "official_eis"
  | "trusted_secondary"
  | "search_evidence"
  | "unresolved";

export type ProcurementLifecycle =
  | "ACTIVE"
  | "CLOSED"
  | "CANCELLED"
  | "EXPIRED"
  | "UNKNOWN";

export type ProcurementFact = {
  field: string;
  value: string | number | null;
  kind: ProcurementFactKind;
  sourceId: string;
  sourceUrl: string | null;
  sourceLabel: string;
  trust: ProcurementSourceTrust;
  observedAt: string;
};

export type ProcurementSourceAttempt = {
  sourceId: string;
  sourceLabel: string;
  trust: ProcurementSourceTrust;
  ok: boolean;
  reason: string | null;
  httpStatus?: number | null;
  durationMs: number;
  urlTried?: string | null;
};

export type ResolvedProcurementDetail = {
  noticeId: string;
  title: string | null;
  subject: string | null;
  customer: string | null;
  region: string | null;
  amount: number | null;
  amountKind: "NMCK" | "UNKNOWN";
  deadlineAt: string | null;
  lifecycle: ProcurementLifecycle;
  canonicalUrl: string | null;
  officialUrl: string | null;
  confidence: ProcurementConfidence;
  facts: ProcurementFact[];
  attempts: ProcurementSourceAttempt[];
  fetchedAt: string;
  verifiedAt: string | null;
  sourcesUsed: string[];
};

export type DetailResolveStats = {
  detailAttempts: number;
  detailSuccess: number;
  detailFailure: number;
  officialConfirmed: number;
  multiSourceConfirmed: number;
  secondaryOnly: number;
  searchOnly: number;
};