import { withOiOwner } from "@/lib/lia/oi/http";
import { reEnrichOpportunity } from "@/lib/lia/oi/enrichment/re-enrich";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

/** Owner action: re-run structured enrichment for one opportunity. */
export async function POST(_request: Request, context: Ctx) {
  return withOiOwner(async () => {
    const result = await reEnrichOpportunity(context.params.id);
    return {
      item: result.item,
      fetched: result.fetched,
      error: result.error ?? null,
      matchingReadiness: result.item.matchingReadiness ?? "NOT_READY",
      dataQualityScore: result.item.dataQualityScore ?? 0,
      confirmedFields: result.item.confirmedFields ?? [],
      unknownFields: result.item.unknownFields ?? [],
    };
  });
}
