import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type AdminTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

type AdminTableProps<T> = {
  columns: AdminTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyText?: string;
  className?: string;
};

export function AdminTable<T>({
  columns,
  rows,
  rowKey,
  emptyText = "Записей нет.",
  className,
}: AdminTableProps<T>) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-sm border border-border",
        className,
      )}
    >
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-surface">
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-muted",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-border/80 last:border-0 hover:bg-foreground/[0.02]"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-4 py-3 align-middle text-foreground",
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
