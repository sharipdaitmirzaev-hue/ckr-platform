/**
 * User-facing source labels for published LIA opportunities.
 * Never expose adapter ids (serper_general, procurement, …).
 */

import type { LiaOiCandidate } from "@/types/lia-oi";

export type UserSourceLabel =
  | "Официальные закупки"
  | "Господдержка"
  | "Торги"
  | "Открытый источник"
  | "ЦКР";

export function userSourceLabelForCandidate(
  candidate: Pick<
    LiaOiCandidate,
    | "opportunityType"
    | "sourceAdapterId"
    | "isOfficialSource"
    | "dataChannel"
    | "sourceClass"
  >,
): UserSourceLabel {
  const t = (candidate.opportunityType || "").toUpperCase();
  const adapter = (candidate.sourceAdapterId || "").toLowerCase();
  const cls = (candidate.sourceClass || "").toUpperCase();

  if (
    t === "PROCUREMENT" ||
    adapter.includes("procurement") ||
    cls === "TENDERS"
  ) {
    return "Официальные закупки";
  }
  if (
    t === "SUPPORT_PROGRAM" ||
    adapter.includes("support") ||
    cls === "SUPPORT_PROGRAMS"
  ) {
    return "Господдержка";
  }
  if (
    t === "AUCTION_ASSET" ||
    t === "GOVERNMENT_ASSET" ||
    adapter.includes("auction") ||
    cls === "AUCTIONS_ASSETS"
  ) {
    return "Торги";
  }
  if (candidate.isOfficialSource || candidate.dataChannel === "OFFICIAL_API") {
    return "Открытый источник";
  }
  if (adapter.includes("ckr") || adapter.includes("internal")) {
    return "ЦКР";
  }
  return "Открытый источник";
}

export function discoveryBadgeForCandidate(
  candidate: Pick<LiaOiCandidate, "isOfficialSource" | "dataChannel">,
): "Найдено Лией" | "Внешняя возможность" {
  if (
    candidate.isOfficialSource ||
    candidate.dataChannel === "OFFICIAL_API" ||
    candidate.dataChannel === "SERPER_DISCOVERY"
  ) {
    return "Найдено Лией";
  }
  return "Внешняя возможность";
}
