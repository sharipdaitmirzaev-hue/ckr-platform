/**
 * Owner action: re-enrich a single opportunity without creating a new object.
 */

import { analyzeCandidate } from "@/lib/lia/oi/analyze";
import { enrichOneCandidate } from "@/lib/lia/oi/enrichment/enrich-candidate";
import { getCandidate, listSearchRequests, upsertCandidates } from "@/lib/lia/oi/store";
import type { LiaOiCandidate } from "@/types/lia-oi";

export async function reEnrichOpportunity(
  opportunityId: string,
): Promise<{
  item: LiaOiCandidate;
  fetched: boolean;
  error?: string;
}> {
  const existing = await getCandidate(opportunityId);
  if (!existing) throw new Error("Возможность не найдена");

  const req = (await listSearchRequests()).find(
    (r) => r.id === existing.searchRequestId,
  );
  const enriched = await enrichOneCandidate(existing, req?.plan);
  const analyzed = analyzeCandidate(enriched.candidate, req?.plan);

  // Preserve identity; update last_seen + structured fields via upsert merge
  const { candidates } = await upsertCandidates(
    [
      {
        ...analyzed,
        id: existing.id,
        fingerprint: existing.fingerprint || analyzed.fingerprint,
        firstSeenAt: existing.firstSeenAt,
        lastSeenAt: new Date().toISOString(),
      },
    ],
    { reason: "rediscovery" },
  );

  return {
    item: candidates[0] || analyzed,
    fetched: enriched.fetched,
    error: enriched.error,
  };
}
