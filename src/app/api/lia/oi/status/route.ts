import { withOiOwner } from "@/lib/lia/oi/http";
import { getInternetSearchProvider } from "@/lib/lia/oi/internet";
import { resolveOiSearchMode } from "@/lib/lia/oi/mode";
import { ensureLiaOiSeed, getTodayStats } from "@/lib/lia/oi/pipeline";
import {
  listAssignments,
  listCandidatesPage,
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
    const [today, candidatesPage, reports, assignments, searches] =
      await Promise.all([
        getTodayStats(),
        listCandidatesPage({ page: 1, pageSize: 1 }),
        listReports(),
        listAssignments(),
        listSearchRequests(),
      ]);
    return {
      provider: { id: provider.id, label: provider.label, mode: provider.mode },
      searchMode: mode.mode,
      liveAvailable: mode.liveAvailable,
      budgets: LIA_OI_BUDGETS,
      today,
      counts: {
        candidates: candidatesPage.total,
        reports: reports.length,
        assignments: assignments.length,
        searches: searches.length,
      },
      stubMode: mode.mode === "stub",
      note: "Stage 2B: memory|supabase store. Scheduler/Matching — позже.",
    };
  });
}