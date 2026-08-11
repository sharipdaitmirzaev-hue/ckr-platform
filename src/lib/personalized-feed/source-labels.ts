/** User-facing source labels — never expose adapter ids. */

import type { FeedSourceChannel } from "@/types/personalized-feed";

export function labelForMarketplaceSource(
  itemType: string,
): { sourceLabel: string; sourceKey: string; sourceChannel: FeedSourceChannel } {
  switch (itemType) {
    case "project":
      return {
        sourceLabel: "ЦКР · проект",
        sourceKey: "ckr_project",
        sourceChannel: "internal",
      };
    case "opportunity":
      return {
        sourceLabel: "ЦКР · возможность",
        sourceKey: "ckr_opportunity",
        sourceChannel: "internal",
      };
    case "investment_offer":
      return {
        sourceLabel: "ЦКР · инвестиции",
        sourceKey: "ckr_investment",
        sourceChannel: "internal",
      };
    case "expert":
      return {
        sourceLabel: "ЦКР · эксперт",
        sourceKey: "ckr_expert",
        sourceChannel: "internal",
      };
    case "need_profile":
      return {
        sourceLabel: "ЦКР · потребность",
        sourceKey: "ckr_need",
        sourceChannel: "internal",
      };
    default:
      return {
        sourceLabel: "ЦКР",
        sourceKey: "ckr",
        sourceChannel: "internal",
      };
  }
}

/** Owner diagnostics only — never show raw adapter ids to end users. */
export function labelForLiaOiSource(opportunityType?: string | null): {
  sourceLabel: string;
  sourceKey: string;
  sourceChannel: FeedSourceChannel;
} {
  const t = (opportunityType || "").toUpperCase();
  if (t.includes("SUPPORT")) {
    return {
      sourceLabel: "Лия · господдержка",
      sourceKey: "lia_support",
      sourceChannel: "external",
    };
  }
  if (t.includes("PROCUREMENT") || t.includes("CONTRACT")) {
    return {
      sourceLabel: "Лия · закупки",
      sourceKey: "lia_procurement",
      sourceChannel: "external",
    };
  }
  if (t.includes("AUCTION")) {
    return {
      sourceLabel: "Лия · торги",
      sourceKey: "lia_auction",
      sourceChannel: "external",
    };
  }
  return {
    sourceLabel: "Лия · интернет",
    sourceKey: "lia_web",
    sourceChannel: "external",
  };
}
