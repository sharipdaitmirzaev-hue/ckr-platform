import { Badge } from "@/components/ui/badge";
import { projectResultTypeLabels } from "@/config/outcomes";
import type { ProjectResult } from "@/types/outcomes";
import Link from "next/link";

type ProjectOutcomeTableProps = {
  rows: (ProjectResult & { projectTitle?: string })[];
  emptyText?: string;
};

export function ProjectOutcomeTable({
  rows,
  emptyText = "Результатов пока нет.",
}: ProjectOutcomeTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
            <th className="px-2 py-2 font-medium">Проект</th>
            <th className="px-2 py-2 font-medium">Результат</th>
            <th className="px-2 py-2 font-medium">Тип</th>
            <th className="px-2 py-2 font-medium">Значение</th>
            <th className="px-2 py-2 font-medium">Дата</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/70">
              <td className="px-2 py-3 text-foreground">
                <Link
                  href={`/dashboard/projects/${row.projectId}/workspace`}
                  className="text-accent underline-offset-2 hover:underline"
                >
                  {row.projectTitle || row.projectId.slice(0, 8)}
                </Link>
              </td>
              <td className="px-2 py-3">
                <p className="text-foreground">{row.title}</p>
                {row.description ? (
                  <p className="mt-0.5 text-xs text-muted">{row.description}</p>
                ) : null}
              </td>
              <td className="px-2 py-3">
                <Badge variant="soft">
                  {projectResultTypeLabels[row.resultType]}
                </Badge>
              </td>
              <td className="px-2 py-3 text-foreground">
                {row.value !== null
                  ? `${new Intl.NumberFormat("ru-RU").format(row.value)} ${row.unit}`.trim()
                  : "—"}
              </td>
              <td className="px-2 py-3 text-muted">
                {row.achievedAt
                  ? new Date(row.achievedAt).toLocaleDateString("ru-RU")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
