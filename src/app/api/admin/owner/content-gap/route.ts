import { withOiOwner } from "@/lib/lia/oi/http";
import {
  DEFAULT_GAP_SCENARIOS,
  buildTargetedDiscoveryQuery,
  evaluateContentGaps,
  getGapScenario,
  resolveGapScenarioId,
  strategiesForGapScenario,
  type ContentGapScenario,
} from "@/lib/lia/oi/content-gap";
import { runOwnerSearchPipeline } from "@/lib/lia/oi/pipeline";
import { listCandidates } from "@/lib/lia/oi/store";
import { passesPublicationQualityGate } from "@/lib/lia/oi/publish/quality-gate";
import {
  getDiscoveryBudgetSnapshot,
  getSourceHealthRows,
} from "@/lib/lia/oi/source-health";
import { dagestanCoverageFromCandidates } from "@/lib/lia/oi/regional/coverage";
import {
  evaluateSourcePerformance,
  sourcePerformanceSummaryRu,
} from "@/lib/lia/oi/regional/source-performance";
import { listRegionalSources } from "@/lib/lia/oi/regional/source-registry";
import { MARKETPLACE_MANUAL_CONTENT_TYPES } from "@/lib/lia/oi/regional/marketplace-content";
import { summarizeInventory } from "@/lib/lia/oi/regional/test-data-inventory";

/** GET — content gap + regional coverage + source performance + budgets. */
export async function GET() {
  return withOiOwner(async () => {
    const candidates = await listCandidates();
    const gaps = evaluateContentGaps(candidates);
    const gapStrategies = DEFAULT_GAP_SCENARIOS.map((s) => ({
      scenarioId: s.id,
      strategies: strategiesForGapScenario(s, 4).map((x) => ({
        id: x.id,
        label: x.label,
        domain: x.domain || null,
        query: x.query,
      })),
    }));
    return {
      gaps,
      gapStrategies,
      dagestanCoverage: dagestanCoverageFromCandidates(candidates),
      regionalSources: listRegionalSources({ enabledOnly: false }),
      sourcePerformance: evaluateSourcePerformance(candidates),
      sourcePerformanceRu: sourcePerformanceSummaryRu(candidates),
      marketplaceManualTypes: MARKETPLACE_MANUAL_CONTENT_TYPES,
      testDataInventory: summarizeInventory(),
      sourceHealth: getSourceHealthRows(),
      budgets: getDiscoveryBudgetSnapshot(),
      oiTotal: candidates.length,
      autoPublish: false,
      plannerVersionDefault: "v2-regional",
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

    const resolvedId = body.scenarioId
      ? resolveGapScenarioId(body.scenarioId)
      : undefined;
    const fromDefault = resolvedId ? getGapScenario(resolvedId) : null;
    const scenario: ContentGapScenario = fromDefault || {
      id: resolvedId || body.scenarioId || "custom",
      label: body.scenarioId || "custom",
      intentType: body.intentType || "SEEK_SUPPORT",
      regions: body.regions || ["Дагестан"],
      industries: body.industries || [],
      budgetMax: body.budgetMax ?? null,
    };

    const strategies = strategiesForGapScenario(scenario, 6);
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
      regionalFirst: true,
    });

    let publishable = 0;
    for (const c of result.candidates) {
      if (passesPublicationQualityGate(c).ok) publishable += 1;
    }

    const perf = evaluateSourcePerformance(result.candidates);

    return {
      autoPublish: false,
      query,
      strategies: strategies.map((s) => ({
        id: s.id,
        domain: s.domain || null,
        query: s.query,
      })),
      plannerVersion:
        (result.plan as { plannerVersion?: string })?.plannerVersion ||
        "v2-regional",
      queriesUsed:
        result.stats?.queriesRun ??
        result.request?.plan?.queries?.length ??
        0,
      results: result.signalsScanned,
      afterDedup: result.afterDedup,
      enriched: result.candidates.filter((c) => c.enrichedFromFetch).length,
      publishable,
      top: result.topOpportunities.length,
      sourcePerformance: perf,
      sourcePerformanceRu: sourcePerformanceSummaryRu(result.candidates),
      sourceHealth: getSourceHealthRows(),
      budgets: getDiscoveryBudgetSnapshot(),
      providerUnavailable: result.providerUnavailable,
      searchMode: result.searchMode,
    };
  });
}
