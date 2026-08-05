import { applyDemoSeed } from "@/lib/demo/apply-seed";
import { NextResponse } from "next/server";

/**
 * POST /api/demo/seed
 * Заголовок: x-demo-seed-secret: DEMO_SEED_SECRET
 * Записывает безопасные demo-данные в Supabase (service role).
 */
export async function POST(request: Request) {
  const expected = process.env.DEMO_SEED_SECRET;
  const provided = request.headers.get("x-demo-seed-secret");

  if (!expected || provided !== expected) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const result = await applyDemoSeed();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "Demo seed API. POST with header x-demo-seed-secret. Без секрета запись недоступна. Каталоги могут использовать встроенный fallback.",
  });
}
