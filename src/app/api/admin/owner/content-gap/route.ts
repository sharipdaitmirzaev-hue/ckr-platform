import { withOiOwner } from "@/lib/lia/oi/http";
import {
  DEFAULT_GAP_SCENARIOS,
  buildTargetedDiscoveryQuery,
  evaluateContentGaps,
  type ContentGapScenario,
} from "@/lib/lia/oi/content-gap";
import { runOwnerSearchPipeline } from "@/lib/lia/oi/pipeline";
import { listCandidates } from "@/lib/lia/oi/store";
import { passesPublicationQualityGate } from "@/lib/lia/oi/publish/quality-gate";
import {
  getDiscoveryBudgetSnapshot,
  getSourceHealthRows,
} from "@/lib/lia/oi/source-health";

/** GET — content gap + source health + budgets. */
export async function GET() {
  return withOiOwner(async () => {
    const candidates = await listCandidates();
    const gaps = evaluateContentGaps(candidates);
    return {
      gaps,
      sourceHealth: getSourceHealthRows(),
      budgets: getDiscoveryBudgetSnapshot(),
      oiTotal: candidates.length,
      autoPublish: false,
    };
  });
}

/**
 * POST targeted_discovery — manual owner trigger of existing LIA OI pipeline.
 * NOT a Scheduler. Does NOT auto-publish.
 */
export async function POST(req: Request) {
  return withOiOwner(async (userId) => {
    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      scenarioId?: string;
      intentType?: string;
      regions?: string[];
      industries?: string[];
      budgetMax?: number | null;
      query?: string;
    };

    if (body.action !== "targeted_discovery") {
      throw new Error("Unknown action");
    }

    const fromDefault = DEFAULT_GAP_SCENARIOS.find(
      (s) => s.id === body.scenarioId,
    );
    const scenario: ContentGapScenario = fromDefault || {
      id: body.scenarioId || "custom",
      label: body.scenarioId || "custom",
      intentType: body.intentType || "SEEK_SUPPORT",
      regions: body.regions || ["Дагестан"],
      industries: body.industries || [],
      budgetMax: body.budgetMax ?? null,
    };

    const query =
      body.query?.trim() || buildTargetedDiscoveryQuery(scenario);

    const result = await runOwnerSearchPipeline({
      query,
      userId,
      need: {
        intentType: scenario.intentType as never,
        regions: scenario.regions,
        industries: scenario.industries,
        budgetMax: scenario.budgetMax ?? null,
        budgetMin: null,
        title: scenario.label,
      },
    });

    let publishable = 0;
    for (const c of result.candidates) {
      if (passesPublicationQualityGate(c).ok) publishable += 1;
    }

    return {
      autoPublish: false,
      query,
      plannerVersion: (result.plan as { plannerVersion?: string })?.plannerVersion || "v2",
      queriesUsed: result.stats?.queriesRun ?? result.request?.plan?.queries?.length ?? 0,
      results: result.signalsScanned,
      afterDedup: result.afterDedup,
      enriched: result.candidates.filter((c) => c.enrichedFromFetch).length,
      publishable,
      top: result.topOpportunities.length,
      sourceHealth: getSourceHealthRows(),
      budgets: getDiscoveryBudgetSnapshot(),
      providerUnavailable: result.providerUnavailable,
      searchMode: result.searchMode,
    };
  });
}
