import { withOiOwner } from "@/lib/lia/oi/http";
import { analyzeCandidate } from "@/lib/lia/oi/analyze";
import { getCandidate, upsertCandidates } from "@/lib/lia/oi/store";
import { listSearchRequests } from "@/lib/lia/oi/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function POST(_request: Request, context: Ctx) {
  return withOiOwner(async () => {
    const item = getCandidate(context.params.id);
    if (!item) throw new Error("Возможность не найдена");
    const req = listSearchRequests().find((r) => r.id === item.searchRequestId);
    const analyzed = analyzeCandidate(item, req?.plan);
    upsertCandidates([analyzed]);
    return { item: analyzed, stubMode: true as const };
  });
}
