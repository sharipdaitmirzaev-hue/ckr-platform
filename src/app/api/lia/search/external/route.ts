import { LIA_DISCLAIMER } from "@/config/lia";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { API_ERROR_MESSAGES, apiError, apiSuccess } from "@/lib/errors/api";
import { checkLiaRateLimit } from "@/lib/lia/rate-limit";
import { runExternalSearch } from "@/lib/lia/search";
import { logApiError, logSystemEvent } from "@/lib/logging/system-log";
import { hasSupabaseEnv } from "@/lib/supabase/env";

/**
 * Прямой внешний поиск для Лии.
 * Только рекомендации: не создаёт заявки и не меняет данные пользователя.
 */
export async function GET() {
  // Без утечки конфигурации провайдера анонимам
  return apiSuccess({
    status: "ready",
    disclaimer: LIA_DISCLAIMER,
  });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return apiError(503, API_ERROR_MESSAGES.supabaseMissing, {
      code: "supabase_missing",
      disclaimer: LIA_DISCLAIMER,
    });
  }

  const current = await getCurrentUser();
  if (!current) {
    return apiError(401, API_ERROR_MESSAGES.unauthorized, {
      code: "unauthorized",
      disclaimer: LIA_DISCLAIMER,
    });
  }

  if (current.profile.is_blocked) {
    return apiError(403, API_ERROR_MESSAGES.blocked, {
      code: "blocked",
      disclaimer: LIA_DISCLAIMER,
    });
  }

  const rate = checkLiaRateLimit(current.user.id);
  if (!rate.allowed) {
    return apiError(
      429,
      `Слишком много запросов. Повторите через ${rate.retryAfterSec} сек.`,
      { code: "rate_limited", disclaimer: LIA_DISCLAIMER },
    );
  }

  let body: {
    query?: string;
    limit?: number;
    region?: string;
    category?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError(400, "Некорректный JSON.", {
      code: "bad_json",
      disclaimer: LIA_DISCLAIMER,
    });
  }

  const query = String(body.query ?? "").trim();
  if (!query) {
    return apiError(400, "Укажите query.", {
      code: "missing_query",
      disclaimer: LIA_DISCLAIMER,
    });
  }
  if (query.length > 300) {
    return apiError(400, "Запрос слишком длинный (макс. 300 символов).", {
      code: "query_too_long",
      disclaimer: LIA_DISCLAIMER,
    });
  }

  try {
    const limit = Math.min(Math.max(Number(body.limit) || 5, 1), 10);
    const { provider, results } = await runExternalSearch(query, {
      limit,
      region: body.region,
      category: body.category,
    });

    await logSystemEvent({
      source: "api.lia.search.external",
      message: "External search completed",
      metadata: {
        userId: current.user.id,
        provider,
        resultCount: results.length,
      },
    });

    return apiSuccess({
      provider,
      query,
      results: results.map((item) => ({ ...item, trusted: false })),
      disclaimer: LIA_DISCLAIMER,
      note: "Внешние результаты неподтверждены. Лия не создаёт заявки автоматически.",
    });
  } catch (error) {
    await logApiError({
      source: "api.lia.search.external",
      message: error instanceof Error ? error.message : "Search failed",
      metadata: { userId: current.user.id },
    });
    return apiError(500, API_ERROR_MESSAGES.internal, {
      code: "internal",
      disclaimer: LIA_DISCLAIMER,
    });
  }
}
