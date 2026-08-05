import { LIA_DISCLAIMER } from "@/config/lia";
import {
  buildSolutionReport,
  formatSolutionReportText,
} from "@/lib/lia/analysis";
import { checkLiaRateLimit } from "@/lib/lia/rate-limit";
import { insertLiaAnalysis } from "@/lib/lia/queries";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getProjectById } from "@/lib/projects/queries";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { LiaAnalyzeRequest, LiaAnalyzeResponse } from "@/types/lia";
import { NextResponse } from "next/server";

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

  let body: LiaAnalyzeRequest;
  try {
    body = (await request.json()) as LiaAnalyzeRequest;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некорректный JSON.", disclaimer: LIA_DISCLAIMER },
      { status: 400 },
    );
  }

  const projectId = String(body.projectId ?? "").trim();
  if (!projectId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Укажите projectId.",
        disclaimer: LIA_DISCLAIMER,
      },
      { status: 400 },
    );
  }

  const mode = body.mode === "analyze" ? "analyze" : "find_solutions";
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json(
      { ok: false, error: "Проект не найден.", disclaimer: LIA_DISCLAIMER },
      { status: 404 },
    );
  }

  if (project.ownerId !== current.user.id) {
    return NextResponse.json(
      {
        ok: false,
        error: "Анализ доступен владельцу проекта.",
        disclaimer: LIA_DISCLAIMER,
      },
      { status: 403 },
    );
  }

  // Приватные документы в анализ/внешний поиск не передаём.
  const report = await buildSolutionReport(project, {
    includeExternal: mode === "find_solutions",
  });

  const saved = await insertLiaAnalysis({
    userId: current.user.id,
    projectId: project.id,
    report,
  });

  const response: LiaAnalyzeResponse & { reportText?: string } = {
    ok: true,
    analysisId: saved?.id,
    report,
    solutionDraft: report.solutionDraft,
    disclaimer: LIA_DISCLAIMER,
    reportText: formatSolutionReportText(report),
  };

  return NextResponse.json(response);
}
