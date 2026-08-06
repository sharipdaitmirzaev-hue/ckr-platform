import { AdminTable } from "@/components/admin/admin-table";
import {
  StatusBadge,
  verificationStatusTone,
} from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { roleLabels } from "@/config/roles";
import { verificationStatusLabels } from "@/config/verification";
import { listAdminUsers } from "@/lib/admin/queries";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Админ — Пользователи" };

type UsersPageProps = {
  searchParams?: { q?: string };
};

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const q = searchParams?.q?.trim() || null;
  const users = await listAdminUsers({ q });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Админ"
        title="Пользователи"
        description="Поиск участников, роли, блокировка и статус проверки профиля."
      />

      <form className="flex flex-wrap gap-3" action="/admin/users" method="get">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Имя, компания, город, телефон"
          className="max-w-md"
        />
        <Button type="submit" variant="outline">
          Найти
        </Button>
      </form>

      <AdminTable
        rows={users}
        rowKey={(row) => row.id}
        emptyText="Пользователи не найдены."
        columns={[
          {
            key: "name",
            header: "Участник",
            cell: (row) => (
              <div>
                <p className="font-medium text-foreground">{row.fullName}</p>
                <p className="text-xs text-muted">
                  {[row.companyName, row.city].filter(Boolean).join(" · ") ||
                    "—"}
                </p>
              </div>
            ),
          },
          {
            key: "roles",
            header: "Роли",
            cell: (row) =>
              row.roles.length > 0
                ? row.roles.map((role) => roleLabels[role]).join(", ")
                : "—",
          },
          {
            key: "verification",
            header: "Проверка",
            cell: (row) => (
              <StatusBadge
                label={verificationStatusLabels[row.verificationStatus]}
                tone={verificationStatusTone(row.verificationStatus)}
              />
            ),
          },
          {
            key: "blocked",
            header: "Доступ",
            cell: (row) =>
              row.isBlocked ? (
                <StatusBadge label="Заблокирован" tone="danger" />
              ) : (
                <StatusBadge label="Активен" tone="success" />
              ),
          },
          {
            key: "actions",
            header: "",
            cell: (row) => (
              <ButtonLink
                href={`/admin/users/${row.id}`}
                size="sm"
                variant="outline"
              >
                Открыть
              </ButtonLink>
            ),
          },
        ]}
      />
    </div>
  );
}
