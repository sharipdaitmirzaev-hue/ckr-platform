import {
  AdminTable,
  type AdminTableColumn,
} from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  TASK_STATUSES,
  taskPriorityLabels,
  taskRelatedTypeLabels,
  taskStatusLabels,
} from "@/config/operator";
import { updateOperatorTaskStatusAction } from "@/features/operator/actions";
import { CreateOperatorTaskForm } from "@/features/operator/components/create-task-form";
import { listOperatorTasks } from "@/lib/operator/queries";
import type { OperatorTask } from "@/types";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Задачи — Операционный центр",
};

export const dynamic = "force-dynamic";

function priorityTone(priority: OperatorTask["priority"]) {
  if (priority === "urgent") return "danger" as const;
  if (priority === "high") return "warning" as const;
  if (priority === "medium") return "accent" as const;
  return "neutral" as const;
}

export default async function OperatorTasksPage() {
  const tasks = await listOperatorTasks();

  const columns: AdminTableColumn<OperatorTask>[] = [
    {
      key: "title",
      header: "Задача",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.title}</p>
          <p className="text-xs text-muted">
            {row.relatedType
              ? `${taskRelatedTypeLabels[row.relatedType]}${
                  row.relatedId ? ` · ${row.relatedId.slice(0, 8)}…` : ""
                }`
              : "Без связи"}
          </p>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Приоритет",
      cell: (row) => (
        <StatusBadge
          label={taskPriorityLabels[row.priority]}
          tone={priorityTone(row.priority)}
        />
      ),
    },
    {
      key: "status",
      header: "Статус",
      cell: (row) => (
        <form
          action={updateOperatorTaskStatusAction}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="taskId" value={row.id} />
          <select
            name="status"
            defaultValue={row.status}
            className="h-8 rounded-sm border border-border bg-surface px-2 text-xs"
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {taskStatusLabels[status]}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="ghost">
            OK
          </Button>
        </form>
      ),
    },
    {
      key: "assignee",
      header: "Исполнитель",
      cell: (row) => row.assigneeName || "—",
    },
    {
      key: "deadline",
      header: "Дедлайн",
      cell: (row) =>
        row.deadline ? new Date(row.deadline).toLocaleString("ru-RU") : "—",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading
          eyebrow="Операционный центр"
          title="Задачи команды"
          description="Назначение, приоритеты, связи с лидами, проектами, сделками и проверками."
        />
        <Link href="/operator" className="text-sm text-muted hover:text-accent">
          ← К обзору
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card variant="surface" className="space-y-4 p-5">
          <h2 className="font-display text-xl text-foreground">Новая задача</h2>
          <CreateOperatorTaskForm />
        </Card>
        <div className="space-y-4">
          <h2 className="font-display text-xl text-foreground">Список</h2>
          {tasks.length === 0 ? (
            <EmptyState
              title="Задач пока нет"
              description="Создайте первую задачу слева."
            />
          ) : (
            <AdminTable
              columns={columns}
              rows={tasks}
              rowKey={(row) => row.id}
            />
          )}
        </div>
      </section>
    </div>
  );
}
