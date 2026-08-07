/**
 * OperatorInsights — рекомендации Лии для операционного центра.
 * Только аналитика и подсказки; без автодействий.
 */

import { OPEN_TASK_STATUSES } from "@/config/operator";
import type { OperatorTask, SlaRule } from "@/types";

export type OperatorInsightItem = {
  id: string;
  kind: "overdue_task" | "stuck_project" | "recommendation";
  title: string;
  detail: string;
  href?: string;
};

export type OperatorInsightsResult = {
  overdueTasks: OperatorInsightItem[];
  stuckProjects: OperatorInsightItem[];
  recommendations: OperatorInsightItem[];
};

function hoursSince(iso?: string) {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export function buildOperatorInsights(input: {
  tasks: OperatorTask[];
  stuckProjects: Array<{ id: string; title: string; updatedAt?: string; status: string }>;
  unansweredApplications: number;
  pendingVerifications: number;
  newLeads: number;
  slaRules: SlaRule[];
}): OperatorInsightsResult {
  const now = Date.now();

  const overdueTasks: OperatorInsightItem[] = input.tasks
    .filter(
      (task) =>
        OPEN_TASK_STATUSES.includes(task.status) &&
        task.deadline &&
        new Date(task.deadline).getTime() < now,
    )
    .slice(0, 8)
    .map((task) => ({
      id: `task-${task.id}`,
      kind: "overdue_task" as const,
      title: task.title,
      detail: `Просрочена с ${new Date(task.deadline!).toLocaleString("ru-RU")}`,
      href: "/operator/tasks",
    }));

  const stuckProjects: OperatorInsightItem[] = input.stuckProjects
    .filter((project) => hoursSince(project.updatedAt) >= 72)
    .slice(0, 8)
    .map((project) => ({
      id: `project-${project.id}`,
      kind: "stuck_project" as const,
      title: project.title,
      detail: `Статус «${project.status}», без движения более 72 часов`,
      href: `/admin/projects`,
    }));

  const recommendations: OperatorInsightItem[] = [];
  const leadSla = input.slaRules.find(
    (rule) => rule.entityType === "lead" && rule.active,
  );
  const appSla = input.slaRules.find(
    (rule) => rule.entityType === "application" && rule.active,
  );
  const verSla = input.slaRules.find(
    (rule) => rule.entityType === "verification" && rule.active,
  );

  if (input.newLeads > 0) {
    recommendations.push({
      id: "rec-leads",
      kind: "recommendation",
      title: "Разберите новые лиды",
      detail: leadSla
        ? `${input.newLeads} новых лидов. SLA: ${leadSla.timeLimitHours} ч.`
        : `${input.newLeads} новых лидов в очереди.`,
      href: "/admin/crm?tab=leads",
    });
  }

  if (input.unansweredApplications > 0) {
    recommendations.push({
      id: "rec-apps",
      kind: "recommendation",
      title: "Ответьте на заявки",
      detail: appSla
        ? `${input.unansweredApplications} без ответа. SLA: ${appSla.timeLimitHours} ч.`
        : `${input.unansweredApplications} заявок без ответа.`,
      href: "/operator",
    });
  }

  if (input.pendingVerifications > 0) {
    recommendations.push({
      id: "rec-ver",
      kind: "recommendation",
      title: "Проверьте верификации",
      detail: verSla
        ? `${input.pendingVerifications} на проверке. SLA: ${verSla.timeLimitHours} ч.`
        : `${input.pendingVerifications} запросов на проверке.`,
      href: "/admin/verifications",
    });
  }

  if (overdueTasks.length > 0) {
    recommendations.push({
      id: "rec-overdue",
      kind: "recommendation",
      title: "Закройте просроченные задачи",
      detail: `${overdueTasks.length} задач с истёкшим сроком.`,
      href: "/operator/tasks",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "rec-ok",
      kind: "recommendation",
      title: "Очередь в порядке",
      detail: "Критичных рекомендаций нет. Можно заняться плановой работой.",
    });
  }

  return { overdueTasks, stuckProjects, recommendations };
}
