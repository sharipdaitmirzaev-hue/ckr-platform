import { withOiOwner } from "@/lib/lia/oi/http";
import { getInternetSearchProvider } from "@/lib/lia/oi/internet";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
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
    const mode = resolveOiSearchMode();
    return {
      provider: { id: provider.id, label: provider.label, mode: provider.mode },
      searchMode: mode.mode,
      liveAvailable: mode.liveAvailable,
      budgets: LIA_OI_BUDGETS,
      today: await getTodayStats(),
      counts: {
        candidates: (await listCandidates()).length,
        reports: (await listReports()).length,
        assignments: (await listAssignments()).length,
        searches: (await listSearchRequests()).length,
      },
      stubMode: mode.mode === "stub",
      note: "Stage 2B: memory|supabase store. SQL not applied to production yet. Scheduler/Matching — позже.",
    };
  });
}