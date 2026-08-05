import { LIA_DISCLAIMER, LIA_MAX_MESSAGE_LENGTH, LIA_SCENARIOS } from "@/config/lia";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { runLiaEngine } from "@/lib/lia/engine";
import { checkLiaRateLimit } from "@/lib/lia/rate-limit";
import {
  createLiaSession,
  getLiaSession,
  insertLiaMessage,
  listLiaMessages,
  touchLiaSession,
} from "@/lib/lia/queries";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { LiaChatRequest, LiaScenarioId } from "@/types/lia";
import { NextResponse } from "next/server";

const SCENARIO_IDS = new Set(LIA_SCENARIOS.map((item) => item.id));

export async function GET() {
  return NextResponse.json({
    ok: true,
    assistant: "lia",
    status: "ready",
    provider: process.env.LIA_PROVIDER || "mock",
    mockMode: !process.env.LIA_API_KEY,
    capabilities: [
      "project_creation_help",
      "investment_search",
      "opportunity_search",
      "expert_search",
      "solution_draft",
      "project_analysis",
      "internal_search",
      "external_search",
      "external_search_providers",
      "solution_report",
      "realize_project",
      "dialog_sessions",
    ],
    disclaimer: LIA_DISCLAIMER,
  });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { ok: false, error: "Supabase не настроен." },
      { status: 503 },
    );
  }

  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json(
      { ok: false, error: "Требуется авторизация." },
      { status: 401 },
    );
  }

  if (current.profile.is_blocked) {
    return NextResponse.json(
      { ok: false, error: "Аккаунт заблокирован." },
      { status: 403 },
    );
  }

  const rate = checkLiaRateLimit(current.user.id);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Слишком много запросов. Повторите через ${rate.retryAfterSec} сек.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      },
    );
  }

  let body: LiaChatRequest;
  try {
    body = (await request.json()) as LiaChatRequest;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некорректный JSON." },
      { status: 400 },
    );
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return NextResponse.json(
      { ok: false, error: "Введите сообщение." },
      { status: 400 },
    );
  }

  if (message.length > LIA_MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      {
        ok: false,
        error: `Сообщение слишком длинное (макс. ${LIA_MAX_MESSAGE_LENGTH} символов).`,
      },
      { status: 400 },
    );
  }

  const scenario =
    body.scenario && SCENARIO_IDS.has(body.scenario)
      ? (body.scenario as LiaScenarioId)
      : null;

  let sessionId = body.sessionId || null;
  if (sessionId) {
    const existing = await getLiaSession(sessionId, current.user.id);
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Диалог не найден." },
        { status: 404 },
      );
    }
  } else {
    const title = message.slice(0, 80);
    const created = await createLiaSession({
      userId: current.user.id,
      title: title || "Диалог с Лией",
    });
    if (!created) {
      return NextResponse.json(
        { ok: false, error: "Не удалось создать диалог. Примените миграцию Лии." },
        { status: 500 },
      );
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
    return NextResponse.json(
      { ok: false, error: "Не удалось сохранить ответ Лии." },
      { status: 500 },
    );
  }

  const titleSeed =
    history.length === 0 ? message.slice(0, 80) : undefined;
  await touchLiaSession(sessionId, titleSeed);

  return NextResponse.json({
    ok: true,
    sessionId,
    assistantMessage,
    results: engine.results,
    projectDraft: engine.projectDraft,
    solutionDraft: engine.solutionDraft,
    catalogDraft: engine.catalogDraft,
    disclaimer: LIA_DISCLAIMER,
  });
}
