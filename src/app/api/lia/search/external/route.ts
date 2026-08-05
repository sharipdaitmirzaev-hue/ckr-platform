import { LIA_DISCLAIMER } from "@/config/lia";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { checkLiaRateLimit } from "@/lib/lia/rate-limit";
import {
  getWebSearchProviderInfo,
  runExternalSearch,
} from "@/lib/lia/search";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { NextResponse } from "next/server";

/**
 * Прямой внешний поиск для Лии.
 * Только рекомендации: не создаёт заявки и не меняет данные пользователя.
 */
export async function GET() {
  const info = getWebSearchProviderInfo();
  return NextResponse.json({
    ok: true,
    provider: info,
    disclaimer: LIA_DISCLAIMER,
    resultShape: [
      "id",
      "title",
      "description",
      "url",
      "source",
      "published_at",
      "trust_score",
      "trusted",
    ],
  });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ok: false, error: "Supabase не настроен.", disclaimer: LIA_DISCLAIMER },
      { status: 503 },
    );
  }

  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json(
      {
        ok: false,
        error: "Требуется авторизация.",
        disclaimer: LIA_DISCLAIMER,
      },
      { status: 401 },
    );
  }

  if (current.profile.is_blocked) {
    return NextResponse.json(
      {
        ok: false,
        error: "Аккаунт заблокирован.",
        disclaimer: LIA_DISCLAIMER,
      },
      { status: 403 },
    );
  }

  const rate = checkLiaRateLimit(current.user.id);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Слишком много запросов. Повторите через ${rate.retryAfterSec} сек.`,
        disclaimer: LIA_DISCLAIMER,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      },
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
    return NextResponse.json(
      { ok: false, error: "Некорректный JSON.", disclaimer: LIA_DISCLAIMER },
      { status: 400 },
    );
  }

  const query = String(body.query ?? "").trim();
  if (!query) {
    return NextResponse.json(
      { ok: false, error: "Укажите query.", disclaimer: LIA_DISCLAIMER },
      { status: 400 },
    );
  }
  if (query.length > 300) {
    return NextResponse.json(
      {
        ok: false,
        error: "Запрос слишком длинный (макс. 300 символов).",
        disclaimer: LIA_DISCLAIMER,
      },
      { status: 400 },
    );
  }

  const limit = Math.min(Math.max(Number(body.limit) || 5, 1), 10);
  const { provider, results } = await runExternalSearch(query, {
    limit,
    region: body.region,
    category: body.category,
  });

  return NextResponse.json({
    ok: true,
    provider,
    query,
    results: results.map((item) => ({ ...item, trusted: false })),
    disclaimer: LIA_DISCLAIMER,
    note: "Внешние результаты неподтверждены. Лия не создаёт заявки автоматически.",
  });
}
