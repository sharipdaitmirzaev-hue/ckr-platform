import { withOiOwner } from "@/lib/lia/oi/http";
import { runOwnerSearchPipeline } from "@/lib/lia/oi/pipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  return withOiOwner(async (userId) => {
    const body = (await request.json().catch(() => ({}))) as {
      query?: string;
    };
    const query = body.query?.trim();
    if (!query || query.length < 3) {
      throw new Error("Укажите поисковый запрос (минимум 3 символа).");
    }
    if (query.length > 500) {
      throw new Error("Запрос слишком длинный.");
    }
    return runOwnerSearchPipeline({ query, userId });
  });
}
