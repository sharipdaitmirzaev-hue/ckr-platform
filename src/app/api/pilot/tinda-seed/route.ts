import { API_ERROR_MESSAGES, apiError, apiSuccess } from "@/lib/errors/api";
import { applyTindaPilotSeed } from "@/lib/pilot/apply-tinda-seed";
import { logApiError, logSystemEvent } from "@/lib/logging/system-log";

/**
 * POST /api/pilot/tinda-seed
 * Заголовок: x-pilot-seed-secret: PILOT_SEED_SECRET (или DEMO_SEED_SECRET)
 */
export async function POST(request: Request) {
  const expected =
    process.env.PILOT_SEED_SECRET || process.env.DEMO_SEED_SECRET;
  const provided = request.headers.get("x-pilot-seed-secret");
  const allowInProduction =
    process.env.ALLOW_PILOT_SEED_IN_PRODUCTION === "true";

  if (process.env.NODE_ENV === "production" && !allowInProduction) {
    await logApiError({
      source: "api.pilot.tinda-seed",
      message: "TINDA pilot seed blocked in production",
    });
    return apiError(403, "Pilot seed отключён в production.", {
      code: "pilot_seed_disabled",
    });
  }

  if (!expected || provided !== expected) {
    return apiError(401, API_ERROR_MESSAGES.unauthorized, {
      code: "unauthorized",
    });
  }

  try {
    const result = await applyTindaPilotSeed();
    if (!result.ok) {
      await logApiError({
        source: "api.pilot.tinda-seed",
        message: result.message ?? "TINDA seed failed",
      });
      return apiError(400, result.message ?? "Не удалось выполнить seed.", {
        code: "seed_failed",
      });
    }

    await logSystemEvent({
      source: "api.pilot.tinda-seed",
      message: "TINDA pilot seed applied",
      level: "warning",
      metadata: result.ids ?? {},
    });

    return apiSuccess({
      message: result.message ?? "OK",
      created: result.created,
      ids: result.ids,
    });
  } catch (error) {
    await logApiError({
      source: "api.pilot.tinda-seed",
      message: error instanceof Error ? error.message : "Unknown seed error",
    });
    return apiError(500, API_ERROR_MESSAGES.internal, { code: "internal" });
  }
}

export async function GET() {
  return apiSuccess({
    message:
      "TINDA pilot seed API. POST with header x-pilot-seed-secret. В production отключён по умолчанию.",
  });
}
