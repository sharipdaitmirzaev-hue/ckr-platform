import { LIA_DISCLAIMER, LIA_MAX_MESSAGE_LENGTH, LIA_SCENARIOS } from "@/config/lia";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { API_ERROR_MESSAGES, apiError, apiSuccess } from "@/lib/errors/api";
import { runLiaEngine } from "@/lib/lia/engine";
import { checkLiaRateLimit } from "@/lib/lia/rate-limit";
import {
  createLiaSession,
  getLiaSession,
  insertLiaMessage,
  listLiaMessages,
  touchLiaSession,
} from "@/lib/lia/queries";
import { logApiError, logSystemEvent } from "@/lib/logging/system-log";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { LiaChatRequest, LiaScenarioId } from "@/types/lia";

const SCENARIO_IDS = new Set(LIA_SCENARIOS.map((item) => item.id));

export async function GET() {
  // Без утечки provider/mockMode наружу для анонимов
  return apiSuccess({
    assistant: "lia",
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

  let body: LiaChatRequest;
  try {
    body = (await request.json()) as LiaChatRequest;
  } catch {
    return apiError(400, "Некорректный JSON.", { code: "bad_json" });
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return apiError(400, "Введите сообщение.", { code: "empty_message" });
  }

  if (message.length > LIA_MAX_MESSAGE_LENGTH) {
    return apiError(
      400,
      `Сообщение слишком длинное (макс. ${LIA_MAX_MESSAGE_LENGTH} символов).`,
      { code: "message_too_long" },
    );
  }

  const scenario =
    body.scenario && SCENARIO_IDS.has(body.scenario)
      ? (body.scenario as LiaScenarioId)
      : null;

  try {
    let sessionId = body.sessionId || null;
    if (sessionId) {
      const existing = await getLiaSession(sessionId, current.user.id);
      if (!existing) {
        return apiError(404, "Диалог не найден.", { code: "session_not_found" });
      }
    } else {
      const title = message.slice(0, 80);
      const created = await createLiaSession({
        userId: current.user.id,
        title: title || "Диалог с Лией",
      });
      if (!created) {
        await logApiError({
          source: "api.lia",
          message: "Failed to create Lia session",
          metadata: { userId: current.user.id },
        });
        return apiError(500, "Не удалось создать диалог.", {
          code: "session_create_failed",
          disclaimer: LIA_DISCLAIMER,
        });
      }
      sessionId = created.id;
    }

    const history = await listLiaMessages(sessionId);

    await insertLiaMessage({
      sessionId,
      role: "user",
      content: message,
      metadata: scenario ? { scenario } : {},
    });

    const projectId =
      typeof body.projectId === "string" && body.projectId.trim()
        ? body.projectId.trim()
        : null;

    const engine = await runLiaEngine({
      userMessage: message,
      scenario,
      history,
      projectId,
      userId: current.user.id,
    });

    const assistantMessage = await insertLiaMessage({
      sessionId,
      role: "assistant",
      content: engine.content,
      metadata: engine.metadata,
    });

    if (!assistantMessage) {
      await logApiError({
        source: "api.lia",
        message: "Failed to save Lia assistant message",
        metadata: { sessionId, userId: current.user.id },
      });
      return apiError(500, "Не удалось сохранить ответ Лии.", {
        code: "message_save_failed",
        disclaimer: LIA_DISCLAIMER,
      });
    }

    const titleSeed =
      history.length === 0 ? message.slice(0, 80) : undefined;
    await touchLiaSession(sessionId, titleSeed);

    await logSystemEvent({
      source: "api.lia",
      message: "Lia chat completed",
      metadata: {
        userId: current.user.id,
        sessionId,
        scenario,
      },
    });

    const { trackPilotMetric } = await import("@/lib/pilot/track");
    await trackPilotMetric({
      eventType: "lia_used",
      userId: current.user.id,
      entityType: "lia_session",
      entityId: sessionId,
      metadata: { scenario, projectId },
    });

    return apiSuccess({
      sessionId,
      assistantMessage,
      results: engine.results,
      projectDraft: engine.projectDraft,
      solutionDraft: engine.solutionDraft,
      catalogDraft: engine.catalogDraft,
      disclaimer: LIA_DISCLAIMER,
    });
  } catch (error) {
    await logApiError({
      source: "api.lia",
      message: error instanceof Error ? error.message : "Unknown Lia error",
      metadata: { userId: current.user.id },
    });
    return apiError(500, API_ERROR_MESSAGES.internal, {
      code: "internal",
      disclaimer: LIA_DISCLAIMER,
    });
  }
}
