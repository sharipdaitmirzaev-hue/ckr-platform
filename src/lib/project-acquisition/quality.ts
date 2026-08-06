/**
 * ProjectQualityScore — рекомендательная оценка качества карточки проекта.
 * Не блокирует публикацию.
 */

import type { ProjectRow } from "@/types/database";

export type ProjectQualityDimension = {
  id: string;
  label: string;
  score: number;
  max: number;
  hint: string;
};

export type ProjectQualityScore = {
  projectId: string;
  title: string;
  total: number;
  maxTotal: number;
  pct: number;
  level: "low" | "medium" | "high";
  dimensions: ProjectQualityDimension[];
  recommendations: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function levelFromPct(pct: number): ProjectQualityScore["level"] {
  if (pct >= 75) return "high";
  if (pct >= 45) return "medium";
  return "low";
}

/**
 * Оценка по полям проекта. Только рекомендация.
 */
export function computeProjectQualityScore(
  project: Pick<
    ProjectRow,
    | "id"
    | "title"
    | "summary"
    | "description"
    | "category"
    | "region"
    | "investment_required"
    | "stage"
    | "status"
    | "verification_status"
  >,
): ProjectQualityScore {
  const summary = (project.summary ?? "").trim();
  const description = (project.description ?? "").trim();
  const title = (project.title ?? "").trim();
  const region = (project.region ?? "").trim();
  const category = (project.category ?? "").trim();
  const stage = (project.stage ?? "").trim();
  const investment = Number(project.investment_required ?? 0);

  const text = `${summary}\n${description}`.toLowerCase();

  const completenessParts = [
    title.length >= 5 ? 4 : title.length > 0 ? 2 : 0,
    summary.length >= 40 ? 4 : summary.length >= 20 ? 2 : 0,
    description.length >= 120 ? 4 : description.length >= 40 ? 2 : 0,
    category ? 2 : 0,
    region ? 2 : 0,
  ];
  const completeness = clamp(
    completenessParts.reduce((a, b) => a + b, 0),
    0,
    16,
  );

  const hasGoal =
    /цел[ьи]|достич|вырасти|масштаб|запуск|kpi|результат/.test(text) ||
    summary.length >= 60;
  const goalScore = hasGoal ? 12 : summary.length >= 20 ? 6 : 0;

  const hasProblem =
    /проблем|огранич|риск|боль|нехват|узк|барьер|сложност/.test(text);
  const problemScore = hasProblem ? 12 : description.length >= 80 ? 5 : 0;

  const hasResources =
    investment > 0 ||
    /ресурс|инвестиц|команд|партн|эксперт|помещен|земел|капитал|требуется/.test(
      text,
    );
  const resourcesScore = hasResources ? (investment > 0 ? 12 : 8) : 0;

  const ownerReady =
    project.verification_status === "verified"
      ? 12
      : project.verification_status === "pending"
        ? 7
        : project.status === "published" || project.status === "active"
          ? 8
          : project.status === "moderation"
            ? 6
            : 3;

  const stageScore =
    stage === "operating" || stage === "expansion"
      ? 12
      : stage === "startup"
        ? 9
        : stage === "idea"
          ? 6
          : 0;

  const dimensions: ProjectQualityDimension[] = [
    {
      id: "completeness",
      label: "Заполненность",
      score: completeness,
      max: 16,
      hint: "Название, summary, описание, категория, регион",
    },
    {
      id: "goal",
      label: "Наличие цели",
      score: goalScore,
      max: 12,
      hint: "Явная цель развития в тексте",
    },
    {
      id: "problem",
      label: "Описание проблемы",
      score: problemScore,
      max: 12,
      hint: "Ограничения и барьеры роста",
    },
    {
      id: "resources",
      label: "Необходимые ресурсы",
      score: resourcesScore,
      max: 12,
      hint: "Инвестиции / ресурсы / потребности",
    },
    {
      id: "owner_readiness",
      label: "Готовность владельца",
      score: ownerReady,
      max: 12,
      hint: "Верификация и статус карточки",
    },
    {
      id: "stage",
      label: "Стадия",
      score: stageScore,
      max: 12,
      hint: "idea / startup / operating / expansion",
    },
  ];

  const total = dimensions.reduce((s, d) => s + d.score, 0);
  const maxTotal = dimensions.reduce((s, d) => s + d.max, 0);
  const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 1000) / 10 : 0;

  const recommendations: string[] = [];
  if (completeness < 12) {
    recommendations.push("Дополнить summary и описание (цель, контекст, регион)");
  }
  if (goalScore < 12) {
    recommendations.push("Сформулировать измеримую цель на 6–12 месяцев");
  }
  if (problemScore < 12) {
    recommendations.push("Описать ключевую проблему / ограничение роста");
  }
  if (resourcesScore < 8) {
    recommendations.push("Указать необходимые ресурсы или сумму инвестиций");
  }
  if (ownerReady < 8) {
    recommendations.push("Пройти верификацию профиля владельца");
  }
  if (stageScore < 9) {
    recommendations.push("Уточнить стадию бизнеса для подбора решений ЦКР");
  }
  if (recommendations.length === 0) {
    recommendations.push("Качество достаточное для публикации и поиска партнёров");
  }

  return {
    projectId: project.id,
    title: title || "Без названия",
    total,
    maxTotal,
    pct,
    level: levelFromPct(pct),
    dimensions,
    recommendations,
  };
}
