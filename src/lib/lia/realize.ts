import { LIA_DISCLAIMER } from "@/config/lia";
import { milestoneStatusLabels } from "@/config/deals";
import {
  listDealsForProject,
  listMilestonesForProject,
} from "@/lib/deals/queries";
import { extractMissingResources } from "@/lib/lia/analysis";
import {
  searchExperts,
  searchInvestments,
  searchOpportunities,
} from "@/lib/lia/search";
import { getProjectById } from "@/lib/projects/queries";
import type { LiaResultLink } from "@/types/lia";

export type RealizeProjectResult = {
  content: string;
  results: LiaResultLink[];
  projectId: string;
  projectTitle: string;
};

/**
 * Сценарий Лии «Помоги реализовать проект».
 * Анализирует статус, незавершённые этапы, ресурсы; предлагает следующий шаг,
 * эксперта и партнёра. Не создаёт сделки и не меняет данные.
 */
export async function buildRealizeProjectGuidance(
  projectId: string,
  userId: string,
): Promise<RealizeProjectResult | { error: string }> {
  const project = await getProjectById(projectId);
  if (!project) {
    return { error: "Проект не найден." };
  }

  if (project.ownerId !== userId) {
    return {
      error:
        "Сценарий реализации доступен владельцу проекта. Откройте кабинет своего проекта.",
    };
  }

  const [milestones, deals] = await Promise.all([
    listMilestonesForProject(project.id),
    listDealsForProject(project.id),
  ]);

  const missing = extractMissingResources(project);
  const openMilestones = milestones.filter((m) => m.status !== "completed");
  const nextMilestone =
    openMilestones.find((m) => m.status === "in_progress") ||
    openMilestones.find((m) => m.status === "planned") ||
    openMilestones.find((m) => m.status === "blocked") ||
    null;

  const activeDeals = deals.filter(
    (d) => d.status === "active" || d.status === "negotiation" || d.status === "agreement",
  );

  const searchQuery = [
    project.title,
    project.region,
    project.category,
    nextMilestone?.title,
    missing.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  const [experts, investments, opportunities] = await Promise.all([
    searchExperts(searchQuery || project.title, 2),
    searchInvestments(searchQuery || project.title, 2),
    searchOpportunities(
      `${searchQuery} земля помещение оборудование`,
      2,
    ),
  ]);

  const nextStep = nextMilestone
    ? `Сфокусироваться на этапе «${nextMilestone.title}» (статус: ${milestoneStatusLabels[nextMilestone.status]}).`
    : milestones.length === 0
      ? "Создать этапы реализации в кабинете проекта (типовой план или свои задачи)."
      : "Все этапы отмечены завершёнными — проверьте запуск и документы.";

  const lines = [
    `Сопровождение проекта «${project.title}».`,
    "",
    `**Статус проекта:** ${project.status} · стадия ${project.stage}`,
    `**Регион:** ${project.region}`,
    "",
    "**Незавершённые этапы:**",
    openMilestones.length
      ? openMilestones
          .map(
            (m) =>
              `- ${m.title} — ${milestoneStatusLabels[m.status]}`,
          )
          .join("\n")
      : milestones.length === 0
        ? "- этапы ещё не созданы"
        : "- незавершённых нет",
    "",
    "**Отсутствующие ресурсы (оценка):**",
    ...missing.map((item) => `- ${item}`),
    "",
    `**Следующий шаг:** ${nextStep}`,
    "",
    activeDeals.length
      ? `**Активные сделки:** ${activeDeals.length}. Проверьте статус в кабинете.`
      : "**Сделки:** активных нет — при необходимости создайте сделку в кабинете проекта.",
    "",
    "**Возможный эксперт:**",
    experts.length
      ? experts.map((e) => `- [${e.title}](${e.href}) — ${e.summary}`).join("\n")
      : "- пока нет точных совпадений в каталоге",
    "",
    "**Возможный партнёр / ресурс:**",
    [...investments, ...opportunities].length
      ? [...investments, ...opportunities]
          .map((e) => `- [${e.title}](${e.href}) — ${e.summary}`)
          .join("\n")
      : "- уточните запрос или откройте каталоги инвестиций и возможностей",
    "",
    `[Открыть кабинет проекта](/dashboard/projects/${project.id}/workspace)`,
    "",
    "Лия только рекомендует: не создаёт сделки и не меняет этапы без вас.",
    "",
    `_${LIA_DISCLAIMER}_`,
  ];

  return {
    content: lines.join("\n"),
    results: [...experts, ...investments, ...opportunities],
    projectId: project.id,
    projectTitle: project.title,
  };
}
