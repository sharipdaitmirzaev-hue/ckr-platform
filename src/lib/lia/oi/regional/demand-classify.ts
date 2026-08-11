/**
 * Stage 4E — CONFIRMED_DEMAND vs POTENTIAL_BUYER.
 * Company alone ≠ buyer. Provenance must stay honest.
 */

import type { LiaOiCandidate, LiaOiProvenanceKind } from "@/types/lia-oi";

export const DEMAND_CLASSIFICATIONS = [
  "CONFIRMED_DEMAND",
  "POTENTIAL_BUYER",
  "UNKNOWN",
] as const;
export type DemandClassification = (typeof DEMAND_CLASSIFICATIONS)[number];

export type DemandClassificationResult = {
  classification: DemandClassification;
  provenance: LiaOiProvenanceKind;
  confidence: number;
  reasons: string[];
};

const CONFIRMED_RE =
  /закупк|тендер|нмцк|извещени|запрос\s+цен|котировк|контракт|поставк[аи]\s+|потребност|объявлен[ао]\s+закуп|прием\s+заявок|лот\s*№/i;

const POTENTIAL_RE =
  /гостиниц|отел|санатор|больниц|школ|ресторан|кафе|сеть\s+магазин|дистриб|торговая\s+сеть|horeca|предприят|завод|список\s+компани|каталог\s+организаци/i;

const LIST_OR_DIR =
  /каталог|список|база\s+компани|все\s+гостиниц|топ\s+\d+|рейтинг/i;

/**
 * Classify demand signal for SEEK_BUYER / DEMAND intents.
 * Does not invent FACT without procurement/demand language.
 */
export function classifyDemandSignal(input: {
  title: string;
  description?: string;
  url?: string;
  pageType?: string;
  opportunityType?: string | null;
  contentIntent?: string | null;
}): DemandClassificationResult {
  const blob = `${input.title} ${input.description || ""}`;
  const reasons: string[] = [];

  if (
    input.opportunityType === "PROCUREMENT" ||
    /zakupki\.gov\.ru/i.test(input.url || "")
  ) {
    reasons.push("procurement_channel");
    return {
      classification: "CONFIRMED_DEMAND",
      provenance: "FACT",
      confidence: 85,
      reasons,
    };
  }

  if (CONFIRMED_RE.test(blob)) {
    reasons.push("demand_language");
    const conf =
      input.pageType === "DETAIL" && !LIST_OR_DIR.test(blob) ? 78 : 62;
    return {
      classification: "CONFIRMED_DEMAND",
      provenance: conf >= 70 ? "FACT" : "INFERENCE",
      confidence: conf,
      reasons,
    };
  }

  if (POTENTIAL_RE.test(blob) || LIST_OR_DIR.test(blob)) {
    reasons.push("organization_or_directory");
    return {
      classification: "POTENTIAL_BUYER",
      provenance: "INFERENCE",
      confidence: 45,
      reasons,
    };
  }

  return {
    classification: "UNKNOWN",
    provenance: "UNKNOWN",
    confidence: 20,
    reasons: ["no_demand_signal"],
  };
}

export function attachDemandClassification(
  candidate: LiaOiCandidate,
): LiaOiCandidate {
  const result = classifyDemandSignal({
    title: candidate.title,
    description: candidate.description,
    url: candidate.canonicalUrl || candidate.sources?.[0]?.url,
    pageType: candidate.pageType,
    opportunityType: candidate.opportunityType,
    contentIntent: candidate.contentIntent,
  });
  return {
    ...candidate,
    demandClassification: result.classification,
    demandProvenance: result.provenance,
    demandConfidence: result.confidence,
  };
}

/** Strong buyer signal for gap/feed: confirmed demand only. */
export function isConfirmedDemand(c: LiaOiCandidate): boolean {
  return c.demandClassification === "CONFIRMED_DEMAND";
}
