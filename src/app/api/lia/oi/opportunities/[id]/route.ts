import { withOiOwner } from "@/lib/lia/oi/http";
import { ensureLiaOiSeed } from "@/lib/lia/oi/pipeline";
import { getCandidate } from "@/lib/lia/oi/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_request: Request, context: Ctx) {
  return withOiOwner(async (userId) => {
    await ensureLiaOiSeed(userId);
    const item = await getCandidate(context.params.id);
    if (!item) throw new Error("Возможность не найдена");
    return { item, stubMode: true as const };
  });
}
