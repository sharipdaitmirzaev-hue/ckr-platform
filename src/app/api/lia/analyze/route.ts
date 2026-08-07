import { LIA_DISCLAIMER } from "@/config/lia";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { API_ERROR_MESSAGES, apiError, apiSuccess } from "@/lib/errors/api";
import {
  buildSolutionReport,
  formatSolutionReportText,
} from "@/lib/lia/analysis";
import { checkLiaRateLimit } from "@/lib/lia/rate-limit";
import { insertLiaAnalysis } from "@/lib/lia/queries";
import { logApiError, logSystemEvent } from "@/lib/logging/system-log";
import { getProjectById } from "@/lib/projects/queries";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { LiaAnalyzeRequest } from "@/types/lia";

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

  let body: LiaAnalyzeRequest;
  try {
    body = (await request.json()) as LiaAnalyzeRequest;
  } catch {
    return apiError(400, "Некорректный JSON.", {
      code: "bad_json",
      disclaimer: LIA_DISCLAIMER,
    });
  }

  const projectId = String(body.projectId ?? "").trim();
  if (!projectId) {
    return apiError(400, "Укажите projectId.", {
      code: "missing_project",
      disclaimer: LIA_DISCLAIMER,
    });
  }

  const mode = body.mode === "analyze" ? "analyze" : "find_solutions";

  try {
    const project = await getProjectById(projectId);
    if (!project) {
      return apiError(404, "Проект не найден.", {
        code: "not_found",
        disclaimer: LIA_DISCLAIMER,
      });
    }

    if (project.ownerId !== current.user.id) {
      return apiError(403, "Анализ доступен владельцу проекта.", {
        code: "forbidden",
        disclaimer: LIA_DISCLAIMER,
      });
    }

    const report = await buildSolutionReport(project, {
      includeExternal: mode === "find_solutions",
    });

    const saved = await insertLiaAnalysis({
      userId: current.user.id,
      projectId: project.id,
      report,
    });

    await logSystemEvent({
      source: "api.lia.analyze",
      message: "Project analysis completed",
      metadata: { userId: current.user.id, projectId, mode },
    });

    return apiSuccess({
      analysisId: saved?.id,
      report,
      solutionDraft: report.solutionDraft,
      disclaimer: LIA_DISCLAIMER,
      reportText: formatSolutionReportText(report),
    });
  } catch (error) {
    await logApiError({
      source: "api.lia.analyze",
      message: error instanceof Error ? error.message : "Analyze failed",
      metadata: { userId: current.user.id, projectId },
    });
    return apiError(500, API_ERROR_MESSAGES.internal, {
      code: "internal",
      disclaimer: LIA_DISCLAIMER,
    });
  }
}
