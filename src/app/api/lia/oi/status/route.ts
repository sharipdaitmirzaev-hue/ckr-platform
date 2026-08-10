import { withOiOwner } from "@/lib/lia/oi/http";
import { getInternetSearchProvider } from "@/lib/lia/oi/internet/stub";
import { ensureLiaOiSeed, getTodayStats } from "@/lib/lia/oi/pipeline";
import {
  listAssignments,
  listCandidates,
  listReports,
  listSearchRequests,
} from "@/lib/lia/oi/store";
import { LIA_OI_BUDGETS } from "@/config/lia-oi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return withOiOwner(async (userId) => {
    await ensureLiaOiSeed(userId);
    const provider = getInternetSearchProvider();
    return {
      provider: { id: provider.id, label: provider.label, mode: provider.mode },
      budgets: LIA_OI_BUDGETS,
      today: getTodayStats(),
      counts: {
        candidates: listCandidates().length,
        reports: listReports().length,
        assignments: listAssignments().length,
        searches: listSearchRequests().length,
      },
      stubMode: true as const,
      note: "Автономные циклы разведки (scheduler) — этап 5. Сейчас только поиск по запросу + seed.",
    };
  });
}