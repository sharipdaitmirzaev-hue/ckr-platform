/**
 * Stage 4O — SearchPlan + cost budgets.
 * PASS 1 internal first; external passes owner-gated by default.
 */

import {
  contextToPrimaryQuery,
  fingerprintSearchContext,
} from "@/lib/opportunity-discovery/search-context";
import type {
  DiscoveryCostBudget,
  DiscoverySearchPlan,
  OpportunitySearchContext,
} from "@/lib/opportunity-discovery/types";

export const DEFAULT_COST_BUDGET: DiscoveryCostBudget = {
  maxInternalSources: 10,
  maxExternalQueries: 8,
  maxDetailAttempts: 12,
  maxNewCandidates: 40,
};

export function buildSearchPlan(
  ctx: OpportunitySearchContext,
  opts?: {
    includeExternal?: boolean;
    budget?: Partial<DiscoveryCostBudget>;
    queryVariants?: string[];
  },
): DiscoverySearchPlan {
  const budget: DiscoveryCostBudget = {
    ...DEFAULT_COST_BUDGET,
    ...(opts?.budget ?? {}),
  };
  const includeExternal = opts?.includeExternal === true;
  const primaryQuery = contextToPrimaryQuery(ctx);
  const variants = opts?.queryVariants?.length
    ? opts.queryVariants
    : buildQueryVariants(ctx, primaryQuery);

  return {
    mode: ctx.mode,
    contextFingerprint: fingerprintSearchContext(ctx),
    primaryQuery,
    queryVariants: variants.slice(0, budget.maxExternalQueries),
    costBudget: budget,
    passes: [
      {
        id: "PASS_1_INTERNAL",
        labelRu: "Поиск внутри ЦКР",
        enabled: true,
        requiresOwnerAction: false,
        sources: [
          "organizations",
          "need_profiles",
          "projects",
          "opportunities",
          "investment_offers",
          "expert_profiles",
          "published_lia_opportunities",
        ],
      },
      {
        id: "PASS_2_OFFICIAL",
        labelRu: "Официальные / гос. источники",
        enabled: includeExternal,
        requiresOwnerAction: true,
        sources: ["official", "government_open", "regional_portal"],
      },
      {
        id: "PASS_3_TRUSTED_SECONDARY",
        labelRu: "Доверенные вторичные",
        enabled: includeExternal,
        requiresOwnerAction: true,
        sources: ["trusted_secondary", "company_website"],
      },
      {
        id: "PASS_4_GENERAL_WEB",
        labelRu: "Общий веб / сниппеты",
        enabled: includeExternal,
        requiresOwnerAction: true,
        sources: ["general_web", "search_snippet"],
      },
    ],
  };
}

export function buildQueryVariants(
  ctx: OpportunitySearchContext,
  primary: string,
): string[] {
  const region = ctx.region || "";
  const industry = ctx.industry || "";
  const out: string[] = [primary];

  if (ctx.intent === "SEEK_BUYER" || ctx.sourcePreferences.includes("PROCUREMENT")) {
    out.push(
      ["закупка", industry, ...ctx.productsServices.slice(0, 2), region]
        .filter(Boolean)
        .join(" "),
      ["тендер", ...ctx.productsServices.slice(0, 2), region]
        .filter(Boolean)
        .join(" "),
    );
  }

  if (
    ctx.intent === "INVEST" ||
    ctx.intent === "SEEK_INVESTMENT" ||
    ctx.intent === "BUY_BUSINESS" ||
    ctx.sourcePreferences.includes("INVESTMENT_PROJECT") ||
    ctx.sourcePreferences.includes("BUSINESS_FOR_SALE")
  ) {
    out.push(
      ["инвестиционный проект", region, industry].filter(Boolean).join(" "),
      ["бизнес на продажу", region].filter(Boolean).join(" "),
      ["действующий бизнес", region, ctx.budgetMax != null ? `${ctx.budgetMax}` : ""]
        .filter(Boolean)
        .join(" "),
    );
  }

  if (ctx.sourcePreferences.includes("SUPPORT")) {
    out.push(["господдержка", region, industry].filter(Boolean).join(" "));
  }

  return Array.from(new Set(out.map((q) => q.trim()).filter(Boolean)));
}

/** Heuristic: enough quality internal options to skip auto-external. */
export function isInternalSufficient(input: {
  suitable: number;
  possible: number;
  needsCheck: number;
}): boolean {
  if (input.suitable >= 2) return true;
  if (input.suitable + input.possible >= 3) return true;
  if (input.suitable + input.possible + input.needsCheck >= 5) return true;
  return false;
}
