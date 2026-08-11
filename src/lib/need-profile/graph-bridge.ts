/**
 * Need Profile → Business Graph node mapping.
 * Does NOT create MATCHES edges.
 */

import type { BusinessNodeType } from "@/types/business-graph";
import type { NeedIntentType, NeedProfile } from "@/types/need-profile";
import type { CreateNodeInput } from "@/types/business-graph";
import { bgHash } from "@/lib/business-graph/id";

export function mapIntentToGraphNodeType(
  intentType: NeedIntentType,
): BusinessNodeType {
  switch (intentType) {
    case "INVEST":
      return "CAPITAL";
    case "SELL_BUSINESS":
      return "BUSINESS";
    case "SELL_PROPERTY":
      return "PROPERTY";
    case "SELL_EQUIPMENT":
      return "EQUIPMENT";
    case "SEEK_PARTNER":
      return "PARTNER";
    case "SEEK_BUYER":
    case "SUPPLY":
      return "SUPPLY";
    case "SEEK_INVESTMENT":
    case "BUY_BUSINESS":
    case "BUY_PROPERTY":
    case "SEEK_PROJECT":
    case "SEEK_SUPPLIER":
    case "SEEK_EXPERT":
    case "SEEK_EQUIPMENT":
    case "SEEK_SUPPORT":
    case "SEEK_CONTRACT":
    case "DEMAND":
      return "DEMAND";
    default:
      return "DEMAND";
  }
}

export function needProfileToNodeInput(need: NeedProfile): CreateNodeInput {
  return {
    nodeType: mapIntentToGraphNodeType(need.intentType),
    title: need.title,
    description: need.description,
    sourceType: "need_profile",
    sourceId: need.id,
    region: need.regions[0] || null,
    visibility:
      need.visibility === "PUBLIC"
        ? "PUBLIC"
        : need.visibility === "PRIVATE"
          ? "OWNER_ONLY"
          : "INTERNAL",
    status: need.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    fingerprint: bgHash(`need|${need.id}`),
    dataConfidence: 85,
    dataQualityScore: 60,
    structuredData: {
      intentType: need.intentType,
      ownerType: need.ownerType,
      ownerId: need.ownerId,
      budgetMin: need.budgetMin,
      budgetMax: need.budgetMax,
      currency: need.currency,
      regions: need.regions,
      industries: need.industries,
      criteria: need.criteria,
      matchingEnabled: need.matchingEnabled,
    },
  };
}
