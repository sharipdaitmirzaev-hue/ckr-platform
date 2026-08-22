import { withOiOwner } from "@/lib/lia/oi/http";
import { ensureLiaOiSeed } from "@/lib/lia/oi/pipeline";
import { listCandidatesPage } from "@/lib/lia/oi/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return withOiOwner(async (userId) => {
    await ensureLiaOiSeed(userId);
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Number(searchParams.get("pageSize") || "20");
    const result = await listCandidatesPage({
      savedOnly: searchParams.get("saved") === "1",
      rejectedOnly: searchParams.get("rejected") === "1",
      status: searchParams.get("status") ?? undefined,
      bucket: searchParams.get("bucket") ?? undefined,
      region: searchParams.get("region") ?? undefined,
      industry: searchParams.get("industry") ?? undefined,
      budgetFit: searchParams.get("budgetFit") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      sourceAdapterId: searchParams.get("adapter") ?? undefined,
      opportunityType: searchParams.get("type") ?? undefined,
      officialOnly: searchParams.get("official") === "1",
      q: searchParams.get("q") ?? undefined,
      minOverall: searchParams.get("minScore")
        ? Number(searchParams.get("minScore"))
        : undefined,
      minConfidence: searchParams.get("minConfidence")
        ? Number(searchParams.get("minConfidence"))
        : undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      page,
      pageSize,
    });
    return {
      ...result,
      stubMode: true as const,
    };
  });
}
