import { withOiOwner } from "@/lib/lia/oi/http";
import { ensureLiaOiSeed } from "@/lib/lia/oi/pipeline";
import { listCandidates } from "@/lib/lia/oi/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return withOiOwner(async (userId) => {
    await ensureLiaOiSeed(userId);
    const { searchParams } = new URL(request.url);
    const savedOnly = searchParams.get("saved") === "1";
    const status = searchParams.get("status") ?? undefined;
    return {
      items: listCandidates({ savedOnly, status }),
      stubMode: true as const,
    };
  });
}
