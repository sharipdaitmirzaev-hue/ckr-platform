import { withOiOwner } from "@/lib/lia/oi/http";
import { ensureLiaOiSeed } from "@/lib/lia/oi/pipeline";
import { listReports } from "@/lib/lia/oi/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return withOiOwner(async (userId) => {
    await ensureLiaOiSeed(userId);
    return { items: await listReports(), stubMode: true as const };
  });
}
