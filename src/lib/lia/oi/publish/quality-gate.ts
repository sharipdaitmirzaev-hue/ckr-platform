/**
 * Minimal quality gate before owner review queue.
 * UNKNOWN price is allowed — UNKNOWN ≠ false.
 */

import type { LiaOiCandidate } from "@/types/lia-oi";
import type { QualityGateResult } from "@/types/lia-controlled-publish";
import { detectLifecycleHint } from "@/lib/lia/oi/publish/safe-projection";

const MIN_DATA_QUALITY = 3;

export function passesPublicationQualityGate(
  candidate: LiaOiCandidate,
): QualityGateResult {
  const reasons: string[] = [];

  if (candidate.status === "REJECTED") {
    reasons.push("status=REJECTED");
  }
  if (candidate.status === "ARCHIVED") {
    reasons.push("status=ARCHIVED");
  }
  if (candidate.resultBucket === "REJECTED") {
    reasons.push("bucket=REJECTED");
  }

  const lifecycle = detectLifecycleHint(candidate);
  if (lifecycle === "expired" || lifecycle === "closed" || lifecycle === "cancelled") {
    reasons.push(`lifecycle=${lifecycle}`);
  }

  const title = (candidate.title || "").trim();
  if (title.length < 3) {
    reasons.push("missing_title");
  }

  const hasSource =
    (candidate.sources?.length ?? 0) > 0 ||
    Boolean(candidate.canonicalUrl) ||
    Boolean(candidate.sourceAdapterId);
  if (!hasSource) {
    reasons.push("missing_source");
  }

  const url = (
    candidate.canonicalUrl ||
    candidate.sources?.find((s) => s.url)?.url ||
    ""
  ).trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    reasons.push("missing_canonical_or_official_url");
  }

  const dq =
    candidate.dataQualityScore ??
    candidate.score?.quality ??
    candidate.score?.overall ??
    0;
  const readiness = candidate.matchingReadiness;
  const qualityOk =
    dq >= MIN_DATA_QUALITY ||
    readiness === "READY" ||
    readiness === "PARTIAL";
  if (!qualityOk) {
    reasons.push(`data_quality_below_${MIN_DATA_QUALITY}`);
  }

  return { ok: reasons.length === 0, reasons };
}
