import { listActivityFeed } from "@/lib/activity/queries";
import {
  listDealsForProject,
  listMilestonesForProject,
} from "@/lib/deals/queries";
import { countUnreadNotifications } from "@/lib/notifications/queries";
import { listMyConversations } from "@/lib/messages/queries";
import { listMyProjects } from "@/lib/projects/queries";
import { milestoneStatusLabels } from "@/config/deals";

export type LiaRecommendation = {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: "high" | "medium" | "low";
};

/**
 * Блок «Мои рекомендации» для Лии / кабинета.
 * Только подсказки — без автодействий.
 */
export async function buildLiaRecommendations(
  userId: string,
): Promise<LiaRecommendation[]> {
  const [unread, activity, projects, conversations] = await Promise.all([
    countUnreadNotifications(userId),
    listActivityFeed(userId, 8),
    listMyProjects(userId),
    listMyConversations(userId),
  ]);

  const items: LiaRecommendation[] = [];

  if (unread > 0) {
    items.push({
      id: "unread-notifications",
      title: `Новые события: ${unread}`,
      description: "Просмотрите уведомления — заявки, сообщения и обновления.",
      href: "/dashboard/notifications",
      priority: "high",
    });
  }

  if (conversations.some((c) => c.lastMessage)) {
    items.push({
      id: "open-messages",
      title: "Есть активные диалоги",
      description: "Ответьте партнёрам в центре сообщений.",
      href: "/messages",
      priority: "high",
    });
  }

  for (const project of projects.slice(0, 4)) {
    if (project.status === "draft") {
      items.push({
        id: `draft-${project.id}`,
        title: `Дополнить проект «${project.title}»`,
        description: "Черновик ждёт описания и публикации.",
        href: `/dashboard/projects/${project.id}/edit`,
        priority: "medium",
      });
    }

    const [milestones, deals] = await Promise.all([
      listMilestonesForProject(project.id),
      listDealsForProject(project.id),
    ]);

    const next = milestones.find(
      (m) => m.status === "in_progress" || m.status === "planned",
    );
    if (next) {
      items.push({
        id: `milestone-${next.id}`,
        title: `Следующий шаг: ${next.title}`,
        description: `Этап «${next.title}» — ${milestoneStatusLabels[next.status]}.`,
        href: `/dashboard/projects/${project.id}/workspace`,
        priority: next.status === "in_progress" ? "high" : "medium",
      });
    } else if (milestones.length === 0 && project.status !== "archived") {
      items.push({
        id: `seed-${project.id}`,
        title: `Спланировать реализацию «${project.title}»`,
        description: "Создайте этапы в кабинете проекта.",
        href: `/dashboard/projects/${project.id}/workspace`,
        priority: "medium",
      });
    }

    if (deals.length === 0 && project.status === "published") {
      items.push({
        id: `deal-${project.id}`,
        title: `Оформить сделку по «${project.title}»`,
        description: "Переведите найденное решение в сопровождение.",
        href: `/dashboard/projects/${project.id}/workspace`,
        priority: "low",
      });
    }
  }

  if (activity[0]) {
    items.push({
      id: `activity-${activity[0].id}`,
      title: "Последнее событие",
      description: activity[0].description,
      href: activity[0].projectId
        ? `/dashboard/projects/${activity[0].projectId}/workspace`
        : "/dashboard/activity",
      priority: "low",
    });
  }

  if (items.length === 0) {
    items.push({
      id: "start-lia",
      title: "Начните с Лии",
      description:
        "Создайте проект или соберите комплексное решение через ИИ-навигатор.",
      href: "/lia",
      priority: "medium",
    });
  }

  // Deduplicate by id, keep top 6 by priority
  const priorityRank = { high: 0, medium: 1, low: 2 };
  const unique = Array.from(new Map(items.map((i) => [i.id, i])).values());
  return unique
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, 6);
}
