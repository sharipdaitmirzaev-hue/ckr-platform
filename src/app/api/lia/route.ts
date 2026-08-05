import { NextResponse } from "next/server";

/**
 * Заготовка API ИИ-навигатора Лия.
 * Будущие сценарии: создание проекта, анализ идеи, подбор ресурсов.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      assistant: "lia",
      message:
        "Лия готовится к подключению. Эндпоинт зарезервирован для ИИ-навигатора ЦКР.",
    },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    assistant: "lia",
    status: "placeholder",
    capabilities: [
      "project_creation_help",
      "idea_analysis",
      "resource_matching",
      "solution_search",
    ],
  });
}
