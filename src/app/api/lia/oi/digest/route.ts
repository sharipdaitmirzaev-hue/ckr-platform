import { withOiOwner } from "@/lib/lia/oi/http";
import {
  buildDigestReport,
  ensureLiaOiSeed,
} from "@/lib/lia/oi/pipeline";
import { addReport, listCandidates, listReports } from "@/lib/lia/oi/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return withOiOwner(async (userId) => {
    await ensureLiaOiSeed(userId);
    const existing = (await listReports()).find((r) => r.kind === "daily_digest");
    if (existing) return { item: existing, stubMode: true as const };
    const report = buildDigestReport(await listCandidates());
    await addReport(report);
    return { item: report, stubMode: true as const };
  });
}
