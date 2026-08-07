import { API_ERROR_MESSAGES, apiError, apiSuccess } from "@/lib/errors/api";
import { applyDemoSeed } from "@/lib/demo/apply-seed";
import { logApiError, logSystemEvent } from "@/lib/logging/system-log";

/**
 * POST /api/demo/seed
 * Заголовок: x-demo-seed-secret: DEMO_SEED_SECRET
 * В production без секрета и при NODE_ENV=production + отсутствии явного разрешения — отказ.
 */
export async function POST(request: Request) {
  const expected = process.env.DEMO_SEED_SECRET;
  const provided = request.headers.get("x-demo-seed-secret");
  const allowInProduction = process.env.ALLOW_DEMO_SEED_IN_PRODUCTION === "true";

  if (process.env.NODE_ENV === "production" && !allowInProduction) {
    await logApiError({
      source: "api.demo.seed",
      message: "Demo seed blocked in production",
    });
    return apiError(403, "Demo seed отключён в production.", {
      code: "demo_seed_disabled",
    });
  }

  if (!expected || provided !== expected) {
    return apiError(401, API_ERROR_MESSAGES.unauthorized, {
      code: "unauthorized",
    });
  }

  try {
    const result = await applyDemoSeed();
    if (!result.ok) {
      await logApiError({
        source: "api.demo.seed",
        message: result.message ?? "Demo seed failed",
      });
      return apiError(400, result.message ?? "Не удалось выполнить seed.", {
        code: "seed_failed",
      });
    }

    await logSystemEvent({
      source: "api.demo.seed",
      message: "Demo seed applied",
      level: "warning",
    });

    return apiSuccess({ message: result.message ?? "OK" });
  } catch (error) {
    await logApiError({
      source: "api.demo.seed",
      message: error instanceof Error ? error.message : "Unknown seed error",
    });
    return apiError(500, API_ERROR_MESSAGES.internal, { code: "internal" });
  }
}

export async function GET() {
  return apiSuccess({
    message:
      "Demo seed API. POST with header x-demo-seed-secret. В production отключён по умолчанию.",
  });
}
